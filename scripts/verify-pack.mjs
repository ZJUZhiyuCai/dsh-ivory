import assert from 'node:assert/strict';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const jsonStart = input.indexOf('[');
assert.ok(jsonStart >= 0, `npm pack did not return JSON: ${input.slice(0, 300)}`);
const [pack] = JSON.parse(input.slice(jsonStart));
assert.ok(pack, 'npm pack returned no package');

const paths = pack.files.map((file) => file.path).sort();
const expected = [
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
  'THIRD_PARTY_NOTICES.md',
  'cordis.patch.yml',
  'lib/client.js',
  'lib/index.js',
  'package.json',
].sort();

assert.deepEqual(paths, expected, `unexpected tarball contents:\n${paths.join('\n')}`);
assert.ok(pack.size < 120_000, `packed size is too large: ${pack.size} bytes`);
assert.ok(pack.unpackedSize < 400_000, `unpacked size is too large: ${pack.unpackedSize} bytes`);
assert.ok(paths.every((path) => !/font|reference|shot|prompt|\.env/i.test(path)));

console.log(`verify-pack: ${paths.length} files, ${(pack.size / 1024).toFixed(1)} KiB packed, ${(pack.unpackedSize / 1024).toFixed(1)} KiB unpacked`);
