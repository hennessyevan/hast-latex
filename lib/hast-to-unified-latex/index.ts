import { m } from '@unified-latex/unified-latex-builder'
import * as Latex from '@unified-latex/unified-latex-types'
import type { Content as HastContent, Root as HastRoot } from 'hast'
import type { Plugin } from 'unified'
import {
  getBody,
  hasFollowingParagraph,
  hastNodeToLatex,
  isParagraph,
} from './collect-body.ts'
import { collectLatexMetaFromHast, getHead } from './collect-meta.ts'
import { insertBeforeNode } from '../utils/insertNodeUtils.ts'

export interface HastLatexOptions {
  /**
   * The LaTeX document class to use.
   * @default 'book'
   */
  documentClass?: 'article' | 'report' | 'book'

  /**
   * Whether to automatically generate a title page using metadata from the HTML `<head>`.
   * @default false
   */
  makeTitle?: boolean

  /**
   * A record mapping CSS selectors to LaTeX macro names for inline styling.
   * #### For example:
   * - To map b and strong tags to the LaTeX macro "\textbf", use: `{ 'b,strong': 'textbf' }`
   * - To map divs with class "chapter" to the LaTeX macro "\chapter", use: `{ 'div.chapter': 'chapter' }`
   *
   * Uses the `matches` function from `hast-util-select` under the hood.
   * @see https://unifiedjs.com/explore/package/hast-util-select/#matchesselector-node-space
   *
   * @default
   * ```ts
   * {
   *   'b,strong': 'textbf',
   *   'i,em': 'textit',
   *   u: 'underline',
   *   's,strike,del': 'sout',
   * }
   * ```
   */
  macroReplacements?: Record<string, string>
}

export const DEFAULT_MACRO_REPLACEMENTS: Record<string, string> = {
  'b,strong': 'textbf',
  'i,em': 'textit',
  u: 'underline',
  's,strike,del': 'sout',
} as const

export type HastNode = HastContent | HastRoot

export const hastLatex: Plugin<
  [(HastLatexOptions | undefined)?],
  HastRoot,
  Latex.Root
> = (
  options = {
    documentClass: 'book',
    makeTitle: false,
    macroReplacements: DEFAULT_MACRO_REPLACEMENTS,
  }
) => {
  return (tree) => {
    const { macroReplacements } = options
    const head = getHead(tree)
    const body = getBody(tree)

    const content: Latex.Node[] = []

    const meaningfulChildren = body?.children ?? []

    for (let i = 0; i < meaningfulChildren.length; i += 1) {
      const child = meaningfulChildren[i]
      const latexNodes = hastNodeToLatex(child, { macroReplacements })

      content.push(...latexNodes)

      if (
        isParagraph(child) &&
        hasFollowingParagraph(meaningfulChildren, i + 1)
      ) {
        content.push({ type: 'parbreak' })
      }
    }

    const metaNodes = collectLatexMetaFromHast(tree)

    if (options?.makeTitle) content.unshift(m('maketitle'))

    return {
      type: 'root',
      content: [
        m('documentclass', options?.documentClass ?? 'book'),
        ...metaNodes,
        m('begin', 'document'),
        ...content,
        m('end', 'document'),
      ],
    } satisfies Latex.Root
  }
}
