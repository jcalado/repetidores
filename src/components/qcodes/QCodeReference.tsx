'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, BookOpen, Filter, HelpCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Q_CODES,
  CATEGORY_LABELS,
  searchQCodes,
  type QCodeCategory,
} from '@/lib/qcodes';

const CATEGORY_COLORS: Record<QCodeCategory, string> = {
  communication: 'bg-azulejo-100 text-azulejo-800 dark:bg-azulejo-900/30 dark:text-azulejo-400',
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
        <mark key={i} className="bg-azulejo-100 text-azulejo-900 dark:bg-azulejo-900/50 dark:text-azulejo-100 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
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

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                selectedCategory === null && 'bg-azulejo-600 hover:bg-azulejo-700'
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
                  selectedCategory === category && 'bg-azulejo-600 hover:bg-azulejo-700'
                )}
              >
                {CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-3 text-sm text-muted-foreground">
          {t('showing', { count: filteredCodes.length, total: Q_CODES.length })}
        </div>

        {/* Q-Codes Table */}
        {filteredCodes.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[88px]">{t('columnCode')}</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      {t('columnQuestion')}
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {t('columnAnswer')}
                    </span>
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-[180px]">
                    {t('columnCategory')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((qcode) => (
                  <TableRow key={qcode.code}>
                    <TableCell className="font-mono font-semibold text-azulejo-700 dark:text-azulejo-400 align-top">
                      {highlightMatch(qcode.code, searchQuery)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground whitespace-normal align-top">
                      {highlightMatch(qcode.question, searchQuery)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground whitespace-normal align-top">
                      {highlightMatch(qcode.answer, searchQuery)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-top">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', CATEGORY_COLORS[qcode.category])}
                      >
                        {CATEGORY_LABELS[qcode.category]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noResults')}</p>
          </div>
        )}

        {/* Reference note */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-2">
            {t('about')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('aboutDescription')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
