import { useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  $createParagraphNode,
  $isTextNode,
  $createTextNode,
  $createRangeSelection,
  $setSelection,
  type LexicalNode
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
import { $createPageNode, $isPageNode, type PageNode } from '../page/PageNode';
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

function syncHeaderFooterContent(): void {
  const root = $getRoot();
  const pages = root.getChildren();
  if (pages.length <= 1) return;
  
  const firstPage = pages[0];
  if (!$isElementNode(firstPage)) return;
  
  const firstHeader = firstPage.getChildren().find($isHeaderNode) as HeaderNode | undefined;
  const firstFooter = firstPage.getChildren().find($isFooterNode) as FooterNode | undefined;
  
  if (!firstHeader || !firstFooter) return;
  
  // Only sync if first page has content
  const firstHeaderText = firstHeader.getTextContent();
  const firstFooterText = firstFooter.getTextContent();
  
  // If first page header/footer is empty, don't sync
  if (!firstHeaderText.trim() && !firstFooterText.trim()) return;
  
  // Copy header/footer content to all other pages
  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    if (!$isElementNode(page)) continue;
    
    const header = page.getChildren().find($isHeaderNode) as HeaderNode | undefined;
    const footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;
    
    if (header && footer) {
      // Copy header content only if first page has content
      if (firstHeaderText.trim()) {
        header.clear();
        for (const child of firstHeader.getChildren()) {
          if ($isTextNode(child)) {
            header.append($createTextNode(child.getTextContent()));
          } else if (typeof child.clone === 'function') {
            header.append(child.clone());
          } else {
            // For other nodes, try to create a new instance
            const Ctor = (child as any).constructor;
            if (typeof Ctor?.clone === 'function') {
              header.append(Ctor.clone(child));
            } else {
              header.append(child);
            }
          }
        }
      }
      
      // Copy footer content only if first page has content
      if (firstFooterText.trim()) {
        footer.clear();
        for (const child of firstFooter.getChildren()) {
          if ($isTextNode(child)) {
            footer.append($createTextNode(child.getTextContent()));
          } else if (typeof child.clone === 'function') {
            footer.append(child.clone());
          } else {
            // For other nodes, try to create a new instance
            const Ctor = (child as any).constructor;
            if (typeof Ctor?.clone === 'function') {
              footer.append(Ctor.clone(child));
            } else {
              footer.append(child);
            }
          }
        }
      }
    }
  }
}

function ensurePageStructure(): void {
  const root = $getRoot();
  let pages = root.getChildren();
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
  
  // After ensuring structure, sync header/footer content
  syncHeaderFooterContent();
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

function selectAllInSection(mode: SectionMode): void {
  const pages = $getRoot().getChildren().filter($isPageNode) as PageNode[];
  if (pages.length === 0) return;

  let allTextNodes: any[] = [];
  const selector = ((): any => {
    switch (mode) {
      case 'header':
        return $isHeaderNode;
      case 'footer':
        return $isFooterNode;
      default:
        return $isContentNode;
    }
  })();

  // Collect all text nodes from the specified section across all pages
  for (const page of pages) {
    const section = page.getChildren().find(selector);
    if (!section || !$isElementNode(section)) continue;
    const collectTextNodes = (node: any): void => {
      if ($isTextNode(node)) {
        allTextNodes.push(node);
      } else if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          collectTextNodes(child);
        }
      }
    };
    collectTextNodes(section);
  }

  if (allTextNodes.length > 0) {
    const firstNode = allTextNodes[0];
    const lastNode = allTextNodes[allTextNodes.length - 1];
    const sel = $createRangeSelection();
    sel.setTextNodeRange(firstNode, 0, lastNode, lastNode.getTextContentSize());
    $setSelection(sel);
  }
}

export function PageSectionPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
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
        setTimeout(() => {
          editor.update(() => {
            const mode = getActiveMode();
            selectAllInSection(mode);
          });
        }, 0);
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
    return editor.registerUpdateListener(() => {
      setTimeout(() => {
        editor.update(() => {
          ensurePageStructure();
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
        });
      }, 0);
    });
  }, [editor]);

  useEffect(() => {
    // Content overflow detection: create new page when content overflows
    const rootEl = editor.getRootElement();
    if (rootEl == null) return;

    let raf: number | null = null;
    let isAdding = false;

    const checkContentOverflow = (): void => {
      raf = requestAnimationFrame(() => {
        if (isAdding) return;
        const pageEls = Array.from(rootEl.querySelectorAll('.page-container')) as HTMLElement[];
        for (const pageEl of pageEls) {
          const contentEl = pageEl.querySelector('[data-lexical-page-section="content"]') as HTMLElement | null;
          if (!contentEl) continue;
          if (contentEl.clientHeight === 0) continue;
          const tol = 2;
          const overflow = contentEl.scrollHeight > contentEl.clientHeight + tol;
          if (!overflow) continue;

          isAdding = true;
          setTimeout(() => {
            editor.update(() => {
              const pages = $getRoot().getChildren().filter($isPageNode) as PageNode[];
              const page = pages.find((p) => editor.getElementByKey(p.getKey()) === pageEl);
              if (!page) {
                isAdding = false;
                return;
              }
              const hasNextPage = $isPageNode((page as any).getNextSibling?.());
              if (!hasNextPage) {
                const newPage = $createPageNode();
                page.insertAfter(newPage);
                // Sync header/footer content after creating new page
                syncHeaderFooterContent();
              }
              isAdding = false;
            });
          }, 0);
          break;
        }
      });
    };

    const observer = new ResizeObserver(() => checkContentOverflow());
    const pageContainers = rootEl.querySelectorAll('.page-container');
    pageContainers.forEach((el) => observer.observe(el));

    const interval = setInterval(checkContentOverflow, 300);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      clearInterval(interval);
      observer.disconnect();
    };
  }, [editor]);

  useEffect(() => {
    editor.update(() => {
      updateAllSectionsEditable('content');
      ensurePageStructure();
    });
  }, [editor]);

  return null;
} 