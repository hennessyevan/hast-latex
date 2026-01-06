import type { Element } from 'hast'

export function isHastElement(node: { type: string }): node is Element {
  return node.type === 'element'
}
