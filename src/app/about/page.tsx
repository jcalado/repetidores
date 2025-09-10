"use client"

import { CircleQuestionMarkIcon, CogIcon, RadioTower } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link"
import { useMemo } from "react"

// Small presentational components for consistency & reduced duplication
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={`relative overflow-hidden rounded-2xl border border-gray-100/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/70 shadow-[0_4px_16px_-2px_rgb(0_0_0_/_0.05),0_0_0_1px_rgb(255_255_255_/_0.4)] dark:shadow-[0_4px_16px_-2px_rgb(0_0_0_/_0.6),0_0_0_1px_rgb(255_255_255_/_0.05)] backdrop-blur-xl ${className}`}>
            <div className="absolute inset-0 pointer-events-none opacity-40 [mask-image:radial-gradient(circle_at_30%_30%,#000,transparent_70%)] bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.15),transparent_60%)]" />
            <div className="relative z-10 p-6 sm:p-8">
                {children}
            </div>
        </section>
    )
}

function PillIcon({ color = "blue", children }: { color?: string; children: React.ReactNode }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        orange: "bg-orange-500",
        gradient: "bg-gradient-to-br from-blue-500 to-indigo-600"
    }
    return (
        <div className={`h-10 w-10 aspect-square ${colorMap[color] || colorMap.blue} rounded-xl shadow ring-2 ring-white/20 flex items-center justify-center`}>{children}</div>
    )
}

export default function About() {
    const t = useTranslations('about')

    const features = useMemo(() => [
        t('features.table'),
        t('features.map'),
        t('features.responsive'),
        t('features.filters')
    ], [t])

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]">
                    <div className="absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-transparent blur-3xl dark:from-blue-700/20 dark:via-indigo-700/10" />
                </div>
            </div>
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
                <header className="relative mb-20 text-center">
                    <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-slate-200 dark:to-slate-400">
                        {t('title')}
                    </h1>
                    <p className="mt-6 mx-auto max-w-3xl text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-300">
                        {t('subtitle')}
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
                    {/* Left column (spans 2) */}
                    <div className="space-y-10 xl:col-span-2">
                        {/* Project */}
                        <SectionCard>
                            <div className="flex items-start gap-5 mb-6">
                                <PillIcon color="gradient">
                                    <CircleQuestionMarkIcon className="text-white" />
                                </PillIcon>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{t('project.title')}</h2>
                                    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                                        {t('project.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-start gap-4">
                                <Link
                                    href="https://github.com/jcalado/repetidores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative inline-flex items-center gap-2 rounded-full border border-slate-300/60 dark:border-slate-600/60 bg-slate-100/60 dark:bg-slate-700/40 px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 backdrop-blur transition hover:border-slate-400/80 hover:bg-white dark:hover:bg-slate-700"
                                >
                                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 blur-sm transition group-hover:from-blue-500/30 group-hover:via-indigo-500/20 group-hover:to-purple-500/30 group-hover:opacity-100" />
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span className="relative">{t('github')}</span>
                                </Link>
                            </div>
                        </SectionCard>

                        {/* Features */}
                        <SectionCard>
                            <div className="flex items-start gap-5 mb-8">
                                <PillIcon color="green">
                                    <CogIcon className="h-6 w-6 text-white" />
                                </PillIcon>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{t('features.title')}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">&nbsp;</p>
                                </div>
                            </div>
                            <ul className="grid gap-4 sm:grid-cols-2">
                                {features.map((f, i) => (
                                    <li key={i} className="group relative flex items-start gap-3 rounded-xl border border-slate-200/70 dark:border-slate-600/40 bg-slate-50/60 dark:bg-slate-700/30 px-4 py-3 text-slate-700 dark:text-slate-300 transition hover:border-blue-300/70 dark:hover:border-blue-400/40 hover:bg-white dark:hover:bg-slate-700/60">
                                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                            <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span className="leading-relaxed">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </SectionCard>

                        {/* Ham Radio */}
                        <SectionCard className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 dark:from-blue-700/90 dark:to-indigo-800/90 text-white border-transparent shadow-xl">
                            <div className="flex items-start gap-5 mb-6">
                                <PillIcon color="blue">
                                    <RadioTower className="h-6 w-6 text-white" />
                                </PillIcon>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">{t('hamRadio.title')}</h2>
                                    <p className="mt-4 text-blue-100 leading-relaxed text-lg">
                                        {t('hamRadio.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 rounded-xl bg-white/10 p-4 ring-1 ring-inset ring-white/20">
                                <p className="text-sm text-blue-100 font-medium">🎯 <span className="font-semibold">{t('hamRadio.objective')}</span></p>
                            </div>
                        </SectionCard>

                        {/* Contact */}
                        <SectionCard>
                            <div className="flex items-start gap-5 mb-6">
                                <PillIcon color="orange">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </PillIcon>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{t('contact.title')}</h2>
                                    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-2">{t('contact.description')}</p>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right column (sticky CTA) */}
                    <div className="xl:col-span-1 xl:pl-4">
                        <div className="xl:sticky xl:top-24 space-y-10">
                            <SectionCard className="text-center bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 border-none text-white shadow-xl">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 mb-6 ring-2 ring-white/30">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold mb-4 tracking-tight drop-shadow-sm">{t('radioSchool.title')}</h2>
                                <p className="text-emerald-50/90 text-lg leading-relaxed mb-8">
                                    {t('radioSchool.description')}
                                </p>
                                <Link
                                    href="https://radioescola.pt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-emerald-600 shadow-lg ring-1 ring-white/40 transition hover:shadow-xl hover:scale-[1.02] dark:text-emerald-700"
                                >
                                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-200 via-white to-emerald-100 opacity-0 transition group-hover:opacity-100" />
                                    <svg className="h-5 w-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span className="relative">{t('radioSchool.visit')}</span>
                                </Link>
                            </SectionCard>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
