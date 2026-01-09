import { args, m } from '@unified-latex/unified-latex-builder'
import type * as Hast from 'hast'
import * as Latex from '@unified-latex/unified-latex-types'
import { select } from 'hast-util-select'
import { toString } from 'hast-util-to-string'
import type { CustomMetaSelector, HastLatexOptions } from './index.ts'
import { visit } from 'unist-util-visit'

const DEFAULT_META_SELECTORS = {
  title: 'title,[property="og:title"],[name="title"],[property="dc.title"]',
  author: '[name="author"],[property="og:author"],[name="dc.creator"]',
  date: '[name="dc.issued"],[name="date"],[property="og:date"]',
} as const

export function collectLatexMetaFromHast(
  tree: Hast.Root,
  { customMetaSelectors }: Pick<HastLatexOptions, 'customMetaSelectors'>
): Latex.Node[] {
  const metaSelectors = { ...DEFAULT_META_SELECTORS, ...customMetaSelectors }

  const metaNodes: Latex.Node[] = [
    m('usepackage', args(['T1', 'fontenc'], { braces: '[]{}' })),
  ]

  const title = getMetaNode(tree, metaSelectors.title)
  if (title) metaNodes.push(m('title', getMetaNodeText(title)))

  const author = getMetaNode(tree, metaSelectors.author)
  if (author) metaNodes.push(m('author', getMetaNodeText(author)))

  const date = getMetaNode(tree, metaSelectors.date)
  if (date) metaNodes.push(m('date', getMetaNodeText(date)))

  return metaNodes
}

function getMetaNodeText(node: Hast.Nodes | null): string | null {
  if (!node) return null

  if (node.type === 'element' && node.tagName === 'meta') {
    const content = node.properties?.content
    if (typeof content === 'string') {
      return content.trim() || null
    }
  }

  return toString(node).trim() || null
}

function getMetaNode(
  tree: Hast.Root,
  selector: CustomMetaSelector
): Hast.Nodes | null {
  if (typeof selector === 'string') {
    return select(selector, tree) as Hast.Nodes | null
  }

  if (typeof selector === 'function') {
    let foundNode: Hast.Nodes | null = null
    visit(tree, (node) => {
      if (selector(node)) {
        foundNode = node
      }
    })

    return foundNode
  }

  return null
}
