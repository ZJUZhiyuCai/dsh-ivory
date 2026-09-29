// Exercise the installed DisclosureRow branches with each host's own CSS.
import fs from 'node:fs';
import path from 'node:path';
import { expandHostSelectors } from './host-selectors.mjs';
import { indexHostModules } from './host-contract.mjs';

const skin = expandHostSelectors(fs.readFileSync(new URL('../src/skin.css', import.meta.url), 'utf8'));
const glyph = (attributes = '') => `<svg ${attributes} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M4 10L8 6L12 10"/></svg>`;

export async function testDisclosure(browser, hosts, table, check, shotsDir) {
  for (const [side, host] of Object.entries(hosts)) {
    const modules = indexHostModules(host.sources);
    const member = (prefix) => {
      const identity = table.modules[prefix];
      return modules.get(`${identity.package}/${identity.module}`);
    };
    const family = host.frontendCss.match(/\._chevronHover_([\w]+)_\d+/)?.[1];
    const primitive = (name) => {
      const value = host.frontendCss.match(new RegExp(`\\._${name}_${family}_\\d+`))?.[0].slice(1);
      if (!value) throw new Error(`${side}: missing DisclosureRow.${name}`);
      return value;
    };
    const rows = [['reasoning', 'lcKema'], ['tool', 'o3BgMG']].map(([name, prefix]) => {
      const css = member(prefix);
      const arrowClass = css.chevron || '';
      return { name, css, collapsed: `<span class="${primitive('iconIdle')}">${glyph('data-test="decorative"')}</span>${glyph(`data-test="arrow" class="${primitive('chevronHover')} ${arrowClass}"`)}`, expanded: glyph(`data-test="arrow" class="${arrowClass}"`) };
    });
    const preset = member('SVAs4q');
    const reference = modules.get('@deepseek-ai/dsh-client-ui-conversation/ReferenceChip.module.css');
    for (const dark of [false, true]) {
      const label = `${side} ${dark ? 'dark' : 'light'}`;
      const page = await browser.newPage({ viewport: { width: 700, height: 450 } });
      await page.setContent(`<body class="dsh-ivory" ${dark ? 'data-ds-dark-theme' : ''}><main style="padding:30px"><h3>${label}: disclosure regression</h3>${rows.map(({name, css, collapsed}) => `<section class="${css.root}" data-state="running"><div id="${name}" class="${primitive('row')} ${css.row}" role="button" tabindex="0" aria-expanded="false"><span class="${primitive('leading')} ${css.leading}">${collapsed}</span><span>${name}</span></div></section>`).join('')}<span id="preset" class="${preset.label}">Preset label</span>${reference ? `<span id="reference" class="${reference.label}">Reference label</span>` : ''}<svg id="matrix" data-state="ongoing" width="14" height="14"><rect width="5" height="5" fill="currentColor"/></svg><svg id="ring" data-state="ongoing" width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor"/></svg></main></body>`);
      await page.addStyleTag({ content: host.css + '\n' + skin });
      // The host replaces iconIdle/chevronHover with its up-arrow on expansion.
      // Keep that distinct markup and use both pointer and keyboard toggles.
      await page.evaluate((fixtures) => {
        for (const fixture of fixtures) {
          const row = document.getElementById(fixture.name);
          const toggle = () => {
            const open = row.getAttribute('aria-expanded') !== 'true';
            row.setAttribute('aria-expanded', String(open));
            row.firstElementChild.innerHTML = open ? fixture.expanded : fixture.collapsed;
          };
          row.addEventListener('click', toggle);
          row.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
          });
        }
      }, rows);
      for (const { name } of rows) {
        const row = page.locator(`#${name}`);
        check(`${label}: ${name} idle decoration replaced`, await row.locator('[data-test="decorative"]').evaluate((el) => getComputedStyle(el).visibility === 'hidden'));
        await row.hover();
        await page.waitForFunction((id) => getComputedStyle(document.querySelector(`#${id} [data-test="arrow"]`)).opacity === '1', name);
        check(`${label}: ${name} hover arrow visible`, await row.locator('[data-test="arrow"]').evaluate((el) => getComputedStyle(el).visibility === 'visible'));
        await row.click();
        const expanded = await row.evaluate((el) => {
          const arrow = el.querySelector('[data-test="arrow"]');
          return el.getAttribute('aria-expanded') === 'true' && getComputedStyle(arrow).visibility === 'visible'
            && getComputedStyle(arrow).opacity === '1' && getComputedStyle(el.firstElementChild, '::after').content === 'none';
        });
        check(`${label}: ${name} expanded arrow unobscured`, expanded);
        await row.press('Enter');
        check(`${label}: ${name} keyboard collapse works`, await row.getAttribute('aria-expanded') === 'false' && await row.locator('[data-test="decorative"]').count() === 1);
        await row.press('Space');
        check(`${label}: ${name} keyboard expansion shows arrow`, await row.getAttribute('aria-expanded') === 'true' && await row.locator('[data-test="arrow"]').evaluate((el) => getComputedStyle(el).visibility === 'visible'));
      }
      check(`${label}: narrow preset label receives its own rule`, await page.locator('#preset').evaluate((el) => getComputedStyle(el).maxWidth === '100%' && getComputedStyle(el).minWidth === '0px'));
      if (reference) check(`${label}: reference chip does not receive preset rule`, await page.locator('#reference').evaluate((el) => getComputedStyle(el).maxWidth === 'none'));
      check(`${label}: matrix and ring use the accent`, await page.evaluate((expected) => ['#matrix rect', '#ring circle'].every((selector) => {
        const el = document.querySelector(selector);
        return getComputedStyle(el)[el.tagName === 'rect' ? 'fill' : 'stroke'] === expected;
      }), dark ? 'rgb(255, 158, 94)' : 'rgb(138, 74, 21)'));
      if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${side}-disclosure-${dark ? 'dark' : 'light'}.png`) });
      await page.close();
    }
  }
}
