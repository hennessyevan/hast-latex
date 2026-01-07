import { m, s, SP } from '@unified-latex/unified-latex-builder'
import type * as Latex from '@unified-latex/unified-latex-types'
import type {
  Element,
  Content as HastContent,
  Root as HastRoot,
  Root,
} from 'hast'
import { visit } from 'unist-util-visit'
import { getClassList } from '../utils/getClassList.ts'
import { type HastNode, type RehypeUnifiedLatexOptions } from './index.ts'
import { matches } from 'hast-util-select'

export function getBody(tree: HastRoot): Element | undefined {
  const html = tree.children.find(
    (node): node is Element =>
      node.type === 'element' && node.tagName === 'html'
  )

  if (!html) return undefined

  return html!.children.find(
    (node): node is Element =>
      node.type === 'element' && node.tagName === 'body'
  )
}

export function hastNodeToLatex(
  node: HastNode,
  options: Pick<RehypeUnifiedLatexOptions, 'macroReplacements'>
): Latex.Node[] {
  if (node.type === 'text') return textToLatexNodes(node.value)

  if (node.type === 'element') {
    if (isPageNumber(node)) return []

    if (isChapterBlock(node)) {
      return convertChapterBlock(node)
    }

    if (node.tagName === 'p' || node.tagName === 'span') {
      return node.children.flatMap((child) => hastNodeToLatex(child, options))
    }

    for (const [selector, macroName] of Object.entries(
      options.macroReplacements || {}
    )) {
      if (matches(selector, node)) {
        return [m(macroName, flattenText(node.children))]
      }
    }
  }

  return []
}

function isPageNumber(node: Element): boolean {
  const classList = getClassList(node)
  return classList.includes('page-number') || classList.includes('pagenum')
}

export function hasFollowingParagraph(
  nodes: HastContent[],
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

export function isParagraph(node: HastNode): node is Element {
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

function isChapterBlock(node: Element): boolean {
  const classList = getClassList(node)
  return classList.includes('chapter') && node.tagName === 'div'
}

function convertChapterBlock(node: Element): Latex.Node[] {
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

function flattenText(children: HastContent[]): Latex.Node[] {
  return children.flatMap((child) => {
    if (child.type === 'text') return textToLatexNodes(child.value)

    if (child.type === 'element') return flattenText(child.children)
    return []
  })
}

export function hasClassList(node: Element): boolean {
  const className = node.properties?.className
  return Array.isArray(className)
    ? className.length > 0
    : typeof className === 'string' && className.trim() !== ''
}

export const HEADING_RENDER_INFO: Latex.Macro['_renderInfo'] = {
  breakAround: true,
  namedArguments: ['starred', null, 'tocTitle', 'title'],
}
