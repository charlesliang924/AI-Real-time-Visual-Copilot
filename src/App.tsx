import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, MonitorUp, MonitorOff, Play, Square, Activity, Terminal } from 'lucide-react';
import { AudioRecorder, PCMPlayer } from './lib/audio';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const sessionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-50));
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);
      addLog('已开启屏幕共享');
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      addLog(`屏幕共享失败: ${err}`);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    addLog('已关闭屏幕共享');
  };

  const connectAI = async () => {
    try {
      addLog('正在连接 Gemini Live API...');
      pcmPlayerRef.current = new PCMPlayer();
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            addLog('WebSocket 连接成功！');
            setIsConnected(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // 解析 WebSocket 返回的 JSON，提取 serverContent.modelTurn 中的 PCM 音频数据
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && pcmPlayerRef.current) {
              setIsAiSpeaking(true);
              pcmPlayerRef.current.playBase64(base64Audio);
              // 简单的心跳重置说话状态
              setTimeout(() => setIsAiSpeaking(false), 500);
            }
            
            // 处理打断
            if (message.serverContent?.interrupted) {
              addLog('AI 语音被打断');
              if (pcmPlayerRef.current) {
                pcmPlayerRef.current.clearQueue();
              }
            }
          },
          onclose: () => {
            addLog('WebSocket 连接已关闭');
            disconnectAI();
          },
          onerror: (err) => {
            addLog(`WebSocket 错误: ${JSON.stringify(err)}`);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          // 注入系统指令
          systemInstruction: "你现在是我的专属游戏陪玩与智能视觉副驾。你可以看到我共享的实时屏幕画面，并听到我的语音指令。请根据我当前的游戏画面进度，结合我的问题，提供精准、简短、直接的语音指导和攻略。如果我切换到了写代码或学习的画面，请自动适应场景，变成一位专业导师。说话请保持自然、幽默、口语化，像坐在我旁边的好朋友一样。",
        },
      });
      
      sessionRef.current = sessionPromise;
      
    } catch (err) {
      addLog(`连接失败: ${err}`);
    }
  };

  const disconnectAI = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
      pcmPlayerRef.current = null;
    }
    setIsConnected(false);
    setIsAiSpeaking(false);
    addLog('已断开与 AI 的连接');
  };

  // 视频帧捕获循环 (1 fps)
  useEffect(() => {
    if (isConnected && isScreenSharing) {
      videoIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // 转换为 Base64 JPEG 格式
              const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
              
              // 封装在 realtimeInput 的 mediaChunks 中发送
              sessionRef.current.then((session: any) => {
                session.sendRealtimeInput([{
                  mimeType: 'image/jpeg',
                  data: base64Data
                }]);
              });
            }
          }
        }
      }, 1000); // 1 fps
    } else {
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
    }
    
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isConnected, isScreenSharing]);

  // 麦克风控制
  const toggleMic = async () => {
    if (isMicActive) {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      setIsMicActive(false);
      addLog('已关闭麦克风');
    } else {
      try {
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.start((base64Data) => {
          if (isConnected && sessionRef.current) {
            sessionRef.current.then((session: any) => {
              session.sendRealtimeInput([{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }]);
            });
          }
        });
        setIsMicActive(true);
        addLog('已开启麦克风');
      } catch (err) {
        addLog(`麦克风开启失败: ${err}`);
      }
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopScreenShare();
      disconnectAI();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* 隐藏的 Canvas 用于截图 */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
        
        {/* 左侧：视频预览与状态 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Terminal className="w-6 h-6 text-indigo-400" />
              AI 实时视觉副驾
            </h1>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                {isConnected ? '已连接 AI' : '未连接'}
              </div>
              {isAiSpeaking && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Activity className="w-4 h-4 animate-pulse" />
                  AI 正在说话
                </div>
              )}
            </div>
          </div>

          {/* 视频预览区 */}
          <div className="relative flex-1 bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
            {!isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                <MonitorOff className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">屏幕共享未开启</p>
                <p className="text-sm mt-2 opacity-70">点击下方按钮共享你的游戏或工作画面</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${isScreenSharing ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* 扫描线效果 */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
          </div>
        </div>

        {/* 右侧：控制台与日志 */}
        <div className="flex flex-col gap-6">
          
          {/* 控制面板 */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-white">控制台</h2>
            
            <div className="space-y-4">
              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isScreenSharing 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                    : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5'
                }`}
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
                {isScreenSharing ? '关闭屏幕共享' : '开启屏幕共享'}
              </button>

              <button
                onClick={toggleMic}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isMicActive 
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                    : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5'
                }`}
              >
                {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                {isMicActive ? '关闭麦克风' : '开启麦克风'}
              </button>

              <div className="h-px bg-white/10 my-2" />

              <button
                onClick={isConnected ? disconnectAI : connectAI}
                className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold transition-all duration-200 shadow-lg ${
                  isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                {isConnected ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                {isConnected ? '断开 AI 连接' : '连接 AI 副驾'}
              </button>
              
              <p className="text-xs text-zinc-500 text-center mt-4">
                API Key 已通过环境变量安全注入，无需手动输入。
              </p>
            </div>
          </div>

          {/* 日志面板 */}
          <div className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider">系统日志</h2>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic">等待系统初始化...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-zinc-300 break-words leading-relaxed">
                    <span className="text-indigo-400 mr-2">{log.split('] ')[0]}]</span>
                    {log.split('] ')[1]}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
