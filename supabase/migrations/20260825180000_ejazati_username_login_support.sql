alter table public.ejazati_profiles
  add column if not exists username text;

alter table public.ejazati_profiles
  drop constraint if exists ejazati_profiles_username_format;

alter table public.ejazati_profiles
  add constraint ejazati_profiles_username_format
  check (
    username is null or (
      char_length(username) between 3 and 30
      and username ~ '^[a-z0-9._-]+$'
    )
  );

create unique index if not exists ejazati_profiles_username_lower_uidx
  on public.ejazati_profiles (lower(username))
  where username is not null;

create or replace function private.ejazati_normalize_profile_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is not null then
    new.username := lower(trim(new.username));
    if new.username = '' then new.username := null; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ejazati_normalize_profile_username
  on public.ejazati_profiles;

create trigger ejazati_normalize_profile_username
before insert or update of username on public.ejazati_profiles
for each row execute function private.ejazati_normalize_profile_username();

create or replace function public.ejazati_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_username is not null
    and char_length(lower(trim(p_username))) between 3 and 30
    and lower(trim(p_username)) ~ '^[a-z0-9._-]+$'
    and not exists (
      select 1
      from public.ejazati_profiles p
      where lower(p.username) = lower(trim(p_username))
    );
$$;

revoke all on function public.ejazati_username_available(text) from public;
grant execute on function public.ejazati_username_available(text)
  to anon, authenticated;

create or replace function private.handle_ejazati_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username :=
    lower(trim(coalesce(new.raw_user_meta_data->>'username','')));

  if requested_username = '' then
    requested_username := null;
  end if;

  insert into public.ejazati_profiles(
    id,email,display_name,username
  )
  values(
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email,''),'@',1)
    ),
    requested_username
  )
  on conflict(id) do nothing;

  insert into public.ejazati_leave_settings(user_id)
  values(new.id)
  on conflict(user_id) do nothing;

  insert into public.ejazati_user_version_state(
    user_id,current_version
  )
  values(new.id,'1.1.0')
  on conflict(user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_ejazati_new_user()
  from public;
