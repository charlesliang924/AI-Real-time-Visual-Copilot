import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { Mic, MicOff, MonitorUp, MonitorOff, Play, Square, Activity, Terminal, LogOut, Loader2 } from 'lucide-react';
import { AudioRecorder, PCMPlayer } from './lib/audio';
import Auth from './components/Auth';
import { PersonaSelector, defaultPersonas } from './components/PersonaSelector';

export default function App() {
  const [user, setUser] = useState<{ id: string, username: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const systemPromptRef = useRef<string>(defaultPersonas[0].systemPrompt);
  const [memories, setMemories] = useState<string[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [noiseThreshold, setNoiseThreshold] = useState(0.005);
  const noiseThresholdRef = useRef(0.005);
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    noiseThresholdRef.current = noiseThreshold;
  }, [noiseThreshold]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const sessionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const silenceFramesRef = useRef<number>(0);
  
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
      
      // @ts-ignore
      let apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      // @ts-ignore
      if (!apiKey && typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
        // @ts-ignore
        apiKey = process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        try {
          const resp = await fetch('/api/config');
          if (resp.ok) {
            const data = await resp.json();
            if (data.geminiApiKey) {
              apiKey = data.geminiApiKey;
            }
          }
        } catch (err) {
          console.error("Failed to fetch API key from server", err);
        }
      }

      if (!apiKey) {
        throw new Error("未找到 API Key，请在后端环境或环境变量中设置 VITE_GEMINI_API_KEY");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            addLog('WebSocket 连接成功！');
            setIsConnected(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // 处理 Tool Call / Function Call (Skills 表现)
            const serverContent = message.serverContent;
            if (serverContent?.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                if (part.functionCall) {
                  const fn = part.functionCall as any;
                  const args = fn.args || {};
                  addLog(`✨ [Skill] 触发技能: ${fn.name} , 参数: ${JSON.stringify(args)}`);
                  
                  let result: any = { status: "success" };
                  
                  if (fn.name === 'remember_fact') {
                    setMemories(prev => [...prev, args.fact]);
                  } else if (fn.name === 'get_current_time') {
                    result = { time: new Date().toLocaleString() };
                  } else if (fn.name === 'search_internet') {
                    addLog(`正在执行联网搜索: ${args.query}`);
                    // 模拟搜索结果，实际应用中可以调用真实的搜索引擎 API
                    result = { results: [`[搜索结果] 关于 "${args.query}" 的信息：这是通过模拟联网搜索得到的结果，表明目前系统已接通自定义搜索能力。`] };
                  }

                  // 响应 Tool Call
                  if (sessionRef.current) {
                    sessionRef.current.then((session: any) => {
                      if (typeof session.sendToolResponse === 'function') {
                        session.sendToolResponse({
                          functionResponses: [{
                            id: fn.id || "",
                            name: fn.name,
                            response: result
                          }]
                        });
                      }
                    });
                  }
                }

                if (part.inlineData && part.inlineData.data) {
                  const base64Audio = part.inlineData.data;
                  if (pcmPlayerRef.current) {
                    try {
                      // 尝试播放音频
                      await pcmPlayerRef.current.playBase64(base64Audio);
                      setIsAiSpeaking(true);
                      // 简单的心跳重置说话状态
                      setTimeout(() => setIsAiSpeaking(false), 500);
                    } catch (playErr) {
                      console.error('[App] Audio playback error:', playErr);
                      addLog(`音频播放失败: ${playErr}`);
                    }
                  } else {
                    console.warn('[App] Received audio but player is not initialized');
                  }
                }
              }
            }
            
            // 处理打断
            if (message.serverContent?.interrupted) {
              addLog('AI 语音被打断');
              if (pcmPlayerRef.current) {
                pcmPlayerRef.current.clearQueue();
              }
            }
          },
          onclose: (ev) => {
            addLog(`WebSocket 连接已关闭 (Reason: ${ev?.reason || 'Unknown'}, Code: ${ev?.code || 'Unknown'})`);
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
          // 注入系统指令 (含动态记忆)
          systemInstruction: systemPromptRef.current + (memories.length > 0 ? "\n\n当前用户的核心记忆（请在对话中自然参考这些信息）：\n" + memories.map((m,i)=>`${i+1}. ${m}`).join('\n') : ""),
          // 技能/工具声明
          tools: [
            {
              functionDeclarations: [
                {
                  name: "remember_fact",
                  description: "Skill 记忆能力：提取并持久化保存用户的重要事实（例如身份、偏好、习惯或正在做的关键事情），以此作为你的“长期记忆”。如果用户提到“记住我是xx”或“以后叫我xx”，调用此技能。",
                  parameters: {
                    type: Type.OBJECT,
                    properties: { fact: { type: Type.STRING, description: "需要保存的精简事实，如'用户今天在复习数学'" } },
                    required: ["fact"]
                  }
                },
                {
                  name: "get_current_time",
                  description: "Skill 时间感知能力：获取当前的本地系统时间。",
                },
                {
                  name: "search_internet",
                  description: "Skill 联网搜索能力：如果你需要最新的联网信息，调用此技能进行搜索",
                  parameters: {
                    type: Type.OBJECT,
                    properties: { query: { type: Type.STRING, description: "搜索关键词" } },
                    required: ["query"]
                  }
                }
              ]
            }
          ]
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
              
              // 封装在 realtimeInput 中发送
              sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({
                  video: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                });
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
      setMicVolume(0);
      addLog('已关闭麦克风');
    } else {
      try {
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.start((base64Data, rms) => {
          // 客户端 VAD (噪音门限)：低于阈值的背景噪音不发送，防止打断 AI
          if (rms > noiseThresholdRef.current) {
            isSpeakingRef.current = true;
            silenceFramesRef.current = 0;
          } else {
            silenceFramesRef.current++;
            // 缓冲约 1 秒 (4 帧 * 256ms) 后判定为静音
            if (silenceFramesRef.current > 4) {
              isSpeakingRef.current = false;
            }
          }

          // 使用 sessionRef.current 判断连接状态，避免 isConnected 的闭包陷阱
          if (sessionRef.current && isSpeakingRef.current) {
            sessionRef.current.then((session: any) => {
              session.sendRealtimeInput({
                audio: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Data
                }
              });
            });
          }
        }, (rms) => {
          setMicVolume(rms);
        });
        setIsMicActive(true);
        addLog('已开启麦克风');
      } catch (err) {
        addLog(`麦克风开启失败: ${err}`);
      }
    }
  };

  // 组件挂载时检查 JWT Token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthReady(true);
        return;
      }
      try {
        const resp = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to restore auth', err);
        localStorage.removeItem('token');
      }
      setIsAuthReady(true);
    };
    checkAuth();

    return () => {
      stopScreenShare();
      disconnectAI();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSignOut = () => {
    disconnectAI();
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

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
              
              {/* Persona Selector Header Component */}
              <PersonaSelector 
                currentPersonaId={currentPersonaId} 
                onSelect={(id, prompt) => {
                  setCurrentPersonaId(id);
                  systemPromptRef.current = prompt;
                  if (isConnected) {
                    addLog('角色切换成功。将在下一次重新连接时生效。');
                  }
                }} 
              />
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </button>
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

              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleMic}
                  className={`relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    isMicActive 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                      : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5'
                  }`}
                >
                  {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  {isMicActive ? '关闭麦克风' : '开启麦克风'}
                  
                  {isMicActive && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div 
                        className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75" 
                        style={{ height: `${Math.max(4, Math.min(24, micVolume * 500))}px` }} 
                      />
                    </div>
                  )}
                </button>
                
                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">收音阈值</span>
                  <input
                    type="range"
                    min="0.001"
                    max="0.05"
                    step="0.001"
                    value={noiseThreshold}
                    onChange={(e) => setNoiseThreshold(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    title="调高可过滤背景噪音，防止打断 AI"
                  />
                  <span className="text-xs text-zinc-400 font-mono w-8 text-right">{noiseThreshold.toFixed(3)}</span>
                </div>
              </div>

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
                API Key 已通过环境变量 (VITE_GEMINI_API_KEY) 安全注入，无需手动输入。
              </p>
            </div>
          </div>

          {/* 记忆与技能面板 */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              上下文记忆 (Memory)
            </h2>
            {memories.length === 0 ? (
              <p className="text-xs text-zinc-500 italic bg-black/20 p-3 rounded-lg border border-white/5">
                在这个对话中你还没有专属记忆。你可以对 AI 说：“记住我现在正在学前端”，看看它的反应。
              </p>
            ) : (
              <ul className="space-y-2">
                {memories.map((m, i) => (
                  <li key={i} className="text-xs text-zinc-300 bg-black/30 p-2.5 rounded-lg border border-emerald-500/10 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-500 font-mono mt-0.5">#{i+1}</span> {m}
                  </li>
                ))}
              </ul>
            )}
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
