import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notificationSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data: existing, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();
      if (error) throw error;
      if (existing) return existing;
      const { data: created, error: insertError } = await supabase
        .from('notification_settings')
        .insert({
          user_email: user.email,
          payment_reminder_days: 7,
          publish_reminder_days: 3,
          notify_status_changes: true,
          notify_payments_due: true,
          notify_publish_due: true,
          notify_overdue: true
        })
        .select()
        .single();
      if (insertError) throw insertError;
      return created;
    },
    enabled: !!user?.email
  });

  const [formData, setFormData] = useState(settings || {});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('notification_settings')
        .update(data)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('ההגדרות נשמרו בהצלחה');
    }
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link 
        to={createPageUrl('Dashboard')}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לדשבורד
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">הגדרות התראות</h1>
          <p className="text-slate-500">התאם אישית את ההתראות שלך</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>סוגי התראות</CardTitle>
            <CardDescription>בחר אילו התראות תרצה לקבל</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">תשלומים מתקרבים</Label>
                <p className="text-sm text-slate-500">התראה כאשר תאריך תשלום מתקרב</p>
              </div>
              <Switch
                checked={formData.notify_payments_due}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_payments_due: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">פרסום מתקרב</Label>
                <p className="text-sm text-slate-500">התראה כאשר תאריך פרסום מתקרב</p>
              </div>
              <Switch
                checked={formData.notify_publish_due}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_publish_due: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">שינויי סטטוס</Label>
                <p className="text-sm text-slate-500">התראה כאשר קמפיין משנה סטטוס</p>
              </div>
              <Switch
                checked={formData.notify_status_changes}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_status_changes: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">איחורים</Label>
                <p className="text-sm text-slate-500">התראה על תשלומים או משימות שעברו את המועד</p>
              </div>
              <Switch
                checked={formData.notify_overdue}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_overdue: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>זמני התראה</CardTitle>
            <CardDescription>קבע כמה ימים מראש לקבל התראות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>ימים לפני תאריך תשלום</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={formData.payment_reminder_days || 7}
                onChange={(e) => setFormData({ ...formData, payment_reminder_days: parseInt(e.target.value) })}
                className="max-w-[200px]"
              />
              <p className="text-sm text-slate-500">
                תקבל התראה {formData.payment_reminder_days || 7} ימים לפני תאריך תשלום
              </p>
            </div>

            <div className="space-y-2">
              <Label>ימים לפני תאריך פרסום</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={formData.publish_reminder_days || 3}
                onChange={(e) => setFormData({ ...formData, publish_reminder_days: parseInt(e.target.value) })}
                className="max-w-[200px]"
              />
              <p className="text-sm text-slate-500">
                תקבל התראה {formData.publish_reminder_days || 3} ימים לפני תאריך פרסום
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <CheckCircle2 className="w-4 h-4 ml-2" />
          )}
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}
