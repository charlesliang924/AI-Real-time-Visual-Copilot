import React, { useState, useEffect, useRef } from 'react';
import { Loader2, LogOut, ShieldCheck, Clock } from 'lucide-react';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import ControlPanel from './components/ControlPanel';
import VideoPreview from './components/VideoPreview';
import SubtitleDisplay from './components/SubtitleDisplay';
import MemoryPanel from './components/MemoryPanel';
import SkillModal from './components/SkillModal';
import OnboardingGuide from './components/OnboardingGuide';
import ScenePresets, { DEFAULT_SCENE_PROMPT } from './components/ScenePresets';
import AdminPanel from './components/AdminPanel';
import { useGeminiSession } from './hooks/useGeminiSession';
import { useScreenShare } from './hooks/useScreenShare';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useMemories } from './hooks/useMemories';
import { useConversations } from './hooks/useConversations';
import { useSkills } from './hooks/useSkills';
import { useUsageStats } from './hooks/useUsageStats';
import { api } from './lib/api';

export default function App() {
  const [user, setUser] = useState<{ id: string, username: string, is_approved: number } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [currentScene, setCurrentScene] = useState<string>('coding');
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SCENE_PROMPT);
  const [noiseThreshold, setNoiseThreshold] = useState(0.025);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize hooks (only when user is available)
  const { memories, addMemory, deleteMemory } = useMemories(user?.id);
  const { conversations, addConversation, clearConversations } = useConversations(user?.id);
  const { skills, createSkill, deleteSkill } = useSkills(user?.id);
  const { logEvent } = useUsageStats(user?.id);

  // Gemini session
  const {
    isConnected, isAiSpeaking, isThinking, subtitles,
    reconnectAttempt, isReconnecting,
    connect, disconnect, sendAudio, sendVideoFrame, clearSubtitles,
  } = useGeminiSession({
    systemPrompt,
    memories,
    customSkills: skills,
    onMemoryAdd: addMemory,
    onConversationAdd: addConversation,
    onLog: (msg: string) => console.log('[Gemini]', msg),
    onStatsLog: logEvent,
    userId: user?.id,
  });

  // Screen share
  const {
    isScreenSharing, startScreenShare, stopScreenShare,
  } = useScreenShare(videoRef, canvasRef, isConnected ? sendVideoFrame : null, isConnected);

  // Audio recorder
  const {
    isMicActive, micVolume, toggleMic, stop: stopMic,
  } = useAudioRecorder(isConnected ? sendAudio : null, noiseThreshold);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthReady(true);
        return;
      }
      try {
        const data = await api.auth.me();
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem('token');
      }
      setIsAuthReady(true);
    };
    checkAuth();

    return () => {
      stopScreenShare();
      disconnect();
      stopMic();
    };
  }, []);

  // Check if onboarding should be shown
  useEffect(() => {
    if (user && user.is_approved === 1 && !localStorage.getItem('onboarding_completed')) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleSignOut = () => {
    disconnect();
    localStorage.removeItem('token');
    setUser(null);
    setShowLanding(true);
  };

  const handleSceneSelect = (sceneId: string, prompt: string) => {
    setCurrentScene(sceneId);
    setSystemPrompt(prompt);
    if (isConnected) {
      console.log('场景切换成功。将在下一次重新连接时生效。');
    }
  };

  const handleAddSkill = async (skill: { name: string; description: string; endpoint: string }) => {
    await createSkill(skill);
    setShowSkillModal(false);
    console.log(`已添加技能: ${skill.name}`);
  };

  // Loading state
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Landing page
  if (showLanding && !user) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  // Auth
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // Admin panel
  if (showAdmin && user.username === 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-6">
        <div className="max-w-5xl mx-auto">
          <AdminPanel onBack={() => setShowAdmin(false)} />
        </div>
      </div>
    );
  }

  // Pending approval
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

  // Main app
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-indigo-500/30">
      <canvas ref={canvasRef} className="hidden" />

      {/* Onboarding Guide */}
      {showOnboarding && (
        <OnboardingGuide onComplete={() => {
          localStorage.setItem('onboarding_completed', 'true');
          setShowOnboarding(false);
        }} />
      )}

      {/* Skill Modal */}
      <SkillModal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        onSave={handleAddSkill}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-screen lg:max-h-screen">
        
        {/* Left: Video preview + subtitles */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6 min-h-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
              AI 实时视觉副驾
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                {isConnected ? '已连接' : '未连接'}
              </div>
              
              {user.username === 'admin' && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  title="管理后台"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">审核管理</span>
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

          {/* Scene Presets */}
          <ScenePresets currentScene={currentScene} onSelectScene={handleSceneSelect} />

          {/* Video Preview */}
          <VideoPreview
            isScreenSharing={isScreenSharing}
            isAiSpeaking={isAiSpeaking}
            isThinking={isThinking}
            videoRef={videoRef}
          />

          {/* Subtitles */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3 backdrop-blur-sm flex flex-col max-h-[240px] min-h-[120px]">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">实时字幕</h2>
              {subtitles.length > 0 && (
                <button onClick={clearSubtitles} className="text-xs text-zinc-600 hover:text-zinc-300 transition">清空</button>
              )}
            </div>
            <SubtitleDisplay subtitles={subtitles} />
          </div>
        </div>

        {/* Right: Controls + Memory + Logs */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:h-full lg:overflow-hidden min-h-0">
          <ControlPanel
            isConnected={isConnected}
            isScreenSharing={isScreenSharing}
            isMicActive={isMicActive}
            isAiSpeaking={isAiSpeaking}
            isThinking={isThinking}
            isReconnecting={isReconnecting}
            reconnectAttempt={reconnectAttempt}
            micVolume={micVolume}
            noiseThreshold={noiseThreshold}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onToggleMic={toggleMic}
            onToggleConnection={isConnected ? disconnect : connect}
            onNoiseThresholdChange={setNoiseThreshold}
          />

          <MemoryPanel
            memories={memories}
            skills={skills}
            onDeleteMemory={deleteMemory}
            onDeleteSkill={deleteSkill}
            onAddSkill={() => setShowSkillModal(true)}
          />
        </div>
      </div>
    </div>
  );
}
