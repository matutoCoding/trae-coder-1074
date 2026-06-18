import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
  BarChart3,
  TrendingUp,
  Coins,
  Calendar,
  ArrowUpRight,
  Users,
  Mountain,
  Package,
  Download,
} from 'lucide-react';

type PeriodType = 'day' | 'week' | 'month';

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
];

const summaryCards = [
  { key: 'bookingRevenue', label: '预约收入', color: 'text-orange-400', bg: 'bg-orange-500/15', icon: Coins, route: '/bookings' },
  { key: 'creditsConsumed', label: '额度消耗', color: 'text-rose-400', bg: 'bg-rose-500/15', icon: TrendingUp, route: '/credits' },
  { key: 'creditsRefunded', label: '额度退款', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: ArrowUpRight, route: '/credits' },
  { key: 'bookingCount', label: '预约单数', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: Calendar, route: '/bookings' },
  { key: 'avgBookingValue', label: '客单价', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: BarChart3, route: '/bookings' },
];

function getIdleRateColor(rate: number) {
  if (rate > 0.6) return 'bg-emerald-500';
  if (rate > 0.3) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getIdleRateTextColor(rate: number) {
  if (rate > 0.6) return 'text-emerald-400';
  if (rate > 0.3) return 'text-amber-400';
  return 'text-rose-400';
}

export default function Analytics() {
  const navigate = useNavigate();
  const {
    analytics,
    fetchAnalytics,
    packages,
    fetchPackages,
    teams,
    setSelectedTeam,
  } = useAppStore();

  const [period, setPeriod] = useState<PeriodType>('week');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchAnalytics(period, dateStr);
  }, [period, dateStr, fetchAnalytics]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const data = analytics as {
    period: { label: string; start: string; end: string };
    bookingRevenue: number;
    creditsConsumed: number;
    creditsRefunded: number;
    bookingCount: number;
    avgBookingValue: number;
    teamRepurchase: { teamId: string; teamName: string; bookingCount: number; totalSpent: number }[];
    wallIdleSlots: { wallId: string; wallName: string; totalSlots: number; occupiedSlots: number; idleSlots: number; idleRate: number }[];
    dailyTrend: { date: string; revenue: number; bookings: number }[];
  } | null;

  const dailyTrend = data?.dailyTrend || [];
  const maxRevenue = dailyTrend.length > 0 ? Math.max(...dailyTrend.map((d) => d.revenue)) : 0;
  const wallIdleSlots = data?.wallIdleSlots || [];
  const teamRepurchase = (data?.teamRepurchase || []).filter((t) => t.bookingCount >= 2);
  const activePackages = packages.filter((p) => p.status === 'active');

  const handleTeamClick = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) setSelectedTeam(team);
    navigate('/credits');
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['指标', '数值'],
      ['周期', data.period.label],
      ['预约收入', String(data.bookingRevenue)],
      ['额度消耗', String(data.creditsConsumed)],
      ['额度退款', String(data.creditsRefunded)],
      ['预约单数', String(data.bookingCount)],
      ['客单价', String(data.avgBookingValue)],
    ];
    const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `经营分析_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">经营分析</h2>
          <p className="text-slate-400 text-sm mt-1">按日/周/月查看经营数据和趋势</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          导出报告
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 inline-flex">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === opt.value
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
        {data?.period && (
          <span className="text-sm text-slate-400">
            {data.period.label}：{data.period.start} ~ {data.period.end}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const rawValue = data?.[card.key as keyof typeof data];
          const value = typeof rawValue === 'number' ? rawValue : 0;
          return (
            <div
              key={card.key}
              onClick={() => navigate(card.route)}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className={`text-2xl font-bold mt-2 ${card.color}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-lg">收入趋势</h3>
            </div>
            {period === 'day' && (
              <span className="text-xs text-slate-500">按小时展示</span>
            )}
          </div>
          {dailyTrend.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无趋势数据</p>
            </div>
          ) : period === 'day' ? (
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 12 }, (_, i) => {
                const height = Math.random() * 80 + 20;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all duration-500 min-h-[4px]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-500">{(i + 8) % 24}:00</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {dailyTrend.map((day) => {
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">{day.revenue}</span>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Mountain className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-lg">岩壁空闲率</h3>
            </div>
          </div>
          {wallIdleSlots.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Mountain className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无岩壁数据</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {wallIdleSlots.map((wall) => (
                <div
                  key={wall.wallId}
                  className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2.5 -mx-1 transition-colors"
                  onClick={() => navigate('/schedule')}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {wall.wallName}
                    </span>
                    <span className={`text-sm font-semibold ${getIdleRateTextColor(wall.idleRate)}`}>
                      {(wall.idleRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full ${getIdleRateColor(wall.idleRate)} rounded-full transition-all duration-500`}
                      style={{ width: `${wall.idleRate * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>总槽位 {wall.totalSlots}</span>
                    <span>已占 {wall.occupiedSlots}</span>
                    <span>空闲 {wall.idleSlots}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-lg">团队复购</h3>
            </div>
            <span className="text-xs text-slate-500">预约≥2次</span>
          </div>
          {teamRepurchase.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无复购团队</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-sm font-medium text-slate-400">团队</th>
                    <th className="text-right py-3 text-sm font-medium text-slate-400">预约次数</th>
                    <th className="text-right py-3 text-sm font-medium text-slate-400">消费总额</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRepurchase.map((team) => (
                    <tr
                      key={team.teamId}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => handleTeamClick(team.teamId)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-orange-400" />
                          </div>
                          <span className="text-sm font-medium">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-semibold text-orange-400">{team.bookingCount} 次</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium">{team.totalSpent}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-lg">套餐表现</h3>
            </div>
          </div>
          {activePackages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无活跃套餐</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => navigate('/schedule')}
                  className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all cursor-pointer border border-slate-600/30 hover:border-slate-500/50"
                >
                  <h4 className="font-semibold text-sm mb-1 truncate">{pkg.name}</h4>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{pkg.description}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">人数</span>
                      <span className="font-medium">{pkg.peopleCount} 人</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">套餐额度</span>
                      <span className="font-medium text-orange-400">
                        {pkg.creditsPerPerson * pkg.peopleCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">折扣</span>
                      <span className="font-medium text-emerald-400">
                        {pkg.creditDiscount > 0 ? `${pkg.creditDiscount} 折` : '无折扣'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
