-- Creator Campaign Pro – Supabase schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

-- =============================================================================
-- Campaigns
-- =============================================================================
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  brand_name text not null default '',
  status text not null default 'waiting_signature' check (status in (
    'waiting_signature', 'signed', 'in_progress', 'published', 'waiting_payment', 'paid'
  )),
  platform_content_items jsonb default '[]'::jsonb,
  payment_amount numeric default 0,
  currency text default 'ILS',
  agent_commission_percentage numeric default 0,
  payment_terms text check (payment_terms is null or payment_terms in (
    'immediate', 'net_30', 'net_45', 'net_60', 'net_90'
  )),
  planned_publish_date date,
  planned_payment_date date,
  contract_sign_date date,
  is_paid boolean default false,
  paid_date date,
  published_link text,
  video_idea text,
  notes text,
  contract_url text,
  brief_url text
);

-- =============================================================================
-- Notifications
-- =============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  user_email text not null,
  type text not null check (type in (
    'payment_due', 'publish_due', 'status_change', 'overdue', 'milestone'
  )),
  title text not null,
  message text not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  campaign_name text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  is_read boolean default false
);

create index if not exists idx_notifications_user_email on public.notifications(user_email);
create index if not exists idx_notifications_created_date on public.notifications(created_date desc);

-- =============================================================================
-- Notification settings (one row per user)
-- =============================================================================
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  payment_reminder_days int not null default 7,
  publish_reminder_days int not null default 3,
  notify_status_changes boolean default true,
  notify_payments_due boolean default true,
  notify_publish_due boolean default true,
  notify_overdue boolean default true
);

-- =============================================================================
-- Row Level Security (RLS)
-- Enable RLS; policies below allow all for now so the app works with anon key.
-- Tighten later (e.g. by user_email or auth.uid()) when you add Supabase Auth.
-- =============================================================================
alter table public.campaigns enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;

-- Policies: allow read/write for anon and authenticated (adjust when you add auth)
create policy "Allow all on campaigns" on public.campaigns for all using (true) with check (true);
create policy "Allow all on notifications" on public.notifications for all using (true) with check (true);
create policy "Allow all on notification_settings" on public.notification_settings for all using (true) with check (true);
