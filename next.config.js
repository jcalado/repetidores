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
  // Next.js 16 blocks cross-origin requests to dev resources (HMR, etc.) by default.
  // The frontend dev server is reached from LAN (192.168.*), Tailscale (100.*), and
  // Cloudflare quick-tunnels (*.trycloudflare.com) during development; without these
  // entries, the HMR WebSocket is blocked, Turbopack never finishes runtime setup, and
  // React fails to hydrate (click handlers never wire up). The wildcard handles the
  // rotating Cloudflare tunnel subdomains.
  allowedDevOrigins: [
    '127.0.0.1',
    '192.168.1.149',
    '100.114.40.20',
    '*.trycloudflare.com',
  ],
};

export default withNextIntl(nextConfig);
