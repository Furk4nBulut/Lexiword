// Lexical normalization için: Bu node'un children'ı olarak sadece header, content ve footer node'ları kabul edilir.
import { ElementNode, type SerializedElementNode, type LexicalNode } from 'lexical';
import type { PageHeaderNode } from './PageHeaderNode';
import type { PageFooterNode } from './PageFooterNode';
// import { $createPageHeaderNode } from './PageHeaderNode';
// import { $createPageFooterNode } from './PageFooterNode';
import { PageContentNode } from './PageContentNode';

export function $createPageNode(): PageNode {
  return new PageNode({});
}

export function $isPageNode(node: LexicalNode | null | undefined): node is PageNode {
  return node instanceof PageNode;
}

export type SerializedPageNode = {
  type: 'page';
  version: 1;
} & SerializedElementNode;

// PageNode: Bir sayfanın tamamını temsil eden Lexical ElementNode sınıfı.
// Her sayfa, header, content ve footer node'larını çocuk olarak içerir.
// ensureHeaderFooterContentChildren ile bu çocukların varlığı ve sırası garanti edilir.

export class PageNode extends ElementNode {
  static getAllowedChildren(): string[] {
    return ['page-header', 'page-content', 'page-footer'];
  }

  /**
   * Güvenli şekilde header ekler. Yanlış tip veya undefined eklenmesini engeller.
   */
  safeAppendHeader(header: unknown): void {
    if (
      header !== undefined &&
      header !== null &&
      typeof (header as any).getType === 'function' &&
      (header as any).getType() === 'page-header'
    ) {
      this.append(header as PageHeaderNode);
    } else {
      if (typeof window !== 'undefined') {
        console.warn('[DEBUG] Header append SKIPPED, tip yanlış veya undefined:', header);
      }
    }
  }

  /**
   * Güvenli şekilde footer ekler. Yanlış tip veya undefined eklenmesini engeller.
   */
  safeAppendFooter(footer: unknown): void {
    if (
      footer !== undefined &&
      footer !== null &&
      typeof (footer as any).getType === 'function' &&
      (footer as any).getType() === 'page-footer'
    ) {
      this.append(footer as PageFooterNode);
    } else {
      if (typeof window !== 'undefined') {
        console.warn('[DEBUG] Footer append SKIPPED, tip yanlış veya undefined:', footer);
      }
    }
  }

  // DEBUG: PageNode class loaded
  constructor({ key }: { key?: string }) {
    super(key);
    if (typeof window !== 'undefined') {
      // debug log kaldırıldı
    }
  }

  /**
   * Node tipini döndürür. ("page")
   */
  static getType(): string {
    return 'page';
  }

  /**
   * Bu node'un klonunu oluşturur.
   */
  static clone(node: PageNode): PageNode {
    return new PageNode({ key: node.__key });
  }

  /**
   * DOM'da bu node'u temsil eden div'i oluşturur.
   */
  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-page';
    dom.style.display = 'flex';
    dom.style.flexDirection = 'column';
    // Use px to be consistent with runtime measurements (96dpi approx)
    dom.style.width = '794px'; // 210mm ~ 8.27in * 96
    dom.style.height = '1122px'; // 297mm ~ 11.69in * 96
    dom.style.background = '#fff';
    dom.style.position = 'relative';
    dom.style.overflow = 'hidden';
    return dom;
  }

  /**
   * DOM güncellemesi gerektirmez.
   */
  updateDOM(): boolean {
    return false;
  }

  /**
   * JSON'dan PageNode oluşturur.
   */
  static importJSON(serializedNode: SerializedPageNode): PageNode {
    const node = new PageNode({});
    return node;
  }

  /**
   * Bu node'u JSON olarak dışa aktarır.
   */
  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 1
    };
  }

  /**
   * Header, content ve footer node'larının varlığını ve sırasını garanti eder.
   *
   * Bu fonksiyon, bir sayfa node'unun çocukları arasında mutlaka bir header, bir content ve bir footer node'u olmasını sağlar.
   * Eğer eksik varsa otomatik olarak ekler ve sıralamayı header -> content -> footer olarak düzeltir.
   *
   * Kullanım Senaryosu:
   * - Sayfa ilk oluşturulurken veya çocuklar değiştiğinde, yapının bozulmaması için çağrılır.
   *
   * Not: Tüm mevcut çocuklar önce kaldırılır, sonra doğru sırayla tekrar eklenir.
   */
  /**
   * ensureHeaderFooterContentChildren
   *
   * Bu fonksiyon, bir sayfa node'unun çocukları arasında mutlaka bir content node'u olmasını sağlar.
   * Header/footer ise sadece mevcutsa eklenir, yoksa eklenmez.
   *
   * Artık yeni sayfa eklenirken header/footer zorunlu olarak eklenmez.
   */
  /**
   * ensureHeaderFooterContentChildren
   *
   * Bu fonksiyon, bir sayfa node'unun çocukları arasında mutlaka bir content node'u olmasını sağlar.
   * Header/footer ise parametre olarak verilirse zorunlu olarak eklenir, yoksa mevcut children'dan alınır.
   *
   * Artık yeni sayfa eklenirken header/footer parametre olarak verilebilir.
   */
  ensureHeaderFooterContentChildren(
    headerParam?: PageHeaderNode,
    footerParam?: PageFooterNode
  ): void {
    // Sıralama: header? -> content -> footer? (section her zaman ortada)
    let header: PageHeaderNode | undefined;
    let footer: PageFooterNode | undefined;
    let content = this.getChildren().find((child) => child.getType() === 'page-content');

    // Header parametresi varsa ve doğru tipteyse onu kullan, yoksa mevcut children'dan bul
    if (
      headerParam !== undefined &&
      headerParam !== null &&
      typeof (headerParam as any).getType === 'function' &&
      (headerParam as any).getType() === 'page-header'
    ) {
      header = headerParam;
    } else {
      header = this.getChildren().find(
        (child) => child.getType() === 'page-header'
      ) as PageHeaderNode;
      if (headerParam !== undefined && (header === undefined || header === null)) {
        if (typeof window !== 'undefined') {
          console.warn('[DEBUG] Header parametresi yanlış tipte veya undefined:', headerParam);
        }
      }
    }

    // Footer parametresi varsa ve doğru tipteyse onu kullan, yoksa mevcut children'dan bul
    if (
      footerParam !== undefined &&
      footerParam !== null &&
      typeof (footerParam as any).getType === 'function' &&
      (footerParam as any).getType() === 'page-footer'
    ) {
      footer = footerParam;
    } else {
      footer = this.getChildren().find(
        (child) => child.getType() === 'page-footer'
      ) as PageFooterNode;
    }

    // Content node'u yoksa oluştur
    if (content == null) content = new PageContentNode();

    // Tüm mevcut çocukları kaldır
    this.getChildren().forEach((child) => {
      child.remove();
    });

    // Sadece header varsa ve doğru tipteyse ekle
    if (header != null) this.safeAppendHeader(header);
    this.append(content);
    if (footer != null) this.safeAppendFooter(footer);
  }

  /**
   * Başlangıçta header, content ve footer ekler.
   */
  appendInitialChildren(): void {
    if (typeof window !== 'undefined') {
      // debug log kaldırıldı
    }
    this.ensureHeaderFooterContentChildren();
  }

  /**
   * Header node'unu döndürür.
   */
  getHeaderNode(): PageHeaderNode | undefined {
    return this.getChildren().find((child) => child.getType() === 'page-header') as PageHeaderNode;
  }

  /**
   * Footer node'unu döndürür.
   */
  getFooterNode(): PageFooterNode | undefined {
    return this.getChildren().find((child) => child.getType() === 'page-footer') as PageFooterNode;
  }
}
