module.exports = {
  parser: 'babel-eslint',
  env: {
    es2021: true,
  },
  extends: [
    'standard',
  ],
  rules: {
    semi: ['warn', 'never'],
    'require-await': 'error',
    quotes: ['warn', 'single'],
    'promise/param-names': 0,
    'no-void': 0,
    'no-prototype-builtins': 0,
    'no-new': 0,
    'valid-typeof': 0,
    'no-use-before-define': ['error', { functions: false }],
    'import/no-absolute-path': 0,
    'comma-dangle': ['warn', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
    }],
    'eol-last': 0,
  },
  ignorePatterns: [
    '*.d.ts',
    'example-altv-resource',
  ],
}
