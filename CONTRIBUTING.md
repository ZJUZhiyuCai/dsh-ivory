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
npm run qa:r2
```

The browser suite expects DSH at `http://127.0.0.1:3080`. Set
`DSH_QA_CHROMIUM` when Chrome or Chromium is not installed in a standard path.

## Change workflow

1. Edit `src/skin.css` or `src/client.template.js`.
2. Run `npm run build`; commit the resulting `lib/client.js`.
3. Run `npm test`.
4. For UI changes, run `npm run qa:r2` in light and dark mode and attach
   privacy-safe before/after screenshots to the pull request.
5. Explain any new selector, observer, storage key, asset, or permission.

Do not hand-edit `lib/client.js`. It must exactly match the deterministic build.
DSH client bundles intentionally use its classic `window.__ModuleLoader__`
bootstrap rather than a Node-style module body.

## Pull request checklist

- [ ] The change has one clear purpose.
- [ ] `npm test` passes on a clean checkout.
- [ ] `lib/client.js` is regenerated and committed.
- [ ] Keyboard, 375px mobile, dark mode, and reduced motion were considered.
- [ ] No network, telemetry, host capability, or asset-license boundary changed
      without documentation.
- [ ] User-facing changes are reflected in both READMEs and `CHANGELOG.md`.

By participating, you agree to keep discussion respectful, specific, and
welcoming. Maintainers may remove spam, harassment, private data, or unsafe
reproduction material.
