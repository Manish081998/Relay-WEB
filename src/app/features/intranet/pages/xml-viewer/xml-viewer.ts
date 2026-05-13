import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface XmlNode {
  id: number;
  tag: string;
  attributes: { name: string; value: string }[];
  text: string;
  children: XmlNode[];
  collapsed: ReturnType<typeof signal<boolean>>;
  depth: number;
}

@Component({
  selector: 'app-xml-viewer',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xml-viewer.html',
  styleUrl: './xml-viewer.scss',
})
export class XmlViewer implements OnInit {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  readonly xmlRaw = signal('');
  readonly title = signal('XML Document');
  readonly tree = signal<XmlNode[]>([]);
  readonly parseError = signal('');
  readonly searchQuery = signal('');
  readonly copied = signal(false);
  readonly allCollapsed = signal(false);

  private nodeCounter = 0;

  readonly nodeCount = computed(() => this.countAll(this.tree()));

  readonly matchCount = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return 0;
    return this.countMatches(this.tree(), q);
  });

  ngOnInit(): void {
    const key = this.route.snapshot.queryParamMap.get('key');
    if (key) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored) as { xml?: string; title?: string };
        if (data.title) this.title.set(data.title);
        if (data.xml) { this.xmlRaw.set(data.xml); this.parseXml(data.xml); return; }
      }
    }

    // fallback: same-tab navigation via history.state
    const state = history.state as { xml?: string; title?: string };
    if (state?.title) this.title.set(state.title);
    if (state?.xml) {
      this.xmlRaw.set(state.xml);
      this.parseXml(state.xml);
    } else {
      this.parseError.set('No XML content received. Please go back and click "View XML" on a row.');
    }
  }

  goBack(): void {
    this.router.navigate(['/intranet/Edge-Orders-Search']);
  }

  copyXml(): void {
    navigator.clipboard.writeText(this.xmlRaw()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  toggleAll(): void {
    const next = !this.allCollapsed();
    this.allCollapsed.set(next);
    this.setCollapseAll(this.tree(), next);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  isMatch(node: XmlNode): boolean {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return false;
    if (node.tag.toLowerCase().includes(q)) return true;
    if (node.text.toLowerCase().includes(q)) return true;
    return node.attributes.some(
      a => a.name.toLowerCase().includes(q) || a.value.toLowerCase().includes(q),
    );
  }

  hasDescendantMatch(node: XmlNode): boolean {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return false;
    return this.subtreeHasMatch(node, q);
  }

  // ── Row layout helpers ──────────────────────────────────────────────────

  rowPad(depth: number): string {
    return `${depth * 20 + 12}px`;
  }

  guidePx(depth: number): string {
    return `${depth * 20 + 22}px`;
  }

  // ── Render helpers (called from template via [innerHTML]) ───────────────

  renderOpenTag(node: XmlNode): string {
    let s = `<span class="s-b">&lt;</span><span class="s-t">${this.hlText(node.tag)}</span>`;

    for (const a of node.attributes) {
      s += ` <span class="s-an">${this.hlText(a.name)}</span><span class="s-eq">=</span><span class="s-av">"${this.hlText(a.value)}"</span>`;
    }

    const hasContent = node.children.length > 0 || !!node.text;

    if (!hasContent) {
      s += `<span class="s-b"> /&gt;</span>`;
    } else if (node.text && !node.children.length) {
      s += `<span class="s-b">&gt;</span><span class="s-tx">${this.hlText(node.text)}</span><span class="s-b">&lt;/</span><span class="s-tc">${this.esc(node.tag)}</span><span class="s-b">&gt;</span>`;
    } else if (node.collapsed()) {
      s += `<span class="s-b">&gt;</span><span class="s-el"> ··· </span><span class="s-b">&lt;/</span><span class="s-tc">${this.esc(node.tag)}</span><span class="s-b">&gt;</span>`;
    } else {
      s += `<span class="s-b">&gt;</span>`;
    }

    return s;
  }

  renderCloseTag(node: XmlNode): string {
    return `<span class="s-b">&lt;/</span><span class="s-tc">${this.esc(node.tag)}</span><span class="s-b">&gt;</span>`;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private hlText(text: string): string {
    const q = this.searchQuery().trim();
    if (!q) return this.esc(text);
    return this.esc(text).replace(
      new RegExp(this.escRe(q), 'gi'),
      m => `<mark class="hl">${m}</mark>`,
    );
  }

  private parseXml(raw: string): void {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) {
        this.parseError.set('XML parse error: ' + (err.textContent ?? 'Invalid XML'));
        return;
      }
      this.nodeCounter = 0;
      const roots = Array.from(doc.childNodes)
        .filter(n => n.nodeType === Node.ELEMENT_NODE)
        .map(n => this.domToNode(n as Element, 0));
      this.tree.set(roots);
    } catch (e) {
      this.parseError.set('Failed to parse XML: ' + String(e));
    }
  }

  private domToNode(el: Element, depth: number): XmlNode {
    const attrs = Array.from(el.attributes).map(a => ({ name: a.name, value: a.value }));
    const children: XmlNode[] = [];
    let text = '';

    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(this.domToNode(child as Element, depth + 1));
      } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
        const t = child.textContent?.trim() ?? '';
        if (t) text = t;
      }
    }

    return {
      id: ++this.nodeCounter,
      tag: el.tagName,
      attributes: attrs,
      text,
      children,
      collapsed: signal(false),
      depth,
    };
  }

  private setCollapseAll(nodes: XmlNode[], value: boolean): void {
    for (const n of nodes) {
      n.collapsed.set(value);
      if (n.children.length) this.setCollapseAll(n.children, value);
    }
  }

  private countAll(nodes: XmlNode[]): number {
    let c = nodes.length;
    for (const n of nodes) c += this.countAll(n.children);
    return c;
  }

  private countMatches(nodes: XmlNode[], q: string): number {
    let count = 0;
    for (const n of nodes) {
      if (
        n.tag.toLowerCase().includes(q) ||
        n.text.toLowerCase().includes(q) ||
        n.attributes.some(a => a.name.toLowerCase().includes(q) || a.value.toLowerCase().includes(q))
      ) count++;
      count += this.countMatches(n.children, q);
    }
    return count;
  }

  private subtreeHasMatch(node: XmlNode, q: string): boolean {
    if (this.isMatch(node)) return true;
    return node.children.some(c => this.subtreeHasMatch(c, q));
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
