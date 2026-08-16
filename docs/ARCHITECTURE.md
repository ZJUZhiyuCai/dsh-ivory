# Architecture and trust boundary

Ivory is intentionally smaller than a typical DSH plugin. The host half exists
only because the bundle registry expects a package entry point; all useful work
happens inside the DSH browser client.

## Package faces

| Face | File | Responsibility |
| --- | --- | --- |
| Host | `lib/index.js` | Exports the package name and an empty `apply()` |
| Client source | `src/client.template.js` | Lifecycle, settings, safe preview, turn marker |
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
2. a small selector contract checks that the current frame can accept structural
   enhancements;
3. narrow observers enhance new Markdown blocks, completed assistant turns, and
   composer clearance;
4. cleanup disconnects every observer and removes every injected node when the
   theme is disabled or unloaded.

If the selector contract cannot be proven after a bounded retry period, Ivory
adds a mismatch state and keeps only token-level styling. This prefers a less
complete theme over a broken host layout.

## Markdown preview

The preview is intentionally not a general Markdown/HTML engine. It supports a
small presentation subset using `createElement`, `createTextNode`, and explicit
attributes. Raw HTML remains text. Link parsing accepts only absolute HTTP(S)
URLs and rejects control characters and attribute delimiters. Source view is
always reachable, and inputs above 250,000 characters are not previewed.

## Assets and typography

Ivory uses platform sans, serif, and monospace stacks. No remote request or font
binary is involved. The small response marker is an inlined SVG adapted from
the MIT-licensed DSH whale; its notice is retained in
`THIRD_PARTY_NOTICES.md`.

## Build and release invariants

`scripts/build.mjs` combines the source template, CSS, and whale SVG without a
bundler. `scripts/release-check.mjs` independently recreates the artifact and
requires byte equality. `scripts/verify-pack.mjs` then rejects any tarball file
outside the explicit release manifest as well as unexpected package growth.

Any future feature that needs a network request, host service, secret, new
persistent field, runtime dependency, or third-party asset changes this trust
boundary and should receive explicit security and documentation review.
