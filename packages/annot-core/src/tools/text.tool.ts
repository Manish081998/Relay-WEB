/**
 * @file text.tool.ts
 * Text annotation tool.
 *
 * Click anywhere → creates a text box at that position.
 * Click on existing text annotation → re-opens its editor.
 * Double-click on existing text annotation → same as single-click.
 *
 * Text editing is delegated to a positioned <textarea> element
 * (created by the renderer layer) because native browser text
 * editing handles IME, accessibility, and platform conventions
 * better than a Canvas-drawn text editor.
 */

import type { Tool, ToolContext, ToolPointerEvent, ToolCursor } from './tool.interface.js';
import { TOOL_IDS } from './tool.interface.js';
import type { Command } from '../commands/command.interface.js';
import type { Point } from '../model/annotation.model.js';
import { DEFAULT_TEXT_STYLE } from '../model/annotation.model.js';
import { AddAnnotationCommand, UpdateAnnotationCommand } from '../commands/annotation-commands.js';
import { hitTestAll } from '../geometry/hit-test.js';
import { buildAnnotation, sanitiseText } from './tool-helpers.js';

const DEFAULT_TEXT_WIDTH = 160;
const DEFAULT_TEXT_HEIGHT = 40;

export class TextTool implements Tool {
  readonly id = TOOL_IDS.TEXT;
  readonly name = 'Text';
  readonly cursor: ToolCursor = 'text';

  private drawing = false;
  private startPoint: Point | null = null;
  private currentPoint: Point | null = null;
  /** ID of a text annotation hit-tested in onPointerDown – used in onPointerUp */
  private _downHitId: string | null = null;
  /** True while the renderer's textarea editor is visible */
  private _editorOpen = false;

  /** Emit this event so the renderer can position the textarea editor */
  onRequestTextEdit?: (annotationId: string) => void;
  /** Called back by the renderer when the text editor is shown */
  onTextEditorShown?: () => void;
  /** Called back by the renderer when the text editor is dismissed */
  onTextEditorClosed?: () => void;

  activate(_ctx: ToolContext): void { this.reset(); }
  deactivate(_ctx: ToolContext): void { this.reset(); }

  private reset(): void {
    this.drawing = false;
    this.startPoint = null;
    this.currentPoint = null;
    this._downHitId = null;
    this._editorOpen = false;
  }

  /** Called by the renderer when its textarea editor becomes visible */
  notifyEditorShown(): void {
    this._editorOpen = true;
  }

  /** Called by the renderer whenever the text editor is dismissed */
  notifyEditorClosed(): void {
    this._editorOpen = false;
  }

  onPointerDown(evt: ToolPointerEvent, ctx: ToolContext): Command | null {
    // If the editor is currently open this click is dismissing it.
    // Swallow the pointer cycle so we don't create a new annotation on pointer-up.
    if (this._editorOpen) {
      this._editorOpen = false;
      this.drawing = false;
      this._downHitId = null;
      return null;
    }

    // Pre-detect if the user is clicking on an existing text annotation.
    // Storing the ID here (on pointer-down) is more reliable than re-running
    // the hit-test on pointer-up where the coordinates may differ slightly.
    this._downHitId = null;
    const tol = 8 / ctx.adapter.getViewportTransform().zoom;
    const hits = hitTestAll(evt.docPoint, ctx.store.getByPage(evt.pageIndex), tol);
    const existingText = hits.find(h => h.type === 'text');
    if (existingText) {
      this._downHitId = existingText.id;
      ctx.setSelectedIds(new Set([existingText.id]));
    } else {
      ctx.setSelectedIds(new Set());
    }

    this.startPoint = evt.docPoint;
    this.currentPoint = evt.docPoint;
    this.drawing = true;
    return null;
  }

  onPointerMove(evt: ToolPointerEvent, ctx: ToolContext): Command | null {
    if (this.drawing) {
      this.currentPoint = evt.docPoint;
      ctx.requestRedraw();
    }
    return null;
  }

  onPointerUp(evt: ToolPointerEvent, ctx: ToolContext): Command | null {
    if (!this.drawing || !this.startPoint) return null;
    this.drawing = false;

    const dx = Math.abs(evt.docPoint.x - this.startPoint.x);
    const dy = Math.abs(evt.docPoint.y - this.startPoint.y);
    const wasDrag = dx > 8 || dy > 8;

    const hitId = this._downHitId;
    this._downHitId = null;

    // Single click on an existing text annotation → open its editor
    if (!wasDrag && hitId) {
      const existing = ctx.store.getById(hitId);
      if (existing && existing.geometry.kind === 'rect') {
        ctx.setSelectedIds(new Set([existing.id]));
        this.reset();
        const id = existing.id;
        setTimeout(() => this.onRequestTextEdit?.(id), 0);
        return null;
      }
    }

    const rect = wasDrag
      ? {
          x: Math.min(this.startPoint.x, evt.docPoint.x),
          y: Math.min(this.startPoint.y, evt.docPoint.y),
          width: Math.max(dx, 40),
          height: Math.max(dy, 20),
        }
      : {
          x: this.startPoint.x,
          y: this.startPoint.y,
          width: DEFAULT_TEXT_WIDTH,
          height: DEFAULT_TEXT_HEIGHT,
        };

    const style = { ...DEFAULT_TEXT_STYLE, ...ctx.activeStyle };
    const geometry = { kind: 'rect' as const, rect };
    const annotation = buildAnnotation(
      ctx.docId, ctx.pageIndex, 'text', ctx.author, style, geometry, ''
    );

    const cmd = new AddAnnotationCommand(ctx.store, annotation);
    this.reset();
    ctx.setSelectedIds(new Set([annotation.id]));

    // Defer so the command is committed to the store before the editor opens
    const id = annotation.id;
    setTimeout(() => this.onRequestTextEdit?.(id), 0);
    return cmd;
  }

  onDoubleClick(evt: ToolPointerEvent, ctx: ToolContext): Command | null {
    const annotations = ctx.store.getByPage(evt.pageIndex);
    const tol = 8 / ctx.adapter.getViewportTransform().zoom;
    const hits = hitTestAll(evt.docPoint, annotations, tol);
    const textAnnotation = hits.find(h => h.type === 'text');
    if (textAnnotation && textAnnotation.geometry.kind === 'rect') {
      this.onRequestTextEdit?.(textAnnotation.id);
    }
    return null;
  }

  drawOverlay(ctx2d: CanvasRenderingContext2D, ctx: ToolContext): void {
    if (!this.drawing || !this.startPoint || !this.currentPoint) return;
    const { zoom, panX, panY } = ctx.adapter.getViewportTransform();
    const toS = (p: Point): Point => ({ x: p.x * zoom + panX, y: p.y * zoom + panY });
    const s = toS(this.startPoint), e = toS(this.currentPoint);

    ctx2d.save();
    ctx2d.strokeStyle = '#007AFF';
    ctx2d.lineWidth = 1;
    ctx2d.setLineDash([4, 3]);
    ctx2d.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x) || DEFAULT_TEXT_WIDTH * zoom, Math.abs(e.y - s.y) || DEFAULT_TEXT_HEIGHT * zoom);
    ctx2d.restore();
  }

  /** Called by renderer when user confirms/blurs the text editor */
  commitTextEdit(annotationId: string, text: string, ctx: ToolContext): Command | null {
    const safe = sanitiseText(text);
    return new UpdateAnnotationCommand(ctx.store, annotationId, {
      meta: { text: safe },
    });
  }
}
