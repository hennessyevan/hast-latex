import type * as Latex from '@unified-latex/unified-latex-types'
import type { Element, Content as HastContent, Root as HastRoot } from 'hast'
import { type HastNode } from './index.ts'
import { visit } from 'unist-util-visit'
import { remove } from 'unist-util-remove'
import { m } from '@unified-latex/unified-latex-builder'
import { isHastElement } from '../utils/isHastElement.ts'
import { getClassList } from '../utils/getClassList.ts'

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

export function hastNodeToLatex(node: HastNode): Latex.Node[] {
  if (node.type === 'text') return textToLatexNodes(node.value)

  if (node.type === 'element') {
    if (isHeading(node)) return [convertHeading(node)]
    if (isPageNumber(node)) return []

    if (isChapterBlock(node)) {
      return convertChapterBlock(node)
    }

    if (node.tagName === 'p') return convertParagraph(node)
    if (node.tagName === 'span') return convertSpan(node)
    if (node.tagName === 'i')
      return maybeApplyMacro(node, flattenText(node.children)) as Latex.Node[]
    if (node.tagName === 'em')
      return maybeApplyMacro(node, flattenText(node.children)) as Latex.Node[]
    if (node.tagName === 'b')
      return maybeApplyMacro(node, flattenText(node.children)) as Latex.Node[]
    if (node.tagName === 'strong')
      return maybeApplyMacro(node, flattenText(node.children)) as Latex.Node[]
  }

  return []
}

function isPageNumber(node: Element): boolean {
  const classList = getClassList(node)
  return classList.includes('page-number') || classList.includes('pagenum')
}

function isHeading(node: Element): boolean {
  return node.tagName in HEADING_TAG_TO_MACRO
}

function convertHeading(node: Element): Latex.Macro {
  const macroName = HEADING_TAG_TO_MACRO[node.tagName] ?? 'section'
  const isStarred = getClassList(node).includes('starred')
  const titleContent = flattenText(node.children)

  const starredArg: Latex.Argument = {
    type: 'argument',
    content: isStarred ? [{ type: 'string', content: '*' }] : [],
    openMark: '',
    closeMark: '',
  }

  const emptyArg: Latex.Argument = {
    type: 'argument',
    content: [],
    openMark: '',
    closeMark: '',
  }

  const titleArg: Latex.Argument = {
    type: 'argument',
    content: titleContent,
    openMark: '{',
    closeMark: '}',
  }

  return {
    type: 'macro',
    content: macroName,
    _renderInfo: HEADING_RENDER_INFO,
    args: [starredArg, emptyArg, emptyArg, titleArg],
  }
}

function convertParagraph(node: Element): Latex.Node[] {
  return node.children.flatMap((child) => hastNodeToLatex(child))
}

function convertSpan(node: Element): Latex.Node[] {
  return maybeApplyMacro(node, flattenText(node.children)) as Latex.Node[]
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
    if (/^\s+$/.test(part)) return { type: 'whitespace' }
    if (part === "'" || part === '’') return { type: 'string', content: "'" }
    return { type: 'string', content: part }
  })
}

function isChapterBlock(node: Element): boolean {
  const classList = getClassList(node)
  return classList.includes('chapter') && node.tagName === 'div'
}

function convertChapterBlock(node: Element): Latex.Node[] {
  const chapterTitleNodes: string[] = []

  visit(node, (node) => {
    if (node.type === 'element' && isHeading(node)) {
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

  const chapterTitle = chapterTitleNodes.at(0)
  const chapterSubtitle = chapterTitleNodes.at(1)

  if (!chapterTitle) {
    return []
  }

  return [
    {
      type: 'macro',
      content: 'chapter',
      args: [
        {
          closeMark: '}',
          openMark: '{',
          type: 'argument',
          content: [{ type: 'string', content: chapterTitle }],
        },
      ],
    },
    ...((chapterSubtitle
      ? [
          {
            type: 'macro',
            content: 'section*',
            args: [
              {
                closeMark: '}',
                openMark: '{',
                type: 'argument',
                content: [{ type: 'string', content: chapterSubtitle }],
              },
            ],
          },
        ]
      : []) as Latex.Node[]),
  ]
}

function maybeApplyMacro(
  element: Element,
  children: Latex.Node[]
): Latex.Node | Latex.Node[] {
  const classList = getClassList(element)
  let macroName: string | null = null

  if (classList.includes('smcap')) {
    macroName = 'textsc'
  }

  if (element.tagName === 'i' || element.tagName === 'em') {
    macroName = 'textit'
  }

  if (element.tagName === 'b' || element.tagName === 'strong') {
    macroName = 'textbf'
  }

  if (!macroName) return children

  return m(macroName, children)
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

export const HEADING_TAG_TO_MACRO: Record<string, Latex.Macro['content']> = {
  h1: 'section',
  h2: 'section',
  h3: 'section',
  h4: 'section',
  h5: 'section',
  h6: 'section',
}
