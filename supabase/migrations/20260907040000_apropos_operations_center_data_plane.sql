begin;

create extension if not exists pgcrypto;

create table if not exists public.apropos_systems (
  id uuid primary key default gen_random_uuid(),
  system_key text not null unique,
  system_name text not null,
  production_url text,
  repository_full_name text,
  command_center_url text,
  hosting_provider text,
  database_project_ref text,
  environment text not null default 'production',
  status text not null default 'ACTIVE',
  openai_dependent boolean not null default false,
  owner_notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apropos_vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_key text not null unique,
  vendor_name text not null,
  service_category text not null,
  billing_cadence text,
  fixed_monthly_cost numeric(12,2),
  variable_cost boolean not null default false,
  autopay boolean not null default true,
  billing_day integer check (billing_day between 1 and 31),
  renewal_date date,
  account_status text not null default 'ACTIVE',
  tax_category text,
  verification_status text not null default 'TO_VERIFY',
  last_verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apropos_vendor_expenses (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.apropos_vendors(id) on delete restrict,
  expense_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  service_period_start date,
  service_period_end date,
  invoice_number text,
  receipt_status text not null default 'MISSING',
  receipt_source text,
  receipt_reference text,
  payment_status text not null default 'PAID',
  tax_category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists apropos_vendor_expenses_dedupe_idx
  on public.apropos_vendor_expenses(vendor_id, expense_date, amount, coalesce(invoice_number, ''));

create table if not exists public.apropos_openai_usage (
  id bigint generated always as identity primary key,
  usage_date date not null,
  system_key text,
  operation text,
  model text,
  request_count integer not null default 0 check (request_count >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  total_tokens bigint generated always as (input_tokens + output_tokens) stored,
  estimated_cost numeric(14,6) not null default 0 check (estimated_cost >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  source text not null default 'OPERATIONS_LEDGER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists apropos_openai_usage_date_idx on public.apropos_openai_usage(usage_date desc);
create index if not exists apropos_openai_usage_system_idx on public.apropos_openai_usage(system_key, usage_date desc);

create table if not exists public.apropos_agency_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  campaign_target_id uuid references public.campaign_targets(id) on delete set null,
  agency_name text not null,
  advisor_name text not null,
  promo_code text not null default 'AGENCY30',
  invited_at timestamptz,
  first_login_at timestamptz,
  evaluation_started_at timestamptz,
  evaluation_ends_at timestamptz,
  last_activity_at timestamptz,
  evaluation_status text not null default 'INVITED',
  licensing_status text not null default 'NOT_STARTED',
  expiration_notice_sent_at timestamptz,
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (promo_code = 'AGENCY30'),
  check (evaluation_ends_at is null or evaluation_started_at is null or evaluation_ends_at >= evaluation_started_at)
);
create index if not exists apropos_agency_evaluations_agency_idx on public.apropos_agency_evaluations(lower(agency_name));
create index if not exists apropos_agency_evaluations_status_idx on public.apropos_agency_evaluations(evaluation_status, evaluation_ends_at);

create table if not exists public.apropos_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text unique,
  system_key text,
  severity text not null default 'MEDIUM',
  category text,
  status text not null default 'OPEN',
  summary text not null,
  root_cause text,
  remediation text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists apropos_incidents_status_idx on public.apropos_incidents(status, severity, detected_at desc);

create table if not exists public.apropos_owner_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_date date not null default current_date,
  system_key text,
  decision text not null,
  rationale text,
  implementation_impact text,
  status text not null default 'ACTIVE',
  related_repository text,
  related_pr text,
  related_deploy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.apropos_systems enable row level security;
alter table public.apropos_vendors enable row level security;
alter table public.apropos_vendor_expenses enable row level security;
alter table public.apropos_openai_usage enable row level security;
alter table public.apropos_agency_evaluations enable row level security;
alter table public.apropos_incidents enable row level security;
alter table public.apropos_owner_decisions enable row level security;

insert into public.apropos_systems(system_key, system_name, production_url, repository_full_name, command_center_url, hosting_provider, database_project_ref, openai_dependent)
values
  ('apropos-group','Apropos Group','https://aproposgroupllc.com','Aproposchpt2/Apropos-Group-LLC','https://aproposgroupllc.com/operations-center','Netlify','judislfknmhofcgzyozc',false),
  ('acb','Government Contract Portal / ACB','https://acb.aproposgroupllc.com','Aproposchpt2/APROPOS-CONTRACT-BRIEF','https://acb.aproposgroupllc.com/command-center.html','Netlify',null,true),
  ('natcorp','NAT-CORP','https://natcorp.aproposgroupllc.com','Aproposchpt2/NAT-CORP-CONTRACT-EXCHANGE','https://natcorp.aproposgroupllc.com/command-center.html','Netlify','judislfknmhofcgzyozc',true),
  ('acp','Apropos Community Partnership','https://acp.aproposgroupllc.com','Aproposchpt2/Aproposchpt2-APROPOS-COMMUNITY-PARTNERSHIP-OUTREACH',null,'Netlify','judislfknmhofcgzyozc',true)
on conflict (system_key) do update set
  system_name = excluded.system_name,
  production_url = excluded.production_url,
  repository_full_name = excluded.repository_full_name,
  command_center_url = excluded.command_center_url,
  hosting_provider = excluded.hosting_provider,
  database_project_ref = excluded.database_project_ref,
  openai_dependent = excluded.openai_dependent,
  updated_at = now();

insert into public.apropos_vendors(vendor_key, vendor_name, service_category, billing_cadence, fixed_monthly_cost, variable_cost, autopay, verification_status)
values
  ('supabase','Supabase','Database','MONTHLY',20.00,false,true,'TO_VERIFY'),
  ('netlify','Netlify','Hosting','MONTHLY',20.00,false,true,'TO_VERIFY'),
  ('chatgpt','ChatGPT','AI / Productivity','MONTHLY',20.00,false,true,'TO_VERIFY'),
  ('claude','Claude','AI / Productivity','MONTHLY',20.00,false,true,'TO_VERIFY'),
  ('resend','Resend','Email','MONTHLY',20.00,false,true,'TO_VERIFY'),
  ('elevenlabs','ElevenLabs','Voice / AI','MONTHLY',20.00,false,true,'TO_VERIFY')
on conflict (vendor_key) do update set
  vendor_name = excluded.vendor_name,
  service_category = excluded.service_category,
  billing_cadence = excluded.billing_cadence,
  fixed_monthly_cost = excluded.fixed_monthly_cost,
  variable_cost = excluded.variable_cost,
  autopay = excluded.autopay,
  verification_status = excluded.verification_status,
  updated_at = now();

commit;
