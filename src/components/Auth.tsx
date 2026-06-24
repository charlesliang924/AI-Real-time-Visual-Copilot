import React, { useState } from 'react';
import { User, KeyRound, Loader2, AlertCircle } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password || username.length < 3 || password.length < 6) {
      setError('用户名至少3个字符，密码至少6个字符');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      // Safely parse JSON - handle non-JSON error responses
      let data;
      try {
        data = await resp.json();
      } catch {
        throw new Error(`服务器错误 (HTTP ${resp.status})，请检查后端服务是否正常运行`);
      }

      if (!resp.ok) {
        throw new Error(data.error || '认证失败');
      }

      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || '网络或服务器错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">见你，懂你</h1>
          <p className="text-zinc-400 text-sm">请登录或注册您的专属 AI 陪伴账号</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">用户名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: master_chief"
                className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位字符"
                className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
