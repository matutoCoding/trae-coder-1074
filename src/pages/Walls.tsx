import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Mountain, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import type { DifficultyLevel, WallType } from '../../shared/types';

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
  expert: '专业',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const typeLabels: Record<WallType, string> = {
  bouldering: '抱石',
  lead: '先锋',
  'top-rope': '顶绳',
  speed: '速度',
};

export default function Walls() {
  const { walls, fetchWalls, createWall, updateWall, deleteWall } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingWall, setEditingWall] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    difficulty: 'intermediate' as DifficultyLevel,
    height: 10,
    type: 'lead' as WallType,
    status: 'active' as const,
  });

  useEffect(() => {
    fetchWalls();
  }, [fetchWalls]);

  const handleOpenModal = (wall?: any) => {
    if (wall) {
      setEditingWall(wall);
      setFormData({
        name: wall.name,
        difficulty: wall.difficulty,
        height: wall.height,
        type: wall.type,
        status: wall.status,
      });
    } else {
      setEditingWall(null);
      setFormData({
        name: '',
        difficulty: 'intermediate',
        height: 10,
        type: 'lead',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWall) {
        await updateWall(editingWall.id, formData);
      } else {
        await createWall(formData);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个岩壁道吗？')) {
      await deleteWall(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">岩壁道管理</h2>
          <p className="text-slate-400 text-sm mt-1">管理攀岩馆的岩壁道资源</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          新增岩壁道
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {walls.map((wall) => (
          <div
            key={wall.id}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                  <Mountain className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{wall.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[wall.difficulty]}`}>
                    {difficultyLabels[wall.difficulty]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(wall)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(wall.id)}
                  className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">类型</span>
                <span>{typeLabels[wall.type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">高度</span>
                <span>{wall.height} 米</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">状态</span>
                <span className={wall.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>
                  {wall.status === 'active' ? '正常运营' : wall.status === 'maintenance' ? '维护中' : '已停用'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">
              {editingWall ? '编辑岩壁道' : '新增岩壁道'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">岩壁道名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="请输入岩壁道名称"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">难度等级</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="beginner">入门</option>
                    <option value="intermediate">进阶</option>
                    <option value="advanced">高级</option>
                    <option value="expert">专业</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as WallType })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="bouldering">抱石</option>
                    <option value="lead">先锋</option>
                    <option value="top-rope">顶绳</option>
                    <option value="speed">速度</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">高度 (米)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    min="1"
                    step="0.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="active">正常运营</option>
                    <option value="maintenance">维护中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  {editingWall ? '保存修改' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
