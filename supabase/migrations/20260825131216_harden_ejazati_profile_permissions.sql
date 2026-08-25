create or replace function private.ejazati_current_role()
returns text language sql stable security definer set search_path=''
as $$select p.role from public.ejazati_profiles p where p.id=(select auth.uid())$$;

create or replace function private.ejazati_current_status()
returns text language sql stable security definer set search_path=''
as $$select p.status from public.ejazati_profiles p where p.id=(select auth.uid())$$;

revoke all on function private.ejazati_current_role() from public;
revoke all on function private.ejazati_current_status() from public;
grant execute on function private.ejazati_current_role() to authenticated;
grant execute on function private.ejazati_current_status() to authenticated;

insert into public.ejazati_app_versions(version,channel,status,release_notes)
values('1.1.0','beta','testing','إضافة تسجيل الدخول والمزامنة ولوحة المالك وتجهيز Cloudflare Workers')
on conflict(version) do update set channel=excluded.channel,status=excluded.status,release_notes=excluded.release_notes;
