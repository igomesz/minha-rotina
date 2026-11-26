const modes = ['focus', 'shortBreak', 'longBreak'];

export function pomodoroDay(timestamp) {
 return new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
 }).format(new Date(timestamp));
}

function historyKey(userId, day) {
 return `minha-rotina-pomodoro-completions:v1:${userId||'local'}:${day}`;
}

export function readPomodoroHistory(storage, userId, day) {
 const raw=storage.getItem(historyKey(userId,day));
 if(!raw)return [];
 const sessions=JSON.parse(raw);
 if(!Array.isArray(sessions)||sessions.some(session=>!session||typeof session.sessionId!=='string'||!session.sessionId||!modes.includes(session.mode)))throw Error('Contagem local do Pomodoro inválida.');
 return sessions;
}

export function recordPomodoroCompletion(storage, userId, day, session) {
 if(!session||typeof session.id!=='string'||!session.id||!modes.includes(session.mode))throw Error('Etapa concluída do Pomodoro inválida.');
 const sessions=readPomodoroHistory(storage,userId,day);
 if(sessions.some(item=>item.sessionId===session.id))return sessions;
 const next=[...sessions,{sessionId:session.id,mode:session.mode}];
 storage.setItem(historyKey(userId,day),JSON.stringify(next));
 return next;
}
