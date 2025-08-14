import { ElementNode, type SerializedElementNode, type LexicalNode } from 'lexical';
import { PageHeaderNode } from './PageHeaderNode';
import { PageFooterNode } from './PageFooterNode';
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
   * Yeni bir PageNode oluşturur.
   */
  constructor({ key }: { key?: string }) {
    super(key);
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
  ensureHeaderFooterContentChildren(): void {
  // Sıralama: header -> content -> footer (section her zaman ortada)
  let header = this.getChildren().find((child) => child.getType() === 'page-header');
  let content = this.getChildren().find((child) => child.getType() === 'page-content');
  let footer = this.getChildren().find((child) => child.getType() === 'page-footer');
  if (header == null) header = new PageHeaderNode();
  if (content == null) content = new PageContentNode();
  if (footer == null) footer = new PageFooterNode();
    // Tüm çocukları kaldır ve doğru sırayla ekle
    this.getChildren().forEach((child) => {
      // Her bir mevcut çocuğu kaldırıyoruz, böylece sıralama bozulmaz.
      child.remove();
    });
    // Doğru sırayla header, content ve footer ekleniyor.
    this.append(header);
    this.append(content);
    this.append(footer);
  }

  /**
   * Başlangıçta header, content ve footer ekler.
   */
  appendInitialChildren(): void {
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
