import { useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
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
import { $createPageNode, $isPageNode } from '../page/PageNode';

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

function syncSectionAcrossPages(selector: (nodes: any[]) => any | undefined): void {
  const root = $getRoot();
  const pages = root.getChildren();
  if (pages.length <= 1) return;
  const first = pages[0];
  if (!$isElementNode(first)) return;
  const source = selector(first.getChildren());
  if (source == null || !$isElementNode(source)) return;

  const sourceChildren = source.getChildren().map((c) => c.clone());
  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    if (!$isElementNode(page)) continue;
    const target = selector(page.getChildren());
    if (target == null || !$isElementNode(target)) continue;
    target.clear();
    for (const child of sourceChildren) target.append(child.clone());
  }
}

function ensurePageStructure(): void {
  const root = $getRoot();
  let pages = root.getChildren();
  // Wrap stray nodes into a page content
  if (pages.some((n) => !$isElementNode(n) || !$isPageNode(n))) {
    const page = $createPageNode();
    for (const n of pages) {
      if (!$isPageNode(n)) {
        const content = page.getChildren().find($isContentNode) as ContentNode | undefined;
        content?.append(n);
      }
    }
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
    // Double click handler to switch modes
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

    rootEl.addEventListener('dblclick', onDblClick);
    return () => {
      rootEl.removeEventListener('dblclick', onDblClick);
    };
  }, [editor]);

  useEffect(() => {
    // Enforce structure and sync header/footer on updates
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        ensurePageStructure();
        // Apply fixed DOM heights for header/footer
        const rootEl = editor.getRootElement();
        if (rootEl) {
          const headerEls = rootEl.querySelectorAll('[data-lexical-page-section="header"]');
          const footerEls = rootEl.querySelectorAll('[data-lexical-page-section="footer"]');
          headerEls.forEach((el) => (el as HTMLElement).style.minHeight = `${DEFAULT_PAGE_SECTION_SETTINGS.headerHeightMm}mm`);
          footerEls.forEach((el) => (el as HTMLElement).style.minHeight = `${DEFAULT_PAGE_SECTION_SETTINGS.footerHeightMm}mm`);
        }

        // Sync header/footer content if in their edit modes
        const pages = $getRoot().getChildren();
        const samplePage = pages.find($isElementNode);
        if (samplePage == null) return;
        const header = (samplePage as any)
          .getChildren()
          .find($isHeaderNode) as HeaderNode | undefined;
        const content = (samplePage as any)
          .getChildren()
          .find($isContentNode) as ContentNode | undefined;
        const footer = (samplePage as any)
          .getChildren()
          .find($isFooterNode) as FooterNode | undefined;

        if (header?.isEditableSection()) {
          syncSectionAcrossPages((children) => children.find($isHeaderNode));
        } else if (footer?.isEditableSection()) {
          syncSectionAcrossPages((children) => children.find($isFooterNode));
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
          const pages = $getRoot().getChildren().filter($isElementNode);
          for (const page of pages) {
            const dom = editor.getElementByKey((page as any).getKey());
            if (!dom) continue;
            const contentEl = dom.querySelector('[data-lexical-page-section="content"]') as HTMLElement | null;
            const container = dom as HTMLElement;
            const target = contentEl ?? container;
            if (target.clientHeight === 0) continue;
            const tol = 2; // px tolerance
            if (target.scrollHeight > target.clientHeight + tol) {
              // Append a new page after this one
              const newPage = $createPageNode();
              (page as any).insertAfter(newPage);
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