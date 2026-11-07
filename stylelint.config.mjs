// Lint and formatting for scss/ (npm run lint, npm run lint:fix).
// styles.css must stay rule-for-rule equal to the jw.org bundle (see README.md), so every
// rule that would rewrite the compiled CSS is off; what is left is layout and the project's
// own conventions.
export default {
  extends: ["stylelint-config-standard-scss", "@stylistic/stylelint-config"],
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

    // --- blank lines stay as written -------------------------------------------------------
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

    // --- layout: @stylistic/stylelint-config, except -----------------------------------------
    "@stylistic/max-line-length": null, // a line is as long as it needs to be
    "@stylistic/selector-list-comma-newline-after": "always-multi-line", // h1, h2, > p { … } on one line
    "@stylistic/number-leading-zero": "never", // .5em, as the jw.org CSS writes it
    "@stylistic/indentation": [2, { ignore: ["inside-parens"] }], // maps and lists align as they like
    "@stylistic/block-closing-brace-newline-after": ["always", { ignoreAtRules: ["if", "else"] }], // } @else {
    "@stylistic/function-parentheses-newline-inside": null, // Sass maps passed to functions span lines
    "@stylistic/function-comma-newline-after": null,
  },
  overrides: [
    {
      // the mixins that write the prefixed pairs, and the browser reset
      files: ["scss/lib/_index.scss", "scss/content/_elements.scss"],
      rules: { "property-no-vendor-prefix": null, "value-no-vendor-prefix": null },
    },
    {
      // app UI, not jw.org content
      files: ["scss/app/_index.scss"],
      rules: { "media-feature-name-disallowed-list": null },
    },
    {
      // U+ in the unicode-range lists is not an operator
      files: ["scss/app/_fonts.scss"],
      rules: { "scss/operator-no-unspaced": null },
    },
  ],
};
