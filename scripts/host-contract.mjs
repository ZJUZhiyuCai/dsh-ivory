import assert from 'node:assert/strict';
import semver from 'semver';

export const RETIRED_HASHES = [
  'CUGzGG', 'FK8dIa', 'hYB0Yq', 'KAPaMa', 'Pio91W', 'qk2Vjq', 'EIRQwq', '_6t6-Wa', '_11c_Vq',
  '_1weZzq', 'rV80fW', '_5AcOhq', 'QJwAZG', 'KX1G9q', 'GbPhAq', '_5Tb7VW', 'Pt1S2G',
  'ZPwaDq', 'J-sEvG', 'YMznnq', 'P9Gu9a', 'vvensa', 'pjj1TG', 'Wzuqea', '-cyEQq',
  'M51CuW', 'DwbCQq', 'MuR-fW', '_1TpC3q', 'lM08Pq',
];

export function assertNoRetiredSelectors(files) {
  for (const [name, source] of Object.entries(files)) {
    for (const hash of RETIRED_HASHES) assert.ok(!source.includes(hash), `${name} contains retired host hash ${hash}`);
  }
}

export function assertPeerSupport(pkg, versions) {
  for (const name of pkg.dsh.client.inject) {
    for (const version of versions) {
      assert.ok(semver.satisfies(version, pkg.peerDependencies[name]), `${name}: ${version} is excluded by ${pkg.peerDependencies[name]}`);
    }
  }
}

const splitClass = (name) => {
  const boundary = name.lastIndexOf('_');
  return [name.slice(0, boundary), name.slice(boundary + 1)];
};

export function assertSelectorTable(table) {
  for (const [web, desktop] of Object.entries(table.aliases)) {
    const [prefix, local] = splitClass(web);
    const identity = table.modules[prefix];
    assert.ok(identity?.package && identity?.module, `missing module identity for ${web}`);
    assert.equal(splitClass(desktop)[1], local, `alias ${web} -> ${desktop} changes its local member`);
    assert.ok(local && splitClass(desktop)[0], `invalid class alias ${web} -> ${desktop}`);
  }
}

// Package-qualified CSS tags are identities; common root/label members are not.
// Parse data literals only; never execute host bundles.
export function indexHostModules(sources) {
  const modules = new Map();
  for (const source of sources) {
    const tags = [...source.matchAll(/(?:const|var) tagId(?:\$\d+)? = "([^"]+\.css)";/g)];
    for (const [index, tag] of tags.entries()) {
      if (!tag[1].endsWith('.module.css')) continue;
      // A missing export must not borrow the following stylesheet's members.
      const segment = source.slice(tag.index + tag[0].length, tags[index + 1]?.index);
      const exported = segment.match(/(?:const|var) \w+_module_css_default(?:\$\d+)? = (\{[\s\S]*?\});/);
      assert.ok(exported, `missing CSS module export: ${tag[1]}`);
      const members = JSON.parse(exported[1]);
      assert.ok(!modules.has(tag[1]), `ambiguous CSS module identity: ${tag[1]}`);
      modules.set(tag[1], members);
    }
  }
  return modules;
}

export function deriveAliases(table, modules) {
  assertSelectorTable(table);
  const aliases = {}, errors = [];
  for (const web of Object.keys(table.aliases)) {
    const [prefix, local] = splitClass(web);
    const identity = table.modules[prefix];
    const name = `${identity.package}/${identity.module}`;
    const target = modules.get(name)?.[local];
    if (typeof target !== 'string' || splitClass(target)[1] !== local) errors.push(`${web}: ${name}.${local} is missing or renamed`);
    else aliases[web] = target;
  }
  return { aliases, errors };
}

export function assertHostAliases(table, sources, side = 'desktop') {
  assertModuleAliases(table, indexHostModules(sources), side);
}

function assertModuleAliases(table, modules, side) {
  const { aliases, errors } = deriveAliases(table, modules);
  assert.deepEqual(errors, [], `${side} module identities no longer resolve`);
  for (const [web, actual] of Object.entries(aliases)) {
    const expected = side === 'web' ? web : table.aliases[web];
    assert.equal(actual, expected, `${web}: ${side} alias targets the wrong component`);
  }
}

export function assertHostContractSnapshot(table, snapshot) {
  assert.equal(snapshot.schema, 1, 'unknown host contract snapshot schema');
  for (const [side, version] of Object.entries(table.hosts)) {
    const host = snapshot.hosts[side];
    assert.equal(host?.version, version, `${side} snapshot must describe the declared host version`);
    assertModuleAliases(table, new Map(Object.entries(host.modules)), side);
  }
}
