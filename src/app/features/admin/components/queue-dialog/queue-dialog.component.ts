import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AuthStore } from '../../../../core/auth/auth.store';
import { QueueDto, UpdateQueueRequest } from '../../models/queue.model';

@Component({
  selector: 'app-queue-dialog',
  standalone: true,
  imports: [Dialog, ReactiveFormsModule, FormsModule, InputTextModule, TextareaModule, DatePipe],
  templateUrl: './queue-dialog.component.html',
  styleUrl: './queue-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueDialogComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);

  /** Two-way binding — parent controls open/close state */
  readonly visible = model<boolean>(false);

  /** Pass a queue to edit; null = add-new mode */
  readonly queue   = input<QueueDto | null>(null);

  /** Parent sets this to true while the HTTP call is in-flight */
  readonly saving  = input<boolean>(false);

  /** Emitted when the form is valid and the user clicks Save */
  readonly saved   = output<UpdateQueueRequest>();

  readonly title      = computed(() => this.queue() ? 'Edit Queue' : 'Add Queue');
  readonly isEditMode = computed(() => this.queue() !== null);

  readonly form = this.fb.nonNullable.group({
    queueName:   ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(400)]],
    isActive:    [true],
  });

  readonly descValue = toSignal(
    this.form.controls.description.valueChanges,
    { initialValue: this.form.controls.description.value },
  );

  readonly isActiveValue = toSignal(
    this.form.controls.isActive.valueChanges,
    { initialValue: this.form.controls.isActive.value },
  );

  readonly descLength = computed(() => this.descValue().length);

  constructor() {
    effect(() => {
      const q = this.queue();
      if (q) {
        this.form.patchValue({
          queueName:   q.queueName,
          description: q.description ?? '',
          isActive:    q.isActive,
        });
      } else {
        this.form.reset({ isActive: true });
      }
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  get f() { return this.form.controls; }

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
    const modifiedBy  = currentUser?.displayName ?? currentUser?.email ?? '';
    const existing    = this.queue();

    this.saved.emit({
      queueId:     existing?.queueId ?? 0,
      queueName:   v.queueName,
      description: v.description,
      isActive:    v.isActive,
      modifiedBy,
    });
  }
}
