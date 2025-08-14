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
import { isContentNode, isFooterNode, isHeaderNode } from '../nodes/sectionTypeGuards';
// import { PageHeaderNode } from '../nodes/PageHeaderNode';
// import { PageFooterNode } from '../nodes/PageFooterNode';
import { PageContentNode } from '../nodes/PageContentNode';

/**
 * Sayfa akış ayarlarını tanımlar.
 * pageHeightMm: Sayfa yüksekliği (mm cinsinden)
 * marginTopMm: Üst marjin (mm cinsinden)
 * marginBottomMm: Alt marjin (mm cinsinden)
 */
export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

/**
 * PageAutoSplitPlugin
 *
 * Sayfa içeriği taşma yaptığında, fazla blokları otomatik olarak yeni bir sayfaya taşır.
 * Header/footer kopyalanır, içerik bölünür ve sayfa yapısı bozulmaz.
 *
 * @param pageHeightMm - Sayfa yüksekliği (mm)
 * @param marginTopMm - Üst marjin (mm)
 * @param marginBottomMm - Alt marjin (mm)
 */
export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  // Lexical editor context'i alınır
  const [editor] = useLexicalComposerContext();
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] PageAutoSplitPlugin loaded', { pageHeightMm, marginTopMm, marginBottomMm });
  }
  // Reflow işlemi için animation frame referansı
  const rafRef = useRef<number | null>(null);
  // Reflow işleminin devam edip etmediğini takip eder
  const isReflowingRef = useRef(false);

  useEffect(() => {
    /**
     * Bir PageNode'un DOM elementini döndürür.
     * @param page - PageNode
     * @returns HTMLElement veya null
     */
    function getPageEl(page: PageNode): HTMLElement | null {
      return editor.getElementByKey(page.getKey());
    }

    /**
     * İçerik bölümünün DOM ölçülerini ve padding değerlerini döndürür.
     * @param pageEl - Sayfa elementi
     * @returns İçerik DOM'u, üst/alt koordinatlar, yükseklik ve padding değerleri
     */
    function getContentMetrics(pageEl: HTMLElement): {
      el: HTMLElement | null;
      top: number;
      bottom: number;
      height: number;
      paddingTop: number;
      paddingBottom: number;
    } {
      // İçerik bölümünü bul
      const el = pageEl.querySelector('[data-lexical-page-section="content"]');
      const contentEl = el instanceof HTMLElement ? el : null;
      const target = contentEl ?? pageEl;
      // DOM ölçülerini al
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

    /**
     * İçerik bölümünün scrollHeight'ini (taşan yükseklik) döndürür.
     * @param targetEl - Hedef DOM elementi
     * @param paddingTop - Üst padding
     * @param paddingBottom - Alt padding
     * @returns Scroll yüksekliği (px)
     */
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

    /**
     * moveOverflowBlocksToNextPage
     *
     * Taşan içerik bloklarını bir sonraki sayfaya taşır.
     * Footer yüksekliği ve minimum boşluk hesaba katılır.
     *
     * @param pageNode - Taşınacak blokların bulunduğu sayfa düğümü
     * @param capacity - Sayfanın içeriği barındırma kapasitesi (px)
     */
    function moveOverflowBlocksToNextPage(pageNode: PageNode, capacity: number): void {
      if (typeof window !== 'undefined') {
        console.log('[DEBUG] moveOverflowBlocksToNextPage', { pageNode, capacity });
      }
      // İçerik bölümünü bul
      const contentSection = pageNode
        .getChildren()
        .find(isContentNode);
      if (contentSection == null) return;
      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;
      // İçerik DOM'unu al
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
      // Eğer içerik taşmıyorsa çık
      if (!(el.scrollHeight > adjustedCapacity + 2)) return;
      // Fazla bloğu bul ve taşı
      let nextPage = pageNode.getNextSibling();
      // Sonraki sayfa yoksa yeni bir sayfa oluştur
      if (!$isPageNode(nextPage)) {
        // İlk sayfadaki header/footer'ı yeni sayfaya geçir
        const root = $getRoot();
        const allPages = root.getChildren().filter($isPageNode) as PageNode[];
        let headerToCopy = undefined;
        let footerToCopy = undefined;
        if (allPages.length > 0) {
          const firstPage = allPages[0];
          headerToCopy = firstPage.getHeaderNode();
          footerToCopy = firstPage.getFooterNode();
        }
        nextPage = $createPageNode();
        // Header ve footer parametre olarak yeni sayfaya aktarılır
        if (typeof nextPage.ensureHeaderFooterContentChildren === 'function') {
          nextPage.ensureHeaderFooterContentChildren(headerToCopy, footerToCopy);
          if (typeof window !== 'undefined') {
            console.log('[DEBUG] nextPage children after ensureHeaderFooterContentChildren:', nextPage.getChildren().map((n: any) => n.getType()));
          }
        }
        pageNode.insertAfter(nextPage);
        // Lexical update sonrası children'ı tekrar kontrol et (asenkron)
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            editor.update(() => {
              console.log('[DEBUG] nextPage children after insertAfter + tick:', nextPage.getChildren().map((n: any) => n.getType()));
              // Ayrıca header/footer node'larının kendisini de logla
              const header = nextPage.getHeaderNode();
              const footer = nextPage.getFooterNode();
              console.log('[DEBUG] nextPage.getHeaderNode():', header);
              console.log('[DEBUG] nextPage.getFooterNode():', footer);
            });
          }, 0);
        }
      }
      // Sonraki sayfanın içerik bölümünü bul
      const nextContent = nextPage
        .getChildren()
        .find(isContentNode);
      if (nextContent == null) return;
      // Son bloğu taşı (en son eklenen blok taşınır)
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

    /**
     * reflowPass
     *
     * Tüm sayfaları kontrol eder, taşma varsa fazla blokları bir sonraki sayfaya taşır.
     * Gerekirse root'a yeni sayfa ekler veya root dışı node'ları yeni bir sayfaya taşır.
     *
     * @returns boolean - Herhangi bir bloğun taşınıp taşınmadığını belirtir
     */
    function reflowPass(): boolean {
      if (typeof window !== 'undefined') {
        console.log('[DEBUG] reflowPass called');
      }
      let didMoveAny = false;
      editor.update(() => {
        // Root node'u al
        const root = $getRoot();
        // Eğer hiç sayfa yoksa, bir tane ekle
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
                .find(isContentNode);
              if (contentSection != null) contentSection.append(n as any); // LexicalNode olarak cast
            }
          });
          root.append(page);
        }
        // Tüm sayfalar için taşma kontrolü
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
          // Eğer içerik kapasiteyi aşıyorsa, fazla bloğu taşı
          if (usedScroll > capacity + 2) {
            moveOverflowBlocksToNextPage(pageNode, capacity);
            didMoveAny = true;
          }
          page = pageNode.getNextSibling();
        }
      });
      return didMoveAny;
    }

    /**
     * schedule
     *
     * reflowPass fonksiyonunu animasyon frame ve setTimeout ile optimize şekilde tetikler.
     * Aynı anda birden fazla reflow işlemi başlatılmasını engeller.
     */
    const schedule = (): void => {
      if (typeof window !== 'undefined') {
        console.log('[DEBUG] schedule reflow');
      }
      if (isReflowingRef.current) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30;
        const run = (): void => {
          const moved = reflowPass();
          passes++;
          // Eğer taşınan blok varsa ve maksimum tekrar sayısı aşılmadıysa devam et
          if (moved && passes < maxPasses) {
            setTimeout(run, 0);
          } else {
            isReflowingRef.current = false;
          }
        };
        setTimeout(run, 0);
      });
    };

    // İlk render'da ve bağımlılıklar değiştiğinde reflow işlemini başlat
    schedule();

    // Editor güncellendiğinde reflow işlemini tetikle
    const unregister = editor.registerUpdateListener((): void => {
      schedule();
    });

    // Plugin unmount edildiğinde temizlik işlemleri
    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
      isReflowingRef.current = false;
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  // Plugin herhangi bir DOM render etmez
  return null;
}
