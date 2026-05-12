import {
  ChangeDetectionStrategy, Component, contentChildren, input, TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PrimeCellDefDirective } from './prime-cell-def.directive';

export interface PrimeTableColumn {
  field: string;
  header: string;
  sortable?: boolean;                          // default true
  width?: string;
  headerAlign?: 'left' | 'center' | 'right';
  cellAlign?: 'left' | 'center' | 'right';
  cellClass?: string;
}

@Component({
  selector: 'app-prime-table',
  standalone: true,
  imports: [TableModule, NgTemplateOutlet],
  templateUrl: './prime-table.component.html',
  styleUrl: './prime-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimeTableComponent {
  readonly columns      = input.required<PrimeTableColumn[]>();
  readonly rows         = input.required<unknown[]>();
  readonly dataKey      = input<string>('id');
  readonly loading      = input<boolean>(false);
  readonly paginator    = input<boolean>(true);
  readonly pageSize     = input<number>(10);
  readonly pageSizeOpts = input<number[]>([10, 25, 50]);
  readonly pageReport   = input<string>('Showing {first} to {last} of {totalRecords} entries');
  readonly emptyMessage = input<string>('No records found.');

  private readonly cellDefs = contentChildren(PrimeCellDefDirective);

  cellTemplate(field: string): TemplateRef<unknown> | null {
    return this.cellDefs().find(d => d.field() === field)?.template ?? null;
  }

  cellValue(row: unknown, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }
}
