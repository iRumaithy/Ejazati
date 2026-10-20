-- Run against the shared project as postgres; every test write is rolled back.
begin;
do $$declare candidate uuid:=gen_random_uuid();begin
 perform set_config('test.ejazati.owner',(select p.id::text from public.ejazati_profiles p join private.ejazati_memberships m on m.user_id=p.id where p.role='owner' and p.status='active' limit 1),true);
 perform set_config('test.ejazati.candidate',candidate::text,true);
 perform set_config('test.ejazati.foreign',(select p.id::text from public.ejazati_profiles p left join private.ejazati_memberships m on m.user_id=p.id where m.user_id is null limit 1),true);
 perform set_config('test.ejazati.member_count',(select count(*)::text from private.ejazati_memberships),true);
 -- Exercise BOTH real shared signup triggers. Spot signups must stay out of Ejazati.
 insert into auth.users(id,email,raw_user_meta_data)
 values(candidate,'audit-'||candidate::text||'@accounts.spot.example',jsonb_build_object('app','spot','signup_flow','self_signup','username','audit'||substr(replace(candidate::text,'-',''),1,14),'display_name','Disposable rollback test'));
 if exists(select 1 from public.ejazati_profiles where id=candidate) then raise exception 'Spot signup auto-created an Ejazati profile';end if;
 if not exists(select 1 from public.profiles where id=candidate) then raise exception 'Spot signup was broken';end if;
 -- User-editable metadata must not authorize membership or owner role.
 update auth.users set raw_user_meta_data=raw_user_meta_data||'{"app":"ejazati","role":"owner","status":"active"}'::jsonb where id=candidate;
 if private.ejazati_is_member(candidate) then raise exception 'Metadata authorized membership';end if;
 perform set_config('request.jwt.claim.sub',current_setting('test.ejazati.owner'),true);
end$$;
set local role authenticated;
do $$declare changed integer;begin
 if (select count(*) from public.ejazati_profiles)<>current_setting('test.ejazati.member_count')::integer then raise exception 'Owner sees foreign accounts';end if;
 if nullif(current_setting('test.ejazati.foreign',true),'') is not null then
  update public.ejazati_profiles set status='disabled' where id=current_setting('test.ejazati.foreign')::uuid;
  get diagnostics changed=row_count;if changed<>0 then raise exception 'Owner can mutate a foreign app account';end if;
 end if;
 begin
  insert into private.ejazati_memberships(user_id,source) values(current_setting('test.ejazati.candidate')::uuid,'app_entry');
  raise exception 'Client directly wrote private membership';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.ejazati.candidate'),true);
set local role authenticated;
do $$declare denied integer:=0;begin
 if (select count(*) from public.ejazati_profiles)<>0 then raise exception 'Nonmember can read profiles';end if;
 begin perform public.ejazati_ensure_current_year();exception when insufficient_privilege then denied:=denied+1;end;
 begin perform public.ejazati_set_balance_adjustment(0);exception when insufficient_privilege then denied:=denied+1;end;
 if denied<>2 then raise exception 'Nonmember can access protected Ejazati RPCs';end if;
 if public.ejazati_claim_owner() then raise exception 'Nonmember claimed ownership';end if;
 perform public.ejazati_join_app();perform public.ejazati_join_app();
 if (select count(*) from public.ejazati_profiles)<>1 then raise exception 'Joined user sees other accounts';end if;
 if not exists(select 1 from public.ejazati_profiles where id=auth.uid() and role='user' and status='active') then raise exception 'Join used metadata privileges';end if;
 begin
  update public.ejazati_profiles set role='owner' where id=auth.uid();
  raise exception 'User promoted self';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 if (select count(*) from private.ejazati_memberships where user_id=current_setting('test.ejazati.candidate')::uuid)<>1 then raise exception 'Join not idempotent';end if;
 if not exists(select 1 from public.profiles where id=current_setting('test.ejazati.candidate')::uuid and is_active) then raise exception 'Joining modified Spot';end if;
 update public.ejazati_profiles set status='disabled' where id=current_setting('test.ejazati.candidate')::uuid;
end$$;
set local role authenticated;
do $$declare denied boolean:=false;begin
 begin perform public.ejazati_join_app();exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Disabled account rejoined';end if;
end$$;
reset role;
-- Ejazati signups may reserve a username, but metadata alone grants no access.
do $$declare candidate uuid:=gen_random_uuid();begin
 insert into public.signup_invites(email,expires_at) values('audit-'||candidate::text||'@example.invalid',now()+interval '1 hour');
 insert into auth.users(id,email,raw_user_meta_data) values(candidate,'audit-'||candidate::text||'@example.invalid',jsonb_build_object('app','ejazati','username','audit'||substr(replace(candidate::text,'-',''),1,14)));
 if not exists(select 1 from public.ejazati_profiles where id=candidate and role='user') then raise exception 'Ejazati username reservation failed';end if;
 if private.ejazati_is_member(candidate) then raise exception 'Signup metadata became authorization';end if;
end$$;
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
do $$declare denied boolean:=false;begin
 begin perform public.ejazati_join_app();exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Missing authentication accepted';end if;
end$$;
reset role;
rollback;
select 'PASS: actual shared signup triggers, membership isolation, foreign-account update denial, safe self-enrollment, no self-promotion, disabled and unauthenticated denial; all writes rolled back' as result;
