import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { PCMPlayer } from '../lib/audio';
import { api } from '../lib/api';
import type { CustomSkill } from './useSkills';
import type { Memory } from './useMemories';

interface UseGeminiSessionParams {
  systemPrompt: string;
  memories: Memory[];
  customSkills: CustomSkill[];
  onMemoryAdd: (fact: string) => void;
  onConversationAdd: (role: string, content: string) => void;
  onLog: (msg: string) => void;
  onStatsLog: (eventType: string, metadata?: any) => void;
  userId?: string;
}

export interface RichContent {
  type: 'link' | 'image';
  url: string;
  title?: string;
  caption?: string;
}

export interface SubtitleEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  richContent?: RichContent;
}

export function useGeminiSession(params: UseGeminiSessionParams) {
  const { systemPrompt, memories, customSkills, onMemoryAdd, onConversationAdd, onLog, onStatsLog, userId } = params;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const systemPromptRef = useRef(systemPrompt);
  const memoriesRef = useRef(memories);
  const customSkillsRef = useRef(customSkills);
  const isThinkingRef = useRef(false);
  const thinkingTimeoutRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManualDisconnectRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const lastConnectTimeRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { memoriesRef.current = memories; }, [memories]);
  useEffect(() => { customSkillsRef.current = customSkills; }, [customSkills]);

  // 流式字幕合并：同一角色在 2 秒内的碎片追加到上一条，遇到句末标点则断句
  const lastSubtitleRef = useRef<{ role: string; timestamp: number; text: string } | null>(null);
  const pendingFlushTimerRef = useRef<number | null>(null);

  const addSubtitle = useCallback((role: 'user' | 'assistant', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    // 句末标点检测
    const sentenceEnders = /([。！？!?\n])/;
    const endsWithSentence = sentenceEnders.test(trimmed);

    // 判断是否应该追加到上一条：同一角色 + 2秒内 + 上一条未以句末标点结尾
    const shouldAppend = lastSubtitleRef.current &&
      lastSubtitleRef.current.role === role &&
      now - lastSubtitleRef.current.timestamp < 2000 &&
      !/[。！？!?\n]$/.test(lastSubtitleRef.current.text);

    if (shouldAppend) {
      // 追加到上一条
      const combinedText = lastSubtitleRef.current.text + trimmed;
      lastSubtitleRef.current = { role, timestamp: now, text: combinedText };

      setSubtitles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== role) return prev;
        const updated = { ...last, text: combinedText, timestamp: now };
        return [...prev.slice(0, -1), updated];
      });

      // 如果以句末标点结尾，标记这条已完成，下次新建
      if (endsWithSentence) {
        lastSubtitleRef.current = null;
      }
    } else {
      // 新建一条
      lastSubtitleRef.current = { role, timestamp: now, text: trimmed };
      const entry: SubtitleEntry = {
        id: now.toString() + Math.random().toString(36).substring(2),
        role,
        text: trimmed,
        timestamp: now,
      };
      setSubtitles(prev => [...prev.slice(-50), entry]);

      // 保存到对话历史（仅完整句子）
      if (endsWithSentence) {
        onConversationAdd(role, trimmed);
        lastSubtitleRef.current = null;
      } else {
        // 延迟保存：2秒无新碎片则视为完整句子
        if (pendingFlushTimerRef.current) clearTimeout(pendingFlushTimerRef.current);
        pendingFlushTimerRef.current = window.setTimeout(() => {
          if (lastSubtitleRef.current && lastSubtitleRef.current.role === role) {
            onConversationAdd(role, lastSubtitleRef.current.text);
            lastSubtitleRef.current = null;
          }
        }, 2500);
      }
    }
  }, [onConversationAdd]);

  const setThinking = useCallback((thinking: boolean) => {
    isThinkingRef.current = thinking;
    setIsThinking(thinking);
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      onLog('正在连接 Gemini Live API...');
      pcmPlayerRef.current = new PCMPlayer();
      isManualDisconnectRef.current = false;
      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
      setIsReconnecting(false);

      // Fetch API key from backend
      let apiKey = '';
      try {
        const data = await api.config();
        apiKey = data.geminiApiKey;
      } catch (err: any) {
        throw new Error(err.message || "Failed to fetch API config");
      }

      if (!apiKey) {
        throw new Error("未找到 API Key，请联系管理员配置 GEMINI_API_KEY");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            onLog('WebSocket 连接成功！');
            lastConnectTimeRef.current = Date.now();
            setIsConnected(true);
            setIsReconnecting(false);
            setReconnectAttempt(0);
            reconnectAttemptRef.current = 0;
            onStatsLog('connect');
            
            // Send greeting
            if (sessionRef.current) {
              sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({ text: "你好！我已经连接成功了，请用简短、热情的一句话和我打个招呼，告诉我你已经准备好了。" });
              });
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Call / Function Call (Skills)
            if (message.toolCall?.functionCalls) {
              const responses = [];
              for (const fn of message.toolCall.functionCalls) {
                const args = fn.args || {};
                onLog(`✨ [Skill] 触发技能: ${fn.name} , 参数: ${JSON.stringify(args)}`);
                onStatsLog('skill_call', { skill: fn.name });
                
                let result: any = { status: "success" };
                
                if (fn.name === 'remember_fact') {
                  onMemoryAdd(String(args.fact || ''));
                  result = { status: "success", message: "已记住" };
                } else if (fn.name === 'get_current_time') {
                  result = { time: new Date().toLocaleString() };
                } else if (fn.name === 'show_link') {
                  // 富内容：在字幕区展示可点击链接卡片（图片URL自动检测并内联展示）
                  const url = String(args.url || '');
                  const title = String(args.title || url);
                  if (url) {
                    // 判断是否为图片URL
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(url);
                    const entry: SubtitleEntry = {
                      id: Date.now().toString() + Math.random().toString(36).substring(2),
                      role: 'assistant',
                      text: title,
                      timestamp: Date.now(),
                      richContent: isImage
                        ? { type: 'image', url, caption: title !== url ? title : undefined }
                        : { type: 'link', url, title },
                    };
                    setSubtitles(prev => [...prev.slice(-50), entry]);
                  }
                  result = { status: "success", message: "链接已展示" };
                } else {
                  // Check custom skills
                  const customSkill = customSkillsRef.current.find(s => s.name === fn.name);
                  if (customSkill) {
                    try {
                      onLog(`🌐 请求外部技能端点: ${customSkill.endpoint}`);
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
                    session.sendToolResponse({ functionResponses: responses });
                  }
                });
              }
              setThinking(false);
            }

            const serverContent = message.serverContent;
            if (serverContent?.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                // Handle audio
                if (part.inlineData && part.inlineData.data) {
                  const base64Audio = part.inlineData.data;
                  if (pcmPlayerRef.current) {
                    try {
                      await pcmPlayerRef.current.playBase64(base64Audio);
                      setIsAiSpeaking(true);
                      setThinking(false);
                      setTimeout(() => setIsAiSpeaking(false), 500);
                    } catch (playErr) {
                      console.error('[App] Audio playback error:', playErr);
                      onLog(`音频播放失败: ${playErr}`);
                    }
                  }
                }
                // Handle text (subtitles)
                if (part.text) {
                  addSubtitle('assistant', part.text);
                  setThinking(false);
                }
              }
            }

            // Handle input transcription (user speech)
            if (serverContent?.inputTranscription?.text) {
              addSubtitle('user', serverContent.inputTranscription.text);
            }
            
            // Handle output transcription (AI speech)
            if (serverContent?.outputTranscription?.text) {
              addSubtitle('assistant', serverContent.outputTranscription.text);
            }
            
            // Handle interruption
            if (serverContent?.interrupted) {
              onLog('AI 语音被打断');
              if (pcmPlayerRef.current) {
                pcmPlayerRef.current.clearQueue();
              }
              setIsAiSpeaking(false);
            }
          },
          onclose: () => {
            const connectionDuration = Date.now() - lastConnectTimeRef.current;
            onLog('WebSocket 连接已关闭');
            setIsConnected(false);
            setIsAiSpeaking(false);
            setThinking(false);
            onStatsLog('disconnect');
            
            // Auto-reconnect if not manual disconnect
            // If connection lasted < 10s, it's likely a network/API issue - use longer backoff
            if (!isManualDisconnectRef.current) {
              const wasShortLived = connectionDuration > 0 && connectionDuration < 10000;
              attemptReconnect(wasShortLived);
            }
          },
          onerror: (err) => {
            onLog(`WebSocket 错误: ${JSON.stringify(err)}`);
            setThinking(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemPromptRef.current + (memoriesRef.current.length > 0 
            ? "\n\n当前用户的核心记忆（请在对话中自然参考这些信息）：\n" + memoriesRef.current.map((m, i) => `${i + 1}. ${m.fact}`).join('\n') 
            : ""),
          tools: [
            {
              functionDeclarations: [
                {
                  name: "remember_fact",
                  description: "Skill 记忆能力：提取并持久化保存用户的重要事实（例如身份、偏好、习惯或正在做的关键事情），以此作为你的「长期记忆」。如果用户提到「记住我是xx」或「以后叫我xx」，调用此技能。",
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
                {
                  name: "show_link",
                  description: "【重要】当你要给用户提供任何 URL 链接时，必须调用此技能，不要在语音中口述 URL。无论是网页链接还是图片链接，都通过此技能展示。界面会自动识别图片 URL 并内联显示图片，普通 URL 则展示为可点击的链接卡片。例如用户要教程链接、文档地址、图片资源等，都调用此技能。",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      url: { type: "STRING", description: "完整的 URL 地址，必须包含 http:// 或 https://" },
                      title: { type: "STRING", description: "链接的显示标题，简短描述这个链接的内容" }
                    },
                    required: ["url", "title"]
                  }
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
      onLog(`连接失败: ${err}`);
      // Attempt reconnect on connection failure
      if (!isManualDisconnectRef.current) {
        attemptReconnect(false);
      }
    }
  }, [onLog, onStatsLog, onMemoryAdd, addSubtitle, setThinking]);

  // Auto-reconnect with exponential backoff
  const attemptReconnect = useCallback((useLongBackoff: boolean = false) => {
    if (isManualDisconnectRef.current) return;
    
    const maxAttempts = 5;
    const attempt = reconnectAttemptRef.current + 1;
    
    if (attempt > maxAttempts) {
      onLog(`自动重连失败：已达最大重试次数 (${maxAttempts})。请检查网络后手动重新连接。`);
      setIsReconnecting(false);
      return;
    }
    
    reconnectAttemptRef.current = attempt;
    setReconnectAttempt(attempt);
    setIsReconnecting(true);
    
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s
    // If connection was short-lived (network issue), use even longer delays: 5s, 10s, 20s, 40s, 60s
    const baseDelay = useLongBackoff ? 5000 : 3000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), useLongBackoff ? 60000 : 48000);
    onLog(`正在自动重连... 第 ${attempt}/${maxAttempts} 次尝试，${Math.round(delay / 1000)}秒后重试`);
    
    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [connect, onLog]);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
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
    setThinking(false);
    setIsReconnecting(false);
    onLog('已断开与 AI 的连接');
  }, [onLog]);

  const sendAudio = useCallback((base64Data: string) => {
    if (sessionRef.current) {
      // Set thinking state when user sends audio
      if (!isThinkingRef.current && !isAiSpeaking) {
        setThinking(true);
        // Auto-clear thinking after 10s if no response
        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
        thinkingTimeoutRef.current = window.setTimeout(() => setThinking(false), 10000);
      }
      sessionRef.current.then((session: any) => {
        session.sendRealtimeInput({
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      });
    }
  }, [isAiSpeaking, setThinking]);

  const sendVideoFrame = useCallback((base64Data: string) => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        session.sendRealtimeInput({
          video: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      });
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        session.sendRealtimeInput({ text });
      });
    }
  }, []);

  const clearSubtitles = useCallback(() => {
    setSubtitles([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
      if (sessionRef.current) {
        sessionRef.current.then((session: any) => session.close());
      }
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.stop();
      }
    };
  }, []);

  return {
    isConnected,
    isAiSpeaking,
    isThinking,
    subtitles,
    reconnectAttempt,
    isReconnecting,
    connect,
    disconnect,
    sendAudio,
    sendVideoFrame,
    sendText,
    clearSubtitles,
  };
}
