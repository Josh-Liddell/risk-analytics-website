// Enforces the Utah Design System token rules from .cursor/rules/utah-design-system.mdc
export default {
  customSyntax: 'postcss-scss',
  rules: {
    'color-no-hex': [true, { message: 'Use a UDS color token such as var(--primary-color); hex values belong only in the theme block of main.scss.' }],
    'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla'], { message: 'Use a UDS color token such as var(--gray-color) instead of a color function.' }],
    'declaration-property-unit-disallowed-list': [
      {
        'font-size': ['px'],
        '/^(margin|padding|gap|row-gap|column-gap)/': ['px'],
      },
      { message: 'Use UDS tokens: var(--font-size-*) for text and var(--spacing-*) for margin, padding and gap.' },
    ],
  },
  overrides: [
    {
      files: ['src/styles/main.scss'],
      rules: { 'color-no-hex': null },
    },
  ],
};
