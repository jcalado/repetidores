'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, BookOpen, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Q_CODES,
  CATEGORY_LABELS,
  searchQCodes,
  type QCodeCategory,
} from '@/lib/qcodes';

const CATEGORY_COLORS: Record<QCodeCategory, string> = {
  communication: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  signal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  station: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  technical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function QCodeReference() {
  const t = useTranslations('qcodes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QCodeCategory | null>(null);

  const filteredCodes = useMemo(() => {
    return searchQCodes(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const categories = Object.keys(CATEGORY_LABELS) as QCodeCategory[];

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                selectedCategory === null && 'bg-ship-cove-600 hover:bg-ship-cove-700'
              )}
            >
              <Filter className="h-4 w-4 mr-1" />
              {t('allCategories')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  selectedCategory === category && 'bg-ship-cove-600 hover:bg-ship-cove-700'
                )}
              >
                {CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {t('showing', { count: filteredCodes.length, total: Q_CODES.length })}
      </div>

      {/* Q-Codes Grid */}
      {filteredCodes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredCodes.map((qcode) => (
            <Card
              key={qcode.code}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-mono font-bold text-ship-cove-700 dark:text-ship-cove-400">
                        {highlightMatch(qcode.code, searchQuery)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', CATEGORY_COLORS[qcode.category])}
                      >
                        {CATEGORY_LABELS[qcode.category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {highlightMatch(qcode.meaning, searchQuery)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noResults')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference note */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('aboutDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
