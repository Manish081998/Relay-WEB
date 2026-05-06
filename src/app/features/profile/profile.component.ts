import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

const CANVAS_SIZE = 360;
const CROP_RADIUS = 148;

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InitialsPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  readonly auth = inject(AuthStore);
  readonly user = this.auth.currentUser;

  readonly photoPreview = signal<string | null>(null);
  readonly showPasswordForm = signal(false);

  readonly oldPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly passwordMismatch = computed(
    () => this.confirmPassword().length > 0 && this.newPassword() !== this.confirmPassword(),
  );
  readonly canSubmitPassword = computed(
    () =>
      this.oldPassword().length > 0 &&
      this.newPassword().length > 0 &&
      this.confirmPassword().length > 0 &&
      !this.passwordMismatch(),
  );

  readonly profileMeta = { title: 'Senior Analyst', workLocation: 'New York, NY' };

  // ── Crop modal ────────────────────────────────────────────────────────────────

  readonly cropModalOpen = signal(false);
  readonly cropScale = signal(1);
  readonly cropOffsetX = signal(0);
  readonly cropOffsetY = signal(0);
  cropScaleMin = 0.5;
  cropScaleMax = 3;
  isDragging = false;

  private _dragStartX = 0;
  private _dragStartY = 0;
  private readonly _cropImg = new Image();

  readonly cropCanvas = viewChild<ElementRef<HTMLCanvasElement>>('cropCanvas');

  constructor() {
    // Re-render only when the modal/canvas first appears; drag+zoom render directly.
    effect(() => {
      const canvas = this.cropCanvas()?.nativeElement;
      if (!canvas || !this.cropModalOpen()) return;
      untracked(() =>
        this._render(canvas, this.cropScale(), this.cropOffsetX(), this.cropOffsetY()),
      );
    });
  }

  // ── File pick ─────────────────────────────────────────────────────────────────

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = ''; // allow re-selecting same file

    const reader = new FileReader();
    reader.onload = () => {
      this._cropImg.onload = () => {
        const minScale = Math.max(
          (CROP_RADIUS * 2) / this._cropImg.naturalWidth,
          (CROP_RADIUS * 2) / this._cropImg.naturalHeight,
        );
        this.cropScaleMin = minScale;
        this.cropScaleMax = minScale * 3.5;
        const imgW = this._cropImg.naturalWidth * minScale;
        const imgH = this._cropImg.naturalHeight * minScale;
        this.cropScale.set(minScale);
        this.cropOffsetX.set((CANVAS_SIZE - imgW) / 2);
        this.cropOffsetY.set((CANVAS_SIZE - imgH) / 2);
        this.cropModalOpen.set(true);
      };
      this._cropImg.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ── Canvas rendering ──────────────────────────────────────────────────────────

  private _render(canvas: HTMLCanvasElement, scale: number, ox: number, oy: number): void {
    const ctx = canvas.getContext('2d')!;
    const W = CANVAS_SIZE;
    const H = CANVAS_SIZE;
    const cx = W / 2;
    const cy = H / 2;
    const r = CROP_RADIUS;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, W, H);

    ctx.drawImage(
      this._cropImg,
      ox,
      oy,
      this._cropImg.naturalWidth * scale,
      this._cropImg.naturalHeight * scale,
    );

    // Vignette outside crop circle using evenodd fill
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(6, 8, 15, 0.72)';
    ctx.fill('evenodd');

    // Circle border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private _renderNow(): void {
    const canvas = this.cropCanvas()?.nativeElement;
    if (canvas) this._render(canvas, this.cropScale(), this.cropOffsetX(), this.cropOffsetY());
  }

  // ── Drag ──────────────────────────────────────────────────────────────────────

  onCropMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this._dragStartX = event.clientX - this.cropOffsetX();
    this._dragStartY = event.clientY - this.cropOffsetY();
    event.preventDefault();
  }

  onCropMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.cropOffsetX.set(event.clientX - this._dragStartX);
    this.cropOffsetY.set(event.clientY - this._dragStartY);
    this._renderNow();
  }

  onCropMouseUp(): void {
    this.isDragging = false;
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────

  onZoomChange(event: Event): void {
    const next = parseFloat((event.target as HTMLInputElement).value);
    this._applyZoom(next);
  }

  onZoomStep(delta: number): void {
    const next = Math.max(this.cropScaleMin, Math.min(this.cropScaleMax, this.cropScale() + delta));
    this._applyZoom(next);
  }

  private _applyZoom(next: number): void {
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const ratio = next / this.cropScale();
    this.cropOffsetX.set(cx + (this.cropOffsetX() - cx) * ratio);
    this.cropOffsetY.set(cy + (this.cropOffsetY() - cy) * ratio);
    this.cropScale.set(next);
    this._renderNow();
  }

  // ── Commit / cancel ───────────────────────────────────────────────────────────

  applyCrop(): void {
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = CROP_RADIUS;
    const out = 300;
    const off = document.createElement('canvas');
    off.width = out;
    off.height = out;
    const ctx = off.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
    ctx.clip();
    const scale = this.cropScale();
    const srcX = (cx - r - this.cropOffsetX()) / scale;
    const srcY = (cy - r - this.cropOffsetY()) / scale;
    const srcW = (2 * r) / scale;
    const srcH = (2 * r) / scale;
    ctx.drawImage(this._cropImg, srcX, srcY, srcW, srcH, 0, 0, out, out);
    this.photoPreview.set(off.toDataURL('image/png'));
    this.cropModalOpen.set(false);
  }

  cancelCrop(): void {
    this.cropModalOpen.set(false);
  }

  // ── Password form ─────────────────────────────────────────────────────────────

  togglePasswordForm(): void {
    const next = !this.showPasswordForm();
    this.showPasswordForm.set(next);
    if (!next) {
      this.oldPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
  }
}
