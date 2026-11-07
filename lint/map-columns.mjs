// Aligns the values of table-like Sass maps (one "key: value" per line) in one column,
// one space after the longest key's colon. Lists and maps packed several entries per
// line are left alone. `node lint/map-columns.mjs` rewrites scss/; `--check` only reports.
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { regex } from "regex";

// Patterns in free-spacing mode (whitespace ignored, so a literal space is "\ ").
// A top-level map: from its "$name: (" line (maybe with a comment) to the line that closes it.
const MAP = regex("gm")`
  ^ (?<open> \$ [\w\-]+ : .* \( \ * (?: // .* )? \n )   # $families: (  // …
    (?<body> [\s\S]*? )                                  # the entries
  (?= ^ \) )                                             # up to the closing );
`;

// One entry of a table-like map: two-space indent, key, colon, then the value.
const ENTRY = regex`
  ^ (?<indent> \ {2} )
    (?<key> "[^"]*" | [\w\-]+ ) :
    \ + (?= \S )
`;

// A second "key:" on the same line: the map is packed, not a table.
const PACKED = regex`, \ * (?: "[^"]*" | [\w\-]+ ) : \ `;

const align = (body) => {
  const lines = body.split("\n");
  const keys = lines.map((line) => ENTRY.exec(line)?.groups.key).filter(Boolean);
  if (keys.length < 2 || lines.some((line) => PACKED.test(line))) return body;
  const width = Math.max(...keys.map((key) => key.length)) + 2;
  return lines.map((line) => line.replace(ENTRY, (...match) => {
    const { indent, key } = match.at(-1);
    return indent + `${key}:`.padEnd(width);
  })).join("\n");
};

const check = process.argv.includes("--check");
let dirty = false;
for (const file of globSync("scss/**/*.scss")) {
  const text = readFileSync(file, "utf8");
  const out = text.replace(MAP, (...match) => {
    const { open, body } = match.at(-1);
    return open + align(body);
  });
  if (out === text) continue;
  dirty = true;
  if (check) console.error(`${file}: map values not aligned (npm run lint:fix)`);
  else writeFileSync(file, out);
}
process.exit(check && dirty ? 1 : 0);
