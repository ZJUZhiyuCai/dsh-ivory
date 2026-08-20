// Micro-components polish pass QA. Renders DOM fixtures for the Vision
// Toolkit (dvt-*) result cards — web screenshot preview, dominant-color
// palette, paste chips, diff meter, badges/alerts — plus Ivory's own small
// controls on a blank page with the REAL stylesheets: the installed plugin's
// stylesheet is extracted from its bundle and injected AFTER Ivory's, the
// harsher order, so every check proves the higher-specificity !important
// overrides win regardless of host injection order. No live model or DSH
// instance required.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { EXE } from './qa-lib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'output/playwright/micro-components';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = null) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, detail === null ? '' : JSON.stringify(detail).slice(0, 400));
};

const DVT_CLIENTS = [
  process.env.DVT_CLIENT_JS,
  path.join(os.homedir(), '.dsh/profiles/web/node_modules/@anionex/dsh-vision-toolkit/lib/client.js'),
].filter(Boolean);
const dvtClientPath = DVT_CLIENTS.find((candidate) => fs.existsSync(candidate));
if (!dvtClientPath) {
  console.error(`Vision Toolkit bundle not found. Set DVT_CLIENT_JS to its lib/client.js. Tried: ${DVT_CLIENTS.join(', ')}`);
  process.exit(1);
}
const dvtLib = fs.readFileSync(dvtClientPath, 'utf8');
const cssMatch = /const CSS = `([\s\S]*?)`;/.exec(dvtLib);
if (!cssMatch) {
  console.error('Could not extract the Vision Toolkit stylesheet from its bundle.');
  process.exit(1);
}
const visionCss = cssMatch[1];
const ivoryCss = fs.readFileSync(path.join(root, 'src/skin.css'), 'utf8');

// A 1×1 transparent PNG keeps <img class="dvt-preview"> realistic.
const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const FIXTURE_HTML = `
<section class="dvt-tool" data-state="success" data-dshcs-fixture="tool">
  <button type="button" class="dvt-tool-head" aria-expanded="true">
    <span class="dvt-tool-icon"><svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor"/></svg></span>
    <span class="dvt-tool-title">网页截图</span>
    <span class="dvt-tool-sep">·</span>
    <span class="dvt-tool-summary">example.com/very/long/path/to/page</span>
    <span class="dvt-tool-status">完成</span>
    <span class="dvt-chevron" data-open="true">⌄</span>
  </button>
  <div class="dvt-tool-body">
    <div class="dvt-stack">
      <article class="dvt-artifact" data-dshcs-fixture="artifact">
        <img class="dvt-preview" src="${PIXEL_PNG}" alt="截图" loading="lazy">
        <div class="dvt-artifact-meta">
          <div><strong>homepage-2026-08-20-final-revision.png</strong><span>1280 × 800</span><small>240 KB</small></div>
          <div class="dvt-actions"><a class="dvt-download" href="#" download>下载</a></div>
        </div>
      </article>
      <div class="dvt-diff-score" data-dshcs-fixture="diff">
        <span>差异</span><strong>12.3400%</strong><div><i style="width:12.34%"></i></div>
      </div>
      <div class="dvt-palette" data-dshcs-fixture="palette">
        <div><i style="background:#2a78d6"></i><span><strong>#2A78D6</strong><small>32.1%</small></span></div>
        <div><i style="background:#fcfcfb"></i><span><strong>#FCFCFB</strong><small>24.5%</small></span></div>
        <div><i style="background:#52514e"></i><span><strong>#52514E</strong><small>18.0%</small></span></div>
        <div><i style="background:#b98a4a"></i><span><strong>#B98A4A</strong><small>11.2%</small></span></div>
        <div><i style="background:#4c8759"></i><span><strong>#4C8759</strong><small>8.4%</small></span></div>
        <div><i style="background:#b14543"></i><span><strong>#B14543</strong><small>5.8%</small></span></div>
      </div>
    </div>
  </div>
</section>
<div class="dvt-paste-dock" data-dshcs-fixture="paste-dock">
  <div class="dvt-paste-chip"><span class="dvt-paste-name">screenshot-homepage-2026-08-20-final-revision-very-long-name.png</span><span class="dvt-paste-detail">240 KB</span><button type="button" aria-label="移除">×</button></div>
  <div class="dvt-paste-chip" data-status="copying"><span class="dvt-paste-name">palette.png</span><span class="dvt-paste-detail">复制中…</span><button type="button" aria-label="移除" disabled>×</button></div>
  <div class="dvt-paste-chip" data-status="error"><span class="dvt-paste-name">failed-capture.png</span><span class="dvt-paste-detail">复制失败</span><button type="button" aria-label="移除">×</button></div>
</div>
<div data-dshcs-fixture="status">
  <span class="dvt-badge ok">已配置</span>
  <span class="dvt-badge warning">有更新</span>
  <span class="dvt-badge error">缺少密钥</span>
  <div class="dvt-alert warning">只读目录，修改不会被保存。</div>
  <div class="dvt-alert error">运行时不可用</div>
  <div class="dvt-alert success">已保存</div>
</div>
<div data-dshcs-fixture="ivory-controls">
  <button type="button" class="dshcs-md-toggle">源码</button>
  <button type="button" class="dshcs-copy-button"><svg viewBox="0 0 24 24"></svg></button>
</div>
`;

async function measure(page) {
  return page.evaluate(() => {
    const px = (el, prop) => Number.parseFloat(getComputedStyle(el)[prop]) || 0;
    const rgb = (color) => {
      const m = /rgba?\(([^)]+)\)/.exec(color);
      if (!m) return null;
      const parts = m[1].split(',').map((v) => Number.parseFloat(v));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
    };
    const tool = document.querySelector('[data-dshcs-fixture="tool"]');
    const icon = tool?.querySelector('.dvt-tool-icon');
    const head = tool?.querySelector('.dvt-tool-head');
    const artifact = document.querySelector('[data-dshcs-fixture="artifact"]');
    const preview = artifact?.querySelector('.dvt-preview');
    const metaStrong = artifact?.querySelector('.dvt-artifact-meta strong');
    const metaSmall = artifact?.querySelector('.dvt-artifact-meta small');
    const download = artifact?.querySelector('.dvt-download');
    const palette = document.querySelector('[data-dshcs-fixture="palette"]');
    const swatches = palette ? [...palette.querySelectorAll('i')] : [];
    const swatchSizes = swatches.map((i) => [px(i, 'width'), px(i, 'height')]);
    const diffFill = document.querySelector('[data-dshcs-fixture="diff"] i');
    const diffTrack = document.querySelector('[data-dshcs-fixture="diff"] > div');
    // Chromium serializes computed gradients as rgb() — derive HSL saturation
    // per stop to prove the meter's warm ramp stays desaturated.
    const saturations = [...String(getComputedStyle(diffFill).backgroundImage).matchAll(/rgba?\(([^)]+)\)/g)]
      .map((m) => m[1].split(',').slice(0, 3).map(Number))
      .map(([r, g, b]) => {
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        if (max === min) return 0;
        const l = (max + min) / 2;
        const d = max - min;
        return Math.round((d / (1 - Math.abs(2 * l - 1))) * 100);
      });
    const chips = [...document.querySelectorAll('.dvt-paste-chip')];
    const chip = chips[0];
    const errorChip = chips.find((c) => c.dataset.status === 'error');
    const pasteName = chip?.querySelector('.dvt-paste-name');
    const dock = document.querySelector('[data-dshcs-fixture="paste-dock"]');
    const badge = document.querySelector('.dvt-badge');
    const alertWarning = document.querySelector('.dvt-alert.warning');
    const copyButton = document.querySelector('.dshcs-copy-button');
    return {
      clPage: getComputedStyle(document.body).getPropertyValue('--cl-page').trim(),
      surface0: getComputedStyle(document.body).getPropertyValue('--cl-surface-0').trim(),
      tool: tool ? {
        radius: getComputedStyle(tool).borderRadius,
        borderWidth: getComputedStyle(tool).borderTopWidth,
        shadow: getComputedStyle(tool).boxShadow,
        font: getComputedStyle(tool).font.slice(0, 44),
        background: getComputedStyle(tool).backgroundColor,
      } : null,
      head: head ? { minHeight: getComputedStyle(head).minHeight } : null,
      icon: icon ? {
        background: getComputedStyle(icon).backgroundColor,
        color: rgb(getComputedStyle(icon).color),
        size: [px(icon, 'width'), px(icon, 'height')],
      } : null,
      artifact: artifact ? {
        radius: getComputedStyle(artifact).borderRadius,
        borderWidth: getComputedStyle(artifact).borderTopWidth,
        background: getComputedStyle(artifact).backgroundColor,
      } : null,
      preview: preview ? {
        image: getComputedStyle(preview).backgroundImage.slice(0, 60),
        size: getComputedStyle(preview).backgroundSize,
      } : null,
      metaStrong: metaStrong ? { font: getComputedStyle(metaStrong).font.slice(0, 30), color: rgb(getComputedStyle(metaStrong).color) } : null,
      metaSmall: metaSmall ? { color: rgb(getComputedStyle(metaSmall).color) } : null,
      download: download ? {
        height: px(download, 'height'),
        radius: getComputedStyle(download).borderRadius,
        background: rgb(getComputedStyle(download).backgroundColor),
        borderWidth: getComputedStyle(download).borderTopWidth,
      } : null,
      palette: palette ? {
        swatchSizes,
        hexFont: getComputedStyle(palette.querySelector('strong')).fontFamily.slice(0, 30),
        overflows: palette.scrollWidth > palette.clientWidth + 1,
      } : null,
      diff: {
        saturations,
        trackBackground: getComputedStyle(diffTrack).backgroundColor,
      },
      chip: chip ? {
        height: px(chip, 'height'),
        radius: getComputedStyle(chip).borderRadius,
        borderWidth: getComputedStyle(chip).borderTopWidth,
      } : null,
      errorChip: errorChip ? { border: rgb(getComputedStyle(errorChip).borderTopColor) } : null,
      pasteName: pasteName ? { ellipsis: getComputedStyle(pasteName).textOverflow } : null,
      dockOverflows: dock ? dock.scrollWidth > dock.clientWidth + 1 : null,
      badgeRadius: badge ? getComputedStyle(badge).borderRadius : null,
      alertWarning: alertWarning ? {
        bgAlpha: rgb(getComputedStyle(alertWarning).backgroundColor)?.a ?? 1,
        color: rgb(getComputedStyle(alertWarning).color),
      } : null,
      copyButtonRadius: copyButton ? getComputedStyle(copyButton).borderRadius : null,
    };
  });
}

const browser = await chromium.launch({ headless: true, executablePath: EXE });
try {
  for (const [label, dark] of [['light', false], ['dark', true]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('about:blank');
    await page.evaluate(() => {
      document.title = 'dsh-ivory micro components';
      document.body.classList.add('dsh-ivory');
    });
    if (dark) await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', '1'));
    // Harsh order: Ivory's stylesheet first, the plugin's own second — the
    // overrides must still win via specificity + !important.
    await page.addStyleTag({ content: ivoryCss });
    await page.addStyleTag({ content: visionCss });
    const host = await page.evaluate((html) => {
      const wrap = document.createElement('div');
      wrap.id = 'dshcs-micro-fixture';
      wrap.style.cssText = 'width:640px;padding:16px';
      wrap.innerHTML = html;
      document.body.appendChild(wrap);
      return wrap;
    }, FIXTURE_HTML);
    await page.waitForTimeout(120);
    const m = await measure(page);

    // Chromium rounds the used value of a 0.5px border to 1px at dpr 1, so
    // hairlines are asserted as "≤ 1px" rather than exact subpixel strings.
    const hairline = (width) => Number.parseFloat(width ?? '9') <= 1;
    check(`${label}-tool-card-ivory-language`,
      m.tool?.radius === '8px' && hairline(m.tool?.borderWidth)
        && m.tool?.shadow === 'none' && /13px/.test(m.tool?.font)
        && m.tool?.background === 'rgba(0, 0, 0, 0)', m.tool);
    check(`${label}-tool-head-compact`,
      Number.parseInt(m.head?.minHeight ?? '99', 10) <= 30, m.head);
    check(`${label}-tool-icon-neutral-no-blue-tile`,
      m.icon?.background === 'rgba(0, 0, 0, 0)'
        && m.icon.color && m.icon.color.b < m.icon.color.r + 30
        && m.icon.size[0] === 18, m.icon);
    check(`${label}-artifact-neutral-media-well`,
      m.artifact?.radius === '8px' && hairline(m.artifact?.borderWidth)
        && m.artifact?.background !== 'rgba(0, 0, 0, 0)', m.artifact);
    check(`${label}-preview-checkerboard-quiet`,
      m.preview?.image.includes('conic') && m.preview?.size === '12px 12px', m.preview);
    check(`${label}-artifact-meta-hierarchy`,
      m.metaStrong?.color && m.metaSmall?.color
        && m.metaStrong.color.r !== m.metaSmall.color.r
        && /12px/.test(m.metaStrong?.font ?? ''), { strong: m.metaStrong, small: m.metaSmall });
    check(`${label}-download-ivory-small-button`,
      m.download?.height === 26 && m.download?.radius === '7px'
        && m.download?.background?.a === 0 && hairline(m.download?.borderWidth), m.download);
    check(`${label}-download-matches-ivory-controls`,
      m.download?.radius === m.copyButtonRadius, { download: m.download?.radius, copy: m.copyButtonRadius });
    check(`${label}-palette-swatch-stable-no-overflow`,
      m.palette?.swatchSizes.length === 6
        && m.palette.swatchSizes.every(([w, h]) => w === 26 && h === 26)
        && m.palette.overflows === false
        && /mono/i.test(m.palette.hexFont), m.palette);
    check(`${label}-diff-meter-desaturated`,
      m.diff.saturations.length >= 2 && m.diff.saturations.every((s) => s <= 40), m.diff);
    check(`${label}-paste-chip-composer-quiet`,
      m.chip?.height === 28 && m.chip?.radius === '8px' && hairline(m.chip?.borderWidth)
        && m.pasteName?.ellipsis === 'ellipsis' && m.dockOverflows === false,
      { chip: m.chip, name: m.pasteName, dockOverflows: m.dockOverflows });
    check(`${label}-paste-chip-error-warm-not-loud`,
      m.errorChip?.border && m.errorChip.border.r > m.errorChip.border.b, m.errorChip);
    check(`${label}-badge-cornered-tag`,
      m.badgeRadius === '6px', m.badgeRadius);
    check(`${label}-alert-warning-desaturated`,
      m.alertWarning && m.alertWarning.bgAlpha <= 0.2
        && m.alertWarning.color && m.alertWarning.color.r > m.alertWarning.color.b, m.alertWarning);

    await page.screenshot({ path: `${OUT}/${label}-micro-components.png` });
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass).length;
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 1));
console.log(JSON.stringify({ passed: results.length - failed, failed }));
if (failed) process.exitCode = 1;
