import React, { useState, useRef, useCallback, useEffect } from 'react';

export function useScreenShare(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onFrame: ((base64Data: string) => void) | null,
  isConnected: boolean
) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  // Adaptive frame rate: 1fps default, 2fps when active
  const frameRateRef = useRef(1000);
  const qualityRef = useRef(0.5);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      return true;
    } catch (err) {
      console.error('Screen share failed:', err);
      return false;
    }
  }, [videoRef]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  }, [videoRef]);

  // Adaptive frame capture loop
  useEffect(() => {
    if (isConnected && isScreenSharing && onFrame) {
      const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            // Downscale large frames for better performance
            const maxDim = 1280;
            let w = video.videoWidth;
            let h = video.videoHeight;
            if (w > maxDim || h > maxDim) {
              const scale = maxDim / Math.max(w, h);
              w = Math.round(w * scale);
              h = Math.round(h * scale);
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64Data = canvas.toDataURL('image/jpeg', qualityRef.current).split(',')[1];
              onFrame(base64Data);
            }
          }
        }
      };

      videoIntervalRef.current = window.setInterval(captureFrame, frameRateRef.current);
      
      return () => {
        if (videoIntervalRef.current) {
          clearInterval(videoIntervalRef.current);
          videoIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, isScreenSharing, onFrame, videoRef, canvasRef]);

  // Adaptive quality control - can be called to adjust based on network conditions
  const setFrameRate = useCallback((fps: number) => {
    frameRateRef.current = Math.round(1000 / fps);
  }, []);

  const setQuality = useCallback((quality: number) => {
    qualityRef.current = quality;
  }, []);

  return {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    setFrameRate,
    setQuality,
  };
}
