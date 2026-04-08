import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Flag,
  TrendingUp,
  BarChart3,
  Eye,
  AlertTriangle,
  Users,
  Building2,
  Settings,
  Bell,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

const navItems = [
  { path: "/portal", label: "Portfolio", icon: LayoutDashboard },
  { path: "/portal/reviews", label: "Review Feed", icon: MessageSquare },
  { path: "/portal/moderation", label: "Moderation Queue", icon: Flag },
  { path: "/portal/performance", label: "Category Performance", icon: TrendingUp },
  { path: "/portal/benchmark", label: "Benchmark Comparison", icon: BarChart3 },
  { path: "/portal/signals", label: "Renter Interest", icon: Eye },
  { path: "/portal/alerts", label: "Review Gap Alerts", icon: AlertTriangle },
  { path: "/portal/team", label: "Team Access", icon: Users },
  { path: "/portal/profile", label: "Company Profile", icon: Building2 },
  { path: "/portal/settings", label: "Notifications", icon: Settings },
];

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/portal") {
      return location.pathname === "/portal";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1f3a] text-white flex flex-col">
        <div className="p-6 border-b border-[#2a4266]">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#f59e0b]" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              LivedIn
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Property Management</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      active
                        ? "bg-[#f59e0b] text-[#0a1628] font-medium"
                        : "text-gray-300 hover:bg-[#1a2f52] hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#2a4266]">
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#f59e0b] text-[#0a1628]">SM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Sarah Mitchell</p>
              <p className="text-xs text-gray-400 truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#f59e0b] rounded-full"></span>
            </Button>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-[#0f1f3a] text-white">SM</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
