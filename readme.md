# hast-latex

A small unifiedJS plugin that turns an HTML/HAST tree into a LaTeX AST (see [unified-latex](https://github.com/siefkenj/unified-latex)) so you can render, lint, or emit `.tex` from HTML sources. Designed for book-like documents (ebooks, etc.) where you want headings, chapters, metadata, and inline formatting to map cleanly into LaTeX.

## Installation

```bash
npm install hast-latex rehype-parse unified @unified-latex/unified-latex-util-to-string
```

## Quick start

The plugin consumes a HAST tree (e.g., from `rehype-parse`) and returns a unified-latex AST you can stringify with `@unified-latex/unified-latex-util-to-string`.

```ts
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import { hastLatex } from 'hast-latex'
import { unifiedLatexStringCompiler } from '@unified-latex/unified-latex-util-to-string'

const html = `<html><head><meta name="title" content="Example" /></head><body><h1>Hello</h1><p>World.</p></body></html>`

// Build HAST from HTML
const rehypeProcessor = unified()
  .use(rehypeParse)
  .use(hastLatex, { documentClass: 'book' })

const hast = rehypeProcessor.parse(html)
const latexAst = rehypeProcessor.runSync(hast)

// Turn LaTeX AST into a .tex string
const latex = unified().use(unifiedLatexStringCompiler).stringify(latexAst)

console.log(latex)
```

## API

### `hastLatex(options?)`

Unified plugin that converts HAST → unified-latex AST.

Options:

- `documentClass`: `'article' | 'report' | 'book'` (default: `'book'`). Used for the emitted `\documentclass{...}` macro.
- `makeTitle`: `boolean` (default: `false`). When `true`, inserts `\maketitle` and uses metadata from the HTML `<head>` (e.g., `<meta name="title">`, `<meta name="author">`, `dc.title`, `dc.creator`) to populate `\title{}` and `\author{}`.
- `macroReplacements`: `Record<string, string>` mapping CSS selectors to LaTeX macro names for inline styling (e.g., `{ 'b,strong': 'textbf', 'i,em': 'textit' }`). This lets you customize how inline HTML is converted to LaTeX commands.

Default `macroReplacements`:

```ts
{
  'b,strong': 'textbf',
  'i,em': 'textit',
  u: 'underline',
  's,strike,del': 'sout',
}
```

#### Advanced usage

```ts
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import { hastLatex } from 'hast-latex'
import { unifiedLatexStringCompiler } from '@unified-latex/unified-latex-util-to-string'

const html = `<!doctype html><html><head>
  <meta name="title" content="My Book" />
  <meta name="author" content="Jane Doe" />
</head><body>
  <h1 class="starred">Intro</h1>
  <p><span class="smcap">Small Caps</span> and <u>underline</u>.</p>
</body></html>`

const processor = unified()
  .use(rehypeParse)
  .use(hastLatex, {
    documentClass: 'book',
    makeTitle: true,
    macroReplacements: {
      'span.smcap': 'textsc',
      u: 'underline',
    },
  })

const hast = processor.parse(html)
const latexAst = processor.runSync(hast as any)
const latex = unified().use(unifiedLatexStringCompiler).stringify(latexAst)

console.log(latex)
```

## Notes & limitations

- Currently focused on book-like prose from ebook sources. Lists, images, tables, math, footnotes, etc., are not yet mapped.
- HTML must include a `<html><head>...</head><body>...</body></html>` structure for metadata extraction.
- Output is a LaTeX AST; you choose when/how to stringify or compile it.
- API and output shape will change; pinned at `0.x` while iterating.
