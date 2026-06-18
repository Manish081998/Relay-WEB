import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
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
  private defaultBrandApplied = false;

  readonly search = output<OrderSearchRequest>();
  readonly cleared = output<void>();
  readonly brandChanged = output<string>();
  readonly acquire = output<void>();

  readonly showAcquireButton = input(false);
  readonly acquireDisabled = input(false);
  readonly acquireMessage = input('');
  readonly isAcquiring = input(false);
  readonly brandDisabled = input(false);

  readonly productTypes = input<DropdownOption[]>([]);
  readonly regions = input<DropdownOption[]>([]);
  readonly priorities: DropdownOption[] = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
  ];
  readonly brands = input<DropdownOption[]>([]);
  readonly queueNames = input<DropdownOption[]>([]);

  /** Default brand to pre-select and auto-search on page load. */
  readonly defaultBrand = input<string>('');

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
    pageSize:         ['20'],
  });

  constructor() {
    // When brands arrive and a defaultBrand is set, pre-select it and auto-search
    effect(() => {
      const brandList = this.brands();
      const defaultVal = this.defaultBrand();
      if (!defaultVal || brandList.length === 0 || this.defaultBrandApplied) return;

      const match = brandList.find(b => b.value === defaultVal);
      if (match) {
        this.defaultBrandApplied = true;
        this.form.patchValue({ brand: match.value });
        this.brandChanged.emit(match.value);
        this.onSearch();
      }
    });
  }

  onBrandChange(): void {
    const brand = this.form.get('brand')!.value;
    this.form.get('productType')!.reset();
    this.form.get('region')!.reset();
    this.form.get('queueName')!.reset();
    this.brandChanged.emit(brand ?? '');
  }

  onSearch(): void {
    const raw = this.form.getRawValue();
    const request: OrderSearchRequest = {
      pageNumber: 1,
      pageSize: parseInt(raw.pageSize ?? '20', 10) || 20,
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
    const currentBrand = this.form.get('brand')!.value;
    this.form.reset({ pageSize: '20', brand: currentBrand });
    this.cleared.emit();
    // Re-emit brand so parent reloads queue names from API
    this.brandChanged.emit(currentBrand ?? '');
    // Auto-search with the retained brand so table reloads
    this.onSearch();
  }
}
