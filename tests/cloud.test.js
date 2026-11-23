import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {empty} from '../src/model.js';
import {createCloudStore} from '../src/cloud-store.js';

test('Postgres: contas isoladas, acesso anônimo negado e conflitos sem sobrescrever',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
  await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));
  await db.exec(`set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';`);
  const a={...empty(),labels:{'2026-11-23':'Só da conta A'}};
  const first=await db.query('select public.save_my_routine($1::jsonb,0) as saved',[JSON.stringify(a)]);
  assert.equal(first.rows[0].saved.revision,1);
  assert.equal((await db.query('select payload from public.routine_state')).rows[0].payload.labels['2026-11-23'],'Só da conta A');
  await assert.rejects(()=>db.query('select public.save_my_routine($1::jsonb,0)',[JSON.stringify(empty())]),e=>e.code==='40001');
  assert.deepEqual((await db.query('select payload from public.routine_state')).rows[0].payload,a);
  await db.exec(`set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';`);
  assert.equal((await db.query('select * from public.routine_state')).rows.length,0);
  await assert.rejects(()=>db.query('update public.routine_state set revision=999'),e=>e.code==='42501');
  await assert.rejects(()=>db.query('select public.save_my_routine($1::jsonb,0)',[JSON.stringify({version:1})]),e=>e.code==='22023');
  await db.query('select public.save_my_routine($1::jsonb,0)',[JSON.stringify(empty())]);
  assert.equal((await db.query('select * from public.routine_state')).rows.length,1);
  await db.exec(`reset role; set role anon; set request.jwt.claim.sub='';`);
  await assert.rejects(()=>db.query('select * from public.routine_state'),e=>e.code==='42501');
  await assert.rejects(()=>db.query('select public.save_my_routine($1::jsonb,0)',[JSON.stringify(empty())]),e=>e.code==='42501');
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::integer as n from public.routine_state')).rows[0].n,2);
 }finally{await db.close();}
});

test('cliente envia revisão esperada, propaga conflito e rejeita backup inválido',async()=>{
 let calls=0;
 const client={rpc:async(name,args)=>{calls++;assert.equal(name,'save_my_routine');assert.equal(args.p_expected_revision,4);return {error:{code:'40001'}};}};
 const store=createCloudStore(client,'user-a');
 await assert.rejects(()=>store.write(empty(),4),e=>e.code==='40001');
 await assert.rejects(()=>store.write({version:999},4));
 assert.equal(calls,1);
});
