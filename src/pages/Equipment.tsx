import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { HardHat, Plus, Package, RotateCcw, AlertTriangle } from 'lucide-react';
import type { EquipmentType } from '../../shared/types';

const typeLabels: Record<EquipmentType, string> = {
  harness: '安全带',
  shoes: '攀岩鞋',
  helmet: '头盔',
  'chalk-bag': '镁粉袋',
  rope: '动力绳',
};

export default function Equipment() {
  const { equipment, fetchEquipment, createEquipment, returnRental } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'harness' as EquipmentType,
    total: 10,
    status: 'active' as const,
  });

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEquipment({
        ...formData,
        available: formData.total,
      });
      setShowModal(false);
      setFormData({
        name: '',
        type: 'harness',
        total: 10,
        status: 'active',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStockColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.6) return 'text-emerald-400';
    if (ratio > 0.3) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStockBg = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.6) return 'from-emerald-500 to-emerald-600';
    if (ratio > 0.3) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">装备租赁</h2>
          <p className="text-slate-400 text-sm mt-1">管理攀岩装备库存和租赁</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          新增装备
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {equipment.map((item) => {
          const stockPercent = item.total > 0 ? (item.available / item.total) * 100 : 0;
          const isLowStock = item.available < item.total * 0.3;
          
          return (
            <div
              key={item.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <HardHat className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-xs text-slate-400">{typeLabels[item.type]}</span>
                  </div>
                </div>
                {isLowStock && item.status === 'active' && (
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-400">库存</span>
                    <span className={`font-medium ${getStockColor(item.available, item.total)}`}>
                      {item.available} / {item.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getStockBg(item.available, item.total)} rounded-full transition-all duration-500`}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">已租出</span>
                  <span>{item.total - item.available} 件</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">状态</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.status === 'active' ? '正常' : '维护中'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">新增装备</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">装备名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="请输入装备名称"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as EquipmentType })
                    }
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="harness">安全带</option>
                    <option value="shoes">攀岩鞋</option>
                    <option value="helmet">头盔</option>
                    <option value="chalk-bag">镁粉袋</option>
                    <option value="rope">动力绳</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">总数</label>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="active">正常</option>
                  <option value="maintenance">维护中</option>
                </select>
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
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
