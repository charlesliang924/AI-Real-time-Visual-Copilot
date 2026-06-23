import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder } from '../lib/audio';

export function useAudioRecorder(
  onData: ((base64Data: string, rms: number) => void) | null,
  noiseThreshold: number
) {
  const [isMicActive, setIsMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const noiseThresholdRef = useRef(noiseThreshold);
  const isSpeakingRef = useRef(false);
  const silenceFramesRef = useRef(0);

  // Sync threshold ref when prop changes
  useEffect(() => {
    noiseThresholdRef.current = noiseThreshold;
  }, [noiseThreshold]);

  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      setIsMicActive(false);
      setMicVolume(0);
      return false;
    } else {
      try {
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.start((base64Data, rms) => {
          // Client-side VAD (noise gate)
          if (rms > noiseThresholdRef.current) {
            isSpeakingRef.current = true;
            silenceFramesRef.current = 0;
          } else {
            silenceFramesRef.current++;
            if (silenceFramesRef.current > 4) {
              isSpeakingRef.current = false;
            }
          }

          if (onData && isSpeakingRef.current) {
            onData(base64Data, rms);
          }
        }, (rms) => {
          setMicVolume(rms);
        });
        setIsMicActive(true);
        return true;
      } catch (err) {
        console.error('Mic start failed:', err);
        throw err;
      }
    }
  }, [isMicActive, onData]);

  const stop = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setIsMicActive(false);
    setMicVolume(0);
  }, []);

  return {
    isMicActive,
    micVolume,
    toggleMic,
    stop,
  };
}
