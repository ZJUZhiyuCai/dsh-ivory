// Unit tests for the Ivory Markdown preview renderer (src/markdown.js).
// Runs under "node --test" with a minimal DOM shim: the renderer only uses
// createElement/createTextNode/createDocumentFragment plus the URL global,
// so the shim stays tiny and the suite stays fast. Wired into npm test and CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- minimal DOM shim (only the surface the renderer touches) ----
class ShimNode {
  constructor(kind, name) {
    this.kind = kind; // 'element' | 'text' | 'fragment'
    this.name = name ?? null;
    this.children = [];
    this.attrs = new Map();
    this.text = '';
  }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  appendChild(child) { this.children.push(child); return child; }
  append(...nodes) { this.children.push(...nodes); }
  get textContent() {
    return this.kind === 'text' ? this.text : this.children.map((child) => child.textContent).join('');
  }
  set textContent(value) {
    if (this.kind === 'text') {
      this.text = String(value);
      return;
    }
    // DOM semantics: assigning textContent replaces children with one text node.
    const text = new ShimNode('text');
    text.text = String(value);
    this.children = [text];
  }
}
globalThis.document = {
  createElement: (tag) => new ShimNode('element', tag),
  createTextNode: (text) => {
    const node = new ShimNode('text');
    node.text = String(text);
    return node;
  },
  createDocumentFragment: () => new ShimNode('fragment'),
};

// src/markdown.js is export-free so the bundle stays a plain script; load it
// through a Function wrapper and hand back the API for testing.
const source = await readFile(join(root, 'src/markdown.js'), 'utf8');
const renderer = new Function(`${source}
return {
  renderMarkdown, appendInline, safeLink,
  MAX_MARKDOWN_PREVIEW_CHARS, MAX_MARKDOWN_DEPTH, MAX_MARKDOWN_LIST_ITEMS,
  MAX_MARKDOWN_TABLE_ROWS, MAX_MARKDOWN_TABLE_COLS,
  MAX_MARKDOWN_PARAGRAPH_LINES, MAX_INLINE_DEPTH,
};`)();

function* walk(node) {
  yield node;
  for (const child of node.children) yield* walk(child);
}
const collect = (root) => [...walk(root)];
const byTag = (root, tag) => collect(root).filter((node) => node.kind === 'element' && node.name === tag);
const render = (md) => renderer.renderMarkdown(md);

test('paragraphs merge continuation lines and split on blank lines', () => {
  const frag = render('hello\nworld\n\nsecond');
  const paragraphs = byTag(frag, 'p');
  assert.equal(paragraphs.length, 2);
  assert.equal(byTag(paragraphs[0], 'br').length, 1);
  assert.equal(paragraphs[0].textContent, 'helloworld');
  assert.equal(paragraphs[1].textContent, 'second');
});

test('inline code, strong, em, and HTTP(S) links render; bad links stay text', () => {
  const frag = render('a **b** *c* `d` [e](https://example.com/x) [bad](javascript:alert(1))');
  const p = byTag(frag, 'p')[0];
  assert.equal(byTag(p, 'strong')[0].textContent, 'b');
  assert.equal(byTag(p, 'em')[0].textContent, 'c');
  assert.equal(byTag(p, 'code')[0].textContent, 'd');
  const links = byTag(p, 'a');
  assert.equal(links.length, 1);
  // href/target/rel are assigned as DOM properties (the browser reflects
  // them into attributes); the shim keeps them as plain fields.
  assert.equal(links[0].href, 'https://example.com/x');
  assert.equal(links[0].target, '_blank');
  assert.equal(links[0].rel, 'noopener noreferrer');
  assert.ok(p.textContent.includes('[bad](javascript:alert(1))'));
});

test('raw HTML stays text, never becomes elements', () => {
  const frag = render('<script>alert(1)</script> <img src=x onerror=alert(2)>');
  assert.equal(byTag(frag, 'script').length, 0);
  assert.equal(byTag(frag, 'img').length, 0);
  assert.equal(frag.textContent, '<script>alert(1)</script> <img src=x onerror=alert(2)>');
});

test('headings normalize to h1-h6; seven hashes stay a paragraph', () => {
  const frag = render('# one\n## two\n###### six\n####### seven');
  assert.equal(byTag(frag, 'h1').length, 1);
  assert.equal(byTag(frag, 'h2').length, 1);
  assert.equal(byTag(frag, 'h6').length, 1);
  const p = byTag(frag, 'p');
  assert.equal(p[0].textContent, '####### seven');
});

test('horizontal rule and nested blockquotes', () => {
  const frag = render('---\n> quote\n> > deep');
  assert.equal(byTag(frag, 'hr').length, 1);
  const quotes = byTag(frag, 'blockquote');
  assert.equal(quotes.length, 2);
  assert.equal(quotes[0].textContent, 'quotedeep');
  assert.equal(quotes[1].textContent, 'deep');
});

test('unordered and ordered lists', () => {
  const frag = render('- a\n- b\n- c\n\n1. x\n2. y');
  const ul = byTag(frag, 'ul');
  assert.equal(ul.length, 1);
  assert.equal(byTag(ul[0], 'li').length, 3);
  assert.equal(byTag(frag, 'ol').length, 1);
  assert.equal(byTag(frag, 'li').length, 5);
});

test('list item cap appends an ellipsis item', () => {
  const many = Array.from({ length: 600 }, (_, i) => `- item${i}`).join('\n');
  const items = byTag(render(many), 'li');
  assert.equal(items.length, 501);
  assert.equal(items.at(-1).textContent, '…');
});

test('table headers carry scope=col', () => {
  const frag = render('| a | b |\n| - | - |\n| 1 | 2 |');
  const table = byTag(frag, 'table')[0];
  const headers = byTag(table, 'th');
  assert.equal(headers.length, 2);
  for (const header of headers) assert.equal(header.attrs.get('scope'), 'col');
  assert.equal(byTag(table, 'td')[0].textContent, '1');
});

test('table column cap slices to 64 cells', () => {
  const cols = Array.from({ length: 70 }, (_, i) => `c${i}`);
  const md = `| ${cols.join(' | ')} |\n| ${cols.map(() => '-').join(' | ')} |\n| ${cols.map(() => '1').join(' | ')} |`;
  const table = byTag(render(md), 'table')[0];
  assert.equal(byTag(table, 'th').length, 64);
  assert.equal(byTag(table, 'td').length, 64);
});

test('table row cap appends an ellipsis row', () => {
  const md = ['| h |', '| - |', ...Array.from({ length: 300 }, (_, i) => `| r${i} |`)].join('\n');
  const rows = byTag(render(md), 'tr'); // 1 header + 256 capped + 1 ellipsis
  assert.equal(rows.length, 258);
  assert.equal(rows.at(-1).textContent, '…');
});

test('fenced code blocks preserve content', () => {
  const frag = render('```js\nconst x = 1;\n```');
  const pre = byTag(frag, 'pre');
  assert.equal(pre.length, 1);
  assert.equal(pre[0].textContent, 'const x = 1;');
  assert.equal(byTag(pre[0], 'code').length, 1);
});

test('image syntax renders as alt text without leaking the ! marker', () => {
  const frag = render('![alt text](https://example.com/i.png)');
  const p = byTag(frag, 'p')[0];
  assert.equal(byTag(p, 'a').length, 0);
  assert.equal(p.textContent, 'alt text');
});

test('blockquote depth cap terminates and preserves text', () => {
  const deep = '> '.repeat(40) + 'deep text';
  const frag = render(deep);
  assert.ok(frag.textContent.includes('deep text'));
});

test('paragraph line cap appends an ellipsis', () => {
  const lines = Array.from({ length: 210 }, (_, i) => `L${i}`).join('\n');
  const p = byTag(render(lines), 'p')[0];
  assert.ok(p.textContent.includes('L199'));
  assert.ok(!p.textContent.includes('L200'));
  assert.ok(p.textContent.endsWith('…'));
});

test('empty and null input produce an empty fragment', () => {
  assert.equal(render('').textContent, '');
  assert.equal(render(null).textContent, '');
  assert.equal(render(undefined).textContent, '');
});

test('renderer caps are exported with the expected values', () => {
  assert.equal(renderer.MAX_MARKDOWN_PREVIEW_CHARS, 250_000);
  assert.equal(renderer.MAX_MARKDOWN_DEPTH, 32);
  assert.equal(renderer.MAX_MARKDOWN_LIST_ITEMS, 500);
  assert.equal(renderer.MAX_MARKDOWN_TABLE_ROWS, 256);
  assert.equal(renderer.MAX_MARKDOWN_TABLE_COLS, 64);
  assert.equal(renderer.MAX_MARKDOWN_PARAGRAPH_LINES, 200);
  assert.equal(renderer.MAX_INLINE_DEPTH, 24);
});

test('safeLink accepts only absolute HTTP(S) URLs', () => {
  const { safeLink } = renderer;
  assert.equal(safeLink('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  assert.equal(safeLink('http://example.com/'), 'http://example.com/');
  assert.equal(safeLink('https://EXAMPLE.com/A'), 'https://example.com/A');
  assert.equal(safeLink('javascript:alert(1)'), null);
  assert.equal(safeLink('data:text/html,x'), null);
  assert.equal(safeLink('ftp://example.com/x'), null);
  assert.equal(safeLink('/relative/path'), null);
  assert.equal(safeLink('http://example.com/\"><img'), null);
  assert.equal(safeLink('http://example.com/a\u0000b'), null);
  assert.equal(safeLink(''), null);
  assert.equal(safeLink(null), null);
});
