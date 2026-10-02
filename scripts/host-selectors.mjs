// Build-time compatibility only: no DOM rewriting or runtime patching of DSH.
// Keep the legacy spelling in source, and emit equal-specificity alternatives
// for classes verified in the corresponding desktop CSS modules.
import { readFileSync } from 'node:fs';

const { aliases } = JSON.parse(readFileSync(new URL('../src/host-selectors.json', import.meta.url), 'utf8'));

export function expandHostSelectors(source) {
  return source.replace(/\.([A-Za-z_][\w-]*)/g, (selector, name) => {
    const desktop = aliases[name];
    return desktop ? `:is(${selector}, .${desktop})` : selector;
  });
}
