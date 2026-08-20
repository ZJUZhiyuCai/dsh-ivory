// Build the dsh-ivory browser bundle from the source template, Markdown
// renderer, CSS, and the DSH whale asset. No external dependencies.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const [template, markdown, css, whale] = await Promise.all([
  readFile(join(root, 'src/client.template.js'), 'utf8'),
  readFile(join(root, 'src/markdown.js'), 'utf8'),
  readFile(join(root, 'src/skin.css'), 'utf8'),
  readFile(join(root, 'lib/assets/icons/whale.svg'), 'utf8'),
]);

let out = template
  .replace('/*__MARKDOWN_JS__*/', markdown.trimEnd())
  .replace('/*__SKIN_CSS__*/', JSON.stringify(css))
  .replace('/*__WHALE_SVG__*/', JSON.stringify(whale.trim()));

await mkdir(join(root, 'lib'), { recursive: true });
await writeFile(join(root, 'lib/client.js'), out);
console.log('lib/client.js built:', out.length, 'bytes');
