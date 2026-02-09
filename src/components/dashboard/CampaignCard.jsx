import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const platformColors = {
  Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  TikTok: "bg-black",
  YouTube: "bg-red-600",
  Facebook: "bg-blue-600",
  Twitter: "bg-sky-500",
  Other: "bg-slate-500"
};

const statusConfig = {
  waiting_signature: { label: "ממתין לחתימה", color: "bg-amber-100 text-amber-700 border-amber-200" },
  signed: { label: "חתום", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "בתהליך יצירה", color: "bg-purple-100 text-purple-700 border-purple-200" },
  published: { label: "פורסם", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  waiting_payment: { label: "ממתין לתשלום", color: "bg-orange-100 text-orange-700 border-orange-200" },
  paid: { label: "שולם", color: "bg-green-100 text-green-700 border-green-200" }
};

const contentTypeLabels = {
  video: "וידאו",
  story: "סטורי",
  post: "פוסט",
  reel: "ריל",
  short: "שורט"
};

export default function CampaignCard({ campaign, compact = false }) {
  const status = statusConfig[campaign.status] || statusConfig.waiting_signature;
  const platforms = campaign.platforms || (campaign.platform ? [campaign.platform] : []);
  const primaryPlatform = platforms[0] || 'Other';
  const netIncome = campaign.payment_amount 
    ? (campaign.payment_amount * (1 - (campaign.agent_commission_percentage || 0) / 100))
    : 0;

  if (compact) {
    return (
      <Link 
        to={createPageUrl(`CampaignDetails?id=${campaign.id}`)}
        className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {platforms.slice(0, 2).map((platform, idx) => (
              <div 
                key={idx}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold border-2 border-white", platformColors[platform])}
              >
                {platform.charAt(0)}
              </div>
            ))}
            {platforms.length > 2 && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-200 text-slate-600 text-xs font-bold border-2 border-white">
                +{platforms.length - 2}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{campaign.brand_name}</h4>
            <p className="text-xs text-slate-500">{contentTypeLabels[campaign.content_type]}</p>
          </div>
        </div>
        <div className="text-left">
          <Badge className={cn("border text-xs", status.color)}>{status.label}</Badge>
          {campaign.planned_publish_date && (
            <p className="text-xs text-slate-400 mt-1">
              {format(new Date(campaign.planned_publish_date), 'd MMM', { locale: he })}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={createPageUrl(`CampaignDetails?id=${campaign.id}`)}
      className="group relative block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all duration-300 hover:border-indigo-300"
    >
      {/* Gradient Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
              {campaign.brand_name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {platforms.map((platform, idx) => (
                <div key={idx} className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-xs font-medium",
                  platformColors[platform]
                )}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  {platform}
                </div>
              ))}
              <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 rounded-md font-medium">
                {contentTypeLabels[campaign.content_type]}
              </span>
            </div>
          </div>
          <Badge className={cn("shrink-0 text-xs font-medium px-2.5 py-1", status.color)}>
            {status.label}
          </Badge>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />

        {/* Info Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">תאריך פרסום</p>
                <p className="text-sm font-semibold text-slate-900">
                  {campaign.planned_publish_date 
                    ? format(new Date(campaign.planned_publish_date), 'd MMMM', { locale: he })
                    : "לא נקבע"
                  }
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500 font-medium mb-0.5">הכנסה צפויה</p>
              <p className="text-2xl font-black bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ₪{netIncome.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          
          {campaign.agent_commission_percentage > 0 && (
            <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <span className="text-slate-600">סה"כ תשלום</span>
              <span className="font-semibold text-slate-900">
                ₪{campaign.payment_amount?.toLocaleString()}
              </span>
              <span className="text-slate-500">
                עמלה {campaign.agent_commission_percentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}