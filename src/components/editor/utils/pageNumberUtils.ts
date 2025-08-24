import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../nodes/PageNumberNode';
import { $isPageNode } from '../nodes/PageNode';
import { isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';

/**
 * Header/footer sayfa numaralar1n31 g31ncelleme yard31mc31 fonksiyonlar31.
 * - addOrReplacePageNumbers: aktifse ekler, de31lse siler
 */
export function addOrReplacePageNumbers({
  header,
  footer
}: {
  header: boolean;
  footer: boolean;
}): void {
  const root = $getRoot();
  const pages = root.getChildren().filter($isPageNode);
  pages.forEach((p, idx) => {
    if (header) {
      const h = p.getChildren().find(isHeaderNode);
      if (h != null) {
        const children = h.getChildren();
        // remove existing page-number nodes
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') c.remove();
        });
        h.append($createPageNumberNode(String(idx + 1)));
      }
    } else {
      const h = p.getChildren().find(isHeaderNode);
      if (h != null) {
        const children = h.getChildren();
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') c.remove();
        });
      }
    }

    if (footer) {
      const f = p.getChildren().find(isFooterNode);
      if (f != null) {
        const children = f.getChildren();
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') c.remove();
        });
        f.append($createPageNumberNode(String(idx + 1)));
      }
    } else {
      const f = p.getChildren().find(isFooterNode);
      if (f != null) {
        const children = f.getChildren();
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') c.remove();
        });
      }
    }
  });
}
