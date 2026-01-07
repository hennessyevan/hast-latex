import type { Element, Text } from 'hast'

export function isHastElement(node: { type: string }): node is Element {
  return node.type === 'element'
}
export function isHastText(node: { type: string }): node is Text {
  return node.type === 'text'
}
