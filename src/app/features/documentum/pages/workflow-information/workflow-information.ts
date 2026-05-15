import {
  ChangeDetectionStrategy, Component, computed,
  DestroyRef, ElementRef, inject, input, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { DropdownOption, OrderItem } from '../../models/order.model';

@Component({
  selector: 'app-workflow-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-information.html',
  styleUrl: './workflow-information.scss',
})
export class WorkflowInformation {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
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

  constructor() {
    // Try to get order data from router state (passed from queue-search)
    const nav = this.router.getCurrentNavigation();
    const stateOrder = nav?.extras?.state?.['order'] as OrderItem | undefined;

    if (stateOrder) {
      this.order.set(stateOrder);
      this.isLoadingOrder.set(false);
      this.loadRouteToDepartment(stateOrder.brand);
    } else {
      // Fallback: fetch from API if navigated directly via URL
      const seq = this.orderSeq();
      if (seq > 0) {
        this.ordersService.getByOrderSeq(seq)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (order) => {
              this.order.set(order);
              this.isLoadingOrder.set(false);
              this.loadRouteToDepartment(order.brand);
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
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(queues => this.routeToDepartmentQueues.set(queues));
    }
  }

  setTab(tab: 'info' | 'documents' | 'history'): void {
    this.activeTab.set(tab);
  }

  toggleNotePanel(): void {
    const opening = !this.showNotePanel();
    this.showNotePanel.set(opening);
    if (opening) {
      this.newNoteText.set('');
      // Focus the textarea after DOM renders
      setTimeout(() => this.noteTextarea()?.nativeElement.focus(), 50);
    }
  }

  saveNote(): void {
    const text = this.newNoteText().trim();
    if (!text) return;

    this.isSavingNote.set(true);

    // Build new note with current timestamp
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
      userName: 'current_user', // TODO: replace with actual logged-in user
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

  goBack(): void {
    this.router.navigate(['/documentum/queue-search']);
  }
}
