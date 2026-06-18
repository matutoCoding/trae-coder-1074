import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Calendar, Clock, Mountain, Coins, XCircle, Layers, Filter } from 'lucide-react';
import type { Booking } from '../../shared/types';

export default function Bookings() {
  const { bookings, walls, teams, fetchBookings, fetchWalls, fetchTeams, cancelBooking } = useAppStore();
  const [filterTeam, setFilterTeam] = useState('');
  const [filterWall, setFilterWall] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchWalls();
    fetchTeams();
  }, [fetchBookings, fetchWalls, fetchTeams]);

  const filteredBookings = bookings.filter((b) => {
    if (filterTeam && b.teamId !== filterTeam) return false;
    if (filterWall && b.wallId !== filterWall) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const getWallName = (wallId: string) => walls.find((w) => w.id === wallId)?.name || '-';
  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || '-';

  const handleCancel = async (booking: Booking) => {
    if (confirm(`确定要取消这个预约吗？将退还 ${booking.creditsCost} 额度。`)) {
      await cancelBooking(booking.id);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">预约管理</h2>
          <p className="text-slate-400 text-sm mt-1">查看和管理所有预约记录</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">筛选:</span>
          </div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">全部团队</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={filterWall}
            onChange={(e) => setFilterWall(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">全部岩壁道</option>
            {walls.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">全部状态</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">预约ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">团队</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">岩壁道</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">时段</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">消耗额度</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>暂无预约记录</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-300">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="font-medium">{getTeamName(booking.teamId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mountain className="w-4 h-4 text-blue-400" />
                        <span>{getWallName(booking.wallId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateTime(booking.startTime)}</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          至 {formatDateTime(booking.endTime)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-orange-400 font-medium flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {booking.creditsCost}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {booking.status === 'confirmed' ? '已确认' : '已取消'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          取消
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

      <div className="text-sm text-slate-500">
        共 {filteredBookings.length} 条预约记录
      </div>
    </div>
  );
}
