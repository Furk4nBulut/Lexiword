// sectionTypeGuards: Sayfa node'larının tipini kontrol etmek için yardımcı fonksiyonlar içerir.
// isContentNode, isHeaderNode ve isFooterNode ile node'un tipini kolayca kontrol edebilirsiniz.
// Her fonksiyon, LexicalNode'un belirli bir node tipine ait olup olmadığını anlamak için instanceof kullanır.

import type { LexicalNode } from 'lexical';
import { PageContentNode } from './PageContentNode';
import { PageHeaderNode } from './PageHeaderNode';
import { PageFooterNode } from './PageFooterNode';
import PageNumberNode from './PageNumberNode';
/**
 * Verilen node'un PageNumberNode olup olmadığını kontrol eder.
 *
 * @param node - Kontrol edilecek LexicalNode nesnesi (null veya undefined olabilir)
 * @returns Eğer node bir PageNumberNode ise true, değilse false döner.
 */
export function isPageNumberNode(node: LexicalNode | null | undefined): node is import('./PageNumberNode').PageNumberNode {
  return node instanceof PageNumberNode;
}

/**
 * Verilen node'un PageContentNode olup olmadığını kontrol eder.
 *
 * @param node - Kontrol edilecek LexicalNode nesnesi (null veya undefined olabilir)
 * @returns Eğer node bir PageContentNode ise true, değilse false döner.
 *
 * Not: instanceof ile tip kontrolü yapılır. Bu sayede LexicalNode'un
 * gerçekten PageContentNode olup olmadığı güvenli şekilde anlaşılır.
 */
export function isContentNode(node: LexicalNode | null | undefined): node is PageContentNode {
  // node null veya undefined ise false döner, aksi halde instanceof ile kontrol edilir
  return node instanceof PageContentNode;
}

/**
 * Verilen node'un PageHeaderNode olup olmadığını kontrol eder.
 *
 * @param node - Kontrol edilecek LexicalNode nesnesi (null veya undefined olabilir)
 * @returns Eğer node bir PageHeaderNode ise true, değilse false döner.
 *
 * Not: instanceof ile tip kontrolü yapılır. Bu sayede LexicalNode'un
 * gerçekten PageHeaderNode olup olmadığı güvenli şekilde anlaşılır.
 */
export function isHeaderNode(node: LexicalNode | null | undefined): node is PageHeaderNode {
  // node null veya undefined ise false döner, aksi halde instanceof ile kontrol edilir
  return node instanceof PageHeaderNode;
}

/**
 * Verilen node'un PageFooterNode olup olmadığını kontrol eder.
 *
 * @param node - Kontrol edilecek LexicalNode nesnesi (null veya undefined olabilir)
 * @returns Eğer node bir PageFooterNode ise true, değilse false döner.
 *
 * Not: instanceof ile tip kontrolü yapılır. Bu sayede LexicalNode'un
 * gerçekten PageFooterNode olup olmadığı güvenli şekilde anlaşılır.
 */
export function isFooterNode(node: LexicalNode | null | undefined): node is PageFooterNode {
  // node null veya undefined ise false döner, aksi halde instanceof ile kontrol edilir
  return node instanceof PageFooterNode;
}

// PageContentNode, PageHeaderNode ve PageFooterNode tiplerini dışa aktarır.
export type { PageContentNode, PageHeaderNode, PageFooterNode };
