import { cn } from '@/lib/utils';
import { RadioTowerIcon, Rss } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FooterProps {
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'https://api.radioamador.info';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
const GIT_HASH = process.env.NEXT_PUBLIC_GIT_HASH || 'dev';

export default function Footer({ className }: FooterProps) {
  const t = useTranslations('footer');

  return (
    <footer className={cn("border-t border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Link sections */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {t('repeaters')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/repetidores" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('list')}
                </Link>
              </li>
              <li>
                <Link href="/repetidores/mapa" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('map')}
                </Link>
              </li>
              <li>
                <Link href="/repetidores/proximo" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('nearest')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {t('tools')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/calculadoras" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('calculators')}
                </Link>
              </li>
              <li>
                <Link href="/propagation" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('propagation')}
                </Link>
              </li>
              <li>
                <Link href="/bands" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('bands')}
                </Link>
              </li>
              <li>
                <Link href="/qth" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('qth')}
                </Link>
              </li>
              <li>
                <Link href="/morse" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('morse')}
                </Link>
              </li>
              <li>
                <Link href="/nato" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('nato')}
                </Link>
              </li>
              <li>
                <Link href="/qcodes" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('qcodes')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {t('community')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('events')}
                </Link>
              </li>
              <li>
                <Link href="/noticias" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('news')}
                </Link>
              </li>
              <li>
                <Link href="/associations" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  {t('associations')}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <RadioTowerIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              © {new Date().getFullYear()} {t('copyright')}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              v{APP_VERSION} ({GIT_HASH})
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t('about')}
            </Link>
            <Link
              href="https://github.com/jcalado/repetidores"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t('github')}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                <Rss className="h-4 w-4" />
                {t('rss')}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`${API_URL}/api/feeds/repeaters.rss`} target="_blank" rel="noopener noreferrer">
                    Repetidores (RSS)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`${API_URL}/api/feeds/events.rss`} target="_blank" rel="noopener noreferrer">
                    Eventos (RSS)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`${API_URL}/api/feeds/status.rss`} target="_blank" rel="noopener noreferrer">
                    Estado (RSS)
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  );
}
