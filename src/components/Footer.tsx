import { RadioTowerIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <RadioTowerIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              © {new Date().getFullYear()} {t('copyright')}
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
          </div>
        </div>
      </div>
    </footer>
  );
}
