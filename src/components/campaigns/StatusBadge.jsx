import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  waiting_signature: { label: "ממתין לחתימה", color: "bg-amber-100 text-amber-700 border-amber-200" },
  signed: { label: "חתום", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "בתהליך יצירה", color: "bg-purple-100 text-purple-700 border-purple-200" },
  published: { label: "פורסם", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  waiting_payment: { label: "ממתין לתשלום", color: "bg-orange-100 text-orange-700 border-orange-200" },
  paid: { label: "שולם", color: "bg-green-100 text-green-700 border-green-200" }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.waiting_signature;
  
  return (
    <Badge className={cn("border font-medium", config.color)}>
      {config.label}
    </Badge>
  );
}