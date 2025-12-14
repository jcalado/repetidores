import createNextIntlPlugin from "next-intl/plugin";
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

// Get version from package.json
const getVersion = () => {
  try {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
};

// Get git hash at build time
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
};

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // basePath: '/repetidores'
  env: {
    NEXT_PUBLIC_APP_VERSION: getVersion(),
    NEXT_PUBLIC_GIT_HASH: getGitHash(),
  },
};

export default withNextIntl(nextConfig);
