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

const [packageText, patch, host, template, css, whale, built, readme, readmeZh, notices] = await Promise.all([
  read('package.json'),
  read('cordis.patch.yml'),
  read('lib/index.js'),
  read('src/client.template.js'),
  read('src/skin.css'),
  read('lib/assets/icons/whale.svg'),
  read('lib/client.js'),
  read('README.md'),
  read('README.zh-CN.md'),
  read('THIRD_PARTY_NOTICES.md'),
]);
const pkg = JSON.parse(packageText);

check('package metadata', () => {
  assert.equal(pkg.name, 'dsh-ivory');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.publishConfig?.access, 'public');
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml');
  assert.equal(pkg.dsh?.client?.platform, 'web');
  assert.deepEqual(pkg.dependencies, undefined);
  assert.ok(pkg.keywords.includes('dsh-plugin'));
  assert.match(pkg.repository?.url ?? '', /ZJUZhiyuCai\/dsh-ivory/);
});

check('minimal publish allowlist', () => {
  const files = new Set(pkg.files);
  for (const required of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md', 'README.zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(files.has(required), `missing ${required}`);
  }
  assert.ok(!files.has('lib'));
  assert.ok([...files].every((path) => !/font|reference|shot|prompt/i.test(path)));
});

check('bundle contract', () => {
  assert.match(patch, /id:\s*dsh-ivory/);
  assert.match(patch, /name:\s*['"]dsh-ivory['"]/);
  assert.match(template, /id:\s*'dsh-ivory'/);
  assert.match(template, /@deepseek-ai\/dsh-client-runtime|const inject = \['slots'\]/);
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
  assert.match(template, /url\.protocol === 'http:' \|\| url\.protocol === 'https:'/);
  assert.match(template, /rel = 'noopener noreferrer'/);
  assert.match(template, /MAX_MARKDOWN_PREVIEW_CHARS = 250_000/);
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
    .replace('/*__SKIN_CSS__*/', JSON.stringify(css))
    .replace('/*__WHALE_SVG__*/', JSON.stringify(whale.trim()));
  assert.equal(built, expected);
});

check('documentation contract', () => {
  for (const doc of [readme, readmeZh]) {
    assert.match(doc, /dsh plugin --profile web add dsh-ivory/);
    assert.match(doc, /unofficial|非官方/i);
    assert.match(doc, /zero telemetry|无遥测/i);
  }
});

console.log(`release-check: ${checks.length} checks passed`);
for (const name of checks) console.log(`  ✓ ${name}`);
