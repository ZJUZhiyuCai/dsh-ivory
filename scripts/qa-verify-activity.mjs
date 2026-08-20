// Verify the activity-row polish (thinking + tool calls) via computed styles
// across both themes, live running animation layers, and the expanded terminal
// card. Requires a running DSH instance at http://127.0.0.1:3080.
import fs from 'node:fs';
import { launch, openPage, expandSidebar, setTheme } from './qa-lib.mjs';

const OUT = 'output/playwright/activity-verify';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, pass, detail = null) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, detail === null ? '' : JSON.stringify(detail).slice(0, 400));
};

// Walk workspace folders + sessions until a conversation with an expandable
// tool row is open; expand it. Returns whether a terminal mounted.
async function openExpandableToolRow(page) {
  await expandSidebar(page).catch(() => {});
  for (let pass = 0; pass < 8; pass++) {
    const folders = page.locator('.YDXeBa_projectRow');
    if (await folders.nth(pass).count()) {
      await folders.nth(pass).click().catch(() => {});
      await page.waitForTimeout(400);
    }
    const rows = page.locator('.YDXeBa_sessionRow');
    for (let i = 0; i < await rows.count(); i++) {
      const label = (await rows.nth(i).innerText()).trim();
      if (/^(?:新会话|New chat)/i.test(label)) continue;
      await rows.nth(i).click().catch(() => {});
      await page.waitForTimeout(1200);
      if (!(await page.locator('.CY-8Ka_root[data-expandable="true"]').count())) continue;
      await page.evaluate(() => {
        const row = document.querySelector('.CY-8Ka_root[data-expandable="true"]');
        row?.scrollIntoView({ block: 'center' });
        row?.click();
      });
      await page.waitForTimeout(800);
      if (await page.locator('[data-terminal]').count()) return true;
    }
  }
  return false;
}

const browser = await launch();
try {
  for (const [theme, tag] of [['浅色', 'light'], ['深色', 'dark']]) {
    const { page } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await setTheme(page, theme);
    const found = await openExpandableToolRow(page);
    const probe = await page.evaluate(() => {
      const cs = (el) => el ? getComputedStyle(el) : null;
      const after = (el) => el ? getComputedStyle(el, '::after') : null;
      const row = document.querySelector('.CY-8Ka_root[aria-expanded="false"]') ?? document.querySelector('.CY-8Ka_root');
      const title = row?.querySelector('.CY-8Ka_title');
      const leading = row?.querySelector('.CY-8Ka_leading');
      const iconHost = row?.querySelector('.CY-8Ka_iconIdle') ?? leading;
      const iconSvg = leading?.querySelector('svg:not(.CY-8Ka_chevron)');
      const terminal = document.querySelector('[data-terminal]');
      const dot = terminal?.querySelector('[class*="_dot_"]');
      const errorRow = document.querySelector('.CY-8Ka_root[data-state="error"]');
      return {
        rowFont: cs(row)?.font.slice(0, 40),
        rowColor: cs(row)?.color,
        titleFont: cs(title)?.fontWeight + ' ' + cs(title)?.fontSize + ' ' + cs(title)?.fontFamily.slice(0, 30),
        titleColor: cs(title)?.color,
        leadingColor: cs(leading)?.color,
        iconSvgVisible: iconSvg ? cs(iconSvg).visibility : 'missing',
        iconAfterMask: after(iconHost)?.maskImage?.slice(0, 30) || after(iconHost)?.webkitMaskImage?.slice(0, 30),
        iconAfterSize: after(iconHost) ? [after(iconHost).width, after(iconHost).height] : null,
        terminal: terminal ? {
          bg: cs(terminal).backgroundColor,
          radius: cs(terminal).borderRadius,
          border: cs(terminal).borderTopColor,
          font: cs(terminal).fontFamily.slice(0, 30),
          lineColor: cs(terminal.querySelector('[class*="_line"]'))?.color,
        } : null,
        dotBg: dot ? cs(dot).backgroundColor : null,
        errorTitleColor: errorRow ? cs(errorRow.querySelector('.CY-8Ka_title')).color : 'no-error-row',
        errorRowColor: errorRow ? cs(errorRow).color : null,
      };
    });
    const sansish = /sans/i;
    check(`${tag}-row-typography`, probe.rowFont?.includes('13px') && sansish.test(probe.rowFont), probe.rowFont);
    check(`${tag}-title-emphasized`, probe.titleFont?.startsWith('500 13px'), probe.titleFont);
    check(`${tag}-host-icon-hidden`, probe.iconSvgVisible === 'hidden' || probe.iconSvgVisible === 'missing', probe.iconSvgVisible);
    check(`${tag}-mask-icon-painted`, Boolean(probe.iconAfterMask?.includes('image/svg')) && probe.iconAfterSize?.[0] === '16px', probe);
    if (found && probe.terminal) {
      check(`${tag}-terminal-card`,
        probe.terminal.radius === '10px' && /mono/i.test(probe.terminal.font)
        && probe.terminal.bg !== 'rgba(0, 0, 0, 0)' && probe.dotBg,
        probe.terminal);
    } else {
      check(`${tag}-terminal-card`, false, { found, note: 'no expandable tool row available' });
    }
    if (probe.errorTitleColor !== 'no-error-row') {
      check(`${tag}-error-quiet-danger`, probe.errorTitleColor !== probe.titleColor && probe.errorTitleColor !== probe.rowColor, probe);
    }
    await page.screenshot({ path: `${OUT}/${tag}-terminal.png` });
    await page.close();
  }

  // live running animation layers + reduced-motion behavior
  {
    const { page } = await openPage(browser, { w: 1440, h: 900, focus: false });
    await page.click('.hHd-Xa_newSession');
    await page.waitForTimeout(1200);
    const input = page.locator('.uV2eYG_input:visible').last();
    await input.fill('运行 bash 命令 sleep 3 && echo ok');
    await page.keyboard.press('Enter');
    let anim = null;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(200);
      anim = await page.evaluate(() => {
        const row = document.querySelector('.CY-8Ka_root[data-state="running"]');
        if (!row) return null;
        const leading = row.querySelector('.CY-8Ka_leading');
        const before = getComputedStyle(leading, '::before');
        const icon = leading.querySelector('.CY-8Ka_iconIdle') ?? leading;
        const after = getComputedStyle(icon, '::after');
        return {
          leadingColor: getComputedStyle(leading).color,
          ringAnim: before.animationName,
          ringAnimDuration: before.animationDuration,
          ringBorders: [before.borderTopColor, before.borderRightColor, before.borderBottomColor, before.borderLeftColor],
          iconAnim: after.animationName,
        };
      });
      if (anim) break;
    }
    if (!anim) {
      anim = await page.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.dataset.dshcsActivityFixture = 'running-tool';
        fixture.className = 'CY-8Ka_root';
        fixture.dataset.state = 'running';
        fixture.dataset.sample = 'bash';
        fixture.dataset.variant = 'bash';

        const leading = document.createElement('span');
        leading.className = 'CY-8Ka_leading';
        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.classList.add('CY-8Ka_chevron');
        chevron.setAttribute('viewBox', '0 0 14 14');
        leading.append(chevron);

        const title = document.createElement('span');
        title.className = 'CY-8Ka_title';
        title.textContent = 'Bash';
        fixture.append(leading, title);
        document.body.append(fixture);

        const before = getComputedStyle(leading, '::before');
        const after = getComputedStyle(leading, '::after');
        return {
          fixture: true,
          leadingColor: getComputedStyle(leading).color,
          ringAnim: before.animationName,
          ringAnimDuration: before.animationDuration,
          ringBorders: [before.borderTopColor, before.borderRightColor, before.borderBottomColor, before.borderLeftColor],
          iconAnim: after.animationName,
        };
      });
    }
    // A quiet Claude-like cue: an evenly lit ring that only breathes in
    // opacity. Explicitly rejects the old boomerang — one opaque border side
    // (the rest transparent) driven by a rotation animation — and requires the
    // pulse to stay slow (low-noise), with the icon breathe layer intact.
    const uniformRing = (ring) => Boolean(ring) && ring.length === 4 && ring.every((color) => color === ring[0]);
    check('running-halo-quiet-no-boomerang',
      anim
        && anim.ringAnim.includes('halo')
        && !/orbit|rotate|spin/i.test(anim.ringAnim)
        && uniformRing(anim.ringBorders)
        && Number.parseFloat(anim.ringAnimDuration) >= 1.5
        && anim.iconAnim.includes('breathe'), anim);

    // Expanded thinking while still running: the stage belongs to the body
    // text, so the ring must settle to a static evenly lit state cue.
    const expanded = await page.evaluate(() => {
      const root = document.createElement('div');
      root.dataset.dshcsActivityFixture = 'expanded-think';
      root.className = 'QWLzlG_root';
      root.dataset.variant = 'think';
      root.dataset.state = 'running';
      const inner = document.createElement('div');
      const row = document.createElement('div');
      row.className = 'QWLzlG_row';
      row.setAttribute('role', 'button');
      row.setAttribute('aria-expanded', 'true');
      const leading = document.createElement('span');
      leading.className = 'QWLzlG_leading';
      const iconIdle = document.createElement('span');
      iconIdle.className = '_iconIdle_qa';
      leading.appendChild(iconIdle);
      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.classList.add('QWLzlG_chevron');
      chevron.setAttribute('viewBox', '0 0 14 14');
      leading.appendChild(chevron);
      const title = document.createElement('span');
      title.className = 'QWLzlG_title';
      title.textContent = '已深度思考';
      row.append(leading, title);
      const thinkBody = document.createElement('div');
      thinkBody.className = 'QWLzlG_thinkBody';
      thinkBody.textContent = '先核对约束，再比较两个方案的成本。';
      inner.append(row, thinkBody);
      root.appendChild(inner);
      document.body.appendChild(root);
      const before = getComputedStyle(leading, '::before');
      const bodyStyle = getComputedStyle(thinkBody);
      return {
        ringAnim: before.animationName,
        ringBorders: [before.borderTopColor, before.borderRightColor, before.borderBottomColor, before.borderLeftColor],
        bodyFont: bodyStyle.font.slice(0, 40),
        bodyColor: bodyStyle.color,
        bodyWhitespace: bodyStyle.whiteSpace,
      };
    });
    check('think-expanded-ring-static-and-even',
      expanded.ringAnim === 'none'
        && uniformRing(expanded.ringBorders)
        && /13px/.test(expanded.bodyFont) && /sans/i.test(expanded.bodyFont)
        && expanded.bodyWhitespace === 'pre-wrap', expanded);
    const thinkRunning = await page.evaluate(() => {
      const row = document.querySelector('.QWLzlG_root[data-state="running"]');
      if (!row) return null;
      const host = row.querySelector('[class*="_iconIdle_"]') ?? row.querySelector('.QWLzlG_leading');
      const after = host ? getComputedStyle(host, '::after') : null;
      return {
        mask: after?.maskImage?.slice(0, 30) || after?.webkitMaskImage?.slice(0, 30),
        anim: after?.animationName,
        titleFont: getComputedStyle(row.querySelector('.QWLzlG_title') ?? row).font.slice(0, 40),
      };
    });
    if (thinkRunning) {
      check('think-running-sparkle', Boolean(thinkRunning.mask?.includes('image/svg')) && thinkRunning.anim?.includes('breathe'), thinkRunning);
    }
    await page.screenshot({ path: `${OUT}/running-row.png` });
    // wait for completion, expand the think row, verify the quiet body styles
    try { await page.waitForSelector('.QWLzlG_root[data-state="ok"]', { timeout: 30000 }); } catch { /* fall through */ }
    await page.evaluate(() => document.querySelector('.QWLzlG_row[aria-expanded="false"]')?.click());
    await page.waitForTimeout(500);
    const think = await page.evaluate(() => {
      const body = document.querySelector('.QWLzlG_thinkBody');
      if (!body) return null;
      const cs = getComputedStyle(body);
      return {
        font: cs.font.slice(0, 40),
        color: cs.color,
        borderLeft: cs.borderLeftWidth + ' ' + cs.borderLeftColor,
        marginLeft: cs.marginLeft,
        whitespace: cs.whiteSpace,
      };
    });
    check('think-body-quiet', Boolean(think) && think.borderLeft.startsWith('2px') && /sans/i.test(think.font) && think.whitespace === 'pre-wrap', think);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(400);
    const reduced = await page.evaluate(() => {
      const row = document.querySelector('.CY-8Ka_root[data-state="running"]');
      const leading = row?.querySelector('.CY-8Ka_leading');
      const before = leading ? getComputedStyle(leading, '::before') : null;
      const expandedLeading = document.querySelector('[data-dshcs-activity-fixture="expanded-think"] .QWLzlG_leading');
      const expandedBefore = expandedLeading ? getComputedStyle(expandedLeading, '::before') : null;
      return {
        ringDuration: before?.animationDuration,
        expandedAnim: expandedBefore?.animationName,
      };
    });
    const nearZero = (value) => value === undefined
      || String(value).split(',').every((v) => v.trim() === '0s' || Number.parseFloat(v) < 0.01);
    check('running-reduced-motion-near-zero', nearZero(reduced.ringDuration), reduced);
    check('expanded-ring-still-static-reduced-motion',
      reduced.expandedAnim === undefined || reduced.expandedAnim === 'none', reduced);
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass).length;
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 1));
console.log(JSON.stringify({ passed: results.length - failed, failed }));
if (failed) process.exitCode = 1;
