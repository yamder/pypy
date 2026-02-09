import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Megaphone, 
  Wallet, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from './components/notifications/NotificationBell';
import NotificationEngine from './components/notifications/NotificationEngine';

const navItems = [
  { name: 'Dashboard', label: 'ראשי', icon: LayoutDashboard },
  { name: 'Campaigns', label: 'קמפיינים', icon: Megaphone },
  { name: 'Finance', label: 'כספים', icon: Wallet },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <NotificationEngine />
      <style>{`
        :root {
          --primary: 99 102 241;
          --primary-dark: 79 70 229;
        }
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Heebo', sans-serif;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            CreatorHub
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-200 z-40 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  CreatorHub
                </h1>
                <p className="text-xs text-slate-500">ניהול קמפיינים</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen pt-20 lg:pt-8 pb-8 px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}