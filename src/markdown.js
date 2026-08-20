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

function safeLink(raw) {
  if (!raw || /["'<>\`\u0000-\u001f]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

function appendInline(parent, source, depth = 0) {
  let rest = String(source ?? '');
  if (depth > MAX_INLINE_DEPTH) {
    parent.appendChild(document.createTextNode(rest));
    return;
  }
  const patterns = [
    // Image syntax renders as its alt text: the preview never loads media,
    // and matching images before links keeps the leading ! from leaking.
    { kind: 'image', re: /!\[([^\]\n]+)\]\(([^)\s]+)\)/ },
    { kind: 'code', re: /`([^`\n]+)`/ },
    { kind: 'link', re: /\[([^\]\n]+)\]\(([^)\s]+)\)/ },
    { kind: 'strong', re: /\*\*([^*\n]+)\*\*/ },
    { kind: 'em', re: /\*([^*\n]+)\*/ },
  ];
  while (rest) {
    let token = null;
    for (const pattern of patterns) {
      const match = pattern.re.exec(rest);
      if (match && (!token || match.index < token.match.index)) token = { ...pattern, match };
    }
    if (!token) {
      parent.appendChild(document.createTextNode(rest));
      break;
    }
    if (token.match.index) parent.appendChild(document.createTextNode(rest.slice(0, token.match.index)));
    const whole = token.match[0];
    if (token.kind === 'image') {
      parent.appendChild(document.createTextNode(token.match[1]));
    } else if (token.kind === 'link') {
      const href = safeLink(token.match[2]);
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = token.match[1];
        parent.appendChild(link);
      } else {
        parent.appendChild(document.createTextNode(whole));
      }
    } else {
      const tag = token.kind === 'code' ? 'code' : token.kind === 'strong' ? 'strong' : 'em';
      const node = document.createElement(tag);
      if (token.kind === 'code') node.textContent = token.match[1];
      else appendInline(node, token.match[1], depth + 1);
      parent.appendChild(node);
    }
    rest = rest.slice(token.match.index + whole.length);
  }
}

function renderMarkdown(src, depth = 0) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = document.createDocumentFragment();
  if (depth > MAX_MARKDOWN_DEPTH) {
    const fallback = document.createElement('p');
    fallback.textContent = lines.join(' ').slice(0, 4_000);
    out.appendChild(fallback);
    return out;
  }
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      if (i < lines.length) i++;
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = buf.join('\n');
      pre.appendChild(code);
      out.appendChild(pre);
      continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const n = Math.min(6, h[1].length);
      const heading = document.createElement('h' + n);
      appendInline(heading, h[2]);
      out.appendChild(heading);
      i++;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(l)) { out.appendChild(document.createElement('hr')); i++; continue; }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const quote = document.createElement('blockquote');
      quote.appendChild(renderMarkdown(buf.join('\n'), depth + 1));
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
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      for (const value of head) {
        const cell = document.createElement('th');
        cell.setAttribute('scope', 'col');
        appendInline(cell, value);
        headRow.appendChild(cell);
      }
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      for (const values of rows) {
        const row = document.createElement('tr');
        for (const value of values) {
          const cell = document.createElement('td');
          appendInline(cell, value);
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
      const list = document.createElement('ul');
      for (const value of buf) {
        const item = document.createElement('li');
        appendInline(item, value);
        list.appendChild(item);
      }
      out.appendChild(list);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(l)) {
      const buf = [];
      while (i < lines.length && buf.length < MAX_MARKDOWN_LIST_ITEMS && /^\s*\d+[.)]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      if (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) i++;
        buf.push('…');
      }
      const list = document.createElement('ol');
      for (const value of buf) {
        const item = document.createElement('li');
        appendInline(item, value);
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
    const paragraph = document.createElement('p');
    buf.forEach((value, index) => {
      if (index) paragraph.appendChild(document.createElement('br'));
      appendInline(paragraph, value);
    });
    out.appendChild(paragraph);
  }
  return out;
}
