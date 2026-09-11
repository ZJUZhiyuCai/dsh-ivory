# Contributing to Ivory

Thanks for helping make the DSH interface calmer and more dependable. Small,
well-evidenced changes are preferred over broad visual rewrites.

## Before you start

- Search existing issues and open a focused issue for behavior or design changes.
- Never attach real conversations, credentials, account details, or private paths.
- Keep the host entry point inert and avoid new runtime dependencies unless the
  benefit and trust-boundary impact are documented.
- Do not add third-party fonts, logos, screenshots, or icons without a clear
  redistribution license and attribution.

## Local setup

Ivory follows the same Node.js baseline as DeepSeek Harness.

```sh
git clone https://github.com/ZJUZhiyuCai/dsh-ivory.git
cd dsh-ivory
npm ci
npm test
```

For browser QA, link the checkout into a disposable or backed-up DSH web profile:

```sh
dsh plugin --profile web add link:$PWD
dsh web
DSH_QA_TOKEN='<token from the dsh web URL>' npm run qa:r2
DSH_QA_TOKEN='<token from the dsh web URL>' DSH_QA_FIXTURE_ONLY=1 npm run qa:activity
```

The browser suite expects DSH 0.1.2-rc.1 through 0.1.5 at
`http://127.0.0.1:3080`. Pass the per-run URL token through `DSH_QA_TOKEN`; set
`DSH_QA_CHROMIUM` when Chrome or Chromium is not installed in a standard path.

Alongside `qa:r2`, three narrower suites cover changes that the main regression
run does not isolate:

```sh
DSH_QA_TOKEN='<token>' npm run qa:host      # 10 pass/fail checks against the live host
DSH_QA_TOKEN='<token>' npm run qa:contract  # diagnostic probe: self-diagnosis + live selector inventory
DSH_QA_TOKEN='<token>' npm run qa:micro     # micro-component checks
```

Run `qa:contract` first when the theme silently falls back to token-only mode:
it prints the plugin's own `data-dshcs-compat` / drift channel and inventories
every selector family Ivory depends on against the running client, which is
usually enough to name the host change that broke the contract.

## Change workflow

1. Edit `src/skin.css`, `src/client.template.js`, or `src/markdown.js`.
2. Run `npm run build`; commit the resulting `lib/client.js`.
3. Run `npm test`.
4. For UI changes, run `npm run qa:r2` in light and dark mode and attach
   privacy-safe before/after screenshots to the pull request.
5. Explain any new selector, observer, storage key, asset, or permission.

Changes to the Markdown renderer also need a case in
`scripts/test-markdown.mjs`, and every renderer cap stays pinned by
`scripts/release-check.mjs`.

Do not hand-edit `lib/client.js`. It must exactly match the deterministic build.
DSH client bundles intentionally use its classic `window.__ModuleLoader__`
bootstrap rather than a Node-style module body.

## Design ledger

Visual decisions are not free-form. The palette, icon language, motion scale,
and every accepted exception — together with a round-by-round record of what
changed and why — live in a design ledger (`docs/AESTHETICS.md`). It is a
maintainer-local working document and is deliberately **not published**, so ask
a maintainer for the current canon before changing a token value, an icon, a
transition duration, or a deliberately hardcoded colour. The same commit must
carry the code change, the asserting check, and the ledger entry: a ledger that
drifts from the code invalidates the history it exists to preserve.

Do not link the ledger from published documentation — it is excluded from the
repository, and a release check fails if any packaged file references it.

## Pull request checklist

- [ ] The change has one clear purpose.
- [ ] `npm test` passes on a clean checkout.
- [ ] `lib/client.js` is regenerated and committed.
- [ ] Keyboard, 375px mobile, dark mode, and reduced motion were considered.
- [ ] No network, telemetry, host capability, or asset-license boundary changed
      without documentation.
- [ ] User-facing changes are reflected in both READMEs and `CHANGELOG.md`.
- [ ] `CHANGELOG.md` has an entry whose link block compares against the previous
      release; `[Unreleased]` still points at the newest released tag.
- [ ] Visual or token changes are recorded in `docs/AESTHETICS.md`.

By participating, you agree to keep discussion respectful, specific, and
welcoming. Maintainers may remove spam, harassment, private data, or unsafe
reproduction material.
