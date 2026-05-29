import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, MonitorUp, MonitorOff, Play, Square, Activity, Terminal, LogOut, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { AudioRecorder, PCMPlayer } from './lib/audio';
import Auth from './components/Auth';
import { PersonaSelector, defaultPersonas } from './components/PersonaSelector';
import AdminPanel from './components/AdminPanel';

export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  endpoint: string;
}

export default function App() {
  const [user, setUser] = useState<{ id: string, username: string, is_approved: number } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const systemPromptRef = useRef<string>(defaultPersonas[0].systemPrompt);
  const [memories, setMemories] = useState<string[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [noiseThreshold, setNoiseThreshold] = useState(0.025);
  const noiseThresholdRef = useRef(0.025);
  const [logs, setLogs] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const customSkillsRef = useRef<CustomSkill[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState<CustomSkill>({ id: '', name: '', description: '', endpoint: '' });
  
  useEffect(() => {
    const saved = localStorage.getItem('customSkills');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomSkills(parsed);
        customSkillsRef.current = parsed;
      } catch(e) {}
    }
  }, []);

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
      
      let apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      // @ts-ignore
      if (!apiKey && typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
        // @ts-ignore
        apiKey = process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        try {
          const token = localStorage.getItem('token');
          const resp = await fetch('/api/config', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.geminiApiKey) {
              apiKey = data.geminiApiKey;
            }
          } else {
            const errorData = await resp.json().catch(()=>({}));
            throw new Error(errorData.error || `Failed to fetch API config (${resp.status})`);
          }
        } catch (err: any) {
          console.error("Failed to fetch API key from server", err);
          throw new Error(err.message || "Failed to fetch config");
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
            // 发送一条初始文本消息，让 AI 主动打招呼，提供连接成功的语音反馈
            if (sessionRef.current) {
              sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({ text: "你好！我已经连接成功了，请用简短、热情的一句话和我打个招呼，告诉我你已经准备好做我的视觉副驾了。" });
              });
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // 处理 Tool Call / Function Call (Skills 表现)
            if (message.toolCall?.functionCalls) {
              const responses = [];
              for (const fn of message.toolCall.functionCalls) {
                const args = fn.args || {};
                addLog(`✨ [Skill] 触发技能: ${fn.name} , 参数: ${JSON.stringify(args)}`);
                
                let result: any = { status: "success" };
                
                if (fn.name === 'remember_fact') {
                  setMemories(prev => {
                    if (!prev.includes(args.fact)) {
                      return [...prev, args.fact];
                    }
                    return prev;
                  });
                } else if (fn.name === 'get_current_time') {
                  result = { time: new Date().toLocaleString() };
                } else {
                  // Check custom skills
                  const customSkill = customSkillsRef.current.find(s => s.name === fn.name);
                  if (customSkill) {
                    try {
                      addLog(`🌐 请求外部技能端点: ${customSkill.endpoint}`);
                      const res = await fetch(customSkill.endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(args)
                      });
                      if (res.ok) {
                        result = await res.json();
                      } else {
                        result = { error: `HTTP ${res.status}: ${await res.text()}` };
                      }
                    } catch (e: any) {
                      result = { error: e.message || 'Unknown error calling endpoint' };
                    }
                  }
                }

                responses.push({
                  id: fn.id || "",
                  name: fn.name,
                  response: result
                });
              }

              if (responses.length > 0 && sessionRef.current) {
                sessionRef.current.then((session: any) => {
                  if (typeof session.sendToolResponse === 'function') {
                    session.sendToolResponse({
                      functionResponses: responses
                    });
                  } else if (typeof session.send === 'function') {
                    session.send({
                      toolResponse: {
                        functionResponses: responses
                      }
                    });
                  }
                  // Force AI to generate the next response explicitly
                  if (typeof session.send === 'function') {
                    session.send({
                      clientContent: {
                        turns: [{
                          role: "user",
                          parts: [{ text: "我已经执行了技能，请结合结果进行回答。" }]
                        }],
                        turnComplete: true
                      }
                    });
                  }
                });
              }
            }

            const serverContent = message.serverContent;
            if (serverContent?.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
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
                    type: "OBJECT",
                    properties: { fact: { type: "STRING", description: "需要保存的精简事实，如'用户今天在复习数学'" } },
                    required: ["fact"]
                  }
                },
                {
                  name: "get_current_time",
                  description: "Skill 时间感知能力：获取当前的本地系统时间。",
                },
                ...customSkillsRef.current.map(skill => ({
                  name: skill.name,
                  description: skill.description,
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      payload: { type: "STRING", description: "JSON arguments for the request." }
                    }
                  }
                }))
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

  if (showAdmin && user.username === 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-6">
        <div className="max-w-4xl mx-auto">
          <AdminPanel onBack={() => setShowAdmin(false)} />
        </div>
      </div>
    );
  }

  if (user.is_approved !== 1) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-amber-500/20 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">账号审核中</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            为了控制 API 成本并确保系统质量，您的账号目前正处于等待管理员审核的状态。<br/>审核通过后即可体验完整的 AI 视觉副驾功能。
          </p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition mx-auto"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* 隐藏的 Canvas 用于截图 */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen min-h-screen lg:max-h-screen">
        
        {/* 左侧：视频预览与状态 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
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
              
              {user.username === 'admin' && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  title="管理后台"
                >
                  <ShieldCheck className="w-4 h-4" />
                  审核管理
                </button>
              )}

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
        <div className="flex flex-col gap-6 lg:h-full lg:overflow-hidden min-h-0">
          
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                上下文记忆 (Memory)
              </h2>
            </div>
            {memories.length === 0 ? (
              <p className="text-xs text-zinc-500 italic bg-black/20 p-3 rounded-lg border border-white/5">
                在这个对话中你还没有专属记忆。你可以对 AI 说：“记住我现在正在学前端”，看看它的反应。
              </p>
            ) : (
              <ul className="space-y-2 mb-4">
                {memories.map((m, i) => (
                  <li key={i} className="text-xs text-zinc-300 bg-black/30 p-2.5 rounded-lg border border-emerald-500/10 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-500 font-mono mt-0.5">#{i+1}</span> {m}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  动态技能中心 (Skill Hub)
                </h2>
                <button 
                  onClick={() => setShowSkillModal(true)}
                  className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md hover:bg-purple-500/30 transition-colors"
                >
                  + 添加 (如 Clawhub 插件)
                </button>
              </div>

              {customSkills.length === 0 ? (
                <p className="text-xs text-zinc-500 italic bg-black/20 p-3 rounded-lg border border-white/5">
                  连接社区，支持标准 API 插件。点击添加绑定外部能力。
                </p>
              ) : (
                <ul className="space-y-2">
                  {customSkills.map((s) => (
                    <li key={s.id} className="text-xs text-zinc-300 bg-black/30 p-2.5 rounded-lg border border-purple-500/10 flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-400">{s.name}</span>
                        <span className="text-zinc-500 line-clamp-1">{s.description}</span>
                      </div>
                      <button 
                        onClick={() => {
                          const newer = customSkills.filter(x => x.id !== s.id);
                          setCustomSkills(newer);
                          customSkillsRef.current = newer;
                          localStorage.setItem('customSkills', JSON.stringify(newer));
                        }}
                        className="text-red-400/50 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 日志面板 */}
          <div className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col overflow-hidden min-h-[200px]">
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

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-white mb-4">添加自定义大模型技能</h3>
            <p className="text-sm text-zinc-400 mb-6">连接任何支持 MCP 或标准 webhook 回调的接口 (例如 Clawhub 的远程 API 节点)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">技能名称 (仅支持英文和下划线)</label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={e => setNewSkill({...newSkill, name: e.target.value.replace(/[^a-zA-Z_]/g, '')})}
                  placeholder="e.g. search_github_repo"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">给大模型的技能语境描述</label>
                <textarea
                  value={newSkill.description}
                  onChange={e => setNewSkill({...newSkill, description: e.target.value})}
                  placeholder="e.g. 这个技能能够让你调用 Github API..."
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">API Endpoint (POST Webhook)</label>
                <input
                  type="url"
                  value={newSkill.endpoint}
                  onChange={e => setNewSkill({...newSkill, endpoint: e.target.value})}
                  placeholder="https://api.clawhub.com/run/..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowSkillModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if(!newSkill.name || !newSkill.endpoint || !newSkill.description) return;
                  const finalSkill = { ...newSkill, id: Date.now().toString() };
                  const newer = [...customSkills, finalSkill];
                  setCustomSkills(newer);
                  customSkillsRef.current = newer;
                  localStorage.setItem('customSkills', JSON.stringify(newer));
                  setNewSkill({ id: '', name: '', description: '', endpoint: '' });
                  setShowSkillModal(false);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                disabled={!newSkill.name || !newSkill.endpoint || !newSkill.description}
              >
                保存技能
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
