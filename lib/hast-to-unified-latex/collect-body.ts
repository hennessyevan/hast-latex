import { m, s, SP } from '@unified-latex/unified-latex-builder'
import type * as Latex from '@unified-latex/unified-latex-types'
import type * as Hast from 'hast'
import getClassList from 'hast-util-class-list'
import { matches, select } from 'hast-util-select'
import { visit } from 'unist-util-visit'
import { type HastLatexOptions } from './index.ts'
import { toString } from 'hast-util-to-string'

export function getBody(tree: Hast.Root): Hast.Element | undefined {
  return select('body', tree) ?? undefined
}

export function hastNodeToLatex(
  node: Hast.Nodes,
  options: Pick<HastLatexOptions, 'macroReplacements'>
): Latex.Node[] {
  if (node.type === 'text') return textToLatexNodes(node.value)

  if (node.type === 'element') {
    if (isPageNumber(node)) return []

    if (isChapterBlock(node)) {
      return convertChapterBlock(node)
    }

    if (node.tagName === 'ol') {
      return [m('begin', 'enumerate')]
    }

    if (node.tagName === 'li') {
      return [
        m('item'),
        ...node.children.flatMap((child) => hastNodeToLatex(child, options)),
      ]
    }

    if (node.tagName === 'br') {
      return [{ type: 'parbreak' }]
    }

    if (
      node.tagName === 'div' ||
      node.tagName === 'p' ||
      node.tagName === 'span'
    ) {
      return node.children.flatMap((child) => hastNodeToLatex(child, options))
    }

    for (const [selector, macroName] of Object.entries(
      options.macroReplacements || {}
    )) {
      if (matches(selector, node)) {
        return [m(macroName, toString(node))]
      }
    }
  }

  return []
}

function isPageNumber(node: Hast.Element): boolean {
  const classList = getClassList(node)
  return classList.contains('page-number') || classList.contains('pagenum')
}

export function hasFollowingParagraph(
  nodes: Hast.Nodes[],
  startIndex: number
): boolean {
  for (let i = startIndex; i < nodes.length; i += 1) {
    const next = nodes[i]
    if (next.type === 'text' && next.value.trim() === '') continue
    if (next.type === 'element' && next.tagName === 'p') return true
    if (next.type === 'element') return false
  }
  return false
}

export function isParagraph(node: Hast.Nodes): node is Hast.Element {
  return node.type === 'element' && node.tagName === 'p'
}

function textToLatexNodes(value: string): Latex.Node[] {
  if (!value.trim()) return []

  const normalized = value.replace(/’/g, "'")
  const parts = normalized.split(/(\s+|['’]|[.,!?;:])/).filter(Boolean)

  return parts.map<Latex.Node>((part) => {
    if (/^\s+$/.test(part)) return SP
    if (part === "'" || part === '’') return s("'")
    return s(part)
  })
}

function isChapterBlock(node: Hast.Element): boolean {
  const classList = getClassList(node)
  return classList.contains('chapter') && node.tagName === 'div'
}

function convertChapterBlock(node: Hast.Element): Latex.Node[] {
  const chapterTitleNodes: string[] = []

  visit(node, (node) => {
    if (node.type === 'element' && matches('h1,h2,h3,h4,h5,h6', node)) {
      let text = ''
      visit(node, (child) => {
        if (child.type === 'text') {
          text += child.value
        }
      })

      if (typeof text === 'string' && text.trim() !== '') {
        chapterTitleNodes.push(text)
      }
    }
  })

  let chapterIndex = 0
  let chapterTitle = chapterTitleNodes.at(0)

  if (chapterTitle?.toLowerCase().startsWith('chapter')) {
    chapterIndex += 1
    chapterTitle = chapterTitleNodes.at(1)
  }
  const chapterSubtitle = chapterTitleNodes.at(chapterIndex + 1)

  if (!chapterTitle) {
    return []
  }

  return [m('chapter', chapterTitle)].concat(
    chapterSubtitle ? [m('section*', chapterSubtitle)] : []
  )
}

export function hasClassList(node: Hast.Element): boolean {
  const className = node.properties?.className
  return Array.isArray(className)
    ? className.length > 0
    : typeof className === 'string' && className.trim() !== ''
}

export const HEADING_RENDER_INFO: Latex.Macro['_renderInfo'] = {
  breakAround: true,
  namedArguments: ['starred', null, 'tocTitle', 'title'],
}
