import type { Root as HastRoot, Text, Content as HastContent } from 'hast'
import * as Latex from '@unified-latex/unified-latex-types'
import {
  getBody,
  hastNodeToLatex,
  isParagraph,
  hasFollowingParagraph,
} from './collect-body.ts'
import { applyMetaToLatex, getHead } from './collect-meta.ts'
import { m } from '@unified-latex/unified-latex-builder'

export interface RehypeUnifiedLatexOptions {
  documentClass?: 'article' | 'report' | 'book'
}

export type HastNode = HastContent | HastRoot

export function unifiedHastToLatex() {
  return (tree: HastRoot) => rehypeUnifiedLatex(tree)
}

export function rehypeUnifiedLatex(
  tree: HastRoot,
  options: RehypeUnifiedLatexOptions = {
    documentClass: 'book',
  }
): Latex.Root {
  const head = getHead(tree)
  const body = getBody(tree)

  const content: Latex.Node[] = []

  const meaningfulChildren = body?.children ?? []

  for (let i = 0; i < meaningfulChildren.length; i += 1) {
    const child = meaningfulChildren[i]
    const latexNodes = hastNodeToLatex(child)

    content.push(...latexNodes)

    if (
      isParagraph(child) &&
      hasFollowingParagraph(meaningfulChildren, i + 1)
    ) {
      content.push({ type: 'parbreak' })
    }
  }

  // wrap in begin{document} ... end{document}
  content.unshift(m('begin', 'document'))
  content.push(m('end', 'document'))

  // add appropriate document meta
  content.unshift(m('documentclass', options.documentClass ?? 'book'))

  const root = applyMetaToLatex(tree, { type: 'root', content })

  return root
}
