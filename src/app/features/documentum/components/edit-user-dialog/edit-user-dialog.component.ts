import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { AuthStore } from '../../../../core/auth/auth.store';
import { BrandDto, DocumentumUserDto, UpdateDocumentumUserRequest } from '../../models/documentum-user.model';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [Dialog, ReactiveFormsModule, FormsModule, InputTextModule, Select, DatePipe],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserDialogComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);

  readonly visible = model<boolean>(false);
  readonly user    = input<DocumentumUserDto | null>(null);
  readonly saving  = input<boolean>(false);
  readonly brands  = input<BrandDto[]>([]);

  readonly saved = output<UpdateDocumentumUserRequest>();

  readonly form = this.fb.nonNullable.group({
    firstName: [{ value: '', disabled: true }, Validators.required],
    lastName:  [{ value: '', disabled: true }, Validators.required],
    emailId:   [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    globalId:  [{ value: '', disabled: true }, Validators.required],
    isActive:  [true],
  });

  // null = not yet overridden; number = user explicitly picked a brand
  private readonly _brandOverride = signal<number | null>(null);

  // brandId is now an integer — user.brandId directly matches brandId in the options list
  readonly selectedBrandId = computed<number | null>(() =>
    this._brandOverride() ?? this.user()?.brandId ?? null
  );

  // toSignal makes isActive reactive in zoneless OnPush — plain .value read won't re-render
  readonly isActiveValue = toSignal(this.form.controls.isActive.valueChanges, {
    initialValue: this.form.controls.isActive.value,
  });

  constructor() {
    // Re-runs when user() changes to patch the form fields and reset the brand override
    effect(() => {
      const u = this.user();

      if (u) {
        this.form.patchValue({
          firstName: u.firstName,
          lastName:  u.lastName,
          globalId:  u.globalId ?? '',
          isActive:  u.isActive,
          emailId:   u.emailId  ?? '',
        });
      } else {
        this.form.reset({ isActive: true });
      }
      // Reset override so computed re-derives brand from user() + brands()
      this._brandOverride.set(null);
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

  }

  get f() { return this.form.controls; }

  onBrandChange(id: number | null): void {
    this._brandOverride.set(id ?? null);
  }

  close(): void {
    this.visible.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v           = this.form.getRawValue();
    const currentUser = this.authStore.currentUser();
    const modifiedBy  = currentUser?.email ?? currentUser?.displayName ?? '';
    const existing    = this.user();

    // Use explicit user selection if set, otherwise fall back to the user's existing brandId.
    // Avoids depending on the brands list lookup which may be empty at submit time.
    const brandId = this._brandOverride() ?? existing?.brandId ?? 0;

    const req: UpdateDocumentumUserRequest = {
      userId:    existing?.userId ?? 0,
      brandId,
      isActive:  v.isActive,
      modifiedBy,
    };

    this.saved.emit(req);
  }
}
