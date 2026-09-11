// Runtime diagnosis of Ivory against the INSTALLED DSH build. Prints the plugin's
// own self-diagnosis channel (compat / drift / drift-probe) and inventories every
// selector family Ivory depends on against the live DOM. Run against any host:
// Reads the plugin's own self-diagnosis channel plus the live selector inventory.
import fs from 'node:fs';
import { launch, HOME } from './qa-lib.mjs';

const OUT = 'output/qa-contract-health';
fs.mkdirSync(OUT, { recursive: true });

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const consoleWarns = [];
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error') consoleErrors.push(m.text());
  if (t === 'warning') consoleWarns.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(HOME, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);

const state = await page.evaluate(() => {
  const b = document.body;
  return {
    bodyClass: b.className,
    compat: b.dataset.dshcsCompat ?? null,
    drift: b.dataset.dshcsDrift ?? null,
    driftProbe: b.dataset.dshcsDriftProbe ?? null,
    hasSkinStyle: [...document.querySelectorAll('style')].some((s) => (s.dataset.pluginCss || '') === 'dsh-ivory' || (s.textContent || '').includes('--cl-')),
    styleTags: [...document.querySelectorAll('style')].map((s) => s.dataset.pluginCss || '(inline)').slice(0, 20),
    ivoryRootStyle: b.classList.contains('dsh-ivory'),
  };
});
console.log('=== SELF-DIAGNOSIS ===');
console.log(JSON.stringify(state, null, 2));

// Probe every selector family Ivory depends on, live in the running client.
const families = await page.evaluate(() => {
  const F = {
    'layout.frame': ['.pI_x6G_frame'],
    'layout.centerCol': ['.pI_x6G_centerCol'],
    'layout.sidebarCol': ['.pI_x6G_sidebarCol'],
    'sidebar.root': ['.hHd-Xa_root'],
    'sidebar.brand': ['.hHd-Xa_brand'],
    'sidebar.newSession': ['.hHd-Xa_newSession'],
    'sidebar.footArea': ['.hHd-Xa_footArea'],
    'sidebar.sessionRow': ['.YDXeBa_sessionRow'],
    'sidebar.projectRow': ['.YDXeBa_projectRow'],
    'workspace.root': ['.bhn1Oq_root'],
    'workspace.list': ['.bhn1Oq_list'],
    'conversation.root': ['.wSkVaW_root'],
    'conversation.scrollBody': ['.wSkVaW_scrollBody'],
    'conversation.header': ['.wSkVaW_header'],
    'conversation.composerSeat': ['.wSkVaW_composerSeat'],
    'conversation.composerHero': ['.wSkVaW_composerHero'],
    'composer.root': ['.uV2eYG_root'],
    'composer.card': ['.uV2eYG_card'],
    'composer.input': ['.uV2eYG_input'],
    'composer.row': ['.uV2eYG_row'],
    'composer.primary': ['.uV2eYG_primary'],
    'column.root': ['.EvIC1a_column'],
    'toolRow.root': ['.o3BgMG_root'],
    'reasoning.root': ['.lcKema_root'],
    'bash.root': ['.CY-8Ka_root'],
    'assistantActions.root': ['.hWmORq_root'],
    'userBubble': ['.Sixlwa_bubble'],
    'hero.root': ['.pXSMma_root'],
    'hero.headline': ['.pXSMma_headline'],
    'hero.headlineText': ['.pXSMma_headlineText'],
    'hero.previewBadge': ['.pXSMma_previewBadge'],
    'hero.workspace': ['.pXSMma_workspace'],
    'headline2': ['.SVAs4q_label'],
    'composerTrigger': ['.VOzbGW_trigger'],
    'sessionLogButton': ['.nL4_yW_sessionLogButton'],
    'entryRow': ['.fThDlq_entryRow'],
    'bubbleAlt': ['.gdEzaW_bubble'],
    'entryAlt': ['.mL8Uca_entry'],
    'settings.section': ['.Pz1RTq_section'],
    'settings.card': ['.Pz1RTq_card'],
    'settings.switchTrack': ['.Pz1RTq_switchTrack'],
    'sidebar2.card': ['._2vuxea_card'],
    'sidebar2.section': ['._2vuxea_section'],
    'sidebar2.grid': ['._2vuxea_grid'],
    'editorMd': ['.W-zNGW_editorMd'],
    'panel.body': ['.Sxvs8a_body'],
    'md.markdown': ['.\\_markdown_1xv42_5'],
  };
  const out = {};
  for (const [k, sels] of Object.entries(F)) {
    // strip the escaping used for leading-underscore classes
    const hit = sels.find((s) => { try { return document.querySelector(s.replace(/\\\\/g, '')); } catch { return false; } });
    out[k] = hit ? 'present' : 'ABSENT';
  }
  return out;
});
console.log('\n=== SELECTOR INVENTORY (live DOM) ===');
for (const [k, v] of Object.entries(families)) console.log(`${v === 'present' ? '  ok ' : '  X  '} ${k}: ${v}`);

// What CSS-module classes DOES the client actually use for the absent families?
const discover = await page.evaluate(() => {
  const all = new Set();
  document.querySelectorAll('*').forEach((el) => {
    if (typeof el.className === 'string') el.className.split(/\s+/).forEach((c) => { if (c && c.includes('_')) all.add(c); });
  });
  return [...all].sort();
});
fs.writeFileSync(`${OUT}/live-classes.txt`, discover.join('\n'));
console.log('\nlive class tokens:', discover.length, `-> ${OUT}/live-classes.txt`);

// Which look like settings / switch / card / section surfaces?
const interesting = discover.filter((c) => /switch|card|section|grid|addCard|gear|desc|intro|count|check/i.test(c));
console.log('\n=== candidate classes for settings-like surfaces ===');
for (const c of interesting.slice(0, 80)) console.log('   .' + c);

console.log('\n=== CONSOLE ERRORS (' + consoleErrors.length + ') ===');
for (const e of consoleErrors.slice(0, 40)) console.log('  ! ' + e.slice(0, 300));
console.log('\n=== IVORY WARNINGS (' + consoleWarns.filter((w) => /ivory/i.test(w)).length + ') ===');
for (const w of consoleWarns.filter((w) => /ivory/i.test(w)).slice(0, 40)) console.log('  ~ ' + w.slice(0, 400));

await page.screenshot({ path: `${OUT}/home-light.png`, fullPage: false });
await browser.close();
console.log('\nscreenshot ->', `${OUT}/home-light.png`);
