// @ts-check
import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript resolves names (including ambient namespaces such as
      // Express) more accurately than ESLint's JavaScript no-undef rule.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // The existing backend still has legacy unused declarations. Keep them
      // visible without blocking an otherwise valid release candidate.
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
