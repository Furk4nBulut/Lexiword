import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
  $createParagraphNode
} from 'lexical';
import {
  $isHeaderNode,
  $isFooterNode,
  $isContentNode,
  $createHeaderNode,
  $createContentNode,
  $createFooterNode,
  type HeaderNode,
  type FooterNode,
  type ContentNode
} from './PageSectionNodes';
import { DEFAULT_PAGE_SECTION_SETTINGS } from './PageSectionSettings';
import { $createPageNode, $isPageNode, type PageNode } from '../page';
import { DEFAULT_PAGINATION_SETTINGS } from '../pagebreak/PageBreakSettings';

export type SectionMode = 'content' | 'header' | 'footer';

export const SET_SECTION_MODE_COMMAND: LexicalCommand<SectionMode> = createCommand(
  'SET_SECTION_MODE_COMMAND'
);

function updateAllSectionsEditable(mode: SectionMode): void {
  const root = $getRoot();
  const pages = root.getChildren();
  for (const page of pages) {
    if (!$isElementNode(page)) continue;
    const header = page.getChildren().find($isHeaderNode) as HeaderNode | undefined;
    const content = page.getChildren().find($isContentNode) as ContentNode | undefined;
    const footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;
    header?.setEditable(mode === 'header');
    content?.setEditable(mode === 'content');
    footer?.setEditable(mode === 'footer');
  }
}

function syncSectionAcrossPages(selector: (nodes: any[]) => any | undefined, sourcePageKey?: string): void {
  const root = $getRoot();
  const pages = root.getChildren();
  if (pages.length <= 1) return;
  const first = sourcePageKey
    ? pages.find((p) => p.getKey() === sourcePageKey)
    : pages[0];
  if (!$isElementNode(first)) return;
  const source = selector(first.getChildren());
  if (source == null || !$isElementNode(source)) return;

  const sourceChildren = source.getChildren();
  for (const page of pages) {
    if (page.getKey() === source.getParent()?.getKey()) continue;
    if (!$isElementNode(page)) continue;
    const target = selector(page.getChildren());
    if (target == null || !$isElementNode(target)) continue;
    const newChildren = sourceChildren.map((c: LexicalNode) => c.clone());
    target.clear().append(...newChildren);
  }
}

function cloneHeaderFooterFrom(sourcePage: PageNode, targetPage: PageNode): void {
  const first = sourcePage;
  const srcHeader = first.getChildren().find($isHeaderNode) as HeaderNode | undefined;
  const srcFooter = first.getChildren().find($isFooterNode) as FooterNode | undefined;
  const dstHeader = targetPage.getChildren().find($isHeaderNode) as HeaderNode | undefined;
  const dstFooter = targetPage.getChildren().find($isFooterNode) as FooterNode | undefined;
  if (srcHeader && dstHeader) {
    const newChildren = srcHeader.getChildren().map((c: LexicalNode) => c.clone());
    dstHeader.clear().append(...newChildren);
  }
  if (srcFooter && dstFooter) {
    const newChildren = srcFooter.getChildren().map((c: LexicalNode) => c.clone());
    dstFooter.clear().append(...newChildren);
  }
}

function ensurePageStructure(): void {
  const root = $getRoot();
  let pages = root.getChildren();
  // Wrap stray nodes into a page content
  const stray = pages.filter((n) => !$isPageNode(n));
  if (stray.length > 0) {
    const page = $createPageNode();
    const content = page.getChildren().find($isContentNode) as ContentNode | undefined;
    stray.forEach((n) => content?.append(n));
    root.clear();
    root.append(page);
    pages = root.getChildren();
  }

  for (const page of pages) {
    if (!$isElementNode(page)) continue;
    let header = page.getChildren().find($isHeaderNode) as HeaderNode | undefined;
    let content = page.getChildren().find($isContentNode) as ContentNode | undefined;
    let footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;

    if (!header) {
      header = $createHeaderNode(false);
      const firstChild = page.getFirstChild();
      if (firstChild) firstChild.insertBefore(header);
      else page.append(header);
    }
    if (!content) {
      content = $createContentNode(true);
      const footerNode = page.getChildren().find($isFooterNode) as FooterNode | undefined;
      if (footerNode) footerNode.insertBefore(content);
      else page.append(content);
    }
    if (!footer) {
      footer = $createFooterNode(false);
      page.append(footer);
    }

    // Ensure each section has at least one paragraph for caret
    const ensureParagraph = (node: any) => {
      if (!$isElementNode(node)) return;
      if (node.getChildren().length === 0) {
        node.append($createParagraphNode());
      }
    };
    ensureParagraph(header);
    ensureParagraph(content);
    ensureParagraph(footer);
  }
}

function getActiveMode(): SectionMode {
  const root = $getRoot();
  const sample = root.getChildren().find($isElementNode) as any;
  if (!sample) return 'content';
  const header = sample.getChildren().find($isHeaderNode) as HeaderNode | undefined;
  const content = sample.getChildren().find($isContentNode) as ContentNode | undefined;
  const footer = sample.getChildren().find($isFooterNode) as FooterNode | undefined;
  if (header?.isEditableSection()) return 'header';
  if (footer?.isEditableSection()) return 'footer';
  return 'content';
}

export function PageSectionPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Default mode: content editable
    return editor.registerCommand(
      SET_SECTION_MODE_COMMAND,
      (mode: SectionMode) => {
        editor.update(() => {
          updateAllSectionsEditable(mode);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    // Double click handler to switch modes + Ctrl+A scope
    const rootEl = editor.getRootElement();
    if (rootEl == null) return;

    const onDblClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-lexical-page-section]') as HTMLElement | null;
      if (sectionEl == null) return;
      const type = sectionEl.getAttribute('data-lexical-page-section');
      if (type === 'header' || type === 'content' || type === 'footer') {
        editor.dispatchCommand(SET_SECTION_MODE_COMMAND, type);
      }
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        editor.update(() => {
          const mode = getActiveMode();
          const pages = $getRoot().getChildren().filter($isPageNode) as PageNode[];
          if (pages.length === 0) return;
          const firstPage = pages[0];
          const section = ((): any => {
            switch (mode) {
              case 'header':
                return firstPage.getChildren().find($isHeaderNode);
              case 'footer':
                return firstPage.getChildren().find($isFooterNode);
              default:
                return firstPage.getChildren().find($isContentNode);
            }
          })();
          if (!section || !$isElementNode(section)) return;
          const findDeepFirst = (node: any): any => {
            let cur: any = node.getFirstChild();
            while (cur && $isElementNode(cur) && cur.getChildren().length > 0) {
              cur = cur.getFirstChild();
            }
            return cur ?? node;
          };
          const findDeepLast = (node: any): any => {
            let cur: any = node.getLastChild();
            while (cur && $isElementNode(cur) && cur.getChildren().length > 0) {
              cur = cur.getLastChild();
            }
            return cur ?? node;
          };
          const startNode = findDeepFirst(section);
          const endNode = findDeepLast(section);
          if (startNode && endNode) {
            startNode.selectStart();
            endNode.selectEnd();
          }
        });
      }
    };

    rootEl.addEventListener('dblclick', onDblClick);
    rootEl.addEventListener('keydown', onKeyDown, true);
    return () => {
      rootEl.removeEventListener('dblclick', onDblClick);
      rootEl.removeEventListener('keydown', onKeyDown, true);
    };
  }, [editor]);

  useEffect(() => {
    // Enforce structure and sync header/footer on updates
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        ensurePageStructure();
        // Apply fixed DOM heights for header/footer and max height for content
        const rootEl = editor.getRootElement();
        if (rootEl) {
          const headerEls = rootEl.querySelectorAll('[data-lexical-page-section="header"]');
          const footerEls = rootEl.querySelectorAll('[data-lexical-page-section="footer"]');
          const contentEls = rootEl.querySelectorAll('[data-lexical-page-section="content"]');
          headerEls.forEach(
            (el) => ((el as HTMLElement).style.minHeight = `${DEFAULT_PAGE_SECTION_SETTINGS.headerHeightMm}mm`)
          );
          footerEls.forEach(
            (el) => ((el as HTMLElement).style.minHeight = `${DEFAULT_PAGE_SECTION_SETTINGS.footerHeightMm}mm`)
          );
          const capacityMm =
            DEFAULT_PAGINATION_SETTINGS.pageHeight -
            DEFAULT_PAGINATION_SETTINGS.marginTop -
            DEFAULT_PAGINATION_SETTINGS.marginBottom -
            DEFAULT_PAGE_SECTION_SETTINGS.headerHeightMm -
            DEFAULT_PAGE_SECTION_SETTINGS.footerHeightMm;
          contentEls.forEach((el) => {
            const elt = el as HTMLElement;
            elt.style.maxHeight = `${capacityMm}mm`;
            elt.style.overflow = 'hidden';
          });
        }

        // Sync header/footer content if in their edit modes
        const activeElement = document.activeElement;
        if (activeElement) {
          const activeSection = activeElement.closest('[data-lexical-page-section]');
          if (activeSection) {
            const sectionType = activeSection.getAttribute('data-lexical-page-section');
            const page = activeElement.closest('.page-container');
            if (page) {
              const pageKey = (page as any)._lexicalKey;
              if (pageKey) {
                if (sectionType === 'header') {
                  syncSectionAcrossPages((children) => children.find($isHeaderNode), pageKey);
                } else if (sectionType === 'footer') {
                  syncSectionAcrossPages((children) => children.find($isFooterNode), pageKey);
                }
              }
            }
          }
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    // Overflow detection: when content section scrollHeight exceeds clientHeight slightly, append new page.
    const rootEl = editor.getRootElement();
    if (rootEl == null) return;

    let raf: number | null = null;

    const checkOverflow = (): void => {
      raf = requestAnimationFrame(() => {
        editor.update(() => {
          const pages = $getRoot().getChildren().filter($isPageNode) as PageNode[];
          for (const page of pages) {
            const dom = editor.getElementByKey(page.getKey());
            if (!dom) continue;
            const contentEl = dom.querySelector('[data-lexical-page-section="content"]') as HTMLElement | null;
            const container = dom as HTMLElement;
            const target = contentEl ?? container;
            if (target.clientHeight === 0) continue;
            const tol = 2; // px tolerance
            if (target.scrollHeight > target.clientHeight + tol) {
              // Append a new page after this one and copy header/footer from the current page
              const newPage = $createPageNode();
              page.insertAfter(newPage);
              cloneHeaderFooterFrom(page, newPage);
              break;
            }
          }
        });
      });
    };

    const observer = new ResizeObserver(() => checkOverflow());
    const pageContainers = rootEl.querySelectorAll('.page-container');
    pageContainers.forEach((el) => observer.observe(el));

    const interval = setInterval(checkOverflow, 300);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      clearInterval(interval);
      observer.disconnect();
    };
  }, [editor]);

  // Ensure initial state: content editable, others readonly
  useEffect(() => {
    editor.update(() => {
      updateAllSectionsEditable('content');
      ensurePageStructure();
    });
  }, [editor]);

  return null;
}
