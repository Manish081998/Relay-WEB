import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[ptCellDef]',
  standalone: true,
})
export class PrimeCellDefDirective {
  readonly field    = input.required<string>({ alias: 'ptCellDef' });
  readonly template = inject(TemplateRef<unknown>);
}
