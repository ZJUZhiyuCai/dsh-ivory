import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertHostAliases, assertHostContractSnapshot, assertNoRetiredSelectors, assertPeerSupport, deriveAliases, indexHostModules } from './host-contract.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const projectTable = JSON.parse(readFileSync(new URL('../src/host-selectors.json', import.meta.url), 'utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../test/fixtures/host-contracts.json', import.meta.url), 'utf8'));

test('the real project alias table matches independently extracted host snapshots', () => {
  assertHostContractSnapshot(projectTable, snapshot);
});

test('a wrong component in the real table fails the default release path', () => {
  const broken = structuredClone(projectTable);
  broken.aliases.SVAs4q_label = 'pO-u3q_label';
  assert.throws(() => assertHostContractSnapshot(broken, snapshot), /wrong component/);
});

test('a renamed module identity or stale host version cannot reuse the snapshot', () => {
  const broken = structuredClone(projectTable);
  broken.modules.SVAs4q.module = 'ReferenceChip.module.css';
  assert.throws(() => assertHostContractSnapshot(broken, snapshot), /no longer resolve/);
  broken.modules.SVAs4q = projectTable.modules.SVAs4q;
  broken.hosts.desktop = '0.2.1';
  assert.throws(() => assertHostContractSnapshot(broken, snapshot), /declared host version/);
});
const table = {
  modules: { SVAs4q: { package: '@deepseek-ai/dsh-client-ui-agent-preset', module: 'AgentPresetLabel.module.css' } },
  aliases: { SVAs4q_label: 'pO-u3q_label' },
};
const source = (name, members) => `const tagId = "${name}"; var Component_module_css_default = ${JSON.stringify(members)};`;
const hosts = [
  source('@deepseek-ai/dsh-client-ui-conversation/ReferenceChip.module.css', { label: 'pO-u3q_label' }),
  source('@deepseek-ai/dsh-client-ui-agent-preset/AgentPresetLabel.module.css', { label: '_3li69W_label', icon: '_3li69W_icon' }),
];

test('same local name in an unrelated module never validates a wrong alias', () => {
  assert.throws(() => assertHostAliases(table, hosts), /wrong component/);
  const result = deriveAliases(table, indexHostModules(hosts));
  assert.deepEqual(result, { aliases: { SVAs4q_label: '_3li69W_label' }, errors: [] });
  assert.doesNotThrow(() => assertHostAliases({ ...table, aliases: result.aliases }, hosts));
});

test('missing or renamed members are unresolved instead of borrowing another module', () => {
  const result = deriveAliases(table, indexHostModules([hosts[0]]));
  assert.equal(result.errors.length, 1);
  assert.deepEqual(result.aliases, {});
  const renamed = source('@deepseek-ai/dsh-client-ui-agent-preset/AgentPresetLabel.module.css', { caption: 'new_caption' });
  assert.equal(deriveAliases(table, indexHostModules([renamed, hosts[0]])).errors.length, 1);
  const missingExport = 'const tagId = "@deepseek-ai/dsh-client-ui-agent-preset/AgentPresetLabel.module.css";';
  assert.throws(() => indexHostModules([missingExport + hosts[0]]), /missing CSS module export/);
});

test('duplicate package-qualified module identities are rejected', () => {
  assert.throws(() => indexHostModules([hosts[1], hosts[1]]), /ambiguous CSS module/);
});

test('actual peer ranges accept both supported RC hosts with default npm semantics', () => {
  assertPeerSupport(pkg, ['0.1.2-rc.1', '0.1.5-rc.1', '0.2.0-rc.2']);
  const broken = structuredClone(pkg);
  for (const name of broken.dsh.client.inject) broken.peerDependencies[name] = '>=0.1.2-rc.1 <0.3.0';
  assert.throws(() => assertPeerSupport(broken, ['0.2.0-rc.2']), /excluded/);
});

test('peer checks reject unsupported floor, ceiling and prerelease versions', () => {
  for (const version of ['0.1.1', '0.1.2-rc.0', '0.2.1-rc.1', '0.3.0', '1.0.0']) {
    assert.throws(() => assertPeerSupport(pkg, [version]), /excluded/, version);
  }
});

test('retired hash injected only through the alias table or generated bundle fails', () => {
  for (const name of ['src/host-selectors.json', 'lib/client.js']) {
    assert.throws(() => assertNoRetiredSelectors({ 'src/skin.css': '', 'src/client.template.js': '', [name]: '._1weZzq_root' }), /retired host hash/);
  }
});
