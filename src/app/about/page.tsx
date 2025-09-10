import { RadioTower } from "lucide-react"
import Link from "next/link"

export default function About() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Sobre o repetidores.pt
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Explorando repetidores de rádio amador em Portugal com uma interface moderna e intuitiva
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-12">
                        {/* Project Description */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">O que é este projeto?</h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                Este projeto é uma evolução do antigo repetidores.pt, desenvolvido pelos radioamadores CT2ILS (Rui Shantilal) e CT1FIN (João Rodrigues). Embora partilhe o anterior endereço, em nada se relaciona com a antiga equipa, a quem desde já agradecemos!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="https://github.com/jcalado/repetidores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-slate-600 dark:bg-slate-700 text-slate-100 rounded-xl font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 border border-white/20"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    Ver Código no GitHub
                                </Link>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Funcionalidades</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300">Visualização de repetidores em tabela com filtros avançados</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300">Mapa interativo com localização geográfica</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300">Interface responsiva otimizada para desktop e mobile</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300">Filtros por indicativo, proprietário, banda e modulação</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* About Ham Radio */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl p-8 text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <RadioTower className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Sobre Rádio Amador</h2>
                            </div>
                            <p className="text-blue-100 text-lg leading-relaxed mb-6">
                                O rádio amador, também conhecido como radioamadorismo ou amateur radio,
                                é uma atividade técnica e recreativa que utiliza ondas de rádio para
                                comunicação. Os repetidores são estações que recebem um sinal em uma
                                frequência e o retransmitem em outra frequência, ampliando assim o
                                alcance das comunicações.
                            </p>
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-sm text-blue-100">
                                    🎯 <strong>Objetivo:</strong> Facilitar a comunicação e promover o conhecimento técnico
                                    através da experimentação com equipamentos de rádio.
                                </p>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contato</h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                                Este projeto é mantido por CR7BLE, Joel Calado.
                                Para sugestões, correções ou colaborações, visite o repositório no GitHub.
                            </p>
                        </div>

                        {/* CTA Section - Radioescola.pt */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl p-8 text-white text-center">
                            <div className="max-w-2xl mx-auto">
                                <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold mb-4">Interessado em ser Rádio Amador?</h2>
                                <p className="text-green-100 text-lg mb-8 leading-relaxed">
                                    Aprenda os fundamentos do rádio amador com a melhor escola online de Portugal.
                                    Cursos completos, material didático e um grupo no Telegram para apoio
                                    na comunicação por rádio.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="https://radioescola.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-600 dark:text-green-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Visitar Radioescola.pt
                                    </Link>

                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </main>
    )
}
