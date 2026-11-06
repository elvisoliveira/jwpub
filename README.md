# jwpub

A simple JWPUB reader in the browser.

## Development

- `npm ci` — installs sass and stylelint.
- `./dev.sh` — builds (`build.sh`), watches `scss/` and serves on `127.0.0.1:8000`. Asks for `JWPUB_KEY`.
- `npm run lint` / `npm run lint:fix` — checks and formats `scss/` (`stylelint.config.mjs`); CI runs the check.

`styles.css` is generated from `scss/` and reproduces the jw.org stylesheet rule for rule, in
its order; a change to the SCSS must not change the compiled CSS.
