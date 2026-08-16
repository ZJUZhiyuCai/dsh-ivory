# Security policy

## Supported versions

Security fixes are released for the latest published version of Ivory. Because
DeepSeek Harness is currently a developer preview, compatibility fixes may also
require upgrading DSH to its latest release candidate.

## Reporting a vulnerability

Please use
[GitHub private vulnerability reporting](https://github.com/ZJUZhiyuCai/dsh-ivory/security/advisories/new).
Do not open a public issue for an unpatched vulnerability or include private
DSH conversations, credentials, filesystem paths, or screenshots in a report.

Include the Ivory version, DSH version, browser, minimal reproduction, expected
impact, and whether the issue works with all other plugins disabled. You should
receive an initial response within seven days. Confirmed issues will be tracked
privately until a fix and advisory are ready.

## Security boundary

Ivory deliberately keeps a narrow boundary:

- `lib/index.js` is an inert host entry point and imports no Node.js APIs.
- The plugin performs no network requests and includes no telemetry.
- No Anthropic assets or remote fonts are loaded.
- The only persistence is two local preference flags in `localStorage`.
- Markdown preview uses DOM construction and text nodes, rejects non-HTTP(S)
  links, adds `noopener noreferrer`, and falls back to source for oversized
  documents.
- Disabling the theme removes its observers and injected nodes.
- `npm test` verifies source/bundle reproducibility, forbidden browser and host
  capabilities, package metadata, and an explicit tarball file allowlist.

This policy covers Ivory itself. Vulnerabilities in DeepSeek Harness or another
plugin should be reported to that project's maintainers.
