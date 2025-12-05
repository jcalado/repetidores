export interface MorseCharacter {
  char: string;
  code: string;
  type: 'letter' | 'number';
}

export const MORSE_ALPHABET: MorseCharacter[] = [
  { char: 'A', code: '.-', type: 'letter' },
  { char: 'B', code: '-...', type: 'letter' },
  { char: 'C', code: '-.-.', type: 'letter' },
  { char: 'D', code: '-..', type: 'letter' },
  { char: 'E', code: '.', type: 'letter' },
  { char: 'F', code: '..-.', type: 'letter' },
  { char: 'G', code: '--.', type: 'letter' },
  { char: 'H', code: '....', type: 'letter' },
  { char: 'I', code: '..', type: 'letter' },
  { char: 'J', code: '.---', type: 'letter' },
  { char: 'K', code: '-.-', type: 'letter' },
  { char: 'L', code: '.-..', type: 'letter' },
  { char: 'M', code: '--', type: 'letter' },
  { char: 'N', code: '-.', type: 'letter' },
  { char: 'O', code: '---', type: 'letter' },
  { char: 'P', code: '.--.', type: 'letter' },
  { char: 'Q', code: '--.-', type: 'letter' },
  { char: 'R', code: '.-.', type: 'letter' },
  { char: 'S', code: '...', type: 'letter' },
  { char: 'T', code: '-', type: 'letter' },
  { char: 'U', code: '..-', type: 'letter' },
  { char: 'V', code: '...-', type: 'letter' },
  { char: 'W', code: '.--', type: 'letter' },
  { char: 'X', code: '-..-', type: 'letter' },
  { char: 'Y', code: '-.--', type: 'letter' },
  { char: 'Z', code: '--..', type: 'letter' },
];

export const MORSE_NUMBERS: MorseCharacter[] = [
  { char: '0', code: '-----', type: 'number' },
  { char: '1', code: '.----', type: 'number' },
  { char: '2', code: '..---', type: 'number' },
  { char: '3', code: '...--', type: 'number' },
  { char: '4', code: '....-', type: 'number' },
  { char: '5', code: '.....', type: 'number' },
  { char: '6', code: '-....', type: 'number' },
  { char: '7', code: '--...', type: 'number' },
  { char: '8', code: '---..', type: 'number' },
  { char: '9', code: '----.', type: 'number' },
];

export const ALL_MORSE = [...MORSE_ALPHABET, ...MORSE_NUMBERS];

export function getMorseCode(char: string): MorseCharacter | undefined {
  return ALL_MORSE.find((m) => m.char === char.toUpperCase());
}

// Timing constants (in units, where 1 unit = 1 dot duration)
export const MORSE_TIMING = {
  DOT: 1,
  DASH: 3,
  INTRA_CHAR_GAP: 1, // Gap between symbols within a character
  INTER_CHAR_GAP: 3, // Gap between characters
  WORD_GAP: 7, // Gap between words
};

/**
 * Convert WPM (words per minute) to milliseconds per unit
 * Based on PARIS standard: "PARIS" = 50 units
 */
export function wpmToUnitMs(wpm: number): number {
  return 1200 / wpm;
}

/**
 * Get random character from the available set
 */
export function getRandomCharacter(includeNumbers: boolean): MorseCharacter {
  const chars = includeNumbers ? ALL_MORSE : MORSE_ALPHABET;
  return chars[Math.floor(Math.random() * chars.length)];
}

/**
 * Class to handle Morse code audio playback using Web Audio API
 */
export class MorseAudioPlayer {
  private audioContext: AudioContext | null = null;
  private frequency: number = 700;
  private isPlaying: boolean = false;
  private abortController: AbortController | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  setFrequency(hz: number) {
    this.frequency = hz;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isPlaying = false;
  }

  private async playTone(durationMs: number, signal: AbortSignal): Promise<void> {
    if (!this.audioContext || signal.aborted) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(this.frequency, this.audioContext!.currentTime);

      // Smooth envelope to avoid clicks
      const now = this.audioContext!.currentTime;
      const rampTime = 0.005; // 5ms ramp
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + rampTime);
      gainNode.gain.setValueAtTime(0.5, now + durationMs / 1000 - rampTime);
      gainNode.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now);
      oscillator.stop(now + durationMs / 1000);

      const abortHandler = () => {
        oscillator.stop();
        reject(new DOMException('Aborted', 'AbortError'));
      };

      signal.addEventListener('abort', abortHandler);

      oscillator.onended = () => {
        signal.removeEventListener('abort', abortHandler);
        resolve();
      };
    });
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      const timeout = setTimeout(resolve, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  async playMorseCode(code: string, wpm: number): Promise<void> {
    if (!this.audioContext) return;

    // Stop any currently playing sound
    this.stop();

    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.isPlaying = true;

    const unitMs = wpmToUnitMs(wpm);

    try {
      for (let i = 0; i < code.length; i++) {
        if (signal.aborted) break;

        const symbol = code[i];
        if (symbol === '.') {
          await this.playTone(unitMs * MORSE_TIMING.DOT, signal);
        } else if (symbol === '-') {
          await this.playTone(unitMs * MORSE_TIMING.DASH, signal);
        }

        // Add intra-character gap (except after last symbol)
        if (i < code.length - 1) {
          await this.delay(unitMs * MORSE_TIMING.INTRA_CHAR_GAP, signal);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Playback was stopped, this is expected
      } else {
        throw e;
      }
    } finally {
      this.isPlaying = false;
      this.abortController = null;
    }
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
