import * as Latex from '@unified-latex/unified-latex-types'
import { Test, visit } from 'unist-util-visit'

export function insertBeforeNode(
  tree: Latex.Root,
  /** CSS selector */
  test: Test,
  nodesToInsert: Latex.Node[] | Latex.Node
): void {
  visit(tree, test, (_, index, parent: Latex.Root | null) => {
    if (parent && typeof index === 'number') {
      const nodesArray = Array.isArray(nodesToInsert)
        ? nodesToInsert
        : [nodesToInsert]

      parent.content.splice(index, 0, ...nodesArray)

      return index + nodesArray.length
    }
  })
}

export function insertAfterNode(
  tree: Latex.Root,
  /** CSS selector */
  test: Test,
  nodesToInsert: Latex.Node[] | Latex.Node
): void {
  visit(tree, test, (_, index, parent: Latex.Root | null) => {
    if (parent && typeof index === 'number') {
      const nodesArray = Array.isArray(nodesToInsert)
        ? nodesToInsert
        : [nodesToInsert]

      parent.content.splice(index + 1, 0, ...nodesArray)
    }
  })
}
