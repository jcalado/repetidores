'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioTuningAidProps {
  /** Initial tone frequency in Hz */
  defaultFrequency?: number;
}

export function AudioTuningAid({ defaultFrequency = 1000 }: AudioTuningAidProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(defaultFrequency);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Check for Web Audio API support
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.AudioContext && !(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current?.currentTime ?? 0
      );
    }
  }, [volume, isMuted]);

  // Update frequency in real-time
  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency,
        audioContextRef.current?.currentTime ?? 0
      );
    }
  }, [frequency]);

  const startTone = useCallback(() => {
    if (!isSupported) return;

    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          setIsSupported(false);
          return;
        }
        audioContextRef.current = new AudioContextClass();
      }

      // Resume context if suspended (autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create oscillator
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        frequency,
        audioContextRef.current.currentTime
      );

      // Create gain node for volume control
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Start oscillator
      oscillator.start();

      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting audio:', error);
      setIsSupported(false);
    }
  }, [frequency, volume, isMuted, isSupported]);

  const stopTone = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        // Ignore errors if already stopped
      }
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopTone();
    } else {
      startTone();
    }
  }, [isPlaying, startTone, stopTone]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            O seu navegador não suporta Web Audio API. Experimente outro navegador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music className="h-4 w-4" />
          Tom de Referência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use este tom para fazer zero-beat com o sinal recebido. Ajuste a
          frequência do tom até coincidir com o sinal.
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant={isPlaying ? 'destructive' : 'default'}
            size="sm"
            onClick={togglePlayback}
            className="w-24"
          >
            {isPlaying ? (
              <>
                <Square className="h-4 w-4 mr-1" />
                Parar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Tocar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="shrink-0"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">Vol</span>
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={1}
              className="w-24"
              disabled={isMuted}
            />
          </div>
        </div>

        {/* Frequency slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Frequência do tom</span>
            <span className="text-sm font-mono text-muted-foreground">
              {frequency} Hz
            </span>
          </div>
          <Slider
            value={[frequency]}
            onValueChange={([f]) => setFrequency(f)}
            min={400}
            max={1600}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>400 Hz</span>
            <span>1000 Hz</span>
            <span>1600 Hz</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Presets:</span>
          {[600, 800, 1000, 1200].map((f) => (
            <Button
              key={f}
              variant={frequency === f ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFrequency(f)}
              className="text-xs"
            >
              {f} Hz
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
