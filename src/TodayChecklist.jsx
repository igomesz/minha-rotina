import React,{useRef,useState} from 'react';
import {estimateSleepMinutes,formatTaskTime} from './model';

function formatSleep(minutes){
 if(minutes===null||!Number.isFinite(minutes)||minutes<0)return null;
 const hours=Math.floor(minutes/60),remaining=minutes%60;
 return `${hours} h${remaining?` ${remaining} min`:''}`;
}

export function TodayChecklist({tasks,nextTasks,day,now,locked,editable,onToggle,onEdit,onDelete,onReorder,onManage}){
 const dragged=useRef(null);
 const [dragOver,setDragOver]=useState(null);
 const canReorder=editable&&day===now&&!locked;
 const sleepMinutes=day===now?estimateSleepMinutes(tasks,nextTasks):null;
 const sleep=sleepMinutes===null?null:formatSleep(sleepMinutes);
 function move(sourceId,targetId){
  if(!canReorder||sourceId===targetId)return;
  const ids=tasks.map(task=>task.id),from=ids.indexOf(sourceId),to=ids.indexOf(targetId);
  if(from<0||to<0)return;
  ids.splice(to,0,ids.splice(from,1)[0]);
  onReorder(ids);
 }
 return <section className="card task-card">
  <div className="section-title"><div><h2>{editable?'Tarefas de hoje':'Tarefas do dia'}</h2><p className="task-subtitle">Seu plano do dia, com horários e progresso.</p></div>{editable?<button className="primary task-add" disabled={locked} onClick={()=>onEdit(null)}>+ Nova tarefa</button>:<span className="pill">{day.slice(8,10)}/{day.slice(5,7)}</span>}</div>
  {editable&&<div className="task-highlights">{sleep!==null&&<span className="sleep-badge" title="Intervalo entre o fim da última tarefa de hoje e o início da primeira de amanhã"><span aria-hidden="true">☾</span> Descanso estimado <strong>{sleep}</strong></span>}<div id="task-notifications"/></div>}
  {!tasks.length?<div className="empty"><span>☀</span><h3>Sem tarefas hoje</h3><p>Adicione sua primeira tarefa.</p><button className="quiet" onClick={onManage}>Ver tarefas</button></div>:<div className="task-list" role="list">
   {canReorder&&tasks.length>1&&<p className="task-reorder-hint">Arraste para reordenar ou use ↑ e ↓.</p>}
   {tasks.map((task,index)=><div className={`task ${task.done?'done':''} ${dragOver===task.id?'drag-over':''}`} key={task.id} role="listitem" draggable={canReorder}
    onDragStart={event=>{dragged.current=task.id;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',task.id);}}
    onDragOver={event=>{if(canReorder)event.preventDefault();}}
    onDragEnter={()=>{if(canReorder)setDragOver(task.id);}}
    onDrop={event=>{event.preventDefault();move(dragged.current||event.dataTransfer.getData('text/plain'),task.id);dragged.current=null;setDragOver(null);}}
    onDragEnd={()=>{dragged.current=null;setDragOver(null);}}>
    <label className="task-main"><input type="checkbox" checked={task.done} disabled={day>now||locked} onChange={()=>onToggle(day,task.id)}/><span className="task-copy"><span className="task-title-line"><strong className="task-name">{task.name}</strong>{(task.time||task.endTime)&&<time className="task-time" dateTime={task.time||undefined}>{formatTaskTime(task.time,task.endTime)}</time>}</span>{task.description&&<span className="task-description">{task.description}</span>}<small>{task.done?'Concluída':'Toque para concluir'}</small></span></label>
    {editable&&<div className="task-actions">{canReorder&&<><button className="quiet task-move" disabled={index===0||locked} aria-label={`Mover ${task.name} para cima`} onClick={()=>move(task.id,tasks[index-1]?.id)}>↑</button><button className="quiet task-move" disabled={index===tasks.length-1||locked} aria-label={`Mover ${task.name} para baixo`} onClick={()=>move(task.id,tasks[index+1]?.id)}>↓</button></>}<button className="quiet task-action" disabled={locked} onClick={()=>onEdit(task)}>Editar</button><button className="quiet danger task-action" disabled={locked} onClick={()=>onDelete(task)}>Excluir</button></div>}
   </div>)}
  </div>}
  {day>now&&<p className="hint">As marcações ficam disponíveis na data da tarefa.</p>}
 </section>;
}
