create index if not exists ejazati_app_versions_created_by_idx on public.ejazati_app_versions(created_by);
create index if not exists ejazati_backup_history_user_id_idx on public.ejazati_backup_history(user_id);

drop policy if exists ejazati_profiles_update_self on public.ejazati_profiles;
drop policy if exists ejazati_profiles_owner_update on public.ejazati_profiles;
drop policy if exists ejazati_profiles_update on public.ejazati_profiles;

create policy ejazati_profiles_update on public.ejazati_profiles for update to authenticated
using(
  (select private.ejazati_is_owner())
  or ((select auth.uid())=id and status='active')
)
with check(
  (select private.ejazati_is_owner())
  or (
    (select auth.uid())=id
    and role=(select private.ejazati_current_role())
    and status=(select private.ejazati_current_status())
  )
);
