import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import CampaignCard from '../components/dashboard/CampaignCard';
import CampaignFilters from '../components/campaigns/CampaignFilters';
import CampaignForm from '../components/campaigns/CampaignForm';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Megaphone, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Campaigns() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    status: '',
    month: ''
  });

  const queryClient = useQueryClient();
  
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', platform: '', status: '', month: '' });
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filters.search && !c.brand_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.platform) {
      const hasPlatform = c.platform_content_items?.some(item => item.platform === filters.platform);
      if (!hasPlatform) return false;
    }
    if (filters.status && c.status !== filters.status) {
      return false;
    }
    if (filters.month) {
      if (!c.planned_publish_date) return false;
      const month = new Date(c.planned_publish_date).getMonth() + 1;
      if (month !== parseInt(filters.month)) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 translate-y-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">הקמפיינים שלי</h1>
            <p className="text-white/80 text-lg font-medium">{campaigns.length} קמפיינים פעילים</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-1 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-lg transition-all duration-200",
                  viewMode === 'grid' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-lg transition-all duration-200",
                  viewMode === 'list' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl hover:shadow-2xl font-bold h-11 px-6"
            >
              <Plus className="w-5 h-5 ml-2" />
              קמפיין חדש
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <CampaignFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Campaigns Grid/List */}
      {filteredCampaigns.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} compact />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-24 bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">אין קמפיינים עדיין</h3>
          <p className="text-slate-500 mb-8 text-lg">צור את הקמפיין הראשון שלך והתחל לעבוד</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl hover:shadow-2xl h-12 px-8 text-base font-bold"
          >
            <Plus className="w-5 h-5 ml-2" />
            קמפיין חדש
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <CampaignForm
        open={showForm}
        onOpenChange={setShowForm}
        campaign={null}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['campaigns', user?.id] })}
      />
    </div>
  );
}