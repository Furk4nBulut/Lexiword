import { useEffect } from 'react';
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
  $getSelection,
  $isRangeSelection
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

export type ToggleVisibilityPayload = boolean | undefined;
export const TOGGLE_HEADER_VISIBILITY_COMMAND: LexicalCommand<ToggleVisibilityPayload> = createCommand(
  'TOGGLE_HEADER_VISIBILITY_COMMAND'
);
export const TOGGLE_FOOTER_VISIBILITY_COMMAND: LexicalCommand<ToggleVisibilityPayload> = createCommand(
  'TOGGLE_FOOTER_VISIBILITY_COMMAND'
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

  const hasAnyContent = (section: HeaderNode | FooterNode | undefined): boolean => {
    if (!section) return false;
    if (section.getChildrenSize() > 0) return true;
    return section.getTextContent().trim().length > 0;
  };

  const safeAppendClonedChildren = (
    from: HeaderNode | FooterNode,
    to: HeaderNode | FooterNode
  ): void => {
    for (const child of from.getChildren()) {
      if ($isTextNode(child)) {
        to.append($createTextNode(child.getTextContent()));
      } else if (typeof (child as any).clone === 'function') {
        // Prefer instance clone when available
        to.append((child as any).clone());
      } else {
        // As a conservative fallback, skip nodes we can't safely clone
        // This avoids accidentally moving the original node between sections/pages.
        // Optionally, we could insert a paragraph placeholder here.
        // to.append($createParagraphNode());
      }
    }
  };

  // Copy header/footer content to all other pages, independently
  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    if (!$isElementNode(page)) continue;

    const header = page.getChildren().find($isHeaderNode) as HeaderNode | undefined;
    const footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;

    if (header && firstHeader && hasAnyContent(firstHeader)) {
      header.clear();
      safeAppendClonedChildren(firstHeader, header);
    }

    if (footer && firstFooter && hasAnyContent(firstFooter)) {
      footer.clear();
      safeAppendClonedChildren(firstFooter, footer);
    }
  }
}

function ensurePageStructure(): void {
  const root = $getRoot();
  let pages = root.getChildren();
  const stray = pages.filter((n) => !$isPageNode(n));
  if (stray.length > 0) {
    const page = $createPageNode();
    // First, normalize the root to contain just the new page
    root.clear();
    root.append(page);
    // Then move any stray nodes into the page content
    const content = page.getChildren().find($isContentNode) as ContentNode | undefined;
    stray.forEach((n) => content?.append(n));
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
    const setAllHeaderVisible = (visible: boolean): void => {
      const pages = $getRoot().getChildren();
      for (const page of pages) {
        if (!$isElementNode(page)) continue;
        const header = page.getChildren().find($isHeaderNode) as HeaderNode | undefined;
        header?.setVisible(visible);
      }
    };
    const setAllFooterVisible = (visible: boolean): void => {
      const pages = $getRoot().getChildren();
      for (const page of pages) {
        if (!$isElementNode(page)) continue;
        const footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;
        footer?.setVisible(visible);
      }
    };

    return editor.registerCommand(
      TOGGLE_HEADER_VISIBILITY_COMMAND,
      (payload: ToggleVisibilityPayload) => {
        editor.update(() => {
          // Determine current (sample first page)
          const first = $getRoot().getChildren().find($isElementNode);
          const header = first?.getChildren().find($isHeaderNode) as HeaderNode | undefined;
          const current = header?.isVisibleSection() ?? false;
          const next = payload ?? !current;
          setAllHeaderVisible(next);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    const setAllFooterVisible = (visible: boolean): void => {
      const pages = $getRoot().getChildren();
      for (const page of pages) {
        if (!$isElementNode(page)) continue;
        const footer = page.getChildren().find($isFooterNode) as FooterNode | undefined;
        footer?.setVisible(visible);
      }
    };

    return editor.registerCommand(
      TOGGLE_FOOTER_VISIBILITY_COMMAND,
      (payload: ToggleVisibilityPayload) => {
        editor.update(() => {
          const first = $getRoot().getChildren().find($isElementNode);
          const footer = first?.getChildren().find($isFooterNode) as FooterNode | undefined;
          const current = footer?.isVisibleSection() ?? false;
          const next = payload ?? !current;
          setAllFooterVisible(next);
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
        return;
      }

      // Prevent cross-section merges when deleting at boundaries inside sections
      if (e.key === 'Backspace' || e.key === 'Delete') {
        let shouldPrevent = false;
        let ensureIn: HeaderNode | FooterNode | null = null;
        // Use editor.read to safely access Lexical selection/state
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
          const anchor = selection.anchor;
          let node: any = anchor.getNode();
          // Walk up to find section element
          let section: any = node;
          while (section && !$isHeaderNode(section) && !$isFooterNode(section) && !$isContentNode(section)) {
            section = section.getParent && section.getParent();
          }
          if (!section) return;
          // Only apply inside a known section
          if (!$isHeaderNode(section) && !$isFooterNode(section) && !$isContentNode(section)) return;
          // Determine boundary position
          const isBackspace = e.key === 'Backspace';
          const isDelete = e.key === 'Delete';

          // Helper to check if caret is at very start of section
          const isAtSectionStart = (): boolean => {
            // Find the lowest element that is direct child of section
            let current: any = anchor.getNode();
            if (current.isElement && current.isElement()) {
              // Try to go into text node at start
              const first = current.getFirstDescendant();
              if (first) current = first;
            }
            // If inside a text node, offset must be 0
            if (current.getTextContentSize && anchor.offset !== 0) return false;
            // Climb to direct child of section, verifying no previous siblings on the way
            let container: any = current;
            while (container && container.getParent && container.getParent() !== section) {
              if (container.getPreviousSibling && container.getPreviousSibling()) return false;
              container = container.getParent();
            }
            if (!container || container.getParent() !== section) return false;
            return container.getPreviousSibling() == null;
          };

          const isAtSectionEnd = (): boolean => {
            let current: any = anchor.getNode();
            if (current.isElement && current.isElement()) {
              const last = current.getLastDescendant();
              if (last) current = last;
            }
            // If inside a text node, offset must be at end
            if (current.getTextContentSize && anchor.offset !== current.getTextContentSize()) return false;
            let container: any = current;
            while (container && container.getParent && container.getParent() !== section) {
              if (container.getNextSibling && container.getNextSibling()) return false;
              container = container.getParent();
            }
            if (!container || container.getParent() !== section) return false;
            return container.getNextSibling() == null;
          };

          const atStart = isAtSectionStart();
          const atEnd = isAtSectionEnd();

          // Block merges for header/footer boundaries
          if (($isHeaderNode(section) || $isFooterNode(section)) && ((isBackspace && atStart) || (isDelete && atEnd))) {
            shouldPrevent = true;
            ensureIn = section as HeaderNode | FooterNode;
          }

          // Also block merges for content when crossing into header/footer
          if ($isContentNode(section)) {
            if ((isBackspace && atStart) || (isDelete && atEnd)) {
              shouldPrevent = true;
              ensureIn = null; // content doesn't need paragraph guarantee here but we keep structure
            }
          }
        });

        if (shouldPrevent) {
          e.preventDefault();
          // Ensure the section keeps at least one paragraph to avoid merges
          editor.update(() => {
            const section = ensureIn;
            if (section && $isElementNode(section)) {
              if (section.getChildrenSize() === 0) {
                section.append($createParagraphNode());
              }
            }
          });
          return;
        }
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
            // Determine visibility from the first page nodes to compute capacity
            const root = $getRoot();
            const sample = root.getChildren().find($isElementNode) as any;
            const headerNode = sample?.getChildren().find($isHeaderNode) as HeaderNode | undefined;
            const footerNode = sample?.getChildren().find($isFooterNode) as FooterNode | undefined;
            const headerVisible = headerNode?.isVisibleSection() ?? false;
            const footerVisible = footerNode?.isVisibleSection() ?? false;

            const headerMm = headerVisible ? DEFAULT_PAGE_SECTION_SETTINGS.headerHeightMm : 0;
            const footerMm = footerVisible ? DEFAULT_PAGE_SECTION_SETTINGS.footerHeightMm : 0;
            const capacityMm =
              DEFAULT_PAGINATION_SETTINGS.pageHeight -
              DEFAULT_PAGINATION_SETTINGS.marginTop -
              DEFAULT_PAGINATION_SETTINGS.marginBottom -
              headerMm -
              footerMm;
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
          const tol = 6;
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
                // Ensure the newly created page container is observed for future overflows
                const newPageEl = editor.getElementByKey(newPage.getKey());
                if (newPageEl && newPageEl.classList.contains('page-container')) {
                  observer.observe(newPageEl as Element);
                }
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