import React,{useEffect,useState} from 'react';

const modes=[
 {id:'focus',label:'Foco'},
 {id:'shortBreak',label:'Pausa curta'},
 {id:'longBreak',label:'Pausa longa'}
];
const durationFields=[
 {id:'focus',label:'Foco'},
 {id:'shortBreak',label:'Pausa curta'},
 {id:'longBreak',label:'Pausa longa'}
];

let audioContext=null;

export async function unlockPomodoroAudio(){
 const AudioContextType=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextType)return;
 try{
  audioContext=audioContext||new AudioContextType();
  if(audioContext.state==='suspended')await audioContext.resume();
 }catch(error){
  console.warn('Não foi possível preparar o alerta sonoro do Pomodoro.',error);
 }
}

export function playPomodoroSound(){
 if(!audioContext||audioContext.state!=='running')return;
 try{
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
  oscillator.type='sine';
  oscillator.frequency.value=660;
  gain.gain.setValueAtTime(0.0001,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18,audioContext.currentTime+0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+0.55);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime+0.56);
 }catch(error){
  console.warn('Não foi possível reproduzir o alerta sonoro do Pomodoro.',error);
 }
}

function formatClock(seconds){
 const safeSeconds=Math.max(0,Math.ceil(seconds));
 return `${String(Math.floor(safeSeconds/60)).padStart(2,'0')}:${String(safeSeconds%60).padStart(2,'0')}`;
}

function completionMessage(mode){
 if(mode==='focus')return 'Foco concluído. Pausa também faz parte do progresso.';
 if(mode==='longBreak')return 'Pausa longa concluída. Pronto para um novo ciclo?';
 return 'Pausa concluída. Hora de retomar o foco.';
}

export function PomodoroPanel({
 compact=false,
 config,
 session,
 status,
 remainingSeconds,
 tasks,
 taskName,
 locked,
 onModeChange,
 onTaskChange,
 onDurationsSave,
 onStart,
 onPause,
 onResume,
 onStop,
 onClear
}){
 const [draft,setDraft]=useState(config.durations);
 const selectedTaskId=session?.taskId||config.taskId||'';
 const duration=status==='idle'?config.durations[config.mode]*60:session?.durationSeconds||config.durations[config.mode]*60;
 const progress=duration?Math.max(0,Math.min(1,remainingSeconds/duration)):1;

 useEffect(()=>setDraft(config.durations),[config.durations.focus,config.durations.shortBreak,config.durations.longBreak]);

 function saveDurations(event){
  event.preventDefault();
  onDurationsSave(Object.fromEntries(durationFields.map(field=>[field.id,Number(draft[field.id])])));
 }

 return <section className={`card pomodoro-card${compact?' pomodoro-compact':''}${status==='finished'?' is-finished':''}`} aria-label="Pomodoro">
  <div className="pomodoro-heading">
   <div><h2>Pomodoro</h2>{!compact&&<p className="pomodoro-description">Alterne períodos de foco e pausas no seu ritmo.</p>}</div>
   <span className={`pomodoro-status status-${status}`}>{status==='running'?'Em andamento':status==='paused'?'Pausado':status==='finished'?'Concluído':'Pronto'}</span>
  </div>
  <div className="pomodoro-modes" role="group" aria-label="Modo do Pomodoro">
   {modes.map(mode=><button type="button" key={mode.id} className={config.mode===mode.id?'selected':''} aria-pressed={config.mode===mode.id} disabled={locked||status==='running'||status==='paused'} onClick={()=>onModeChange(mode.id)}>{mode.label}</button>)}
  </div>
  <div className="pomodoro-center">
   <div className="pomodoro-ring" style={{'--pomodoro-progress':`${progress*360}deg`}}>
    <div role="timer" aria-label={`${modes.find(mode=>mode.id===config.mode)?.label}, ${formatClock(remainingSeconds)} restantes`} aria-live="off">
     <strong>{formatClock(remainingSeconds)}</strong>
     {!compact&&<span>{modes.find(mode=>mode.id===config.mode)?.label}</span>}
    </div>
   </div>
   <p className="pomodoro-task">{taskName?<>Para: <strong>{taskName}</strong></>:'Sem tarefa associada'}</p>
  </div>
  <div className="pomodoro-controls">
   {status==='running'?<button type="button" className="primary" disabled={locked} onClick={onPause}>Pausar</button>:status==='paused'?<button type="button" className="primary" disabled={locked} onClick={onResume}>Retomar</button>:<button type="button" className="primary" disabled={locked} onClick={onStart}>Iniciar</button>}
   {(status==='running'||status==='paused')&&<button type="button" className="quiet" disabled={locked} onClick={onStop}>Parar</button>}
   {session&&<button type="button" className="quiet pomodoro-delete" disabled={locked} onClick={onClear}>Excluir</button>}
  </div>
  {status==='finished'&&<p className="pomodoro-complete" role="status">{completionMessage(session?.mode||config.mode)}</p>}
  {!compact&&<div className="pomodoro-settings">
   <label className="field pomodoro-task-select">Associar tarefa (opcional)
    <select value={selectedTaskId} disabled={locked||Boolean(session)} onChange={event=>onTaskChange(event.target.value)}>
     <option value="">Nenhuma tarefa</option>
     {tasks.map(task=><option key={task.id} value={task.id}>{task.name}</option>)}
    </select>
   </label>
   <form onSubmit={saveDurations}>
    <fieldset><legend>Duração de cada etapa (minutos)</legend><div className="pomodoro-durations">
     {durationFields.map(field=><label className="field" key={field.id}>{field.label}<input type="number" min="1" max="180" required value={draft[field.id]} disabled={locked||status==='running'||status==='paused'} onChange={event=>setDraft({...draft,[field.id]:event.target.value})}/></label>)}
    </div></fieldset>
    <button className="quiet pomodoro-save" type="submit" disabled={locked||status==='running'||status==='paused'}>Salvar durações</button>
   </form>
  </div>}
 </section>;
}
