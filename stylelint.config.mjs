// Lint and formatting for scss/ (npm run lint, npm run lint:fix).
// styles.css must stay rule-for-rule equal to the jw.org bundle (see README.md), so every
// rule that would rewrite the compiled CSS is off; what is left is layout and the project's
// own conventions.
export default {
  extends: "stylelint-config-standard-scss",
  plugins: ["@stylistic/stylelint-plugin"],
  rules: {
    // --- parity: these change the output -------------------------------------------------
    "media-feature-range-notation": null,
    "color-function-notation": null,
    "alpha-value-notation": null,
    "color-hex-length": null,
    "number-max-precision": null,
    "shorthand-property-no-redundant-values": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "declaration-block-no-duplicate-properties": null, // fixed value + var() override, as the original
    "selector-attribute-quotes": null, // [class*=dc-columns], as the original writes it
    "selector-not-notation": null, // :not(a):not(b) stays two pseudo-classes
    "no-descending-specificity": null, // the original's order
    "no-duplicate-selectors": null,
    "selector-class-pattern": null, // jw.org classes are camelCase (.du-bgColor)
    "value-keyword-case": null, // $data holds class names, language codes and font names
    "font-family-no-missing-generic-family-keyword": null, // icon fonts, as the original
    "scss/function-no-unknown": null, // sel(), px(), flip()… come from @use "lib"
    "scss/at-if-no-null": null, // "== null" reads better than "not" for optional arguments
    "declaration-block-single-line-max-declarations": null, // generated families are one rule per line

    // --- blank lines stay as written (split.py --convert writes the converted partials) ---
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "comment-empty-line-before": null,
    "scss/dollar-variable-empty-line-before": null,
    "scss/double-slash-comment-empty-line-before": null,

    // --- project conventions ----------------------------------------------------------------
    "selector-disallowed-list": [
      ["/\\.jwac(?![\\w-])/"],
      { message: "Wrap the rules in @include jwac { … } instead of writing .jwac" },
    ],
    "media-feature-name-disallowed-list": [
      ["min-width", "max-width"],
      { message: "Use @media #{$desktop} / #{$mobile} (…-only) from _lib.scss" },
    ],
    // vendor prefixes come from the _lib mixins; the fix would delete them and change the output
    "property-no-vendor-prefix": [true, { disableFix: true }],
    "value-no-vendor-prefix": [true, { disableFix: true, ignoreValues: ["sticky", "/gradient/", "transform"] }],

    // --- layout (fixed by lint:fix) --------------------------------------------------------
    "@stylistic/indentation": [2, { ignore: ["inside-parens"] }],
    "@stylistic/no-eol-whitespace": true,
    "@stylistic/no-missing-end-of-source-newline": true,
    "@stylistic/block-opening-brace-space-before": "always",
    "@stylistic/block-opening-brace-space-after": "always-single-line",
    "@stylistic/block-closing-brace-space-before": "always-single-line",
    "@stylistic/declaration-colon-space-after": "always-single-line",
    "@stylistic/declaration-colon-space-before": "never",
    "@stylistic/declaration-block-semicolon-space-after": "always-single-line",
    "@stylistic/declaration-block-trailing-semicolon": "always",
    "@stylistic/selector-list-comma-newline-after": "always-multi-line",
    "@stylistic/selector-combinator-space-before": "always",
    "@stylistic/selector-combinator-space-after": "always",
    "@stylistic/number-leading-zero": "never",
    "@stylistic/string-quotes": "double",
    "@stylistic/color-hex-case": "lower",
  },
  overrides: [
    {
      // the mixins that write the prefixed pairs, and the browser reset
      files: ["scss/_lib.scss", "scss/_elements.scss"],
      rules: { "property-no-vendor-prefix": null, "value-no-vendor-prefix": null },
    },
    {
      // app UI, not jw.org content
      files: ["scss/_app.scss"],
      rules: { "media-feature-name-disallowed-list": null },
    },
  ],
};
