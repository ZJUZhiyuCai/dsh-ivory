# Changelog

All notable changes to Ivory are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.17] - 2026-10-21

### Changed

- Refine the native plugin manager after comparing the installed Claude desktop:
  compact artwork frames, lightly divided rows, a clearer heading hierarchy,
  24px switches and consistent install-field focus in both themes.
- Let plugin details respond to the available panel width. Component status
  moves below the description in narrow panes; package identifiers and source
  values wrap without crowding controls or overflowing their cells.

### Fixed

- Render component descriptions in the interface font while keeping technical
  identifiers monospaced. Long descriptions no longer collapse into a thin
  column beside the status and switch.
- Keep source-code backgrounds within their cell when long package strings
  wrap, and retain a distinct error border on focused install fields.
- Limit native switch styling to manager-owned controls, preserving embedded
  plugin configuration controls and the existing selector-drift fallback.
- Add installed-host regressions for 320/375/520px panes, switch contrast,
  keyboard focus, reduced motion and forced colors. Document the separate
  theme preference that persists across plugin upgrades.

## [0.2.16] - 2026-10-20

### Changed

- Unify file previews, attachment cards and right-sidebar tabs with the same
  neutral surfaces, typography, control sizes and keyboard focus. Markdown
  previews share the conversation type scale; full-file code keeps a continuous
  reading surface, native wrapping, syntax colors and scrolling.
- Make file/search toolbars adapt to narrow panes. Keep long attachment names
  stable on hover and reserve room for permanent 24px remove controls.
- Let the expanded file library occupy a complete composer-dock row so sibling
  usage/status controls remain readable. Preserve image zoom and dock resizing.
- Add 120 isolated file-area checks using separate installed Web/desktop CSS,
  covering progress, errors, focus, narrow layouts, image zoom and accessibility.

- Refine the workspace against the installed Claude desktop interface: softer
  light-mode ink, a distinct navigation surface, clearer selected rows and
  lighter composer shadows in both themes. Muted text meets AA contrast on
  every neutral surface, including selected rows.
- Give the composer more breathing room, align its placeholder with typed
  text, and present workspace/preset choices as quiet controls. Preserve the
  host's font-size and conversation-width preferences.
- Adapt the home greeting to available window height and writing-pane width;
  narrow split views no longer crowd the greeting against the composer.

- Refine assistant prose and Markdown previews with a shared heading scale,
  paragraph rhythm, nested lists, inline code and understated links. Native
  file references now use the same theme accent.
- Give code blocks a consistent toolbar/content inset and a single quiet
  frame without clipping their sticky banner or changing native wrapping,
  syntax colors and line numbers.
- Align reasoning, generic tools and Bash on 28px rows; improve expanded
  terminal/IO readability, keyboard/touch targets and error hierarchy.
- Unify settings, menus and dialogs with neutral surfaces, restrained frames,
  clearer navigation and a consistent control rhythm. Settings navigation
  scrolls horizontally in narrow windows; the close button stays accessible.
- Simplify Ivory's own settings into divided rows, with larger switches that
  remain legible when the theme is disabled and honor reduced motion.

### Fixed

- Remove the duplicate focus frame inside shortcut search. Give modal text
  fields and menu items clear keyboard focus without clipping their outlines.
- Make both font-size arrows permanently available with separate 24px targets.
- Add installed-host overlay regressions for nested menus, small dialogs,
  narrow settings, theme-off switches and accessibility in both themes.
- Keep expanded Bash chevrons in the original icon column, removing the extra
  decorative glyph that shifted the title.
- Replace the obsolete Markdown link selector with current semantic scopes;
  resolve new tool classes by verified module identity on both hosts.
- Add privacy-safe conversation regressions with both installed renderers,
  covering narrow panes, long code, font preferences and accessibility.
- Prevent the shared composer-stack rule from overriding the home width cap.
- Align the wrapped New Chat label in Web as well as macOS.
- Exercise the real home slot structure in installed-host regression checks,
  including short windows, split views, focus geometry and reduced motion.

## [0.2.15] - 2026-10-17

### Fixed

- Adapt to DSH Web 0.2.1-rc.1 and desktop 0.2.1-rc.2. The running indicator is now a
  `TextShimmer` row; Ivory remaps the host's `--dsw-alias-label-deep-diving*`
  alias pair onto the chrysanthemum palette and keeps the clay glow, so "Deep
  diving…" no longer falls back to host blue. The 0.1.x `.EvIC1a_turnStatus`
  gradient stays for older Web hosts, so one build covers the supported range.
- Follow the 0.2.1 settings entry. The footer moves from a direct
  `SettingsRoot` trigger to the account-menu trigger (`AccountMenu.module.css`);
  both are styled, and the retired `.fThDlq_entryRow` / `.pXSMma_headlineText`
  selectors are gone.
- Route the macOS sidebar top strip and New Chat content through the alias
  table instead of a hardcoded desktop hash. Desktop renames now fail
  `derive:host` with the rest of the table instead of silently dropping the
  rules.
- Include the home workspace row's inline padding in its width, removing the
  horizontal scrollbar at narrow viewport sizes in both themes.
- Dismiss the initial "Get started" credential dialog through its explicit
  close button so fresh-profile browser QA can reach the settings menu.

### Changed

- Re-verify all 101 aliases and 22 CSS-module identities against Web
  0.2.1-rc.1 and desktop 0.2.1-rc.2, including the new account-menu trigger,
  `ChatView` running-state text, and `SidebarRoot` members, and refresh the
  versioned host snapshots.
- Accept `^0.2.1-rc.1` in the DSH peer ranges (rc.1 and rc.2) and track Web
  0.2.1-rc.1 and desktop 0.2.1-rc.2 in the host-version tests and documentation.
- Browser QA opens settings through the account menu on 0.2.x, keeps the legacy
  footer trigger path for older hosts, and switches appearance through
  "通用设置" before picking a theme cube.

## [0.2.14] - 2026-10-03

### Fixed

- Parse inline Markdown with monotonic delimiter searches and a shared work,
  node and time budget. Large or complex previews fall back atomically to source
  instead of blocking the interface or hiding a partially rendered document.
- Refresh previews after equal-length edits and after oversized content becomes
  small enough. Preserve source-view preference during edits, restore host
  titles on cleanup, and keep preview-generated code out of Markdown detection.
- Retire copy buttons with their source nodes. Detached code cannot be copied,
  and native copy controls that mount later replace Ivory's duplicate control.
- Keep settings and theme state consistent when storage reads or writes fail.
  In-memory preferences remain usable, and cross-tab updates refresh settings.
- Limit advisory drift checks to persistent children of the same mounted
  container. Normal task completion and conversation changes no longer warn.

### Changed

- Verify the actual selector table against committed, independently extracted
  Web/desktop module snapshots in default tests and release checks. Use
  `snapshot:host` to compare them with installed hosts after an upgrade.
- Run isolated browser regressions in `npm test`, CI and the publishing workflow.
  Optional workbench QA with no mounted targets reports skips, not successes.

## [0.2.13] - 2026-09-29

### Fixed

- Adapt the 21 named CSS modules used by Ivory to DSH desktop 0.2.0-rc.2,
  while retaining the Web 0.1.5-rc.1 selectors. Verify all 97 aliases by package,
  CSS module and member, including the AgentPresetLabel that was incorrectly
  mapped to an unrelated ReferenceChip label.
- Explicitly include the supported Web and desktop RC versions in the DSH
  peer ranges. Standard npm semver checks now cover prerelease and patch
  boundaries. The React peer accepts versions from 18.2.0 onward.
- Keep both collapsed hover chevrons and expanded up-arrows visible in
  reasoning/tool rows. Hide only the replaced decoration, and remove its
  pseudo-element when the real expanded control occupies that space.
- Re-tint both the Web matrix spinner and desktop StateDot through their shared
  `data-state="ongoing"` attribute.
- Remove the old Markdown preview when host syntax highlighting replaces its
  source with a nested wrapper. This prevents duplicate previews and copy
  controls that disappeared only after toggling the theme.
- Keep theme styling active when a global panel replaces the conversation.
- Route the current hero title through the shared alias table so both Web and
  desktop use the intended wide and narrow typography.
- Preserve macOS title-bar clearance and hidden-sidebar behavior, size New Chat
  to the actual sidebar width, and style the current hero title element.
- Align native Plugins and injected navigation with New Chat: shared 20px icons,
  32px rows, 8px outer gutters, and consistent selected states at any sidebar width.

### Changed

- Give the macOS sidebar its own neutral surface and soften the composer shadow
  using the existing light/dark palette. Keyboard focus and native window
  controls remain visible.
- `derive:host` resolves exact package-qualified module names. It previews changes
  by default, supports `--check`, and writes only a complete mapping with `--write`.
- Release checks scan source selectors, the alias table and the generated bundle
  for retired hashes. Six host-contract regression tests cover wrong-component
  mappings, ambiguous/missing modules, RC range boundaries and stale aliases.
- Installed-host regressions use separate desktop and Web styles, including the
  shared primitive styles, with 94 checks covering disclosure states and inputs.

## [0.2.12] - 2026-09-11

### Fixed

- **DSH 0.1.5 renamed the Conversation shell slot** `conversation` →
  `main.conversation` (re-homed under the root-scoped `main` entry). Ivory's
  runtime contract still required the bare `[data-slot="conversation"]`, which
  no longer exists, so `validateHostContract()` never succeeded and the skin
  fell back to **token-only mode** on every 0.1.5 client — colours and fonts
  applied while every structural rule (sidebar, composer, panels, chat flow,
  settings surfaces) stopped matching.

  The contract now accepts **both** spellings, and the same alias is used by the
  mutation-observer guard that previously could never re-validate. One build
  therefore supports the whole supported host range instead of degrading on
  whichever generation it is not pinned to. A new release check pins the
  dual-spelling contract and fails if a hardcoded legacy guard reappears.

  Diagnosis used the plugin's own self-diagnosis channel: the live client
  reported `body[data-dshcs-compat="pending"]`, then `token-only`, with 29
  `data-slot` values present and `conversation` absent.

### Changed

- Browser QA is now host-version-honest. `qa:r2`'s conversation helper treated a
  bare `.EvIC1a_column` as proof that a saved conversation had opened, but that
  column also mounts on the blank hero in 0.1.5 — so header/focus assertions
  measured an empty draft. It now waits for the conversation header to become
  visible, and the two assertions that had gone stale were corrected: the
  removed `.nL4_yW_sessionLogButton` (no longer present in any installed
  package) is no longer required, and the focus card's 100px height constant is
  replaced by the real invariants (shared axis, never wider than its column,
  content-driven height, fully on screen).

- **Documentation and package metadata now match the code.** Four claims had
  drifted: the `CHANGELOG` link block stopped at 0.2.8 and `[Unreleased]`
  compared from `v0.2.8` even though 0.2.9–0.2.12 were released; both READMEs
  still said "Ivory 0.2.8 is verified against DSH 0.1.2-rc.1" and counted "15
  static checks" (the gate now runs 21) and "30" adversarial checks (33); and
  `qa:contract` / `qa:host` existed in `package.json` without ever being
  documented. `package-lock.json` still advertised `0.2.8` while
  `package.json` said `0.2.12`, four releases out of step.

  Four new release checks now fail the build on this class of drift: the README
  compatibility note must match the manifest version, every released
  `CHANGELOG` heading must have a link definition with `[Unreleased]` based on
  the newest release, every `qa:*` script must appear in both READMEs, and
  `package-lock.json` must track the manifest version. A fifth rejects links to
  `docs/AESTHETICS.md`, which is a maintainer-local file that is never
  published.

  The two new browser entry points are documented with their scope:
  `qa:host` runs 10 pass/fail checks against the live host, and `qa:contract`
  is a diagnostic probe (no pass/fail) that prints the plugin's own
  self-diagnosis channel plus a live selector inventory — useful first step
  when the theme silently falls back to token-only mode.

- **Contributor documentation covers the current workflow.** `CONTRIBUTING.md`
  omitted `src/markdown.js` from the edit step, listed only DSH 0.1.2-rc.1 as
  the supported host, and did not mention the design ledger; `ARCHITECTURE.md`
  did not record the dual-spelling Conversation slot. Both are corrected, and
  the source files `src/markdown.js`, `scripts/test-markdown.mjs`, and
  `docs/AESTHETICS.md` no longer carry owner-only `600` permissions.

## [0.2.11] - 2026-09-10

### Added

- Report sub-selector drift, not just whole-surface drift. A family-level check
  fires only when an entire surface vanishes, so a single structural selector
  Ivory styles can rot while its parent survives — that is how
  `.fThDlq_entryRow` was lost, and how rc.1's matrix-spinner scope changed
  unnoticed. Eleven probes now watch the selectors Ivory depends on and write
  `body[data-dshcs-drift-probe]`.

  A probe reports only when it was **observed present earlier in the session**
  and has since disappeared, so a surface that simply has not mounted yet never
  raises a false positive. The channel is deliberately advisory — it never
  drives degradation, so a bad probe cannot drop the skin into token-only mode.
  Covered by three new adversarial checks.

### Changed

- Converge Ivory's motion vocabulary onto a two-step scale: **120ms for paint**
  (background-color, color, border-color, box-shadow) and **150ms for
  micro-motion** (transform, opacity). Ivory previously used 120/150/160ms for
  paint and 180ms for press transforms.

  The host's own 180ms reveal and 300ms layout steps are deliberately slower and
  are left alone — compressing structural animation reads as abrupt. A new
  release check pins the two-step scale.

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

[Unreleased]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.17...HEAD
[0.2.17]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.16...v0.2.17
[0.2.16]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.12...v0.2.16
[0.2.15]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.14...v0.2.15
[0.2.13]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.12...v0.2.13
[0.2.12]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.11...v0.2.12
[0.2.11]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.8...v0.2.9
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

[0.2.14]: https://github.com/ZJUZhiyuCai/dsh-ivory/compare/v0.2.13...v0.2.14
