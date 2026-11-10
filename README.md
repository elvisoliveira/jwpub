# Open `.jwpub` reader

Open-source (MIT) JWPUB reader that runs entirely in your browser: open a `.jwpub` file and read it
with the publication's own styling.

Everything happens on your computer. The file is unpacked, decrypted and rendered by the page
itself; nothing is uploaded and no data leaves your machine. The only network requests are for
the page and its static assets (scripts and fonts from a CDN).

## Development

- `npm ci` installs sass and the Sass parser the lint uses.
- `./build.sh` builds `crypto.wasm` (needs `JWPUB_KEY` and rustc with the
  `wasm32-unknown-unknown` target), `styles.css` and `_site/`.
- `npm run lint` checks the conventions of `scss/` (`lint/lint.mjs`) and its formatting;
  `npm run lint:fix` formats it.

`styles.css` reproduces the jw.org stylesheet rule for rule; a change to the SCSS must not
change the compiled CSS.
