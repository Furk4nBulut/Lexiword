import { ElementNode, type SerializedElementNode } from 'lexical';

export type SerializedPageContentNode = SerializedElementNode & {
  type: 'page-content';
  version: 1;
};

export class PageContentNode extends ElementNode {
  static getType(): string {
    return 'page-content';
  }

  static clone(node: PageContentNode): PageContentNode {
    return new PageContentNode(node.__key);
  }

  // We need this constructor to forward the key to ElementNode for proper cloning behavior
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(key?: string) {
    super(key);
  }

  /**
   * Bu node'un silinmesini engeller.
   *
   * Hiçbir şey yapmaz, böylece PageContentNode asla silinemez.
   *
   * Örneğin bir kullanıcı veya kod remove() çağırsa bile node yerinde kalır.
   */
  remove(): void {
    // Hiçbir şey yapma, silinemez
  }

  /**
   * Bu node'un çocuklarının silinmesini engeller.
   *
   * Hiçbir şey yapmaz, böylece PageContentNode'un çocukları da silinemez.
   */
  removeChild(): void {
    // Hiçbir şey yapma, silinemez
  }

  /**
   * DOM'da bu node'u temsil eden div'i oluşturur.
   *
   * @returns 'a4-content' class'ına sahip bir div elementi döner.
   *
   * Not: data-lexical-node-key ile node'un anahtarı DOM'a eklenir.
   */
  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-content';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    return dom;
  }

  /**
   * DOM güncellemesi gerektirmez.
   *
   * @returns false (React veya Lexical bu node için DOM güncellemesi yapmaz)
   */
  updateDOM(): boolean {
    return false;
  }

  /**
   * JSON'dan PageContentNode oluşturur.
   *
   * @param serializedNode - Serileştirilmiş PageContentNode nesnesi
   * @returns Yeni bir PageContentNode örneği
   */
  static importJSON(serializedNode: SerializedPageContentNode): PageContentNode {
    return new PageContentNode();
  }

  /**
   * Bu node'u JSON olarak dışa aktarır.
   *
   * @returns PageContentNode'un serileştirilmiş hali
   */
  exportJSON(): SerializedPageContentNode {
    return {
      ...super.exportJSON(),
      type: 'page-content',
      version: 1
    };
  }
}
