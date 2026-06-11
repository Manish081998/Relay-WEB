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
import { DropdownOption, OrderItem } from '../../models/order.model';
import { WorkflowState, WorkflowHistoryItem } from '../../models/workflow.model';
import {
  SalesOrderDocumentDto,
  SalesOrderDocumentVersionDto,
} from '../../models/document.model';
import { SalesOrderNoteDto } from '../../models/note.model';
import { AnnotationDialogComponent } from '../../components/annotation-dialog/annotation-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { WORKFLOW } from '../../constants/workflow.constants';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { invalidateCache } from '../../../../core/interceptors/cache.interceptor';

@Component({
  selector: 'app-workflow-information',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnotationDialogComponent, ConfirmationDialogComponent, Dialog, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-information.html',
  styleUrl: './workflow-information.scss',
  providers: [SalesOrderDocumentService, SalesOrderNoteService, WorkflowService],
})
export class WorkflowInformation {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly docService = inject(SalesOrderDocumentService);
  private readonly noteService = inject(SalesOrderNoteService);
  private readonly notify = inject(NotificationService);
  private readonly workflowService = inject(WorkflowService);
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderGuid = input<string>('');
  readonly activeTab = signal<'info' | 'documents' | 'history'>('info');

  readonly orderSeq = toSignal(
    this.route.queryParamMap.pipe(map(p => Number(p.get('orderSeq')) || 0)),
    { initialValue: 0 },
  );

  // ── Order data fetched from API ──────────────────────────────────────────
  readonly order = signal<OrderItem | null>(null);
  readonly isLoadingOrder = signal(true);

  // ── Workflow state (from API, replaces hardcoded workflow object) ─────────
  readonly workflowState = signal<WorkflowState | null>(null);
  readonly workflowHistory = signal<WorkflowHistoryItem[]>([]);
  readonly isLoadingWorkflow = signal(true);
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

  // ── Route To Department dropdown ──────────────────────────────────────────
  readonly routeToDepartmentQueues = signal<DropdownOption[]>([]);
  readonly selectedRouteTo = signal<string>('');

  // ── Workflow action loading states ────────────────────────────────────────
  readonly isProcessingAction = signal(false);

  // ── Confirmation dialog ──────────────────────────────────────────────────
  readonly showConfirmDialog = signal(false);
  readonly confirmTitle = signal('');
  readonly confirmDescription = signal('');
  readonly confirmLabel = signal('');
  readonly confirmVariant = signal<'primary' | 'danger' | 'warning'>('primary');
  private pendingAction: 'acquire' | 'unassign' | 'complete' | null = null;

  // ── Computed: button visibility & enable/disable ─────────────────────────
  readonly currentUserGlobalId = computed(() => this.auth.currentUser()?.globalId?.toLowerCase() ?? '');
  readonly currentUserInitial = computed(() => {
    const u = this.auth.currentUser();
    return (u?.displayName || u?.email || '?').charAt(0).toUpperCase();
  });

  readonly isAcquired = computed(() => this.workflowState()?.isAcquired ?? false);

  readonly isAcquiredByMe = computed(() => {
    const state = this.workflowState();
    if (!state?.isAcquired || !state.acquiredBy) return false;
    return state.acquiredBy.toLowerCase() === this.currentUserGlobalId();
  });

  // Dormant: show Acquire only
  readonly showAcquireBtn = computed(() => !this.isAcquired());
  // Acquired: show Unassign only to acquiring user
  readonly showUnassignBtn = computed(() => this.isAcquiredByMe());
  // Acquired: show Complete (enabled only when Route To selected)
  readonly showCompleteBtn = computed(() => this.isAcquired());
  readonly canComplete = computed(() => this.isAcquiredByMe() && !!this.selectedRouteTo());

  // Only the acquiring user can annotate/import documents
  readonly canAnnotate = computed(() => this.isAcquiredByMe());

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

  /** Check if the previous note in the list is from the same user (for grouping) */
  isSameUserAsPrev(index: number): boolean {
    const arr = this.notes();
    if (index === 0) return false;
    return (arr[index].createdBy ?? '').toLowerCase() === (arr[index - 1].createdBy ?? '').toLowerCase();
  }

  // Derived workflow display values
  readonly workflowQueueName = computed(() => this.workflowState()?.queueName ?? '');
  readonly workflowStateName = computed(() => this.isAcquired() ? WORKFLOW.STATE_ACQUIRED : WORKFLOW.STATE_DORMANT);
  readonly workflowStartedOn = computed(() => this.workflowState()?.startedOn ?? '');

  readonly acquireBtnTooltip = computed(() => {
    const state = this.workflowState();
    if (state?.isAcquired) {
      const name = state.acquiredByName ?? state.acquiredBy ?? WORKFLOW.FALLBACK_NAME;
      const date = state.stageChangeDate
        ? new Date(state.stageChangeDate).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';
      return `Acquired by ${name}${date ? ' on ' + date : ''}`;
    }
    return 'Acquire this task and assign it to yourself';
  });

  readonly notes = signal<SalesOrderNoteDto[]>([]);
  readonly isLoadingNotes = signal(false);
  readonly chatMessagesEl = viewChild<ElementRef<HTMLElement>>('chatMessages');

  // ── Add Note dialog ────────────────────────────────────────────────────────
  readonly showAddNoteDialog = signal(false);
  readonly newNoteText = signal('');
  readonly isSavingNote = signal(false);

  // ── Document Management ───────────────────────────────────────────────────
  readonly salesOrderDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly supportDocs = signal<SalesOrderDocumentDto[]>([]);
  readonly totalDocCount = computed(() => this.salesOrderDocs().length + this.supportDocs().length);

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

  // ── Sales Order History pagination ────────────────────────────────────────
  readonly soHistoryPage = signal(1);
  readonly soHistoryPageSize = 5;
  readonly soHistoryTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.salesOrderDocs().length / this.soHistoryPageSize)),
  );
  readonly pagedSalesOrderDocs = computed(() => {
    const all = this.salesOrderDocs();
    const start = (this.soHistoryPage() - 1) * this.soHistoryPageSize;
    return all.slice(start, start + this.soHistoryPageSize);
  });
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
      this.loadWorkflowData(stateOrder.orderSeq, stateOrder.brand);
      this.loadDocuments(stateOrder.orderSeq);
      this.loadNotes(stateOrder.orderSeq);
    } else {
      const seq = this.orderSeq();
      if (seq > 0) {
        this.ordersService.getByOrderSeq(seq)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (order) => {
              this.order.set(order);
              this.isLoadingOrder.set(false);
              this.loadWorkflowData(order.orderSeq, order.brand);
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
  }

  // ── Workflow data loading ──────────────────────────────────────────────────

  private loadWorkflowData(orderSeq: number, brand?: string): void {
    this.isLoadingWorkflow.set(true);

    // Load workflow state
    this.workflowService.getState(orderSeq)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('loadWorkflowState error:', err); return of(null); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(state => {
        this.workflowState.set(state);
        this.isLoadingWorkflow.set(false);

        // Load Route To dropdown using state's queue name for exclusion
        if (brand) {
          this.loadRouteToDepartment(brand, state?.queueName);
        }
      });

    // Load workflow history
    this.workflowService.getHistory(orderSeq)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('loadWorkflowHistory error:', err); return of([] as WorkflowHistoryItem[]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(history => this.workflowHistory.set(history));
  }

  private loadRouteToDepartment(brand: string, currentQueueName?: string): void {
    const excludeNames = new Set(
      [currentQueueName]
        .filter(Boolean)
        .map(n => n!.trim().toLowerCase()),
    );
    this.ordersService.getRouteToDepartment(brand)
      .pipe(
        map(queues => excludeNames.size > 0
          ? queues.filter(q => !excludeNames.has(q.label.trim().toLowerCase()))
          : queues),
        timeout(15000),
        catchError((err) => { console.error('loadRouteToDepartment error:', err); return of([]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(queues => this.routeToDepartmentQueues.set(queues));
  }

  private reloadWorkflow(): void {
    const seq = this.order()?.orderSeq;
    const brand = this.order()?.brand;
    if (seq) {
      // Invalidate browser cache so we get fresh data after the action
      invalidateCache();
      this.loadWorkflowData(seq, brand);
    }
  }

  // ── Workflow actions ─────────────────────────────────────────────────────

  onAcquireClick(): void {
    this.pendingAction = 'acquire';
    this.confirmTitle.set('Acquire Task');
    this.confirmDescription.set('This task will be assigned to you. Continue?');
    this.confirmLabel.set('Acquire');
    this.confirmVariant.set('primary');
    this.showConfirmDialog.set(true);
  }

  onUnassignClick(): void {
    this.pendingAction = 'unassign';
    this.confirmTitle.set('Unassign Task');
    this.confirmDescription.set('This task will be returned to the queue. Are you sure?');
    this.confirmLabel.set('Unassign');
    this.confirmVariant.set('warning');
    this.showConfirmDialog.set(true);
  }

  onCompleteClick(): void {
    this.pendingAction = 'complete';
    this.confirmTitle.set('Complete Task');
    this.confirmDescription.set('Are you sure you want to complete and route this task?');
    this.confirmLabel.set('Complete');
    this.confirmVariant.set('primary');
    this.showConfirmDialog.set(true);
  }

  onConfirmDialogConfirmed(): void {
    const orderSeq = this.order()?.orderSeq;
    const action = this.pendingAction;
    if (!orderSeq || !action) return;

    this.isProcessingAction.set(true);
    this.showConfirmDialog.set(false);

    const displayName = this.auth.currentUser()?.displayName ?? WORKFLOW.FALLBACK_USER;

    const request$ =
      action === 'acquire'  ? this.workflowService.acquire(orderSeq, displayName) :
      action === 'unassign' ? this.workflowService.unassign(orderSeq, displayName) :
      this.workflowService.complete(orderSeq, parseInt(this.selectedRouteTo(), 10), displayName);

    request$.pipe(
      timeout(15000),
      catchError((err) => {
        const body = err?.error;
        const msg = typeof body === 'string' ? body : body?.message ?? err?.message ?? `Failed to ${action} task.`;
        this.notify.error(msg, 'Error');
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.isProcessingAction.set(false);
      this.pendingAction = null;

      if (result) {
        this.notify.success(result.message || `Task ${action}d successfully.`, 'Success');
        this.selectedRouteTo.set('');
        this.reloadWorkflow();
      }
    });
  }

  onConfirmDialogCancelled(): void {
    this.showConfirmDialog.set(false);
    this.pendingAction = null;
  }

  setTab(tab: 'info' | 'documents' | 'history'): void {
    this.activeTab.set(tab);
  }

  // ── Workflow history ─────────────────────────────────────────────────────

  refreshHistory(): void {
    const seq = this.order()?.orderSeq;
    if (!seq) return;
    this.workflowService.getHistory(seq)
      .pipe(
        timeout(15000),
        catchError((err) => { console.error('refreshHistory error:', err); return of([] as WorkflowHistoryItem[]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(history => {
        this.workflowHistory.set(history);
        this.historyPage.set(1);
        this.notify.success('Workflow history refreshed.', 'Refreshed');
      });
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

  goToSoHistoryPage(page: number): void {
    if (page < 1 || page > this.soHistoryTotalPages()) return;
    this.soHistoryPage.set(page);
  }

  // ── Notes methods ─────────────────────────────────────────────────────────

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
          this.notify.success('Note saved successfully.', 'Note Added');
        },
        error: (err) => {
          console.error('Save note error:', err);
          this.isSavingNote.set(false);
        },
      });
  }

  // ── Notes loading ─────────────────────────────────────────────────────────

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

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatMessagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
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
    if (!this.canAnnotate()) {
      this.notify.warning('Only the user who acquired this task can save changes.', 'Not Allowed');
      return;
    }
    if (this.annotationDocId === null) {
      this.uploadFromAnnotationEditor(event);
      return;
    }

    // Always use the original document name so file is stored as v{N}_{originalName}
    const docId = this.annotationDocId;
    const file = new File(
      [event.blob],
      this.annotationOriginalName,
      { type: this.annotationMimeType || event.blob.type },
    );

    this.docService.createVersion(docId, file, 'Annotated version')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAnnotationDialog.set(false);
          invalidateCache();
          this.loadDocuments();
          // Refresh version list if version panel is open
          if (this.showVersionPanel()) {
            this.showVersions({ documentId: docId } as SalesOrderDocumentDto);
          }
          this.notify.success('New version saved successfully.', 'Version Created');
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
    this.router.navigate(['/documentum/queue-search']);
  }
}
