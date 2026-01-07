import { lints } from '@unified-latex/unified-latex-lint'
import { unifiedLatexStringCompiler } from '@unified-latex/unified-latex-util-to-string'
import fs from 'fs'
import path from 'path'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { remove } from 'unist-util-remove'
import * as prettierPluginLatex from 'prettier-plugin-latex'
import { format, type Plugin } from 'prettier'
import { isHastText } from './lib/utils/hastUtils.ts'
import { hastLatex } from './lib/hast-to-unified-latex/index.ts'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const sourceFilePath = path.join(
  __dirname,
  './books',
  './Chesterton - Irish Impressions/source.html'
)

const html = fs.readFileSync(sourceFilePath, 'utf-8')

if (!html) {
  throw new Error('Failed to read source HTML file')
}

const processor = unified()
  .use(rehypeParse)
  .use(hastLatex, { documentClass: 'book', makeTitle: true })

const hast = processor.parse(html)

remove(hast, (node) => {
  if (isHastText(node) && node.value.trim().toLowerCase() === 'copyright')
    return true
  return false
})

const latexAst = processor.runSync(hast as any)

const latexProcessor = unified()
  .use(lints.unifiedLatexLintNoDef)
  .use(lints.unifiedLatexLintObsoletePackages)
  // @ts-expect-error -- These types are wrong
  .use(unifiedLatexStringCompiler)

const latexString = latexProcessor.stringify(latexAst)

const formattedLatexString = format(latexString as string, {
  printWidth: 300,
  useTabs: true,
  parser: 'latex-parser',
  plugins: [prettierPluginLatex as Plugin],
})

// console.log('--- HAST ---')
// console.dir(hast, { depth: null })
console.log('--- LaTeX AST ---')
console.dir(latexAst, { depth: null })
// console.log('--- LaTeX String ---')
// console.log(latexString)

const outputHast = sourceFilePath.replace(/\.html$/i, '.hast.json')
const outputLatexAst = sourceFilePath.replace(/\.html$/i, '.latex-ast.json')
const outputFilePath = sourceFilePath.replace(/\.html$/i, '.tex')

fs.writeFileSync(outputHast, JSON.stringify(hast, null, 2))
fs.writeFileSync(outputLatexAst, JSON.stringify(latexAst, null, 2))
fs.writeFileSync(outputFilePath, formattedLatexString)
