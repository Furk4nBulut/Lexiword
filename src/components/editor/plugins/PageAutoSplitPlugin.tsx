/**
 * PageAutoSplitPlugin
 *
 * Lexical editöründe içerik bloklarını otomatik olarak sayfalara bölen bir React pluginidir.
 * Sayfa taşması (overflow) algılandığında, içerik yeni bir sayfaya aktarılır ve gerekirse header/footer klonlanır.
 *
 * - Sayfa yüksekliği ve kenar boşlukları parametre olarak alınır.
 * - DOM üzerinden içerik taşması kontrol edilir.
 * - Taşma varsa yeni sayfa oluşturulur ve içerik taşan bloklar yeni sayfaya aktarılır.
 * - Header/footer senkronizasyonu ve sayfa numaralandırma desteklenir.
 * - requestAnimationFrame ile reflow işlemi animasyon çerçevesinde yapılır.
 *
 * Bu plugin, editördeki içerik bir sayfaya sığmadığında otomatik olarak yeni bir sayfa açar ve taşan içeriği oraya taşır.
 * Böylece, dinamik olarak sayfa bölme ve içerik akışı sağlanır.
 */
import type { LexicalNode } from 'lexical';
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import { setHeaderFooterSyncEnabled } from '../context/HeaderFooterSyncModeContext';
import PageNumberNode, { $createPageNumberNode } from '../nodes/PageNumberNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageContentNode } from '../nodes/PageContentNode';

/**
 * Sayfa akış ayarları arayüzü
 * pageHeightMm: Sayfa yüksekliği (mm cinsinden)
 * marginTopMm: Üst kenar boşluğu (mm)
 * marginBottomMm: Alt kenar boşluğu (mm)
 *
 * Bu ayarlar, her bir sayfanın fiziksel boyutunu ve içerik alanını belirler.
 * Sayfa bölme algoritması bu değerlere göre taşma olup olmadığını hesaplar.
 */
export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

/**
 * Bir section (header/footer/content) node'unu klonlar.
 * Çocuklarını da klonlayarak yeni bir node oluşturur.
 *
 * @param sectionNode Klonlanacak node (ör: header, footer, content)
 * @returns Klonlanmış yeni node veya null
 *
 * Not: Sadece LexicalNode türündeki node'lar için çalışır.
 */
function cloneSection<T extends LexicalNode>(sectionNode: T | null): T | null {
  if (sectionNode == null) return null;
  const SectionClass = sectionNode.constructor as new () => T;
  const clonedSection = new SectionClass();
  sectionNode.getChildren().forEach((child: LexicalNode | null | undefined) => {
    if (child !== null && child !== undefined && typeof (child as any).clone === 'function') {
      clonedSection.append((child as any).clone());
    }
  });
  return clonedSection;
}

/**
 * PageAutoSplitPlugin React bileşeni
 *
 * Sayfa taşmasını algılar, taşan içerik bloklarını yeni sayfaya taşır ve gerekirse yeni sayfa oluşturur.
 *
 * @param pageHeightMm - Sayfa yüksekliği (mm)
 * @param marginTopMm - Üst kenar boşluğu (mm)
 * @param marginBottomMm - Alt kenar boşluğu (mm)
 */
export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  // Lexical editör context'ini alıyoruz. Editörle etkileşim için kullanılır.
  const [editor] = useLexicalComposerContext();
  // Şu anda reflow işlemi devam ediyor mu bilgisini tutar. Döngüsel taşma önlenir.
  const isReflowingRef = useRef(false);
  // requestAnimationFrame ile yapılan animasyonun id'sini saklar. Temizlik için gereklidir.
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    /**
     * Editörde herhangi bir sayfa taşması (overflow) var mı kontrol eder.
     *
     * Her sayfanın DOM elementini bulur, içerik yüksekliğini ve kapasitesini ölçer.
     * Eğer içerik kapasiteyi aşıyorsa overflow = true olur.
     *
     * @returns En az bir sayfa taşmışsa true, yoksa false
     */
    function isAnyPageOverflow(): boolean {
      const root = $getRoot(); // Editörün kök node'u
      let overflow = false;
      root.getChildren().forEach((child) => {
        if ($isPageNode(child)) {
          // Her sayfa için DOM elementini al
          const pageEl = editor.getElementByKey(child.getKey());
          if (pageEl !== null && pageEl !== undefined) {
            // Sayfa içeriği ve kapasite ölçülür
            const {
              el: contentDomEl,
              height: capacity,
              paddingTop,
              paddingBottom
            } = getContentMetrics(pageEl);
            // İçerik alanı varsa onu, yoksa tüm sayfa elementini kullan
            const targetForScroll = contentDomEl ?? pageEl;
            // Kullanılan scroll yüksekliğini hesapla
            const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);
            // Eğer içerik kapasiteyi aşıyorsa taşma var
            if (usedScroll > capacity + 2) {
              overflow = true;
            }
          }
        }
      });
      return overflow;
    }

    /**
     * PageNode'dan DOM elementini döndürür.
     *
     * @param page PageNode nesnesi
     * @returns DOM element veya null
     */
    function getPageEl(page: PageNode): HTMLElement | null {
      return editor.getElementByKey(page.getKey());
    }

    /**
     * Sayfa içeriğinin DOM ölçümlerini döndürür.
     *
     * - İçerik section'unun DOM elementini bulur.
     * - getBoundingClientRect ile yükseklik/top/bottom ölçer.
     * - CSS padding değerlerini alır.
     *
     * @param pageEl Sayfa DOM elementi
     * @returns İçerik alanı DOM'u, top, bottom, height, paddingTop, paddingBottom
     */
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
      const target = contentEl !== null && contentEl !== undefined ? contentEl : pageEl;
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
     * İçerik alanının scroll yüksekliğini döndürür.
     *
     * DOM elementinin scrollHeight'ından padding'ler çıkarılır.
     *
     * @param targetEl İçerik DOM elementi
     * @param paddingTop Üst padding
     * @param paddingBottom Alt padding
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
     * Taşan blokları bir sonraki sayfaya taşır.
     * Gerekirse yeni sayfa oluşturur ve header/footer klonlar.
     *
     * - Önce mevcut sayfanın içerik section'unu bulur.
     * - Header/footer yüksekliğini DOM'dan ölçer.
     * - Kapasiteyi aşan durumda yeni sayfa oluşturur.
     * - Son bloğu çıkarıp yeni sayfaya ekler.
     *
     * @param pageNode Taşma olan sayfa node'u
     * @param capacity Sayfanın kapasitesi (px)
     */
    function moveOverflowBlocksToNextPage(pageNode: PageNode, capacity: number): void {
      // İçerik section'unu bul (her sayfanın bir content node'u olmalı)
      const contentSection = pageNode.getChildren().find(isContentNode);
      if (contentSection === null || contentSection === undefined) return;
      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;
      const el = editor.getElementByKey(contentSection.getKey());
      if (el === null || el === undefined) return;

      // Header ve footer node'larını bul (varsa)
      const pageHeader = pageNode.getChildren().find(isHeaderNode);
      const pageFooter = pageNode.getChildren().find(isFooterNode);

      // Header/footer yüksekliğini DOM'dan ölç (yoksa 0)
      let headerHeight = 0;
      let footerHeight = 0;
      if (pageHeader !== null && pageHeader !== undefined) {
        const headerEl = editor.getElementByKey(pageHeader.getKey());
        if (headerEl !== null && headerEl !== undefined) headerHeight = headerEl.offsetHeight;
      }
      if (pageFooter !== null && pageFooter !== undefined) {
        const footerEl = editor.getElementByKey(pageFooter.getKey());
        if (footerEl !== null && footerEl !== undefined) footerHeight = footerEl.offsetHeight;
      }
      const minLineGap = 24; // Sayfa altına min boşluk bırak
      const adjustedCapacity = capacity - headerHeight - footerHeight - minLineGap;
      if (!(el.scrollHeight > adjustedCapacity + 2)) return;

      // Sonraki sayfa yoksa yeni bir sayfa oluştur ve header/footer klonla
      let nextPage = pageNode.getNextSibling();
      if (!$isPageNode(nextPage)) {
        setHeaderFooterSyncEnabled(false); // Header/footer sync geçici kapat
        nextPage = $createPageNode();
        const newHeader = cloneSection(pageHeader ?? null);
        if (newHeader !== null) nextPage.append(newHeader);
        nextPage.append(new PageContentNode());
        const newFooter = cloneSection(pageFooter ?? null);
        if (newFooter !== null) nextPage.append(newFooter);
        const root = pageNode.getParent();
        if (root !== null) {
          const allPages = root.getChildren().filter($isPageNode);
          const hasPageNumber = allPages.some((p) =>
            p.getChildren().some((c) => c instanceof PageNumberNode)
          );
          if (hasPageNumber) {
            const pageNumber = allPages.length + 1;
            nextPage.append($createPageNumberNode(String(pageNumber)));
          }
        }
        setHeaderFooterSyncEnabled(true); // Sync tekrar aç
        pageNode.insertAfter(nextPage);
      }

      // Sonraki sayfanın içerik section'unu bul (yeni oluşturulduysa boş olur)
      const nextContent = nextPage.getChildren().find(isContentNode);
      if (nextContent === null || nextContent === undefined) return;

      // Eğer sadece bir blok varsa taşımaya gerek yok (bölünemez)
      if (blocks.length === 1) {
        return;
      }

      // Son bloğu mevcut sayfadan çıkarıp yeni sayfanın başına ekle
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock !== null && lastBlock !== undefined) {
        lastBlock.remove();
        const insertedBlock: LexicalNode | null = lastBlock;
        // Yeni sayfanın content section'u boş değilse başına ekle, yoksa sona ekle
        const firstChildInNext = nextContent.getFirstChild();
        if (firstChildInNext !== null && firstChildInNext !== undefined) {
          firstChildInNext.insertBefore(lastBlock);
        } else {
          nextContent.append(lastBlock);
        }
        // Sadece ve sadece kullanıcı gerçekten sayfanın en sonunda (caret en sonda) ise cursor'u taşı
        const isLastBlock = blocks.length > 0 && lastBlock === blocks[blocks.length - 1];
        if (isLastBlock) {
          // Editör state'inde selection gerçekten son block'un SONUNDA mı?
          const selectionState = editor.getEditorState().read(() => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            const range = selection.getRangeAt(0);
            // Son block'un DOM elementini bul
            const lastBlockEl = editor.getElementByKey(lastBlock.getKey());
            if (!lastBlockEl) return false;
            // Caret gerçekten son block'un DOM'unda ve block'un SONUNDA mı?
            // (range.collapsed && range.endContainer == lastBlockEl veya child'ı && endOffset == text uzunluğu)
            if (!range.collapsed) return false;
            // Eğer bir text node ise ve caret textin sonunda ise
            if (range.endContainer.nodeType === Node.TEXT_NODE && lastBlockEl.contains(range.endContainer)) {
              return range.endOffset === range.endContainer.textContent?.length;
            }
            // Eğer block elementin kendisindeyse ve offset child sayısı kadar ise (yani en sonda)
            if (range.endContainer === lastBlockEl && range.endOffset === lastBlockEl.childNodes.length) {
              return true;
            }
            return false;
          });
          if (selectionState) {
            editor.update(() => {
              try {
                let selectionNode = insertedBlock;
                if (
                  insertedBlock !== null &&
                  typeof ((insertedBlock as unknown) as { getFirstDescendant?: () => unknown }).getFirstDescendant === 'function'
                ) {
                  const desc = ((insertedBlock as unknown) as { getFirstDescendant: () => unknown }).getFirstDescendant();
                  if (
                    desc !== null &&
                    desc !== undefined &&
                    typeof ((desc as unknown) as { select?: (anchorOffset: number, focusOffset: number) => void }).select === 'function'
                  ) {
                    selectionNode = desc as LexicalNode;
                  }
                }
                if (
                  selectionNode !== null &&
                  selectionNode !== undefined &&
                  typeof ((selectionNode as unknown) as { select?: (anchorOffset: number, focusOffset: number) => void }).select === 'function'
                ) {
                  ((selectionNode as unknown) as { select: (anchorOffset: number, focusOffset: number) => void }).select(0, 0);
                }
              } catch (e) {
                // ignore
              }
            });
          }
        }
      }
    }

    /**
     * Bir reflow döngüsü çalıştırır. Taşan blokları yeni sayfaya taşır.
     *
     * - Her sayfa için taşma kontrolü yapılır.
     * - Taşma varsa moveOverflowBlocksToNextPage çağrılır.
     * - En az bir blok taşındıysa true döner.
     *
     * @returns En az bir blok taşındıysa true, yoksa false
     */
    function reflowPass(): boolean {
      let didMoveAny = false;
      editor.update(() => {
        const root = $getRoot();
        // Hiç sayfa yoksa bir tane oluştur (boş editör)
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }
        const children = root.getChildren();
        // Sayfa olmayan node'lar varsa yeni sayfaya aktar (ör: ilk yüklemede)
        const hasNonPage = children.some((n) => !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          const contentSection = page.getChildren().find(isContentNode);
          if (contentSection !== null && contentSection !== undefined) {
            children.forEach((n) => {
              if (!$isPageNode(n)) {
                contentSection.append(n);
              }
            });
          }
          root.append(page);
        }
        // Her sayfa için taşma kontrolü ve taşan blokları yeni sayfaya taşı
        let page = root.getFirstChild();
        while (page !== null && $isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null || pageEl === undefined) {
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

    /**
     * Eğer taşma varsa reflow işlemini başlatır.
     * requestAnimationFrame ile döngüsel olarak çalışır.
     *
     * - isAnyPageOverflow ile taşma kontrol edilir.
     * - Taşma varsa reflowPass tekrar tekrar çağrılır.
     * - Döngü maxPasses kadar sürer (sonsuz döngü önlenir).
     */
    function triggerReflowIfNeeded(): void {
      if (isReflowingRef.current) return;
      editor.getEditorState().read(() => {
        if (!isAnyPageOverflow()) return;

        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30; // Güvenlik ağı

        function run(): void {
          // Önceki animasyon çerçevesini temizle
          if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
          }

          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            // setTimeout yerine requestAnimationFrame kullan
            animationFrameIdRef.current = requestAnimationFrame(run);
          } else {
            isReflowingRef.current = false;
            animationFrameIdRef.current = null;
          }
        }
        run();
      });
    }

    // İlk render ve her güncellemede reflow tetikle (editör güncellenince taşma kontrolü yapılır)
    triggerReflowIfNeeded();
    const unregister = editor.registerUpdateListener((): void => {
      triggerReflowIfNeeded();
    });

    // Component kaldırıldığında temizlik işlemleri (event listener ve animasyon çerçevesi temizlenir)
    return (): void => {
      unregister();
      isReflowingRef.current = false;
      // Bekleyen animasyon çerçevesi varsa iptal et
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  // Plugin bir UI render etmez, sadece yan etki olarak çalışır.
  return null;
}
