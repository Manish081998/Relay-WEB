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
import { SalesOrderDocumentService } from '../../services/sales-order-document.service';
import { DropdownOption, OrderItem } from '../../models/order.model';
import {
  SalesOrderDocumentDto,
  SalesOrderDocumentVersionDto,
} from '../../models/document.model';
import { AnnotationDialogComponent } from '../../components/annotation-dialog/annotation-dialog.component';
import { Dialog } from 'primeng/dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { invalidateCache } from '../../../../core/interceptors/cache.interceptor';

@Component({
  selector: 'app-workflow-information',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnotationDialogComponent, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-information.html',
  styleUrl: './workflow-information.scss',
  providers: [SalesOrderDocumentService],
})
export class WorkflowInformation {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly docService = inject(SalesOrderDocumentService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderGuid = input<string>('');
  readonly activeTab = signal<'info' | 'documents' | 'history'>('info');

  readonly orderSeq = toSignal(
    this.route.queryParamMap.pipe(map(p => Number(p.get('so')) || 0)),
    { initialValue: 0 },
  );

  // ── Order data fetched from API ──────────────────────────────────────────
  readonly order = signal<OrderItem | null>(null);
  readonly isLoadingOrder = signal(true);

  // ── Route To Department dropdown ──────────────────────────────────────────
  readonly routeToDepartmentQueues = signal<DropdownOption[]>([]);
  readonly selectedRouteTo = signal<string>('');

  readonly workflow = {
    queueName: 'Release to Production',
    state: 'Dormant',
    startedOn: '12/22/25',
  };

  readonly salesOrders = [
    { name: 'SS24-289_10-13-2024_12-18-50.pdf', createdOn: '10/13/24 09:48 pm', createdBy: 'asc_order_load' },
  ];

  readonly supportDocuments: { name: string; createdOn: string; createdBy: string }[] = [];

  readonly workflowHistory = [
    { activityName: 'Initiate', comments: 'Creation of Sales Order Package', userName: 'swaney.sales', timestamp: '10/13/24 09:02 am', eventType: 'Creation', orderStatus: 'Order Initiated' },
    { activityName: 'Release to Production', comments: 'ccarfwja acquired task for final production release', userName: 'ccarfwja', timestamp: '12/22/25 06:42 pm', eventType: 'Acquire', orderStatus: '' },
  ];

  readonly salesOrderHistory = [
    { name: '18T109JB3G 1-14-2020_093800.pdf', createdOn: '01/14/20 09:38 pm', createdBy: 'asc_order_load', versionLabel: 'CURRENT' },
  ];

  readonly notes = signal([
    { createdOn: '12/22/25 06:42 pm', userName: 'ccarfwja', note: '113.62 1' },
  ]);

  // ── Add Note panel ────────────────────────────────────────────────────────
  readonly showNotePanel = signal(false);
  readonly newNoteText = signal('');
  readonly isSavingNote = signal(false);
  readonly noteTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('noteTextarea');

  // ── Document Management ───────────────────────────────────────────────────
  readonly salesOrderDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly supportDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  // Version history panel
  readonly showVersionPanel = signal(false);
  readonly versionPanelDocId = signal<number | null>(null);
  readonly versionPanelDocName = signal('');
  readonly documentVersions = signal<SalesOrderDocumentVersionDto[]>([]);
  readonly isLoadingVersions = signal(false);

  // Hidden file input references
  readonly salesOrderFileInput = viewChild<ElementRef<HTMLInputElement>>('salesOrderFileInput');
  readonly supportDocFileInput = viewChild<ElementRef<HTMLInputElement>>('supportDocFileInput');
  readonly versionFileInput = viewChild<ElementRef<HTMLInputElement>>('versionFileInput');

  // Annotation dialog
  readonly showAnnotationDialog = signal(false);
  readonly annotationFileUrl = signal<string | null>(null);
  readonly annotationFile = signal<File | null>(null);
  readonly annotationDocName = signal('');
  readonly annotationMode = signal<'view' | 'upload'>('view');
  private annotationDocId: number | null = null;
  private annotationOriginalName = '';
  private annotationMimeType = '';
  private annotationIsSupportDoc = false;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const stateOrder = nav?.extras?.state?.['order'] as OrderItem | undefined;

    if (stateOrder) {
      this.order.set(stateOrder);
      this.isLoadingOrder.set(false);
      this.loadRouteToDepartment(stateOrder.brand);
      this.loadDocuments(stateOrder.orderSeq);
    } else {
      const seq = this.orderSeq();
      if (seq > 0) {
        this.ordersService.getByOrderSeq(seq)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (order) => {
              this.order.set(order);
              this.isLoadingOrder.set(false);
              this.loadRouteToDepartment(order.brand);
              this.loadDocuments(order.orderSeq);
            },
            error: () => {
              this.isLoadingOrder.set(false);
            },
          });
      } else {
        this.isLoadingOrder.set(false);
      }
    }
  }

  private loadRouteToDepartment(brand: string | undefined): void {
    if (brand) {
      this.ordersService.getRouteToDepartment(brand)
        .pipe(
          timeout(15000),
          catchError((err) => { console.error('loadRouteToDepartment error:', err); return of([]); }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(queues => this.routeToDepartmentQueues.set(queues));
    }
  }

  setTab(tab: 'info' | 'documents' | 'history'): void {
    this.activeTab.set(tab);
  }

  // ── Notes methods ─────────────────────────────────────────────────────────

  toggleNotePanel(): void {
    const opening = !this.showNotePanel();
    this.showNotePanel.set(opening);
    if (opening) {
      this.newNoteText.set('');
      setTimeout(() => this.noteTextarea()?.nativeElement.focus(), 50);
    }
  }

  saveNote(): void {
    const text = this.newNoteText().trim();
    if (!text) return;

    this.isSavingNote.set(true);

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const h12 = hours % 12 || 12;
    const timestamp = `${month}/${day}/${year} ${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;

    const newNote = {
      createdOn: timestamp,
      userName: 'current_user',
      note: text,
    };

    this.notes.update(prev => [newNote, ...prev]);
    this.newNoteText.set('');
    this.isSavingNote.set(false);
    this.showNotePanel.set(false);
  }

  cancelNote(): void {
    this.newNoteText.set('');
    this.showNotePanel.set(false);
  }

  // ── Document methods ──────────────────────────────────────────────────────

  loadDocuments(orderSeq?: number): void {
    const seq = orderSeq ?? this.order()?.orderSeq;
    if (!seq || seq <= 0) return;

    // Clear cached GET responses so we fetch fresh data from the API
    invalidateCache();

    this.docService.getByOrderSeq(seq, false)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('loadDocuments (sales order) error:', err); return of([] as SalesOrderDocumentDto[]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(docs => this.salesOrderDocs.set(docs));

    this.docService.getByOrderSeq(seq, true)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('loadDocuments (support) error:', err); return of([] as SalesOrderDocumentDto[]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(docs => this.supportDocs.set(docs));
  }

  triggerUpload(isSupportDoc: boolean): void {
    const input = isSupportDoc
      ? this.supportDocFileInput()?.nativeElement
      : this.salesOrderFileInput()?.nativeElement;
    input?.click();
  }

  openAnnotationForNewUpload(isSupportDoc: boolean): void {
    this.annotationDocId = null;
    this.annotationOriginalName = '';
    this.annotationMimeType = '';
    this.annotationIsSupportDoc = isSupportDoc;
    this.annotationFile.set(null);
    this.annotationFileUrl.set(null);
    this.annotationDocName.set(isSupportDoc ? 'Import Support Document' : 'Import Sales Order');
    this.annotationMode.set('upload');
    this.showAnnotationDialog.set(true);
  }

  onFileSelected(event: Event, isSupportDoc: boolean): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const o = this.order();
    if (!file || !o) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.docService.upload(o.orderSeq, file, isSupportDoc, o.repPO, o.brand)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUploading.set(false);
          this.loadDocuments();
          this.notify.success('Document uploaded successfully.', 'Upload Complete');
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.isUploading.set(false);
          const body = err?.error;
          const msg = typeof body === 'string' ? body
            : body?.message ?? body?.title ?? err?.message ?? 'Upload failed.';
          this.uploadError.set(msg);
        },
      });

    input.value = '';
  }

  // ── Preview / Annotation ──────────────────────────────────────────────────

  previewDocument(doc: SalesOrderDocumentDto): void {
    this.annotationDocId = doc.documentId;
    this.annotationOriginalName = doc.documentName;
    this.annotationMimeType = doc.mimeType;
    // Get latest version to get the file path, then fetch as blob for auth
    this.docService.getVersions(doc.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(versions => {
        if (versions.length > 0) {
          this.openBlobPreview(versions[0].documentPath, doc.documentName, doc.mimeType);
        }
      });
  }

  previewVersion(version: SalesOrderDocumentVersionDto): void {
    this.annotationDocId = version.documentId;
    this.annotationOriginalName = version.documentPath.split('/').pop() ?? 'document';
    this.annotationMimeType = version.mimeType;
    this.openBlobPreview(version.documentPath, `Version ${version.versionNumber}`, version.mimeType);
  }

  private openBlobPreview(documentPath: string, title: string, mimeType: string): void {
    this.docService.getPreviewBlob(documentPath)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          // Use the original document name with DB-stored mimeType
          const file = new File([blob], this.annotationOriginalName, { type: mimeType });
          this.annotationFile.set(file);
          this.annotationDocName.set(title);
          this.annotationMode.set('view');
          this.showAnnotationDialog.set(true);
        },
        error: (err) => console.error('Failed to load document preview:', err),
      });
  }

  onAnnotationDialogClose(): void {
    this.annotationFile.set(null);
    this.annotationFileUrl.set(null);
    this.annotationDocId = null;
    this.annotationOriginalName = '';
    this.annotationMimeType = '';
    this.showAnnotationDialog.set(false);
  }

  /** Called when the user clicks Save in the annotation dialog */
  onSaveAsNewVersion(event: { blob: Blob; filename: string }): void {
    debugger
    if (this.annotationDocId === null) {
      this.uploadFromAnnotationEditor(event);
      return;
    }

    // Always use the original document name so file is stored as v{N}_{originalName}
    const file = new File(
      [event.blob],
      this.annotationOriginalName,
      { type: this.annotationMimeType || event.blob.type },
    );

    this.docService.createVersion(this.annotationDocId, file, 'Annotated version')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAnnotationDialog.set(false);
          this.loadDocuments();
        },
        error: (err) => console.error('Failed to save new version:', err),
      });
  }

  private uploadFromAnnotationEditor(event: { blob: Blob; filename: string }): void {
    const o = this.order();
    if (!o) return;

    const isSupportDoc = this.annotationIsSupportDoc;
    const file = new File([event.blob], event.filename, { type: event.blob.type });

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.docService.upload(o.orderSeq, file, isSupportDoc, o.repPO, o.brand)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUploading.set(false);
          this.showAnnotationDialog.set(false);
          this.loadDocuments();
          this.notify.success('Document uploaded successfully.', 'Upload Complete');
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.isUploading.set(false);
          const body = err?.error;
          const msg = typeof body === 'string' ? body
            : body?.message ?? body?.title ?? err?.message ?? 'Upload failed.';
          this.uploadError.set(msg);
        },
      });
  }

  // ── Version management ────────────────────────────────────────────────────

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

  triggerVersionUpload(): void {
    this.versionFileInput()?.nativeElement.click();
  }

  onVersionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const docId = this.versionPanelDocId();
    if (!file || !docId) return;

    this.isUploading.set(true);

    this.docService.createVersion(docId, file, 'Edited version')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUploading.set(false);
          this.showVersions({ documentId: docId } as SalesOrderDocumentDto);
          this.loadDocuments();
          this.notify.success('New version created successfully.', 'Version Created');
        },
        error: () => {
          this.isUploading.set(false);
        },
      });

    input.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  goBack(): void {
    this.router.navigate(['/documentum/queue-search']);
  }
}
