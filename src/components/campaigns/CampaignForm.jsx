import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X, FileText, Sparkles, Wallet, Calendar, FileStack, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "Twitter", "Other"];
const contentTypes = [
  { value: "video", label: "וידאו" },
  { value: "story", label: "סטורי" },
  { value: "post", label: "פוסט" },
  { value: "reel", label: "ריל" },
  { value: "short", label: "שורט" }
];
const currencies = ["ILS", "USD", "EUR"];
const paymentTerms = [
  { value: "immediate", label: "מיידי" },
  { value: "net_30", label: "שוטף +30" },
  { value: "net_45", label: "שוטף +45" },
  { value: "net_60", label: "שוטף +60" },
  { value: "net_90", label: "שוטף +90" }
];

export default function CampaignForm({ open, onOpenChange, campaign, onSave }) {
  const [formData, setFormData] = useState(campaign || {
    brand_name: '',
    platform_content_items: [
      { platform: 'Instagram', content_type: 'reel', quantity: 1 }
    ],
    status: 'waiting_signature',
    payment_amount: '',
    currency: 'ILS',
    agent_commission_percentage: 35,
    payment_terms: 'net_30',
    planned_publish_date: '',
    planned_payment_date: '',
    contract_sign_date: '',
    video_idea: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingBrief, setUploadingBrief] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate payment date based on terms and publish date
      if (field === 'payment_terms' || field === 'planned_publish_date') {
        const publishDate = field === 'planned_publish_date' ? value : updated.planned_publish_date;
        const terms = field === 'payment_terms' ? value : updated.payment_terms;
        
        if (publishDate && terms) {
          const daysMap = { immediate: 0, net_30: 30, net_45: 45, net_60: 60, net_90: 90 };
          const days = daysMap[terms] || 30;
          const paymentDate = addDays(new Date(publishDate), days);
          updated.planned_payment_date = paymentDate.toISOString().split('T')[0];
        }
      }
      
      return updated;
    });
  };

  const addPlatformContentItem = () => {
    setFormData(prev => ({
      ...prev,
      platform_content_items: [
        ...(prev.platform_content_items || []),
        { platform: 'Instagram', content_type: 'reel', quantity: 1 }
      ]
    }));
  };

  const removePlatformContentItem = (index) => {
    setFormData(prev => ({
      ...prev,
      platform_content_items: (Array.isArray(prev.platform_content_items) ? prev.platform_content_items : []).filter((_, i) => i !== index)
    }));
  };

  const updatePlatformContentItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      platform_content_items: (Array.isArray(prev.platform_content_items) ? prev.platform_content_items : []).map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleFileUpload = async (file, type) => {
    if (type === 'contract') setUploadingContract(true);
    else setUploadingBrief(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange(type === 'contract' ? 'contract_url' : 'brief_url', file_url);

    if (type === 'contract') setUploadingContract(false);
    else setUploadingBrief(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const dataToSave = {
      ...formData,
      payment_amount: parseFloat(formData.payment_amount) || 0,
      agent_commission_percentage: parseFloat(formData.agent_commission_percentage) || 0
    };

    if (campaign?.id) {
      await base44.entities.Campaign.update(campaign.id, dataToSave);
    } else {
      await base44.entities.Campaign.create(dataToSave);
    }
    
    setSaving(false);
    onSave();
    onOpenChange(false);
  };

  const netIncome = formData.payment_amount 
    ? (parseFloat(formData.payment_amount) * (1 - (parseFloat(formData.agent_commission_percentage) || 0) / 100))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white" dir="rtl">
        <DialogHeader className="pb-6 border-b-2 border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {campaign?.id ? 'עריכת קמפיין' : 'קמפיין חדש'}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">מלא את הפרטים ליצירת קמפיין מוצלח</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-7 mt-8">
          {/* Basic Info */}
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-800">פרטים בסיסיים</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">שם המותג *</Label>
                <Input
                  value={formData.brand_name}
                  onChange={(e) => handleChange('brand_name', e.target.value)}
                  placeholder="למשל: Nike"
                  required
                  className="h-12 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-semibold text-sm">פלטפורמות וסוגי תוכן *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPlatformContentItem}
                    className="h-9 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף תוכן
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(formData.platform_content_items || []).map((item, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select 
                          value={item.platform} 
                          onValueChange={(v) => updatePlatformContentItem(index, 'platform', v)}
                        >
                          <SelectTrigger className="bg-white h-11">
                            <SelectValue placeholder="פלטפורמה" />
                          </SelectTrigger>
                          <SelectContent>
                            {platforms.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select 
                          value={item.content_type} 
                          onValueChange={(v) => updatePlatformContentItem(index, 'content_type', v)}
                        >
                          <SelectTrigger className="bg-white h-11">
                            <SelectValue placeholder="סוג תוכן" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePlatformContentItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="כמות"
                          className="bg-white h-11"
                        />
                      </div>
                      
                      {formData.platform_content_items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlatformContentItem(index)}
                          className="h-11 w-11 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">תאריך חתימת חוזה</Label>
                <Input
                  type="date"
                  value={formData.contract_sign_date}
                  onChange={(e) => handleChange('contract_sign_date', e.target.value)}
                  className="h-12 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-800">פרטי תשלום</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">סכום מלא *</Label>
                <Input
                  type="number"
                  value={formData.payment_amount}
                  onChange={(e) => handleChange('payment_amount', e.target.value)}
                  placeholder="0"
                  required
                  className="h-12 border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">עמלת סוכן (%)</Label>
                <Input
                  type="number"
                  value={formData.agent_commission_percentage}
                  onChange={(e) => handleChange('agent_commission_percentage', e.target.value)}
                  placeholder="35"
                  min="0"
                  max="100"
                  className="h-12 border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">מטבע</Label>
                <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">תנאי תשלום</Label>
                <Select value={formData.payment_terms} onValueChange={(v) => handleChange('payment_terms', v)}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTerms.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.payment_amount && (
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-emerald-400 to-teal-400 opacity-10"></div>
                <div className="relative flex items-center justify-between p-5 bg-gradient-to-l from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-sm">
                  <span className="text-base font-bold text-emerald-800">💰 הכנסה נטו (אחרי עמלה)</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₪{netIncome.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-800">תאריכים</h3>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold text-sm">תאריך פרסום מתוכנן</Label>
              <Input
                type="date"
                value={formData.planned_publish_date}
                onChange={(e) => handleChange('planned_publish_date', e.target.value)}
                className="h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl"
              />
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                <FileStack className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-800">מסמכים</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">חוזה</Label>
                {formData.contract_url ? (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span className="flex-1 text-sm truncate">חוזה הועלה</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleChange('contract_url', '')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                    {uploadingContract ? (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">העלאת חוזה</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'contract')}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">בריף</Label>
                {formData.brief_url ? (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <span className="flex-1 text-sm truncate">בריף הועלה</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleChange('brief_url', '')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-purple-300 transition-colors">
                    {uploadingBrief ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">העלאת בריף</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'brief')}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-800">תוכן ורעיונות</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">רעיון לסרטון</Label>
                <Textarea
                  value={formData.video_idea}
                  onChange={(e) => handleChange('video_idea', e.target.value)}
                  placeholder="תאר את הרעיון לתוכן..."
                  rows={3}
                  className="border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">הערות אישיות</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="הערות נוספות..."
                  rows={2}
                  className="border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-8 border-t-2 border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14 text-base font-semibold border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-xl transition-all"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.brand_name || !formData.payment_amount || !formData.platform_content_items?.length}
              className="flex-1 h-14 text-base font-bold bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl rounded-xl transition-all"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
              {campaign?.id ? '✨ עדכון קמפיין' : '✨ יצירת קמפיין'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}