// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** Layer boundaries (see CLAUDE.md "Architecture"). Specs may wire real providers. */
const layer = (files, message, patterns) => ({
  files,
  ignores: ['**/*.spec.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: patterns.map((p) => ({ ...p, message: `${message} ${p.message ?? ''}`.trim() })) },
    ],
  },
});
const SUPABASE = { group: ['@supabase/*'], message: 'Only data/supabase talks to Supabase.' };

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'cx', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['cx', 'app'], style: 'kebab-case' },
      ],
      '@angular-eslint/component-class-suffix': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },

  layer(['src/app/domain/**/*.ts'], 'domain/ is framework-free entities + contracts.', [
    { regex: '/(core|data|shared|features|layout)/' },
    SUPABASE,
  ]),
  layer(['src/app/core/**/*.ts'], 'core/ must not depend on UI or data implementations.', [
    { regex: '/(data|shared|features|layout)/' },
    SUPABASE,
  ]),
  layer(['src/app/shared/**/*.ts'], 'shared/ui is feature-agnostic.', [
    { regex: '/(data|features|layout)/' },
    SUPABASE,
  ]),
  layer(['src/app/layout/**/*.ts'], 'layout/ may use core + shared only.', [
    { regex: '/(data|features)/' },
    SUPABASE,
  ]),
  layer(['src/app/features/**/*.ts'], 'Features use repository tokens, not implementations.', [
    { regex: '/data/' },
    SUPABASE,
    { regex: '^\\.\\./(?!\\.\\.)[^/]+/', message: 'Features must not import other features.' },
  ]),
  layer(['src/app/data/dummy/**/*.ts'], 'Dummy data must stay deletable on its own.', [
    { regex: '/supabase/' },
    SUPABASE,
  ]),
  layer(['src/app/data/supabase/**/*.ts'], 'Supabase code must not depend on dummy data.', [
    { regex: '/dummy/' },
  ]),
]);
