import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {launch} from './qa-lib.mjs';
import {withHost} from './runtime-fixture.mjs';

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
const source = '# Status\n\nPrice: 100';
const previewText = page => page.locator('#source-seat > .dshcs-md').textContent();

test('equal-length and shorter edits replace preview content', async () => {
  await withHost(browser, {source}, async page => {
    for (const replacement of ['# Status\n\nPrice: 999', '# New\n\nNow']) {
      await page.locator('#source').evaluate((node, text) => { node.textContent = text; }, replacement);
      await page.waitForFunction(text => document.querySelector('.dshcs-md')?.textContent.includes(text), replacement.split('\n').at(-1));
      assert.equal(await page.locator('.dshcs-md').count(), 1);
    }
    assert.match(await previewText(page), /Now/);
  });
});

test('source view survives edits and replacement by a highlighted wrapper', async () => {
  await withHost(browser, {source}, async page => {
    await page.locator('.dshcs-md-toggle').click();
    await page.locator('#source').evaluate(node => { node.textContent = '# Status\n\nPrice: 999'; });
    await page.waitForFunction(() => document.querySelector('.dshcs-md')?.textContent.includes('999'));
    assert.equal(await page.locator('.dshcs-md-toggle').getAttribute('data-dshcs-show-source'), '1');
    assert.notEqual(await page.locator('#source').evaluate(node => node.style.display), 'none');
    await page.locator('#source').evaluate(node => {
      const wrapper = document.createElement('div');
      const replacement = document.createElement('pre'); replacement.id = 'source'; replacement.className = 'shiki-fixture'; replacement.textContent = '# Replaced\n\nFresh';
      wrapper.appendChild(replacement); node.replaceWith(wrapper);
    });
    await page.waitForFunction(() => document.querySelector('.dshcs-md')?.textContent.includes('Fresh'));
    assert.equal(await page.locator('.dshcs-md').count(), 1);
    assert.equal(await page.locator('.dshcs-md-toggle').getAttribute('data-dshcs-show-source'), '1');
    assert.equal(await page.locator('#source').evaluate(node => node.parentElement.querySelectorAll(':scope > .dshcs-copy-code').length), 1);
  });
});

test('oversized content recovers, and rejected previews restore the host title on cleanup', async () => {
  await withHost(browser, {}, async page => {
    await page.evaluate(() => { const pre = window.addSource('# Large\n\n' + 'x'.repeat(250000)); pre.title = 'Host title'; });
    await page.waitForFunction(() => document.querySelector('#source').dataset.dshcs === 'oversize');
    await page.locator('#source').evaluate(node => { node.textContent = '# Small\n\nShort now'; });
    await page.waitForFunction(() => document.querySelector('.dshcs-md')?.textContent.includes('Short now'));
    assert.equal(await page.locator('#source').getAttribute('title'), 'Host title');
    await page.locator('#source').evaluate(node => { node.textContent = '# Large\n\n' + 'x'.repeat(250000); });
    await page.waitForFunction(() => document.querySelector('#source').dataset.dshcs === 'oversize');
    assert.equal(await page.locator('.dshcs-md').count(), 0);
    await page.evaluate(() => window.readSettings()[0].props.onClick());
    assert.equal(await page.locator('#source').getAttribute('title'), 'Host title');
    assert.equal(await page.locator('[data-dshcs-seat], [data-dshcs]').count(), 0);
  });
});

test('streaming restores source and completion updates preview without nested enhancement', async () => {
  await withHost(browser, {source: '# Code\n\n```js\nconst n = 1;\n```'}, async page => {
    assert.equal(await page.locator('.dshcs-md').count(), 1);
    await page.locator('article').evaluate(node => { node.setAttribute('aria-busy', 'true'); });
    await page.waitForFunction(() => !document.querySelector('.dshcs-md'));
    assert.notEqual(await page.locator('#source').evaluate(node => node.style.display), 'none');
    await page.locator('#source').evaluate(node => { node.textContent = '# Done\n\nFinal'; });
    await page.locator('article').evaluate(node => { node.removeAttribute('aria-busy'); });
    await page.waitForFunction(() => document.querySelector('.dshcs-md')?.textContent.includes('Final'));
    assert.equal(await page.locator('.dshcs-md').count(), 1);
  });
});

test('dense inline input safely falls back without a multi-second main-thread stall', async () => {
  await withHost(browser, {}, async page => {
    const result = await page.evaluate(async () => {
      let last = performance.now(), gap = 0;
      const heartbeat = setInterval(() => { const now = performance.now(); gap = Math.max(gap, now - last); last = now; }, 10);
      const pre = window.addSource('# Stress\n\n' + '*a* '.repeat(62450));
      await new Promise(resolve => setTimeout(resolve, 200));
      clearInterval(heartbeat);
      return {gap, marker: pre.dataset.dshcs, visible: pre.style.display !== 'none', previews: document.querySelectorAll('.dshcs-md').length};
    });
    assert.equal(result.marker, 'oversize');
    assert.equal(result.visible, true);
    assert.equal(result.previews, 0);
    assert.ok(result.gap < 500, `main thread stalled for ${Math.round(result.gap)}ms`);
  });
});

test('replaced code has one copy button and removed code cannot be copied', async () => {
  await withHost(browser, {source: 'old content', language: 'javascript'}, async page => {
    await page.evaluate(() => {
      const pre = document.querySelector('#source');
      const oldButton = document.querySelector('.dshcs-copy-code');
      const next = document.createElement('pre'); next.id = 'source'; next.textContent = 'new content';
      pre.replaceWith(next);
      oldButton.click(); // Before the mutation observer runs: never copy detached text.
    });
    await page.waitForFunction(() => document.querySelector('#source').dataset.dshcsCopyCode === '1');
    assert.equal(await page.locator('.dshcs-copy-code').count(), 1);
    await page.locator('.dshcs-copy-code').click();
    assert.deepEqual(await page.evaluate(() => window.copied), ['new content']);
    await page.locator('#source').evaluate(node => node.remove());
    await page.waitForFunction(() => !document.querySelector('.dshcs-copy-code'));
    assert.equal(await page.locator('.dshcs-code-copy-host').count(), 0);
  });
});

test('late native copy controls replace plugin buttons', async () => {
  await withHost(browser, {source: 'const n = 1;', language: 'javascript'}, async page => {
    await page.evaluate(() => {
      const native = document.createElement('button'); native.textContent = 'Copy code';
      document.querySelector('.code-block-fixture').appendChild(native);
    });
    await page.waitForFunction(() => !document.querySelector('.dshcs-copy-code'));
    assert.equal(await page.locator('[data-dshcs-copy-code]').count(), 0);
  });
});

for (const blocked of ['write', 'all']) {
  test(`${blocked} storage failure keeps settings and runtime in sync`, async () => {
    await withHost(browser, {blocked, source}, async page => {
      const state = await page.evaluate(() => {
        window.readSettings()[1].props.onClick();
        const focused = document.body.classList.contains('dsh-ivory-focus');
        window.readSettings()[0].props.onClick();
        return {focused, checked: window.readSettings()[0].props['aria-checked'], enabled: document.body.classList.contains('dsh-ivory'), notifications: window.preferenceNotifications};
      });
      assert.deepEqual(state, {focused: true, checked: false, enabled: false, notifications: 2});
      assert.equal(await page.locator('.dshcs-md, .dshcs-copy-button').count(), 0);
      await page.evaluate(() => document.body.classList.add('dsh-ivory'));
      await page.waitForFunction(() => !document.body.classList.contains('dsh-ivory'));
      await page.evaluate(() => window.readSettings()[0].props.onClick());
      assert.equal(await page.locator('.dshcs-md').count(), 1);
      assert.equal(await page.evaluate(() => window.readSettings()[0].props['aria-checked']), true);
    });
  });
}

test('cross-tab changes and storage clear update the settings snapshot', async () => {
  await withHost(browser, {}, async page => {
    await page.evaluate(() => {
      window.readSettings();
      window.testStore.set('dsh-ivory.enabled', '0');
      window.dispatchEvent(new StorageEvent('storage', {key: 'dsh-ivory.enabled', newValue: '0'}));
    });
    await page.waitForFunction(() => !document.body.classList.contains('dsh-ivory'));
    assert.equal(await page.evaluate(() => window.readSettings()[0].props['aria-checked']), false);
    await page.evaluate(() => { window.testStore.clear(); window.dispatchEvent(new StorageEvent('storage', {key: null})); });
    await page.waitForFunction(() => document.body.classList.contains('dsh-ivory'));
    assert.equal(await page.evaluate(() => window.readSettings()[0].props['aria-checked']), true);
  });
});

test('completed spinners and removed conversation content do not report drift', async () => {
  await withHost(browser, {source}, async (page, warnings) => {
    await page.evaluate(() => {
      document.querySelector('#state-dot').dataset.state = 'completed';
      document.querySelector('article').remove();
      document.body.toggleAttribute('data-ds-dark-theme', true);
    });
    await page.waitForTimeout(5200);
    assert.equal(await page.evaluate(() => document.body.dataset.dshcsDriftProbe ?? ''), '');
    assert.equal(await page.evaluate(() => document.body.dataset.dshcsCompat), 'ok');
    assert.equal(warnings.length, 0);
  });
});

test('persistent child drift is detected and cleared on disable and remount', async () => {
  await withHost(browser, {}, async page => {
    await page.locator('.uV2eYG_card').evaluate(node => node.className = 'unknown_card');
    await page.evaluate(() => document.body.toggleAttribute('data-ds-dark-theme', true));
    await page.waitForFunction(() => document.body.dataset.dshcsDriftProbe?.includes('composer.card'));
    await page.evaluate(() => window.readSettings()[0].props.onClick());
    assert.equal(await page.evaluate(() => document.body.dataset.dshcsDriftProbe), undefined);
    await page.evaluate(() => {
      const old = document.querySelector('.uV2eYG_root');
      const replacement = document.createElement('div'); replacement.className = 'uV2eYG_root';
      old.replaceWith(replacement);
      window.readSettings()[0].props.onClick();
    });
    assert.equal(await page.evaluate(() => document.body.dataset.dshcsDriftProbe), undefined);
  });
});
