# Changelog

All notable changes to Ivory are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.5...HEAD
[0.2.5]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ZJUZhiyuCai/dsh-ivory/releases/tag/v0.1.0
