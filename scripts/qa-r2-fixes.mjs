// Regression suite for the R2 adversarial review fixes.
// Requires a running DSH instance at http://127.0.0.1:3080.
import fs from 'node:fs';
import { launch, openPage, expandSidebar, setTheme } from './qa-lib.mjs';

const OUT = 'output/playwright/r2-fixes-20260816';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = null) => {
  const item = { name, pass: Boolean(pass), detail };
  results.push(item);
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${name}`, detail === null ? '' : JSON.stringify(detail).slice(0, 600));
};
const colorAlpha = (color) => {
  const match = color.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return 1;
  const parts = match[1].split(/[\s,\/]+/).filter(Boolean);
  return parts.length > 3 ? Number(parts[3]) : 1;
};

async function openConversation(page) {
  await expandSidebar(page).catch(() => {});
  const rows = page.locator('.YDXeBa_sessionRow');
  const count = await rows.count();
  if (!count) throw new Error('Browser QA requires at least one saved conversation.');
  for (let index = 0; index < count; index++) {
    const label = (await rows.nth(index).innerText()).trim();
    if (/^(?:新会话|New chat)(?:\s|$)/i.test(label)) continue;
    await rows.nth(index).click();
    await page.waitForTimeout(1200);
    if (await page.locator('.wSkVaW_crumb, .Md3f7G_column, .Sxvs8a_root').count()) return true;
    await expandSidebar(page).catch(() => {});
  }
  throw new Error('No saved sidebar row opened a conversation view.');
}

const browser = await launch();
try {
  // F1: the host remains the sole owner of the default three-track frame.
  for (const [width, height, minimumCenter] of [[1440, 900, 640], [768, 900, 400], [375, 900, 300]]) {
    const { page, errors } = await openPage(browser, { w: width, h: height, focus: false });
    if (width >= 1024) await expandSidebar(page).catch(() => {});
    const geometry = await page.evaluate(() => {
      const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
      const frame = document.querySelector('.pI_x6G_frame');
      const center = document.querySelector('.pI_x6G_centerCol');
      return {
        compat: document.body.dataset.dshcsCompat,
        tracks: getComputedStyle(frame).gridTemplateColumns.trim().split(/\s+/),
        inline: frame.getAttribute('style'),
        center: rect(center),
        viewport: [innerWidth, innerHeight],
        bodyWidth: document.body.scrollWidth,
      };
    });
    check(`frame-${width}-three-tracks`, geometry.tracks.length === 3, geometry);
    check(`frame-${width}-center-usable`, geometry.center?.[2] >= minimumCenter, geometry.center);
    check(`frame-${width}-contract`, geometry.compat === 'ok' && errors.length === 0, { compat: geometry.compat, errors });
    await page.screenshot({ path: `${OUT}/frame-${width}.png` });
    await page.close();
  }

  // F1/mobile: navigate directly so the responsive rail stays collapsed. The
  // title, header actions and every composer control must remain usable.
  {
    const desktop = await openPage(browser, { w: 1440, h: 900, focus: false });
    await openConversation(desktop.page);
    const sessionUrl = desktop.page.url();
    await desktop.page.close();

    const { page, errors } = await openPage(browser, { w: 375, h: 900, focus: false });
    await page.goto(sessionUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const mobile = await page.evaluate(() => {
      const rect = (element) => {
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return [value.x, value.y, value.width, value.height, value.right, value.bottom].map(Math.round);
      };
      const composer = document.querySelector('.uV2eYG_card');
      return {
        viewport: [innerWidth, innerHeight],
        bodyWidth: document.body.scrollWidth,
        center: rect(document.querySelector('.pI_x6G_centerCol')),
        crumb: rect(document.querySelector('.wSkVaW_crumb')),
        headerActions: rect(document.querySelector('.wSkVaW_headerActions')),
        sessionLog: rect(document.querySelector('.nL4_yW_sessionLogButton')),
        composer: rect(composer),
        controls: [...document.querySelectorAll('.uV2eYG_row button')].map(rect),
      };
    });
    const headerFits = mobile.crumb && mobile.headerActions && mobile.sessionLog
      && mobile.crumb[2] >= 80
      && mobile.crumb[4] <= mobile.headerActions[0] + 1
      && mobile.sessionLog[4] <= mobile.viewport[0];
    const controlsFit = mobile.composer && mobile.controls.length > 0
      && mobile.controls.every((item) => item[0] >= mobile.composer[0] - 1 && item[4] <= mobile.composer[4] + 1);
    check('mobile-conversation-no-horizontal-overflow', mobile.bodyWidth <= mobile.viewport[0] && mobile.center?.[2] >= 300, mobile);
    check('mobile-header-title-and-actions-fit', headerFits, mobile);
    check('mobile-composer-controls-fit', controlsFit, mobile);
    check('mobile-conversation-no-page-errors', errors.length === 0, errors);
    await page.screenshot({ path: `${OUT}/conversation-mobile-375.png` });
    await page.close();
  }

  // Focus mode is the pixel-comparison baseline: test the visible card rather
  // than its padded wrapper so documentation cannot drift from the UI again.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: true });
    await expandSidebar(page).catch(() => {});
    await openConversation(page);
    const card = await page.locator('.uV2eYG_card').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height].map(Math.round);
    });
    check('focus-conversation-card-reference-geometry', card[0] === 488 && card[1] === 768 && card[2] === 752 && card[3] === 100, card);
    check('focus-conversation-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // F2 plus requested focus treatment: one visible text layer and no blue card ring.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    const input = page.locator('.uV2eYG_input');
    await input.fill('重影检查 ABC 123');
    await input.focus();
    await page.waitForTimeout(200);
    const layers = await page.evaluate(() => {
      const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
      const read = (selector) => {
        const element = document.querySelector(selector);
        const style = getComputedStyle(element);
        return {
          color: style.color,
          fill: style.webkitTextFillColor,
          visibility: style.visibility,
          opacity: style.opacity,
          text: element.value || element.textContent,
          rect: rect(element),
        };
      };
      const card = document.querySelector('.uV2eYG_card');
      const cardStyle = getComputedStyle(card);
      return {
        input: read('.uV2eYG_input'),
        backdrop: read('.uV2eYG_backdrop'),
        mirror: read('.uV2eYG_mirror'),
        cardOutline: [cardStyle.outlineStyle, cardStyle.outlineWidth, cardStyle.outlineColor],
        transition: [cardStyle.transitionProperty, cardStyle.transitionDuration],
      };
    });
    check('composer-single-visible-layer', colorAlpha(layers.input.color) === 0 && colorAlpha(layers.backdrop.color) > 0 && layers.mirror.visibility === 'hidden', layers);
    check('composer-focus-no-outer-ring', layers.cardOutline[0] === 'none' || layers.cardOutline[1] === '0px', layers.cardOutline);
    check('composer-paint-only-transition', !layers.transition[0].includes('all') && layers.transition[1].includes('0.15s'), layers.transition);
    check('composer-no-page-errors', errors.length === 0, errors);
    await page.screenshot({ path: `${OUT}/composer-single-layer.png` });
    await page.close();
  }

  // Requested interaction invariant: entering text may enable submission, but
  // the send button must not visually jump from a dim control to a filled disc.
  for (const [theme, tag] of [['浅色', 'light'], ['深色', 'dark']]) {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await setTheme(page, theme);
    const input = page.locator('.uV2eYG_input:visible').last();
    const button = page.locator('.uV2eYG_primary:visible').last();
    const read = () => button.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        disabled: element.disabled,
        backgroundColor: style.backgroundColor,
        color: style.color,
        opacity: style.opacity,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        filter: style.filter,
        transform: style.transform,
        width: style.width,
        height: style.height,
        borderRadius: style.borderRadius,
        transitionDuration: style.transitionDuration,
      };
    });
    await input.fill('');
    await page.waitForTimeout(100);
    const empty = await read();
    await input.fill('视觉恒定');
    await page.waitForTimeout(100);
    const typed = await read();
    const paintProperties = [
      'backgroundColor', 'color', 'opacity', 'borderColor', 'boxShadow',
      'filter', 'transform', 'width', 'height', 'borderRadius',
      'transitionDuration',
    ];
    const unchanged = paintProperties.every((property) => empty[property] === typed[property]);
    check(`composer-send-state-visually-stable-${tag}`,
      empty.disabled && !typed.disabled
      && unchanged
      && typed.backgroundColor === 'rgba(0, 0, 0, 0)'
      && typed.opacity === '0.72'
      && typed.transitionDuration === '0s'
      && errors.length === 0,
      { empty, typed, errors });
    await page.close();
  }

  // F0: untrusted Markdown is built with DOM nodes, never executable attributes.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.evaluate(() => {
      const block = document.createElement('div');
      block.className = 'code-block-security-fixture';
      const banner = document.createElement('div');
      banner.textContent = 'markdown 复制';
      const seat = document.createElement('div');
      const pre = document.createElement('pre');
      pre.className = 'shiki-security-fixture';
      pre.textContent = '# Safe\n[ok](https://example.com/a)\n[x](https://safe.example"onmouseover="alert(1))\n[y](javascript:alert(1))\n<img src=x onerror=alert(1)>';
      seat.appendChild(pre);
      block.append(banner, seat);
      document.body.appendChild(block);
    });
    await page.waitForTimeout(400);
    const security = await page.evaluate(() => {
      const view = document.querySelector('.code-block-security-fixture .dshcs-md');
      const descendants = view ? [...view.querySelectorAll('*')] : [];
      return {
        rendered: Boolean(view),
        eventAttributes: descendants.flatMap((element) => [...element.attributes].filter((attribute) => /^on/i.test(attribute.name)).map((attribute) => attribute.name)),
        executableNodes: view?.querySelectorAll('img, script, iframe, object, embed').length ?? -1,
        links: view ? [...view.querySelectorAll('a')].map((link) => ({ href: link.href, rel: link.rel })) : [],
        text: view?.textContent,
      };
    });
    check('markdown-rendered', security.rendered, security);
    check('markdown-no-attribute-injection', security.eventAttributes.length === 0 && security.executableNodes === 0, security);
    check('markdown-protocol-allowlist', security.links.length === 1 && security.links[0].href === 'https://example.com/a' && security.links[0].rel.includes('noopener'), security.links);
    check('markdown-raw-html-is-text', security.text?.includes('<img src=x onerror=alert(1)>'), security.text);
    check('markdown-no-page-errors', errors.length === 0, errors);

    await page.evaluate(() => {
      const block = document.createElement('div');
      block.className = 'code-block-oversize-fixture';
      const banner = document.createElement('div');
      banner.textContent = 'markdown 复制';
      const pre = document.createElement('pre');
      pre.className = 'shiki-oversize-fixture';
      pre.textContent = '# large\n' + 'x'.repeat(250_001);
      block.append(banner, pre);
      document.body.appendChild(block);
    });
    await page.waitForTimeout(400);
    const oversize = await page.evaluate(() => {
      const pre = document.querySelector('.shiki-oversize-fixture');
      return {
        state: pre?.dataset.dshcs,
        title: pre?.title,
        previewCount: document.querySelectorAll('.code-block-oversize-fixture .dshcs-md').length,
        visible: pre ? getComputedStyle(pre).display !== 'none' : false,
      };
    });
    check('markdown-oversize-falls-back-to-source', oversize.state === 'oversize' && oversize.previewCount === 0 && oversize.visible, oversize);
    await page.close();
  }

  // F3: outline may float, but it must end above the live composer.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    const trigger = page.locator('.d5Qffq_edgeTrigger');
    if (await trigger.count()) {
      await trigger.click();
      await page.waitForTimeout(300);
      const outline = await page.evaluate(() => {
        const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
        const panel = document.querySelector('.d5Qffq_panel');
        const composer = [...document.querySelectorAll('.uV2eYG_root')].filter((element) => element.getBoundingClientRect().height > 0).at(-1);
        const send = document.querySelector('.uV2eYG_primary');
        const sendRect = send.getBoundingClientRect();
        const hit = document.elementFromPoint(sendRect.x + sendRect.width / 2, sendRect.y + sendRect.height / 2);
        return {
          panel: rect(panel),
          composer: rect(composer),
          send: rect(send),
          sendHit: Boolean(hit?.closest('.uV2eYG_primary')),
          clearance: getComputedStyle(document.body).getPropertyValue('--dshcs-composer-clearance'),
        };
      });
      check('outline-clears-composer', outline.panel?.[5] <= outline.composer?.[1] - 8, outline);
      check('outline-send-hit-test', outline.sendHit, outline);
      await page.screenshot({ path: `${OUT}/outline-clearance.png` });
    } else {
      check('outline-fixture-present', false, 'missing .d5Qffq_edgeTrigger');
    }
    check('outline-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // F4: switching the skin off performs symmetric DOM/observer cleanup.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.evaluate(() => {
      const message = document.createElement('article');
      message.className = 'Sxvs8a_root dshcs-stream-fixture';
      message.setAttribute('aria-busy', 'true');
      const body = document.createElement('div');
      body.className = 'Sxvs8a_body';
      const paragraph = document.createElement('p');
      paragraph.textContent = '流式回复测试';
      body.appendChild(paragraph);
      message.appendChild(body);
      document.body.appendChild(message);
    });
    await page.waitForTimeout(250);
    const during = await page.locator('.dshcs-stream-fixture .dshcs-turn-mark').count();
    await page.locator('.dshcs-stream-fixture').evaluate((element) => element.removeAttribute('aria-busy'));
    await page.waitForTimeout(250);
    const completed = await page.evaluate(() => {
      const mark = document.querySelector('.dshcs-stream-fixture .dshcs-turn-mark');
      if (!mark) return null;
      const rect = mark.getBoundingClientRect();
      const style = getComputedStyle(mark);
      const inkProbe = document.createElement('span');
      inkProbe.style.color = 'var(--cl-ink)';
      document.body.appendChild(inkProbe);
      const ink = getComputedStyle(inkProbe).color;
      inkProbe.remove();
      return {
        width: rect.width,
        height: rect.height,
        color: style.color,
        ink,
        hidden: mark.getAttribute('aria-hidden'),
      };
    });
    check('whale-hidden-during-streaming', during === 0, during);
    check('whale-appears-on-completion-in-theme-ink', completed
      && Math.abs(completed.width - 18) < 0.1
      && Math.abs(completed.height - 13.5) < 0.1
      && completed.color === completed.ink
      && completed.hidden === 'true', completed);
    check('whale-state-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  {
    const { page, errors } = await openPage(browser, { focus: false });
    await openConversation(page);
    const before = await page.evaluate(() => ({ messages: document.querySelectorAll('.Sxvs8a_root').length, marks: document.querySelectorAll('.dshcs-turn-mark').length }));
    await page.locator('.VOzbGW_trigger').last().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Ivory 主题' }).click();
    const enabledSwitch = page.getByRole('switch', { name: '启用 Ivory 主题' });
    await enabledSwitch.click();
    await page.waitForTimeout(250);
    const off = await page.evaluate(() => ({
      bodyClass: document.body.className,
      marks: document.querySelectorAll('.dshcs-turn-mark').length,
      previews: document.querySelectorAll('.dshcs-md, .dshcs-md-toggle, .dshcs-safe-source-note').length,
      compat: document.body.dataset.dshcsCompat,
      clearance: document.body.style.getPropertyValue('--dshcs-composer-clearance'),
    }));
    check('skin-off-removes-enhancements', !off.bodyClass.includes('dsh-ivory') && off.marks === 0 && off.previews === 0 && !off.compat && off.clearance === '', { before, off });
    await enabledSwitch.click();
    await page.waitForTimeout(300);
    const on = await page.evaluate(() => ({ marks: document.querySelectorAll('.dshcs-turn-mark').length, compat: document.body.dataset.dshcsCompat }));
    check('skin-reenable-restores-enhancements', before.messages === 0 || on.marks === before.messages, { before, on });
    check('lifecycle-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // F5/F8: Better Sidebar content remains inside its pane and targets are usable.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await page.evaluate(() => {
      if (document.querySelector('.W-zNGW_editorMd table')) return;
      const pane = document.createElement('div');
      pane.className = 'W-zNGW_editorMd dshcs-workbench-table-fixture';
      pane.style.cssText = 'position:fixed;left:0;top:0;width:320px;visibility:hidden;pointer-events:none';
      pane.appendChild(document.createTextNode('<img src=x onerror=alert(1)>'));
      const table = document.createElement('table');
      const row = table.insertRow();
      for (let i = 0; i < 8; i++) row.insertCell().textContent = `very-wide-column-${i}-${'x'.repeat(40)}`;
      pane.appendChild(table);
      document.body.appendChild(pane);
    });
    await page.waitForTimeout(300);
    const workbench = await page.evaluate(() => {
      const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
      const rowData = [...document.querySelectorAll('.W-zNGW_explorerRow')].map((row) => {
        const parent = row.parentElement;
        return { row: rect(row), parent: rect(parent), boxSizing: getComputedStyle(row).boxSizing };
      });
      const targetData = [...document.querySelectorAll('.W-zNGW_tabClose, .W-zNGW_tabBarPlus, .W-zNGW_editorModeButton')]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => ({ className: element.className, rect: rect(element) }));
      const tables = [...document.querySelectorAll('.W-zNGW_editorMd table')].map((table) => ({ rect: rect(table), overflow: getComputedStyle(table).overflowX }));
      return {
        rowData,
        targetData,
        tables,
        safeNotes: document.querySelectorAll('.dshcs-workbench-table-fixture > .dshcs-safe-source-note').length,
      };
    });
    const rowsFit = workbench.rowData.every((item) => item.boxSizing === 'border-box' && item.row[2] <= item.parent[2] + 1);
    const targetsFit = workbench.targetData.every((item) => item.rect[2] >= 24 && item.rect[3] >= 24);
    check('workbench-file-rows-contained', rowsFit, workbench.rowData.slice(0, 8));
    check('workbench-targets-at-least-24', targetsFit, workbench.targetData);
    check('workbench-tables-local-scroll', workbench.tables.length > 0 && workbench.tables.every((item) => item.rect[2] <= 432 && item.overflow === 'auto'), workbench.tables);
    check('workbench-raw-html-safe-note', workbench.safeNotes === 1, workbench.safeNotes);
    check('workbench-no-page-errors', errors.length === 0, errors);
    await page.screenshot({ path: `${OUT}/workbench-contained.png` });
    await page.close();
  }

  // F6/F7 and narrow composer controls.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await openConversation(page);
    const flow = await page.evaluate(() => {
      const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
      const column = document.querySelector('.Md3f7G_column');
      const columnRect = column?.getBoundingClientRect();
      const actions = [...document.querySelectorAll('.osXY9a_actions, .p-xYUq_actions')]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => rect(element));
      const times = [...document.querySelectorAll('.p-xYUq_timeEnd')]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => rect(element));
      const rows = [...document.querySelectorAll('.YDXeBa_sessionRow')]
        .filter((element) => element.getBoundingClientRect().height > 0)
        .map((element) => rect(element));
      const composer = document.querySelector('.uV2eYG_card');
      const controls = [...document.querySelectorAll('.uV2eYG_row button')].map((element) => rect(element));
      return { column: columnRect ? rect(column) : null, actions, times, rows, composer: rect(composer), controls };
    });
    const withinColumn = (item) => !flow.column || (item[0] >= flow.column[0] - 1 && item[4] <= flow.column[4] + 1);
    const withinComposer = (item) => !flow.composer || (item[0] >= flow.composer[0] - 1 && item[4] <= flow.composer[4] + 1);
    check('message-actions-contained', flow.actions.every(withinColumn), flow);
    check('message-status-contained', flow.times.every(withinColumn), flow.times);
    check('sidebar-session-row-32', flow.rows.every((item) => item[3] === 32), flow.rows.slice(0, 8));
    check('composer-controls-contained', flow.controls.every(withinComposer), { composer: flow.composer, controls: flow.controls });
    check('flow-no-page-errors', errors.length === 0, errors);
    await page.screenshot({ path: `${OUT}/conversation-contained.png` });
    await page.close();
  }

  // F9 and both themes: plugin settings use neutral Ivory surfaces.
  for (const theme of ['浅色', '深色']) {
    const tag = theme === '浅色' ? 'light' : 'dark';
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await setTheme(page, theme);
    await page.locator('.VOzbGW_trigger').last().click();
    await page.getByRole('button', { name: '视觉工具' }).click();
    await page.waitForTimeout(150);
    const visual = await page.evaluate(() => {
      const alert = document.querySelector('.dvt-alert.notice');
      const panel = document.querySelector('.dvt-panel');
      const badge = document.querySelector('.dvt-badge');
      const read = (element) => element ? { bg: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color, border: getComputedStyle(element).borderTopColor } : null;
      return { alert: read(alert), panel: read(panel), badge: read(badge) };
    });
    check(`settings-visual-neutral-${tag}`, visual.alert && visual.alert.color !== 'rgb(42, 120, 214)' && visual.panel.border !== 'rgb(42, 120, 214)', visual);
    await page.screenshot({ path: `${OUT}/settings-visual-${tag}.png` });
    await page.getByRole('button', { name: '侧边卡片' }).click();
    await page.waitForTimeout(150);
    const sidecards = await page.evaluate(() => {
      const rect = (element) => { if (!element) return null; const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, r.right, r.bottom].map(Math.round); };
      const group = document.querySelector('.Pz1RTq_group');
      const card = document.querySelector('.Pz1RTq_cardOn');
      const gear = document.querySelector('.Pz1RTq_cardGear');
      return {
        group: group && { bg: getComputedStyle(group).backgroundColor, border: getComputedStyle(group).borderTopColor },
        card: card && { bg: getComputedStyle(card).backgroundColor, border: getComputedStyle(card).borderTopColor },
        gear: rect(gear),
      };
    });
    check(`settings-sidecards-neutral-${tag}`, Boolean(sidecards.group && sidecards.card) && (!sidecards.gear || (sidecards.gear[2] >= 24 && sidecards.gear[3] >= 24)), sidecards);
    await page.screenshot({ path: `${OUT}/settings-sidecards-${tag}.png` });
    await page.getByRole('button', { name: 'Ivory 主题' }).click();
    await page.waitForTimeout(150);
    const ivorySwitches = await page.evaluate(() => {
      const color = (value) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.appendChild(probe);
        const result = getComputedStyle(probe).color;
        probe.remove();
        return result;
      };
      const ink = color('var(--cl-ink)');
      const page = color('var(--cl-page)');
      const active = [...document.querySelectorAll('.dshcs-switch.dshcs-on')].map((track) => ({
        track: getComputedStyle(track).backgroundColor,
        knob: getComputedStyle(track.querySelector('.dshcs-knob')).backgroundColor,
      }));
      return { ink, page, active };
    });
    check(`settings-ivory-switches-use-theme-ink-${tag}`,
      ivorySwitches.active.length >= 1
      && ivorySwitches.active.every((item) => item.track === ivorySwitches.ink && item.knob === ivorySwitches.page),
      ivorySwitches);
    check(`settings-no-page-errors-${tag}`, errors.length === 0, errors);
    await page.close();
  }

  // F10: reduced-motion is opt-in; ordinary mode retains the 150ms paint cue.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    const normal = await page.evaluate(() => getComputedStyle(document.querySelector('.uV2eYG_card')).transitionDuration);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await page.evaluate(() => getComputedStyle(document.querySelector('.uV2eYG_card')).transitionDuration);
    check('motion-normal-150ms', normal.includes('0.15s'), normal);
    check('motion-reduced-near-zero', reduced.includes('1e-06s') || reduced.includes('0.001ms') || reduced === '0s', reduced);
    check('motion-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // Additional accessibility perspective: preserve a keyboard focus cue for
  // ordinary controls in forced-colors mode while keeping the normal composer
  // card free of the requested blue outer ring.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.emulateMedia({ forcedColors: 'active' });
    const button = page.locator('.hHd-Xa_newSession').first();
    await button.focus();
    const focus = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
    });
    check('forced-colors-keyboard-focus-visible', focus.style !== 'none' && focus.width !== '0px', focus);
    check('forced-colors-no-page-errors', errors.length === 0, errors);
    await page.close();
  }
} finally {
  await browser.close();
}

const summary = {
  passed: results.filter((item) => item.pass).length,
  failed: results.filter((item) => !item.pass).length,
  results,
};
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ passed: summary.passed, failed: summary.failed, report: `${OUT}/report.json` }));
if (summary.failed) process.exitCode = 1;
