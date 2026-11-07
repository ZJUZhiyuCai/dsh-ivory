// Isolated DOM regression tests; never attaches to the user's desktop/browser
// and never calls a provider or opens an existing conversation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './qa-lib.mjs';
import { readDesktopHost, readWebHost } from './host-bundles.mjs';
import { assertHostAliases, assertPeerSupport, indexHostModules } from './host-contract.mjs';
import { testDisclosure } from './test-disclosure.mjs';
import { testConversation, testViewOverflow } from './test-conversation.mjs';
import { testOverlays } from './test-overlays.mjs';
import { testFiles } from './test-files.mjs';
import { testManager } from './test-manager.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');
const table = JSON.parse(fs.readFileSync(path.join(root, 'src/host-selectors.json'), 'utf8'));
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
<div id="root"><div data-slot="root"><div class="PIRFFq_frame" style="grid-template-columns:264px minmax(0,1fr) 0px">
  <aside class="PIRFFq_sidebarCol"><div class="kB3qhq_root">
    <div class="kB3qhq_topStrip"><button>Collapse</button></div>
    <div class="kB3qhq_logoRow"><span class="kB3qhq_brand">DeepSeek</span></div>
    <button class="kB3qhq_newSession"><span class="kB3qhq_newSessionLabelMask"><span class="kB3qhq_newSessionContent"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M6 10h8M10 6v8"/></svg><span class="kB3qhq_newSessionLabel">新会话</span></span></span></button>
    <button class="_7D6uKa_entry" data-nav="taskboard"><span class="_7D6uKa_entryIcon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/></svg></span><span class="_7D6uKa_entryLabel">任务看板</span></button>
    <div class="kB3qhq_panelList"><button class="kB3qhq_panelRow" aria-label="插件"><span class="kB3qhq_panelGlyph"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v3H4v4h3v3h3v4h4v-4h3V9h-3V6h-3V3Z"/></svg></span><span class="kB3qhq_panelTitle">插件</span></button></div>
    <div class="Kjh-qa_root"><div class="Kjh-qa_list"><div class="JoiKIa_sessionRow">测试会话</div></div></div>
    <div class="kB3qhq_footArea">设置</div>
  </div></aside>
  <main class="PIRFFq_centerCol"><div data-slot="main"><div data-slot="main.conversation"><div class="kiGsTW_root">
    <header class="kiGsTW_header"><div class="kiGsTW_titleRow"><span class="kiGsTW_crumbs">测试标题</span></div></header>
    <div class="kiGsTW_scrollBody"><div class="kiGsTW_composerStack kiGsTW_composerHero">
      <div class="_8tPydW_root"><div class="_8tPydW_stack"><div class="_8tPydW_headline"><span class="_8tPydW_titleGroup"><span>探索未至之境</span><span class="_8tPydW_previewBadge">预览版</span></span></div></div></div>
      <div class="kiGsTW_heroWorkspaceRow"><button class="_8tPydW_workspace">工作区</button><button class="ufIuna_seat">标准模式</button></div>
      <div data-slot="conversation.composer.bar" style="display:contents"><div class="JZLxKW_root"><div class="JZLxKW_card"><div class="JZLxKW_scroll"><div class="JZLxKW_grow"><div contenteditable="true" class="JZLxKW_input">中文 English</div><div class="JZLxKW_placeholder">输入消息</div></div></div><div class="JZLxKW_row"><button class="JZLxKW_primary">发送</button></div></div></div></div>
    </div><div data-chat-flow><div class="tnXGgG_column">
      <div class="AkCqbG_userRow"><div class="AkCqbG_userStack"><div data-message-bubble>这是一条用户消息，用于验证气泡样式与复制目标。</div></div></div>
      <div class="XNZzAa_root"><div class="XNZzAa_body"><p>测试回复</p><pre><code>echo test</code></pre></div><div data-slot="conversation.chat.assistant-actions"></div></div>
      <div class="ijfCxa_root" data-variant="think"><span class="ijfCxa_leading">思考</span></div>
      <div class="BFlR-G_root" data-sample="bash"><span class="BFlR-G_leading">终端</span></div>
      <div class="UHhYua_root" data-tool="read_file" data-variant="read"><span class="UHhYua_leading">读取文件</span></div>
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
      // Fixture-only wrapper classes also need each host's real CSS. Resolve
      // those by module identity without widening the plugin's alias contract.
      const desktopModules = indexHostModules(hosts.desktop.sources);
      const webModules = indexHostModules(hosts.web.sources);
      const inverse = Object.fromEntries(Object.values(table.modules).flatMap(({ package: pkg, module }) => {
        const name = `${pkg}/${module}`;
        const web = webModules.get(name);
        return Object.entries(desktopModules.get(name)).map(([member, desktop]) => [desktop, web[member]]).filter(([, web]) => web);
      }));
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
    check(`${generation}: user bubble follows the semantic message anchor`, await page.locator('[data-message-bubble]').evaluate(el => getComputedStyle(el).borderRadius === '12px' && getComputedStyle(el).padding === '12px 16px' && !!el.querySelector(':scope > .dshcs-copy-text')));
    for (const dark of [false, true]) {
      await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
      await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.JZLxKW_card,.uV2eYG_card')).backgroundColor === expected,
        dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
      const paint = await page.evaluate(() => {
        const card = document.querySelector('.JZLxKW_card,.uV2eYG_card');
        const input = document.querySelector('.JZLxKW_input,.uV2eYG_input');
        return { bg: getComputedStyle(card).backgroundColor, radius: getComputedStyle(card).borderRadius, font: getComputedStyle(input).fontFamily };
      });
      check(`${generation}: ${dark ? 'dark' : 'light'} card paint`, paint.bg === (dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)') && paint.radius === '20px');
      check(`${generation}: composer CJK font`, paint.font.includes('PingFang SC'));
    }
    const heroTitle = page.locator('._8tPydW_titleGroup > span:first-child, .pXSMma_titleGroup > span:first-child');
    check(`${generation}: current hero title typography`, await heroTitle.evaluate((el) => getComputedStyle(el).fontSize === '38px'));
    await page.setViewportSize({ width: 375, height: 800 });
    check(`${generation}: narrow hero title typography`, await heroTitle.evaluate((el) => getComputedStyle(el).fontSize === '30px'));
    await page.setViewportSize({ width: 1200, height: 800 });
    // Reproduce the real shared composerStack/composerHero node and contents
    // slot. The old fixture missed both, hiding the full-width hero regression.
    for (const [width, height] of [[1200, 800], [1200, 540], [800, 700], [375, 667], [375, 480]]) {
      await page.setViewportSize({ width, height });
      await page.locator('.PIRFFq_frame,.pI_x6G_frame').evaluate((el, narrow) => {
        el.style.gridTemplateColumns = `${narrow ? 0 : 264}px minmax(0,1fr) 0px`;
      }, width < 500);
      const layout = await page.evaluate(() => {
        const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
        return {
          center: rect('.PIRFFq_centerCol,.pI_x6G_centerCol'),
          hero: rect('.kiGsTW_composerHero,.wSkVaW_composerHero'),
          title: rect('._8tPydW_titleGroup,.pXSMma_titleGroup'),
          card: rect('.JZLxKW_card,.uV2eYG_card'),
          context: rect('.kiGsTW_heroWorkspaceRow,.wSkVaW_heroWorkspaceRow'),
        };
      });
      check(`${generation} ${width}x${height}: hero stays within writing pane`, layout.hero.width <= 672 && layout.hero.left >= layout.center.left + 11 && layout.hero.right <= layout.center.right - 11);
      check(`${generation} ${width}x${height}: greeting, composer and context never overlap`, layout.title.bottom + 20 <= layout.card.top && layout.card.bottom + 8 <= layout.context.top);
      check(`${generation} ${width}x${height}: all home controls fit vertically`, layout.context.bottom < height);
    }
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.locator('.PIRFFq_frame,.pI_x6G_frame').evaluate((el) => el.style.gridTemplateColumns = '264px minmax(0,1fr) 0px');
    const card = page.locator('.JZLxKW_card,.uV2eYG_card');
    const beforeFocus = await card.boundingBox();
    await page.locator('.JZLxKW_input,.uV2eYG_input').focus();
    check(`${generation}: composer focus does not shift layout`, JSON.stringify(await card.boundingBox()) === JSON.stringify(beforeFocus));
    check(`${generation}: input and placeholder share their left inset`, await page.evaluate(() => {
      const input = getComputedStyle(document.querySelector('.JZLxKW_input,.uV2eYG_input'));
      const placeholder = getComputedStyle(document.querySelector('.JZLxKW_placeholder,.uV2eYG_placeholder'));
      return input.paddingLeft === placeholder.left;
    }));
    check(`${generation}: wrapped new-chat content aligns on both hosts`, await page.locator('.kB3qhq_newSessionContent,.hHd-Xa_newSessionContent').evaluate(el => getComputedStyle(el).justifyContent === 'flex-start'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(`${generation}: navigation and composer respect reduced motion`, await page.evaluate(() => ['.JZLxKW_card,.uV2eYG_card', '.kB3qhq_newSession,.hHd-Xa_newSession'].every(s => getComputedStyle(document.querySelector(s)).transitionDuration.split(',').every(d => parseFloat(d) < 0.001))));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    if (generation === 'desktop') {
      for (const width of [264, 340, 420]) {
        await page.locator('.PIRFFq_frame').evaluate((el, value) => el.style.gridTemplateColumns = `${value}px minmax(0,1fr) 0px`, width);
        check(`new chat fits ${width}px sidebar`, await page.evaluate(() => {
          const button = document.querySelector('.kB3qhq_newSession').getBoundingClientRect();
          const sidebar = document.querySelector('.PIRFFq_sidebarCol').getBoundingClientRect();
          return button.left >= sidebar.left && button.right <= sidebar.right;
        }));
        const navigation = await page.evaluate(() => {
          const sidebar = document.querySelector('.PIRFFq_sidebarCol').getBoundingClientRect();
          return ['.kB3qhq_newSession', '._7D6uKa_entry', '.kB3qhq_panelRow'].map((selector) => {
            const el = document.querySelector(selector);
            const rect = el.getBoundingClientRect();
            const icon = el.querySelector('svg').getBoundingClientRect();
            const label = el.querySelector('.kB3qhq_newSessionLabel,._7D6uKa_entryLabel,.kB3qhq_panelTitle').getBoundingClientRect();
            return { left: rect.left - sidebar.left, right: sidebar.right - rect.right, height: rect.height, icon: icon.left - sidebar.left, label: label.left - sidebar.left, iconWidth: icon.width };
          });
        });
        check(`all navigation shares icon/text columns at ${width}px`, navigation.every((row) => row.icon === 24 && row.label === 56 && row.iconWidth === 20));
        check(`all navigation shares 32px rows and 8px gutters at ${width}px`, navigation.every((row) => row.left === 8 && row.right === 8 && row.height === 32));
      }
      for (const dark of [false, true]) {
        await page.evaluate((value) => document.body.toggleAttribute('data-ds-dark-theme', value), dark);
        await page.locator('.kB3qhq_panelRow').evaluate((el) => el.setAttribute('aria-current', 'page'));
        await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.kB3qhq_panelRow')).backgroundColor === expected, dark ? 'rgb(46, 46, 46)' : 'rgb(234, 234, 230)');
        check(`native selected nav uses ${dark ? 'dark' : 'light'} Ivory surface`, await page.locator('.kB3qhq_panelRow').evaluate((el) => getComputedStyle(el).color === (document.body.hasAttribute('data-ds-dark-theme') ? 'rgb(240, 239, 236)' : 'rgb(36, 36, 34)')));
        if (shotsDir) {
          await page.waitForFunction((expected) => getComputedStyle(document.querySelector('.JZLxKW_card')).backgroundColor === expected, dark ? 'rgb(38, 38, 38)' : 'rgb(255, 255, 255)');
          await page.locator('.PIRFFq_frame').evaluate((el) => el.style.gridTemplateColumns = '264px minmax(0,1fr) 0px');
          await page.screenshot({ path: path.join(shotsDir, `desktop-${dark ? 'dark' : 'light'}.png`) });
          await page.locator('.PIRFFq_sidebarCol').screenshot({ path: path.join(shotsDir, `sidebar-${dark ? 'dark' : 'light'}.png`) });
        }
      }
      await page.locator('.kB3qhq_panelRow').focus();
      check('native nav retains keyboard focus ring', await page.locator('.kB3qhq_panelRow').evaluate((el) => getComputedStyle(el).outlineStyle === 'solid' && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
      check('macOS wrapped new-chat label aligns with sidebar navigation', await page.evaluate(() => {
        const button = document.querySelector('.kB3qhq_newSession').getBoundingClientRect();
        const label = document.querySelector('.kB3qhq_newSessionLabel').getBoundingClientRect();
        return label.left - button.left <= 52;
      }));
      await page.evaluate(() => {
        document.querySelector('.PIRFFq_frame').setAttribute('data-sidebar-collapsed', 'true');
        localStorage.setItem('dsh-ivory.focus', '1');
        window.dispatchEvent(new StorageEvent('storage', { key: 'dsh-ivory.focus' }));
      });
      await page.waitForFunction(() => document.body.classList.contains('dsh-ivory-focus'));
      check('macOS hidden sidebar has no web rail', await page.locator('.PIRFFq_sidebarCol').evaluate((el) => el.getBoundingClientRect().width === 0));
      check('macOS title clears traffic lights', await page.locator('.kiGsTW_titleRow').evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart) >= 140));
      check('macOS title retains host grid', await page.locator('.kiGsTW_header').evaluate((el) => getComputedStyle(el).display === 'grid'));
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
    await page.locator('.JZLxKW_root,.uV2eYG_root').evaluate((el) => {
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
  await testConversation(browser, hosts, table, check, shotsDir);
  await testViewOverflow(browser, hosts, table, check, shotsDir);
  await testOverlays(browser, hosts, check, shotsDir);
  await testFiles(browser, hosts, check, shotsDir);
  await testManager(browser, hosts, check, shotsDir);
} finally { await browser.close(); }
console.log(`desktop regression: ${checks} checks passed using separate installed desktop/Web styles`);
