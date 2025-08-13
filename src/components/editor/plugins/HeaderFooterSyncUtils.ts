import { $getRoot } from 'lexical';
import { $isPageNode } from '../nodes/PageNode';

/**
 * HeaderFooterSyncUtils
 *
 * Bu dosya, tüm sayfalardaki header ve footer alanlarını topluca güncellemek için yardımcı fonksiyonlar içerir.
 *
 * updateAllHeaders: Tüm PageNode'ların header'ını verilen text ve visible ile günceller.
 * updateAllFooters: Tüm PageNode'ların footer'ını verilen text ve visible ile günceller.
 *
 * Kullanım Senaryosu:
 * - Bir header/footer değişikliği olduğunda, tüm sayfalarda aynı değerin yansımasını sağlamak için kullanılır.
 */

/**
 * Tüm PageNode'ların header'ını verilen text ve visible ile günceller
 */
export function updateAllHeaders(text: string, visible: boolean): void {
  // Root node'dan tüm PageNode'ları bulup, her birinin header'ını günceller.
  const root = $getRoot();
  root.getChildren().forEach((pageNode) => {
    if ($isPageNode(pageNode)) {
      const header = pageNode.getHeaderNode();
      if (header != null) {
        // Header'ın metni ve görünürlüğü güncellenir.
        header.setText(text);
        header.setVisible(visible);
      }
    }
  });
}

/**
 * Tüm PageNode'ların footer'ını verilen text ve visible ile günceller
 */
export function updateAllFooters(text: string, visible: boolean): void {
  // Root node'dan tüm PageNode'ları bulup, her birinin footer'ını günceller.
  const root = $getRoot();
  root.getChildren().forEach((pageNode) => {
    if ($isPageNode(pageNode)) {
      const footer = pageNode.getFooterNode();
      if (footer != null) {
        // Footer'ın metni ve görünürlüğü güncellenir.
        footer.setText(text);
        footer.setVisible(visible);
      }
    }
  });
}
