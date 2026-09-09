create or replace function public.apropos_sync_acp_outreach_to_agency_evaluations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_name text;
  v_advisor_name text;
  v_campaign_target_id uuid;
  v_existing_id uuid;
begin
  if upper(coalesce(new.delivery_status,'')) <> 'SENT' or new.sent_at is null then
    return new;
  end if;

  select o.organization_name
    into v_agency_name
  from public.organizations o
  where o.id = new.organization_id;

  if v_agency_name is null then
    return new;
  end if;

  if v_agency_name ilike 'APROPOS QA Sandbox%' then
    return new;
  end if;

  select coalesce(nullif(trim(c.full_name),''), new.recipient_email, 'Agency Contact')
    into v_advisor_name
  from public.contacts c
  where c.id = new.contact_id;

  if v_advisor_name is null then
    v_advisor_name := coalesce(new.recipient_email, 'Agency Contact');
  end if;

  select ct.id
    into v_campaign_target_id
  from public.campaign_targets ct
  where ct.organization_id = new.organization_id
    and (new.campaign_id is null or ct.campaign_id = new.campaign_id)
  order by ct.updated_at desc nulls last, ct.created_at desc nulls last
  limit 1;

  select a.id
    into v_existing_id
  from public.apropos_agency_evaluations a
  where a.organization_id = new.organization_id
  order by a.created_at asc
  limit 1;

  if v_existing_id is null then
    insert into public.apropos_agency_evaluations(
      organization_id,
      campaign_target_id,
      agency_name,
      advisor_name,
      promo_code,
      invited_at,
      evaluation_status,
      licensing_status,
      owner_notes
    ) values (
      new.organization_id,
      v_campaign_target_id,
      v_agency_name,
      v_advisor_name,
      'AGENCY30',
      new.sent_at,
      'INVITED',
      'NOT_STARTED',
      'Created automatically from ACP sent outreach.'
    );
  else
    update public.apropos_agency_evaluations
       set campaign_target_id = coalesce(campaign_target_id, v_campaign_target_id),
           agency_name = v_agency_name,
           advisor_name = case when evaluation_started_at is null then v_advisor_name else advisor_name end,
           invited_at = coalesce(invited_at, new.sent_at),
           evaluation_status = case
             when evaluation_started_at is null and upper(coalesce(evaluation_status,'')) in ('TARGET','READY_FOR_OUTREACH','NOT_ACTIVATED','INVITED') then 'INVITED'
             else evaluation_status
           end,
           updated_at = now()
     where id = v_existing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apropos_sync_acp_outreach_to_agency_evaluations on public.outreach_messages;
create trigger trg_apropos_sync_acp_outreach_to_agency_evaluations
after insert or update of delivery_status, sent_at on public.outreach_messages
for each row
execute function public.apropos_sync_acp_outreach_to_agency_evaluations();

insert into public.apropos_agency_evaluations(
  organization_id,
  campaign_target_id,
  agency_name,
  advisor_name,
  promo_code,
  invited_at,
  evaluation_status,
  licensing_status,
  owner_notes
)
select distinct on (om.organization_id)
  om.organization_id,
  ct.id,
  o.organization_name,
  coalesce(nullif(trim(c.full_name),''), om.recipient_email, 'Agency Contact'),
  'AGENCY30',
  om.sent_at,
  'INVITED',
  'NOT_STARTED',
  'Backfilled automatically from ACP sent outreach.'
from public.outreach_messages om
join public.organizations o on o.id = om.organization_id
left join public.contacts c on c.id = om.contact_id
left join lateral (
  select x.id
  from public.campaign_targets x
  where x.organization_id = om.organization_id
    and (om.campaign_id is null or x.campaign_id = om.campaign_id)
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) ct on true
where upper(coalesce(om.delivery_status,'')) = 'SENT'
  and om.sent_at is not null
  and o.organization_name not ilike 'APROPOS QA Sandbox%'
  and not exists (
    select 1 from public.apropos_agency_evaluations a where a.organization_id = om.organization_id
  )
order by om.organization_id, om.sent_at asc;

update public.apropos_systems
set system_name = 'BUSINESS DEVELOPMENT MANAGEMENT SYSTEM',
    updated_at = now()
where system_key = 'acb';
