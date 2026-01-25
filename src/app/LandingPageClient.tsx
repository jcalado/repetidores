'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
    CalendarIcon,
    ClockIcon,
    GlobeAmericasIcon,
    LanguageIcon,
    MapIcon,
    MapPinIcon,
    RadioIcon,
    SignalIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline'
import { BookOpen, Cable, Calculator, Gauge, Volume2, Radio, RadioTowerIcon, Waves, Wrench } from 'lucide-react'
import LandingNewsSection from '@/components/LandingNewsSection'
import type { NewsItem } from '@/lib/news'

interface LandingPageClientProps {
    initialNews?: NewsItem[]
}

export default function LandingPageClient({ initialNews }: LandingPageClientProps) {
    const t = useTranslations()

    const mainFeatures = [
        {
            title: t('nav.repeaters'),
            description: t('landing.repeatersDescription'),
            href: '/repetidores',
            icon: RadioTowerIcon,
            gradient: 'from-ship-cove-500 to-ship-cove-700',
            items: [
                { name: t('nav.table'), href: '/repetidores', icon: TableCellsIcon },
                { name: t('nav.map'), href: '/repetidores/mapa', icon: MapIcon },
            ]
        },
        {
            title: t('nav.events'),
            description: t('landing.eventsDescription'),
            href: '/events',
            icon: CalendarIcon,
            gradient: 'from-amber-500 to-orange-600',
        },
        {
            title: t('nav.bands'),
            description: t('landing.bandsDescription'),
            href: '/bands',
            icon: RadioIcon,
            gradient: 'from-emerald-500 to-teal-600',
        },
    ]

    const tools = [
        { name: t('nav.satellites'), description: t('nav.satellitesDescription'), href: '/satelites', icon: GlobeAmericasIcon },
        { name: t('nav.qth'), description: t('nav.qthDescription'), href: '/qth', icon: MapPinIcon },
        { name: t('nav.propagation'), description: t('nav.propagationDescription'), href: '/propagation', icon: SignalIcon },
        { name: t('nav.nato'), description: t('nav.natoDescription'), href: '/nato', icon: LanguageIcon },
        { name: t('nav.utc'), description: t('nav.utcDescription'), href: '/utc', icon: ClockIcon },
        { name: t('nav.antenna'), description: t('nav.antennaDescription'), href: '/antenna', icon: Radio },
        { name: t('nav.qcodes'), description: t('nav.qcodesDescription'), href: '/qcodes', icon: BookOpen },
        { name: t('nav.morse'), description: t('nav.morseDescription'), href: '/morse', icon: Volume2 },
    ]

    const calculators = [
        { name: t('calculadoras.db.title'), description: t('calculadoras.db.shortDesc'), href: '/calculadoras/db', icon: Calculator },
        { name: t('calculadoras.swr.title'), description: t('calculadoras.swr.shortDesc'), href: '/calculadoras/swr', icon: Gauge },
        { name: t('calculadoras.coax.title'), description: t('calculadoras.coax.shortDesc'), href: '/calculadoras/coax', icon: Cable },
        { name: t('calculadoras.frequencia.title'), description: t('calculadoras.frequencia.shortDesc'), href: '/calculadoras/frequencia', icon: Waves },
    ]

    return (
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white shadow-xl shadow-ship-cove-500/30">
                        <RadioTowerIcon className="h-12 w-12" />
                    </div>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                    {t('landing.title')}
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    {t('landing.subtitle')}
                </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {mainFeatures.map((feature) => (
                    <Link
                        key={feature.title}
                        href={feature.href}
                        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-4`}>
                            <feature.icon className="h-7 w-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {feature.title}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            {feature.description}
                        </p>
                        {feature.items && (
                            <div className="flex flex-wrap gap-2">
                                {feature.items.map((item) => (
                                    <span
                                        key={item.name}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* Tools Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                        <Wrench className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {t('nav.tools')}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tools.map((tool) => (
                        <Link
                            key={tool.name}
                            href={tool.href}
                            className="group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 hover:border-ship-cove-300 dark:hover:border-ship-cove-700 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 group-hover:bg-ship-cove-100 dark:group-hover:bg-ship-cove-900/30 transition-colors">
                                <tool.icon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-400 transition-colors">
                                    {tool.name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {tool.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Calculators Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <Calculator className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {t('calculadoras.title')}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {calculators.map((calc) => (
                        <Link
                            key={calc.name}
                            href={calc.href}
                            className="group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <calc.icon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {calc.name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {calc.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* News Section */}
            <LandingNewsSection initialNews={initialNews} />

            {/* About Link */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-slate-700">
                <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-700 dark:hover:text-ship-cove-300 font-medium transition-colors"
                >
                    {t('landing.learnMore')}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </main>
    )
}
