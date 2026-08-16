// Shared QA helpers for adversarial review. Launches local chromium (no CDP needed).
import { chromium } from 'playwright-core';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

function findChromium() {
  const candidates = [];
  if (process.env.DSH_QA_CHROMIUM) candidates.push(process.env.DSH_QA_CHROMIUM);
  const cacheRoot = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  try {
    const installs = fs.readdirSync(cacheRoot).filter((name) => /^chromium-\d+$/.test(name)).sort().reverse();
    for (const install of installs) {
      candidates.push(path.join(cacheRoot, install, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
      candidates.push(path.join(cacheRoot, install, 'chrome-mac', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
    }
  } catch { /* Playwright cache is optional; use installed browsers below. */ }
  candidates.push(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  );
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export const EXE = findChromium();
export const BASE = 'http://127.0.0.1:3080';

export async function launch() {
  if (!EXE) throw new Error('No Chromium executable found. Set DSH_QA_CHROMIUM to an absolute browser path.');
  return chromium.launch({ headless: true, executablePath: EXE });
}

export async function openPage(browser, { w = 1440, h = 900, enabled = true, focus = false } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.addInitScript(([base, en, fo]) => {
    localStorage.setItem('dsh-ivory.enabled', en ? '1' : '0');
    localStorage.setItem('dsh-ivory.focus', fo ? '1' : '0');
  }, [BASE, enabled, focus]);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  return { page, errors };
}

// expand sidebar if collapsed; returns whether it was collapsed
export async function expandSidebar(page) {
  const btn = page.locator('.hHd-Xa_toggle[aria-label="打开侧边栏"]');
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

export async function newChat(page) {
  await page.click('.hHd-Xa_newSession');
  await page.waitForTimeout(1500);
}

// real theme switch via settings modal
export async function setTheme(page, label /* 浅色|深色 */) {
  await page.locator('.VOzbGW_trigger').last().click();
  await page.waitForTimeout(1200);
  const cube = page.locator(`._8HJdBW_themeCube`, { hasText: label });
  await cube.click();
  await page.waitForTimeout(800);
  await page.locator('.VOzbGW_close').click();
  await page.waitForTimeout(800);
}

// collect text/svg mask rects (for chrome-only pixel diff) + screenshot
export async function captureWithMasks(page, path) {
  const masks = await page.evaluate(() => {
    const rects = [];
    const add = (r) => {
      if (r.width > 0 && r.height > 0) rects.push([Math.floor(r.x) - 1, Math.floor(r.y) - 1, Math.ceil(r.right) + 1, Math.ceil(r.bottom) + 1]);
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!(n.textContent || '').trim()) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      for (const rect of r.getClientRects()) add(rect);
    }
    for (const el of document.querySelectorAll('svg, img, canvas, [data-icon]')) add(el.getBoundingClientRect());
    return rects;
  });
  const shot = await page.screenshot();
  fs.writeFileSync(path, shot);
  fs.writeFileSync(path.replace(/\.png$/, '.masks.json'), JSON.stringify(masks));
  return { masks: masks.length, bytes: shot.length };
}

// masked pixel diff between a reference PNG (file) and a captured PNG (file)
// mode: 'full' (no masks) or 'chrome' (mask text/svg using got masks + ref masks if provided)
export async function diffImages(browser, refPath, gotPath, gotMasksPath, refMasksPath, region) {
  const refB64 = fs.readFileSync(refPath).toString('base64');
  const gotB64 = fs.readFileSync(gotPath).toString('base64');
  const gotMasks = gotMasksPath ? JSON.parse(fs.readFileSync(gotMasksPath, 'utf8')) : [];
  const refMasks = refMasksPath ? JSON.parse(fs.readFileSync(refMasksPath, 'utf8')) : [];
  const page = await browser.newPage();
  const result = await page.evaluate(async ({ refB64, gotB64, masks, region }) => {
    const load = (b64) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('img load'));
      img.src = 'data:image/png;base64,' + b64;
    });
    const [a, b] = await Promise.all([load(refB64), load(gotB64)]);
    if (a.width !== b.width || a.height !== b.height) return { error: 'size mismatch', a: [a.width, a.height], b: [b.width, b.height] };
    const w = a.width, h = a.height;
    const [rx1, ry1, rx2, ry2] = region ?? [0, 0, w, h];
    const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const c1 = mk(), c2 = mk();
    const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
    x1.drawImage(a, 0, 0); x2.drawImage(b, 0, 0);
    const d1 = x1.getImageData(0, 0, w, h).data, d2 = x2.getImageData(0, 0, w, h).data;
    const mask = new Uint8Array(w * h);
    for (const m of masks) {
      const [mx1, my1, mx2, my2] = m;
      for (let y = Math.max(0, my1); y < Math.min(h, my2); y++) for (let x = Math.max(0, mx1); x < Math.min(w, mx2); x++) mask[y * w + x] = 1;
    }
    let diff = 0, total = 0;
    const grid = 8;
    const cells = Array.from({ length: grid * grid }, () => ({ d: 0, n: 0 }));
    for (let y = ry1; y < ry2; y++) {
      const cy = Math.min(grid - 1, ((y - ry1) * grid / (ry2 - ry1)) | 0);
      for (let x = rx1; x < rx2; x++) {
        const i = (y * w + x) * 4;
        if (mask[y * w + x]) continue;
        total++;
        const dd = Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
        const px = dd > 24 ? 1 : 0;
        if (px) diff++;
        const cx = Math.min(grid - 1, ((x - rx1) * grid / (rx2 - rx1)) | 0);
        const cell = cells[cy * grid + cx];
        if (px) cell.d++;
        cell.n++;
      }
    }
    const worst = cells.map((c, i) => ({ pct: c.n ? +(100 * c.d / c.n).toFixed(2) : 0, box: [Math.round(rx1 + (i % grid) * (rx2 - rx1) / grid), Math.round(ry1 + ((i / grid) | 0) * (ry2 - ry1) / grid), Math.round(rx1 + (i % grid + 1) * (rx2 - rx1) / grid), Math.round(ry1 + (((i / grid) | 0) + 1) * (ry2 - ry1) / grid)] }))
      .sort((m, n) => n.pct - m.pct).slice(0, 6);
    return { region: [rx1, ry1, rx2, ry2], compared: total, masked: w * h - total, diffPct: +(100 * diff / total).toFixed(2), worst };
  }, { refB64, gotB64, masks: [...gotMasks, ...refMasks], region });
  await page.close();
  return result;
}

// geometry probe of the key elements (works on home + conversation screens)
export async function probeGeometry(page) {
  return page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color, font: cs.font, pad: cs.padding };
    };
    return {
      sidebarCol: pick('.pI_x6G_sidebarCol'),
      newSession: pick('.hHd-Xa_newSession'),
      heroCard: pick('.wSkVaW_composerHero .uV2eYG_card'),
      headline: pick('.pXSMma_headlineText'),
      msgColumn: pick('.Md3f7G_column'),
      userBubble: pick('.gdEzaW_bubble'),
      composerCard: (() => {
        const cards = [...document.querySelectorAll('.uV2eYG_card')];
        const el = cards.find((c) => c.getBoundingClientRect().y > 600) ?? cards.at(-1);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 120) };
      })(),
      inputField: (() => {
        const el = document.querySelector('.uV2eYG_input') ?? document.querySelector('[contenteditable=true]');
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { font: cs.font, color: cs.color, caret: cs.caretColor };
      })(),
      assistantBody: pick('.Sxvs8a_body'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyText: getComputedStyle(document.body).color,
      fontStacks: {
        sans: getComputedStyle(document.body).getPropertyValue('--cl-sans').trim(),
        serif: getComputedStyle(document.body).getPropertyValue('--cl-serif').trim(),
        mono: getComputedStyle(document.body).getPropertyValue('--cl-mono').trim(),
      },
    };
  });
}
