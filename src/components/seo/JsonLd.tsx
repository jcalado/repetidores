/**
 * SEO JSON-LD Schema Components
 * Reusable structured data components for better search engine understanding
 */

import type { WithContext, Organization, WebSite, BreadcrumbList, FAQPage, WebPage } from "schema-dts";

interface JsonLdProps<T> {
  data: T;
}

// Generic JSON-LD script renderer
function JsonLdScript<T>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema - for the site owner/publisher
export function OrganizationJsonLd() {
  const data: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radioamador.info",
    alternateName: "Radioamador.info - Portugal",
    url: "https://www.radioamador.info",
    logo: "https://www.radioamador.info/icon-512.png",
    description: "Diretório de repetidores, eventos, notícias e ferramentas para radioamadores em Portugal",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Portugal",
    },
    sameAs: [
      // Add social media links here if available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "Portuguese",
    },
  };

  return <JsonLdScript data={data} />;
}

// WebSite Schema - for sitelinks search box
export function WebSiteJsonLd() {
  const data: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Radioamador.info",
    alternateName: "Ferramentas para Radioamadores em Portugal",
    url: "https://www.radioamador.info",
    inLanguage: "pt-PT",
    publisher: {
      "@type": "Organization",
      name: "Radioamador.info",
      logo: {
        "@type": "ImageObject",
        url: "https://www.radioamador.info/icon-512.png",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.radioamador.info/repetidores?search={search_term_string}",
      },
      // @ts-expect-error - query-input is valid for SearchAction
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLdScript data={data} />;
}

// Breadcrumb Schema
export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLdScript data={data} />;
}

// FAQ Schema
export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  items: FAQItem[];
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const data: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLdScript data={data} />;
}

// WebPage Schema for tool/reference pages
interface WebPageJsonLdProps {
  name: string;
  description: string;
  url: string;
  dateModified?: string;
  breadcrumb?: BreadcrumbItem[];
}

export function WebPageJsonLd({ name, description, url, dateModified, breadcrumb }: WebPageJsonLdProps) {
  const data: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage: "pt-PT",
    isPartOf: {
      "@type": "WebSite",
      name: "Radioamador.info",
      url: "https://www.radioamador.info",
    },
    ...(dateModified && { dateModified }),
    ...(breadcrumb && {
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    }),
    publisher: {
      "@type": "Organization",
      name: "Radioamador.info",
      logo: {
        "@type": "ImageObject",
        url: "https://www.radioamador.info/icon-512.png",
      },
    },
  };

  return <JsonLdScript data={data} />;
}

// Export all components
export { JsonLdScript };
