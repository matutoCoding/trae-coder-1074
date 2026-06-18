import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ChevronLeft, ChevronRight, Plus, Clock, Layers, HardHat, Check, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const CREDITS_PER_HOUR = 10;

export default function Schedule() {
  const {
    walls,
    occupancies,
    teams,
    equipment,
    fetchWalls,
    fetchOccupancies,
    fetchTeams,
    fetchEquipment,
    createBooking,
    fetchAvailableSlots,
    selectedTeam,
    setSelectedTeam,
  } = useAppStore();

  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWall, setSelectedWall] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: number; end: number; dayIdx: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ hour: number; dayIdx: number } | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingTeamId, setBookingTeamId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchWalls();
    fetchTeams();
    fetchEquipment();
  }, [fetchWalls, fetchTeams, fetchEquipment]);

  useEffect(() => {
    if (selectedWall) {
      fetchOccupancies({ wallId: selectedWall });
    }
  }, [selectedWall, fetchOccupancies]);

  useEffect(() => {
    if (walls.length > 0 && !selectedWall) {
      setSelectedWall(walls[0].id);
    }
  }, [walls, selectedWall]);

  useEffect(() => {
    if (teams.length > 0 && !bookingTeamId) {
      setBookingTeamId(teams[0].id);
    }
  }, [teams, bookingTeamId]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const handleSlotMouseDown = (hour: number, dayIdx: number) => {
    setIsSelecting(true);
    setSelectionStart({ hour, dayIdx });
    setSelectedSlot({ start: hour, end: hour + 1, dayIdx });
  };

  const handleSlotMouseEnter = (hour: number, dayIdx: number) => {
    if (isSelecting && selectionStart !== null) {
      if (dayIdx !== selectionStart.dayIdx) return;
      const start = Math.min(selectionStart.hour, hour);
      const end = Math.max(selectionStart.hour, hour) + 1;
      setSelectedSlot({ start, end, dayIdx });
    }
  };

  const handleSlotMouseUp = () => {
    if (isSelecting && selectedSlot) {
      setSelectedEquipment({});
      setBookingError('');
      setAvailableSlots([]);
      setShowBookingModal(true);
    }
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const getOccupanciesForSlot = useCallback((date: Date, hour: number) => {
    return occupancies.filter((occ) => {
      const occStart = new Date(occ.startTime);
      const occEnd = new Date(occ.endTime);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      return slotStart < occEnd && slotEnd > occStart;
    });
  }, [occupancies]);

  const isSlotInSelection = (hour: number, dayIdx: number) => {
    if (!selectedSlot) return false;
    if (selectedSlot.dayIdx !== dayIdx) return false;
    return hour >= selectedSlot.start && hour < selectedSlot.end;
  };

  const isSlotOccupied = (date: Date, hour: number) => {
    return getOccupanciesForSlot(date, hour).length > 0;
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment((prev) => {
      if (prev[equipmentId]) {
        const next = { ...prev };
        delete next[equipmentId];
        return next;
      }
      return { ...prev, [equipmentId]: 1 };
    });
  };

  const setEquipmentQty = (equipmentId: string, qty: number) => {
    if (qty <= 0) {
      const next = { ...selectedEquipment };
      delete next[equipmentId];
      setSelectedEquipment(next);
    } else {
      setSelectedEquipment((prev) => ({ ...prev, [equipmentId]: qty }));
    }
  };

  const handleGoToCredits = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
    }
    navigate('/credits');
  };

  const loadAvailableSlots = async () => {
    if (!selectedWall || !selectedSlot) return;
    const date = weekDays[selectedSlot.dayIdx];
    const dateStr = date.toISOString().split('T')[0];
    const duration = selectedSlot.end - selectedSlot.start;
    setLoadingSlots(true);
    try {
      const slots = await fetchAvailableSlots(selectedWall, dateStr, duration);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectAvailableSlot = (slot: { start: string; end: string }) => {
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    setSelectedSlot({
      start: startDate.getHours(),
      end: endDate.getHours(),
      dayIdx: selectedSlot!.dayIdx,
    });
    setBookingError('');
    setAvailableSlots([]);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !selectedWall || !bookingTeamId) return;
    setSubmitting(true);
    setBookingError('');
    setAvailableSlots([]);

    const date = weekDays[selectedSlot.dayIdx];
    const startTime = new Date(date);
    startTime.setHours(selectedSlot.start, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(selectedSlot.end, 0, 0, 0);

    const equipmentRentals = Object.entries(selectedEquipment).map(([equipmentId, quantity]) => ({
      equipmentId,
      quantity,
    }));

    try {
      await createBooking({
        teamId: bookingTeamId,
        wallId: selectedWall,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        equipmentRentals,
      });
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedEquipment({});
    } catch (err: any) {
      const errMsg = err.message || '';
      setBookingError(errMsg);
      if (errMsg.includes('占用')) {
        loadAvailableSlots();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWallData = walls.find((w) => w.id === selectedWall);
  const selectedBookingTeam = teams.find((t) => t.id === bookingTeamId);
  const requiredCredits = selectedSlot ? (selectedSlot.end - selectedSlot.start) * CREDITS_PER_HOUR : 0;
  const teamAvailableCredits = selectedBookingTeam
    ? selectedBookingTeam.totalCredits - selectedBookingTeam.usedCredits
    : 0;
  const isBalanceInsufficient = teamAvailableCredits < requiredCredits;

  const occupancyStartsAtHour = (occ: any, date: Date, hour: number) => {
    const occStart = new Date(occ.startTime);
    return occStart.getHours() === hour && occStart.toDateString() === date.toDateString();
  };

  return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">排期日历</h2>
          <p className="text-slate-400 text-sm mt-1">
            {selectedWallData ? selectedWallData.name : '请选择岩壁道'} - 拖拽选择时段进行预约
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWall}
            onChange={(e) => setSelectedWall(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
          >
            {walls.map((wall) => (
              <option key={wall.id} value={wall.id}>
                {wall.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-lg font-semibold">
            {weekDays[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-auto"
          onMouseUp={handleSlotMouseUp}
          onMouseLeave={handleSlotMouseUp}
        >
          <div className="min-w-[900px]">
            <div className="flex border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <div className="w-16 flex-shrink-0"></div>
              {weekDays.map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelectedDay = selectedSlot?.dayIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`flex-1 p-3 text-center border-l border-slate-700 first:border-l-0 transition-colors ${
                      isToday
                        ? 'bg-orange-500/10'
                        : isSelectedDay
                        ? 'bg-orange-500/5'
                        : ''
                    }`}
                  >
                    <div className={`text-xs ${isSelectedDay ? 'text-orange-400' : 'text-slate-400'}`}>
                      {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </div>
                    <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-orange-400' : ''}`}>
                      {day.getDate()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {day.toLocaleDateString('zh-CN', { month: 'numeric' })}月
                    </div>
                  </div>
                );
              })}
            </div>

            {HOURS.map((hour) => (
              <div key={hour} className="flex border-b border-slate-700/50 h-16">
                <div className="w-16 flex-shrink-0 text-xs text-slate-500 text-right pr-3 pt-2">
                  {hour}:00
                </div>
                {weekDays.map((day, dayIdx) => {
                  const occupied = isSlotOccupied(day, hour);
                  const inSelection = isSlotInSelection(hour, dayIdx);
                  const occ = getOccupanciesForSlot(day, hour)[0];
                  const team = teams.find((t) => t.id === occ?.teamId);

                  return (
                    <div
                      key={dayIdx}
                      className={`flex-1 border-l border-slate-700/50 first:border-l-0 cursor-pointer transition-colors relative ${
                        occupied
                          ? 'bg-rose-500/20'
                          : inSelection
                          ? 'bg-orange-500/30 ring-2 ring-orange-500/50 ring-inset'
                          : 'hover:bg-slate-700/30'
                      }`}
                      onMouseDown={() => !occupied && handleSlotMouseDown(hour, dayIdx)}
                      onMouseEnter={() => !occupied && handleSlotMouseEnter(hour, dayIdx)}
                    >
                      {occ && occupied && occupancyStartsAtHour(occ, day, hour) && (
                        <div
                          className={`absolute inset-x-1 top-1 bottom-1 rounded px-2 py-1 text-xs overflow-hidden z-[1] ${
                            occ.isMerged
                              ? 'bg-gradient-to-r from-rose-500/40 to-orange-500/40 border border-rose-400/30'
                              : 'bg-rose-500/30 border border-rose-500/30'
                          }`}
                          style={{
                            height: `calc(${(new Date(occ.endTime).getTime() - new Date(occ.startTime).getTime()) / (1000 * 60 * 60)} * 100% - 8px)`,
                          }}
                        >
                          <div className="font-medium text-rose-200 truncate">
                            {team?.name || '未知团队'}
                          </div>
                          <div className="text-rose-300/70 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(occ.startTime).getHours()}:00 -{' '}
                            {new Date(occ.endTime).getHours()}:00
                          </div>
                          {occ.isMerged && (
                            <div className="text-[10px] text-amber-300/80 flex items-center gap-1 mt-0.5">
                              <Layers className="w-3 h-3" />
                              合并 {occ.bookingIds.length} 段
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500/30 border border-rose-500/30"></div>
          <span>已占用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-rose-500/40 to-orange-500/40 border border-rose-400/30"></div>
          <span>合并占用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/30 ring-2 ring-orange-500/50"></div>
          <span>选中时段</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-700/30 border border-slate-600/30"></div>
          <span>可预约</span>
        </div>
      </div>

      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">创建预约</h3>

            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">岩壁道</span>
                  <span className="font-medium">{selectedWallData?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">日期</span>
                  <span className="font-medium text-orange-400">
                    {weekDays[selectedSlot.dayIdx].toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">时段</span>
                  <span className="font-medium">
                    {selectedSlot.start}:00 - {selectedSlot.end}:00
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">时长</span>
                  <span className="font-medium">{selectedSlot.end - selectedSlot.start} 小时</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-600/50">
                  <span className="text-slate-400">消耗额度</span>
                  <span className="font-bold text-orange-400 text-lg">
                    {requiredCredits} 额度
                  </span>
                </div>
              </div>

              {isBalanceInsufficient && selectedBookingTeam && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400 font-medium">
                    <AlertTriangle className="w-5 h-5" />
                    余额不足
                  </div>
                  <p className="text-sm text-red-300/70 mt-1">
                    当前团队可用额度 {teamAvailableCredits}，需要 {requiredCredits} 额度
                  </p>
                  <button
                    onClick={() => handleGoToCredits(bookingTeamId)}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors font-medium"
                  >
                    前往充值
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {bookingError && bookingError.includes('额度不足') && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-400 font-medium">
                    <AlertTriangle className="w-5 h-5" />
                    额度不足
                  </div>
                  <p className="text-sm text-amber-300/70 mt-1">
                    团队额度不足以完成本次预约，请充值后再试
                  </p>
                  <button
                    onClick={() => handleGoToCredits(bookingTeamId)}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm rounded-lg transition-colors font-medium"
                  >
                    前往充值
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {bookingError && bookingError.includes('占用') && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-rose-400 font-medium">
                    <AlertTriangle className="w-5 h-5" />
                    该时段已被占用
                  </div>
                  <p className="text-sm text-rose-300/70 mt-1">
                    所选时段与其他预约冲突，请选择其他可用时段
                  </p>
                  {loadingSlots && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在查找可用时段...
                    </div>
                  )}
                  {!loadingSlots && availableSlots.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-slate-300 font-medium">可用时段：</p>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map((slot, idx) => {
                          const s = new Date(slot.start);
                          const e = new Date(slot.end);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectAvailableSlot(slot)}
                              className="px-3 py-2 bg-slate-700/50 hover:bg-orange-500/20 border border-slate-600 hover:border-orange-500/30 rounded-lg text-sm transition-colors"
                            >
                              {s.getHours()}:00 - {e.getHours()}:00
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!loadingSlots && availableSlots.length === 0 && bookingError.includes('占用') && (
                    <p className="text-sm text-slate-400 mt-2">暂无可用时段</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">选择团队</label>
                <select
                  value={bookingTeamId}
                  onChange={(e) => {
                    setBookingTeamId(e.target.value);
                    setBookingError('');
                    setAvailableSlots([]);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  {teams.length === 0 && <option value="">加载中...</option>}
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} (剩余 {team.totalCredits - team.usedCredits} / {team.totalCredits} 额度)
                    </option>
                  ))}
                </select>
                {selectedBookingTeam && (
                  <div className="mt-1.5 text-xs text-slate-500">
                    预约后可用余额将变为：{teamAvailableCredits - requiredCredits} 额度
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1.5">
                  <HardHat className="w-4 h-4" />
                  安全装备租赁（可选）
                </label>
                <div className="space-y-2">
                  {equipment.map((eq) => {
                    const checked = !!selectedEquipment[eq.id];
                    const qty = selectedEquipment[eq.id] || 0;
                    const disabled = eq.available === 0;
                    return (
                      <div
                        key={eq.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          checked
                            ? 'bg-orange-500/10 border-orange-500/30'
                            : disabled
                            ? 'bg-slate-800/50 border-slate-700/50 opacity-50'
                            : 'bg-slate-700/20 border-slate-700/50 hover:bg-slate-700/30'
                        }`}
                      >
                        <label
                          className={`flex items-center gap-3 flex-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={(e) => {
                            if (disabled) e.preventDefault();
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              checked
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-slate-500'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 text-white" />}
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => !disabled && toggleEquipment(eq.id)}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{eq.name}</div>
                            <div className="text-xs text-slate-500">
                              可租 {eq.available} / 共 {eq.total}
                            </div>
                          </div>
                        </label>
                        {checked && (
                          <div className="flex items-center gap-1 ml-3">
                            <button
                              onClick={() => setEquipmentQty(eq.id, qty - 1)}
                              className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={eq.available}
                              value={qty}
                              onChange={(e) =>
                                setEquipmentQty(eq.id, Math.min(eq.available, Math.max(1, Number(e.target.value) || 1)))
                              }
                              className="w-12 px-2 py-1 text-center bg-slate-700/50 border border-slate-600 rounded text-sm focus:outline-none focus:border-orange-500"
                            />
                            <button
                              onClick={() => setEquipmentQty(eq.id, Math.min(eq.available, qty + 1))}
                              className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedSlot(null);
                    setSelectedEquipment({});
                    setBookingError('');
                    setAvailableSlots([]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateBooking}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? '提交中...' : '确认预约'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
