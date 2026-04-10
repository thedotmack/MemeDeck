import { FlatCompat } from '@eslint/eslintrc';
import noCommentedCode from 'eslint-plugin-no-commented-code';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      'no-commented-code': noCommentedCode,
    },
    rules: {
      'no-inline-comments': 'error',
      'no-commented-code/no-commented-code': 'error',
      'spaced-comment': 'off',
    },
  },
];
