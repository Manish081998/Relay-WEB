import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthStore } from '../../../../core/auth/auth.store';
import { EdgeOrdersService } from '../../services/edge-orders.service';
import { EdiStatusItem } from '../../models/edge-orders.model';

@Component({
  selector: 'app-edi',
  standalone: true,
  imports: [FormsModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edi.html',
  styleUrl: './edi.scss',
})
export class Edi {
  private readonly svc       = inject(EdgeOrdersService);
  private readonly authStore = inject(AuthStore);
  private readonly router    = inject(Router);

  readonly poNumber      = signal('');
  readonly loading       = signal(false);
  readonly validationMsg = signal('');
  readonly ediStatusRows = signal<EdiStatusItem[]>([]);
  readonly ediLoading    = signal(false);
  readonly showEdiGrid   = signal(false);

  async onOk(): Promise<void> {
    const po = this.poNumber().trim();

    if (!po) {
      this.validationMsg.set('Please enter a valid PO Number.');
      return;
    }

    this.validationMsg.set('');
    this.loading.set(true);

    try {
      const userId = this.authStore.currentUser()?.globalId ?? '';
      const res = await firstValueFrom(this.svc.getOrderByGuid(undefined, po, userId));

      if (res.success && res.data) {
        const key = `edit-order-${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(res.data));
        this.router.navigate(['/intranet/edit-order'], { queryParams: { key, returnUrl: '/intranet/edi' } });
      } else {
        this.validationMsg.set(res.message || 'Please enter valid PO number.');
      }
    } catch {
      this.validationMsg.set('Please enter valid PO number.');
    } finally {
      this.loading.set(false);
    }
  }

  async onEdiStatus(): Promise<void> {
    const po = this.poNumber().trim();

    if (!po) {
      this.validationMsg.set('Please enter a valid PO Number.');
      return;
    }

    this.validationMsg.set('');
    this.ediLoading.set(true);
    this.showEdiGrid.set(false);

    try {
      const res = await firstValueFrom(this.svc.getEdiStatus(po));
      this.ediStatusRows.set(res.success ? (res.data ?? []) : []);
      this.showEdiGrid.set(true);
    } catch {
      this.ediStatusRows.set([]);
      this.showEdiGrid.set(true);
    } finally {
      this.ediLoading.set(false);
    }
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleString();
  }
}
