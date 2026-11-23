-- Execute uma vez no SQL Editor do seu projeto Supabase.
-- Não apaga nem substitui os dados existentes.
begin;
create table if not exists public.routine_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{"version":1,"tasks":[],"done":{},"labels":{}}'::jsonb,
 revision bigint not null default 0 check(revision>=0),
 updated_at timestamptz not null default now(),
 constraint valid_routine_payload check (
   jsonb_typeof(payload)='object' and payload->>'version'='1'
   and jsonb_typeof(payload->'tasks')='array' and jsonb_typeof(payload->'done')='object'
   and (not (payload ? 'labels') or jsonb_typeof(payload->'labels')='object')
   and octet_length(payload::text)<=5000000
 )
);
alter table public.routine_state enable row level security;
revoke all on public.routine_state from anon, authenticated;
grant select on public.routine_state to authenticated;
drop policy if exists "Read only my routine" on public.routine_state;
create policy "Read only my routine" on public.routine_state for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.save_my_routine(p_payload jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare caller uuid:=auth.uid(); current_revision bigint; saved public.routine_state;
begin
 if caller is null then raise exception 'Login required' using errcode='42501'; end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object'
   or (p_payload->>'version') is distinct from '1'
   or jsonb_typeof(p_payload->'tasks') is distinct from 'array'
   or jsonb_typeof(p_payload->'done') is distinct from 'object'
   or ((p_payload ? 'labels') and jsonb_typeof(p_payload->'labels') is distinct from 'object')
   or octet_length(p_payload::text)>5000000 then
   raise exception 'Invalid routine payload' using errcode='22023';
 end if;
 insert into public.routine_state(user_id) values(caller) on conflict(user_id) do nothing;
 select revision into current_revision from public.routine_state where user_id=caller for update;
 if current_revision<>p_expected_revision then raise exception 'Routine changed on another device' using errcode='40001'; end if;
 update public.routine_state set payload=p_payload,revision=revision+1,updated_at=now() where user_id=caller returning * into saved;
 return jsonb_build_object('payload',saved.payload,'revision',saved.revision);
end;
$$;
revoke all on function public.save_my_routine(jsonb,bigint) from public,anon;
grant execute on function public.save_my_routine(jsonb,bigint) to authenticated;
commit;
