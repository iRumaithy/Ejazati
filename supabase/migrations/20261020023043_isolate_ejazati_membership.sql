-- Auth is shared by several apps. A profile created by the old global signup
-- trigger does not prove that the account ever used Ejazati.
create table private.ejazati_memberships (
  user_id uuid primary key references public.ejazati_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  source text not null check (source in ('existing_usage','app_entry'))
);
alter table private.ejazati_memberships enable row level security;
revoke all on private.ejazati_memberships from public,anon,authenticated;

-- Preserve evidenced Ejazati users without deleting any auto-created stubs or
-- changing shared Auth identities / another app's data. Dormant accounts join
-- when they actually enter Ejazati, not merely when they register elsewhere.
insert into private.ejazati_memberships(user_id,joined_at,source)
select p.id,p.created_at,'existing_usage' from public.ejazati_profiles p
where p.role='owner'
 or exists(select 1 from public.ejazati_leaves l where l.user_id=p.id)
 or exists(select 1 from public.ejazati_holidays h where h.user_id=p.id)
 or exists(select 1 from public.ejazati_holiday_overrides h where h.user_id=p.id)
 or exists(select 1 from public.ejazati_backup_history b where b.user_id=p.id)
 or exists(select 1 from public.ejazati_push_subscriptions s where s.user_id=p.id)
 or exists(select 1 from public.ejazati_leave_settings s where s.user_id=p.id
   and (s.base_balance<>30 or s.carried_balance<>0 or s.carry_expiry is not null
     or s.weekend_days<>array[6,0]::smallint[] or s.balance_adjustment<>0));

create or replace function private.ejazati_is_member(p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from private.ejazati_memberships m where m.user_id=p_user_id)$$;
revoke all on function private.ejazati_is_member(uuid) from public,anon;
grant execute on function private.ejazati_is_member(uuid) to authenticated;

create or replace function private.ejazati_is_active()
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from public.ejazati_profiles p join private.ejazati_memberships m on m.user_id=p.id where p.id=(select auth.uid()) and p.status='active')$$;
create or replace function private.ejazati_is_owner()
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from public.ejazati_profiles p join private.ejazati_memberships m on m.user_id=p.id where p.id=(select auth.uid()) and p.role='owner' and p.status='active')$$;
create or replace function private.ejazati_current_role()
returns text language sql stable security definer set search_path=''
as $$select p.role from public.ejazati_profiles p join private.ejazati_memberships m on m.user_id=p.id where p.id=(select auth.uid())$$;
create or replace function private.ejazati_current_status()
returns text language sql stable security definer set search_path=''
as $$select p.status from public.ejazati_profiles p join private.ejazati_memberships m on m.user_id=p.id where p.id=(select auth.uid())$$;

-- Internal provisioning only. Metadata supplies display fields, never membership,
-- roles or status. Membership can only be recorded by the authenticated join RPC.
create or replace function private.ejazati_provision_profile(p_user_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare u auth.users%rowtype;requested_username text;
begin
 select * into strict u from auth.users where id=p_user_id;
 requested_username:=lower(trim(coalesce(u.raw_user_meta_data->>'username','')));
 if requested_username !~ '^[a-z0-9._-]{3,30}$'
   or exists(select 1 from public.ejazati_profiles p where lower(p.username)=requested_username and p.id<>p_user_id)
 then requested_username:=null;end if;
 insert into public.ejazati_profiles(id,email,display_name,username)
 values(u.id,u.email,left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),split_part(coalesce(u.email,''),'@',1)),80),requested_username)
 on conflict(id) do nothing;
 insert into public.ejazati_leave_settings(user_id) values(u.id) on conflict(user_id) do nothing;
 insert into public.ejazati_user_version_state(user_id,current_version) values(u.id,'1.2.13') on conflict(user_id) do nothing;
end;$$;
revoke all on function private.ejazati_provision_profile(uuid) from public,anon,authenticated;

create or replace function private.handle_ejazati_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$begin
 -- A signup explicitly originating in Ejazati may reserve its username before
 -- email confirmation. It still cannot access Ejazati until authenticated entry.
 if new.raw_user_meta_data->>'app'='ejazati' then
   perform private.ejazati_provision_profile(new.id);
 end if;
 return new;
end;$$;
revoke all on function private.handle_ejazati_new_user() from public,anon,authenticated;

create or replace function public.ejazati_join_app()
returns boolean language plpgsql security definer set search_path=''
as $$
declare caller uuid:=(select auth.uid());
begin
 if caller is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('ejazati:join:'||caller::text));
 -- A disabled account cannot re-enable itself by joining again.
 if exists(select 1 from public.ejazati_profiles p where p.id=caller and p.status='disabled') then
   raise exception 'Ejazati account disabled' using errcode='42501';
 end if;
 perform private.ejazati_provision_profile(caller);
 insert into private.ejazati_memberships(user_id,source) values(caller,'app_entry') on conflict(user_id) do nothing;
 return true;
end;$$;
revoke all on function public.ejazati_join_app() from public,anon;
grant execute on function public.ejazati_join_app() to authenticated;

drop policy ejazati_profiles_select on public.ejazati_profiles;
create policy ejazati_profiles_select on public.ejazati_profiles for select to authenticated
using(private.ejazati_is_member(id) and ((select auth.uid())=id or (select private.ejazati_is_owner())));
drop policy ejazati_profiles_update on public.ejazati_profiles;
create policy ejazati_profiles_update on public.ejazati_profiles for update to authenticated
using(private.ejazati_is_member(id) and ((select private.ejazati_is_owner()) or ((select auth.uid())=id and status='active')))
with check(private.ejazati_is_member(id) and ((select private.ejazati_is_owner()) or ((select auth.uid())=id and role=(select private.ejazati_current_role()) and status=(select private.ejazati_current_status()))));

create or replace function public.ejazati_claim_owner()
returns boolean language plpgsql security definer set search_path=''
as $$
declare caller uuid:=(select auth.uid());
begin
 if caller is null then raise exception 'Authentication required' using errcode='42501';end if;
 if not private.ejazati_is_active() then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('ejazati:claim-owner'));
 if exists(select 1 from public.ejazati_profiles where role='owner') then return false;end if;
 update public.ejazati_profiles set role='owner',updated_at=now() where id=caller and status='active';
 return found;
end;$$;
revoke all on function public.ejazati_claim_owner() from public,anon;
grant execute on function public.ejazati_claim_owner() to authenticated;

-- Scheduled rollover must also operate on real app members only.
create or replace function private.ejazati_rollover_all(p_year integer)
returns integer language plpgsql security definer set search_path=''
as $$declare r record;v_count integer:=0;begin
 for r in select s.user_id from public.ejazati_leave_settings s join private.ejazati_memberships m on m.user_id=s.user_id loop
  perform private.ejazati_rollover_user(r.user_id,p_year);v_count:=v_count+1;
 end loop;
 return v_count;
end;$$;
