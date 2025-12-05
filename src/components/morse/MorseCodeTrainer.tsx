'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX, Keyboard, Play, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  MORSE_ALPHABET,
  MORSE_NUMBERS,
  getMorseCode,
  getRandomCharacter,
  MorseAudioPlayer,
  type MorseCharacter,
} from '@/lib/morse';

type PracticeState = 'idle' | 'playing' | 'waiting' | 'correct' | 'incorrect';

export function MorseCodeTrainer() {
  const t = useTranslations('morse');

  const [currentChar, setCurrentChar] = useState<MorseCharacter | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showNumbers, setShowNumbers] = useState(false);
  const [wpm, setWpm] = useState(15);
  const [frequency, setFrequency] = useState(700);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [mode, setMode] = useState<'learn' | 'practice'>('learn');

  // Practice mode state
  const [practiceChar, setPracticeChar] = useState<MorseCharacter | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [userInput, setUserInput] = useState('');

  const audioPlayerRef = useRef<MorseAudioPlayer | null>(null);

  // Initialize audio player
  useEffect(() => {
    if (typeof window === 'undefined') {
      setAudioSupported(false);
      return;
    }

    try {
      audioPlayerRef.current = new MorseAudioPlayer();
    } catch {
      setAudioSupported(false);
    }

    return () => {
      audioPlayerRef.current?.dispose();
    };
  }, []);

  // Update audio player settings
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setFrequency(frequency);
    }
  }, [frequency]);

  const playMorse = useCallback(
    async (char: MorseCharacter) => {
      if (!isAudioEnabled || !audioPlayerRef.current) return;

      setIsPlaying(true);
      try {
        await audioPlayerRef.current.playMorseCode(char.code, wpm);
      } catch {
        // Playback was stopped or failed
      } finally {
        setIsPlaying(false);
      }
    },
    [isAudioEnabled, wpm]
  );

  const handleCharClick = useCallback(
    (char: MorseCharacter) => {
      setCurrentChar(char);
      playMorse(char);
    },
    [playMorse]
  );

  // Keyboard handler for learn mode
  useEffect(() => {
    if (mode !== 'learn') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const char = getMorseCode(e.key);
      if (char) {
        if (char.type === 'number' && !showNumbers) return;
        setCurrentChar(char);
        playMorse(char);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, playMorse, showNumbers]);

  // Practice mode functions
  const startPractice = useCallback(() => {
    const char = getRandomCharacter(showNumbers);
    setPracticeChar(char);
    setPracticeState('playing');
    setUserInput('');

    // Play the morse code
    if (audioPlayerRef.current && isAudioEnabled) {
      setIsPlaying(true);
      audioPlayerRef.current.playMorseCode(char.code, wpm).then(() => {
        setIsPlaying(false);
        setPracticeState('waiting');
      });
    } else {
      setPracticeState('waiting');
    }
  }, [showNumbers, wpm, isAudioEnabled]);

  const replayPractice = useCallback(() => {
    if (!practiceChar || !audioPlayerRef.current || !isAudioEnabled) return;

    setIsPlaying(true);
    audioPlayerRef.current.playMorseCode(practiceChar.code, wpm).then(() => {
      setIsPlaying(false);
    });
  }, [practiceChar, wpm, isAudioEnabled]);

  // Keyboard handler for practice mode
  useEffect(() => {
    if (mode !== 'practice' || practiceState !== 'waiting') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(key) && practiceChar) {
        setUserInput(key);

        if (key === practiceChar.char) {
          setPracticeState('correct');
          setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        } else {
          setPracticeState('incorrect');
          setScore((prev) => ({ ...prev, total: prev.total + 1 }));
        }

        // Auto-advance after a short delay
        setTimeout(() => {
          startPractice();
        }, 1500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, practiceState, practiceChar, startPractice]);

  const resetScore = () => {
    setScore({ correct: 0, total: 0 });
    setPracticeState('idle');
    setPracticeChar(null);
  };

  const characters = showNumbers
    ? [...MORSE_ALPHABET, ...MORSE_NUMBERS]
    : MORSE_ALPHABET;

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
          {audioSupported ? (
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
              {t('audioNotSupported')}
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

      {/* Settings */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* WPM Slider */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{t('speed')}</label>
                <span className="text-sm text-muted-foreground font-mono">
                  {wpm} {t('wpm')}
                </span>
              </div>
              <Slider
                value={[wpm]}
                onValueChange={(values) => setWpm(values[0])}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            {/* Frequency Slider */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{t('tone')}</label>
                <span className="text-sm text-muted-foreground font-mono">
                  {frequency} {t('hz')}
                </span>
              </div>
              <Slider
                value={[frequency]}
                onValueChange={(values) => setFrequency(values[0])}
                min={400}
                max={1000}
                step={50}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'learn' | 'practice')}>
        <TabsList className="mb-6">
          <TabsTrigger value="learn">{t('learnMode')}</TabsTrigger>
          <TabsTrigger value="practice">{t('practiceMode')}</TabsTrigger>
        </TabsList>

        {/* Learn Mode */}
        <TabsContent value="learn" className="space-y-6">
          {/* Current Character Display */}
          <Card>
            <CardContent className="py-8 sm:py-12">
              {currentChar ? (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center h-24 w-24 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white text-5xl sm:text-6xl font-bold shadow-xl">
                    {currentChar.char}
                  </div>
                  <div>
                    <div className="flex justify-center gap-2 text-4xl sm:text-5xl font-mono mt-4">
                      {currentChar.code.split('').map((symbol, i) => (
                        <span
                          key={i}
                          className={cn(
                            'flex items-center justify-center',
                            symbol === '.'
                              ? 'w-4 h-4 bg-ship-cove-600 rounded-full'
                              : 'w-10 h-4 bg-ship-cove-600 rounded-full'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-2xl font-mono text-muted-foreground mt-4">
                      {currentChar.code}
                    </p>
                  </div>
                  {audioSupported && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => playMorse(currentChar)}
                      disabled={isPlaying}
                      className="mt-4 gap-2"
                    >
                      <Volume2 className={cn('h-5 w-5', isPlaying && 'animate-pulse')} />
                      {isPlaying ? t('playing') : t('play')}
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

          {/* Character Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('reference')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2 sm:gap-3">
                {characters.map((char) => (
                  <button
                    key={char.char}
                    onClick={() => handleCharClick(char)}
                    aria-label={`${char.char}, ${char.code}`}
                    className={cn(
                      'flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border transition-all duration-150',
                      'hover:bg-ship-cove-50 hover:border-ship-cove-300 dark:hover:bg-ship-cove-900/20 dark:hover:border-ship-cove-700',
                      'focus:outline-none focus:ring-2 focus:ring-ship-cove-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                      currentChar?.char === char.char
                        ? 'bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white border-ship-cove-600 shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xl sm:text-2xl font-bold',
                        currentChar?.char === char.char
                          ? 'text-white'
                          : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {char.char}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-mono',
                        currentChar?.char === char.char
                          ? 'text-white/90'
                          : 'text-muted-foreground'
                      )}
                    >
                      {char.code}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practice Mode */}
        <TabsContent value="practice" className="space-y-6">
          {/* Score */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {score.correct}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('correct')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {score.total}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('total')}</p>
                  </div>
                  {score.total > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-ship-cove-600 dark:text-ship-cove-400">
                        {Math.round((score.correct / score.total) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">{t('accuracy')}</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={resetScore}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t('reset')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Area */}
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                {practiceState === 'idle' && (
                  <>
                    <p className="text-lg text-muted-foreground">{t('practiceDescription')}</p>
                    <Button size="lg" onClick={startPractice} className="gap-2">
                      <Play className="h-5 w-5" />
                      {t('startPractice')}
                    </Button>
                  </>
                )}

                {practiceState === 'playing' && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600">
                      <Volume2 className="h-10 w-10 text-ship-cove-600 animate-pulse" />
                    </div>
                    <p className="text-lg text-muted-foreground">{t('listening')}</p>
                  </div>
                )}

                {practiceState === 'waiting' && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-gray-100 dark:bg-slate-800 border-2 border-ship-cove-500 text-4xl font-bold text-muted-foreground">
                      ?
                    </div>
                    <p className="text-lg text-muted-foreground">{t('typeAnswer')}</p>
                    <Button variant="outline" onClick={replayPractice} disabled={isPlaying}>
                      <Volume2 className="h-4 w-4 mr-2" />
                      {t('replay')}
                    </Button>
                  </div>
                )}

                {practiceState === 'correct' && practiceChar && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-4xl font-bold text-green-600 dark:text-green-400">
                      {practiceChar.char}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-6 w-6" />
                      <span className="text-lg font-medium">{t('correctAnswer')}</span>
                    </div>
                    <p className="font-mono text-2xl text-muted-foreground">
                      {practiceChar.code}
                    </p>
                  </div>
                )}

                {practiceState === 'incorrect' && practiceChar && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-xl bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-3xl font-bold text-red-600 dark:text-red-400">
                          {userInput}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t('yourAnswer')}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-xl bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-3xl font-bold text-green-600 dark:text-green-400">
                          {practiceChar.char}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t('correctWas')}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-6 w-6" />
                      <span className="text-lg font-medium">{t('incorrectAnswer')}</span>
                    </div>
                    <p className="font-mono text-2xl text-muted-foreground">
                      {practiceChar.code}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
