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
modules in DSH web 0.2.1-rc.1 and official desktop 0.2.1-rc.2. The build expands
exact class selectors to `:is(web, desktop)` in both the stylesheet and DOM
probes, retaining specificity without adding classes to host nodes. Unknown
classes are not guessed. Global main panels do not require a conversation or
composer; when the conversation is mounted its structural contract remains
mandatory. macOS rules preserve the host's title grid, traffic-light clearance,
and fully hidden sidebar.

The selector table records package-qualified CSS module identities for each Web
prefix. Desktop aliases are resolved by that identity and member, never by the
existence of a similarly named `root` or `label`. `derive:host` previews changes;
`--check` rejects drift and `--write` saves only a complete resolution.

DSH 0.2.1 keeps the same 21 CSS-module hashes but changes members and adds new
surfaces. Three seams were added for it: the account-menu trigger
(`AccountMenu.module.css`) that now owns the footer settings entry, the
`ChatView` running-state text that replaced `turnStatus`, and the sidebar
`topStrip`/`newSessionContent` members the macOS rules already expected. The
running indicator's `--dsw-alias-label-deep-diving*` tokens are remapped onto
the chrysanthemum palette, so 0.2.1's TextShimmer inherits Ivory's warm pulse
instead of the host's DeepSeek blue.

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
navigation geometry (20px icon, 12px gap, 32px row, 8px outer gutter), including
the wrapped New Chat label on both hosts. Native panel rules exclude the
collapsed rail. Navigation uses the lower neutral surface; the composer uses
a single border and a soft shadow in both themes. The macOS chrome preserves
host layout animations, window controls and plugin navigation behavior.

The center column provides an inline-size query container for the home
greeting. Its spacing follows viewport height, while narrow-pane typography
responds to the space actually left after sidebars. Conversation width and
content font-size remain host-owned. `test:desktop` checks the real shared
composer-stack/home classes and display-contents slot at short, narrow and
desktop sizes, plus focus stability, navigation alignment and reduced motion.


### Conversation typography and activity details

Assistant prose and the plugin-owned Markdown preview share semantic heading,
paragraph, list, quote and inline-code rules. Main/secondary font sizes still
come from the host preference axes. Native `.md-code-block` and
`data-code-block-banner` anchors receive a single frame and matching 16px
insets; no overflow clipping is applied to the outer block, preserving its
sticky header. Wrapping, numbered-line layout and syntax colors remain owned
by the host. Native file-reference controls receive the link accent within
the Markdown scope only.

Reasoning, Bash and generic tool rows use the same 28px base rhythm. The
collapsed reasoning root's size containment receives the matching height;
expanded details align with the 22px title column, dropping that inset on
small screens. Terminal font variables and IO labels retain the secondary
font-size preference. Expanded Bash shows its chevron alone in the 16px icon
column. New module members are recorded in the verified selector alias table.

`test-conversation.mjs`, called by `test:desktop`, builds synthetic conversations
with each installed host's actual Markdown, code, disclosure and terminal
styles. It exercises native code wrapping, overflow, enlarged fonts, focus,
reduced motion and forced colors in both themes. Optional screenshots/HTML are
written only under the local QA output directory; no real messages are used.

## Settings and overlay surfaces

The settings shell, appearance choices and font stepper resolve through the
verified Web/desktop module table. General setting text and selectors are
scoped to `settings.general.item`. On windows up to 600px, navigation becomes
a scrollable horizontal row; content keeps its own scroll area and the close
button stays outside it. Font-size arrows keep native increment handlers.

Menus use `data-menu-material` and menu-item roles for paint and spacing.
The host still owns anchors, portals, submenu bridges and keyboard handling;
Ivory never clips the outer menu. Shared modal classes are matched by their
local member names within dialog roles. Specialized dialog sizes and scrolling
remain native. Shortcut search shows its focus ring on the whole search field.

The always-available `SETTINGS_CSS` uses host-token fallbacks when Ivory is off,
and has independent reduced-motion/forced-colors rules. `test-overlays.mjs`
loads actual host CSS into disposable fixtures and checks narrow geometry,
submenus, focus frames, disabled controls and theme-off switch visibility.


## File previews and attachments

Right-sidebar chrome is scoped to `data-sidebar-right-panel` and Dockkit's
published tab/strip attributes. Ivory does not change dock placement, drag
handlers, width, floating geometry or macOS traffic-light clearance. Viewer,
attachment and deliverable modules resolve through the same verified alias
table (213 members across 37 module identities).

Native Markdown and the supported side-panel plugin share the conversation
heading, paragraph and embedded-code scale. Full-file code is scoped separately
so its scrollport and wrap preference remain native. Image transforms and
intrinsic dimensions are untouched. Preview toolbars keep paths readable; the
side-panel plugin moves the path to its own row below 400px and file search
below 340px. CodeMirror's virtualized line metrics are not modified.

Attachment names always reserve space for a 24px remove button. Upload progress
retains native proportions; failure borders and retry labels remain distinct.
Delivered files keep their independent open-in-app actions above the preview
hit area. The file-library plugin expands on a complete composer-dock row,
with sibling status controls allowed to wrap instead of collapsing vertically.

`test-files.mjs` uses installed host CSS for native components and a small
observed CSS layout fixture for the file-library plugin. It checks independent
scrolling, 320px panes, keyboard targets, filename stability, upload states,
image aspect ratio/zoom, code wrapping, font preferences and accessibility.
Live Web checks cover the installed side-panel and file-library integrations;
no file upload or provider invocation is required for this verification.
