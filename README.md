<h1 align="center">Ivory for DSH</h1>

<p align="center">
  <strong>A calm, warm-neutral interface for DeepSeek Harness.</strong><br>
  Light and dark. Desktop and mobile. English and Chinese. Zero telemetry.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-ivory"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-ivory?style=flat-square&color=383835"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/actions/workflows/ci.yml"><img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/ZJUZhiyuCai/dsh-ivory/ci.yml?branch=main&style=flat-square&label=CI"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/releases/latest"><img alt="latest release" src="https://img.shields.io/github/v/release/ZJUZhiyuCai/dsh-ivory?style=flat-square&color=6f6d68"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-111111?style=flat-square"></a>
  <img alt="zero telemetry" src="https://img.shields.io/badge/telemetry-none-2f855a?style=flat-square">
</p>

<p align="center">
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/README_zh-CN.md">简体中文</a>
  · <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/SECURITY.md">Security</a>
  · <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/CHANGELOG.md">Changelog</a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/hero-dark.png">
  <img alt="Ivory for DSH home screen" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/hero-light.png" width="1440">
</picture>

Ivory gives the DSH web interface a quieter reading rhythm without changing how
the harness works. Warm neutrals replace cold grays, editorial type improves
long responses, and the conversation stays usable from a narrow phone window
to a wide desktop. DeepSeek branding and every native DSH capability remain in
place.

## Quick start

```sh
dsh plugin --profile web add dsh-ivory
dsh web
```

Hard-refresh the page with `Cmd/Ctrl + Shift + R`, then open
**Settings → Ivory Theme**. The main theme is enabled by default; the optional
focus mode stays off until you choose it.

<details>
<summary><strong>Pin a release or uninstall</strong></summary>

Install the exact GitHub release without using npm.

```sh
dsh plugin --profile web add github:ZJUZhiyuCai/dsh-ivory#v0.2.6
```

Remove Ivory and return to the native DSH interface.

```sh
dsh plugin --profile web remove dsh-ivory
```

</details>

## Made for everyday DSH

| Area | What Ivory changes |
| --- | --- |
| **Appearance** | A complete warm-neutral palette for light and dark mode, with restrained shadows, corners, and editorial typography. |
| **Responsive layout** | Fluid conversation geometry tested at 375, 768, 1,440, and 1,920 pixels. |
| **Reading and copying** | Independent controls for prose, user bubbles, and code blocks, plus a small end-of-response marker. |
| **Markdown documents** | A bounded, DOM-built preview for `.md` output with source view always available and HTTP(S)-only links. |
| **Accessibility** | Keyboard focus, reduced-motion behavior, forced-colors fallbacks, and WCAG AA muted text contrast. |
| **Compatibility** | Structural styling degrades to stable theme tokens when the verified DSH selector contract changes. |

## A closer look

<table>
  <tr>
    <td width="72%"><img alt="Ivory conversation view on desktop" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/conversation-light.png"></td>
    <td width="28%"><img alt="Ivory conversation view on mobile" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/mobile-light.png"></td>
  </tr>
  <tr>
    <td align="center"><sub>Focused desktop conversation</sub></td>
    <td align="center"><sub>390 px mobile layout</sub></td>
  </tr>
</table>

## Quiet by design

Ivory is a browser-only visual plugin. Its host entry point is intentionally
inert.

| Boundary | Ivory behavior |
| --- | --- |
| Bundled runtime dependencies | None. DSH client modules and React are peers. |
| Filesystem and process access | None. |
| Network requests and telemetry | None. |
| Persistent data | Two local preference flags in `localStorage`. |
| User content | Presented in the browser; copied only after an explicit click. |
| Third-party branding | No Anthropic fonts, logos, icons, or application code. |

The npm package contains eight allowlisted files and is checked on every CI
run. Read the full [security policy](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/SECURITY.md),
[architecture boundary](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/docs/ARCHITECTURE.md),
and [third-party notices](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/THIRD_PARTY_NOTICES.md).

> [!NOTE]
> DeepSeek Harness is in developer preview and may make breaking UI changes.
> Ivory 0.2.x is verified against DSH 0.1.0-rc.7 with the current 0.1.0-rc.8
> web client modules. When Ivory cannot prove the current structural contract,
> it keeps token-level theming and releases the host layout back to DSH.

<details>
<summary><strong>Quality and release checks</strong></summary>

```sh
npm ci
npm test          # renderer unit tests, then 14 static, build, publint, and package checks
npm run qa:r2     # 73 browser regressions; DSH must run at 127.0.0.1:3080
npm run qa:adversarial  # 29 stress checks: reconciliation safety, toggle/resize storms, degraded mode
npm run qa:activity     # 16 checks for thinking/tool-call rows, icons, and terminal polish
npm run qa:micro        # 28 Vision Toolkit/Ivory micro-component checks; set DVT_CLIENT_JS if the toolkit is not installed in the DSH web profile
```

The browser suite covers responsive layout, composer focus, dark mode,
Markdown injection attempts, streaming state, lifecycle cleanup, block-copy
payloads, plugin coexistence, long tables, reduced motion, and forced colors.

Releases use npm Trusted Publisher with GitHub OIDC. The repository stores no
long-lived npm publish token, and future CI releases receive npm provenance
automatically.

</details>

<details>
<summary><strong>Development</strong></summary>

```sh
npm ci
npm run build

dsh plugin --profile web add link:$PWD
dsh web
```

Edit `src/skin.css`, `src/client.template.js`, or `src/markdown.js`, then run `npm run build`.
The generated `lib/client.js` is committed so GitHub installs need no build
permission.

```text
src/skin.css             theme and compatibility styles
src/client.template.js   client lifecycle and optional enhancements
src/markdown.js          capped DOM-built Markdown preview renderer
scripts/test-markdown.mjs  renderer unit tests (node --test)
lib/client.js            deterministic generated browser bundle
lib/index.js             inert host entry point
cordis.patch.yml         DSH bundle registration
scripts/                 build and verification gates
```

See [CONTRIBUTING.md](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/CONTRIBUTING.md)
before opening a pull request.

</details>

## Independent community project

Ivory is unofficial and is not affiliated with, endorsed by, or sponsored by
Anthropic or DeepSeek. Claude is a trademark of Anthropic PBC. DeepSeek and
DeepSeek Harness may be trademarks of their respective owners.

Released under the [MIT License](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/LICENSE).
