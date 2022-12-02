module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    mocha: true,
  },
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-alert': 1,
    'no-debugger': 1,
    'prettier/prettier': ['error', { trailingComma: 'all', singleQuote: true }],
  },
};
