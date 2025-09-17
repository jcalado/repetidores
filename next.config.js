import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  /* config options here */
};

export default withNextIntl(nextConfig);
