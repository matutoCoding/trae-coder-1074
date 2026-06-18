import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Mountain,
  Users,
  HardHat,
  Coins,
  Clock,
  ChevronRight,
} from 'lucide-react';

const primaryCards = [
  {
    label: '今日预约',
    key: 'todayBookings',
    icon: Calendar,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/20',
    valueColor: 'text-orange-400',
    route: '/schedule',
  },
  {
    label: '本周预约',
    key: 'weekBookings',
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
    valueColor: 'text-blue-400',
    route: '/bookings',
  },
  {
    label: '今日利用率',
    key: 'todayUtilization',
    icon: PieChart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    valueColor: 'text-emerald-400',
    route: '/schedule',
    suffix: '%',
  },
  {
    label: '本周利用率',
    key: 'weekUtilization',
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
    valueColor: 'text-cyan-400',
    route: '/schedule',
    suffix: '%',
  },
];

const secondaryCards = [
  {
    label: '活跃岩壁',
    key: 'activeWalls',
    icon: Mountain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    valueColor: 'text-purple-400',
    route: '/walls',
  },
  {
    label: '团队数量',
    key: 'totalTeams',
    icon: Users,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    valueColor: 'text-emerald-400',
    route: '/credits',
  },
  {
    label: '装备租出',
    key: 'totalRentedOut',
    icon: HardHat,
    color: 'text-lime-400',
    bg: 'bg-lime-500/15',
    border: 'border-lime-500/20',
    valueColor: 'text-lime-400',
    route: '/equipment',
  },
  {
    label: '可用额度',
    key: 'availableCredits',
    icon: Coins,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
    valueColor: 'text-amber-400',
    route: '/credits',
  },
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: '已确认', className: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: '已取消', className: 'bg-slate-500/20 text-slate-400' },
  pending: { label: '待确认', className: 'bg-amber-500/20 text-amber-400' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    stats,
    bookings,
    teams,
    walls,
    fetchStats,
    fetchTeams,
    fetchWalls,
    fetchBookings,
    fetchEquipment,
    setSelectedTeam,
  } = useAppStore();

  useEffect(() => {
    fetchStats();
    fetchTeams();
    fetchWalls();
    fetchBookings();
    fetchEquipment();
  }, [fetchStats, fetchTeams, fetchWalls, fetchBookings, fetchEquipment]);

  const popularWalls = stats?.popularWalls || [];
  const teamRanking = stats?.teamRanking || [];
  const recentBookings = bookings.slice(0, 5);
  const maxWallCount = popularWalls.length > 0 ? Math.max(...popularWalls.map((w: any) => w.count)) : 1;

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || '未知团队';
  };

  const getWallName = (wallId: string) => {
    const wall = walls.find((w) => w.id === wallId);
    return wall?.name || '未知岩壁';
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white">运营看板</h2>
        <p className="text-slate-400 text-sm mt-1">实时监控攀岩馆运营数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          const raw = stats?.[card.key] ?? 0;
          const value = card.suffix ? `${raw}${card.suffix}` : raw;
          return (
            <div
              key={card.key}
              onClick={() => navigate(card.route)}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.valueColor}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <div
              key={card.key}
              onClick={() => navigate(card.route)}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.valueColor}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg text-white">热门岩壁道</h3>
            <ChevronRight
              className="w-5 h-5 text-slate-500 cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => navigate('/schedule')}
            />
          </div>
          {popularWalls.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Mountain className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无热门岩壁数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {popularWalls.map((wall: any) => {
                const pct = maxWallCount > 0 ? (wall.count / maxWallCount) * 100 : 0;
                return (
                  <div
                    key={wall.wallId}
                    className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => navigate('/schedule')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white truncate max-w-[160px]">
                        {wall.name}
                      </span>
                      <span className="text-sm text-orange-400 font-semibold">{wall.count} 次</span>
                    </div>
                    <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg text-white">团队消费排行</h3>
            <ChevronRight
              className="w-5 h-5 text-slate-500 cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => navigate('/credits')}
            />
          </div>
          {teamRanking.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无团队排行数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamRanking.map((team: any, idx: number) => {
                const pct = team.totalCredits > 0 ? (team.usedCredits / team.totalCredits) * 100 : 0;
                const rankColors = [
                  'from-orange-500 to-amber-500',
                  'from-blue-500 to-cyan-500',
                  'from-emerald-500 to-teal-500',
                ];
                const barGradient = rankColors[idx] || 'from-slate-500 to-slate-400';
                return (
                  <div
                    key={team.teamId}
                    className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => {
                      const matched = teams.find((t) => t.id === team.teamId);
                      if (matched) setSelectedTeam(matched);
                      navigate('/credits');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0
                              ? 'bg-orange-500/20 text-orange-400'
                              : idx === 1
                                ? 'bg-blue-500/20 text-blue-400'
                                : idx === 2
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-600/30 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-white truncate max-w-[120px]">
                          {team.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {team.usedCredits}/{team.totalCredits}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg text-white">最近预约</h3>
            <ChevronRight
              className="w-5 h-5 text-slate-500 cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => navigate('/bookings')}
            />
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无预约记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => {
                const status = statusMap[booking.status] || statusMap.confirmed;
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/bookings')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            #{booking.id.slice(0, 8)}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {getTeamName(booking.teamId)} · {getWallName(booking.wallId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-orange-400">-{booking.creditsCost}</p>
                      <p className="text-xs text-slate-500">{formatTime(booking.startTime)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
