-- Integration regression test. Every write below is rolled back.
begin;
do $$begin perform set_config('request.jwt.claim.sub',(select id::text from public.ejazati_profiles where role='owner' and status='active' limit 1),true);end$$;
set local role authenticated;
do $$
declare snapshot jsonb;before_hash text;after_hash text;failed boolean:=false;overrides_before integer;
begin
 select jsonb_build_object('format','ejazati-backup-v1','settings',to_jsonb(s),'leaves',coalesce((select jsonb_agg(to_jsonb(l) order by id) from public.ejazati_leaves l where user_id=auth.uid()),'[]'::jsonb),'holidays',coalesce((select jsonb_agg(to_jsonb(h) order by id) from public.ejazati_holidays h where user_id=auth.uid()),'[]'::jsonb)) into snapshot from public.ejazati_leave_settings s where user_id=auth.uid();
 if snapshot is null then raise exception 'No owner test context';end if;
 before_hash:=md5(snapshot::text);
 begin
  perform public.ejazati_restore_backup(jsonb_set(snapshot,'{leaves}','[{"leave_type":"annual","start_date":"2026-10-22","end_date":"2026-10-20","deduct_from_balance":true}]'::jsonb));
 exception when check_violation then failed:=true;
 end;
 if not failed then raise exception 'Invalid leave was not rejected';end if;
 select md5(jsonb_build_object('format','ejazati-backup-v1','settings',to_jsonb(s),'leaves',coalesce((select jsonb_agg(to_jsonb(l) order by id) from public.ejazati_leaves l where user_id=auth.uid()),'[]'::jsonb),'holidays',coalesce((select jsonb_agg(to_jsonb(h) order by id) from public.ejazati_holidays h where user_id=auth.uid()),'[]'::jsonb))::text) into after_hash from public.ejazati_leave_settings s where user_id=auth.uid();
 if before_hash<>after_hash then raise exception 'Failed restore changed persisted data';end if;
 select count(*) into overrides_before from public.ejazati_holiday_overrides where user_id=auth.uid();
 perform public.ejazati_restore_backup(snapshot);
 if (select count(*) from public.ejazati_holiday_overrides where user_id=auth.uid())<>overrides_before then raise exception 'Legacy restore erased overrides';end if;
 if (select count(*) from public.ejazati_leaves where user_id=auth.uid())<>jsonb_array_length(snapshot->'leaves') then raise exception 'Valid restore did not restore all leaves';end if;
 raise notice 'PASS: rollback on failure; valid restore; legacy override preservation; own-account RLS';
end$$;
reset role;
-- Check disabled accounts cannot invoke the old privileged RPCs either.
update public.ejazati_profiles set status='disabled' where id=auth.uid();
set local role authenticated;
do $$declare denied integer:=0;begin
 begin perform public.ejazati_restore_backup('{}'::jsonb);exception when insufficient_privilege then denied:=denied+1;end;
 begin perform public.ejazati_ensure_current_year();exception when insufficient_privilege then denied:=denied+1;end;
 begin perform public.ejazati_set_balance_adjustment(0);exception when insufficient_privilege then denied:=denied+1;end;
 if denied<>3 then raise exception 'Disabled account bypassed protection';end if;
end$$;
reset role;
rollback;
select 'PASS: transactional restore, validation rollback, legacy backups, RLS and disabled accounts; all test writes rolled back' as result;
