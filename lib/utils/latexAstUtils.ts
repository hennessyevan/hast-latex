import type * as Latex from '@unified-latex/unified-latex-types'

export function isLatexAstStringNode(node: Latex.Node): node is Latex.String {
  return node.type === 'string'
}
