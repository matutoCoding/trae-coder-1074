import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Coins, Plus, History, TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, Download, ArrowRight, ClipboardList } from 'lucide-react';
import type { CreditLogType } from '../../shared/types';

const typeLabels: Record<CreditLogType, string> = {
  consume: '消费',
  recharge: '充值',
  refund: '退款',
};

const typeColors: Record<CreditLogType, string> = {
  consume: 'text-rose-400 bg-rose-500/10',
  recharge: 'text-emerald-400 bg-emerald-500/10',
  refund: 'text-blue-400 bg-blue-500/10',
};

export default function Credits() {
  const { teams, creditLogs, selectedTeam, bookings, fetchTeams, fetchCreditLogs, fetchBookings, setSelectedTeam, rechargeCredits, createTeam } = useAppStore();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCredits, setNewTeamCredits] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
    fetchBookings();
  }, [fetchTeams, fetchBookings]);

  useEffect(() => {
    if (selectedTeam) {
      fetchCreditLogs(selectedTeam.id);
    }
  }, [selectedTeam, fetchCreditLogs]);

  const handleSelectTeam = (team: any) => {
    setSelectedTeam(team);
  };

  const handleRecharge = async () => {
    if (!selectedTeam || rechargeAmount <= 0) return;
    await rechargeCredits(selectedTeam.id, rechargeAmount, '手动充值');
    setShowRechargeModal(false);
    setRechargeAmount(100);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const team = await createTeam(newTeamName, newTeamCredits);
    setSelectedTeam(team);
    setShowCreateModal(false);
    setNewTeamName('');
    setNewTeamCredits(0);
  };

  const lowCreditTeams = teams.filter(t => {
    if (t.totalCredits === 0) return true;
    return (t.totalCredits - t.usedCredits) / t.totalCredits < 0.2;
  });

  const handleExportCreditLogs = useCallback(() => {
    if (!selectedTeam || creditLogs.length === 0) return;
    const header = '时间,类型,金额,描述,关联预约';
    const rows = creditLogs.map((log) => {
      const typeLabel = typeLabels[log.type];
      const sign = log.type === 'consume' ? '-' : '+';
      const bookingRef = log.bookingId || '';
      return [
        new Date(log.createdAt).toLocaleString('zh-CN'),
        typeLabel,
        `${sign}${log.amount}`,
        log.description,
        bookingRef,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `额度流水_${selectedTeam.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedTeam, creditLogs]);

  const getBookingInfo = (bookingId?: string) => {
    if (!bookingId) return null;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return null;
    return booking;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">团队额度</h2>
          <p className="text-slate-400 text-sm mt-1">管理团队的共享额度池和消费记录</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTeam && (
            <button
              onClick={handleExportCreditLogs}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              导出流水
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            新建团队
          </button>
        </div>
      </div>

      {lowCreditTeams.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-400">额度预警</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCreditTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm rounded-lg transition-colors"
              >
                <span className="font-medium">{team.name}</span>
                <span className="text-amber-400/70">
                  剩余 {team.totalCredits - team.usedCredits}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 px-1">团队列表</h3>
          <div className="space-y-2">
            {teams.map((team) => {
              const teamUsagePercent = team.totalCredits > 0
                ? (team.usedCredits / team.totalCredits) * 100
                : 0;
              const available = team.totalCredits - team.usedCredits;
              const isLow = team.totalCredits > 0 && available / team.totalCredits < 0.2;
              const isCritical = team.totalCredits > 0 && available / team.totalCredits < 0.1;
              return (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedTeam?.id === team.id
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCritical
                        ? 'bg-gradient-to-br from-rose-500/30 to-red-500/30'
                        : isLow
                        ? 'bg-gradient-to-br from-amber-500/30 to-yellow-500/30'
                        : 'bg-gradient-to-br from-orange-500/30 to-amber-500/30'
                    }`}>
                      {isCritical ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : isLow ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Users className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{team.name}</p>
                        {isLow && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {isCritical ? '不足' : '偏低'}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isLow ? 'text-amber-400' : 'text-slate-400'}`}>
                        剩余 {available} / {team.totalCredits}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-gradient-to-r from-rose-500 to-red-500'
                          : isLow
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(teamUsagePercent, 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedTeam ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10">
                      <Wallet className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">总额度</p>
                      <p className="text-2xl font-bold">{selectedTeam.totalCredits}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-rose-500/10">
                      <TrendingUp className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">已用额度</p>
                      <p className="text-2xl font-bold text-rose-400">{selectedTeam.usedCredits}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        selectedTeam.totalCredits > 0 && (selectedTeam.totalCredits - selectedTeam.usedCredits) / selectedTeam.totalCredits < 0.2
                          ? 'bg-amber-500/10'
                          : 'bg-emerald-500/10'
                      }`}>
                        <Coins className={`w-6 h-6 ${
                          selectedTeam.totalCredits > 0 && (selectedTeam.totalCredits - selectedTeam.usedCredits) / selectedTeam.totalCredits < 0.2
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">可用额度</p>
                        <p className={`text-2xl font-bold ${
                          selectedTeam.totalCredits > 0 && (selectedTeam.totalCredits - selectedTeam.usedCredits) / selectedTeam.totalCredits < 0.2
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {selectedTeam.totalCredits - selectedTeam.usedCredits}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRechargeModal(true)}
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors font-medium"
                    >
                      充值
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold">额度流水记录</h3>
                    <span className="text-xs text-slate-500">{creditLogs.length} 条</span>
                  </div>
                  {creditLogs.length > 0 && (
                    <button
                      onClick={handleExportCreditLogs}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      导出
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {creditLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>暂无流水记录</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/50">
                      {creditLogs.map((log) => {
                        const linkedBooking = getBookingInfo(log.bookingId);
                        return (
                          <div
                            key={log.id}
                            className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  typeColors[log.type]
                                }`}
                              >
                                {log.type === 'recharge' ? (
                                  <Plus className="w-5 h-5" />
                                ) : log.type === 'consume' ? (
                                  <TrendingUp className="w-5 h-5" />
                                ) : (
                                  <TrendingDown className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{log.description}</p>
                                  {linkedBooking && (
                                    <button
                                      onClick={() => navigate('/bookings')}
                                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                      查看预约
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${
                                log.type === 'consume'
                                  ? 'text-rose-400'
                                  : log.type === 'recharge'
                                  ? 'text-emerald-400'
                                  : 'text-blue-400'
                              }`}
                            >
                              {log.type === 'consume' ? '-' : '+'}
                              {log.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 text-center">
              <Coins className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">请选择一个团队查看额度详情</p>
            </div>
          )}
        </div>
      </div>

      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">额度充值</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">充值金额</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(amount)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      rechargeAmount === amount
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRecharge}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  确认充值
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">新建团队</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">团队名称</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="请输入团队名称"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">初始额度</label>
                <input
                  type="number"
                  value={newTeamCredits}
                  onChange={(e) => setNewTeamCredits(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
