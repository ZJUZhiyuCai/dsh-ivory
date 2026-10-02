// Extract module exports from installed hosts, never from the proposed aliases.
// Default is read-only verification. --write replaces the complete snapshot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readDesktopHost, readWebHost } from './host-bundles.mjs';
import { assertHostContractSnapshot, indexHostModules } from './host-contract.mjs';

const table = JSON.parse(fs.readFileSync(new URL('../src/host-selectors.json', import.meta.url), 'utf8'));
const snapshotPath = new URL('../test/fixtures/host-contracts.json', import.meta.url);
const snapshot = { schema: 1, hosts: {} };
const hosts = { web: readWebHost(), desktop: readDesktopHost() };
for (const [side, host] of Object.entries(hosts)) {
  const version = host.version ?? host.versions?.['@deepseek-ai/dsh-client-ui-renderer'];
  assert.equal(version, table.hosts[side], `${side}: verify the installed version before updating its snapshot`);
  const installed = indexHostModules(host.sources);
  const names = Object.values(table.modules).map(({package: pkg, module}) => `${pkg}/${module}`).sort();
  const modules = {};
  for (const name of names) {
    assert.ok(installed.has(name), `${side}: missing ${name}`);
    modules[name] = Object.fromEntries(Object.entries(installed.get(name)).sort(([a], [b]) => a.localeCompare(b)));
  }
  snapshot.hosts[side] = { version, modules };
}
assertHostContractSnapshot(table, snapshot);
if (process.argv.includes('--write')) {
  fs.mkdirSync(new URL('../test/fixtures/', import.meta.url), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Wrote verified host module snapshots for Web and desktop.');
} else {
  assert.deepEqual(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')), snapshot, 'Installed host exports differ from the committed snapshot.');
  console.log('Committed host snapshots match the installed Web and desktop modules.');
}
