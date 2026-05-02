import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('获取用户列表失败');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleApproval = async (id: string, currentStatus: number) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/admin/users/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_approved: newStatus })
      });
      if (!res.ok) {
        alert('操作失败');
        return;
      }
      setUsers(users.map(u => u.id === id ? { ...u, is_approved: newStatus } : u));
    } catch (e) {
      alert('发生错误');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          后台审核列表
        </h2>
        <button onClick={onBack} className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg">
          返回主界面
        </button>
      </div>

      {error ? (
        <div className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/20">{error}</div>
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
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{u.username}</td>
                  <td className="px-6 py-4 font-mono text-zinc-500">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {u.is_approved === 1 ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />已通过
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Clock className="w-4 h-4" />待审核
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
    </div>
  );
}
