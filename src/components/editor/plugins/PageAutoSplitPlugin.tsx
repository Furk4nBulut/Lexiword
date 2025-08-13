/**
 * PageAutoSplitPlugin
 *
 * Bu plugin, sayfa içeriği taşma (overflow) yaptığında fazla blokları otomatik olarak yeni bir sayfaya taşır.
 * Sayfa yüksekliği, üst ve alt marjlar gibi parametrelerle çalışır ve overflow durumunda yeni sayfa ekler.
 *
 * Kullanım Senaryosu:
 * - Kullanıcı içerik ekledikçe, sayfa dolduğunda fazla bloklar otomatik olarak yeni bir sayfaya aktarılır.
 * - Header/footer kopyalanır, içerik bölünür ve sayfa yapısı bozulmaz.
 *
 * Notlar:
 * - moveOverflowBlocksToNextPage fonksiyonu, taşan blokları bir sonraki sayfaya taşır.
 * - reflowPass fonksiyonu, tüm sayfaları kontrol eder ve overflow varsa taşımayı tetikler.
 * - schedule fonksiyonu, animasyon frame ve setTimeout ile reflow işlemini optimize eder.
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageHeaderNode } from '../nodes/PageHeaderNode';
import { PageFooterNode } from '../nodes/PageFooterNode';
import { PageContentNode } from '../nodes/PageContentNode';

export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  const [editor] = useLexicalComposerContext();
  const rafRef = useRef<number | null>(null);
  const isReflowingRef = useRef(false);

  useEffect(() => {
    function getPageEl(page: PageNode): HTMLElement | null {
      return editor.getElementByKey(page.getKey());
    }

    function getContentMetrics(pageEl: HTMLElement): {
      el: HTMLElement | null;
      top: number;
      bottom: number;
      height: number;
      paddingTop: number;
      paddingBottom: number;
    } {
      const el = pageEl.querySelector('[data-lexical-page-section="content"]');
      const contentEl = el instanceof HTMLElement ? el : null;
      const target = contentEl ?? pageEl;
      const rect = target.getBoundingClientRect();
      const styles = window.getComputedStyle(target);
      let paddingTop = parseFloat(styles.paddingTop);
      let paddingBottom = parseFloat(styles.paddingBottom);
      if (Number.isNaN(paddingTop)) paddingTop = 0;
      if (Number.isNaN(paddingBottom)) paddingBottom = 0;
      const top = rect.top + paddingTop;
      const bottom = rect.bottom - paddingBottom;
      return { el: contentEl, top, bottom, height: bottom - top, paddingTop, paddingBottom };
    }

    function getContentScrollHeight(
      targetEl: HTMLElement,
      paddingTop: number,
      paddingBottom: number
    ): number {
      return targetEl.scrollHeight - paddingTop - paddingBottom;
    }

    /**
     * moveOverflowBlocksToNextPage
     *
     * Bu fonksiyon, taşan içerik bloklarını bir sonraki sayfaya taşır.
     * Sayfa altındaki footer yüksekliği ve minimum boşluk göz önünde bulundurularak
     * taşınacak içerik miktarı ayarlanır.
     *
     * @param pageNode - Taşınacak blokların bulunduğu sayfa düğümü
     * @param capacity - Sayfanın içeriği barındırma kapasitesi
     */
    function moveOverflowBlocksToNextPage(pageNode: PageNode, capacity: number): void {
      // İçerik bölümünü bul
      const contentSection = pageNode
        .getChildren()
        .find((c: unknown): c is PageContentNode => isContentNode(c));
      if (contentSection == null) return;
      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;
      const el = editor.getElementByKey(contentSection.getKey());
      if (el == null) return;
      // Footer yüksekliğini ve en az bir satır boşluğu hesaba kat
      const pageFooter = pageNode.getChildren().find((n) => isFooterNode(n));
      let footerHeight = 0;
      if (pageFooter != null) {
        const footerEl = editor.getElementByKey(pageFooter.getKey());
        if (footerEl != null) {
          footerHeight = footerEl.offsetHeight;
        }
      }
      // En az bir satır boşluk (ör: 24px) bırakmak için
      const minLineGap = 24;
      const adjustedCapacity = capacity - footerHeight - minLineGap;
      if (!(el.scrollHeight > adjustedCapacity + 2)) return;
      // Fazla bloğu bul ve taşı
      let nextPage = pageNode.getNextSibling();
      if (!$isPageNode(nextPage)) {
        nextPage = $createPageNode();
        // Header/footer kopyala
        const prevHeader = pageNode.getChildren().find((n) => isHeaderNode(n));
        const prevFooter = pageNode.getChildren().find((n) => isFooterNode(n));
        if (prevHeader != null && prevHeader.__visible !== false) {
          nextPage.append(
            new PageHeaderNode(prevHeader.__text ?? '', undefined, prevHeader.__visible ?? false)
          );
        }
        nextPage.append(new PageContentNode());
        if (prevFooter != null && prevFooter.__visible !== false) {
          nextPage.append(
            new PageFooterNode(prevFooter.__text ?? '', undefined, prevFooter.__visible ?? false)
          );
        }
        pageNode.insertAfter(nextPage);
      }
      const nextContent = nextPage
        .getChildren()
        .find((c: unknown): c is PageContentNode => isContentNode(c));
      if (nextContent == null) return;
      // Son bloğu taşı
      const lastBlock = blocks[blocks.length - 1];
      // Sadece null kontrolü ve getKey fonksiyonu kontrolü yeterli
      if (lastBlock != null && typeof (lastBlock as { getKey?: unknown }).getKey === 'function') {
        // Fazla bloğu bir sonraki sayfanın content'ine ekle
        nextContent.append(lastBlock as any); // LexicalNode olarak cast
      }
    }

    /**
     * reflowPass
     *
     * Bu fonksiyon, sayfa taşma kontrolü yapar ve gerekirse taşma olan sayfalardaki
     * fazla blokları bir sonraki sayfaya taşır.
     *
     * @returns boolean - Herhangi bir bloğun taşınıp taşınmadığını belirtir
     */
    function reflowPass(): boolean {
      let didMoveAny = false;
      editor.update(() => {
        // Root node'u al
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }
        const children = root.getChildren();
        // Eğer root altında PageNode olmayan bir node varsa, onu yeni bir sayfaya taşı
        const hasNonPage = children.some((n) => !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          children.forEach((n) => {
            // Sadece LexicalNode tipindekileri ekle
            if (!$isPageNode(n) && typeof n === 'object' && n !== null && 'getKey' in n) {
              const contentSection = page
                .getChildren()
                .find((c: unknown): c is PageContentNode => isContentNode(c));
              if (contentSection != null) contentSection.append(n as any); // LexicalNode olarak cast
            }
          });
          root.append(page);
        }
        // Tüm sayfalar için flow kontrolü
        let page = root.getFirstChild();
        while ($isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null) {
            page = pageNode.getNextSibling();
            continue;
          }
          // Sayfa içeriğinin kapasitesini ve kullanılan alanı hesapla
          const {
            el: contentDomEl,
            height: capacity,
            paddingTop,
            paddingBottom
          } = getContentMetrics(pageEl);
          const targetForScroll = contentDomEl !== null ? contentDomEl : pageEl;
          const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);
          if (usedScroll > capacity + 2) {
            // Taşma varsa, fazla bloğu bir sonraki sayfaya taşı
            moveOverflowBlocksToNextPage(pageNode, capacity);
            didMoveAny = true;
          }
          page = pageNode.getNextSibling();
        }
      });
      return didMoveAny;
    }

    const schedule = (): void => {
      if (isReflowingRef.current) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30;
        const run = (): void => {
          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            setTimeout(run, 0);
          } else {
            isReflowingRef.current = false;
          }
        };
        setTimeout(run, 0);
      });
    };

    schedule();

    const unregister = editor.registerUpdateListener((): void => {
      schedule();
    });

    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
      isReflowingRef.current = false;
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  return null;
}
