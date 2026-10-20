-- Restoration runs in a single Postgres transaction under the caller's RLS.
-- Do not accept owner IDs, roles, or row IDs from uploaded backup files.
create or replace function public.ejazati_restore_backup(p_backup jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  s jsonb := p_backup->'settings';
  y integer := extract(year from timezone('Asia/Dubai', now()))::integer;
  wk smallint[];
begin
  if caller is null or not private.ejazati_is_active() then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if octet_length(p_backup::text)>5242880
    or p_backup->>'format' is distinct from 'ejazati-backup-v1'
    or jsonb_typeof(s) is distinct from 'object'
    or jsonb_typeof(p_backup->'leaves') is distinct from 'array'
    or jsonb_typeof(p_backup->'holidays') is distinct from 'array'
    or jsonb_typeof(s->'weekend_days') is distinct from 'array' then
    raise exception 'Invalid backup';
  end if;
  if jsonb_array_length(p_backup->'leaves')>5000 or jsonb_array_length(p_backup->'holidays')>5000 then
    raise exception 'Backup too large';
  end if;
  select coalesce(array_agg(value::smallint),array[]::smallint[]) into wk
  from jsonb_array_elements_text(s->'weekend_days');
  if exists(select 1 from unnest(wk) d where d<0 or d>6)
    or cardinality(wk)<>(select count(distinct d) from unnest(wk) d) then
    raise exception 'Invalid weekend';
  end if;
  -- Serialise restores with current account settings writes.
  perform 1 from public.ejazati_leave_settings where user_id=caller for update;
  if not found then raise exception 'Account settings unavailable'; end if;
  update public.ejazati_leave_settings set
    base_balance=(s->>'base_balance')::integer,
    carried_balance=(s->>'carried_balance')::integer,
    carry_expiry=nullif(s->>'carry_expiry','')::date,
    weekend_days=wk,
    balance_year=coalesce((s->>'balance_year')::integer,y),
    year_opening_balance=coalesce((s->>'year_opening_balance')::integer,
      (s->>'base_balance')::integer+case when nullif(s->>'carry_expiry','') is null
        or (s->>'carry_expiry')::date>=make_date(y,1,1) then (s->>'carried_balance')::integer else 0 end),
    balance_adjustment=coalesce((s->>'balance_adjustment')::integer,0),
    updated_at=now()
  where user_id=caller;
  delete from public.ejazati_leaves where user_id=caller;
  insert into public.ejazati_leaves(user_id,leave_type,title,start_date,end_date,deduct_from_balance)
    select caller,l.leave_type,l.title,l.start_date,l.end_date,l.deduct_from_balance
    from jsonb_to_recordset(p_backup->'leaves') as l(leave_type text,title text,start_date date,end_date date,deduct_from_balance boolean);
  delete from public.ejazati_holidays where user_id=caller;
  insert into public.ejazati_holidays(user_id,holiday_date,name)
    select caller,h.holiday_date,h.name
    from jsonb_to_recordset(p_backup->'holidays') as h(holiday_date date,name text)
    on conflict(user_id,holiday_date,name) do nothing;
  -- Older backup files did not contain overrides. Preserve those in that case.
  if p_backup ? 'holiday_overrides' then
    if jsonb_typeof(p_backup->'holiday_overrides') is distinct from 'array'
      or jsonb_array_length(p_backup->'holiday_overrides')>5000 then raise exception 'Invalid holiday overrides'; end if;
    delete from public.ejazati_holiday_overrides where user_id=caller;
    insert into public.ejazati_holiday_overrides(user_id,official_holiday_id,override_name,override_date,is_disabled)
      select caller,h.official_holiday_id,h.override_name,h.override_date,coalesce(h.is_disabled,false)
      from jsonb_to_recordset(p_backup->'holiday_overrides')
        as h(official_holiday_id uuid,override_name text,override_date date,is_disabled boolean);
  end if;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.ejazati_restore_backup(jsonb) from public,anon;
grant execute on function public.ejazati_restore_backup(jsonb) to authenticated;

-- A disabled account must not bypass RLS through these legacy definer RPCs.
create or replace function public.ejazati_ensure_current_year()
returns table(balance_year integer,year_opening_balance integer,balance_adjustment integer)
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();v_year integer := extract(year from timezone('Asia/Dubai',now()))::integer;
begin
  if v_uid is null or not private.ejazati_is_active() then raise exception 'Authentication required' using errcode='42501'; end if;
  perform private.ejazati_rollover_user(v_uid,v_year);
  return query select s.balance_year,s.year_opening_balance,s.balance_adjustment from public.ejazati_leave_settings s where s.user_id=v_uid;
end;
$$;
create or replace function public.ejazati_set_balance_adjustment(p_adjustment integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.ejazati_is_active() then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.ejazati_leave_settings set balance_adjustment=p_adjustment,updated_at=now() where user_id=v_uid;
end;
$$;
revoke all on function public.ejazati_ensure_current_year() from public,anon;
revoke all on function public.ejazati_set_balance_adjustment(integer) from public,anon;
grant execute on function public.ejazati_ensure_current_year() to authenticated;
grant execute on function public.ejazati_set_balance_adjustment(integer) to authenticated;

create or replace function public.ejazati_claim_owner()
returns boolean language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('ejazati:claim-owner'));
  if exists(select 1 from public.ejazati_profiles where role='owner') then return false; end if;
  update public.ejazati_profiles set role='owner',updated_at=now() where id=caller and status='active';
  return found;
end;
$$;
revoke all on function public.ejazati_claim_owner() from public,anon;
grant execute on function public.ejazati_claim_owner() to authenticated;
