// Isolated host-shaped DOM for the real generated bundle. Clipboard and the
// module-loader/React hook boundary are controlled; no account or live server.
import fs from 'node:fs';
const bundle = fs.readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
const frame = `<div data-slot="root"><div class="pI_x6G_frame"><aside class="hHd-Xa_root"><div class="bhn1Oq_root bhn1Oq_list"></div><div class="hHd-Xa_footArea"></div><svg id="state-dot" data-state="ongoing"></svg></aside><main data-slot="main"><div data-slot="main.conversation"><div class="wSkVaW_root"><div class="uV2eYG_root"><div class="uV2eYG_card"><div class="uV2eYG_input"></div><div class="uV2eYG_row"></div></div></div><div data-chat-flow><div class="EvIC1a_column"><article class="hWmORq_root"><div id="body" class="hWmORq_body"></div></article></div></div></div></div></main></div></div>`;

export async function withHost(browser, options, run) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [], warnings = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
  try {
    await page.setContent(frame);
    await page.evaluate(({blocked, source, language = 'markdown'}) => {
      const store = new Map();
      window.testStore = store;
      Object.defineProperty(window, 'localStorage', {value: {
        getItem: key => {
          if (blocked === 'all') throw new DOMException('denied', 'SecurityError');
          return store.get(key) ?? null;
        },
        setItem: (key, value) => {
          if (blocked) throw new DOMException('quota', 'QuotaExceededError');
          store.set(key, String(value));
        },
      }});
      window.copied = [];
      Object.defineProperty(navigator, 'clipboard', {value: {writeText: async value => window.copied.push(value)}});
      const subscriptions = new Map();
      window.preferenceNotifications = 0;
      const React = {
        useSyncExternalStore(subscribe, getSnapshot) {
          if (!subscriptions.has(subscribe)) subscriptions.set(subscribe, subscribe(() => window.preferenceNotifications++));
          return getSnapshot();
        },
        createElement: (type, props, ...children) => ({type, props: props || {}, children}),
      };
      window.readSettings = () => {
        const switches = [];
        const visit = node => {
          if (!node || typeof node !== 'object') return;
          if (node.props?.role === 'switch') switches.push(node);
          node.children?.flat().forEach(visit);
        };
        visit(window.Settings());
        return switches;
      };
      window.cleanups = [];
      window.__ModuleLoader__ = {load({factory}) {
        factory(() => React).apply({
          effect: fn => { const cleanup = fn(); if (typeof cleanup === 'function') window.cleanups.push(cleanup); },
          locale: {register: () => () => {}, bind: () => key => key, subscribe: () => () => {}, getSnapshot: () => ({revision: 0})},
          slots: {inject: (_, fn) => fn(), register: (_, component) => { window.Settings = component; return () => {}; }},
        });
      }};
      window.addSource = (text, lang = 'markdown', id = 'source') => {
        const block = document.createElement('div'); block.className = 'code-block-fixture';
        const banner = document.createElement('div'); banner.textContent = lang;
        const seat = document.createElement('div'); seat.id = `${id}-seat`;
        const pre = document.createElement('pre'); pre.id = id; pre.className = 'shiki-fixture'; pre.textContent = text;
        seat.appendChild(pre); block.append(banner, seat); document.querySelector('#body').appendChild(block);
        return pre;
      };
      if (source !== undefined) window.addSource(source, language);
    }, options);
    await page.addScriptTag({content: bundle});
    await page.waitForFunction(() => document.body.dataset.dshcsCompat === 'ok');
    await run(page, warnings);
    if (errors.length) throw new Error(errors.join('\n'));
  } finally { await page.close(); }
}
