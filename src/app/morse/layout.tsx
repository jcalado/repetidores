import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Código Morse - Treino e Referência",
  description: "Aprenda e pratique código Morse com o nosso treinador interativo. Tabela completa de caracteres e exercícios para radioamadores.",
  keywords: ["código morse", "morse", "CW", "telegrafia", "radioamador", "treino", "aprender morse"],
  alternates: {
    canonical: "/morse",
  },
  openGraph: {
    title: "Código Morse - Treino e Referência",
    description: "Aprenda e pratique código Morse com o nosso treinador interativo. Tabela completa de caracteres e exercícios para radioamadores.",
    type: "website",
    url: "/morse",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Código Morse" }],
  },
  twitter: {
    card: "summary",
    title: "Código Morse - Treino e Referência",
    description: "Aprenda e pratique código Morse com o nosso treinador interativo.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Código Morse", url: "https://www.radioamador.info/morse" },
];

const faqItems = [
  {
    question: "O que é o código Morse?",
    answer: "O código Morse é um sistema de representação de letras, números e sinais de pontuação através de sequências de sinais curtos (pontos) e longos (traços). Foi desenvolvido por Samuel Morse e é amplamente utilizado em radioamadorismo.",
  },
  {
    question: "Como aprender código Morse?",
    answer: "A melhor forma de aprender código Morse é através de prática regular. Comece por memorizar os caracteres mais comuns e pratique com velocidades baixas, aumentando gradualmente. Use ferramentas como o nosso treinador interativo.",
  },
  {
    question: "Qual é a velocidade padrão do código Morse?",
    answer: "A velocidade do código Morse é medida em palavras por minuto (WPM). Para iniciantes, recomenda-se começar com 5-10 WPM. Operadores experientes podem atingir velocidades de 25-40 WPM ou mais.",
  },
];

export default function MorseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Código Morse - Treino e Referência"
        description="Aprenda e pratique código Morse com o nosso treinador interativo. Tabela completa de caracteres e exercícios para radioamadores."
        url="https://www.radioamador.info/morse"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
