import {validGithubUsername} from './github-username.js';
export const KEY = 'minha-rotina-v1';
export const LABEL_COLORS = ['green','lime','blue','violet','rose','amber'];
export const POMODORO_MODES = ['focus','shortBreak','longBreak'];
export const defaultPomodoro=()=>({durations:{focus:25,shortBreak:5,longBreak:15},mode:'focus',taskId:'',session:null});
const QUOTES = [
 'Pequenos passos também levam longe.',
 'Consistência é continuar, mesmo em ritmo leve.',
 'O que você faz hoje constrói o seu amanhã.',
 'Seu progresso merece ser celebrado.',
 'Um passo de cada vez já é movimento.',
 'A rotina fica mais leve quando você começa.',
 'Você não precisa fazer tudo; só precisa começar.',
 'Cada dia é uma nova chance de cuidar de você.',
 'A constância transforma intenção em conquista.',
 'Faça o melhor possível com o dia de hoje.',
 'A sua jornada tem valor, inclusive nos dias simples.',
 'Recomeçar também é progresso.'
];
export function today() { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function date(s) { return new Date(s+'T12:00:00'); }
export function iso(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function add(s,n) { const d=date(s); d.setDate(d.getDate()+n); return iso(d); }
export function days(a,b) { const out=[]; for(let d=a;d<=b;d=add(d,1)) out.push(d); return out; }
export function week(s) { return add(s,-((date(s).getDay()+6)%7)); }
export function month(s) { const d=date(s); return [iso(new Date(d.getFullYear(),d.getMonth(),1,12)),iso(new Date(d.getFullYear(),d.getMonth()+1,0,12))]; }
export function labelsForDay(state,day) { const labels=state.labels?.[day]; if(typeof labels==='string')return labels.trim()?[{id:'legacy',text:labels,time:''}]:[]; return Array.isArray(labels)?labels:[]; }
export function scheduled(state,day) { const tasks=state.tasks.flatMap(task=>{ if(task.archivedFrom && day>=task.archivedFrom) return []; const v=task.versions.filter(v=>v.from<=day).at(-1); return v?.days.includes(date(day).getDay()) ? [{id:task.id,name:v.name,description:v.description||'',time:v.time||'',endTime:v.endTime||'',done:!!state.done[`${day}:${task.id}`]}] : []; }); const rank=new Map((state.order?.[day]||[]).map((id,index)=>[id,index])); return tasks.sort((a,b)=>{const aRank=rank.get(a.id),bRank=rank.get(b.id);if(aRank===undefined)return bRank===undefined?0:1;if(bRank===undefined)return -1;return aRank-bRank;}); }
export function formatTaskTime(start,end='') { return start&&end?`${start} - ${end}`:start|| (end?`Até ${end}`:''); }
export function estimateSleepMinutes(tasks,nextTasks) {
 const toMinutes=value=>{const match=typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value);return match?Number(value.slice(0,2))*60+Number(value.slice(3,5)):null;};
 const lastEnd=tasks.map(task=>toMinutes(task.endTime)).filter(value=>value!==null).sort((a,b)=>a-b).at(-1);
 const firstStart=nextTasks.map(task=>toMinutes(task.time)).filter(value=>value!==null).sort((a,b)=>a-b)[0];
 if(lastEnd===undefined||firstStart===undefined)return null;
 return 24*60+firstStart-lastEnd;
}
export function dailyQuote(day,offset=0) {
 const dayNumber=Math.floor(Date.parse(`${day}T00:00:00Z`)/86400000);
 const index=((dayNumber+offset)%QUOTES.length+QUOTES.length)%QUOTES.length;
 return QUOTES[index];
}
export function score(state,day) { const list=scheduled(state,day); return list.length?100*list.filter(t=>t.done).length/list.length:null; }
export function average(state,list,cutoff=today()) { const values=list.filter(d=>d<=cutoff).map(d=>score(state,d)).filter(v=>v!==null); return values.length?values.reduce((a,b)=>a+b,0)/values.length:null; }
export function revise(task,name,weekdays,day=today(),description=task.versions.at(-1).description||'',time=task.versions.at(-1).time||'',effectiveFrom=day,endTime=task.versions.at(-1).endTime||'') { return {...task,versions:[...task.versions.filter(v=>v.from<effectiveFrom),{from:effectiveFrom,name,description,days:weekdays,time:time||'',endTime:endTime||''}]}; }
export const empty=()=>({version:1,tasks:[],done:{},labels:{},order:{},pomodoro:defaultPomodoro()});
function validatePomodoro(pomodoro,taskIds){
 const modes=POMODORO_MODES;
 const validTask=id=>id===''||taskIds.has(id);
 if(!pomodoro||typeof pomodoro!=='object'||Array.isArray(pomodoro)||!modes.includes(pomodoro.mode)||!pomodoro.durations||typeof pomodoro.durations!=='object'||Array.isArray(pomodoro.durations)||!['focus','shortBreak','longBreak'].every(mode=>Number.isInteger(pomodoro.durations[mode])&&pomodoro.durations[mode]>=1&&pomodoro.durations[mode]<=180)||typeof pomodoro.taskId!=='string'||!validTask(pomodoro.taskId))throw Error('Configuração do Pomodoro inválida no backup.');
 const session=pomodoro.session;
 if(session===null)return;
 if(!session||typeof session!=='object'||Array.isArray(session)||typeof session.id!=='string'||!session.id||session.id.length>100||!modes.includes(session.mode)||session.mode!==pomodoro.mode||!['running','paused','finished','stopped'].includes(session.status)||typeof session.taskId!=='string'||!validTask(session.taskId)||!Number.isInteger(session.durationSeconds)||session.durationSeconds<60||session.durationSeconds>10800)throw Error('Sessão do Pomodoro inválida no backup.');
 if(session.status==='running'&&(!Number.isFinite(session.endsAt)||session.endsAt<0||session.remainingSeconds!==null))throw Error('Temporizador do Pomodoro inválido no backup.');
 if(session.status==='paused'&&(!Number.isInteger(session.remainingSeconds)||session.remainingSeconds<1||session.remainingSeconds>session.durationSeconds||session.endsAt!==null))throw Error('Pausa do Pomodoro inválida no backup.');
 if(session.status==='finished'&&(session.remainingSeconds!==0||session.endsAt!==null))throw Error('Ciclo do Pomodoro inválido no backup.');
 if(session.status==='stopped'&&(session.remainingSeconds!==session.durationSeconds||session.endsAt!==null))throw Error('Temporizador parado do Pomodoro inválido no backup.');
}
export function validate(x) {
 const validDate=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(date(s)) && iso(date(s))===s;
 const validTime=s=>typeof s==='string' && (s===''||/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s));
 if(!x||x.version!==1||!Array.isArray(x.tasks)||x.tasks.length>10000||!x.done||typeof x.done!=='object'||Array.isArray(x.done)) throw Error('Arquivo de backup inválido.');
 const ids=new Set();
 for(const t of x.tasks){
  if(typeof t.id!=='string'||!t.id||t.id.includes(':')||ids.has(t.id)||!Array.isArray(t.versions)||!t.versions.length||(t.archivedFrom&&!validDate(t.archivedFrom)))throw Error('Tarefa inválida no backup.');
  ids.add(t.id);
  let prev='';
  for(const v of t.versions){
   if(!validDate(v.from)||v.from<=prev||typeof v.name!=='string'||!v.name.trim()||v.name.length>100||(v.description!==undefined&&(typeof v.description!=='string'||v.description.length>1000))||(v.time!==undefined&&!validTime(v.time))||!Array.isArray(v.days)||!v.days.length||new Set(v.days).size!==v.days.length||v.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Agenda inválida no backup.');
   prev=v.from;
  }
 }
 for(const [k,v] of Object.entries(x.done)){const [d,id,...rest]=k.split(':');if(rest.length||!validDate(d)||!ids.has(id)||typeof v!=='boolean')throw Error('Marcação inválida no backup.');}
 if(x.labels!==undefined){if(!x.labels||typeof x.labels!=='object'||Array.isArray(x.labels))throw Error('Etiquetas inválidas no backup.');for(const [d,dayLabels] of Object.entries(x.labels)){if(!validDate(d))throw Error('Etiquetas inválidas no backup.');if(typeof dayLabels==='string'){if(!dayLabels.trim()||dayLabels.length>80)throw Error('Etiquetas inválidas no backup.');continue;}if(!Array.isArray(dayLabels)||!dayLabels.length||dayLabels.length>100)throw Error('Etiquetas inválidas no backup.');const labelIds=new Set();for(const label of dayLabels){if(!label||typeof label!=='object'||Array.isArray(label)||typeof label.id!=='string'||!label.id||label.id.length>100||labelIds.has(label.id)||typeof label.text!=='string'||!label.text.trim()||label.text.length>80||(label.time!==undefined&&!validTime(label.time)))throw Error('Etiqueta inválida no backup.');labelIds.add(label.id);}}}
 for(const task of x.tasks)for(const version of task.versions){if(version.endTime!==undefined&&!validTime(version.endTime))throw Error('Horário final inválido no backup.');if(version.time&&version.endTime&&version.endTime<=version.time)throw Error('O horário final deve ser depois do horário inicial.');}
 if(x.labels!==undefined)for(const labels of Object.values(x.labels))if(Array.isArray(labels))for(const label of labels)if(label.color!==undefined&&!LABEL_COLORS.includes(label.color))throw Error('Cor de etiqueta inválida no backup.');
 if(x.order!==undefined){if(!x.order||typeof x.order!=='object'||Array.isArray(x.order))throw Error('Ordem das tarefas inválida no backup.');for(const [d,order] of Object.entries(x.order)){if(!validDate(d)||!Array.isArray(order)||order.length>10000||new Set(order).size!==order.length||order.some(id=>typeof id!=='string'||!ids.has(id)))throw Error('Ordem das tarefas inválida no backup.');}}
 if(x.pomodoro!==undefined)validatePomodoro(x.pomodoro,ids);
 if(x.githubUsername!==undefined&&x.githubUsername!==''&&!validGithubUsername(x.githubUsername))throw Error('Usuário do GitHub inválido no backup.');
 return x;
}

