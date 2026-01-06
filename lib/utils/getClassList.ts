import type { Element } from 'hast'
import { hasClassList } from '../unified-hast-to-latex/collect-body.ts'

export function getClassList(node: Element): string[] {
  if (!hasClassList(node)) return []

  const className = node.properties?.className
  if (Array.isArray(className)) return className.map(String)
  if (typeof className === 'string') return className.split(/\s+/)
  return []
}
