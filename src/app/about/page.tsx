"use client"

import { Activity, Antenna, BookOpen, Calculator, Calendar, Clock, Code2, Compass, Globe, Heart, Landmark, Mail, MapPin, MessageCircle, Newspaper, Radio, Rocket, Satellite, Search, ThumbsUp, Users, Zap } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link"

function FeatureCard({ icon: Icon, title, description }: {
    icon: React.ElementType
    title: string
    description: string
}) {
    return (
        <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 text-foreground shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-azulejo-100 text-azulejo-600 dark:bg-azulejo-950/50 dark:text-azulejo-400">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
    )
}

export default function About() {
    const t = useTranslations('about')

    const features = [
        {
            icon: MapPin,
            title: t('highlights.directory.title'),
            description: t('highlights.directory.description')
        },
        {
            icon: Zap,
            title: t('highlights.tools.title'),
            description: t('highlights.tools.description')
        },
        {
            icon: Users,
            title: t('highlights.community.title'),
            description: t('highlights.community.description')
        }
    ]

    const featureCategories = [
        {
            title: "Repetidores",
            features: [
                { icon: Globe, text: t('features.table') },
                { icon: MapPin, text: t('features.map') },
                { icon: Search, text: t('features.filters') },
                { icon: Compass, text: t('features.nearest') },
                { icon: ThumbsUp, text: t('features.voting') }
            ]
        },
        {
            title: "Eventos & Notícias",
            features: [
                { icon: Calendar, text: t('features.events') },
                { icon: Newspaper, text: t('features.news') },
                { icon: Landmark, text: t('features.associations') }
            ]
        },
        {
            title: "Ferramentas",
            features: [
                { icon: Calculator, text: t('features.calculators') },
                { icon: Activity, text: t('features.propagation') },
                { icon: Satellite, text: t('features.satellites') },
                { icon: MapPin, text: t('features.qth') },
                { icon: Antenna, text: t('features.antenna') },
                { icon: Radio, text: t('features.los') }
            ]
        },
        {
            title: "Referência",
            features: [
                { icon: Radio, text: t('features.nato') },
                { icon: Clock, text: t('features.utc') },
                { icon: Zap, text: t('features.morse') },
                { icon: BookOpen, text: t('features.qcodes') }
            ]
        }
    ]

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                {/* Hero Section */}
                <header className="mb-20 text-center">
                    <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                        {t('title')}
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        {t('subtitle')}
                    </p>
                </header>

                {/* Feature Cards */}
                <section className="mb-20">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </section>

                {/* About the Project */}
                <section className="mb-20">
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="grid lg:grid-cols-2">
                            <div className="p-8 sm:p-10 lg:p-12">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-azulejo-100 px-3 py-1 text-sm font-medium text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300">
                                    <Code2 className="h-4 w-4" />
                                    Open Source
                                </div>
                                <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                                    {t('project.title')}
                                </h2>
                                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                                    {t('project.description')}
                                </p>
                                <Link
                                    href="https://github.com/jcalado/repetidores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 rounded-lg bg-azulejo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-azulejo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    {t('github')}
                                    <span className="transition group-hover:translate-x-0.5">&rarr;</span>
                                </Link>
                            </div>
                            <div className="relative hidden bg-azulejo-600 lg:block">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Radio className="h-32 w-32 text-white/20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features List */}
                <section className="mb-20">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                            {t('features.title')}
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('features.responsive')}
                        </p>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-2">
                        {featureCategories.map((category) => (
                            <div
                                key={category.title}
                                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                            >
                                <div className="border-b border-border px-6 py-4">
                                    <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                                </div>
                                <div className="p-4">
                                    <ul className="space-y-2">
                                        {category.features.map((feature, i) => {
                                            const Icon = feature.icon
                                            return (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-accent"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-azulejo-100 text-azulejo-600 dark:bg-azulejo-950/50 dark:text-azulejo-400">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground">{feature.text}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ham Radio Info */}
                <section className="mb-20">
                    <div className="overflow-hidden rounded-xl bg-azulejo-600 p-8 shadow-sm sm:p-10 lg:p-12">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                            <Radio className="h-4 w-4" />
                            Radioamadorismo
                        </div>
                        <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
                            {t('hamRadio.title')}
                        </h2>
                        <p className="mb-8 max-w-3xl text-lg leading-relaxed text-white/80">
                            {t('hamRadio.description')}
                        </p>
                        <div className="inline-flex items-start gap-3 rounded-xl bg-white/10 p-5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <Rocket className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-medium text-white">{t('hamRadio.objective')}</p>
                        </div>
                    </div>
                </section>

                {/* Contact & Radio School */}
                <section className="grid gap-8 lg:grid-cols-2">
                    {/* Contact */}
                    <div className="overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm">
                        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-azulejo-100 text-azulejo-600 dark:bg-azulejo-950/50 dark:text-azulejo-400">
                            <MessageCircle className="h-7 w-7" />
                        </div>
                        <h2 className="mb-3 text-2xl font-bold text-foreground">
                            {t('contact.title')}
                        </h2>
                        <p className="mb-8 text-muted-foreground">
                            {t('contact.description')}
                        </p>
                        <div className="space-y-4">
                            <Link
                                href="https://github.com/jcalado/repetidores"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:bg-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-azulejo-100 text-azulejo-600 dark:bg-azulejo-950/50 dark:text-azulejo-400">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{t('contact.githubTitle')}</p>
                                    <p className="text-sm text-muted-foreground">{t('contact.githubDescription')}</p>
                                </div>
                            </Link>
                            <Link
                                href="mailto:cs7ble@radioamador.info"
                                className="flex items-center gap-4 rounded-xl border border-azulejo-200 bg-azulejo-50 p-4 transition hover:bg-azulejo-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-azulejo-900 dark:bg-azulejo-950/40 dark:hover:bg-azulejo-950/60"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-azulejo-600 text-white">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{t('contact.emailTitle')}</p>
                                    <p className="font-mono text-sm text-azulejo-700 dark:text-azulejo-300">cs7ble@radioamador.info</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Radio School CTA */}
                    <div className="flex flex-col overflow-hidden rounded-xl bg-azulejo-600 p-8 shadow-sm">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-white/15">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                            {t('radioSchool.title')}
                        </h2>
                        <p className="mb-8 flex-1 text-lg leading-relaxed text-white/80">
                            {t('radioSchool.description')}
                        </p>
                        <Link
                            href="https://radioescola.pt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center justify-center gap-3 rounded-lg bg-white px-8 py-4 font-semibold text-azulejo-700 shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-azulejo-600"
                        >
                            <BookOpen className="h-5 w-5" />
                            {t('radioSchool.visit')}
                            <span className="transition group-hover:translate-x-0.5">&rarr;</span>
                        </Link>
                    </div>
                </section>

                {/* Footer note */}
                <footer className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Made with</span>
                        <Heart className="h-4 w-4 text-azulejo-500" />
                        <span>by <span className="font-mono">CS7BLE</span></span>
                    </div>
                </footer>
            </div>
        </main>
    )
}
