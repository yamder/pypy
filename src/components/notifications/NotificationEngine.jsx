import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { differenceInDays, isPast, parseISO } from 'date-fns';

export default function NotificationEngine() {
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['notificationSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list()
  });

  const { data: existingNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (!user?.email || !settings || campaigns.length === 0) return;

    const checkAndCreateNotifications = async () => {
      const today = new Date();
      const notificationsToCreate = [];

      for (const campaign of campaigns) {
        const alreadyNotified = existingNotifications.some(n =>
          n.campaign_id === campaign.id &&
          n.message.includes(campaign.status) &&
          differenceInDays(today, new Date(n.created_date)) < 7
        );

        if (alreadyNotified) continue;

        if (settings.notify_payments_due && campaign.planned_payment_date && !campaign.is_paid) {
          const paymentDate = parseISO(campaign.planned_payment_date);
          const daysUntil = differenceInDays(paymentDate, today);

          if (daysUntil <= settings.payment_reminder_days && daysUntil >= 0) {
            notificationsToCreate.push({
              user_email: user.email,
              type: 'payment_due',
              title: 'תשלום מתקרב',
              message: `תשלום עבור ${campaign.brand_name} צפוי בעוד ${daysUntil} ימים`,
              campaign_id: campaign.id,
              campaign_name: campaign.brand_name,
              priority: daysUntil <= 2 ? 'high' : 'medium'
            });
          }
        }

        if (settings.notify_publish_due && campaign.planned_publish_date && campaign.status !== 'published') {
          const publishDate = parseISO(campaign.planned_publish_date);
          const daysUntil = differenceInDays(publishDate, today);

          if (daysUntil <= settings.publish_reminder_days && daysUntil >= 0) {
            notificationsToCreate.push({
              user_email: user.email,
              type: 'publish_due',
              title: 'פרסום מתקרב',
              message: `${campaign.brand_name} צפוי להתפרסם בעוד ${daysUntil} ימים`,
              campaign_id: campaign.id,
              campaign_name: campaign.brand_name,
              priority: daysUntil <= 1 ? 'high' : 'medium'
            });
          }
        }

        if (settings.notify_overdue) {
          if (campaign.planned_payment_date && !campaign.is_paid) {
            const paymentDate = parseISO(campaign.planned_payment_date);
            if (isPast(paymentDate) && differenceInDays(today, paymentDate) > 0) {
              notificationsToCreate.push({
                user_email: user.email,
                type: 'overdue',
                title: 'תשלום באיחור',
                message: `התשלום עבור ${campaign.brand_name} עבר את המועד`,
                campaign_id: campaign.id,
                campaign_name: campaign.brand_name,
                priority: 'high'
              });
            }
          }

          if (campaign.planned_publish_date && campaign.status !== 'published') {
            const publishDate = parseISO(campaign.planned_publish_date);
            if (isPast(publishDate) && differenceInDays(today, publishDate) > 0) {
              notificationsToCreate.push({
                user_email: user.email,
                type: 'overdue',
                title: 'פרסום באיחור',
                message: `הפרסום של ${campaign.brand_name} עבר את המועד המתוכנן`,
                campaign_id: campaign.id,
                campaign_name: campaign.brand_name,
                priority: 'high'
              });
            }
          }
        }

        if (campaign.platform_content_items) {
          const totalItems = campaign.platform_content_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          const completedItems = campaign.platform_content_items.reduce((sum, item) => sum + (item.completed || 0), 0);

          if (totalItems > 0 && completedItems === totalItems) {
            const alreadyMilestone = existingNotifications.some(n =>
              n.campaign_id === campaign.id &&
              n.type === 'milestone' &&
              n.message.includes('הושלם')
            );

            if (!alreadyMilestone) {
              notificationsToCreate.push({
                user_email: user.email,
                type: 'milestone',
                title: 'קמפיין הושלם! 🎉',
                message: `כל התכנים של ${campaign.brand_name} הושלמו בהצלחה`,
                campaign_id: campaign.id,
                campaign_name: campaign.brand_name,
                priority: 'low'
              });
            }
          }
        }
      }

      if (notificationsToCreate.length > 0) {
        for (const notification of notificationsToCreate) {
          await supabase.from('notifications').insert(notification);
        }
      }
    };

    checkAndCreateNotifications();

    const interval = setInterval(checkAndCreateNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.email, settings, campaigns, existingNotifications]);

  return null;
}
