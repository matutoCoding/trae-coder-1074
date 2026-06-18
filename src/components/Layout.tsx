import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Mountain,
  Calendar,
  ClipboardList,
  Coins,
  HardHat,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/analytics', label: '经营分析', icon: BarChart3 },
  { path: '/walls', label: '岩壁道管理', icon: Mountain },
  { path: '/schedule', label: '排期日历', icon: Calendar },
  { path: '/bookings', label: '预约管理', icon: ClipboardList },
  { path: '/credits', label: '团队额度', icon: Coins },
  { path: '/equipment', label: '装备租赁', icon: HardHat },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside
        className={cn(
          'bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Mountain className="w-7 h-7 text-orange-500" />
              <span className="font-bold text-lg tracking-tight">ClimbPro</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="text-xs text-slate-500">
              攀岩馆预约管理系统 v1.0
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">攀岩馆场次预约系统</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400">运营管理员</div>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-medium">
              管
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
