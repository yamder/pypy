import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import StatsCard from '../components/dashboard/StatsCard';
import CampaignCard from '../components/dashboard/CampaignCard';
import {
  Megaphone,
  Wallet,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';

function getDisplayName(user) {
  if (!user) return '';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (fullName && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split('@')[0];
  return '';
}

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const greeting = displayName ? `היי ${displayName} 😊` : 'היי 😊';

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
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate stats
  const thisMonthCampaigns = campaigns.filter((c) => {
    // Include campaigns with publish date this month
    if (c.planned_publish_date) {
      const publishDate = new Date(c.planned_publish_date);
      if (isWithinInterval(publishDate, { start: monthStart, end: monthEnd })) {
        return true;
      }
    }
    // Include campaigns created this month
    if (c.created_date) {
      const createdDate = new Date(c.created_date);
      if (isWithinInterval(createdDate, { start: monthStart, end: monthEnd })) {
        return true;
      }
    }
    return false;
  });

  const expectedIncome = thisMonthCampaigns.reduce((sum, c) => {
    const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
    return sum + netAmount;
  }, 0);

  const paidThisMonth = campaigns.filter((c) => {
    if (!c.is_paid || !c.paid_date) return false;
    const date = new Date(c.paid_date);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  }).reduce((sum, c) => {
    const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
    return sum + netAmount;
  }, 0);

  const waitingPayment = campaigns.filter((c) => !c.is_paid && c.payment_amount > 0);
  const upcomingPublish = campaigns
    .filter((c) => (c.status === 'in_progress' || c.status === 'signed') && c.planned_publish_date)
    .sort((a, b) => new Date(a.planned_publish_date).getTime() - new Date(b.planned_publish_date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>);

  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}>

      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        variants={itemVariants}>

        <div>
          <p className="text-sm text-slate-500 mb-1">{format(now, 'MMMM yyyy')}</p>
          <h1 className="text-4xl font-bold text-slate-900">{greeting}</h1>
        </div>
        <Link to={createPageUrl('Campaigns')}>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
            <Plus className="w-5 h-5 ml-2" />
            קמפיין חדש
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}>

        <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatsCard
            title="קמפיינים החודש"
            value={thisMonthCampaigns.length}
            icon={Megaphone}
            color="indigo" />

        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatsCard
            title="הכנסות צפויות"
            value={`₪${expectedIncome.toLocaleString()}`}
            icon={Wallet}
            color="green" />

        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatsCard
            title="שולם החודש"
            value={`₪${paidThisMonth.toLocaleString()}`}
            icon={CheckCircle2}
            color="pink" />

        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatsCard
            title="ממתינים לתשלום"
            value={waitingPayment.length}
            subtitle={`₪${waitingPayment.reduce((sum, c) => {
              const netAmount = c.payment_amount * (1 - (c.agent_commission_percentage || 0) / 100);
              return sum + netAmount;
            }, 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`}
            icon={Clock}
            color="orange" />

        </motion.div>
      </motion.div>

      {/* Content Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={itemVariants}>

        {/* Upcoming Campaigns */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-indigo-200/50 p-6 shadow-lg hover:shadow-xl transition-all"
          variants={itemVariants}>

          <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full -translate-x-20 -translate-y-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">קמפיינים קרובים</h2>
              </div>
              <Link to={createPageUrl('Campaigns')} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors font-medium">
                לכל הקמפיינים
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            {upcomingPublish.length > 0 ?
            <div className="space-y-3">
                {upcomingPublish.map((campaign, idx) =>
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}>

                    <CampaignCard campaign={campaign} compact />
                  </motion.div>
              )}
              </div> :

            <div className="text-center py-8 text-slate-400">
                <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">אין קמפיינים קרובים</p>
              </div>
            }
          </div>
        </motion.div>

        {/* Waiting Payment */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-200/50 p-6 shadow-lg hover:shadow-xl transition-all"
          variants={itemVariants}>

          <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full translate-x-20 translate-y-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">ממתינים לתשלום</h2>
              </div>
              <Link to={createPageUrl('Finance')} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors font-medium">
                לעמוד כספים
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            {waitingPayment.length > 0 ?
            <div className="space-y-3">
                {waitingPayment.slice(0, 5).map((campaign, idx) =>
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}>

                    <CampaignCard campaign={campaign} compact />
                  </motion.div>
              )}
              </div> :

            <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">כל התשלומים התקבלו!</p>
              </div>
            }
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Campaigns */}
      {campaigns.length > 0 &&
      <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-slate-900 mb-5">קמפיינים אחרונים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.slice(0, 6).map((campaign, idx) =>
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}>

                <CampaignCard campaign={campaign} />
              </motion.div>
          )}
          </div>
        </motion.div>
      }
    </motion.div>);

}