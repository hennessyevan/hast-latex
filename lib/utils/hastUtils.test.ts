import { isHastElement, isHastText } from './hastUtils.ts'
import { describe, it } from 'node:test'

describe('hastUtils', () => {
  it('isHastElement returns true for element nodes', () => {
    const elementNode = { type: 'element', tagName: 'div', children: [] }
    console.assert(
      isHastElement(elementNode) === true,
      'Expected true for element node'
    )
  })

  it('isHastElement returns false for non-element nodes', () => {
    const textNode = { type: 'text', value: 'Hello, world!' }
    console.assert(
      isHastElement(textNode) === false,
      'Expected false for text node'
    )
  })

  it('isHastText returns true for text nodes', () => {
    const textNode = { type: 'text', value: 'Hello, world!' }
    console.assert(isHastText(textNode) === true, 'Expected true for text node')
  })

  it('isHastText returns false for non-text nodes', () => {
    const elementNode = { type: 'element', tagName: 'div', children: [] }
    console.assert(
      isHastText(elementNode) === false,
      'Expected false for element node'
    )
  })
})
