// dsh-ivory Markdown preview renderer — spliced into src/client.template.js
// by scripts/build.mjs (no exports: the bundle body must stay an ES-module-free
// script). Unit tests load this file through a Function wrapper with a tiny
// DOM shim; see scripts/test-markdown.mjs.
//
// Security posture: DOM construction and text nodes only. Raw HTML stays
// text, links accept only absolute HTTP(S) URLs with noopener/referrer
// policy, and every container has a hard cap so hostile input stays bounded.
const MAX_MARKDOWN_PREVIEW_CHARS = 250_000;
const MAX_MARKDOWN_DEPTH = 32;
const MAX_MARKDOWN_LIST_ITEMS = 500;
const MAX_MARKDOWN_TABLE_ROWS = 256;
const MAX_MARKDOWN_TABLE_COLS = 64;
const MAX_MARKDOWN_PARAGRAPH_LINES = 200;
const MAX_INLINE_DEPTH = 24;
const MAX_MARKDOWN_NODES = 4_000;
const MAX_MARKDOWN_WORK = 1_000_000;
const MAX_MARKDOWN_RENDER_MS = 24;
const MARKDOWN_BUDGET_EXCEEDED = Symbol('Markdown preview budget exceeded');

function createMarkdownBudget() {
  return { nodes: 0, work: MAX_MARKDOWN_WORK, deadline: performance.now() + MAX_MARKDOWN_RENDER_MS };
}

function checkMarkdownBudget(budget, work = 0) {
  budget.work -= work;
  if (budget.work < 0 || budget.nodes > MAX_MARKDOWN_NODES || performance.now() > budget.deadline) {
    throw MARKDOWN_BUDGET_EXCEEDED;
  }
}

function markdownElement(tag, budget) {
  budget.nodes++;
  checkMarkdownBudget(budget);
  return document.createElement(tag);
}

function markdownText(text, budget) {
  budget.nodes++;
  checkMarkdownBudget(budget);
  return document.createTextNode(text);
}

function safeLink(raw) {
  if (!raw || /["'<>\`\u0000-\u001f]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

function appendInline(parent, input, depth = 0, budget = createMarkdownBudget()) {
  const source = String(input ?? '');
  checkMarkdownBudget(budget, source.length);
  if (depth > MAX_INLINE_DEPTH) {
    parent.appendChild(markdownText(source, budget));
    return;
  }
  // Each delimiter search advances monotonically. Failed searches are cached,
  // so an unmatched '[' or a long run of valid '*a*' tokens cannot repeatedly
  // scan the remaining suffix. Recursion shares the document's work/node budget.
  const positions = new Map();
  const whitespace = /\s/g;
  const next = (marker, start) => {
    const cached = positions.get(marker);
    if (cached === -1 || cached >= start) return cached;
    let at;
    if (marker === 'whitespace') {
      whitespace.lastIndex = start;
      at = whitespace.exec(source)?.index ?? -1;
    } else at = source.indexOf(marker, start);
    positions.set(marker, at);
    return at;
  };
  const sameLine = (start, end) => {
    const newline = next('\n', start);
    return newline === -1 || newline > end;
  };
  let cursor = 0, textStart = 0;
  while (cursor < source.length) {
    if ((cursor & 255) === 0) checkMarkdownBudget(budget);
    let token = null;
    const ch = source[cursor];
    if (ch === '[' || (ch === '!' && source[cursor + 1] === '[')) {
      const image = ch === '!';
      const start = cursor + (image ? 2 : 1);
      const close = next(']', start);
      if (close > start && sameLine(start, close) && source[close + 1] === '(') {
        const end = next(')', close + 2);
        const space = next('whitespace', close + 2);
        if (end > close + 2 && (space === -1 || space > end)) {
          token = { kind: image ? 'image' : 'link', text: source.slice(start, close), url: source.slice(close + 2, end), end: end + 1 };
        }
      }
    } else if (ch === '`') {
      const end = next('`', cursor + 1);
      if (end > cursor + 1 && sameLine(cursor + 1, end)) token = { kind: 'code', text: source.slice(cursor + 1, end), end: end + 1 };
    } else if (ch === '*') {
      const strong = source[cursor + 1] === '*';
      const start = cursor + (strong ? 2 : 1);
      const end = next('*', start);
      if (end > start && sameLine(start, end) && (!strong || source[end + 1] === '*')) {
        token = { kind: strong ? 'strong' : 'em', text: source.slice(start, end), end: end + (strong ? 2 : 1) };
      }
    }
    if (!token) { cursor++; continue; }
    if (cursor > textStart) parent.appendChild(markdownText(source.slice(textStart, cursor), budget));
    if (token.kind === 'image') {
      // Images stay inert alt text, with no media or network access.
      parent.appendChild(markdownText(token.text, budget));
    } else if (token.kind === 'link') {
      const href = safeLink(token.url);
      if (href) {
        const link = markdownElement('a', budget);
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(markdownText(token.text, budget));
        parent.appendChild(link);
      } else {
        parent.appendChild(markdownText(source.slice(cursor, token.end), budget));
      }
    } else {
      const tag = token.kind === 'code' ? 'code' : token.kind === 'strong' ? 'strong' : 'em';
      const node = markdownElement(tag, budget);
      if (token.kind === 'code') node.appendChild(markdownText(token.text, budget));
      else appendInline(node, token.text, depth + 1, budget);
      parent.appendChild(node);
    }
    cursor = token.end;
    textStart = cursor;
  }
  if (textStart < source.length) parent.appendChild(markdownText(source.slice(textStart), budget));
}

function renderMarkdown(src) {
  const source = String(src ?? '');
  if (source.length > MAX_MARKDOWN_PREVIEW_CHARS) return null;
  try { return renderMarkdownBlocks(source, 0, createMarkdownBudget()); }
  catch (error) {
    if (error === MARKDOWN_BUDGET_EXCEEDED) return null;
    throw error;
  }
}

function renderMarkdownBlocks(src, depth, budget) {
  checkMarkdownBudget(budget, src.length);
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = document.createDocumentFragment();
  if (depth > MAX_MARKDOWN_DEPTH) {
    const fallback = markdownElement('p', budget);
    fallback.appendChild(markdownText(lines.join(' ').slice(0, 4_000), budget));
    out.appendChild(fallback);
    return out;
  }
  let i = 0;
  while (i < lines.length) {
    if ((i & 255) === 0) checkMarkdownBudget(budget);
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      if (i < lines.length) i++;
      const pre = markdownElement('pre', budget);
      const code = markdownElement('code', budget);
      code.appendChild(markdownText(buf.join('\n'), budget));
      pre.appendChild(code);
      out.appendChild(pre);
      continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const n = Math.min(6, h[1].length);
      const heading = markdownElement('h' + n, budget);
      appendInline(heading, h[2], 0, budget);
      out.appendChild(heading);
      i++;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(l)) { out.appendChild(markdownElement('hr', budget)); i++; continue; }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const quote = markdownElement('blockquote', budget);
      quote.appendChild(renderMarkdownBlocks(buf.join('\n'), depth + 1, budget));
      out.appendChild(quote);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const parseRow = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).slice(0, MAX_MARKDOWN_TABLE_COLS);
      const head = parseRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && rows.length < MAX_MARKDOWN_TABLE_ROWS && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(parseRow(lines[i++]));
      if (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) i++;
        rows.push(['…']);
      }
      const table = markdownElement('table', budget);
      const thead = markdownElement('thead', budget);
      const headRow = markdownElement('tr', budget);
      for (const value of head) {
        const cell = markdownElement('th', budget);
        cell.setAttribute('scope', 'col');
        appendInline(cell, value, 0, budget);
        headRow.appendChild(cell);
      }
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = markdownElement('tbody', budget);
      for (const values of rows) {
        const row = markdownElement('tr', budget);
        for (const value of values) {
          const cell = markdownElement('td', budget);
          appendInline(cell, value, 0, budget);
          row.appendChild(cell);
        }
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      out.appendChild(table);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(l)) {
      const buf = [];
      while (i < lines.length && buf.length < MAX_MARKDOWN_LIST_ITEMS && /^\s*[-*+]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*+]\s+/, ''));
      if (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) i++;
        buf.push('…');
      }
      const list = markdownElement('ul', budget);
      for (const value of buf) {
        const item = markdownElement('li', budget);
        appendInline(item, value, 0, budget);
        list.appendChild(item);
      }
      out.appendChild(list);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(l)) {
      const startMatch = l.match(/^\s*(\d+)[.)]\s+/);
      const start = Math.max(1, parseInt(startMatch?.[1] ?? '1', 10) || 1);
      const buf = [];
      while (i < lines.length && buf.length < MAX_MARKDOWN_LIST_ITEMS && /^\s*\d+[.)]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      if (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) i++;
        buf.push('…');
      }
      const list = markdownElement('ol', budget);
      for (let index = 0; index < buf.length; index++) {
        const item = markdownElement('li', budget);
        // GFM normalizes markers: the first item's number sets the start and
        // the rest increment. Explicit li.value keeps the rendered numbering
        // sane even when the source repeats "1." for every item.
        item.value = start + index;
        appendInline(item, buf[index], 0, budget);
        list.appendChild(item);
      }
      out.appendChild(list);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const buf = [l];
    i++;
    const continuation = /^(#{1,6}\s|\`\`\`|\s*[-*+]\s|\s*\d+[.)]\s|\s*\||>)/;
    let truncated = false;
    while (i < lines.length && lines[i].trim() && !continuation.test(lines[i])) {
      if (buf.length < MAX_MARKDOWN_PARAGRAPH_LINES) buf.push(lines[i]);
      else truncated = true;
      i++;
    }
    if (truncated) buf.push('…');
    const paragraph = markdownElement('p', budget);
    buf.forEach((value, index) => {
      if (index) paragraph.appendChild(markdownElement('br', budget));
      appendInline(paragraph, value, 0, budget);
    });
    out.appendChild(paragraph);
  }
  return out;
}
