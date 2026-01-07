import { args, m } from '@unified-latex/unified-latex-builder'
import * as Latex from '@unified-latex/unified-latex-types'
import type { Element, Root as HastRoot } from 'hast'
import { select } from 'hast-util-select'
import { insertBeforeNode } from '../utils/insertNodeUtils.ts'

export function getHead(tree: HastRoot): Element | undefined {
  const html = tree.children.find(
    (node): node is Element =>
      node.type === 'element' && node.tagName === 'html'
  )

  if (!html) return undefined

  return select('head', html)
}

export function collectLatexMetaFromHast(tree: HastRoot): Latex.Node[] {
  const head = getHead(tree)

  if (!head) {
    return []
  }

  const metaNodes: Latex.Node[] = [
    m('usepackage', args(['T1', 'fontenc'], { braces: '[]{}' })),
  ]

  for (const child of head.children) {
    if (child.type === 'element' && child.tagName === 'meta') {
      const nameAttr = child.properties?.name
      const contentAttr = child.properties?.content

      if (typeof nameAttr === 'string' && typeof contentAttr === 'string') {
        if (
          ['author', 'dc.creator', 'og:author'].includes(nameAttr.toLowerCase())
        ) {
          metaNodes.push(m('author', contentAttr))
        } else if (
          ['title', 'dc.title', 'og:title'].includes(nameAttr.toLowerCase())
        ) {
          metaNodes.push(m('title', contentAttr))
        }
      }
    }
  }

  return metaNodes
}
