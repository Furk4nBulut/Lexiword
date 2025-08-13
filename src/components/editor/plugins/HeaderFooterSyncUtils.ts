import { $getRoot } from 'lexical';
import { $isPageNode } from '../nodes/PageNode';

/**
 * Tüm PageNode'ların header'ını verilen text ve visible ile günceller
 */
export function updateAllHeaders(text: string, visible: boolean): void {
  const root = $getRoot();
  root.getChildren().forEach((pageNode) => {
    if ($isPageNode(pageNode)) {
      const header = pageNode.getHeaderNode();
      if (header != null) {
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
  const root = $getRoot();
  root.getChildren().forEach((pageNode) => {
    if ($isPageNode(pageNode)) {
      const footer = pageNode.getFooterNode();
      if (footer != null) {
        footer.setText(text);
        footer.setVisible(visible);
      }
    }
  });
}
