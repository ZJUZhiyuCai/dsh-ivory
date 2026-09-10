# Changelog

All notable changes to Ivory are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.10] - 2026-09-10

### Fixed

- Re-ink the host's running-state spinner at the source. rc.1 builds it from
  `svg._matrix_43g9j_4` with eight `rect._cell_43g9j_56` cells
  (`fill: currentColor; opacity: .15`) and colours it through
  `--dsh-state-ongoing: var(--dsw-static-deepseek-450)` — a **static** brand
  blue, which is why the leak measured identically in light and dark.
  The previous fix re-tinted `color` only, and only inside the Bash tool row;
  the host now reuses the same component as the **sidebar session-row running
  indicator**, which that scope never covered.

  The rule now overrides the source custom property and the cell fill, so
  every current and future placement is covered, and the dot-chase motion is
  untouched.

## [0.2.9] - 2026-09-10

### Fixed

- Clear the 24px touch-target floor in the composer control row. The host's
  file-upload pair (`.dsh-files-btn`) ships at 22x22 — the only interactive
  element still under the invariant when measured at 375/768/1440/1920. Both
  buttons now measure 24x24, and no sub-24px target remains anywhere in the UI.

## [0.2.8] - 2026-09-04

### Added

- Add a browser regression for DSH 0.1.2-rc.1's adaptive and draggable
  conversation-width axis.
- Verify 74 layout/behavior regressions, 26 activity-row checks, 30
  adversarial lifecycle checks, and 28 micro-component checks against an
  isolated DSH 0.1.2-rc.1 Web profile.

### Changed

- Port every native layout, sidebar, conversation, composer, message, tool,
  and activity-row selector to the CSS-module contract shipped by DSH
  0.1.2-rc.1.
- Let the host own `--dsh-chat-content-width` again, so rc.1's adaptive default
  and persisted drag preference resize the transcript, composer, docks, turn
  navigator, and usage controls together.
- Keep Ivory's serif/sans/mono typography while routing conversation prose,
  user bubbles, the composer, Markdown previews, and activity rows through
  rc.1's 12–17px conversation font-size axis.
- Restore the host's 8px scrollbar measurement in normal mode so overlay
  composer seats stay aligned; only zero it when Ivory focus mode actually
  hides the scrollbar.
- Replace the retired `dsh-client-runtime` activation edge with
  `dsh-client-ui-renderer`, drop the static `dsh-client-ui-slots` graph edge,
  and set the optional DSH peer floor to 0.1.2-rc.1.
- Let activity QA opt into a fixture-only path that exercises rc.1's generated
  classes without creating a conversation or making a model request.

### Fixed

- Validate generated structural sentinels as well as stable `data-slot`
  anchors, including conditional chat, assistant, reasoning, Bash, and generic
  tool families when those surfaces are mounted. A future hash-only DSH
  release now enters token-only mode instead of reporting a false-positive
  compatible state while structural rules miss.
- Retarget Markdown previews, per-block copy controls, streaming guards, and
  response-end markers to rc.1's assistant and user-message surfaces.
- Bind a workspace before composer-dependent browser QA. rc.1 renders the
  composer inert (`data-phase="inert"`, `contenteditable="false"`) until a
  workspace is chosen, so `qa:r2` and `qa:activity` could not type at all in a
  cold context. `openPage` now selects the workspace the host marks as
  selected, and the conversation walk waits for the sidebar tree to hydrate
  and re-snapshots its row count as rows stream in.

## [0.2.7] - 2026-08-29

### Added

- Add browser regression coverage for the plain-text fenced Markdown heuristic,
  including a positive document preview case and a false-positive guard for
  ordinary long text notes.
- Verify the full browser QA suite (r2-fixes 70/70, verify-activity 24/24,
  adversarial 29/29, verify-fixes, micro-components 28/28) live on DSH
  0.1.2-alpha.1; the QA helpers now accept the auth token via `DSH_QA_TOKEN`.

### Changed

- Migrate the selector contract to DSH 0.1.2-alpha.1, which replaced per-build
  CSS-module hashes with a stable slots system (`data-slot="root"`,
  `data-slot="sidebar"`, `data-slot="conversation"`, `data-slot="details"`).
  The contract check now anchors on the two slot seams with class-level
  fallbacks, and every hardcoded host class in the skin is re-mapped to the
  new build. Compat verification (`dshcs-compat = ok`) no longer degrades to
  token-only mode on the new host.
- Restyle the new single-contenteditable composer (0.1.2 removed the
  textarea/mirror/backdrop layer trick): draft text paints directly on
  `.hYB0Yq_input` in `--cl-ink` with the PingFang-first `--cl-input` stack,
  and the hint is a sibling `.hYB0Yq_placeholder` in muted ink. The old
  ghost-layer exposure check in the browser QA is replaced by an assertion
  that no backdrop/mirror layer exists and the placeholder is not visible
  while typing.
- Outrank the host theme's alias-token block: `--dsw-alias-*` is now mapped on
  `body.dsh-ivory:not([data-ds-dark-theme])` and
  `body.dsh-ivory[data-ds-dark-theme]` (both 0,2,1) so the Ivory page
  background (#151515 dark, #fcfcfb light) wins over whichever
  design-platform.css block injects later.
- Retire the outline/TOC surface styling and its
  `--dshcs-composer-clearance` machinery: DSH 0.1.2 removed the floating
  outline panel (`d5Qffq_*`), so the ResizeObserver that tracked the composer
  top (and the QA checks that pinned it) are removed with it.
- Drive the chat column width from the host's content-width axis
  (`--dsh-chat-content-width: 720px`) and drop the old scrollbar-gutter
  overrides that fought the new scroll containers.
- Refresh README screenshots for the latest Ivory visual language.
- Restyle the "Deep diving…" turn status from a muted-ink sheen to a
  chrysanthemum/clay gradient with a faint clay glow (light `#a94a25`,
  dark `#e88b62`, both WCAG AA on the page background).
- Redraw every activity-row icon as one 16px, 1.1px-stroke currentColor mask
  set from an external Claude-family design pass: an organic seven-curve spark
  with an open center for think, compact open wrench for tool
  call, rx-2 terminal with wide prompt for bash, dog-ear document with stepped
  lines for read, clear-lens magnifier for glob, and an S-curve tab folder for
  the sidebar. Idle icons move from muted to ink-strong so the rows read more
  substantial.
- Unify composer typography on `--cl-input` (PingFang SC first) for the
  textarea, backdrop, and mirror, removing the Latin/CJK font split inside the
  input box.

## [0.2.6] - 2026-08-20

### Added

- Extract the Markdown preview renderer into `src/markdown.js` (spliced into
  the client bundle by `scripts/build.mjs`) and add `scripts/test-markdown.mjs`,
  a node:test unit suite covering inline parsing, link allowlisting, raw-HTML
  neutrality, container caps, table scoping, and depth limits. It runs first in
  `npm test` and therefore in CI on every matrix node.

### Changed

- Extend the selector-contract watchdog beyond the frame pair: the sidebar
  surface is tracked as a selector family (it exists in every app-shell view),
  and its disappearance is reported through `body[data-dshcs-drift]` plus one
  throttled console warning instead of failing silently. The composer and
  conversation surfaces act as candidate nodes that trigger a throttled
  re-check; healthy contracts also re-check on theme flips, bounded to one
  probe per five seconds.
- Tighten native copy-control detection so only exact copy verbs (复制/copy/
  copied 及代码变体) suppress Ivory's per-block copy buttons; "Copy project"-
  style labels in unrelated panels no longer do.
- Render image syntax in the Markdown preview as its alt text instead of
  leaking the leading `!`, and add `scope="col"` to preview table headers.

## [0.2.5] - 2026-08-20

### Changed

- Replace the thinking/tool running spinner with a quiet, evenly lit halo ring
  that settles to a static cue while a thinking row is expanded, removing the
  boomerang-style single-side rotating border at small sizes. The activity QA
  now asserts the halo shape, low animation noise, and near-static
  reduced-motion behavior.
- Restyle the Vision Toolkit (`@anionex/dsh-vision-toolkit`) chat cards to
  Ivory's visual language: 8px tool cards with hairline borders and no
  shadows, neutral ink icons, quiet checkerboard artifact previews, small
  bordered download buttons, stable mono-labeled color palettes, desaturated
  warm diff-score ramps, and composer-matched paste chips. Overrides are
  prefixed with the Ivory body scope and survive the plugin injecting its own
  stylesheet after Ivory's.
- Polish micro-components across the toolkit panel: cornered status badges,
  desaturated alert banners, neutral form fields, and health-grid status
  colors with light/dark variants.
- Verify compatibility with DSH 0.1.0-rc.7 and the current 0.1.0-rc.8 web
  client modules, making the DSH peer range explicit while retaining rc.6
  compatibility.
- Harden token-only selector-contract recovery so degraded mode only re-probes
  when newly added DOM contains likely host frame nodes.
- Update activity-row styling for rc.8 chevron-only tool/thinking rows and make
  the activity QA independent of live model execution timing.

### Fixed

- Re-inject the Ivory stylesheet when theme flips or host repaints remove the
  `data-plugin-css` style tag, keeping `--cl-page` stable at `#fcfcfb` in
  light mode. Contract re-probes stay gated to theme/head signals so class
  rewrites cannot trigger scan storms (adversarial storm test included).

## [0.2.4] - 2026-08-18

### Fixed

- Restore the Ivory body class automatically if the host rewrites
  `document.body.className` during appearance or session transitions, preventing
  the light theme from falling back to the native white page background.

## [0.2.3] - 2026-08-18

### Changed

- Polish DSH thinking and tool-call activity rows with Claude-style compact
  typography, paint-only mask icons for thinking and bash calls, quiet
  running/error states, refined expanded terminal panels, and reduced-motion
  coverage.

## [0.2.2] - 2026-08-18

### Fixed

- Stop reparenting host-owned code `<pre>` nodes for per-block copy controls:
  the copy button is now inserted as a sibling with only a class marker on the
  parent, so DSH/React re-renders (theme switches and skin toggles) no longer
  throw `NotFoundError` and drop the Ivory styling.
- Rebuild the Markdown preview when the host swaps or edits a source block in
  place instead of leaving a stale or duplicate preview.
- Remove the resize listener with the same throttled callback it was
  registered with, and reset per-panel bookkeeping when the skin is disabled.
- Re-probe a token-only selector contract on added-node mutations at most once
  every five seconds instead of scanning on every mutation batch.

## [0.2.1] - 2026-08-17

### Changed

- Make npm the recommended install path and move the release workflow to npm
  Trusted Publisher, so future releases use GitHub OIDC without a stored npm
  token.
- Redesign both README front pages with a centered project header, compact
  feature and trust sections, a responsive screenshot gallery, and absolute
  image URLs that also render on npm.
- Rename the localized README so npm consistently selects the English
  `README.md` as the package front page.

## [0.2.0] - 2026-08-17

### Added

- Add independent copy controls for prose paragraphs, user text bubbles, and
  code blocks, including exact code whitespace, accessible success/error
  feedback, and a selection-based fallback when Clipboard API access fails.
- Add English and Simplified Chinese strings through DSH's locale service for
  settings, copy feedback, and Markdown preview controls.

### Changed

- Declare the DSH client modules and React peer contract used by the browser
  bundle so package managers and plugin reviewers can verify compatibility.

### Fixed

- Gate every host-dependent structural style behind the validated selector
  contract, making the documented token-only degradation actually take effect
  when the DeepSeek Harness UI changes.
- Raise the light-theme muted text color to WCAG AA contrast and remap the
  drop mask for dark mode.
- Cap Markdown preview recursion, inline nesting, list, table, and paragraph
  growth so oversized or pathological `.md` files cannot exhaust the browser.
- Refresh the settings side-card suite and neutral styles for the current DSH
  `_2vuxea` markup while keeping the previous `Pz1RTq` selectors as fallback.
- Defer message copy controls until streaming completes so Ivory never inserts
  buttons into React-owned Markdown while the host is still updating it.
- Revalidate the structural selector contract when a valid DSH frame appears
  after an unsupported or stale session route.

## [0.1.2] - 2026-08-16

### Fixed

- Recolor the hero preview badge with theme-relative neutral tokens, removing
  the fixed blue fill and restoring strong dark-mode contrast.

## [0.1.1] - 2026-08-16

### Fixed

- Keep the composer send button visually identical before and after text entry
  in both light and dark themes; only its functional disabled state changes.

## [0.1.0] - 2026-08-16

### Added

- Complete warm-neutral light and dark themes for DSH web.
- Responsive home, sidebar, conversation, composer, and settings layouts.
- Optional focus mode with reversible auxiliary-panel hiding.
- Safe Markdown document preview with source/preview switching.
- Ink-colored whale marker shown only after an assistant turn completes.
- Compatibility contract with token-only degradation.
- Reduced-motion, forced-colors, keyboard focus, mobile overflow, and plugin
  coexistence handling.
- Fifty-seven browser regressions plus deterministic build and package gates.

### Security and release hygiene

- Inert host entry point with no Node.js capabilities.
- Zero network requests, telemetry, and production dependencies.
- System font stacks; no Anthropic binaries or application assets.
- Explicit npm file allowlist, MIT license, third-party notices, and bilingual
  documentation.

[Unreleased]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.8...HEAD
[0.2.8]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ZJUZhiyuCai/dsh-ivory/releases/tag/v0.1.0
