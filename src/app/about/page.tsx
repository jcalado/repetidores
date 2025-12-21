"use client"

import { Activity, Antenna, BookOpen, Calculator, Calendar, Clock, Code2, Compass, Globe, Heart, Landmark, Mail, MapPin, MessageCircle, Newspaper, Radio, Rocket, Satellite, Search, ThumbsUp, Users, Zap } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link"

function FeatureCard({ icon: Icon, title, description, gradient }: {
    icon: React.ElementType
    title: string
    description: string
    gradient: string
}) {
    return (
        <div className="group relative">
            <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${gradient} opacity-0 blur transition duration-500 group-hover:opacity-75`} />
            <div className="relative flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-6 transition duration-300 group-hover:border-transparent dark:border-slate-700/60 dark:bg-slate-800/90">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
            </div>
        </div>
    )
}

export default function About() {
    const t = useTranslations('about')

    const features = [
        {
            icon: MapPin,
            title: t('highlights.directory.title'),
            description: t('highlights.directory.description'),
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: Zap,
            title: t('highlights.tools.title'),
            description: t('highlights.tools.description'),
            gradient: "from-amber-500 to-orange-500"
        },
        {
            icon: Users,
            title: t('highlights.community.title'),
            description: t('highlights.community.description'),
            gradient: "from-emerald-500 to-teal-500"
        }
    ]

    const featureCategories = [
        {
            title: "Repetidores",
            color: "from-blue-500 to-indigo-500",
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
            color: "from-emerald-500 to-teal-500",
            features: [
                { icon: Calendar, text: t('features.events') },
                { icon: Newspaper, text: t('features.news') },
                { icon: Landmark, text: t('features.associations') }
            ]
        },
        {
            title: "Ferramentas",
            color: "from-amber-500 to-orange-500",
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
            color: "from-purple-500 to-pink-500",
            features: [
                { icon: Radio, text: t('features.nato') },
                { icon: Clock, text: t('features.utc') },
                { icon: Zap, text: t('features.morse') },
                { icon: BookOpen, text: t('features.qcodes') }
            ]
        }
    ]

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl dark:from-blue-600/10 dark:via-indigo-600/5" />
                <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl dark:from-emerald-600/10 dark:via-teal-600/5" />
                <div className="absolute -bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-purple-400/15 via-pink-400/10 to-transparent blur-3xl dark:from-purple-600/10 dark:via-pink-600/5" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                {/* Hero Section */}
                <header className="mb-20 text-center">
                    <h1 className="mb-6 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:via-slate-200 dark:to-white sm:text-5xl lg:text-6xl">
                        {t('title')}
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
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
                    <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-xl backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                        <div className="grid lg:grid-cols-2">
                            <div className="p-8 sm:p-10 lg:p-12">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                    <Code2 className="h-4 w-4" />
                                    Open Source
                                </div>
                                <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                                    {t('project.title')}
                                </h2>
                                <p className="mb-8 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                    {t('project.description')}
                                </p>
                                <Link
                                    href="https://github.com/jcalado/repetidores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    {t('github')}
                                    <span className="transition group-hover:translate-x-0.5">&rarr;</span>
                                </Link>
                            </div>
                            <div className="relative hidden lg:block">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
                                </div>
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
                        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                            {t('features.title')}
                        </h2>
                        <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
                            {t('features.responsive')}
                        </p>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-2">
                        {featureCategories.map((category) => (
                            <div
                                key={category.title}
                                className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80"
                            >
                                <div className={`bg-gradient-to-r ${category.color} px-6 py-4`}>
                                    <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                                </div>
                                <div className="p-4">
                                    <ul className="space-y-2">
                                        {category.features.map((feature, i) => {
                                            const Icon = feature.icon
                                            return (
                                                <li
                                                    key={i}
                                                    className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                                >
                                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${category.color} text-white shadow-sm`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature.text}</span>
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
                    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 shadow-2xl sm:p-10 lg:p-12">
                        <div className="relative">
                            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="relative">
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                                    <Radio className="h-4 w-4" />
                                    Radioamadorismo
                                </div>
                                <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
                                    {t('hamRadio.title')}
                                </h2>
                                <p className="mb-8 max-w-3xl text-lg leading-relaxed text-blue-100">
                                    {t('hamRadio.description')}
                                </p>
                                <div className="inline-flex items-start gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                                        <Rocket className="h-4 w-4 text-white" />
                                    </div>
                                    <p className="font-medium text-white">{t('hamRadio.objective')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact & Radio School */}
                <section className="grid gap-8 lg:grid-cols-2">
                    {/* Contact */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-8 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
                            <MessageCircle className="h-7 w-7" />
                        </div>
                        <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                            {t('contact.title')}
                        </h2>
                        <p className="mb-8 text-slate-600 dark:text-slate-400">
                            {t('contact.description')}
                        </p>
                        <div className="space-y-4">
                            <Link
                                href="https://github.com/jcalado/repetidores"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{t('contact.githubTitle')}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('contact.githubDescription')}</p>
                                </div>
                            </Link>
                            <Link
                                href="mailto:cs7ble@radioamador.info"
                                className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:border-blue-300 hover:shadow-md dark:border-blue-800 dark:bg-blue-950/50 dark:hover:border-blue-700"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{t('contact.emailTitle')}</p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">cs7ble@radioamador.info</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Radio School CTA */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-8 shadow-2xl">
                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                        <div className="relative flex h-full flex-col">
                            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <BookOpen className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                                {t('radioSchool.title')}
                            </h2>
                            <p className="mb-8 flex-1 text-lg leading-relaxed text-emerald-50">
                                {t('radioSchool.description')}
                            </p>
                            <Link
                                href="https://radioescola.pt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 font-semibold text-emerald-600 shadow-lg transition hover:shadow-xl"
                            >
                                <BookOpen className="h-5 w-5" />
                                {t('radioSchool.visit')}
                                <span className="transition group-hover:translate-x-0.5">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer note */}
                <footer className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                        <span>Made with</span>
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>by CS7BLE</span>
                    </div>
                </footer>
            </div>
        </main>
    )
}
