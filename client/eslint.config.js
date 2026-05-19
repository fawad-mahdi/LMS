import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';

const vitestGlobals = {
  describe: 'readonly', it: 'readonly', test: 'readonly',
  expect:   'readonly', vi: 'readonly',
  beforeEach: 'readonly', afterEach: 'readonly',
  beforeAll:  'readonly', afterAll:  'readonly',
};

export default [
  { ignores: ['dist/', 'coverage/'] },

  /* ── Source files ────────────────────────── */
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, react },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,   // includes jsx-uses-vars
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  /* ── Test files – add Vitest globals ─────── */
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022, ...vitestGlobals },
    },
  },
];
