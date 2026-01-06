import type { Plugin } from 'unified'
import { remove } from 'unist-util-remove'
import { getClassList } from '../utils/getClassList.ts'
import { isHastElement } from '../utils/isHastElement.ts'

export const removeMetadataFromRehype: Plugin = () => {
  return async (tree) => {
    remove(tree, (node) => {
      if (isHastElement(node)) {
        const classList = getClassList(node)

        return (
          classList.includes('pg-boilerplate') ||
          classList.includes('bbox') ||
          classList.includes('titlepage')
        )
      }

      return false
    })
  }
}
