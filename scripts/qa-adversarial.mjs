// Adversarial stress suite: host-reconciliation safety, preview staleness,
// streaming guards, toggle storms, resize storms, degraded-mode cost, and
// corrupted storage. Requires a running DSH instance at http://127.0.0.1:3080.
import fs from 'node:fs';
import { launch, openPage, expandSidebar, BASE } from './qa-lib.mjs';

const OUT = 'output/playwright/adversarial-20260818';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = null) => {
  const item = { name, pass: Boolean(pass), detail };
  results.push(item);
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${name}`, detail === null ? '' : JSON.stringify(detail).slice(0, 500));
};

async function openConversation(page) {
  await expandSidebar(page).catch(() => {});
  const rows = page.locator('.YDXeBa_sessionRow');
  const count = await rows.count();
  for (let index = 0; index < count; index++) {
    const label = (await rows.nth(index).innerText()).trim();
    if (/^(?:新会话|New chat)(?:\s|$)/i.test(label)) continue;
    await rows.nth(index).click();
    await page.waitForTimeout(1200);
    if (await page.locator('.Sxvs8a_body').count()) return true;
    await expandSidebar(page).catch(() => {});
  }
  return false;
}

async function addMarkdownFixture(page, className, source, options = {}) {
  await page.evaluate(([fixtureClass, fixtureSource, busy]) => {
    if (document.querySelector(`.${fixtureClass}`)) return;
    const message = document.createElement('article');
    message.className = `Sxvs8a_root ${fixtureClass}`;
    if (busy) message.setAttribute('aria-busy', 'true');
    const body = document.createElement('div');
    body.className = 'Sxvs8a_body';
    const paragraph = document.createElement('p');
    paragraph.className = `${fixtureClass}-prose`;
    paragraph.textContent = '正文段落。';
    const block = document.createElement('div');
    block.className = `code-block-${fixtureClass}`;
    const banner = document.createElement('div');
    banner.textContent = 'markdown 复制';
    const seat = document.createElement('div');
    const pre = document.createElement('pre');
    pre.className = `shiki-${fixtureClass}`;
    pre.textContent = fixtureSource;
    seat.appendChild(pre);
    block.append(banner, seat);
    body.append(paragraph, block);
    message.appendChild(body);
    message.style.cssText = 'position:fixed;left:16px;top:16px;width:460px;z-index:99998;background:var(--cl-page)';
    document.body.appendChild(message);
  }, [className, source, options.busy === true]);
}

const browser = await launch();
try {
  // A1: host reconciliation safety. The plugin must never reparent host nodes:
  // simulate React's commit operations (insertBefore/removeChild/replaceChildren)
  // against the enhanced code block and require zero exceptions.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.evaluate(() => {
      const block = document.createElement('div');
      block.className = 'code-block-react-host-fixture';
      const seat = document.createElement('div');
      const pre = document.createElement('pre');
      pre.className = 'shiki-react-host-fixture';
      pre.textContent = 'const host = true;\n';
      seat.appendChild(pre);
      block.appendChild(seat);
      block.style.cssText = 'position:fixed;left:16px;top:16px;z-index:99997';
      document.body.appendChild(block);
    });
    await page.waitForTimeout(350);
    const outcome = await page.evaluate(() => {
      const seat = document.querySelector('.code-block-react-host-fixture div');
      const pre = seat.querySelector('pre');
      const report = { parentStable: pre.parentElement === seat, steps: [] };
      const step = (name, fn) => {
        try { fn(); report.steps.push(`${name}:ok`); }
        catch (error) { report.steps.push(`${name}:${error.name}`); }
      };
      // React inserts a new sibling before the managed pre.
      step('insertBefore', () => {
        const sibling = document.createElement('div');
        sibling.className = 'react-inserted';
        seat.insertBefore(sibling, pre);
      });
      // React unmounts the code block node.
      step('removeChild', () => seat.removeChild(pre));
      // React replaces the entire child list.
      step('replaceChildren', () => seat.replaceChildren(document.createTextNode('fresh')));
      return report;
    });
    check('react-host-operations-never-throw',
      outcome.parentStable && outcome.steps.every((step) => step.endsWith(':ok')), outcome);
    check('react-host-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A2: markdown preview staleness. In-place edits rebuild the preview; a
  // replaced <pre> re-enhances instead of leaving a double view.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await addMarkdownFixture(page, 'md-stale-fixture', '# 标题甲\n\n第一段内容。');
    await page.waitForTimeout(350);
    const initial = await page.evaluate(() => ({
      views: document.querySelectorAll('.md-stale-fixture .dshcs-md').length,
      text: document.querySelector('.md-stale-fixture .dshcs-md')?.textContent,
    }));
    await page.evaluate(() => {
      document.querySelector('.shiki-md-stale-fixture').textContent = '# 标题乙\n\n更新后的内容。';
    });
    await page.waitForTimeout(400);
    const updated = await page.evaluate(() => ({
      views: document.querySelectorAll('.md-stale-fixture .dshcs-md').length,
      toggles: document.querySelectorAll('.md-stale-fixture .dshcs-md-toggle').length,
      text: document.querySelector('.md-stale-fixture .dshcs-md')?.textContent,
    }));
    await page.evaluate(() => {
      const seat = document.querySelector('.shiki-md-stale-fixture').parentElement;
      const fresh = document.createElement('pre');
      fresh.className = 'shiki-md-stale-fixture';
      fresh.textContent = '# 标题丙\n\n替换后的内容。';
      seat.replaceChild(fresh, seat.querySelector('pre'));
    });
    await page.waitForTimeout(400);
    const replaced = await page.evaluate(() => ({
      views: document.querySelectorAll('.md-stale-fixture .dshcs-md').length,
      toggles: document.querySelectorAll('.md-stale-fixture .dshcs-md-toggle').length,
      text: document.querySelector('.md-stale-fixture .dshcs-md')?.textContent,
    }));
    check('md-preview-builds-once', initial.views === 1 && initial.text?.includes('标题甲'), initial);
    check('md-preview-rebuilds-on-in-place-edit',
      updated.views === 1 && updated.toggles === 1 && updated.text?.includes('更新后的内容') && !updated.text?.includes('标题甲'), updated);
    check('md-preview-reenhances-after-node-swap',
      replaced.views === 1 && replaced.toggles === 1 && replaced.text?.includes('替换后的内容'), replaced);
    check('md-stale-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A3: streaming guard for the markdown preview.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await addMarkdownFixture(page, 'md-stream-fixture', '# 流式中\n\n不完整……', { busy: true });
    await page.waitForTimeout(350);
    const during = await page.evaluate(() => document.querySelectorAll('.md-stream-fixture .dshcs-md').length);
    await page.locator('.md-stream-fixture').evaluate((element) => element.removeAttribute('aria-busy'));
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({
      views: document.querySelectorAll('.md-stream-fixture .dshcs-md').length,
      text: document.querySelector('.md-stream-fixture .dshcs-md')?.textContent,
    }));
    check('md-preview-deferred-during-streaming', during === 0, during);
    check('md-preview-appears-after-streaming', after.views === 1 && after.text?.includes('不完整'), after);
    check('md-stream-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A4: whale turn mark never lands inside the plugin's own preview.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await addMarkdownFixture(page, 'md-whale-fixture', '# 结尾\n\n- 最后一项');
    await page.waitForTimeout(400);
    const placement = await page.evaluate(() => {
      const marks = [...document.querySelectorAll('.md-whale-fixture .dshcs-turn-mark')];
      return {
        total: marks.length,
        insidePreview: marks.filter((mark) => mark.closest('.dshcs-md')).length,
        insideProse: marks.filter((mark) => mark.closest('.md-whale-fixture-prose')).length,
      };
    });
    check('whale-stays-outside-md-preview',
      placement.total === 1 && placement.insidePreview === 0 && placement.insideProse === 1, placement);
    check('whale-md-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A5: copy controls inside the plugin preview keep exact whitespace payloads.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.evaluate(() => {
      window.__dshcsCopied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => { window.__dshcsCopied.push(value); } },
      });
    });
    await addMarkdownFixture(page, 'md-copy-fixture', '# 文档\n\n```js\nconst a = 1;\n  return a;\n```');
    await page.waitForTimeout(400);
    await page.locator('.md-copy-fixture .dshcs-md .dshcs-copy-code').click();
    await page.waitForFunction(() => window.__dshcsCopied.length === 1);
    const payload = await page.evaluate(() => window.__dshcsCopied[0]);
    check('preview-code-copy-exact', payload === 'const a = 1;\n  return a;', JSON.stringify(payload));
    check('preview-copy-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A6: skin toggle storm — 12 flips with zero errors and full restoration.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    const hasConversation = await openConversation(page);
    const before = await page.evaluate(() => ({
      marks: document.querySelectorAll('.dshcs-turn-mark').length,
      copyControls: document.querySelectorAll('.dshcs-copy-button').length,
    }));
    await page.locator('.VOzbGW_trigger').last().click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Ivory 主题', exact: true }).click();
    const enabledSwitch = page.getByRole('switch', { name: '启用 Ivory 主题', exact: true });
    for (let round = 0; round < 12; round++) {
      await enabledSwitch.click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    const on = await page.evaluate(() => ({
      enabled: document.body.classList.contains('dsh-ivory'),
      marks: document.querySelectorAll('.dshcs-turn-mark').length,
      copyControls: document.querySelectorAll('.dshcs-copy-button').length,
      clearance: document.body.style.getPropertyValue('--dshcs-composer-clearance'),
    }));
    const restored = !hasConversation || (on.marks === before.marks && on.copyControls === before.copyControls);
    check('toggle-storm-ends-enabled-and-restored', on.enabled && restored && on.clearance !== '', { before, on, hasConversation });
    check('toggle-storm-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A7: resize storm — drag-like viewport churn must not throw and the outline
  // clearance must settle at a sane value.
  {
    const { page, errors } = await openPage(browser, { w: 1440, h: 900, focus: false });
    for (let index = 0; index < 24; index++) {
      await page.setViewportSize({ width: 1000 + (index % 6) * 80, height: 700 + (index % 4) * 50 });
    }
    await page.waitForTimeout(300);
    const settled = await page.evaluate(() => ({
      clearance: getComputedStyle(document.body).getPropertyValue('--dshcs-composer-clearance').trim(),
      viewport: [innerWidth, innerHeight],
      composerTop: document.querySelector('.uV2eYG_root')?.getBoundingClientRect().top,
    }));
    const clearancePx = Number.parseInt(settled.clearance, 10);
    const expected = Math.max(144, Math.ceil(settled.viewport[1] - (settled.composerTop ?? 0) + 12));
    const sane = Number.isFinite(clearancePx) && clearancePx >= 144 && Math.abs(clearancePx - expected) <= 2;
    check('resize-storm-clearance-settles', sane, settled);
    check('resize-storm-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A8: degraded (token-only) mode must not scan the whole document on every
  // mutation batch while the host contract is absent. The contract frame is
  // really removed so re-probes fail; only the throttled probe may fire.
  {
    const { page, errors } = await openPage(browser, { focus: false });
    await page.evaluate(() => {
      document.querySelector('.pI_x6G_frame')?.remove();
      document.querySelector('.pI_x6G_centerCol')?.remove();
      document.body.dataset.dshcsCompat = 'token-only';
      document.body.classList.add('dshcs-contract-mismatch');
    });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(async () => {
      let calls = 0;
      const original = document.querySelector.bind(document);
      document.querySelector = (selector) => { calls += 1; return original(selector); };
      const hot = document.createElement('div');
      document.body.appendChild(hot);
      let ticks = 0;
      // Spaced appends produce many separate mutation batches.
      for (let round = 0; round < 30; round++) {
        const node = document.createElement('span');
        node.textContent = `burst-${ticks++}`;
        hot.appendChild(node);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      document.querySelector = original;
      hot.remove();
      return { calls, ticks };
    });
    check('token-only-mode-no-scan-storm', probe.ticks === 30 && probe.calls <= 6, probe);
    check('token-only-no-page-errors', errors.length === 0, errors);
    await page.close();
  }

  // A9: corrupted localStorage flags and a read-only Storage API must not
  // break the plugin; defaults apply and the settings UI keeps working.
  {
    const hostile = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const hostileErrors = [];
    hostile.on('pageerror', (error) => hostileErrors.push(String(error).slice(0, 200)));
    await hostile.addInitScript(() => {
      localStorage.setItem('dsh-ivory.enabled', '\u0000garbage{');
      localStorage.setItem('dsh-ivory.focus', '{"not":"a-flag"}');
    });
    await hostile.goto(BASE, { waitUntil: 'domcontentloaded' });
    await hostile.waitForTimeout(4500);
    const corrupted = await hostile.evaluate(() => ({
      enabled: document.body.classList.contains('dsh-ivory'),
      focus: document.body.classList.contains('dsh-ivory-focus'),
    }));
    check('corrupted-flags-fall-back-to-defaults', corrupted.enabled && !corrupted.focus, corrupted);
    check('corrupted-flags-no-page-errors', hostileErrors.length === 0, hostileErrors);
    await hostile.close();

    // Quota-style failure: reads work, every write throws.
    const blocked = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const blockedErrors = [];
    blocked.on('pageerror', (error) => blockedErrors.push(String(error).slice(0, 200)));
    await blocked.addInitScript(() => {
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function patchedSetItem(key, value) {
        if (key.startsWith('dsh-ivory.')) throw new Error('quota exceeded fixture');
        return originalSet.call(this, key, value);
      };
    });
    await blocked.goto(BASE, { waitUntil: 'domcontentloaded' });
    await blocked.waitForTimeout(4500);
    const blockedState = await blocked.evaluate(() => ({
      enabled: document.body.classList.contains('dsh-ivory'),
      focus: document.body.classList.contains('dsh-ivory-focus'),
    }));
    check('blocked-storage-still-themes', blockedState.enabled && !blockedState.focus, blockedState);
    check('blocked-storage-no-page-errors', blockedErrors.length === 0, blockedErrors);
    await blocked.close();
  }

  // A10: soak — 8 seconds of continuous mutations with the skin on must keep
  // the main thread responsive (no runaway observer work).
  {
    const { page, errors } = await openPage(browser, { focus: false });
    const soak = await page.evaluate(async () => {
      const hot = document.createElement('div');
      hot.className = 'Sxvs8a_root soak-fixture';
      const body = document.createElement('div');
      body.className = 'Sxvs8a_body';
      const paragraph = document.createElement('p');
      body.appendChild(paragraph);
      hot.appendChild(body);
      document.body.appendChild(hot);
      let longFrames = 0;
      let last = performance.now();
      let stop = false;
      const watch = (now) => {
        if (now - last > 120) longFrames += 1;
        last = now;
        if (!stop) requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
      const start = performance.now();
      let ticks = 0;
      while (performance.now() - start < 8_000) {
        paragraph.textContent = `tick ${ticks++} ${'x'.repeat(80)}`;
        const node = document.createElement('span');
        node.textContent = String(ticks);
        body.appendChild(node);
        if (body.childNodes.length > 40) body.lastChild.remove();
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      stop = true;
      hot.remove();
      return { ticks, longFrames };
    });
    check('soak-no-long-frame-storm', soak.ticks > 100 && soak.longFrames <= 4, soak);
    check('soak-no-page-errors', errors.length === 0, errors);
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
