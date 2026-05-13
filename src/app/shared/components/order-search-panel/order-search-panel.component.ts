import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DropdownOption, OrderSearchRequest } from '../../../features/documentum/models/order.model';

@Component({
  selector: 'app-order-search-panel',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, Select],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-search-panel.component.html',
  styleUrl: './order-search-panel.component.scss',
})
export class OrderSearchPanelComponent {
  private readonly fb = inject(FormBuilder);

  readonly search = output<OrderSearchRequest>();
  readonly cleared = output<void>();
  readonly brandChanged = output<string>();

  readonly productTypes = input<DropdownOption[]>([]);
  readonly regions: DropdownOption[] = [
    { label: 'East', value: 'EAST' },
    { label: 'West', value: 'WEST' },
    { label: 'Central', value: 'CENTRAL' },
  ];
  readonly priorities: DropdownOption[] = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
  ];
  readonly brands = input<DropdownOption[]>([]);
  readonly queueNames = input<DropdownOption[]>([]);

  readonly form = this.fb.group({
    salesOrderNumber: [''],
    repPO:            [''],
    accountNumber:    [''],
    productType:      [null as string | null],
    region:           [null as string | null],
    priority:         [null as string | null],
    brand:            [null as string | null],
    captureDateFrom:  [''],
    captureDateTo:    [''],
    jobName:          [''],
    queueName:        [null as string | null],
    packageOwner:     [''],
    pageSize:         ['100'],
  });

  onBrandChange(): void {
    const brand = this.form.get('brand')!.value;
    this.form.get('queueName')!.reset();
    this.brandChanged.emit(brand ?? '');
  }

  onSearch(): void {
    const raw = this.form.getRawValue();
    const request: OrderSearchRequest = {
      pageNumber: 1,
      pageSize: parseInt(raw.pageSize ?? '100', 10) || 100,
    };
    if (raw.salesOrderNumber?.trim()) request.salesOrderNumber = raw.salesOrderNumber.trim();
    if (raw.repPO?.trim())            request.repPO            = raw.repPO.trim();
    if (raw.accountNumber?.trim())    request.accountNumber    = raw.accountNumber.trim();
    if (raw.productType)              request.productType      = raw.productType;
    if (raw.region)                   request.region           = raw.region;
    if (raw.priority)                 request.priority         = raw.priority;
    if (raw.brand)                    request.brand            = raw.brand;
    if (raw.captureDateFrom?.trim())  request.captureDateFrom  = raw.captureDateFrom.trim();
    if (raw.captureDateTo?.trim())    request.captureDateTo    = raw.captureDateTo.trim();
    if (raw.jobName?.trim())          request.jobName          = raw.jobName.trim();
    if (raw.queueName)                request.queueName        = raw.queueName;
    if (raw.packageOwner?.trim())     request.packageOwner     = raw.packageOwner.trim();
    this.search.emit(request);
  }

  onClear(): void {
    this.form.reset({ pageSize: '100' });
    this.cleared.emit();
    this.brandChanged.emit('');
  }
}
