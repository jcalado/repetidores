declare module "next-pwa" {
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    [key: string]: unknown;
  }

  function withPWA(
    config?: PWAConfig
  ): (nextConfig: Record<string, unknown>) => Record<string, unknown>;
  export default withPWA;
}
