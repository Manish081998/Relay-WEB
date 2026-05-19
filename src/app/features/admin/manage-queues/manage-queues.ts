import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';

import { invalidateCache } from 'src/app/core/interceptors/cache.interceptor';
import { NotificationService } from 'src/app/core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from 'src/app/core/constants/notification-messages';
import { ManageQueueService } from '../services/manage-queue.service';
import { CreateQueueRequest, QueueDto, UpdateQueueRequest } from '../models/queue.model';
import { QueueDialogComponent } from '../components/queue-dialog/queue-dialog.component';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-manage-queues',
  standalone: true,
  imports: [TableModule, DatePipe, QueueDialogComponent, ConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-queues.html',
  styleUrl: './manage-queues.scss',
})
export class ManageQueues implements OnInit {
  private readonly queueService = inject(ManageQueueService);
  private readonly notify       = inject(NotificationService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly queues        = signal<QueueDto[]>([]);
  readonly loading       = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving        = signal(false);
  readonly selectedQueue = signal<QueueDto | null>(null);

  readonly deleteConfirmOpen = signal(false);
  readonly queueToDelete     = signal<QueueDto | null>(null);
  readonly deleting          = signal(false);

  ngOnInit(): void {
    this.loadQueues();
  }

  onAddClick(): void {
    this.selectedQueue.set(null);
    this.dialogVisible.set(true);
  }

  onEdit(queue: QueueDto): void {
    this.selectedQueue.set(queue);
    this.dialogVisible.set(true);
  }

  onSaved(req: UpdateQueueRequest): void {
    const isAddMode = this.selectedQueue() === null;
    isAddMode ? this.createQueue(req) : this.updateQueue(req);
  }

  private createQueue(req: UpdateQueueRequest): void {
    const body: CreateQueueRequest = {
      queueName:   req.queueName,
      description: req.description,
      isActive:    req.isActive,
      createdBy:   req.modifiedBy,
    };
    this.saving.set(true);
    this.queueService
      .create(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.notify.success('Queue created successfully.', 'Admin');
          invalidateCache();
          this.loadQueues();
        },
        error: () => {
          this.saving.set(false);
          this.notify.error('Failed to create queue.', 'Admin');
        },
      });
  }

  private updateQueue(req: UpdateQueueRequest): void {
    this.saving.set(true);
    this.queueService
      .update(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.notify.success('Queue updated successfully.', 'Admin');
          invalidateCache();
          this.loadQueues();
        },
        error: () => {
          this.saving.set(false);
          this.notify.error('Failed to update queue.', 'Admin');
        },
      });
  }

  onDeleteClick(queue: QueueDto): void {
    this.queueToDelete.set(queue);
    this.deleteConfirmOpen.set(true);
  }

  onDeleteConfirmed(): void {
    const queue = this.queueToDelete();
    if (!queue) return;

    this.deleting.set(true);
    this.queueService
      .delete(queue.queueId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.deleteConfirmOpen.set(false);
          this.queueToDelete.set(null);
          this.notify.success('Queue deleted successfully.', 'Admin');
          invalidateCache();
          this.loadQueues();
        },
        error: () => {
          this.deleting.set(false);
          this.notify.error('Failed to delete queue.', 'Admin');
        },
      });
  }

  onDeleteCancelled(): void {
    this.deleteConfirmOpen.set(false);
    this.queueToDelete.set(null);
  }

  private loadQueues(): void {
    this.loading.set(true);
    this.queueService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.queues.set(data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error(NM.GENERAL.LOADING_FAILED, 'Admin');
        },
      });
  }
}
