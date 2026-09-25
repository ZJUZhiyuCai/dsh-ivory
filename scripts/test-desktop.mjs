// Isolated DOM regression tests; never attaches to the user's desktop/browser
// and never calls a provider or opens an existing conversation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './qa-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');
const aliases = JSON.parse(fs.readFileSync(path.join(root, 'src/host-selectors.json'), 'utf8')).aliases;
const hostDir = process.env.DSH_DESKTOP_CLIENT_DIR;
const shotsDir = process.env.DSH_DESKTOP_SHOTS;
if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
// Read shipped client styles from the signed app without launching it or
// changing app.asar. An extracted bundle directory can be supplied on CI.
function hostSources() {
  if (hostDir) return fs.readdirSync(hostDir).filter((name) => name.endsWith('.js'))
    .map((name) => fs.readFileSync(path.join(hostDir, name), 'utf8'));
  const archive = '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar';
  if (!fs.existsSync(archive)) throw new Error('Install DSH desktop or set DSH_DESKTOP_CLIENT_DIR to its extracted client bundles.');
  const fd = fs.openSync(archive, 'r');
  try {
    const prefix = Buffer.alloc(16); fs.readSync(fd, prefix, 0, 16, 0);
    const header = Buffer.alloc(prefix.readUInt32LE(12)); fs.readSync(fd, header, 0, header.length, 16);
    const base = 8 + prefix.readUInt32LE(4);
    const sources = [];
    const walk = (node, name = '') => {
      for (const [part, entry] of Object.entries(node.files || {})) {
        const full = `${name}/${part}`;
        if (entry.files) walk(entry, full);
        else if (/\/@deepseek-ai\/dsh-client-[^/]+\/lib\/client\.js$/.test(full)) {
          const data = Buffer.alloc(entry.size); fs.readSync(fd, data, 0, data.length, base + Number(entry.offset));
          sources.push(data.toString('utf8'));
        }
      }
    };
    walk(JSON.parse(header.toString('utf8')));
    return sources;
  } finally { fs.closeSync(fd); }
}
let hostCss = '';
{
  for (const source of hostSources()) {
    for (const match of source.matchAll(/(?:const css(?:\$\d+)?|var \w+_css_default(?:\$\d+)?) = ("(?:\\.|[^"\\])*");/g)) {
      hostCss += JSON.parse(match[1]) + '\n';
    }
  }
  // Verify aliases against the actual installed host styles, not the fixture.
  for (const desktop of Object.values(aliases)) {
    assert.ok(hostCss.includes('.' + desktop), `desktop class absent from installed styles: ${desktop}`);
  }
}
const fixture = `
<div id="root"><div data-slot="root"><div class="P9Gu9a_frame" style="grid-template-columns:264px minmax(0,1fr) 0px">
  <aside class="P9Gu9a_sidebarCol"><div class="pjj1TG_root">
    <div class="pjj1TG_topStrip"><button>Collapse</button></div>
    <div class="pjj1TG_logoRow"><span class="pjj1TG_brand">DeepSeek</span></div>
    <button class="pjj1TG_newSession"><span class="pjj1TG_newSessionLabelMask"><span class="pjj1TG_newSessionContent"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M6 10h8M10 6v8"/></svg><span class="pjj1TG_newSessionLabel">新会话</span></span></span></button>
    <button class="_7D6uKa_entry" data-nav="taskboard"><span class="_7D6uKa_entryIcon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/></svg></span><span class="_7D6uKa_entryLabel">任务看板</span></button>
    <div class="pjj1TG_panelList"><button class="pjj1TG_panelRow" aria-label="插件"><span class="pjj1TG_panelGlyph"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v3H4v4h3v3h3v4h4v-4h3V9h-3V6h-3V3Z"/></svg></span><span class="pjj1TG_panelTitle">插件</span></button></div>
    <div class="GbPhAq_root"><div class="GbPhAq_list"><div class="KX1G9q_sessionRow">测试会话</div></div></div>
    <div class="pjj1TG_footArea">设置</div>
  </div></aside>
  <main class="P9Gu9a_centerCol"><div data-slot="main"><div data-slot="main.conversation"><div class="_5AcOhq_root">
    <header class="_5AcOhq_header"><div class="_5AcOhq_titleRow"><span class="_5AcOhq_crumbs">测试标题</span></div></header>
    <div class="_5AcOhq_scrollBody"><div class="_5AcOhq_composerHero">
      <div class="rV80fW_root"><div class="rV80fW_stack"><div class="rV80fW_headline"><span class="rV80fW_titleGroup"><span>探索未至之境</span><span class="rV80fW_previewBadge">预览版</span></span></div></div></div>
      <div class="QJwAZG_root"><div class="QJwAZG_card"><div contenteditable="true" class="QJwAZG_input">中文 English</div><div class="QJwAZG_row"><button class="QJwAZG_primary">发送</button></div></div></div>
    </div><div data-chat-flow><div class="DwbCQq_column">
      <div class="_1TpC3q_root"><div class="_1TpC3q_body"><p>测试回复</p><pre><code>echo test</code></pre></div><div data-slot="conversation.chat.assistant-actions"></div></div>
      <div class="MuR-fW_root" data-variant="think"><span class="MuR-fW_leading">思考</span></div>
      <div class="ZPwaDq_root" data-sample="bash"><span class="ZPwaDq_leading">终端</span></div>
      <div class="_5Tb7VW_root" data-tool="read_file" data-variant="read"><span class="_5Tb7VW_leading">读取文件</span></div>
    </div></div></div>
  </div></div></div></main>
</div></div></div>`;
const baseCss = `html,body,#root,[data-slot="root"]{height:100%;margin:0} body{--dsh-composer-card-max-width:700px;--dsh-chat-content-width:700px}
/* Task-board 0.4.2 entry structure/geometry; only the nav row is needed. */
._7D6uKa_entry{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:36px;padding:7px 8px;margin:0 2px;background:transparent;border:0;border-radius:12px;font:inherit;font-size:14px;line-height:22px;text-align:left}
._7D6uKa_entryIcon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}
._7D6uKa_entryIcon svg{display:block;width:16px;height:16px}`;
const browser = await launch();
let checks = 0;
const check = (name, value) => { assert.ok(value, name); checks++; console.log('PASS', name); };
try {
  for (const generation of ['desktop', 'legacy']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let html = fixture;
    if (generation === 'legacy') {
      const inverse = Object.fromEntries(Object.entries(aliases).map(([a, b]) => [b, a]));
      html = html.replace(/class="([^"]*)"/g, (_, classes) => `class="${classes.split(' ').map((name) => inverse[name] || name).join(' ')}"`);
      html = html.replace('main.conversation', 'conversation');
    }
    await page.setContent(html);
    await page.evaluate((desktop) => {
      if (desktop) document.documentElement.dataset.platform = 'darwin';
      const store = new Map();
      Object.defineProperty(window, 'localStorage', { value: { getItem: (k) => store.get(k), setItem: (k, v) => store.set(k, v) } });
      window.cleanups = [];
      window.__ModuleLoader__ = { load({ factory }) {
        window.ivory = factory(() => ({}));
        window.ivory.apply({
          effect: (fn) => { const dispose = fn(); if (typeof dispose === 'function') window.cleanups.push(dispose); },
          locale: { register: () => () => {}, bind: () => (key) => key, subscribe: () => () => {} },
          slots: { inject: (_, fn) => fn(), register: () => () => {} },
        });
      } };
    }, generation === 'desktop');
    await page.addStyleTag({ content: baseCss + hostCss });
    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(() => document.body.dataset.dshcsCompat === 'ok');
    check(`${generation}: healthy contract`, await page.evaluate(() => !document.body.dataset.dshcsDrift));
    check(`${generation}: copy and turn mark enhancements`, await page.locator('.dshcs-copy-code').count() === 1 && await page.locator('.dshcs-turn-mark').count() === 1);
    for (const dark of [false, true]) {
      await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
      await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.QJwAZG_card,.uV2eYG_card')).backgroundColor === expected,
        dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
      const paint = await page.evaluate(() => {
        const card = document.querySelector('.QJwAZG_card,.uV2eYG_card');
        const input = document.querySelector('.QJwAZG_input,.uV2eYG_input');
        return { bg: getComputedStyle(card).backgroundColor, radius: getComputedStyle(card).borderRadius, font: getComputedStyle(input).fontFamily };
      });
      check(`${generation}: ${dark ? 'dark' : 'light'} card paint`, paint.bg === (dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)') && paint.radius === '20px');
      check(`${generation}: composer CJK font`, paint.font.includes('PingFang SC'));
    }
    if (generation === 'desktop') {
      for (const width of [264, 340, 420]) {
        await page.locator('.P9Gu9a_frame').evaluate((el, value) => el.style.gridTemplateColumns = `${value}px minmax(0,1fr) 0px`, width);
        check(`new chat fits ${width}px sidebar`, await page.evaluate(() => {
          const button = document.querySelector('.pjj1TG_newSession').getBoundingClientRect();
          const sidebar = document.querySelector('.P9Gu9a_sidebarCol').getBoundingClientRect();
          return button.left >= sidebar.left && button.right <= sidebar.right;
        }));
        const navigation = await page.evaluate(() => {
          const sidebar = document.querySelector('.P9Gu9a_sidebarCol').getBoundingClientRect();
          return ['.pjj1TG_newSession', '._7D6uKa_entry', '.pjj1TG_panelRow'].map((selector) => {
            const el = document.querySelector(selector);
            const rect = el.getBoundingClientRect();
            const icon = el.querySelector('svg').getBoundingClientRect();
            const label = el.querySelector('.pjj1TG_newSessionLabel,._7D6uKa_entryLabel,.pjj1TG_panelTitle').getBoundingClientRect();
            return { left: rect.left - sidebar.left, right: sidebar.right - rect.right, height: rect.height, icon: icon.left - sidebar.left, label: label.left - sidebar.left, iconWidth: icon.width };
          });
        });
        check(`all navigation shares icon/text columns at ${width}px`, navigation.every((row) => row.icon === 24 && row.label === 56 && row.iconWidth === 20));
        check(`all navigation shares 32px rows and 8px gutters at ${width}px`, navigation.every((row) => row.left === 8 && row.right === 8 && row.height === 32));
      }
      for (const dark of [false, true]) {
        await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
        await page.locator('.pjj1TG_panelRow').evaluate((el) => el.setAttribute('aria-current', 'page'));
        await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.pjj1TG_panelRow')).backgroundColor === expected, dark ? 'rgb(46, 46, 46)' : 'rgb(246, 246, 244)');
        check(`native selected nav uses ${dark ? 'dark' : 'light'} Ivory surface`, await page.locator('.pjj1TG_panelRow').evaluate((el) => getComputedStyle(el).color === (document.body.hasAttribute('data-ds-dark-theme') ? 'rgb(240, 239, 236)' : 'rgb(11, 11, 11)')));
        if (shotsDir) {
          await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.QJwAZG_card')).backgroundColor === expected, dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
          await page.locator('.P9Gu9a_frame').evaluate((el) => el.style.gridTemplateColumns = '264px minmax(0,1fr) 0px');
          await page.screenshot({ path: path.join(shotsDir, `desktop-${dark ? 'dark' : 'light'}.png`) });
          await page.locator('.P9Gu9a_sidebarCol').screenshot({ path: path.join(shotsDir, `sidebar-${dark ? 'dark' : 'light'}.png`) });
        }
      }
      await page.locator('.pjj1TG_panelRow').focus();
      check('native nav retains keyboard focus ring', await page.locator('.pjj1TG_panelRow').evaluate((el) => getComputedStyle(el).outlineStyle === 'solid' && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
      check('macOS wrapped new-chat label aligns with sidebar navigation', await page.evaluate(() => {
        const button = document.querySelector('.pjj1TG_newSession').getBoundingClientRect();
        const label = document.querySelector('.pjj1TG_newSessionLabel').getBoundingClientRect();
        return label.left - button.left <= 52;
      }));
      await page.evaluate(() => {
        document.querySelector('.P9Gu9a_frame').setAttribute('data-sidebar-collapsed', 'true');
        localStorage.setItem('dsh-ivory.focus', '1');
        window.dispatchEvent(new StorageEvent('storage', { key: 'dsh-ivory.focus' }));
      });
      await page.waitForFunction(() => document.body.classList.contains('dsh-ivory-focus'));
      check('macOS hidden sidebar has no web rail', await page.locator('.P9Gu9a_sidebarCol').evaluate((el) => el.getBoundingClientRect().width === 0));
      check('macOS title clears traffic lights', await page.locator('._5AcOhq_titleRow').evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart) >= 140));
      check('macOS title retains host grid', await page.locator('._5AcOhq_header').evaluate((el) => getComputedStyle(el).display === 'grid'));
      check('current hero title typography', await page.locator('.rV80fW_titleGroup > span:first-child').evaluate((el) => getComputedStyle(el).fontSize === '38px'));
    }
    // Replace a real conversation with a global panel, wait past the contract
    // throttle, then return. Both directions previously lost the entire skin.
    await page.evaluate(() => {
      window.savedConversation = document.querySelector('[data-slot="main.conversation"],[data-slot="conversation"]');
      const panel = document.createElement('section'); panel.className = 'plugin-manager-fixture'; panel.textContent = '插件';
      window.savedConversation.replaceWith(panel);
    });
    await page.waitForTimeout(5500);
    check(`${generation}: global panel keeps theme`, await page.evaluate(() => document.body.dataset.dshcsCompat === 'ok' && !document.body.dataset.dshcsDrift));
    await page.evaluate(() => document.querySelector('.plugin-manager-fixture').replaceWith(window.savedConversation));
    await page.waitForTimeout(5500);
    check(`${generation}: conversation restores without drift`, await page.evaluate(() => document.body.dataset.dshcsCompat === 'ok' && !document.body.dataset.dshcsDrift));
    // A genuinely unknown composer must still degrade; adding aliases must
    // never turn the compatibility guard into unconditional acceptance.
    await page.locator('.QJwAZG_root,.uV2eYG_root').evaluate((el) => {
      const parent = el.parentElement; el.remove(); el.className = 'unrecognized-composer'; parent.appendChild(el);
    });
    await page.waitForFunction(() => document.body.dataset.dshcsCompat === 'token-only');
    check(`${generation}: genuine composer drift still degrades`, await page.evaluate(() => document.body.dataset.dshcsDrift.includes('composer')));
    await page.evaluate(() => { for (const cleanup of window.cleanups.reverse()) cleanup(); });
    check(`${generation}: cleanup removes all DOM enhancements`, await page.evaluate(() => !document.body.classList.contains('dsh-ivory') && !document.querySelector('.dshcs-copy-button,.dshcs-turn-mark')));
    check(`${generation}: no runtime errors`, errors.length === 0);
    await page.close();
  }
} finally { await browser.close(); }
console.log(`desktop regression: ${checks} checks passed using installed host styles`);
