import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
  input,
  output,
} from '@angular/core';

export type ConfirmVariant = 'danger' | 'primary' | 'warning';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  private static nextId = 0;
  readonly uid = ++ConfirmationDialogComponent.nextId;

  readonly isOpen         = input.required<boolean>();
  readonly title          = input.required<string>();
  readonly description    = input.required<string>();
  readonly confirmLabel   = input.required<string>();
  readonly cancelLabel    = input<string>('Cancel');
  readonly confirmVariant = input<ConfirmVariant>('primary');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @ViewChild('confirmBtn') private confirmBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('dialogPanel') private dialogPanel!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.confirmBtn?.nativeElement?.focus(), 30);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.isOpen()) this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelled.emit();
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialogPanel) return;
    const focusable = Array.from(
      this.dialogPanel.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
