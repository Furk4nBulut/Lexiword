import {
  DecoratorNode,
  type SerializedElementNode,
  type EditorConfig,
  type Spread,
  $getNodeByKey,
  type NodeKey,
  type LexicalEditor
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEditModeContext } from '../EditModeContext';

export type SerializedPageFooterNode = Spread<
  { type: 'page-footer'; version: 1; text: string; visible: boolean },
  SerializedElementNode
>;

// PageFooterNode: Sayfa alt bilgisini (footer) temsil eden Lexical DecoratorNode sınıfı.
// Footer'ın görünürlüğü ve metni yönetilebilir. DOM'da özel bir alan olarak gösterilir.
// decorate fonksiyonu ile React bileşeni olarak düzenlenebilir.
export class PageFooterNode extends DecoratorNode<JSX.Element> {
  __text: string;
  __visible: boolean;

  /**
   * Node tipini döndürür. ("page-footer")
   */
  static getType(): string {
    return 'page-footer';
  }

  /**
   * Bu node'un klonunu oluşturur.
   */
  static clone(node: PageFooterNode): PageFooterNode {
    return new PageFooterNode(node.__text, node.__key, node.__visible);
  }

  /**
   * Metin ve görünürlük ile yeni bir PageFooterNode oluşturur.
   *
   * @param text - Footer'da gösterilecek metin
   * @param key - Lexical node anahtarı (opsiyonel)
   * @param visible - Footer'ın görünür olup olmayacağı (varsayılan: false)
   */
  constructor(text = '', key?: string, visible = false) {
    super(key);
    this.__text = text;
    this.__visible = visible;
  }

  /**
   * Footer'ın görünürlüğünü ayarlar.
   *
   * @param visible - Footer'ın görünür olup olmayacağını belirten boolean değer
   *
   * Not: getWritable ile node'un güncellenebilir kopyası alınır.
   */
  setVisible(visible: boolean): void {
    // getWritable ile node'un güncellenebilir kopyasını alıyoruz.
    // Bu sayede immutable veri modelinde değişiklik yapabiliyoruz.
    const writable = this.getWritable();
    writable.__visible = visible;
  }

  /**
   * Footer'ın görünür olup olmadığını döndürür.
   *
   * @returns true ise footer görünür, false ise gizlidir.
   */
  isVisible(): boolean {
    return this.__visible;
  }

  /**
   * Footer metnini ayarlar.
   *
   * @param text - Footer'da gösterilecek yeni metin
   *
   * Not: getWritable ile node'un güncellenebilir kopyası alınır.
   */
  setText(text: string): void {
    // getWritable ile node'un güncellenebilir kopyasını alıyoruz.
    // Bu sayede immutable veri modelinde değişiklik yapabiliyoruz.
    const writable = this.getWritable();
    writable.__text = text;
  }

  /**
   * DOM'da bu node'u temsil eden span oluşturur.
   *
   * @returns Boş bir span elementi (React ile doldurulacak)
   */
  createDOM(_config: EditorConfig): HTMLElement {
    // DOM'da footer için bir span oluşturuyoruz.
    // React, decorate fonksiyonu ile içeriği yönetecek.
    const span = document.createElement('span');
    return span;
  }

  /**
   * DOM güncellemesi gerektirmez.
   */
  updateDOM(): boolean {
    return false;
  }

  /**
   * JSON'dan PageFooterNode oluşturur.
   */
  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    const node = new PageFooterNode(serializedNode.text, undefined, serializedNode.visible);
    return node;
  }

  /**
   * Bu node'u JSON olarak dışa aktarır.
   */
  exportJSON(): SerializedPageFooterNode {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const json = {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1,
      text: this.__text,
      visible: this.__visible
    } as SerializedPageFooterNode;
    return json;
  }

  /**
   * Footer'ı React bileşeni olarak döndürür.
   *
   * @returns Eğer görünürse FooterEditable bileşeni, değilse boş bir fragment döner.
   */
  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    // Footer görünürse düzenlenebilir alanı göster, değilse boş döndür.
    return this.__visible ? <FooterEditable text={this.__text} nodeKey={this.getKey()} /> : <></>;
  }
}

/**
 * FooterEditable: Footer alanını düzenlenebilir olarak gösteren React bileşeni.
 * Sadece headerFooterEditMode açıkken düzenlenebilir olur.
 *
 * @param text - Footer'da gösterilecek metin
 * @param nodeKey - Lexical node anahtarı
 * @returns Düzenlenebilir bir div elementi
 *
 * Detaylar:
 * - onInput ile metin değişikliği anında node'a kaydedilir.
 * - onKeyDown ile Ctrl+A kısayolu sadece bu alanda çalışır.
 * - headerFooterEditMode true ise alan düzenlenebilir olur.
 */
function FooterEditable({ text, nodeKey }: { text: string; nodeKey: NodeKey }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { headerFooterEditMode } = useEditModeContext();
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // DOM'daki div'in içeriğini güncel metinle eşitliyoruz.
    // Eğer dışarıdan gelen text değişirse, div'in içeriği de güncellenir.
    const el = divRef.current;
    if (el !== null && el.innerText !== text) {
      el.innerText = text;
    }
  }, [text]);

  const commit = React.useCallback(
    (newText: string) => {
      // Kullanıcı metni değiştirdiğinde, bu değişikliği Lexical node'a kaydediyoruz.
      // editor.update ile Lexical'ın immutable veri modelinde güncelleme yapıyoruz.
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof PageFooterNode) {
          node.setText(newText);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleInput = React.useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      // Kullanıcı div'e yazdıkça, yeni metni alıp commit fonksiyonuna iletiyoruz.
      const newText = (e.target as HTMLDivElement).innerText;
      commit(newText);
    },
    [commit]
  );

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl+A ile sadece bu div içindeki tüm metni seçebilmek için özel bir kısayol ekliyoruz.
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      const el = divRef.current;
      if (el !== null) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (sel !== null) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, []);

  return (
    <div
      ref={divRef}
      className="a4-footer"
      contentEditable={headerFooterEditMode}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-node-key={nodeKey}
      data-lexical-node-key={nodeKey}
      style={{ minHeight: '32px', outline: headerFooterEditMode ? '2px solid #1976d2' : 'none' }}
    />
  );
}
