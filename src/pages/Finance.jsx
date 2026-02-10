import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import StatsCard from '../components/dashboard/StatsCard';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Loader2,
  Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const months = [
  { value: "all", label: "כל השנה" },
  { value: "1", label: "ינואר" },
  { value: "2", label: "פברואר" },
  { value: "3", label: "מרץ" },
  { value: "4", label: "אפריל" },
  { value: "5", label: "מאי" },
  { value: "6", label: "יוני" },
  { value: "7", label: "יולי" },
  { value: "8", label: "אוגוסט" },
  { value: "9", label: "ספטמבר" },
  { value: "10", label: "אוקטובר" },
  { value: "11", label: "נובמבר" },
  { value: "12", label: "דצמבר" }
];

function getPrimaryPlatform(campaign) {
  if (Array.isArray(campaign.platform_content_items) && campaign.platform_content_items.length > 0) {
    return campaign.platform_content_items[0]?.platform || 'Other';
  }
  if (campaign.platform) return campaign.platform;
  return 'Other';
}

export default function Finance() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: campaignsRaw, isLoading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });
  const campaigns = Array.isArray(campaignsRaw) ? campaignsRaw : [];

  const now = new Date();
  const currentYear = parseInt(selectedYear);

  // Filter campaigns by selected period
  const getDateRange = () => {
    if (selectedMonth === "all") {
      return {
        start: startOfYear(new Date(currentYear, 0)),
        end: endOfYear(new Date(currentYear, 0))
      };
    }
    const month = parseInt(selectedMonth) - 1;
    return {
      start: startOfMonth(new Date(currentYear, month)),
      end: endOfMonth(new Date(currentYear, month))
    };
  };

  const dateRange = getDateRange();

  const filteredCampaigns = campaigns.filter(c => {
    if (!c.planned_payment_date) return false;
    const date = new Date(c.planned_payment_date);
    return isWithinInterval(date, dateRange);
  });

  // Calculate stats (net income after agent commission)
  const totalExpected = filteredCampaigns.reduce((sum, c) => {
    const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
    return sum + netAmount;
  }, 0);
  const totalPaid = filteredCampaigns.filter(c => c.is_paid).reduce((sum, c) => {
    const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
    return sum + netAmount;
  }, 0);
  const totalPending = totalExpected - totalPaid;
  const pendingCampaigns = filteredCampaigns.filter(c => !c.is_paid);

  // Monthly data for chart
  const monthlyData = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = startOfMonth(new Date(currentYear, i));
    const monthEnd = endOfMonth(new Date(currentYear, i));
    
    const monthCampaigns = campaigns.filter(c => {
      if (!c.planned_payment_date) return false;
      const date = new Date(c.planned_payment_date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const paidCampaigns = monthCampaigns.filter(c => c.is_paid);
    const pendingCampaigns = monthCampaigns.filter(c => !c.is_paid);

    const paid = paidCampaigns.reduce((sum, c) => {
      const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
      return sum + netAmount;
    }, 0);
    const pending = pendingCampaigns.reduce((sum, c) => {
      const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
      return sum + netAmount;
    }, 0);

    monthlyData.push({
      month: format(monthStart, 'MMM', { locale: he }),
      paid,
      pending,
      paidCount: paidCampaigns.length,
      pendingCount: pendingCampaigns.length,
      totalCount: monthCampaigns.length,
      paidCampaigns: paidCampaigns.map(c => c.brand_name),
      pendingCampaigns: pendingCampaigns.map(c => c.brand_name)
    });
  }

  // Years for filter
  const years = [...new Set(campaigns.map(c => {
    if (!c.planned_payment_date) return null;
    return new Date(c.planned_payment_date).getFullYear();
  }).filter(Boolean))].sort((a, b) => b - a);

  if (!years.includes(now.getFullYear())) {
    years.unshift(now.getFullYear());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">כספים</h1>
          <p className="text-slate-500 mt-1">מעקב הכנסות ותשלומים</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="סה״כ צפוי"
          value={`₪${totalExpected.toLocaleString()}`}
          icon={TrendingUp}
          color="indigo"
        />
        <StatsCard
          title="שולם"
          value={`₪${totalPaid.toLocaleString()}`}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="ממתין לתשלום"
          value={`₪${totalPending.toLocaleString()}`}
          subtitle={`${pendingCampaigns.length} קמפיינים`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-slate-800">סיכום שנתי {selectedYear}</h3>
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-sm text-slate-700 font-medium">שולם</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
              <span className="text-sm text-slate-700 font-medium">ממתין</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={8} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '12px',
                  minWidth: '200px'
                }}
                cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                content={(props) => {
                  if (!props.active || !props.payload || !props.payload.length) return null;
                  const data = props.payload[0].payload;
                  return (
                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-lg" dir="rtl">
                      <div className="font-bold text-slate-800 mb-3 text-base">{data.month}</div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-slate-600">שולם</span>
                          </div>
                          <span className="font-bold text-emerald-600">
                            ₪{data.paid.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-sm text-slate-600">ממתין</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            ₪{data.pending.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">סה״כ</span>
                          <span className="font-bold text-slate-800">
                            ₪{(data.paid + data.pending).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {data.totalCount > 0 ? (
                            <div className="flex items-center justify-between">
                              <span>קמפיינים:</span>
                              <span className="font-semibold">
                                {data.paidCount} שולמו מתוך {data.totalCount}
                              </span>
                            </div>
                          ) : (
                            <span>אין קמפיינים</span>
                          )}
                        </div>
                      </div>

                      {data.paidCampaigns.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200">
                          <div className="text-xs font-semibold text-emerald-700 mb-1">✓ שולם:</div>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            {data.paidCampaigns.map((name, i) => (
                              <div key={i}>• {name}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.pendingCampaigns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="text-xs font-semibold text-orange-700 mb-1">⏳ ממתין:</div>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            {data.pendingCampaigns.map((name, i) => (
                              <div key={i}>• {name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="paid" 
                name="שולם" 
                fill="url(#paidGradient)" 
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
              <Bar 
                dataKey="pending" 
                name="ממתין" 
                fill="url(#pendingGradient)" 
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-slate-800">תשלומים ממתינים</h3>
          {pendingCampaigns.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {pendingCampaigns.length} ממתינים
            </Badge>
          )}
        </div>
        
        {pendingCampaigns.length > 0 ? (
          <div className="space-y-2">
            {pendingCampaigns.map(campaign => {
              const primaryPlatform = getPrimaryPlatform(campaign);
              return (
              <Link
                key={campaign.id}
                to={createPageUrl(`CampaignDetails?id=${campaign.id}`)}
                className="group flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-slate-100 group-hover:scale-110 transition-transform",
                    primaryPlatform === 'Instagram' ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                    primaryPlatform === 'TikTok' ? "bg-black" :
                    primaryPlatform === 'YouTube' ? "bg-red-600" :
                    primaryPlatform === 'Facebook' ? "bg-blue-600" :
                    primaryPlatform === 'Twitter' ? "bg-sky-500" :
                    "bg-slate-500"
                  )}>
                    {primaryPlatform.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{campaign.brand_name}</h4>
                    {campaign.planned_payment_date && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        תשלום עד {format(new Date(campaign.planned_payment_date), 'd MMMM', { locale: he })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xl font-black bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ₪{(campaign.payment_amount * (1 - (campaign.agent_commission_percentage || 0) / 100)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                  </span>
                  {campaign.agent_commission_percentage > 0 && (
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                      מתוך ₪{campaign.payment_amount?.toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            )})}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-600 font-medium">אין תשלומים ממתינים</p>
            <p className="text-sm text-slate-400 mt-1">כל התשלומים עודכנו</p>
          </div>
        )}
      </div>
    </div>
  );
}