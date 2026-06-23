export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;

  async start(onData: (base64: string, rms: number) => void, onVolume?: (rms: number) => void) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      
      const processorCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 4096; // 256ms at 16kHz
            this.buffer = new Int16Array(this.bufferSize);
            this.offset = 0;
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              for (let i = 0; i < channelData.length; i++) {
                let s = Math.max(-1, Math.min(1, channelData[i]));
                this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                
                if (this.offset >= this.bufferSize) {
                  let sum = 0;
                  for (let j = 0; j < this.bufferSize; j++) {
                    const val = this.buffer[j] / 32768.0;
                    sum += val * val;
                  }
                  const rms = Math.sqrt(sum / this.bufferSize);
                  
                  this.port.postMessage({ buffer: this.buffer.slice(0).buffer, rms });
                  this.offset = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      await this.audioCtx.audioWorklet.addModule(url);
      
      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.processor = new AudioWorkletNode(this.audioCtx, 'pcm-processor');
    
      this.processor.port.onmessage = (e) => {
        const { buffer, rms } = e.data;
        
        if (onVolume) onVolume(rms);

        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        onData(window.btoa(binary), rms);
      };
      
      this.source.connect(this.processor);
      
      // Connect to a gain node with 0 volume to keep the graph running without feedback
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0;
      this.processor.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
    } catch (error) {
      console.error('[AudioRecorder] Start error:', error);
      throw error;
    }
  }

  stop() {
    if (this.processor) this.processor.disconnect();
    if (this.source) this.source.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioCtx) this.audioCtx.close();
  }
}

export class PCMPlayer {
  private audioCtx: AudioContext;
  private nextTime: number = 0;
  private isInitialized = false;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(sampleRate = 24000) {
    this.audioCtx = new AudioContext({ sampleRate });
    this.unlock();
  }

  private unlock() {
    // Play a silent buffer to unlock the AudioContext on mobile/Safari
    const buffer = this.audioCtx.createBuffer(1, 1, 22050);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    source.start(0);
  }

  async ensureContext() {
    if (this.audioCtx.state === 'suspended') {
      console.log('[PCMPlayer] Resuming suspended AudioContext...');
      await this.audioCtx.resume();
    }
  }

  private playLock: Promise<void> = Promise.resolve();
  private queueVersion: number = 0;

  async playBase64(base64: string) {
    const currentVersion = this.queueVersion;
    const unlock = await this.acquireLock();
    try {
      if (this.queueVersion !== currentVersion) {
        // Queue was cleared while we were waiting for the lock
        return;
      }
      
      await this.ensureContext();
      
      if (this.queueVersion !== currentVersion) {
        // Queue was cleared while ensuring context
        return;
      }

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const validLen = len % 2 === 0 ? len : len - 1;
      const int16Array = new Int16Array(bytes.buffer, 0, validLen / 2);
      
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 0x8000;
      }
      
      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, this.audioCtx.sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      
      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
        source.disconnect();
      };

      if (this.nextTime < this.audioCtx.currentTime) {
        this.nextTime = this.audioCtx.currentTime + 0.05;
      }
      source.start(this.nextTime);
      this.activeSources.push(source);
      this.nextTime += audioBuffer.duration;
    } finally {
      unlock();
    }
  }

  private acquireLock(): Promise<() => void> {
    let unlockNext: () => void;
    const nextLock = new Promise<void>(resolve => {
      unlockNext = resolve;
    });
    
    const currentLock = this.playLock;
    this.playLock = currentLock.then(() => nextLock);
    
    return currentLock.then(() => unlockNext);
  }

  stop() {
    this.clearQueue();
    this.audioCtx.close();
  }
  
  clearQueue() {
    this.queueVersion++;
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // source may have already stopped
      }
    });
    this.activeSources = [];
    this.nextTime = 0;
  }
}
