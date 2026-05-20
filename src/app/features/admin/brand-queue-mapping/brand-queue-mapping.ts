import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';

import { invalidateCache } from 'src/app/core/interceptors/cache.interceptor';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { NotificationService } from 'src/app/core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from 'src/app/core/constants/notification-messages';
import { BrandDto } from '../../documentum/models/documentum-user.model';
import { BrandQueueMappingDto, QueueSummaryDto } from '../models/brand-mapping.model';
import { BrandQueueMappingService } from '../services/brand-queue-mapping.service';

@Component({
  selector: 'app-brand-queue-mapping',
  standalone: true,
  imports: [FormsModule, Select],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-queue-mapping.html',
  styleUrl: './brand-queue-mapping.scss',
})
export class BrandQueueMapping implements OnInit {
  private readonly service  = inject(BrandQueueMappingService);
  private readonly notify   = inject(NotificationService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly brands          = signal<BrandDto[]>([]);
  readonly availableQueues = signal<QueueSummaryDto[]>([]);
  readonly selectedQueues  = signal<BrandQueueMappingDto[]>([]);
  readonly selectedBrandId = signal<number | null>(null);
  readonly loading         = signal(false);

  private readonly _availableSelected = signal<Set<number>>(new Set());
  private readonly _mappedSelected    = signal<Set<number>>(new Set());

  readonly selectedBrandName = computed(() => {
    const id = this.selectedBrandId();
    if (id == null) return '';
    return this.brands().find(b => b.brandId === id)?.brandName ?? '';
  });

  ngOnInit(): void {
    this.loadBrands();
  }

  onBrandChange(brandId: number | null): void {
    this.selectedBrandId.set(brandId ?? null);
    this._availableSelected.set(new Set());
    this._mappedSelected.set(new Set());

    if (brandId != null) {
      this.loadMapping(brandId);
    } else {
      this.availableQueues.set([]);
      this.selectedQueues.set([]);
    }
  }

  onAvailableClick(event: MouseEvent, queue: QueueSummaryDto): void {
    this.toggleSelection(this._availableSelected, queue.queueId, event);
  }

  onMappedClick(event: MouseEvent, queue: BrandQueueMappingDto): void {
    this.toggleSelection(this._mappedSelected, queue.queueId, event);
  }

  isAvailableSelected(queueId: number): boolean {
    return this._availableSelected().has(queueId);
  }

  isMappedSelected(queueId: number): boolean {
    return this._mappedSelected().has(queueId);
  }

  onAdd(): void {
    const selectedIds = this._availableSelected();

    if (selectedIds.size === 0) {
      this.notify.warning('Please select at least one Queue.', 'Admin');
      return;
    }

    const brandId = this.selectedBrandId();
    if (!brandId) return;

    const idList   = Array.from(selectedIds);
    const queueIds = idList.join(',');
    const globalId = this.authStore.currentUser()?.globalId ?? '';

    this.service
      .addMapping(globalId, brandId, queueIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const moved = this.availableQueues().filter(q => selectedIds.has(q.queueId));
          this.availableQueues.update(list =>
            this.sortByName(list.filter(q => !selectedIds.has(q.queueId))),
          );
          this.selectedQueues.update(list =>
            this.sortByName([
              ...list,
              ...moved.map(q => ({ brandId, brandName: this.selectedBrandName(), queueId: q.queueId, queueName: q.queueName })),
            ]),
          );
          this._availableSelected.set(new Set());
          this._mappedSelected.set(new Set());
          invalidateCache();
          this.notify.success('Queue(s) added successfully.', 'Admin');
        },
        error: () => {
          this.notify.error('Failed to add queue mapping.', 'Admin');
        },
      });
  }

  onRemove(): void {
    const selectedIds = this._mappedSelected();

    if (selectedIds.size === 0) {
      this.notify.warning('Please select at least one Queue.', 'Admin');
      return;
    }

    const brandId = this.selectedBrandId();
    if (!brandId) return;

    const idList   = Array.from(selectedIds);
    const queueIds = idList.join(',');
    const globalId = this.authStore.currentUser()?.globalId ?? '';

    this.service
      .removeMapping(globalId, brandId, queueIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const moved = this.selectedQueues().filter(q => selectedIds.has(q.queueId));
          this.selectedQueues.update(list =>
            this.sortByName(list.filter(q => !selectedIds.has(q.queueId))),
          );
          this.availableQueues.update(list =>
            this.sortByName([...list, ...moved.map(q => ({ queueId: q.queueId, queueName: q.queueName }))]),
          );
          this._availableSelected.set(new Set());
          this._mappedSelected.set(new Set());
          invalidateCache();
          this.notify.success('Queue(s) removed successfully.', 'Admin');
        },
        error: () => {
          this.notify.error('Failed to remove queue mapping.', 'Admin');
        },
      });
  }

  private sortByName<T extends { queueName: string }>(list: T[]): T[] {
    return [...list].sort((a, b) => a.queueName.localeCompare(b.queueName));
  }

  private toggleSelection(
    selSet: WritableSignal<Set<number>>,
    id: number,
    event: MouseEvent,
  ): void {
    const ids = new Set(selSet());
    if (event.ctrlKey || event.metaKey) {
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
    } else {
      ids.clear();
      ids.add(id);
    }
    selSet.set(ids);
  }

  private loadBrands(): void {
    this.loading.set(true);
    const globalId = this.authStore.currentUser()?.globalId ?? '';
    this.service
      .getMapping(globalId, 0, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.brands.set(data.brands ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error(NM.GENERAL.LOADING_FAILED, 'Admin');
        },
      });
  }

  private loadMapping(brandId: number): void {
    this.loading.set(true);
    const globalId = this.authStore.currentUser()?.globalId ?? '';
    this.service
      .getMapping(globalId, brandId, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.availableQueues.set(this.sortByName(data.availableQueues ?? []));
          this.selectedQueues.set(this.sortByName(data.selectedQueues ?? []));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error(NM.GENERAL.LOADING_FAILED, 'Admin');
        },
      });
  }
}
