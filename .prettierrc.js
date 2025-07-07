/** @type {import('prettier').Config} */
const config = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  singleQuote: true,
  trailingComma: 'all',
  importOrder: [
    '^@nestjs/(.*)$',
    '^@(.*)/(.*)$',
    '^[\\w-]*$',
    '^[\\w-]*/(.*)$',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,
};

module.exports = config;
