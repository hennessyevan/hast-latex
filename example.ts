import fs from 'fs'
import path from 'path'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { unifiedHastToLatex } from './lib/unified-hast-to-latex/index.ts'
import { unifiedLatexStringCompiler } from '@unified-latex/unified-latex-util-to-string'
import { lints } from '@unified-latex/unified-latex-lint'
import { removeMetadataFromRehype } from './lib/plugins/remove-metadata-text.ts'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const sourceFilePath = path.join(
  __dirname,
  './books',
  './Chesterton - The wisdom of Father Brown/source.html'
)

const html = fs.readFileSync(sourceFilePath, 'utf-8')

if (!html) {
  throw new Error('Failed to read source HTML file')
}

const processor = unified()
  .use(rehypeParse)
  // .use(removeMetadataFromRehype)
  .use(unifiedHastToLatex)

const hast = processor.parse(html)

const latexAst = processor.runSync(hast as any)

const latexProcessor = unified()
  .use(lints.unifiedLatexLintNoDef)
  .use(lints.unifiedLatexLintObsoletePackages)
  .use(unifiedLatexStringCompiler)

const latexString = latexProcessor.stringify(latexAst)

console.log('--- HAST ---')
console.dir(hast, { depth: null })
console.log('--- LaTeX AST ---')
console.dir(latexAst, { depth: null })
console.log('--- LaTeX String ---')
console.log(latexString)

const outputHast = sourceFilePath.replace(/\.html$/i, '.hast.json')
const outputLatexAst = sourceFilePath.replace(/\.html$/i, '.latex-ast.json')
const outputFilePath = sourceFilePath.replace(/\.html$/i, '.tex')

fs.writeFileSync(outputHast, JSON.stringify(hast, null, 2))
fs.writeFileSync(outputLatexAst, JSON.stringify(latexAst, null, 2))
fs.writeFileSync(outputFilePath, latexString)
