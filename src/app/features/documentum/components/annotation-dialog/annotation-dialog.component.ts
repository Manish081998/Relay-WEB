import {
  Component, ChangeDetectionStrategy,
  ViewChild, model, input, output, signal,
} from '@angular/core';
import type { Annotation } from '@adticorp/annot-core';
import { AnnotationViewerComponent } from '@adticorp/annot-angular';
import { Dialog } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-annotation-dialog',
  standalone: true,
  imports: [AnnotationViewerComponent, Dialog, ButtonDirective],
  templateUrl: './annotation-dialog.component.html',
  styleUrl: './annotation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationDialogComponent {
  @ViewChild('viewer') private readonly viewerRef?: AnnotationViewerComponent;

  readonly visible = model<boolean>(false);
  readonly title   = input<string>('View Document');
  readonly fileUrl = input<string | null>(null);
  readonly file    = input<File | null>(null);
  readonly mode    = input<'view' | 'upload'>('view');
  readonly author  = input<string>('Demo User');

  readonly annotationsChange = output<ReadonlyArray<Annotation>>();
  readonly saveComplete      = output<void>();
  /** Emits the annotated file blob + original filename when the user clicks Save */
  readonly saveBlob          = output<{ blob: Blob; filename: string }>();

  readonly saving = signal(false);

  close(): void {
    this.visible.set(false);
  }

  triggerUpload(): void {
    this.viewerRef?.saveAnnotated();
  }

  /** Save as new version — gets the annotated blob and emits it to the parent */
  async triggerSaveAsVersion(): Promise<void> {
    if (!this.viewerRef || this.saving()) return;
    this.saving.set(true);
    try {
      const result = await this.viewerRef.getAnnotatedBlob();
      if (result) {
        this.saveBlob.emit(result);
      }
    } catch (err) {
      console.error('[AnnotationDialog] save-as-version failed:', err);
    } finally {
      this.saving.set(false);
    }
  }

  /** Called when the viewer's toolbar Save button is clicked (emitSaveOnly mode) */
  onSaveRequested(event: { blob: Blob; filename: string }): void {
    this.saveBlob.emit(event);
  }

  onAnnotationsChange(updated: ReadonlyArray<Annotation>): void {
    this.annotationsChange.emit(updated);
  }

  onSaveComplete(): void {
    this.saveComplete.emit();
  }
}
