import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Bell, X, Settings, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const notificationIcons = {
  payment_due: '💰',
  publish_due: '📅',
  status_change: '✨',
  overdue: '⚠️',
  milestone: '🎯'
};

const priorityColors = {
  low: 'text-slate-600 bg-slate-50',
  medium: 'text-orange-600 bg-orange-50',
  high: 'text-red-600 bg-red-50'
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notificationsRaw } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email
  });

  const notifications = Array.isArray(notificationsRaw) ? notificationsRaw : [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n =>
        supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.campaign_id) {
      setOpen(false);
      window.location.href = createPageUrl(`CampaignDetails?id=${notification.campaign_id}`);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_email=eq.${user.email}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 rounded-xl"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start" dir="rtl">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800">התראות</h3>
            <p className="text-xs text-slate-500">{unreadCount} לא נקראו</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <CheckCheck className="w-4 h-4 ml-1" />
                סמן הכל כנקרא
              </Button>
            )}
            <Link to={createPageUrl('NotificationSettings')}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative",
                    !notification.is_read && "bg-indigo-50/30"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                      priorityColors[notification.priority] || priorityColors.medium
                    )}>
                      {notificationIcons[notification.type] || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "font-semibold text-sm",
                          notification.is_read ? "text-slate-600" : "text-slate-900"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>
                      {notification.campaign_name && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                          {notification.campaign_name}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: he })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification.id);
                      }}
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">אין התראות</p>
              <p className="text-sm text-slate-400 mt-1">נודיע לך על עדכונים חשובים</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
