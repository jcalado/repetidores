const { createNextIntlPlugin } = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig = {
  output: 'export',
  outputFileTracingRoot: __dirname,
  /* config options here */
};

module.exports = withNextIntl(nextConfig);
