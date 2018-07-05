# Changelog

## [0.4.0](https://github.com/HexRweb/GhostHunter-server/compare/v0.3.2...v0.4.0)

 - Changes:
  - snake_case client credentials for backend instantiation is deprecated. See #5. You can still use it until 1.x is released
  - calling `form.onsubmit` in the frontend is deprecated. Use `instance.submitted({{Event}}) instead. See #6. You can still use it until 1.x is released
  - the `before` in the frontend runs before the XHR request is sent. This wasn't an easy decision to make, but based on the usecase and parameters applied to the function, it makes more sense to call it there. This is technically a breaking change, although there should be no blowback.

 - Features:
  - :sparkles: [backend] - Add support to generate absolute URLs

## [0.3.2](https://github.com/HexRweb/GhostHunter-server/compare/v0.3.1...v0.3.2)

 - Fixes:
  - `includePages` will now include pages (what a novel idea!) in the index
  - The frontend map file will be useful from now on (the contents weren't persisted, which is apparently important!)

 - Backend
  - Lots of code formatting updates (We added XO / ESLint)
  - Dependency updates (no major breaking changes)
  - Make changelog prettier :lipstick:


## [0.3.1](https://github.com/HexRweb/GhostHunter-server/compare/v0.3.0...v0.3.1)

 - Add compiled frontend files

## [0.3.0](https://github.com/HexRweb/GhostHunter-server/compare/v0.2.0...v0.3.0)

 - :tada: Add frontend library

## [0.2.0](https://github.com/HexRweb/GhostHunter-server/compare/c47c0db...v0.2.0)

 - Properly follow semver (oops)
 - :tada: Add support for Authorized Origins in response

## [0.0.1](https://github.com/HexRweb/GhostHunter-server/tree/c47c0dbb2346b56b5b44dc95cecf7edf86322b15)

 - Initial release
 - Note: this release was messy, so it wasn't tagged or committed.