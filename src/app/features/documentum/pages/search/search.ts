import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CustomerService } from '../../services/customerservice';

export type SearchCriteria = Partial<{
  noRecords: string;
  release: string;
  pcUserName: string;
  releaseName: string;
  emailAddress: string;
  repPo: string;
  dateTime: string;
}>;

@Component({
  selector: 'app-search',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    ProgressBarModule,
    SliderModule,
    TableModule,
    TagModule,
    InputTextModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerService],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private readonly fb = inject(FormBuilder);

  // Optional header link (top-right of title)
  headerLinkText = '';
  headerLinkHref = '#';

  readonly form = this.fb.nonNullable.group({
    noRecords: '100',
    release: '',
    pcUserName: '',
    releaseName: '',
    emailAddress: '',
    repPo: '',
    dateTime: '',
  });

  onSearch(): void {
    const raw = this.form.getRawValue();

    // Build criteria dynamically → search with ANY filled field(s)
    const criteria: SearchCriteria = Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [key, value.toString().trim()])
        .filter(([, value]) => value !== ''),
    ) as SearchCriteria;

    this.search(criteria);
  }

  onClear(): void {
    this.form.reset({
      noRecords: '100',
      release: '',
      pcUserName: '',
      releaseName: '',
      emailAddress: '',
      repPo: '',
      dateTime: '',
    });
  }

  private search(criteria: SearchCriteria): void {
    // Plug your API/service here
    console.log('Search criteria:', criteria);
  }
  private customerService = inject(CustomerService);
  customers!: Customer[];
  selectedCustomers!: Customer[];
  representatives!: Representative[];
  statuses!: any[];
  loading: boolean = true;
  activityValues: number[] = [0, 100];
  searchValue: string | undefined;

  ngOnInit() {
    this.customerService.getCustomersLarge().then((customers) => {
      this.customers = customers;
      this.loading = false;
      this.customers.forEach((customer) => (customer.date = new Date(<Date>customer.date)));
    });
    this.representatives = [
      { name: 'Amy Elsner', image: 'amyelsner.png' },
      { name: 'Anna Fali', image: 'annafali.png' },
      { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
      { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
      { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
      { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
      { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
      { name: 'Onyama Limba', image: 'onyamalimba.png' },
      { name: 'Stephen Shaw', image: 'stephenshaw.png' },
      { name: 'Xuxue Feng', image: 'xuxuefeng.png' },
    ];
    this.statuses = [
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'New', value: 'new' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Renewal', value: 'renewal' },
      { label: 'Proposal', value: 'proposal' },
    ];
  }
  clear(dt: Table) {
    this.searchValue = '';
    dt.reset();
  }
  getSeverity(status: string) {
    switch (status) {
      case 'unqualified':
        return 'danger';

      case 'qualified':
        return 'success';

      case 'new':
        return 'info';

      case 'negotiation':
        return 'warn';

      case 'renewal':
        return null;
        default:
          return null
    }
  }
}

export interface Country {
  name?: string;
  code?: string;
}

export interface Representative {
  name?: string;
  image?: string;
}

export interface Customer {
  id?: number;
  name?: string;
  country?: Country;
  company?: string;
  date?: string | Date;
  status?: string;
  activity?: number;
  representative?: Representative;
  verified?: boolean;
  balance?: number;
}
