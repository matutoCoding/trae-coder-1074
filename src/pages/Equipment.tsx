import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { HardHat, Plus, Package, RotateCcw, AlertTriangle, Calendar, Users, BookOpen, Download } from 'lucide-react';
import type { EquipmentType } from '../../shared/types';

const typeLabels: Record<EquipmentType, string> = {
  harness: '安全带',
  shoes: '攀岩鞋',
  helmet: '头盔',
  'chalk-bag': '镁粉袋',
  rope: '动力绳',
};

type TabType = 'equipment' | 'rentals' | 'ledger';

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'active', label: '租赁中' },
  { value: 'returned', label: '已归还' },
];

export default function Equipment() {
  const {
    equipment,
    rentals,
    allRentals,
    teams,
    bookings,
    fetchEquipment,
    fetchRentals,
    fetchAllRentals,
    fetchTeams,
    fetchBookings,
    createEquipment,
    returnRental,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'harness' as EquipmentType,
    total: 10,
    status: 'active' as const,
  });
  const [ledgerFilters, setLedgerFilters] = useState({
    teamId: '',
    equipmentType: '',
    status: '',
  });

  useEffect(() => {
    fetchEquipment();
    fetchRentals();
    fetchTeams();
    fetchBookings();
    fetchAllRentals({});
  }, [fetchEquipment, fetchRentals, fetchTeams, fetchBookings, fetchAllRentals]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchAllRentals(ledgerFilters);
    }
  }, [activeTab, ledgerFilters, fetchAllRentals]);

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

  const handleReturn = async (rentalId: string) => {
    if (confirm('确定归还该装备吗？')) {
      await returnRental(rentalId);
      if (activeTab === 'ledger') {
        fetchAllRentals(ledgerFilters);
      }
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

  const getEquipmentName = (equipmentId: string) =>
    equipment.find((e) => e.id === equipmentId)?.name || '-';
  const getTeamName = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name || '-';
  const getBookingInfo = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return '-';
    return new Date(booking.startTime).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEquipmentType = (equipmentId: string) =>
    equipment.find((e) => e.id === equipmentId)?.type;

  const handleExportCSV = useCallback(() => {
    const rows = allRentals;
    if (rows.length === 0) return;
    const header = '装备名称,装备类型,数量,团队,关联预约,租赁时间,归还时间,状态';
    const csvRows = rows.map((r) => {
      const eqName = getEquipmentName(r.equipmentId);
      const eqType = typeLabels[getEquipmentType(r.equipmentId) || 'harness'];
      const teamName = getTeamName(r.teamId);
      const bookingRef = getBookingInfo(r.bookingId);
      const rentedAt = new Date(r.rentedAt).toLocaleString('zh-CN');
      const returnedAt = r.returnedAt ? new Date(r.returnedAt).toLocaleString('zh-CN') : '';
      const status = r.returnedAt ? '已归还' : '租赁中';
      return [eqName, eqType, r.quantity, teamName, bookingRef, rentedAt, returnedAt, status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = '\uFEFF' + header + '\n' + csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `租赁明细_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allRentals, equipment, teams, bookings]);

  const activeRentalCount = rentals.filter((r) => !r.returnedAt).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">装备租赁</h2>
          <p className="text-slate-400 text-sm mt-1">管理攀岩装备库存和租赁记录</p>
        </div>
        {activeTab === 'equipment' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            新增装备
          </button>
        )}
        {activeTab === 'ledger' && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            导出明细
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 inline-flex">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'equipment'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardHat className="w-4 h-4" />
          装备库存
        </button>
        <button
          onClick={() => setActiveTab('rentals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'rentals'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          租赁记录
          {activeRentalCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {activeRentalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ledger'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          租赁台账
        </button>
      </div>

      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {equipment.map((item) => {
            const stockPercent = item.total > 0 ? (item.available / item.total) * 100 : 0;
            const isLowStock = item.available < item.total * 0.3;

            return (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300"
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
                    <div
                      className="p-1.5 rounded-lg bg-amber-500/20"
                      title="库存不足"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">可租</span>
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
                    <span className="font-medium">{item.total - item.available} 件</span>
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
      )}

      {activeTab === 'rentals' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">装备</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">数量</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">团队</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">关联预约</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">租赁时间</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {rentals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>暂无租赁记录</p>
                    </td>
                  </tr>
                ) : (
                  [...rentals]
                    .sort(
                      (a, b) =>
                        new Date(b.rentedAt).getTime() - new Date(a.rentedAt).getTime()
                    )
                    .map((rental) => (
                      <tr
                        key={rental.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <HardHat className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="font-medium">{getEquipmentName(rental.equipmentId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-700 rounded text-sm font-medium">
                            × {rental.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>{getTeamName(rental.teamId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {getBookingInfo(rental.bookingId)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(rental.rentedAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {rental.returnedAt ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 font-medium">
                              已归还
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                              租赁中
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!rental.returnedAt && (
                            <button
                              onClick={() => handleReturn(rental.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              归还
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={ledgerFilters.teamId}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, teamId: e.target.value }))
              }
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">全部团队</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={ledgerFilters.equipmentType}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, equipmentType: e.target.value }))
              }
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">全部装备类型</option>
              {(Object.keys(typeLabels) as EquipmentType[]).map((key) => (
                <option key={key} value={key}>
                  {typeLabels[key]}
                </option>
              ))}
            </select>
            <select
              value={ledgerFilters.status}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">装备名称</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">装备类型</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">数量</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">团队</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">关联预约</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">租赁时间</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">归还时间</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">状态</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allRentals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>暂无台账记录</p>
                      </td>
                    </tr>
                  ) : (
                    [...allRentals]
                      .sort(
                        (a, b) =>
                          new Date(b.rentedAt).getTime() - new Date(a.rentedAt).getTime()
                      )
                      .map((rental) => {
                        const eqType = getEquipmentType(rental.equipmentId);
                        return (
                          <tr
                            key={rental.id}
                            className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                  <HardHat className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-medium">{getEquipmentName(rental.equipmentId)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {eqType ? typeLabels[eqType] : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-700 rounded text-sm font-medium">
                                × {rental.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span>{getTeamName(rental.teamId)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {getBookingInfo(rental.bookingId)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {new Date(rental.rentedAt).toLocaleString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {rental.returnedAt
                                ? new Date(rental.returnedAt).toLocaleString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {rental.returnedAt ? (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 font-medium">
                                  已归还
                                </span>
                              ) : (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                                  租赁中
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {!rental.returnedAt && (
                                <button
                                  onClick={() => handleReturn(rental.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  归还
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
