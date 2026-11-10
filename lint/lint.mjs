// The project's conventions, checked on the Sass syntax tree (`bun run lint`).
// Nothing here looks at layout; lint/format.mjs covers the little that is enforced.
import { Glob } from "bun";
import { sass } from "sass-parser";

const PREFIXED = /-(?:webkit|moz|ms|o)-[\w-]+/g;
const PREFIXED_VALUES_ALLOWED = /sticky|gradient|transform/;  // no unprefixed twin in the original
// One simple compound, with an optional leading combinator: h1, .chart, &.rule, > p, #{$x}.
const SIMPLE = /^(?:[>+~] )?[&*]?(?:[.#]?[\w-]+|#\{[^}]*\})*$/;

// Files that may break a convention: the mixins that write the prefixed pairs, the browser
// reset, and the app UI (not jw.org content).
const EXEMPT = {
  "scss/lib/_index.sass":        ["prefix"],
  "scss/content/_elements.sass": ["prefix"],
  "scss/app/_index.sass":        ["media"],
};

// A node as written in its file (the tree itself normalizes numbers and line breaks).
const written = (node) => node.source.input.css.slice(node.source.start.offset, node.source.end.offset);

// What opens a block: its selector list (every line ending in a comma, and the one after)
// or at-rule parameters.
const head = (node) => {
  const lines = written(node).split("\n");
  return lines.slice(0, lines.findIndex((line) => !line.trimEnd().endsWith(",")) + 1).join("\n");
};

// "a, b:not(c, d)" → ["a", "b:not(c, d)"]
const selectors = (list) => {
  const out = [""];
  let depth = 0;
  for (const char of list) {
    depth += (char === "(") - (char === ")");
    if (char === "," && depth === 0) out.push("");
    else out[out.length - 1] += char;
  }
  return out.map((selector) => selector.trim()).filter(Boolean);
};

// One selector per line; a list of simple compounds (h1, h2, > p) may share one.
const crowded = (selector) => selector.split("\n").some((line) => {
  const parts = selectors(line);
  return parts.length > 1 && !parts.every((part) => SIMPLE.test(part));
});

const checks = {
  rule(node, report) {
    const selector = head(node);
    if (/\.jwac(?![\w-])/.test(selector)) report("jwac", "wrap the rules in @include jwac instead of writing .jwac");
    if (crowded(selector))
      report("selectors", "one selector per line (only simple compounds may share one)");
  },
  decl(node, report) {
    const [prop, ...rest] = written(node).split(":");
    const value = rest.join(":");
    const prefixed = (value.match(PREFIXED) ?? []).filter((name) => !PREFIXED_VALUES_ALLOWED.test(name));
    if (prop.startsWith("-") && !prop.startsWith("--") || prefixed.length)
      report("prefix", "vendor prefixes come from the lib mixins (display, webkit, font-smoothing…)");
    if (/(?<![\w.#-])0\.\d/.test(value)) report("zero", "no leading zero (.5em, as the jw.org CSS writes it)");
  },
  atrule(node, report) {
    if (node.name === "media" && /(?:min|max)-width/.test(head(node)))
      report("media", "use @media #{$desktop} / #{$mobile} (…-only) from lib");
  },
};

let failed = false;
for (const file of [...new Glob("scss/**/*.sass").scanSync()].sort()) {
  const exempt = EXEMPT[file] ?? [];
  sass.parse(await Bun.file(file).text()).walk((node) => checks[node.type]?.(node, (check, message) => {
    if (exempt.includes(check)) return;
    failed = true;
    console.error(`${file}:${node.source.start.line}: ${message}`);
  }));
}
process.exit(failed ? 1 : 0);
