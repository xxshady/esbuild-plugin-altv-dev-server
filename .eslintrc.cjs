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
    'no-proto': 0,
    // error on the use of some functions
    'no-restricted-syntax': [
      'error',
      // alt.log
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(log)$/]',
        message: 'Use custom log',
      },
      // console.log
      {
        selector: 'CallExpression[callee.object.name=\'console\'][callee.property.name=/^(log)$/]',
        message: 'Use custom log',
      },
      // alt.on
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(on)$/]',
        message: 'Use devOnAlt',
      },
      // alt.once
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(once)$/]',
        message: 'Use devOnAltce',
      },
      // alt.onClient
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(onClient)$/]',
        message: 'Use devOnAltClient',
      },
      // alt.onceClient
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(onceClient)$/]',
        message: 'Use devOnAltceClient',
      },
      // alt.onServer
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(onServer)$/]',
        message: 'Use devOnAltServer',
      },
      // alt.onceServer
      {
        selector: 'CallExpression[callee.object.name=\'alt\'][callee.property.name=/^(onceServer)$/]',
        message: 'Use devOnAltceServer',
      },
    ],
  },
  globals: {
    ___ALTV_DEV_SERVER_HR_FS___: 'readonly',
    ___ALTV_DEV_SERVER_HR_BUNDLE_PATH___: 'readonly',
    ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___: 'readonly',
    ___ALTV_DEV_SERVER_HR_CLIENT_PATH___: 'readonly',
    ___ALTV_DEV_SERVER_RES_COMMAND_NAME___: 'readonly',
  },
  ignorePatterns: [
    '*.d.ts',
    'example-altv-resource',
  ],
}
