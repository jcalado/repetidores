import { useTranslations } from "next-intl";

function ImportantNotice() {
    const t = useTranslations('home.important');

    return (
        <div className="mt-6 rounded-md border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
            <p className="font-semibold">{t('title')}</p>
            <p>
                {t('description')}
            </p>
        </div>
    );
}

export default ImportantNotice;