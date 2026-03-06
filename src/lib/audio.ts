export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;

  async start(onData: (base64: string) => void) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 尝试强制 16kHz，如果浏览器不支持，后续可能需要重采样（此处简化处理）
      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      
      const processorCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 0;
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              const pcm16 = new Int16Array(channelData.length);
              let sum = 0;
              for (let i = 0; i < channelData.length; i++) {
                let s = Math.max(-1, Math.min(1, channelData[i]));
                sum += s * s;
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              // 计算简单的 RMS 音量用于调试
              const rms = Math.sqrt(sum / channelData.length);
              this.port.postMessage({ buffer: pcm16.buffer, rms });
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
      
      let lastLogTime = 0;
      this.processor.port.onmessage = (e) => {
        const { buffer, rms } = e.data;
        
        // 每 2 秒打印一次麦克风状态，帮助排查静音问题
        const now = Date.now();
        if (now - lastLogTime > 2000) {
          console.log(`[AudioRecorder] Mic RMS: ${rms.toFixed(4)} (SampleRate: ${this.audioCtx?.sampleRate})`);
          if (rms < 0.001) {
            console.warn('[AudioRecorder] 麦克风输入音量极低，可能是静音或设备问题');
          }
          lastLogTime = now;
        }

        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        onData(window.btoa(binary));
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

  constructor(sampleRate = 24000) {
    this.audioCtx = new AudioContext({ sampleRate });
  }

  async ensureContext() {
    if (this.audioCtx.state === 'suspended') {
      console.log('[PCMPlayer] Resuming suspended AudioContext...');
      await this.audioCtx.resume();
    }
  }

  async playBase64(base64: string) {
    await this.ensureContext();

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 0x8000;
    }
    
    const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, this.audioCtx.sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
    
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    
    // 简单的时钟同步逻辑
    if (this.nextTime < this.audioCtx.currentTime) {
      this.nextTime = this.audioCtx.currentTime + 0.05; // 稍微加一点缓冲
    }
    source.start(this.nextTime);
    this.nextTime += audioBuffer.duration;
  }

  stop() {
    this.audioCtx.close();
  }
  
  clearQueue() {
    this.nextTime = 0;
  }
}
