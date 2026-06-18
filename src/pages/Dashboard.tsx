import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import {
  Calendar,
  Users,
  Mountain,
  Coins,
  HardHat,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';

const statCards = [
  { label: '今日预约', key: 'todayBookings', icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { label: '总预约数', key: 'totalBookings', icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: '团队数量', key: 'totalTeams', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: '活跃岩壁', key: 'activeWalls', icon: Mountain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

const creditCards = [
  { label: '总额度', key: 'totalCredits', icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: '已用额度', key: 'usedCredits', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { label: '可用额度', key: 'availableCredits', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: '进行中租赁', key: 'activeRentals', icon: HardHat, color: 'text-lime-400', bg: 'bg-lime-500/10' },
];

function ClipboardList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

export default function Dashboard() {
  const { stats, fetchStats, fetchTeams, fetchWalls, fetchBookings, teams, bookings } = useAppStore();

  useEffect(() => {
    fetchStats();
    fetchTeams();
    fetchWalls();
    fetchBookings();
  }, [fetchStats, fetchTeams, fetchWalls, fetchBookings]);

  const recentBookings = bookings.slice(0, 5);
  const recentTeams = teams.slice(0, 4);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold">数据概览</h2>
        <p className="text-slate-400 text-sm mt-1">实时监控攀岩馆运营数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] || 0;
          return (
            <div
              key={card.key}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-2">{value}</p>
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
        {creditCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] || 0;
          return (
            <div
              key={card.key}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold mt-2">{value}</p>
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
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">最近预约</h3>
            <span className="text-xs text-slate-500">最近 5 条记录</span>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无预约记录</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">预约 #{booking.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(booking.startTime).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-400">-{booking.creditsCost} 额度</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {booking.status === 'confirmed' ? '已确认' : '已取消'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">团队额度排行</h3>
          </div>
          <div className="space-y-3">
            {recentTeams.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无团队数据</p>
              </div>
            ) : (
              recentTeams.map((team) => {
                const usagePercent = team.totalCredits > 0 
                  ? (team.usedCredits / team.totalCredits) * 100 
                  : 0;
                return (
                  <div key={team.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[140px]">{team.name}</span>
                      <span className="text-slate-400">
                        {team.usedCredits}/{team.totalCredits}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
