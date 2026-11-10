# Open `.jwpub` reader

Open-source (MIT) JWPUB reader that runs entirely in your browser: open a `.jwpub` file and read it
with the publication's own styling.

Everything happens on your computer. The file is unpacked, decrypted and rendered by the page
itself; nothing is uploaded and no data leaves your machine. The only network requests are for
the page and its static assets (scripts and fonts from a CDN).

## Development

- Scripts run on [Bun](https://bun.sh): `bun install` installs sass and the Sass parser the
  lint uses.
- `./build.sh` builds `crypto.wasm` (needs `JWPUB_KEY` and rustc with the
  `wasm32-unknown-unknown` target), `styles.css` and `_site/`.
- `bun run lint` checks the conventions of the Sass in `sass/` (`lint/lint.mjs`) and its formatting;
  `bun run lint:fix` formats it.

`styles.css` reproduces the jw.org stylesheet rule for rule; a change to the Sass must not
change the compiled CSS.
