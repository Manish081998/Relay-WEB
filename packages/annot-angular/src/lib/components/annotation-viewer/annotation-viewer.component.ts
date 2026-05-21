/**
 * @file annotation-viewer.component.ts
 * Self-contained unified viewer: opens PDF / image / .eml files,
 * renders them, overlays the annotation canvas, and saves the result.
 *
 * Usage:
 *   <annot-viewer (saveComplete)="onSaved()"></annot-viewer>
 *
 * Or with a file bound programmatically:
 *   <annot-viewer [file]="myFile" author="Alice"></annot-viewer>
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  effect,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TOOL_IDS } from '@adticorp/annot-core';
import type { Annotation, ToolId } from '@adticorp/annot-core';
import * as pdfjsLib from 'pdfjs-dist';
import { AnnotatorComponent } from '../annotator/annotator.component';

import { AnnotationEngineService } from '../../services/annotation-engine.service';
import { KeyboardHandlerService } from '../../services/keyboard-handler.service';

import { PdfViewportAdapter } from '../../adapters/pdf-viewport-adapter';
import { ImageViewportAdapter } from '../../adapters/image-viewport-adapter';
import { EmailViewportAdapter } from '../../adapters/email-viewport-adapter';

import { detectContentType } from '../../utils/content-detector';
import type { ContentType } from '../../utils/content-detector';
import { parseEml } from '../../utils/eml-parser';
import { getPdfPageDimensions, flattenAnnotationsToPdf } from '../../utils/pdf-flattener';
import { flattenAnnotationsToImage } from '../../utils/image-flattener';

// ─── Highlight colour presets ─────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { base: '#FFCC00', fill: 'rgba(255,204,0,0.4)' },
  { base: '#34C759', fill: 'rgba(52,199,89,0.4)' },
  { base: '#FF2D55', fill: 'rgba(255,45,85,0.4)' },
  { base: '#007AFF', fill: 'rgba(0,122,255,0.4)' },
  { base: '#FF9500', fill: 'rgba(255,149,0,0.4)' },
  { base: '#5AC8FA', fill: 'rgba(90,200,250,0.4)' },
] as const;

const STROKE_COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#007AFF',
  '#5856D6',
  '#FF2D55',
  '#000000',
  '#636366',
] as const;

const STROKE_WIDTHS = [1, 2, 4, 6] as const;
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
@Component({
  standalone: true,
  imports: [NgIf, NgFor, AnnotatorComponent],
  selector: 'annot-viewer',
  templateUrl: './annotation-viewer.component.html',
  styleUrls: ['./annotation-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AnnotationEngineService, KeyboardHandlerService],
})
export class AnnotationViewerComponent implements AfterViewInit, OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────────────────────

  @Input() set file(f: File | null | undefined) {
    if (f) this.loadFile(f);
  }
  @Input() author = 'Anonymous';

  /** Pass a URL (from your document API) to auto-load without user interaction. */
  @Input() set fileUrl(url: string | null | undefined) {
    if (url) this.fetchAndLoad(url);
  }

  // ── Outputs ─────────────────────────────────────────────────────────────────

  @Output() annotationsChange = new EventEmitter<ReadonlyArray<Annotation>>();
  @Output() saveComplete = new EventEmitter<void>();
  /** Emits the annotated blob when the toolbar Save button is clicked (instead of downloading). */
  @Output() saveRequested = new EventEmitter<{ blob: Blob; filename: string }>();

  /** When true, the toolbar Save button emits saveRequested instead of triggering a browser download. */
  @Input() emitSaveOnly = false;

  // ── ViewChild refs ──────────────────────────────────────────────────────────

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollArea') private scrollAreaRef?: ElementRef<HTMLElement>;
  @ViewChild('imgEl') imgElRef?: ElementRef<HTMLImageElement>;
  @ViewChild('emailFrame') emailFrameRef?: ElementRef<HTMLIFrameElement>;
  @ViewChild('pdfCanvas') pdfCanvasRef!: ElementRef<HTMLCanvasElement>;
  // Each annotator is in a separate *ngIf block; only one is in the DOM at a time.
  @ViewChild('pdfAnnot') pdfAnnot?: AnnotatorComponent;
  @ViewChild('imgAnnot') imgAnnot?: AnnotatorComponent;
  @ViewChild('emailAnnot') emailAnnot?: AnnotatorComponent;

  // ── Public state (used in template) ─────────────────────────────────────────

  readonly TOOL_IDS = TOOL_IDS;
  readonly HIGHLIGHT_COLORS = HIGHLIGHT_COLORS;
  readonly STROKE_COLORS = STROKE_COLORS;
  readonly STROKE_WIDTHS = STROKE_WIDTHS;

  readonly contentType = signal<ContentType | null>(null);
  readonly zoom = signal(1);
  readonly annotationCount = signal(0);
  readonly savedFeedback = signal(false);
  readonly activeToolId = signal<ToolId>(TOOL_IDS.SELECT);
  readonly activeHlBase = signal('#FFCC00');
  readonly activeStroke = signal('#007AFF');
  readonly activeWidth = signal(2);

  // PDF-specific
  readonly pdfPageWidth = signal(595);
  readonly pdfPageHeight = signal(842);
  readonly pageCount = signal(1);
  readonly currentPage = signal(1);
  // readonly pdfSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly pageWidthPx = signal(595);
  readonly pageHeightPx = signal(842);
  readonly pdfAdapter = new PdfViewportAdapter();

  // Image-specific
  readonly imgNaturalW = signal(800);
  readonly imgNaturalH = signal(600);
  readonly imgSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly imageAdapter = new ImageViewportAdapter();

  // Email-specific
  readonly emailSrcdoc = signal('');
  readonly emailW = signal(800);
  readonly emailH = signal(1200);
  readonly emailAdapter = new EmailViewportAdapter();

  // Document ID changes per file so annotations are isolated per file
  readonly docId = signal('av-doc-1');
  readonly fetching = signal(false);

  // Stores the "fit to container" zoom so 100% always means no-scroll
  private readonly _fitZoom = signal(1);

  // ── Private ──────────────────────────────────────────────────────────────────

  private blobUrl: string | null = null;
  private currentFile: File | null = null;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);

  private pdfDoc: any = null;
  private _pdfNativeW = 0;
  private _pdfNativeH = 0;
  ngAfterViewInit(): void {
    /* adapters are set up in loadFile() */
  }

  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  // ── File loading ──────────────────────────────────────────────────────────────

  triggerFileOpen(): void {
    this.fileInputRef?.nativeElement.click();
  }

  // private async fetchAndLoad(url: string): Promise<void> {
  //   debugger
  //   this.fetching.set(true);
  //   this.cdr.markForCheck();
  //   try {
  //     const res = await fetch(url);
  //     const blob = await res.blob();
  //     const name = url.split('/').pop()?.split('?')[0] ?? 'document';
  //     await this.loadFile(new File([blob], name, { type: blob.type }));
  //   } catch (err) {
  //     console.error('[AnnotationViewer] failed to fetch file:', err);
  //   } finally {
  //     this.fetching.set(false);
  //     this.cdr.markForCheck();
  //   }
  // }

private async fetchAndLoad(url: string): Promise<void> {
  this.fetching.set(true);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('File not found');
    }

    const blob = await res.blob();

    console.log('📦 Blob type:', blob.type);

    const name = url.split('/').pop()?.split('?')[0] ?? 'document';

    // 🔥 Step 1: Normalize file type
    let fileType = blob.type;

    // Some servers return wrong type (octet-stream or empty)
    if (!fileType || fileType === 'application/octet-stream') {
      if (name.toLowerCase().endsWith('.pdf')) {
        fileType = 'application/pdf';
      } else if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        fileType = 'image/*';
      } else if (name.toLowerCase().endsWith('.eml')) {
        fileType = 'message/rfc822';
      }
    }

    // 🔥 Step 2: Validate supported types
    const isPdf   = fileType.includes('pdf');
    const isImage = fileType.includes('image');
    const isEmail = fileType.includes('message') || name.endsWith('.eml');

    if (!isPdf && !isImage && !isEmail) {
      console.error('❌ Unsupported file type:', fileType);
      alert('Unsupported file type');
      return;
    }

    // 🔥 Step 3: Create proper file
    const file = new File([blob], name, { type: fileType });

    // 🔥 Step 4: Load into viewer
    await this.loadFile(file);

  } catch (err) {
    console.error('❌ ERROR LOADING FILE:', err);
  } finally {
    this.fetching.set(false);
  }
}

  onFileInputChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  private async loadFile(file: File): Promise<void> {
    this.currentFile = file;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = URL.createObjectURL(file);

    // New file → new docId so previous annotations don't bleed through
    this.docId.set(`av-${file.name}-${Date.now()}`);
    this.annotationCount.set(0);
    this.zoom.set(1);

    const type = detectContentType(file);
    this.contentType.set(type);

    switch (type) {
      case 'pdf':
        await this.initPdf(file);
        break;
      case 'image':
        this.initImage();
        break;
      case 'email':
        await this.initEmail(file);
        break;
      default:
        alert(`Unsupported file type: ${file.name}`);
        this.contentType.set(null);
    }
    this.cdr.markForCheck();
  }

  // ── PDF init ──────────────────────────────────────────────────────────────────

  // private async initPdf(file: File): Promise<void> {
  //   const bytes = await file.arrayBuffer();
  //   const dims = await getPdfPageDimensions(bytes);
  //   const count = await this.detectPdfPageCount(file);
  //   const first = dims[0] ?? { width: 595, height: 842 };

  //   this.pdfPageWidth.set(first.width);
  //   this.pdfPageHeight.set(first.height);
  //   this.pageCount.set(count);
  //   this.updatePdfLayout();

  //   const safe = this.sanitizer.bypassSecurityTrustResourceUrl(
  //     this.blobUrl! + '#toolbar=0&navpanes=0',
  //   );
  //   this.pdfSafeUrl.set(safe);
  // }

//   private async initPdf(file: File): Promise<void> {
//     debugger
//   const bytes = await file.arrayBuffer();
//   const dims = await getPdfPageDimensions(bytes);
//   const count = await this.detectPdfPageCount(file);
//   const first = dims[0] ?? { width: 595, height: 842 };

//   this.pdfPageWidth.set(first.width);
//   this.pdfPageHeight.set(first.height);
//   this.pageCount.set(count);
//   this.updatePdfLayout();

//   // ✅ REMOVE iframe params (#toolbar etc)
//   // this.pdfSafeUrl.set(
//   //   this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl!)
//   // );
// }



private async initPdf(file: File): Promise<void> {
  const bytes = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  this.pdfDoc = await loadingTask.promise;
  this.pageCount.set(this.pdfDoc.numPages);

  // Measure first page to compute fit zoom
  const firstPage = await this.pdfDoc.getPage(1);
  const nativeViewport = firstPage.getViewport({ scale: 1 });
  this._pdfNativeW = nativeViewport.width;
  this._pdfNativeH = nativeViewport.height;

  const container = this.scrollAreaRef?.nativeElement;
  let fitZ = 1;
  if (container && nativeViewport.width > 0) {
    const availW = container.clientWidth - 48;
    if (availW > 0) {
      fitZ = Math.max(0.1, Math.min(2, availW / nativeViewport.width));
    }
  }
  this._fitZoom.set(fitZ);
  this.zoom.set(fitZ);

  await this.renderAllPages();
}

private async renderAllPages(): Promise<void> {
  if (!this.pdfDoc) return;
  const numPages = this.pdfDoc.numPages;
  const z = this.zoom();
  const gap = 16;

  // Pass 1: measure all pages at current zoom
  const pages: Array<{ page: any; viewport: any; nativeVp: any }> = [];
  let maxWidth = 0;
  let totalHeight = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await this.pdfDoc.getPage(i);
    const nativeVp = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: z });
    pages.push({ page, viewport, nativeVp });
    maxWidth = Math.max(maxWidth, viewport.width);
    totalHeight += viewport.height + (i < numPages ? gap : 0);
  }

  this.pageWidthPx.set(maxWidth);
  this.pageHeightPx.set(totalHeight);

  // Size the single shared canvas
  const canvas = this.pdfCanvasRef.nativeElement;
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, maxWidth, totalHeight);

  // Pass 2: render each page at its Y offset and build adapter layouts
  const layouts: Array<{
    docWidth: number; docHeight: number;
    screenX: number; screenY: number;
    screenWidth: number; screenHeight: number;
  }> = [];
  let y = 0;

  for (let i = 0; i < pages.length; i++) {
    const { page, viewport, nativeVp } = pages[i];

    // Render to an offscreen canvas then blit at the correct Y position
    const offscreen = document.createElement('canvas');
    offscreen.width = viewport.width;
    offscreen.height = viewport.height;
    const offCtx = offscreen.getContext('2d')!;
    await page.render({ canvasContext: offCtx, viewport }).promise;
    ctx.drawImage(offscreen, 0, y);

    // Draw a subtle separator between pages
    if (i < pages.length - 1) {
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(0, y + viewport.height, maxWidth, gap);
    }

    layouts.push({
      docWidth: nativeVp.width,
      docHeight: nativeVp.height,
      screenX: 0,
      screenY: y,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });

    y += viewport.height + gap;
  }

  this.pdfAdapter.setPageLayouts(layouts);
  this.cdr.markForCheck();
}

  // private updatePdfLayout(): void {
  //   const z = this.zoom();
  //   this.pageWidthPx.set(Math.round(this.pdfPageWidth() * z));
  //   this.pageHeightPx.set(Math.round(this.pdfPageHeight() * this.pageCount() * z));
  //   this.pdfAdapter.setPageLayouts([
  //     {
  //       docWidth: this.pdfPageWidth(),
  //       docHeight: this.pdfPageHeight() * this.pageCount(),
  //       screenX: 0,
  //       screenY: 0,
  //       screenWidth: this.pageWidthPx(),
  //       screenHeight: this.pageHeightPx(),
  //     },
  //   ]);
  // }

  private async detectPdfPageCount(file: File): Promise<number> {
    try {
      const buf = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(buf);
      const hits = [...text.matchAll(/\/Count\s+(\d+)/g)];
      if (!hits.length) return 1;
      return Math.max(...hits.map((m) => parseInt(m[1]!, 10)));
    } catch {
      return 1;
    }
  }

  // ── Image init ────────────────────────────────────────────────────────────────

  private initImage(): void {
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl!);
    this.imgSafeUrl.set(safe);
    // Dimensions are read in onImageLoad() after the <img> renders
  }

  onImageLoad(): void {
    const img = this.imgElRef?.nativeElement;
    if (!img) return;
    const w = img.naturalWidth || 800;
    const h = img.naturalHeight || 600;
    this.imgNaturalW.set(w);
    this.imgNaturalH.set(h);

    // Fit the image to the scroll area on first load.
    // Scroll area has 24px padding on all sides → subtract 48px per axis.
    const container = this.scrollAreaRef?.nativeElement;
    if (container && w > 0 && h > 0) {
      const availW = container.clientWidth - 48;
      const availH = container.clientHeight - 48;
      if (availW > 0 && availH > 0) {
        // Never upscale past natural size (cap at 1); floor at 0.05 for safety.
        const fitZoom = Math.max(0.05, Math.min(1, availW / w, availH / h));
        this._fitZoom.set(fitZoom);
        this.zoom.set(fitZoom);
      }
    }

    this.imageAdapter.setRenderedSize(Math.round(w * this.zoom()), w, h);
    this.cdr.markForCheck();
  }

  // ── Email init ────────────────────────────────────────────────────────────────

  private async initEmail(file: File): Promise<void> {
    const name = file.name.toLowerCase();

    if (name.endsWith('.msg')) {
      // .msg is a proprietary binary format; surface a readable error card
      this.emailSrcdoc.set(msgPlaceholderHtml(file.name));
    } else {
      const text = await file.text();
      const parsed = parseEml(text);
      this.emailSrcdoc.set(buildEmailHtml(parsed));
    }

    this.emailW.set(800);
    this.emailH.set(1200);
    this.emailAdapter.setDocSize(800, 1200);
    this.emailAdapter.setZoom(this.zoom());
  }

  onEmailLoad(): void {
    const frame = this.emailFrameRef?.nativeElement;
    if (!frame?.contentDocument?.body) return;
    // Measure actual rendered height and extend the adapter
    const h = Math.max(frame.contentDocument.body.scrollHeight, 400);
    this.emailH.set(h);
    this.emailAdapter.setDocSize(this.emailW(), h);
    this.cdr.markForCheck();
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────

   async setZoom(factor: number): Promise<void>  {
    const next = Math.max(0.25, Math.min(4, this.zoom() * factor));
    this.zoom.set(next);

    switch (this.contentType()) {
      case 'pdf': {
        await this.renderAllPages();
        break;
      }
      case 'image': {
        const w = Math.round(this.imgNaturalW() * next);
        this.imageAdapter.setRenderedSize(w, this.imgNaturalW(), this.imgNaturalH());
        break;
      }
      case 'email':
        this.emailAdapter.setZoom(next);
        break;
    }
    this.cdr.markForCheck();
  }

  zoomPct(): string {
    const fit = this._fitZoom();
    return (this.zoom() / (fit > 0 ? fit : 1) * 100).toFixed(0);
  }

  async resetZoom(): Promise<void> {
    const fit = this._fitZoom();
    this.zoom.set(fit);
    switch (this.contentType()) {
      case 'pdf': {
        await this.renderAllPages();
        break;
      }
      case 'image': {
        const w = this.imgNaturalW();
        const h = this.imgNaturalH();
        this.imageAdapter.setRenderedSize(Math.round(w * fit), w, h);
        break;
      }
      case 'email':
        this.emailAdapter.setZoom(fit);
        break;
    }
    this.cdr.markForCheck();
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────────

  get annotator(): AnnotatorComponent | undefined {
    return this.pdfAnnot ?? this.imgAnnot ?? this.emailAnnot;
  }

  selectTool(id: ToolId): void {
    this.activeToolId.set(id);
    this.annotator?.engine.selectTool(id);
    if (id === TOOL_IDS.HIGHLIGHT) {
      const hc =
        HIGHLIGHT_COLORS.find((c) => c.base === this.activeHlBase()) ?? HIGHLIGHT_COLORS[0]!;
      this.annotator?.engine.setStyle({ fillColor: hc.fill, strokeColor: 'transparent' });
    } else {
      // Highlight sets strokeColor:'transparent' in the engine's active style.
      // Restore the user's current stroke color when switching to any other tool
      // so stroke-only tools (freehand, line, arrow) remain visible.
      this.annotator?.engine.setStyle({
        strokeColor: this.activeStroke(),
        strokeWidth: this.activeWidth(),
      });
    }
  }

  onCustomHighlightColor(hex: string): void {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    this.setHighlightColor(hex, `rgba(${r},${g},${b},0.4)`);
  }

  setHighlightColor(base: string, fill: string): void {
    this.activeHlBase.set(base);
    this.annotator?.engine.setStyle({ fillColor: fill, strokeColor: 'transparent' });
    this.annotator?.engine.applyStyleToSelected({ fillColor: fill, strokeColor: 'transparent' });
  }

  setStrokeColor(color: string): void {
    this.activeStroke.set(color);
    this.annotator?.engine.setStyle({ strokeColor: color });
    this.annotator?.engine.applyStyleToSelected({ strokeColor: color });
  }

  setStrokeWidth(w: number): void {
    this.activeWidth.set(w);
    this.annotator?.engine.setStyle({ strokeWidth: w });
    this.annotator?.engine.applyStyleToSelected({ strokeWidth: w });
  }

  undo(): void {
    this.annotator?.engine.undo();
  }
  redo(): void {
    this.annotator?.engine.redo();
  }
  canUndo(): boolean {
    return this.annotator?.engine.canUndo() ?? false;
  }
  canRedo(): boolean {
    return this.annotator?.engine.canRedo() ?? false;
  }
  hasSelection(): boolean {
    return (this.annotator?.engine.selectedIds().size ?? 0) > 0;
  }
  deleteSelected(): void {
    this.annotator?.engine.deleteSelected();
  }

  showColorRow(): boolean {
    const t = this.activeToolId();
    return t !== TOOL_IDS.SELECT && t !== TOOL_IDS.ERASER;
  }
  showWidthPicker(): boolean {
    const t = this.activeToolId();
    return t !== TOOL_IDS.SELECT && t !== TOOL_IDS.ERASER && t !== TOOL_IDS.HIGHLIGHT;
  }

  onAnnotationsChange(annotations: ReadonlyArray<Annotation>): void {
    this.annotationCount.set(annotations.length);
    this.annotationsChange.emit(annotations);
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async saveAnnotated(): Promise<void> {
    const type = this.contentType();
    if (!type || !this.blobUrl) return;

    try {
      // If emitSaveOnly is true, get the blob and emit it instead of downloading
      if (this.emitSaveOnly) {
        const result = await this.getAnnotatedBlob();
        if (result) {
          this.saveRequested.emit(result);
          this.flashSaved();
        }
        return;
      }

      switch (type) {
        case 'pdf':
          await this.savePdf();
          break;
        case 'image':
          await this.saveImage();
          break;
        case 'email':
          this.saveEmail();
          break;
      }
      this.flashSaved();
    } catch (err) {
      console.error('[AnnotationViewer] save failed:', err);
    }
  }

  /** Returns the annotated file as a Blob + filename without triggering a download. */
  async getAnnotatedBlob(): Promise<{ blob: Blob; filename: string } | null> {
    const type = this.contentType();
    if (!type || !this.blobUrl) return null;

    switch (type) {
      case 'pdf': {
        const annotations = this.annotator?.engine.store.getAll() ?? [];
        const response = await fetch(this.blobUrl!);
        const bytes = await response.arrayBuffer();
        const out = await flattenAnnotationsToPdf(bytes, annotations);
        return {
          blob: new Blob([out as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
          filename: this.currentFile?.name ?? 'document.pdf',
        };
      }
      case 'image': {
        const img = this.imgElRef?.nativeElement;
        if (!img) return null;
        const annotations = this.annotator?.engine.store.getAll() ?? [];
        const blob = await flattenAnnotationsToImage(img, annotations);
        return {
          blob,
          filename: this.currentFile?.name ?? 'document.png',
        };
      }
      case 'email': {
        const annotations = this.annotator?.engine.store.getAll() ?? [];
        const json = JSON.stringify({ file: this.currentFile?.name, annotations }, null, 2);
        return {
          blob: new Blob([json], { type: 'application/json' }),
          filename: this.baseName() + '-annotations.json',
        };
      }
      default:
        return null;
    }
  }

  private async savePdf(): Promise<void> {
    const annotations = this.annotator?.engine.store.getAll() ?? [];
    const response = await fetch(this.blobUrl!);
    const bytes = await response.arrayBuffer();
    const out = await flattenAnnotationsToPdf(bytes, annotations);
    this.downloadBlob(
      new Blob([out as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
      this.baseName() + '-annotated.pdf',
    );
  }

  private async saveImage(): Promise<void> {
    const img = this.imgElRef?.nativeElement;
    if (!img) return;
    const annotations = this.annotator?.engine.store.getAll() ?? [];
    const blob = await flattenAnnotationsToImage(img, annotations);
    this.downloadBlob(blob, this.baseName() + '-annotated.png');
  }

  private saveEmail(): void {
    const annotations = this.annotator?.engine.store.getAll() ?? [];
    const json = JSON.stringify({ file: this.currentFile?.name, annotations }, null, 2);
    this.downloadBlob(
      new Blob([json], { type: 'application/json' }),
      this.baseName() + '-annotations.json',
    );
  }

  private baseName(): string {
    const name = this.currentFile?.name ?? 'document';
    return name.replace(/\.[^.]+$/, '');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  private flashSaved(): void {
    this.savedFeedback.set(true);
    this.saveComplete.emit();
    setTimeout(() => {
      this.savedFeedback.set(false);
      this.cdr.markForCheck();
    }, 2500);
  }
}

// ─── Email HTML builders ──────────────────────────────────────────────────────

function buildEmailHtml(p: ReturnType<typeof parseEml>): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         background: #fff; color: #1c1c1e; }
  .header { padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
  .meta { font-size: 12px; color: #636366; margin-top: 4px; }
  .subject { font-size: 16px; font-weight: 700; margin: 6px 0; }
  .body { padding: 20px; font-size: 14px; line-height: 1.7; }
</style>
</head>
<body>
<div class="header">
  <div class="meta">From: ${esc(p.from)}</div>
  <div class="meta">To: ${esc(p.to)}</div>
  <div class="subject">${esc(p.subject)}</div>
  <div class="meta">${esc(p.date)}</div>
</div>
<div class="body">${p.html}</div>
</body></html>`;
}

function msgPlaceholderHtml(filename: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:sans-serif;padding:32px;color:#636366;text-align:center;}</style>
</head><body>
<p style="font-size:48px">📧</p>
<h2 style="margin:12px 0 8px;color:#1c1c1e">${esc(filename)}</h2>
<p>.msg (Outlook binary) files require a dedicated parser.<br>
Convert to <strong>.eml</strong> format to annotate the email content.<br>
You can still add annotations using the overlay tools above.</p>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
