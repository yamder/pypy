import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import StatusBadge from '../components/campaigns/StatusBadge';
import CampaignForm from '../components/campaigns/CampaignForm';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  Calendar, 
  FileText, 
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Link as LinkIcon,
  Lightbulb,
  StickyNote,
  Sparkles,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const platformColors = {
  Instagram: "from-purple-500 to-pink-500",
  TikTok: "from-gray-800 to-black",
  YouTube: "from-red-500 to-red-600",
  Facebook: "from-blue-500 to-blue-600",
  Twitter: "from-sky-400 to-sky-500",
  Other: "from-slate-400 to-slate-500"
};

const statuses = [
  { value: "waiting_signature", label: "ממתין לחתימה" },
  { value: "signed", label: "חתום" },
  { value: "in_progress", label: "בתהליך יצירה" },
  { value: "published", label: "פורסם" },
  { value: "waiting_payment", label: "ממתין לתשלום" },
  { value: "paid", label: "שולם" }
];

const contentTypeLabels = {
  video: "וידאו",
  story: "סטורי",
  post: "פוסט",
  reel: "ריל",
  short: "שורט"
};

const paymentTermsLabels = {
  immediate: "מיידי",
  net_30: "שוטף +30",
  net_45: "שוטף +45",
  net_60: "שוטף +60",
  net_90: "שוטף +90"
};

export default function CampaignDetails() {
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('id');
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId, user?.id],
    queryFn: async () => {
      if (!campaignId || !user?.id) return null;
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId && !!user?.id
  });

  const handleStatusChange = async (status) => {
    setUpdating(true);
    const updates = { status };
    
    if (status === 'published' && !campaign.actual_publish_date) {
      updates.actual_publish_date = new Date().toISOString().split('T')[0];
    }
    
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('user_id', user?.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, user?.id] });
    queryClient.invalidateQueries({ queryKey: ['campaigns', user?.id] });
    setUpdating(false);
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);
    const { error } = await supabase.from('campaigns').update({
      is_paid: true,
      paid_date: new Date().toISOString().split('T')[0],
      status: 'paid'
    })
      .eq('id', campaignId)
      .eq('user_id', user?.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, user?.id] });
    queryClient.invalidateQueries({ queryKey: ['campaigns', user?.id] });
    setUpdating(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user?.id);
    if (error) throw error;
    window.location.href = createPageUrl('Campaigns');
  };

  const handleUpdateLink = async (link) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ published_link: link })
      .eq('id', campaignId)
      .eq('user_id', user?.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, user?.id] });
  };

  const handleToggleCompleted = async (itemIndex) => {
    const updatedItems = [...campaign.platform_content_items];
    const currentCompleted = updatedItems[itemIndex].completed || 0;
    const total = updatedItems[itemIndex].quantity || 0;
    
    // Add 1 each click, reset to 0 when reaching total
    const newCompleted = currentCompleted >= total ? 0 : currentCompleted + 1;
    
    updatedItems[itemIndex] = { 
      ...updatedItems[itemIndex], 
      completed: newCompleted
    };
    
    const { error } = await supabase.from('campaigns').update({ 
      platform_content_items: updatedItems 
    })
      .eq('id', campaignId)
      .eq('user_id', user?.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, user?.id] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">הקמפיין לא נמצא</p>
        <Link to={createPageUrl('Campaigns')}>
          <Button className="mt-4">חזרה לקמפיינים</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link 
        to={createPageUrl('Campaigns')}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לקמפיינים
      </Link>

      {/* Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 translate-y-32" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {campaign.platform_content_items && campaign.platform_content_items.length > 0 ? (
                  campaign.platform_content_items.map((item, idx) => (
                    <span key={idx} className="text-white/80 text-sm px-3 py-1 bg-white/20 rounded-lg font-medium">
                      {item.quantity}× {contentTypeLabels[item.content_type]} ב{item.platform}
                    </span>
                  ))
                ) : (
                  <>
                    {(campaign.platforms || [campaign.platform]).map((platform, idx) => (
                      <span key={idx} className="text-white/80 text-sm px-2 py-1 bg-white/20 rounded">
                        {platform}
                      </span>
                    ))}
                    <span className="text-white/40">•</span>
                    <span className="text-white/70 text-sm">{contentTypeLabels[campaign.content_type]}</span>
                  </>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{campaign.brand_name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowEditForm(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-white/20 hover:bg-red-500 text-white border-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white/60 text-sm">סכום מלא</p>
              <p className="text-2xl font-bold">₪{campaign.payment_amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">הכנסה נטו</p>
              <p className="text-2xl font-bold">
                ₪{(campaign.payment_amount * (1 - (campaign.agent_commission_percentage || 0) / 100)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
              </p>
            </div>
            {campaign.agent_commission_percentage > 0 && (
              <div>
                <p className="text-white/60 text-sm">עמלת סוכן</p>
                <p className="text-2xl font-bold">{campaign.agent_commission_percentage}%</p>
              </div>
            )}
            {campaign.planned_publish_date && (
              <div>
                <p className="text-white/60 text-sm">תאריך פרסום</p>
                <p className="text-lg font-semibold">
                  {format(new Date(campaign.planned_publish_date), 'd MMMM yyyy', { locale: he })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-6 shadow-md">
          <h3 className="font-semibold text-slate-700 mb-4">עדכון סטטוס</h3>
          <Select 
            value={campaign.status} 
            onValueChange={handleStatusChange}
            disabled={updating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-6 shadow-md">
          <h3 className="font-semibold text-slate-700 mb-4">תשלום</h3>
          {campaign.is_paid ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium text-green-700">שולם</p>
                {campaign.paid_date && (
                  <p className="text-sm text-green-600">
                    {format(new Date(campaign.paid_date), 'd MMMM yyyy', { locale: he })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={handleMarkAsPaid}
              disabled={updating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              סמן כשולם
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dates */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-indigo-200/50 p-6 space-y-4 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-x-16 -translate-y-16" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">תאריכים</h3>
            </div>
            
            <div className="space-y-3">
              {campaign.contract_sign_date && (
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  <span className="text-slate-600 text-sm">חתימת חוזה</span>
                  <span className="font-semibold text-slate-800">{format(new Date(campaign.contract_sign_date), 'd/M/yyyy')}</span>
                </div>
              )}
              {campaign.planned_publish_date && (
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  <span className="text-slate-600 text-sm">פרסום מתוכנן</span>
                  <span className="font-semibold text-slate-800">{format(new Date(campaign.planned_publish_date), 'd/M/yyyy')}</span>
                </div>
              )}
              {campaign.actual_publish_date && (
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  <span className="text-slate-600 text-sm">פורסם בפועל</span>
                  <span className="font-semibold text-slate-800">{format(new Date(campaign.actual_publish_date), 'd/M/yyyy')}</span>
                </div>
              )}
              {campaign.planned_payment_date && (
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  <span className="text-slate-600 text-sm">תשלום מתוכנן</span>
                  <span className="font-semibold text-slate-800">{format(new Date(campaign.planned_payment_date), 'd/M/yyyy')}</span>
                </div>
              )}
              {campaign.payment_terms && (
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  <span className="text-slate-600 text-sm">תנאי תשלום</span>
                  <span className="font-semibold text-slate-800">{paymentTermsLabels[campaign.payment_terms] || campaign.payment_terms}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-200/50 p-6 space-y-4 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full translate-x-16 translate-y-16" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">מסמכים</h3>
            </div>
            
            <div className="space-y-3">
              {campaign.contract_url ? (
                <a
                  href={campaign.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-purple-600 transition-colors">חוזה</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                </a>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-xl text-slate-400 text-center">
                  לא הועלה חוזה
                </div>
              )}
              
              {campaign.brief_url ? (
                <a
                  href={campaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-purple-600 transition-colors">בריף</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                </a>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-xl text-slate-400 text-center">
                  לא הועלה בריף
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-6 space-y-6 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-800">מה לפרסם</h3>
        </div>
        
        {/* Platform Content Items */}
        {campaign.platform_content_items && campaign.platform_content_items.length > 0 && (
          <div className="space-y-3">
            {campaign.platform_content_items.map((item, idx) => {
              const completed = item.completed || 0;
              const total = item.quantity || 0;
              const isComplete = completed >= total;
              
              return (
                <div 
                  key={idx}
                  className={cn(
                    "group flex items-center gap-4 p-4 bg-gradient-to-l rounded-xl border-2 transition-all cursor-pointer",
                    isComplete 
                      ? "from-emerald-50 to-white border-emerald-300" 
                      : "from-slate-50 to-white border-slate-200 hover:border-indigo-300"
                  )}
                  onClick={() => handleToggleCompleted(idx)}
                >
                  <button
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                      isComplete 
                        ? "bg-emerald-500 border-emerald-500" 
                        : "border-slate-300 hover:border-indigo-500"
                    )}
                  >
                    {isComplete && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                  
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-md flex-shrink-0",
                    platformColors[item.platform] || platformColors.Other
                  )}>
                    {item.quantity}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn(
                        "font-semibold",
                        isComplete ? "text-slate-500 line-through" : "text-slate-700"
                      )}>
                        {item.platform}
                      </p>
                      <span className="text-xs font-semibold text-slate-600">
                        {completed} / {total}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500 ease-out",
                            isComplete 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                              : "bg-gradient-to-r from-indigo-500 to-purple-500"
                          )}
                          style={{ 
                            width: `${(completed / total) * 100}%`,
                            boxShadow: completed > 0 ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none'
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{contentTypeLabels[item.content_type]}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Published Link */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <Label className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-slate-400" />
            לינק לתוכן שפורסם
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="הדבק לינק..."
              defaultValue={campaign.published_link || ''}
              onBlur={(e) => {
                if (e.target.value !== campaign.published_link) {
                  handleUpdateLink(e.target.value);
                }
              }}
            />
            {campaign.published_link && (
              <a href={campaign.published_link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Video Idea */}
        {campaign.video_idea && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              רעיון לסרטון
            </Label>
            <div className="p-4 bg-amber-50 rounded-xl text-slate-700">
              {campaign.video_idea}
            </div>
          </div>
        )}

        {/* Notes */}
        {campaign.notes && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-slate-400" />
              הערות
            </Label>
            <div className="p-4 bg-slate-50 rounded-xl text-slate-700">
              {campaign.notes}
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <CampaignForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        campaign={campaign}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, user?.id] });
          queryClient.invalidateQueries({ queryKey: ['campaigns', user?.id] });
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קמפיין</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הקמפיין "{campaign.brand_name}"?
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}