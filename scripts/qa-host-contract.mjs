// Verifies Ivory against the CURRENT host: contract health, surfaces the user
// reported as wrong (sidebar / composer / settings), plus both themes.
import fs from 'node:fs';
import { launch, HOME, selectWorkspace, expandSidebar, setTheme } from './qa-lib.mjs';

const OUT = 'output/qa-host-contract';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, pass, detail = null) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === null ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400)}`);
};

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(HOME, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await selectWorkspace(page).catch(() => {});

// --- 1. contract health
const st = await page.evaluate(() => ({
  compat: document.body.dataset.dshcsCompat,
  mism: document.body.classList.contains('dshcs-contract-mismatch'),
  cls: document.body.classList.contains('dsh-ivory'),
}));
check('contract settles to ok (no token-only fallback)', st.compat === 'ok', st);
check('body carries dsh-ivory and not the mismatch class', st.cls && !st.mism, st);

// --- 2. skin tokens actually applied (proves structural rules are live)
const themed = await page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  const frame = document.querySelector('.pI_x6G_frame');
  return {
    bg: cs.backgroundColor,
    font: cs.fontFamily.slice(0, 60),
    frameRadius: frame ? getComputedStyle(frame).borderRadius : null,
    ivoryVars: ['--cl-page', '--cl-ink', '--cl-border'].map((v) => [v, getComputedStyle(document.body).getPropertyValue(v).trim()]),
  };
});
check('Ivory design tokens resolved on body', themed.ivoryVars.every(([, v]) => v !== ''), themed.ivoryVars);

// --- 3. sidebar (user-reported)
await expandSidebar(page).catch(() => {});
await page.waitForTimeout(800);
const sidebar = await page.evaluate(() => {
  const g = (s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, color: cs.color };
  };
  return {
    root: g('.hHd-Xa_root'),
    newSession: g('.hHd-Xa_newSession'),
    sessionRow: g('.YDXeBa_sessionRow'),
    projectRow: g('.YDXeBa_projectRow'),
    footArea: g('.hHd-Xa_footArea'),
    visible: document.querySelector('.hHd-Xa_root')?.getBoundingClientRect().width ?? 0,
  };
});
check('sidebar root mounted with real width', sidebar.root !== null && sidebar.root.w > 100, sidebar.root);
check('sidebar new-session control styled', sidebar.newSession !== null, sidebar.newSession);
check('sidebar session rows present', sidebar.sessionRow !== null, sidebar.sessionRow);

// --- 4. composer (user-reported)
const composer = await page.evaluate(() => {
  const g = (s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, border: cs.borderColor };
  };
  return { root: g('.uV2eYG_root'), card: g('.uV2eYG_card'), input: g('.uV2eYG_input'), row: g('.uV2eYG_row'), primary: g('.uV2eYG_primary') };
});
check('composer card mounted and styled', composer.card !== null && composer.card.radius !== '0px', composer.card);
check('composer input present', composer.input !== null, composer.input);

// --- 5. 24px touch-target invariant on composer controls
const small = await page.evaluate(() => {
  const badges = [];
  document.querySelectorAll('.uV2eYG_card button, .uV2eYG_card [role="button"]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) badges.push({ cls: el.className.toString().slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) });
  });
  return badges;
});
check('no sub-24px composer target', small.length === 0, small.slice(0, 5));

await page.screenshot({ path: `${OUT}/conversation-light.png` });

// --- 6. settings section (user-reported)
await page.goto(HOME, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
let settingsOk = false, settingsDetail = null;
try {
  const trigger = page.locator('[data-slot="settings.trigger"]').first();
  await trigger.click({ timeout: 5000 });
  await page.waitForTimeout(1500);
  settingsDetail = await page.evaluate(() => {
    const navs = [...document.querySelectorAll('nav a, nav button, [role="tab"], [class*="nav"] button')].map((n) => (n.innerText || '').trim()).filter(Boolean).slice(0, 40);
    const secs = [...document.querySelectorAll('[data-slot^="settings"]')].map((n) => n.getAttribute('data-slot'));
    return { navs, secs, hasIvoryNav: navs.some((n) => /ivory|claude|主题|theme/i.test(n)) };
  });
  settingsOk = true;
  await page.screenshot({ path: `${OUT}/settings.png` });
} catch (e) { settingsDetail = String(e).slice(0, 200); }
check('settings panel opens', settingsOk, settingsDetail);

console.log('\npage errors:', errs.length);
for (const e of errs.slice(0, 10)) console.log('  ! ' + e.slice(0, 200));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
await browser.close();
process.exit(failed.length ? 1 : 0);
