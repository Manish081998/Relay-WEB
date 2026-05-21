/**
 * @file annotation-engine.service.ts
 * The central Angular service that wires together the core engine,
 * renderer, and all tool instances.
 *
 * It is provided at the component level (via `providers` on
 * AnnotatorComponent) so each annotator instance gets its own engine.
 *
 * RESPONSIBILITIES
 *  - Own the AnnotationStore and CommandStack
 *  - Create and hold all Tool instances
 *  - Bridge Angular (Signals / Observables) ↔ core engine events
 *  - Expose an imperative API for Angular components
 */

import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import {
  AnnotationStore,
  CommandStack,
  SelectTool,
  ShapeTool,
  FreehandTool,
  FreehandHighlightTool,
  TextTool,
  CommentTool,
  EraserTool,
  TOOL_IDS,
  DEFAULT_STYLE,
  exportToJson,
  importFromJson,
  downloadJson,
  importFromFile,
  StyleAnnotationsCommand,
  RemoveAnnotationsCommand,
} from '@adticorp/annot-core';
import type {
  Tool,
  ToolId,
  Annotation,
  AnnotationStyle,
  ViewportAdapter,
  Command,
  CommandStackState,
} from '@adticorp/annot-core';
import { CanvasRenderer } from '@adticorp/annot-renderer';

@Injectable()
export class AnnotationEngineService implements OnDestroy {
  // ─── Store & Commands ────────────────────────────────────────────────────
  readonly store = new AnnotationStore();
  readonly commandStack = new CommandStack();

  // ─── Signals ─────────────────────────────────────────────────────────────
  readonly activeToolId = signal<ToolId>(TOOL_IDS.SELECT);
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  readonly activeStyle = signal<AnnotationStyle>({ ...DEFAULT_STYLE });
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  readonly annotations = signal<ReadonlyArray<Annotation>>([]);

  // ─── Tools ───────────────────────────────────────────────────────────────
  private readonly tools = new Map<ToolId, Tool>([
    [TOOL_IDS.SELECT,    new SelectTool()],
    [TOOL_IDS.HIGHLIGHT, new FreehandHighlightTool()],
    [TOOL_IDS.FREEHAND,  new FreehandTool()],
    [TOOL_IDS.TEXT,      new TextTool()],
    [TOOL_IDS.COMMENT,   new CommentTool()],
    [TOOL_IDS.RECTANGLE, new ShapeTool('rectangle')],
    [TOOL_IDS.ELLIPSE,   new ShapeTool('ellipse')],
    [TOOL_IDS.ARROW,     new ShapeTool('arrow')],
    [TOOL_IDS.LINE,      new ShapeTool('line')],
    [TOOL_IDS.ERASER,    new EraserTool()],
  ]);

  renderer: CanvasRenderer | null = null;
  private _docId = '';
  private _author = 'Anonymous';
  private readonly unsubs: Array<() => void> = [];

  // ─── Initialise renderer ─────────────────────────────────────────────────

  /**
   * Call this from AnnotatorComponent.ngAfterViewInit once the
   * host container element is available.
   */
  init(container: HTMLElement, adapter: ViewportAdapter, docId: string, author: string): void {
    this._docId = docId;
    this._author = author;

    if (this.renderer) {
      this.renderer.destroy();
    }

    this.renderer = new CanvasRenderer({
      container,
      store: this.store,
      adapter,
      author,
      docId,
    });

    this.renderer.onExecuteCommand = (cmd: Command) => this.executeCommand(cmd);
    this.renderer.onSelectionChange = (ids: ReadonlySet<string>) => {
      this.selectedIds.set(ids);
    };

    // Sync tool to renderer
    const initialTool = this.tools.get(this.activeToolId())!;
    this.renderer.setActiveTool(initialTool);

    // Wire text tool's edit callback so it opens the textarea in the renderer
    const textTool = this.tools.get(TOOL_IDS.TEXT) as TextTool;
    if (textTool) {
      textTool.onRequestTextEdit = (id: string) => this.renderer?.showTextEditor(id);
      this.renderer.onTextEditorShown  = () => textTool.notifyEditorShown();
      this.renderer.onTextEditorHidden = () => textTool.notifyEditorClosed();
    }

    // Wire comment tool's edit callback so it opens the comment popup in the renderer
    const commentTool = this.tools.get(TOOL_IDS.COMMENT) as CommentTool;
    if (commentTool) {
      commentTool.onRequestCommentEdit = (id: string) => this.renderer?.showCommentEditor(id);
    }

    // Wire select tool double-click so text/comment annotations can be re-edited
    // without having to switch tools first
    const selectTool = this.tools.get(TOOL_IDS.SELECT) as SelectTool;
    if (selectTool) {
      selectTool.onRequestTextEdit    = (id: string) => this.renderer?.showTextEditor(id);
      selectTool.onRequestCommentEdit = (id: string) => this.renderer?.showCommentEditor(id);
    }

    // Subscribe to store for signals
    this.unsubs.push(
      this.store.on('add', () => this.syncAnnotations()),
      this.store.on('update', () => this.syncAnnotations()),
      this.store.on('remove', () => this.syncAnnotations()),
      this.store.on('reset', () => this.syncAnnotations()),
    );

    // Subscribe to command stack
    this.unsubs.push(
      this.commandStack.on((state: CommandStackState) => {
        this.canUndo.set(state.canUndo);
        this.canRedo.set(state.canRedo);
      })
    );

    // Subscribe to pointer-event commands from renderer
    // (renderer calls execute() on the engine service via callback above)
  }

  // ─── Tool management ─────────────────────────────────────────────────────

  selectTool(id: ToolId): void {
    this.activeToolId.set(id);
    const tool = this.tools.get(id);
    if (tool && this.renderer) {
      this.renderer.setActiveTool(tool);
    }
  }

  getTool(id: ToolId): Tool | undefined {
    return this.tools.get(id);
  }

  // ─── Style ───────────────────────────────────────────────────────────────

  setStyle(patch: Partial<AnnotationStyle>): void {
    this.activeStyle.set({ ...this.activeStyle(), ...patch });
    this.renderer?.setActiveStyle(this.activeStyle());
  }

  applyStyleToSelected(patch: Partial<AnnotationStyle>): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.executeCommand(new StyleAnnotationsCommand(this.store, ids, patch));
  }

  // ─── Selection ───────────────────────────────────────────────────────────

  selectAll(pageIndex: number): void {
    const ids = new Set(this.store.getByPage(pageIndex).map(a => a.id));
    this.selectedIds.set(ids);
    this.renderer?.setSelectedIds(ids);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.renderer?.setSelectedIds(new Set());
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.executeCommand(new RemoveAnnotationsCommand(this.store, ids));
    this.clearSelection();
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  undo(): void { this.commandStack.undo(); }
  redo(): void { this.commandStack.redo(); }

  executeCommand(cmd: Command): void {
    this.commandStack.execute(cmd);
    this.syncAnnotations();
    this.renderer?.markBaseDirty();
    this.renderer?.markSelectionDirty();
  }

  // ─── Document I/O ────────────────────────────────────────────────────────

  /** Load annotations from a JSON string (clears current state) */
  loadFromJson(json: string): void {
    const { document: doc, warnings } = importFromJson(json);
    this.store.loadDocument(doc.docId, doc.annotations);
    this.commandStack.clear();
    this.clearSelection();
    if (warnings.length > 0) {
      console.warn('[AnnotationEngine] Import warnings:', warnings);
    }
  }

  /** Open a file picker and import JSON annotations */
  async importAnnotations(): Promise<void> {
    const result = await importFromFile();
    this.loadFromJson(exportToJson(result.document.docId, result.document.annotations));
  }

  /** Export all annotations to a JSON string */
  exportToJson(): string {
    return exportToJson(this._docId, this.store.getAll());
  }

  /** Download annotations as a JSON file */
  downloadAnnotations(filename?: string): void {
    downloadJson(this._docId, this.store.getAll(), filename);
  }

  /** Save annotations to localStorage */
  saveToLocalStorage(key?: string): void {
    const k = key ?? `annot-${this._docId}`;
    localStorage.setItem(k, this.exportToJson());
  }

  /** Load annotations from localStorage */
  loadFromLocalStorage(key?: string): boolean {
    const k = key ?? `annot-${this._docId}`;
    const json = localStorage.getItem(k);
    if (!json) return false;
    try {
      this.loadFromJson(json);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Page management ─────────────────────────────────────────────────────

  setActivePage(pageIndex: number): void {
    this.renderer?.setActivePage(pageIndex);
  }

  // ─── Zoom helpers ─────────────────────────────────────────────────────────

  /** Call after host zoom/pan changes so renderer redraws */
  notifyViewportChanged(): void {
    this.renderer?.requestRedraw();
  }

  // ─── Text editor ─────────────────────────────────────────────────────────

  showTextEditor(annotationId: string): void {
    this.renderer?.showTextEditor(annotationId);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private syncAnnotations(): void {
    this.annotations.set(this.store.getAll());
  }

  ngOnDestroy(): void {
    this.renderer?.destroy();
    for (const unsub of this.unsubs) unsub();
  }
}
