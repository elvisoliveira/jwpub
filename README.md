# jwpub

A simple JWPUB reader in the browser.

## Development

- `npm ci` — installs sass and stylelint.
- `./dev.sh` — builds (`build.sh`), watches `scss/` and serves on `127.0.0.1:8000`. Asks for `JWPUB_KEY`.
- `npm run lint` / `npm run lint:fix` — checks and formats `scss/` (`stylelint.config.mjs`); CI runs the check.

`styles.css` is generated from `scss/` and must stay rule-for-rule equal to the jw.org bundle;
the parity check and its reference CSS are the maintainer's local tools, so changes to the
SCSS are checked for parity before merging. `_content.scss`, `_elements.scss` and the
`_du-*`/`_dc-*` partials marked "Written by split.py --convert" are generated: an edit to them
has to be carried over to the converter, so say so in the pull request.
