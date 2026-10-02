# Architecture and trust boundary

Ivory is intentionally smaller than a typical DSH plugin. The host half exists
only because the bundle registry expects a package entry point; all useful work
happens inside the DSH browser client.

## Package faces

| Face | File | Responsibility |
| --- | --- | --- |
| Host | `lib/index.js` | Exports the package name and an empty `apply()` |
| Client source | `src/client.template.js` | Lifecycle, settings, copy controls, turn marker |
| Renderer source | `src/markdown.js` | Capped DOM-built Markdown preview renderer |
| Renderer tests | `scripts/test-markdown.mjs` | node:test unit suite for the renderer (npm test) |
| Theme source | `src/skin.css` | Tokens, responsive layout, compatibility selectors |
| Client artifact | `lib/client.js` | Deterministic DSH ModuleLoader bootstrap |
| Bundle patch | `cordis.patch.yml` | Registers `dsh-ivory` in the web profile |

The client artifact is a classic DSH bootstrap:

```js
window.__ModuleLoader__.load({ id: 'dsh-ivory', factory: (require) => { /* … */ } });
```

It deliberately does not add `export {}` merely to look like a conventional
ES module. DSH serves and evaluates this entry through its client-module loader,
and official DSH browser packages use the same contract.

## Runtime behavior

On load, Ivory adds one stylesheet and toggles the `dsh-ivory` body class. The
settings section stores only the enabled and focus preferences. When enabled:

1. stable DSH design tokens receive the warm neutral theme;
2. a small selector contract checks both the stable 0.1.2 `data-slot` seams and
   the verified web/desktop shell sentinels, then conditionally verifies chat,
   assistant, reasoning, Bash, and generic-tool families when those surfaces
   mount. The Conversation slot is matched under **both** of its spellings —
   `[data-slot="conversation"]` (0.1.2) and `[data-slot="main.conversation"]`
   (0.1.5, re-homed under the root-scoped `main` entry) — so one build covers
   the whole supported host range. Global panels keep the `[data-slot="main"]`
   wrapper while replacing its conversation child, so only mounted
   conversations require their composer;
3. narrow observers enhance new Markdown blocks, per-block copy controls,
   completed assistant turns, and safe source notes;
4. cleanup disconnects every observer and removes every injected node when the
   theme is disabled or unloaded.

If the selector contract cannot be proven after a bounded retry period, Ivory
adds a mismatch state and keeps only token-level styling. This prefers a less
complete theme over a broken host layout. The observer revalidates immediately
when a valid frame later appears, including after leaving a stale session URL.

## Markdown preview

The preview is intentionally not a general Markdown/HTML engine. It supports a
small presentation subset using `createElement`, `createTextNode`, and explicit
attributes. Raw HTML remains text. Link parsing accepts only absolute HTTP(S)
URLs and rejects control characters and attribute delimiters. Source view is
always reachable, and inputs above 250,000 characters are not previewed.
Inline delimiter searches advance monotonically. All blocks share a 4,000-node,
1,000,000-character-work and 24ms construction budget; exhausting any budget
discards the fragment and leaves the complete source visible. Exact content
comparison invalidates both successful and rejected previews. Rebuilds preserve
the source/preview choice, and preview-created code is never enhanced recursively.

## Clipboard behavior

Ivory adds independent copy controls to prose paragraphs, user text bubbles,
and code blocks without replacing DSH's whole-message action. Clipboard writes
run only in response to a button click. The modern Clipboard API is attempted
first, followed by a local selection-based fallback; neither path makes a
network request. Assistant controls are not inserted while the host marks a
message as streaming, which avoids modifying React-owned Markdown during an
update. Copy controls, wrappers, live-status nodes, and pending visual feedback
timers are removed when the theme is disabled.
Code controls have explicit source-node ownership. Removing or replacing a source
retires its button; a detached source cannot be copied even before observer cleanup.
Native controls that mount later suppress the plugin control as well.

The settings panel and body classes share one external preference store.
Persistence is best effort: failed reads/writes do not undo a choice made during
the current session. Cross-tab storage events update the same subscribed store.
Advisory selector checks remember persistent children per mounted container;
transient messages and ongoing indicators are not historical drift sentinels.

## Localization

Ivory registers one English/Simplified Chinese dictionary with DSH's locale
service. Settings labels, clipboard feedback, and Markdown preview controls bind
to that service and update when the host locale changes. No browser-language
heuristic or separate preference is stored.

## Assets and typography

Ivory uses platform sans, serif, and monospace stacks. No remote request or font
binary is involved. The small response marker is an inlined SVG adapted from
the MIT-licensed DSH whale; its notice is retained in
`THIRD_PARTY_NOTICES.md`.

## Build and release invariants

`scripts/build.mjs` combines the source template, Markdown renderer, CSS, and
whale SVG without a
bundler. `scripts/release-check.mjs` independently recreates the artifact and
requires byte equality. `scripts/verify-pack.mjs` then rejects any tarball file
outside the explicit release manifest as well as unexpected package growth.
The npm release workflow uses GitHub OIDC through npm Trusted Publisher; it
stores no long-lived npm publish token, and npm generates provenance for those
CI releases automatically.

Any future feature that needs a network request, host service, secret, new
persistent field, runtime dependency, or third-party asset changes this trust
boundary and should receive explicit security and documentation review.

## Desktop compatibility

`src/host-selectors.json` records class aliases verified against matching CSS
modules in DSH web 0.1.5 and official desktop 0.2.0-rc.2. The build expands exact
class selectors to `:is(legacy, desktop)` in both the stylesheet and DOM probes,
retaining specificity without adding classes to host nodes. Unknown classes
are not guessed. Global main panels do not require a conversation or composer;
when the conversation is mounted its structural contract remains mandatory.
macOS rules preserve the host's title grid, traffic-light clearance, and fully
hidden sidebar.

The selector table records package-qualified CSS module identities for each Web
prefix. Desktop aliases are resolved by that identity and member, never by the
existence of a similarly named `root` or `label`. `derive:host` previews changes;
`--check` rejects drift and `--write` saves only a complete resolution.

The shared `data-state="ongoing"` anchor covers the old matrix and new ring
spinner. Disclosure rows require two branches: collapsed iconIdle/chevronHover
and a distinct expanded up-arrow, which may have no CSS class. The decoration
replacement is scoped to collapsed rows and never overlays the expanded control.
Release checks use standard npm semver and scan source, aliases and generated
output for retired selectors. Host integration checks compare all aliases with
actual module identities and load each host's own styles. Desktop-only selectors
still require review when the host changes.
Versioned module-export snapshots in `test/fixtures/host-contracts.json` are
extracted from installed hosts, independently of alias values. `snapshot:host`
checks them; `--write` replaces them only after complete resolution and version
verification. Default tests and release checks validate the real alias table
against both snapshots. `test:runtime` exercises the generated bundle in an
isolated browser with controlled module-loader, React-hook and clipboard boundaries;
it complements installed-host CSS tests and live-host QA, not their replacement.

Native sidebar panels and injected task-board entries share the expanded
navigation geometry (20px icon, 12px gap, 32px row, 8px outer gutter). Native
panel rules exclude the collapsed rail. The macOS chrome uses the existing
surface palette and a lighter composer shadow; it does not change host layout
animations, window controls, or plugin navigation behavior. `test:desktop`
checks alignment at multiple sidebar widths and both selected-state palettes.
