import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Coins, Plus, History, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
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
  const { teams, creditLogs, selectedTeam, fetchTeams, fetchCreditLogs, setSelectedTeam, rechargeCredits, createTeam } = useAppStore();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCredits, setNewTeamCredits] = useState(0);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">团队额度</h2>
          <p className="text-slate-400 text-sm mt-1">管理团队的共享额度池和消费记录</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          新建团队
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 px-1">团队列表</h3>
          <div className="space-y-2">
            {teams.map((team) => {
              const teamUsagePercent = team.totalCredits > 0
                ? (team.usedCredits / team.totalCredits) * 100
                : 0;
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
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{team.name}</p>
                      <p className="text-xs text-slate-400">
                        剩余 {team.totalCredits - team.usedCredits} / {team.totalCredits}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
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
                      <div className="p-3 rounded-xl bg-emerald-500/10">
                        <Coins className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">可用额度</p>
                        <p className="text-2xl font-bold text-emerald-400">
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
                <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold">额度流水记录</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {creditLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>暂无流水记录</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/50">
                      {creditLogs.map((log) => (
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
                              <p className="font-medium">{log.description}</p>
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
                      ))}
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
