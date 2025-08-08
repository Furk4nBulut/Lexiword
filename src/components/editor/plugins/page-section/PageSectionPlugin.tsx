import { useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand
} from 'lexical';
import {
  $isHeaderNode,
  $isFooterNode,
  $isContentNode,
  type HeaderNode,
  type FooterNode,
  type ContentNode
} from './PageSectionNodes';

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
    // When editing header/footer, keep them in sync across pages
    return editor.registerUpdateListener(({ tags }) => {
      editor.update(() => {
        // We cannot read current mode directly; deduce by checking an arbitrary page
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

  // Ensure initial state: content editable, others readonly
  useEffect(() => {
    editor.update(() => {
      updateAllSectionsEditable('content');
    });
  }, [editor]);

  return null;
} 