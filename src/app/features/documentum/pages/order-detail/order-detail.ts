import {
  ChangeDetectionStrategy, Component, computed,
  DestroyRef, ElementRef, inject, input, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, timeout } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { WorkflowService } from '../../services/workflow.service';
import { SalesOrderDocumentService } from '../../services/sales-order-document.service';
import { SalesOrderNoteService } from '../../services/sales-order-note.service';
import { OrderItem } from '../../models/order.model';
import { WorkflowHistoryItem } from '../../models/workflow.model';
import {
  SalesOrderDocumentDto,
  SalesOrderDocumentVersionDto,
} from '../../models/document.model';
import { SalesOrderNoteDto } from '../../models/note.model';
import { AnnotationDialogComponent } from '../../components/annotation-dialog/annotation-dialog.component';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnotationDialogComponent, Dialog, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  providers: [SalesOrderDocumentService, SalesOrderNoteService, WorkflowService],
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly docService = inject(SalesOrderDocumentService);
  private readonly noteService = inject(SalesOrderNoteService);
  private readonly workflowService = inject(WorkflowService);
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderGuid = input<string>('');
  readonly activeTab = signal<'documents' | 'logs'>('documents');

  readonly orderSeq = toSignal(
    this.route.queryParamMap.pipe(map(p => Number(p.get('orderSeq')) || 0)),
    { initialValue: 0 },
  );

  // ── Order data ───────────────────────────────────────────────────────────
  readonly order = signal<OrderItem | null>(null);
  readonly isLoadingOrder = signal(true);

  readonly packageInfo = {
    salesOrderNumber: '',
    purchaseOrderNumber: '',
    accountNumber: '',
    repName: '',
    jobName: '',
    brand: '',
    priority: '',
    productType: '',
    region: '',
    captureDate: '',
    completionDate: '',
    status: '',
    queueOwner: '',
    subBrand: '',
  };

  // ── Notes (API-driven) ────────────────────────────────────────────────────
  readonly notes = signal<SalesOrderNoteDto[]>([]);
  readonly isLoadingNotes = signal(false);

  // Add Note dialog
  readonly showAddNoteDialog = signal(false);
  readonly newNoteText = signal('');
  readonly isSavingNote = signal(false);

  // ── Chat UI support ────────────────────────────────────────────────────────
  readonly chatMessagesEl = viewChild<ElementRef<HTMLElement>>('chatMessages');

  readonly currentUserGlobalId = computed(() => this.auth.currentUser()?.globalId?.toLowerCase() ?? '');
  readonly currentUserInitial = computed(() => {
    const u = this.auth.currentUser();
    return (u?.displayName || u?.email || '?').charAt(0).toUpperCase();
  });

  /** Check if a note was created by the current user */
  isMyNote(createdBy: string): boolean {
    return createdBy?.toLowerCase() === this.currentUserGlobalId();
  }

  /** Assign a consistent color index (0–5) per unique user for note avatars */
  private readonly userColorMap = new Map<string, number>();
  private nextColorIndex = 0;

  getNoteColorIndex(createdBy: string): number {
    const key = (createdBy ?? '').toLowerCase();
    if (!this.userColorMap.has(key)) {
      this.userColorMap.set(key, this.nextColorIndex % 6);
      this.nextColorIndex++;
    }
    return this.userColorMap.get(key)!;
  }

  // ── Sales Order Docs pagination ───────────────────────────────────────────
  readonly soDocsPage = signal(1);
  readonly soDocsPageSize = 5;
  readonly soDocsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.salesOrderDocs().length / this.soDocsPageSize)),
  );
  readonly pagedSoDocsDocs = computed(() => {
    const all = this.salesOrderDocs();
    const start = (this.soDocsPage() - 1) * this.soDocsPageSize;
    return all.slice(start, start + this.soDocsPageSize);
  });

  // ── Support Docs pagination ───────────────────────────────────────────────
  readonly supportDocsPage = signal(1);
  readonly supportDocsPageSize = 5;
  readonly supportDocsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.supportDocs().length / this.supportDocsPageSize)),
  );
  readonly pagedSupportDocs = computed(() => {
    const all = this.supportDocs();
    const start = (this.supportDocsPage() - 1) * this.supportDocsPageSize;
    return all.slice(start, start + this.supportDocsPageSize);
  });

  readonly workflowHistory = signal<WorkflowHistoryItem[]>([]);
  readonly historyPage = signal(1);
  readonly historyPageSize = 5;
  readonly historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.workflowHistory().length / this.historyPageSize)),
  );
  readonly pagedHistory = computed(() => {
    const all = this.workflowHistory();
    const start = (this.historyPage() - 1) * this.historyPageSize;
    return all.slice(start, start + this.historyPageSize);
  });

  // ── Annotation dialog (read-only preview on this page) ────────────────────
  readonly showAnnotationDialog = signal(false);
  readonly annotationFile = signal<File | null>(null);
  readonly annotationDocName = signal('');

  // ── Document Management (API-driven) ─────────────────────────────────────
  readonly salesOrderDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly supportDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly totalDocCount = computed(() => this.salesOrderDocs().length + this.supportDocs().length);

  // Version history dialog
  readonly showVersionPanel = signal(false);
  readonly versionPanelDocId = signal<number | null>(null);
  readonly versionPanelDocName = signal('');
  readonly documentVersions = signal<SalesOrderDocumentVersionDto[]>([]);
  readonly isLoadingVersions = signal(false);

  constructor() {
    const seq = this.orderSeq();
    if (seq > 0) {
      this.ordersService.getByOrderSeq(seq)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (order) => {
            this.order.set(order);
            this.isLoadingOrder.set(false);
            this.updatePackageInfo(order);
            this.loadDocuments(order.orderSeq);
            this.loadNotes(order.orderSeq);
            this.loadWorkflowHistory(order.orderSeq);
          },
          error: () => {
            this.isLoadingOrder.set(false);
          },
        });
    } else {
      this.isLoadingOrder.set(false);
    }
  }

  private loadWorkflowHistory(orderSeq: number): void {
    this.workflowService.getHistory(orderSeq)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('loadWorkflowHistory error:', err); return of([] as WorkflowHistoryItem[]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(history => this.workflowHistory.set(history));
  }

  goToHistoryPage(page: number): void {
    if (page < 1 || page > this.historyTotalPages()) return;
    this.historyPage.set(page);
  }

  goToSoDocsPage(page: number): void {
    if (page < 1 || page > this.soDocsTotalPages()) return;
    this.soDocsPage.set(page);
  }

  goToSupportDocsPage(page: number): void {
    if (page < 1 || page > this.supportDocsTotalPages()) return;
    this.supportDocsPage.set(page);
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatMessagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private updatePackageInfo(o: OrderItem): void {
    this.packageInfo.salesOrderNumber = o.salesOrderNumber ?? '';
    this.packageInfo.purchaseOrderNumber = o.repPO ?? '';
    this.packageInfo.accountNumber = o.accountNumber ?? '';
    this.packageInfo.repName = o.repName ?? '';
    this.packageInfo.jobName = o.jobName ?? '';
    this.packageInfo.brand = o.brand ?? '';
    this.packageInfo.priority = o.priority ?? '';
    this.packageInfo.productType = o.productType ?? '';
    this.packageInfo.region = o.region ?? '';
    this.packageInfo.captureDate = o.createdDate ?? '';
    this.packageInfo.completionDate = o.completionDate ?? '';
    this.packageInfo.status = o.status ?? '';
    this.packageInfo.queueOwner = o.packageOwner ?? '';
  }

  // ── Document loading ─────────────────────────────────────────────────────

  loadDocuments(orderSeq?: number): void {
    const seq = orderSeq ?? this.order()?.orderSeq;
    if (!seq || seq <= 0) return;

    this.docService.getByOrderSeq(seq, false)
      .pipe(
        timeout(15000),
        catchError(() => of([] as SalesOrderDocumentDto[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(docs => this.salesOrderDocs.set(docs));

    this.docService.getByOrderSeq(seq, true)
      .pipe(
        timeout(15000),
        catchError(() => of([] as SalesOrderDocumentDto[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(docs => this.supportDocs.set(docs));
  }

  // ── Preview ──────────────────────────────────────────────────────────────

  previewDocument(doc: SalesOrderDocumentDto): void {
    this.docService.getVersions(doc.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(versions => {
        if (versions.length > 0) {
          this.openBlobPreview(versions[0].documentPath, doc.documentName, doc.mimeType);
        }
      });
  }

  previewVersion(version: SalesOrderDocumentVersionDto): void {
    this.openBlobPreview(version.documentPath, `Version ${version.versionNumber}`, version.mimeType);
  }

  private openBlobPreview(documentPath: string, title: string, mimeType: string): void {
    this.docService.getPreviewBlob(documentPath)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const fileName = documentPath.split('/').pop() ?? 'document';
          const file = new File([blob], fileName, { type: mimeType });
          this.annotationFile.set(file);
          this.annotationDocName.set(title);
          this.showAnnotationDialog.set(true);
        },
        error: (err) => console.error('Failed to load document preview:', err),
      });
  }

  // ── Version history ──────────────────────────────────────────────────────

  showVersions(doc: SalesOrderDocumentDto): void {
    this.versionPanelDocId.set(doc.documentId);
    this.versionPanelDocName.set(doc.documentName);
    this.showVersionPanel.set(true);
    this.isLoadingVersions.set(true);

    this.docService.getVersions(doc.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (versions) => {
          this.documentVersions.set(versions);
          this.isLoadingVersions.set(false);
        },
        error: () => {
          this.isLoadingVersions.set(false);
        },
      });
  }

  closeVersionPanel(): void {
    this.showVersionPanel.set(false);
    this.versionPanelDocId.set(null);
    this.documentVersions.set([]);
  }

  // ── Notes ────────────────────────────────────────────────────────────────

  loadNotes(orderSeq?: number): void {
    const seq = orderSeq ?? this.order()?.orderSeq;
    if (!seq || seq <= 0) return;

    this.isLoadingNotes.set(true);

    this.noteService.getByOrderSeq(seq)
      .pipe(
        timeout(15000),
        catchError(() => of([] as SalesOrderNoteDto[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(notes => {
        // Sort oldest → newest (latest at bottom, chat order)
        const sorted = [...notes].sort((a, b) =>
          new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        );
        this.notes.set(sorted);
        this.isLoadingNotes.set(false);
        this.scrollChatToBottom();
      });
  }

  openAddNoteDialog(): void {
    this.newNoteText.set('');
    this.showAddNoteDialog.set(true);
  }

  closeAddNoteDialog(): void {
    this.showAddNoteDialog.set(false);
    this.newNoteText.set('');
  }

  saveNote(): void {
    const text = this.newNoteText().trim();
    const seq = this.order()?.orderSeq;
    if (!text || !seq) return;

    this.isSavingNote.set(true);

    this.noteService.add({ orderSeq: seq, notesDescription: text })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSavingNote.set(false);
          this.newNoteText.set('');
          this.showAddNoteDialog.set(false);
          this.loadNotes(seq);
        },
        error: (err) => {
          console.error('Save note error:', err);
          this.isSavingNote.set(false);
        },
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  setTab(tab: 'documents' | 'logs'): void {
    this.activeTab.set(tab);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileTypeClass(contentType: string): string {
    const t = (contentType || '').toLowerCase();
    if (t === 'pdf') return 'pdf';
    if (t === 'word' || t === 'doc' || t === 'docx') return 'word';
    if (t === 'excel' || t === 'xls' || t === 'xlsx') return 'excel';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'tiff', 'tif', 'image'].includes(t)) return 'image';
    if (t === 'txt' || t === 'text') return 'text';
    return 'generic';
  }

  goBack(): void {
    this.router.navigate(['/documentum/search']);
  }
}
