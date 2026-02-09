import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "indigo", trend }) {
  const iconColors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}