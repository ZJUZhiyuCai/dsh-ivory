// Isolated DOM regression tests; never attaches to the user's desktop/browser
// and never calls a provider or opens an existing conversation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './qa-lib.mjs';
import { readDesktopHost, readWebHost } from './host-bundles.mjs';
import { assertHostAliases, assertPeerSupport } from './host-contract.mjs';
import { testDisclosure } from './test-disclosure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');
const table = JSON.parse(fs.readFileSync(path.join(root, 'src/host-selectors.json'), 'utf8'));
const { aliases } = table;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const hosts = { desktop: readDesktopHost(), web: readWebHost() };
const shotsDir = process.env.DSH_DESKTOP_SHOTS;
if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
for (const [side, host] of Object.entries(hosts)) {
  assertHostAliases(table, host.sources, side);
  assert.ok(host.frontendCss.includes('_chevronHover_'), `${side}: real primitive CSS is required`);
}
assert.equal(hosts.web.version, table.hosts.web);
if (hosts.desktop.versions) {
  for (const name of pkg.dsh.client.inject) assert.equal(hosts.desktop.versions[name], table.hosts.desktop);
  assertPeerSupport(pkg, Object.values(hosts.desktop.versions));
}
const fixture = `
<div id="root"><div data-slot="root"><div class="_6Qf49G_frame" style="grid-template-columns:264px minmax(0,1fr) 0px">
  <aside class="_6Qf49G_sidebarCol"><div class="_3WPZCG_root">
    <div class="_3WPZCG_topStrip"><button>Collapse</button></div>
    <div class="_3WPZCG_logoRow"><span class="_3WPZCG_brand">DeepSeek</span></div>
    <button class="_3WPZCG_newSession"><span class="_3WPZCG_newSessionLabelMask"><span class="_3WPZCG_newSessionContent"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M6 10h8M10 6v8"/></svg><span class="_3WPZCG_newSessionLabel">新会话</span></span></span></button>
    <button class="_7D6uKa_entry" data-nav="taskboard"><span class="_7D6uKa_entryIcon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/></svg></span><span class="_7D6uKa_entryLabel">任务看板</span></button>
    <div class="_3WPZCG_panelList"><button class="_3WPZCG_panelRow" aria-label="插件"><span class="_3WPZCG_panelGlyph"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v3H4v4h3v3h3v4h4v-4h3V9h-3V6h-3V3Z"/></svg></span><span class="_3WPZCG_panelTitle">插件</span></button></div>
    <div class="_7514NG_root"><div class="_7514NG_list"><div class="jJkEga_sessionRow">测试会话</div></div></div>
    <div class="_3WPZCG_footArea">设置</div>
  </div></aside>
  <main class="_6Qf49G_centerCol"><div data-slot="main"><div data-slot="main.conversation"><div class="ST7X_W_root">
    <header class="ST7X_W_header"><div class="ST7X_W_titleRow"><span class="ST7X_W_crumbs">测试标题</span></div></header>
    <div class="ST7X_W_scrollBody"><div class="ST7X_W_composerHero">
      <div class="bocITq_root"><div class="bocITq_stack"><div class="bocITq_headline"><span class="bocITq_titleGroup"><span>探索未至之境</span><span class="bocITq_previewBadge">预览版</span></span></div></div></div>
      <div class="yhfFVG_root"><div class="yhfFVG_card"><div contenteditable="true" class="yhfFVG_input">中文 English</div><div class="yhfFVG_row"><button class="yhfFVG_primary">发送</button></div></div></div>
    </div><div data-chat-flow><div class="icaHSq_column">
      <div class="gKv1-q_root"><div class="gKv1-q_body"><p>测试回复</p><pre><code>echo test</code></pre></div><div data-slot="conversation.chat.assistant-actions"></div></div>
      <div class="HiSsxa_root" data-variant="think"><span class="HiSsxa_leading">思考</span></div>
      <div class="-gRAhq_root" data-sample="bash"><span class="-gRAhq_leading">终端</span></div>
      <div class="Q2dzhW_root" data-tool="read_file" data-variant="read"><span class="Q2dzhW_leading">读取文件</span></div>
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
  for (const generation of ['desktop', 'web']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let html = fixture;
    if (generation === 'web') {
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
    await page.addStyleTag({ content: baseCss + hosts[generation].css });
    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(() => document.body.dataset.dshcsCompat === 'ok');
    check(`${generation}: healthy contract`, await page.evaluate(() => !document.body.dataset.dshcsDrift));
    check(`${generation}: copy and turn mark enhancements`, await page.locator('.dshcs-copy-code').count() === 1 && await page.locator('.dshcs-turn-mark').count() === 1);
    for (const dark of [false, true]) {
      await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
      await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.yhfFVG_card,.uV2eYG_card')).backgroundColor === expected,
        dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
      const paint = await page.evaluate(() => {
        const card = document.querySelector('.yhfFVG_card,.uV2eYG_card');
        const input = document.querySelector('.yhfFVG_input,.uV2eYG_input');
        return { bg: getComputedStyle(card).backgroundColor, radius: getComputedStyle(card).borderRadius, font: getComputedStyle(input).fontFamily };
      });
      check(`${generation}: ${dark ? 'dark' : 'light'} card paint`, paint.bg === (dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)') && paint.radius === '20px');
      check(`${generation}: composer CJK font`, paint.font.includes('PingFang SC'));
    }
    const heroTitle = page.locator('.bocITq_titleGroup > span:first-child, .pXSMma_titleGroup > span:first-child');
    check(`${generation}: current hero title typography`, await heroTitle.evaluate((el) => getComputedStyle(el).fontSize === '38px'));
    await page.setViewportSize({ width: 375, height: 800 });
    check(`${generation}: narrow hero title typography`, await heroTitle.evaluate((el) => getComputedStyle(el).fontSize === '30px'));
    await page.setViewportSize({ width: 1200, height: 800 });
    if (generation === 'desktop') {
      for (const width of [264, 340, 420]) {
        await page.locator('._6Qf49G_frame').evaluate((el, value) => el.style.gridTemplateColumns = `${value}px minmax(0,1fr) 0px`, width);
        check(`new chat fits ${width}px sidebar`, await page.evaluate(() => {
          const button = document.querySelector('._3WPZCG_newSession').getBoundingClientRect();
          const sidebar = document.querySelector('._6Qf49G_sidebarCol').getBoundingClientRect();
          return button.left >= sidebar.left && button.right <= sidebar.right;
        }));
        const navigation = await page.evaluate(() => {
          const sidebar = document.querySelector('._6Qf49G_sidebarCol').getBoundingClientRect();
          return ['._3WPZCG_newSession', '._7D6uKa_entry', '._3WPZCG_panelRow'].map((selector) => {
            const el = document.querySelector(selector);
            const rect = el.getBoundingClientRect();
            const icon = el.querySelector('svg').getBoundingClientRect();
            const label = el.querySelector('._3WPZCG_newSessionLabel,._7D6uKa_entryLabel,._3WPZCG_panelTitle').getBoundingClientRect();
            return { left: rect.left - sidebar.left, right: sidebar.right - rect.right, height: rect.height, icon: icon.left - sidebar.left, label: label.left - sidebar.left, iconWidth: icon.width };
          });
        });
        check(`all navigation shares icon/text columns at ${width}px`, navigation.every((row) => row.icon === 24 && row.label === 56 && row.iconWidth === 20));
        check(`all navigation shares 32px rows and 8px gutters at ${width}px`, navigation.every((row) => row.left === 8 && row.right === 8 && row.height === 32));
      }
      for (const dark of [false, true]) {
        await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
        await page.locator('._3WPZCG_panelRow').evaluate((el) => el.setAttribute('aria-current', 'page'));
        await page.waitForFunction((expected) => getComputedStyle(document.querySelector('._3WPZCG_panelRow')).backgroundColor === expected, dark ? 'rgb(46, 46, 46)' : 'rgb(246, 246, 244)');
        check(`native selected nav uses ${dark ? 'dark' : 'light'} Ivory surface`, await page.locator('._3WPZCG_panelRow').evaluate((el) => getComputedStyle(el).color === (document.body.hasAttribute('data-ds-dark-theme') ? 'rgb(240, 239, 236)' : 'rgb(11, 11, 11)')));
        if (shotsDir) {
          await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.yhfFVG_card')).backgroundColor === expected, dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
          await page.locator('._6Qf49G_frame').evaluate((el) => el.style.gridTemplateColumns = '264px minmax(0,1fr) 0px');
          await page.screenshot({ path: path.join(shotsDir, `desktop-${dark ? 'dark' : 'light'}.png`) });
          await page.locator('._6Qf49G_sidebarCol').screenshot({ path: path.join(shotsDir, `sidebar-${dark ? 'dark' : 'light'}.png`) });
        }
      }
      await page.locator('._3WPZCG_panelRow').focus();
      check('native nav retains keyboard focus ring', await page.locator('._3WPZCG_panelRow').evaluate((el) => getComputedStyle(el).outlineStyle === 'solid' && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
      check('macOS wrapped new-chat label aligns with sidebar navigation', await page.evaluate(() => {
        const button = document.querySelector('._3WPZCG_newSession').getBoundingClientRect();
        const label = document.querySelector('._3WPZCG_newSessionLabel').getBoundingClientRect();
        return label.left - button.left <= 52;
      }));
      await page.evaluate(() => {
        document.querySelector('._6Qf49G_frame').setAttribute('data-sidebar-collapsed', 'true');
        localStorage.setItem('dsh-ivory.focus', '1');
        window.dispatchEvent(new StorageEvent('storage', { key: 'dsh-ivory.focus' }));
      });
      await page.waitForFunction(() => document.body.classList.contains('dsh-ivory-focus'));
      check('macOS hidden sidebar has no web rail', await page.locator('._6Qf49G_sidebarCol').evaluate((el) => el.getBoundingClientRect().width === 0));
      check('macOS title clears traffic lights', await page.locator('.ST7X_W_titleRow').evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart) >= 140));
      check('macOS title retains host grid', await page.locator('.ST7X_W_header').evaluate((el) => getComputedStyle(el).display === 'grid'));
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
    await page.locator('.yhfFVG_root,.uV2eYG_root').evaluate((el) => {
      const parent = el.parentElement; el.remove(); el.className = 'unrecognized-composer'; parent.appendChild(el);
    });
    await page.waitForFunction(() => document.body.dataset.dshcsCompat === 'token-only');
    check(`${generation}: genuine composer drift still degrades`, await page.evaluate(() => document.body.dataset.dshcsDrift.includes('composer')));
    await page.evaluate(() => { for (const cleanup of window.cleanups.reverse()) cleanup(); });
    check(`${generation}: cleanup removes all DOM enhancements`, await page.evaluate(() => !document.body.classList.contains('dsh-ivory') && !document.querySelector('.dshcs-copy-button,.dshcs-turn-mark')));
    check(`${generation}: no runtime errors`, errors.length === 0);
    await page.close();
  }
  await testDisclosure(browser, hosts, table, check, shotsDir);
} finally { await browser.close(); }
console.log(`desktop regression: ${checks} checks passed using separate installed desktop/Web styles`);
