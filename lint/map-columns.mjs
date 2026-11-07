// jwpub/map-columns: in a multi-line Sass map written as a table (one "key: value" per line),
// every value starts in the same column, one space after the longest key's colon:
//   $families: (
//     NotoSans:   $with-italics,
//     NotoSansKR: $regular-bold,
//   );
// Lists, one-line maps and maps packed several entries per line are left alone.
import stylelint from "stylelint";

const ruleName = "jwpub/map-columns";
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: (column) => `Expected the value to start at column ${column}`,
});

const ENTRY = /^(\s*)("[^"]*"|[\w-]+):\s+(\S.*)$/;   // indent, key, value
const PACKED = /,\s*("[^"]*"|[\w-]+):\s/;            // a second "key:" on the same line

// The table of a map's source lines: [{ line index, indent, key, value }], or null when
// the map is not written as a table.
function table(lines) {
  const opening = lines[0].replace(/\s*(\/\/.*|\/\*.*\*\/)\s*$/, "").trimEnd();   // "(" plus maybe a comment
  if (lines.length < 3 || !opening.endsWith("(")) return null;
  const entries = [];
  let indent = null;
  for (let i = 1; i < lines.length - 1; i++) {
    const m = ENTRY.exec(lines[i]);
    if (!m) continue;
    if (indent === null) indent = m[1];
    if (m[1] !== indent) continue;                    // a continuation line of the entry above
    if (PACKED.test(m[3])) return null;
    entries.push({ i, indent, key: m[2], value: m[3] });
  }
  return entries.length > 1 ? entries : null;
}

// The lines re-aligned: entry lines get their value at the column, the deeper-indented
// continuation lines of an entry move along with it. null when nothing changes.
function aligned(lines, entries, width) {
  const out = [...lines];
  let changed = false;
  for (const e of entries) {
    const m = ENTRY.exec(lines[e.i]);
    const expected = `${m[1]}${m[2]}:`.padEnd(m[1].length + width + 1) + m[3];
    if (lines[e.i] === expected) continue;
    changed = true;
    const shift = expected.indexOf(m[3]) - lines[e.i].indexOf(m[3]);
    out[e.i] = expected;
    for (let j = e.i + 1; j < lines.length - 1; j++) {
      const deeper = /^\s*/.exec(lines[j])[0].length > e.indent.length;
      if (!deeper || ENTRY.test(lines[j])) break;
      out[j] = shift > 0 ? " ".repeat(shift) + lines[j] : lines[j].replace(new RegExp(`^ {0,${-shift}}`), "");
    }
  }
  return changed ? out : null;
}

const rule = (enabled) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: enabled, possible: [true] })) return;
  if (!enabled) return;
  root.walkDecls(/^\$/, (decl) => {
    // postcss-scss keeps three copies of a value with // comments: value (comments blanked),
    // raws.value.raw (as /* */) and raws.value.scss (as written); all three get the same layout.
    const raws = decl.raws.value;
    const source = raws?.scss ?? raws?.raw ?? decl.value;
    const lines = source.split("\n");
    const entries = table(lines);
    if (!entries) return;
    const width = Math.max(...entries.map((e) => e.key.length)) + 1;   // key, colon, then one space
    const fixed = aligned(lines, entries, width);
    if (!fixed) return;
    stylelint.utils.report({
      ruleName,
      result,
      node: decl,
      message: messages.expected(entries[0].indent.length + width + 2),
      fix: () => {
        const value = aligned(decl.value.split("\n"), entries, width)?.join("\n") ?? decl.value;
        if (raws) {
          decl.raws.value = {
            value,
            raw: aligned(raws.raw.split("\n"), entries, width)?.join("\n") ?? raws.raw,
            ...(raws.scss ? { scss: fixed.join("\n") } : {}),
          };
        }
        decl.value = value;
      },
    });
  });
};

rule.ruleName = ruleName;
rule.meta = { fixable: true };
rule.messages = messages;
export default stylelint.createPlugin(ruleName, rule);
