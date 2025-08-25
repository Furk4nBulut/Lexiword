import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../nodes/PageNumberNode';
import { $isPageNode } from '../nodes/PageNode';
import { isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';

/**
 * Sayfa başlık (header) ve altlık (footer) alanlarındaki sayfa numaralarını ekleyen veya güncelleyen yardımcı fonksiyon.
 *
 * Eğer header veya footer aktifse, ilgili alana sayfa numarası ekler. Aktif değilse mevcut sayfa numarasını siler.
 *
 * @param header Header'a sayfa numarası ekle (true/false)
 * @param footer Footer'a sayfa numarası ekle (true/false)
 */
export function addOrReplacePageNumbers({
  header,
  footer
}: {
  header: boolean;
  footer: boolean;
}): void {
  const root = $getRoot(); // Tüm dokümanın kök nodunu al
  const pages = root.getChildren().filter($isPageNode); // Sadece sayfa nodlarını filtrele
  pages.forEach((p, idx) => {
    // Header işlemleri
    if (header) {
      const h = p.getChildren().find(isHeaderNode); // Header nodunu bul
      if (h != null) {
        const children = h.getChildren();
        // Var olan page-number nodlarını sil
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') {
            c.remove();
          }
        });
        // Yeni page-number nodunu ekle (sayfa sırasına göre)
        h.append($createPageNumberNode(String(idx + 1)));
      }
    } else {
      // Header aktif değilse, varsa mevcut page-number nodlarını sil
      const h = p.getChildren().find(isHeaderNode);
      if (h != null) {
        const children = h.getChildren();
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') {
            c.remove();
          }
        });
      }
    }

    // Footer işlemleri
    if (footer) {
      const f = p.getChildren().find(isFooterNode); // Footer nodunu bul
      if (f != null) {
        const children = f.getChildren();
        // Var olan page-number nodlarını sil
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') {
            c.remove();
          }
        });
        // Yeni page-number nodunu ekle (sayfa sırasına göre)
        f.append($createPageNumberNode(String(idx + 1)));
      }
    } else {
      // Footer aktif değilse, varsa mevcut page-number nodlarını sil
      const f = p.getChildren().find(isFooterNode);
      if (f != null) {
        const children = f.getChildren();
        children.forEach((c) => {
          if (typeof c.getType === 'function' && c.getType() === 'page-number') {
            c.remove();
          }
        });
      }
    }
  });
}
