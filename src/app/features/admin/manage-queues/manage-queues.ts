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

import { NotificationService } from 'src/app/core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from 'src/app/core/constants/notification-messages';
import { ManageQueueService } from '../services/manage-queue.service';
import { QueueDto, UpdateQueueRequest } from '../models/queue.model';
import { QueueDialogComponent } from '../components/queue-dialog/queue-dialog.component';

@Component({
  selector: 'app-manage-queues',
  standalone: true,
  imports: [TableModule, DatePipe, QueueDialogComponent],
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

  ngOnInit(): void {
    this.loadQueues();
  }

  onEdit(queue: QueueDto): void {
    this.selectedQueue.set(queue);
    this.dialogVisible.set(true);
  }

  onSaved(req: UpdateQueueRequest): void {
    this.saving.set(true);
    this.queueService
      .update(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.notify.success('Queue updated successfully.', 'Admin');
          this.loadQueues();
        },
        error: () => {
          this.saving.set(false);
          this.notify.error('Failed to update queue.', 'Admin');
        },
      });
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
