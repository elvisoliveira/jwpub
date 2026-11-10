#!/usr/bin/env bash
# Builds the site into _site/: crypto.wasm (the key comes from JWPUB_KEY at compile time),
# styles.css from scss/, then the published files. Run by dev.sh and the Pages workflow.
# Needs rustc with the wasm32-unknown-unknown target and bun (after bun install).
set -euo pipefail
cd "$(dirname "$0")"
: "${JWPUB_KEY:?JWPUB_KEY (64 hex digits) is not set}"

rustc --target wasm32-unknown-unknown -C opt-level=z -C panic=abort \
    --crate-type cdylib crypto.rs -o crypto.wasm
bun run --silent css
rm -rf _site && mkdir _site && cp index.html jwpub.js ui.js styles.css crypto.wasm favicon.ico _site/
