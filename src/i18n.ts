import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
export const locales = ["pt"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Since we only support 'pt' locale at build time, default to 'pt'
  const validLocale = locales.includes(locale as Locale) ? locale : "pt";

  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
