'use client';

import { Repeater } from '@/app/columns';
import { getPrimaryFrequency } from '@/types/repeater-helpers';
import { cn } from '@/lib/utils';
import { Radio, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface SearchAutocompleteProps {
  repeaters: Repeater[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (repeater: Repeater) => void;
  placeholder?: string;
  className?: string;
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return '70cm';
  if (mhz >= 144 && mhz <= 148) return '2m';
  if (mhz >= 50 && mhz <= 54) return '6m';
  return 'Other';
}

export default function SearchAutocomplete({
  repeaters,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: SearchAutocompleteProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const t = useTranslations();

  // Filter repeaters based on search query
  const filteredRepeaters = React.useMemo(() => {
    if (!value.trim()) return [];

    const query = value.toLowerCase();
    return repeaters
      .filter(
        (r) =>
          r.callsign.toLowerCase().includes(query) ||
          r.owner?.toLowerCase().includes(query) ||
          r.qthLocator?.toLowerCase().includes(query)
      )
      .slice(0, 8); // Limit to 8 results
  }, [repeaters, value]);

  const showDropdown = isFocused && value.trim().length > 0 && filteredRepeaters.length > 0;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredRepeaters.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredRepeaters.length) {
          handleSelect(filteredRepeaters[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (repeater: Repeater) => {
    onChange(repeater.callsign);
    setIsFocused(false);
    setHighlightedIndex(-1);
    onSelect?.(repeater);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Reset highlighted index when results change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredRepeaters.length]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('filters.callsign')}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-9 py-1 text-base shadow-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'md:text-sm'
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Clear"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          <ul ref={listRef} className="max-h-[300px] overflow-auto p-1">
            {filteredRepeaters.map((repeater, index) => (
              <li key={repeater.callsign}>
                <button
                  type="button"
                  onClick={() => handleSelect(repeater)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                    highlightedIndex === index
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {(() => {
                      const primary = getPrimaryFrequency(repeater);
                      const modesStr = repeater.modes?.map(m => m === 'DSTAR' ? 'D-STAR' : m).join('/') || 'FM';
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repeater.callsign}</span>
                            {primary && (
                              <span className="text-xs text-muted-foreground">
                                {getBandFromFrequency(primary.outputFrequency)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {modesStr}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {primary ? `${primary.outputFrequency.toFixed(3)} MHz` : ''}
                            {repeater.owner && ` · ${repeater.owner}`}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t p-2">
            <p className="text-xs text-center text-muted-foreground">
              {filteredRepeaters.length} resultado{filteredRepeaters.length !== 1 ? 's' : ''}
              {' · '}
              <span className="text-muted-foreground/70">↑↓ navegar · Enter selecionar</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
