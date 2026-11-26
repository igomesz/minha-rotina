import test from 'node:test';
import assert from 'node:assert/strict';
import {pomodoroDay,readPomodoroHistory,recordPomodoroCompletion} from '../src/pomodoro-history.js';

function storage(){
 const values=new Map();
 return {
  getItem:key=>values.get(key)||null,
  setItem:(key,value)=>values.set(key,value)
 };
}

test('registra uma vez cada etapa concluída por usuário e dia',()=>{
 const local=storage(),focus={id:'focus-1',mode:'focus'},pause={id:'pause-1',mode:'shortBreak'};
 assert.deepEqual(recordPomodoroCompletion(local,'user-a','2026-11-23',focus),[{sessionId:'focus-1',mode:'focus'}]);
 assert.deepEqual(recordPomodoroCompletion(local,'user-a','2026-11-23',focus),[{sessionId:'focus-1',mode:'focus'}]);
 assert.deepEqual(recordPomodoroCompletion(local,'user-a','2026-11-23',pause),[{sessionId:'focus-1',mode:'focus'},{sessionId:'pause-1',mode:'shortBreak'}]);
 assert.deepEqual(readPomodoroHistory(local,'user-a','2026-11-23'),[{sessionId:'focus-1',mode:'focus'},{sessionId:'pause-1',mode:'shortBreak'}]);
 assert.deepEqual(readPomodoroHistory(local,'user-b','2026-11-23'),[]);
 assert.deepEqual(readPomodoroHistory(local,'user-a','2026-11-24'),[]);
});

test('usa o dia de conclusão no fuso de São Paulo e rejeita histórico inválido',()=>{
 assert.equal(pomodoroDay(Date.parse('2026-11-24T02:00:00Z')),'2026-11-23');
 const local=storage();
 assert.throws(()=>recordPomodoroCompletion(local,'user-a','2026-11-23',{id:'invalid',mode:'other'}));
 local.setItem('minha-rotina-pomodoro-completions:v1:user-a:2026-11-23','{}');
 assert.throws(()=>readPomodoroHistory(local,'user-a','2026-11-23'));
});
