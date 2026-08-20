import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(root, path), 'utf8');
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};

const hexLuminance = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((value) => parseInt(value, 16) / 255);
  const linear = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

const contrastRatio = (a, b) => {
  const [lighter, darker] = [hexLuminance(a), hexLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

const [packageText, patch, host, template, markdown, css, whale, built, readme, readmeZh, notices, publishWorkflow] = await Promise.all([
  read('package.json'),
  read('cordis.patch.yml'),
  read('lib/index.js'),
  read('src/client.template.js'),
  read('src/markdown.js'),
  read('src/skin.css'),
  read('lib/assets/icons/whale.svg'),
  read('lib/client.js'),
  read('README.md'),
  read('README_zh-CN.md'),
  read('THIRD_PARTY_NOTICES.md'),
  read('.github/workflows/publish-npm.yml'),
]);
const pkg = JSON.parse(packageText);

check('package metadata', () => {
  assert.equal(pkg.name, 'dsh-ivory');
  assert.equal(pkg.version, '0.2.5');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.publishConfig?.access, 'public');
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml');
  assert.equal(pkg.dsh?.client?.platform, 'web');
  assert.deepEqual(pkg.dependencies, undefined);
  assert.ok(pkg.keywords.includes('dsh-plugin'));
  assert.match(pkg.repository?.url ?? '', /ZJUZhiyuCai\/dsh-ivory/);
  assert.equal(pkg.peerDependencies?.react, '^18.2.0');
  assert.equal(pkg.peerDependenciesMeta?.react?.optional, true);
});

check('minimal publish allowlist', () => {
  const files = new Set(pkg.files);
  for (const required of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md', 'README_zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(files.has(required), `missing ${required}`);
  }
  assert.ok(!files.has('lib'));
  assert.ok([...files].every((path) => !/font|reference|shot|prompt/i.test(path)));
});

check('bundle contract', () => {
  assert.match(patch, /id:\s*dsh-ivory/);
  assert.match(patch, /name:\s*['"]dsh-ivory['"]/);
  assert.match(template, /id:\s*'dsh-ivory'/);
  assert.match(template, /const inject = \['slots', 'locale'\]/);
  for (const dependency of [
    '@deepseek-ai/dsh-client-runtime',
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-slots',
  ]) assert.ok(pkg.dsh.client.inject.includes(dependency), `missing client inject ${dependency}`);
});

check('inert host boundary', () => {
  assert.match(host, /export const name = 'dsh-ivory'/);
  assert.match(host, /export function apply\(\) \{\}/);
  assert.doesNotMatch(host, /\b(?:fetch|WebSocket|XMLHttpRequest|readFile|writeFile|child_process|webServer|process\.)\b/);
  assert.doesNotMatch(host, /from ['"]node:/);
});

check('browser security boundary', () => {
  assert.doesNotMatch(template, /\.innerHTML\s*=|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(template, /\b(?:fetch|WebSocket|XMLHttpRequest|sendBeacon)\b/);
  assert.doesNotMatch(markdown, /\.innerHTML\s*=|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(markdown, /\b(?:fetch|WebSocket|XMLHttpRequest|sendBeacon)\b/);
  assert.match(markdown, /url\.protocol === 'http:' \|\| url\.protocol === 'https:'/);
  assert.match(markdown, /rel = 'noopener noreferrer'/);
  assert.match(markdown, /MAX_MARKDOWN_PREVIEW_CHARS = 250_000/);
  assert.match(markdown, /kind: 'image'/);
  assert.match(template, /navigator\.clipboard\?\.writeText/);
  assert.match(template, /document\.execCommand\('copy'\)/);
  assert.match(template, /isInsideStreamingMessage\(pre\)/);
  assert.match(template, /isInsideStreamingMessage\(target\)/);
  assert.match(template, /\.dshcs-copy-button, \.dshcs-turn-mark/);
  assert.match(css, /\.dshcs-copy-code/);
});

check('localized client surface', () => {
  assert.match(template, /ctx\.locale\.register\(LOCALE_NS, LOCALES\)/);
  assert.match(template, /ctx\.locale\.bind\(LOCALE_NS\)/);
  assert.match(template, /ctx\.locale\.subscribe\(refreshLocalizedEnhancements\)/);
  assert.match(template, /'settings\.title': 'Ivory Theme'/);
  assert.match(template, /'settings\.title': 'Ivory 主题'/);
  assert.match(template, /\(\?:复制\|copy\|copied\)/);
});

check('brand-safe assets and fonts', () => {
  assert.doesNotMatch(css, /@font-face|anthropic-sans|anthropic-serif|anthropic-mono|Anthropicons|\/plugins\/dsh-claude-skin/);
  assert.match(css, /ui-sans-serif/);
  assert.match(css, /ui-serif/);
  assert.match(css, /ui-monospace/);
  assert.match(whale, /viewBox=/);
  assert.match(whale, /currentColor/);
  assert.match(notices, /not affiliated with, endorsed by, or sponsored by/i);
});

check('generated bundle is reproducible', () => {
  const expected = template
    .replace('/*__MARKDOWN_JS__*/', markdown.trimEnd())
    .replace('/*__SKIN_CSS__*/', JSON.stringify(css))
    .replace('/*__WHALE_SVG__*/', JSON.stringify(whale.trim()));
  assert.equal(built, expected);
});

check('generated bundle parses as a script', () => {
  assert.doesNotThrow(() => new Function(built), 'lib/client.js has a syntax error');
});

check('documentation contract', () => {
  for (const doc of [readme, readmeZh]) {
    assert.match(doc, /dsh plugin --profile web add dsh-ivory/);
    assert.ok(doc.includes(`github:ZJUZhiyuCai/dsh-ivory#v${pkg.version}`), 'tagged GitHub install command is stale');
    assert.match(doc, /unofficial|非官方/i);
    assert.match(doc, /zero telemetry|无遥测/i);
  }
});

check('tokenless npm publishing', () => {
  assert.match(publishWorkflow, /id-token:\s*write/);
  assert.match(publishWorkflow, /environment:\s*npm/);
  assert.match(publishWorkflow, /package-manager-cache:\s*false/);
  assert.match(publishWorkflow, /npm publish --access public/);
  assert.doesNotMatch(publishWorkflow, /NPM_TOKEN|NODE_AUTH_TOKEN|--provenance/);
});

check('token-only degradation is wired into the CSS', () => {
  assert.ok(css.includes('body.dsh-ivory:not(.dshcs-contract-mismatch)'), 'structural gating selector missing');
  const gated = css.match(/body\.dsh-ivory:not\(\.dshcs-contract-mismatch\)/g) ?? [];
  assert.ok(gated.length >= 200, `expected ≥200 gated structural selectors, found ${gated.length}`);
  // Token mappings stay unconditional.
  assert.match(css, /body\.dsh-ivory \{\s*\n\s*--dsw-font-family: var\(--cl-sans\)/);
  // Plugin-owned enhancements stay usable even when the host contract fails.
  assert.match(css, /body\.dsh-ivory \.dshcs-copy-button/);
  for (const hostSelector of ['\\.pI_x6G_frame', '\\.wSkVaW_header', '\\.uV2eYG_card', '\\.hHd-Xa_root', '\\.Sxvs8a_body']) {
    const ungated = new RegExp(`body\\.dsh-ivory(?![^\\n]*dshcs-contract-mismatch)[^\\n]*${hostSelector}`);
    assert.doesNotMatch(css, ungated, `structural selector ${hostSelector} is not gated`);
  }
});

check('light theme text contrast meets WCAG AA', () => {
  const light = css.slice(css.indexOf('body.dsh-ivory {'), css.indexOf('body.dsh-ivory[data-ds-dark-theme]'));
  const token = (name) => {
    const match = light.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`));
    assert.ok(match, `missing light token --${name}`);
    return match[1];
  };
  assert.ok(contrastRatio(token('cl-muted'), token('cl-page')) >= 4.5, '--cl-muted vs --cl-page below 4.5:1');
  assert.ok(contrastRatio(token('cl-ink'), token('cl-page')) >= 4.5, '--cl-ink vs --cl-page below 4.5:1');
});

check('dark mask and renderer hardening boundaries', () => {
  assert.match(css, /--cl-mask-drop: rgb\(255 255 255 \/ 70%\)/);
  assert.match(css, /--cl-mask-drop: rgb\(0 0 0 \/ 60%\)/);
  assert.match(css, /--dsw-alias-bg-mask-drop: var\(--cl-mask-drop\)/);
  for (const cap of ['MAX_MARKDOWN_DEPTH = 32', 'MAX_MARKDOWN_LIST_ITEMS = 500', 'MAX_MARKDOWN_TABLE_ROWS = 256', 'MAX_MARKDOWN_TABLE_COLS = 64', 'MAX_MARKDOWN_PARAGRAPH_LINES = 200', 'MAX_INLINE_DEPTH = 24']) {
    assert.ok(markdown.includes(cap), `missing renderer cap ${cap}`);
  }
  assert.match(markdown, /renderMarkdown\(buf\.join\('\\n'\), depth \+ 1\)/);
  assert.match(markdown, /cell\.setAttribute\('scope', 'col'\)/);
});

console.log(`release-check: ${checks.length} checks passed`);
for (const name of checks) console.log(`  ✓ ${name}`);
