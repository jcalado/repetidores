import type { Metadata } from "next";
import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal.",
  alternates: {
    canonical: "/about/",
  },
  openGraph: {
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal.",
    type: "website",
    url: "/about/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info.",
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Sobre", url: "https://www.radioamador.info/about/" },
];

const faqItems = [
  {
    question: "O que é o Radioamador.info?",
    answer: "O Radioamador.info é uma plataforma online com ferramentas e informação para radioamadores em Portugal. Inclui um diretório de repetidores, calendário de eventos, notícias, calculadoras RF e várias outras ferramentas úteis para a prática do radioamadorismo.",
  },
  {
    question: "Como posso contribuir para o projeto?",
    answer: "O Radioamador.info é um projeto open-source. Pode contribuir através do repositório no GitHub em github.com/jcalado/repetidores, submetendo correções de dados de repetidores, reportando problemas ou sugerindo melhorias.",
  },
  {
    question: "Os dados dos repetidores estão atualizados?",
    answer: "Os dados são mantidos pela comunidade e atualizados regularmente. Qualquer utilizador pode reportar o estado de um repetidor através do sistema de votação, ajudando a manter a informação atual.",
  },
  {
    question: "Preciso de licença para usar os repetidores?",
    answer: "Sim, o acesso de transmissão aos repetidores de radioamador é restrito a operadores devidamente licenciados. Transmitir sem a licença apropriada é proibido e viola regulamentos nacionais.",
  },
];

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Sobre o Radioamador.info"
        description="Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal."
        url="https://www.radioamador.info/about/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
