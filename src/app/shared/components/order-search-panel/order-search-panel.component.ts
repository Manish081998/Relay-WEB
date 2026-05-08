import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { OrderSearchRequest } from '../../../features/documentum/models/order.model';

@Component({
  selector: 'app-order-search-panel',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-search-panel.component.html',
  styleUrl: './order-search-panel.component.scss',
})
export class OrderSearchPanelComponent {
  private readonly fb = inject(FormBuilder);

  readonly search = output<OrderSearchRequest>();
  readonly cleared = output<void>();

  readonly form = this.fb.nonNullable.group({
    repPO:          '',
    accountNumber:  '',
    brand:          '',
    repSalesPerson: '',
    jobNumber:      '',
    orderDateFrom:  '',
    orderDateTo:    '',
    pageSize:       '100',
  });

  onSearch(): void {
    const raw = this.form.getRawValue();
    const request: OrderSearchRequest = {
      pageNumber: 1,
      pageSize: parseInt(raw.pageSize, 10) || 100,
    };
    if (raw.repPO.trim())          request.repPO          = raw.repPO.trim();
    if (raw.accountNumber.trim())  request.accountNumber  = raw.accountNumber.trim();
    if (raw.brand.trim())          request.brand          = raw.brand.trim();
    if (raw.repSalesPerson.trim()) request.repUserName = raw.repSalesPerson.trim();
    if (raw.jobNumber.trim())      request.jobNumber      = raw.jobNumber.trim();
    if (raw.orderDateFrom.trim())  request.orderDateFrom  = raw.orderDateFrom.trim();
    if (raw.orderDateTo.trim())    request.orderDateTo    = raw.orderDateTo.trim();
    this.search.emit(request);
  }

  onClear(): void {
    this.form.reset({ pageSize: '100' });
    this.cleared.emit();
  }
}
