'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  NATO_ALPHABET,
  NATO_NUMBERS,
  getNATOWord,
  type NATOLetter,
} from '@/lib/nato-alphabet';

export function NATOAlphabetTrainer() {
  const t = useTranslations('nato');

  const [currentLetter, setCurrentLetter] = useState<NATOLetter | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showNumbers, setShowNumbers] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isAudioEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Prefer English voice for NATO words
      const englishVoice = voices.find(
        (v) => v.lang.startsWith('en') && v.localService
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    },
    [isAudioEnabled, voices]
  );

  const handleLetterClick = useCallback(
    (entry: NATOLetter) => {
      setCurrentLetter(entry);
      speak(entry.word);
    },
    [speak]
  );

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const entry = getNATOWord(e.key);
      if (entry) {
        // Only allow numbers if showNumbers is enabled
        if (NATO_NUMBERS.some((n) => n.letter === entry.letter) && !showNumbers) {
          return;
        }
        setCurrentLetter(entry);
        speak(entry.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speak, showNumbers]);

  const letters = showNumbers ? [...NATO_ALPHABET, ...NATO_NUMBERS] : NATO_ALPHABET;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Audio toggle */}
          {speechSupported ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="gap-2"
            >
              {isAudioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('audioEnabled')}</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('audioDisabled')}</span>
                </>
              )}
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t('speechNotSupported')}
            </Badge>
          )}
          {/* Numbers toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={showNumbers}
              onCheckedChange={setShowNumbers}
              id="show-numbers"
            />
            <label
              htmlFor="show-numbers"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {t('includeNumbers')}
            </label>
          </div>
        </div>
      </div>

      {/* Current Letter Display */}
      <Card className="mb-6">
        <CardContent className="py-8 sm:py-12">
          {currentLetter ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center h-24 w-24 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white text-5xl sm:text-6xl font-bold shadow-xl">
                {currentLetter.letter}
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {currentLetter.word}
                </h2>
                <p className="text-lg text-muted-foreground mt-2">
                  {t('pronunciation')}: {currentLetter.pronunciation}
                </p>
              </div>
              {speechSupported && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => speak(currentLetter.word)}
                  className="mt-4 gap-2"
                >
                  <Volume2 className="h-5 w-5" />
                  {t('hearIt')}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-8">
              <Keyboard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg sm:text-xl text-muted-foreground">
                {t('pressKey')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alphabet Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('reference')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2 sm:gap-3">
            {letters.map((entry) => (
              <button
                key={entry.letter}
                onClick={() => handleLetterClick(entry)}
                aria-label={`${entry.letter}, ${entry.word}`}
                className={cn(
                  'flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border transition-all duration-150',
                  'hover:bg-ship-cove-50 hover:border-ship-cove-300 dark:hover:bg-ship-cove-900/20 dark:hover:border-ship-cove-700',
                  'focus:outline-none focus:ring-2 focus:ring-ship-cove-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                  currentLetter?.letter === entry.letter
                    ? 'bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white border-ship-cove-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                )}
              >
                <span
                  className={cn(
                    'text-xl sm:text-2xl font-bold',
                    currentLetter?.letter === entry.letter
                      ? 'text-white'
                      : 'text-slate-900 dark:text-white'
                  )}
                >
                  {entry.letter}
                </span>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate w-full text-center',
                    currentLetter?.letter === entry.letter
                      ? 'text-white/90'
                      : 'text-muted-foreground'
                  )}
                >
                  {entry.word}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
