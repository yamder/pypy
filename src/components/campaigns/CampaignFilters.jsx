import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "Twitter", "Other"];
const statuses = [
  { value: "waiting_signature", label: "ממתין לחתימה" },
  { value: "signed", label: "חתום" },
  { value: "in_progress", label: "בתהליך יצירה" },
  { value: "published", label: "פורסם" },
  { value: "waiting_payment", label: "ממתין לתשלום" },
  { value: "paid", label: "שולם" }
];

const months = [
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

export default function CampaignFilters({ filters, onFilterChange, onClearFilters }) {
  const hasFilters = filters.search || filters.platform || filters.status || filters.month;
  const platformValue = filters.platform || 'all';
  const statusValue = filters.status || 'all';
  const monthValue = filters.month || 'all';

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-4 shadow-md">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש לפי מותג..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pr-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        </div>

        <Select value={platformValue} onValueChange={(value) => onFilterChange('platform', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[140px] border-slate-200">
            <SelectValue placeholder="פלטפורמה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {platforms.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusValue} onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[160px] border-slate-200">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthValue} onValueChange={(value) => onFilterChange('month', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[130px] border-slate-200">
            <SelectValue placeholder="חודש" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClearFilters}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}