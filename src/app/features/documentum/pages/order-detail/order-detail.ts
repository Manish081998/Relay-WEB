import {
  ChangeDetectionStrategy, Component,
  DestroyRef, ElementRef, inject, input, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, timeout } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { SalesOrderDocumentService } from '../../services/sales-order-document.service';
import { SalesOrderNoteService } from '../../services/sales-order-note.service';
import { OrderItem } from '../../models/order.model';
import {
  SalesOrderDocumentDto,
  SalesOrderDocumentVersionDto,
} from '../../models/document.model';
import { SalesOrderNoteDto } from '../../models/note.model';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  providers: [SalesOrderDocumentService, SalesOrderNoteService],
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly docService = inject(SalesOrderDocumentService);
  private readonly noteService = inject(SalesOrderNoteService);
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

  readonly workflowHistory = [
    { activityName: 'Initiate', comments: 'Creation of Sales Order Package', userName: 'swaney.sales', timestamp: '10/13/24 09:02 am', eventType: 'Creation', orderStatus: 'Order Initiated' },
    { activityName: 'Release to Production', comments: 'ccarfwja acquired task for final production release', userName: 'ccarfwja', timestamp: '12/22/25 06:42 pm', eventType: 'Acquire', orderStatus: '' },
  ];

  // ── Document Management (API-driven) ─────────────────────────────────────
  readonly salesOrderDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly supportDocs = signal<SalesOrderDocumentDto[]>([]);

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
          },
          error: () => {
            this.isLoadingOrder.set(false);
          },
        });
    } else {
      this.isLoadingOrder.set(false);
    }
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
          this.openPreview(versions[0].documentPath, doc.mimeType);
        }
      });
  }

  previewVersion(version: SalesOrderDocumentVersionDto): void {
    this.openPreview(version.documentPath, version.mimeType);
  }

  private openPreview(documentPath: string, mimeType: string): void {
    this.docService.getPreviewBlob(documentPath)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
          window.open(url, '_blank');
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
        this.notes.set(notes);
        this.isLoadingNotes.set(false);
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
          this.showAddNoteDialog.set(false);
          this.newNoteText.set('');
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
