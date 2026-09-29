// Resolve desktop aliases by their package, CSS module and local member.
// Default: preview. --check: fail on drift. --write: save a complete mapping.
import fs from 'node:fs';
import { readDesktopHost } from './host-bundles.mjs';
import { deriveAliases, indexHostModules } from './host-contract.mjs';

const tablePath = new URL('../src/host-selectors.json', import.meta.url);
const table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
const { aliases, errors } = deriveAliases(table, indexHostModules(readDesktopHost().sources));
if (errors.length) {
  console.error(`Cannot derive a complete table:\n${errors.map((error) => `  ${error}`).join('\n')}`);
  process.exit(1);
}
const changed = Object.entries(aliases).filter(([web, desktop]) => table.aliases[web] !== desktop);
for (const [web, desktop] of changed) console.log(`${web}: ${table.aliases[web]} -> ${desktop}`);
if (changed.length && process.argv.includes('--write')) {
  fs.writeFileSync(tablePath, `${JSON.stringify({ ...table, aliases }, null, 2)}\n`);
  console.log(`Wrote ${changed.length} aliases to src/host-selectors.json`);
} else if (changed.length) {
  console.log(`${changed.length} aliases need updating; run npm run derive:host -- --write to save.`);
  if (process.argv.includes('--check')) process.exit(1);
} else {
  console.log(`OK: ${Object.keys(aliases).length} aliases match ${Object.keys(table.modules).length} named host modules.`);
}
