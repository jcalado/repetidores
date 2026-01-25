import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadoras",
  description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
  keywords: ["calculadora", "dB", "SWR", "coaxial", "frequência", "potência", "radioamador"],
  alternates: {
    canonical: "/calculadoras/",
  },
  openGraph: {
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
    type: "website",
    url: "/calculadoras/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Calculadoras" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Calculadoras", url: "https://www.radioamador.info/calculadoras/" },
];

const faqItems = [
  {
    question: "O que é SWR e porque é importante?",
    answer: "SWR (Standing Wave Ratio) ou ROE mede a eficiência da transferência de potência entre o transmissor e a antena. Um SWR de 1:1 é perfeito. Valores até 1.5:1 são excelentes, até 2:1 são aceitáveis. SWR alto indica desadaptação de impedância e pode danificar o transmissor.",
  },
  {
    question: "Como converter dB para potência?",
    answer: "Cada 3 dB representa o dobro (ou metade) da potência. Por exemplo: +3 dB = 2x potência, +6 dB = 4x, +10 dB ≈ 10x. Inversamente: -3 dB = metade, -6 dB = 1/4, -10 dB = 1/10. Estas relações são fundamentais para calcular ganhos de antena e perdas em cabos.",
  },
  {
    question: "Quanta potência se perde num cabo coaxial?",
    answer: "As perdas dependem do tipo de cabo, comprimento e frequência. Por exemplo, 30m de RG-58 a 145 MHz perdem cerca de 4 dB (60% da potência). Cabos de melhor qualidade como LMR-400 perdem significativamente menos. As perdas aumentam com a frequência.",
  },
];

export default function CalculadorasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Calculadoras para Radioamadores"
        description="Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais."
        url="https://www.radioamador.info/calculadoras/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
