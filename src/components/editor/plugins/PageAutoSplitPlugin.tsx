import type { LexicalNode } from 'lexical';
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
import {
  $getRoot,
  ParagraphNode,
  TextNode,
  LineBreakNode,
  $isElementNode,
  $isTextNode,
  $isLineBreakNode
} from 'lexical';
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

    function moveOverflowBlocksToNextPage(pageNode: PageNode, capacity: number): void {
      const contentSection = pageNode
        .getChildren()
        .find((c): c is PageContentNode => isContentNode(c));
      if (contentSection == null) return;
      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;
      const el = editor.getElementByKey(contentSection.getKey());
      if (el == null) return;
      // Header ve footer yüksekliğini capacity'den düş
      const pageHeader = pageNode.getChildren().find((n) => isHeaderNode(n));
      let headerHeight = 0;
      if (pageHeader != null) {
        const headerEl = editor.getElementByKey(pageHeader.getKey());
        if (headerEl != null) {
          headerHeight = headerEl.offsetHeight;
        }
      }
      const pageFooter = pageNode.getChildren().find((n) => isFooterNode(n));
      let footerHeight = 0;
      if (pageFooter != null) {
        const footerEl = editor.getElementByKey(pageFooter.getKey());
        if (footerEl != null) {
          footerHeight = footerEl.offsetHeight;
        }
      }
      const minLineGap = 24;
      const adjustedCapacity = capacity - headerHeight - footerHeight - minLineGap;
      if (!(el.scrollHeight > adjustedCapacity + 2)) return;
      let nextPage = pageNode.getNextSibling();
      if (!$isPageNode(nextPage)) {
        nextPage = $createPageNode();
        const prevHeader = pageNode.getChildren().find((n) => isHeaderNode(n));
        const prevFooter = pageNode.getChildren().find((n) => isFooterNode(n));
        // Header kopyalama
        if (prevHeader != null && prevHeader.__visible !== false) {
          const newHeader = new PageHeaderNode();
          prevHeader.getChildren().forEach((child: LexicalNode | null | undefined) => {
            if ($isElementNode(child)) {
              const para = new ParagraphNode();
              child.getChildren().forEach((grandChild) => {
                if ($isTextNode(grandChild)) {
                  const textNode = new TextNode(grandChild.getTextContent() ?? '');
                  para.append(textNode);
                } else if ($isLineBreakNode(grandChild)) {
                  const brNode = new LineBreakNode();
                  para.append(brNode);
                }
              });
              newHeader.append(para);
            } else if ($isTextNode(child)) {
              const textNode = new TextNode(child.getTextContent() ?? '');
              newHeader.append(textNode);
            } else if ($isLineBreakNode(child)) {
              const brNode = new LineBreakNode();
              newHeader.append(brNode);
            }
          });
          nextPage.append(newHeader);
        }
        nextPage.append(new PageContentNode());
        // Footer kopyalama
        if (prevFooter != null && prevFooter.__visible !== false) {
          const newFooter = new PageFooterNode();
          prevFooter.getChildren().forEach((child: LexicalNode | null | undefined) => {
            if ($isElementNode(child)) {
              const para = new ParagraphNode();
              child.getChildren().forEach((grandChild) => {
                if ($isTextNode(grandChild)) {
                  const textNode = new TextNode(grandChild.getTextContent() ?? '');
                  para.append(textNode);
                } else if ($isLineBreakNode(grandChild)) {
                  const brNode = new LineBreakNode();
                  para.append(brNode);
                }
              });
              newFooter.append(para);
            } else if ($isTextNode(child)) {
              const textNode = new TextNode(child.getTextContent() ?? '');
              newFooter.append(textNode);
            } else if ($isLineBreakNode(child)) {
              const brNode = new LineBreakNode();
              newFooter.append(brNode);
            }
          });
          nextPage.append(newFooter);
        }
        pageNode.insertAfter(nextPage);
      }
      const nextContent = nextPage
        .getChildren()
        .find((c: LexicalNode): c is PageContentNode => isContentNode(c));
      if (nextContent == null) return;
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock != null) {
        nextContent.append(lastBlock);
      }
    }

    function reflowPass(): boolean {
      let didMoveAny = false;
      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }
        const children = root.getChildren();
        const hasNonPage = children.some((n) => !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          children.forEach((n) => {
            if (!$isPageNode(n)) {
              const contentSection = page
                .getChildren()
                .find((c): c is PageContentNode => isContentNode(c));
              if (contentSection != null) contentSection.append(n);
            }
          });
          root.append(page);
        }
        let page = root.getFirstChild();
        while ($isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null) {
            page = pageNode.getNextSibling();
            continue;
          }
          const {
            el: contentDomEl,
            height: capacity,
            paddingTop,
            paddingBottom
          } = getContentMetrics(pageEl);
          const targetForScroll = contentDomEl ?? pageEl;
          const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);
          if (usedScroll > capacity + 2) {
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
