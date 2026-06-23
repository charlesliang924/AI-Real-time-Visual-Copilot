import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  Activity,
  MessageSquare,
  Zap,
  TrendingUp,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { api } from '../lib/api';

interface StatsData {
  total_users?: number;
  approved_users?: number;
  total_connections?: number;
  total_messages?: number;
  total_skill_calls?: number;
  recent_activity?: Array<{
    id?: string | number;
    username?: string;
    event_type?: string;
    timestamp?: number | string;
  }>;
}

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.users();
      setUsers(data.users || []);
      setError('');
    } catch (err: any) {
      setError(err.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await api.admin.stats();
      setStats(data);
      setStatsError('');
    } catch (err: any) {
      setStatsError(err.message || '获取统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats' && !stats && !statsLoading) {
      loadStats();
    }
  }, [activeTab]);

  const toggleApproval = async (id: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await api.admin.approveUser(id, newStatus === 1);
      setUsers(users.map((u) => (u.id === id ? { ...u, is_approved: newStatus } : u)));
    } catch (e: any) {
      alert(e.message || '操作失败');
    }
  };

  // 统计卡片配置
  const statCards = [
    {
      label: '总用户数',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: '已审核用户',
      value: stats?.approved_users ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: '总连接次数',
      value: stats?.total_connections ?? 0,
      icon: Activity,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: '总消息数',
      value: stats?.total_messages ?? 0,
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: '技能调用次数',
      value: stats?.total_skill_calls ?? 0,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: '待审核用户',
      value: (stats?.total_users ?? 0) - (stats?.approved_users ?? 0),
      icon: Clock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
  ];

  const formatTimestamp = (ts: number | string | undefined) => {
    if (!ts) return '-';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          管理后台
        </h2>
        <button
          onClick={onBack}
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          返回主界面
        </button>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-1 mb-6 bg-zinc-900/50 border border-white/10 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          用户审核
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          使用统计
        </button>
      </div>

      {/* ===================== 用户审核 Tab ===================== */}
      {activeTab === 'users' && (
        <>
          {error ? (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/20">
              {error}
            </div>
          ) : loading ? (
            <div className="text-zinc-500 italic">加载中...</div>
          ) : (
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="text-xs text-zinc-500 bg-black/40 uppercase">
                  <tr>
                    <th className="px-6 py-4">用户名</th>
                    <th className="px-6 py-4">注册时间</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{u.username}</td>
                      <td className="px-6 py-4 font-mono text-zinc-500">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_approved === 1 ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            已通过
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <Clock className="w-4 h-4" />
                            待审核
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleApproval(u.id, u.is_approved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            u.is_approved === 1
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.is_approved === 1 ? '撤销授权' : '通过审核'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===================== 使用统计 Tab ===================== */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsError ? (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/20">
              {statsError}
            </div>
          ) : statsLoading ? (
            <div className="text-zinc-500 italic">加载统计数据中...</div>
          ) : (
            <>
              {/* 统计卡片网格 3x2 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className={`bg-zinc-900/50 border ${card.border} rounded-2xl p-5 backdrop-blur-sm hover:bg-zinc-900/70 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-white tabular-nums">
                        {card.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* 最近活动记录表 */}
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">最近活动</h3>
                </div>
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="text-xs text-zinc-500 bg-black/40 uppercase">
                    <tr>
                      <th className="px-6 py-3">用户名</th>
                      <th className="px-6 py-3">事件类型</th>
                      <th className="px-6 py-3">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                      stats.recent_activity.map((activity, idx) => (
                        <tr key={activity.id ?? idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 font-medium text-white">
                            {activity.username || '-'}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-mono">
                              {activity.event_type || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-zinc-500">
                            {formatTimestamp(activity.timestamp)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-zinc-600 italic">
                          暂无活动记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
