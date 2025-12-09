import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

function ImportantNotice() {
    const t = useTranslations('home.important');

    return (
        <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-800/50 dark:from-amber-950/40 dark:to-orange-950/30">
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        {t('title')}
                    </h4>
                    <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                        {t('description')}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ImportantNotice;