import React,{useEffect,useRef,useState} from 'react';
import {add,date,estimateSleepMinutes,formatTaskTime} from './model';

function formatSleep(minutes){
 if(minutes===null||!Number.isFinite(minutes)||minutes<0)return null;
 const hours=Number((minutes/60).toFixed(1));
 return `${hours.toLocaleString('pt-BR')}h`;
}

function ActionIcon({name}){
 return name==='edit'?<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>:<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;
}

function ReorderIcon(){
 return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
}

export function TodayChecklist({tasks,nextTasks,day,now,locked,editable,onToggle,onEdit,onDelete,onReorder,onManage}){
 const dragged=useRef(null);
 const onReorderRef=useRef(onReorder);
 const [dragOver,setDragOver]=useState(null);
 const [dragging,setDragging]=useState(null);
 const [dragOrder,setDragOrder]=useState(null);
 const canReorder=editable&&day===now&&!locked;
 onReorderRef.current=onReorder;
 const sleepMinutes=day===now?estimateSleepMinutes(tasks,nextTasks):null;
 const sleep=sleepMinutes===null?null:formatSleep(sleepMinutes);
 const nextDay=['domingo','segunda','terça','quarta','quinta','sexta','sábado'][date(add(day,1)).getDay()];
 const orderedTasks=dragOrder?dragOrder.map(id=>tasks.find(task=>task.id===id)).filter(Boolean):tasks;

 useEffect(()=>{
  function movePointer(event){
   const drag=dragged.current;
   if(!drag||drag.pointerId!==event.pointerId)return;
   if(!drag.active){
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>14){
     window.clearTimeout(drag.timer);
     dragged.current=null;
    }
    return;
   }
   if(event.cancelable)event.preventDefault();
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-task-id]');
   const targetId=target?.dataset.taskId;
   if(!targetId){setDragOver(null);return;}
   setDragOver(targetId);
   const from=drag.order.indexOf(drag.id),to=drag.order.indexOf(targetId);
   if(from<0||to<0||from===to)return;
   drag.order.splice(to,0,drag.order.splice(from,1)[0]);
   setDragOrder([...drag.order]);
  }
  function finishPointer(event,commit=true){
   const drag=dragged.current;
   if(!drag||drag.pointerId!==event.pointerId)return;
   window.clearTimeout(drag.timer);
   dragged.current=null;
   if(!drag.active)return;
   setDragging(null);
   setDragOver(null);
   setDragOrder(null);
   if(commit&&drag.order.some((id,index)=>id!==drag.initialOrder[index]))onReorderRef.current(drag.order);
  }
  const finish=event=>finishPointer(event,true);
  const cancel=event=>finishPointer(event,false);
  window.addEventListener('pointermove',movePointer,{passive:false});
  window.addEventListener('pointerup',finish);
  window.addEventListener('pointercancel',cancel);
  return()=>{
   window.removeEventListener('pointermove',movePointer);
   window.removeEventListener('pointerup',finish);
   window.removeEventListener('pointercancel',cancel);
   if(dragged.current)window.clearTimeout(dragged.current.timer);
  };
 },[]);

 function startDrag(event,taskId){
  if(!canReorder||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
  event.preventDefault();
  const order=tasks.map(task=>task.id);
  const drag={id:taskId,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,order,initialOrder:order.slice(),active:false,timer:null};
  dragged.current=drag;
  drag.timer=window.setTimeout(()=>{
   if(dragged.current!==drag)return;
   drag.active=true;
   setDragging(taskId);
  },220);
 }

 return <section className="card task-card">
  <div className="section-title"><div><h2>{editable?'Tarefas de hoje':'Tarefas do dia'}</h2><p className="task-subtitle">Seu plano do dia, com horários e progresso.</p></div>{editable?<button className="primary task-add" disabled={locked} onClick={()=>onEdit(null)}>+ Nova tarefa</button>:<span className="pill">{day.slice(8,10)}/{day.slice(5,7)}</span>}</div>
  {editable&&<div className="task-highlights">{sleep!==null&&<span className="sleep-badge" title="Intervalo entre o fim da última tarefa de hoje e o início da primeira de amanhã"><span aria-hidden="true">☾</span>Descanso estimado: <strong>{sleep}</strong> até {nextDay}</span>}<div id="task-notifications"/></div>}
  {!tasks.length?<div className="empty"><span>☀</span><h3>Sem tarefas hoje</h3><p>Adicione sua primeira tarefa.</p><button className="quiet" onClick={onManage}>Ver tarefas</button></div>:<div className="task-list" role="list">
   {canReorder&&tasks.length>1&&<p className="task-reorder-hint">Mantenha pressionado o ícone de arraste para reordenar.</p>}
   {orderedTasks.map((task,index)=><div className={`task ${task.done?'done':''} ${dragOver===task.id?'drag-over':''} ${dragging===task.id?'is-dragging':''}`} key={task.id} data-task-id={task.id} role="listitem">
    <label className="task-main"><input type="checkbox" checked={task.done} disabled={day>now||locked} onChange={()=>onToggle(day,task.id)}/><span className="task-copy"><span className="task-title-line"><strong className="task-name">{task.name}</strong>{(task.time||task.endTime)&&<time className="task-time" dateTime={task.time||undefined}>{formatTaskTime(task.time,task.endTime)}</time>}</span>{task.description&&<span className="task-description">{task.description}</span>}<small>{task.done?'Concluída':'Toque para concluir'}</small></span></label>
    {editable&&<div className="task-actions">{canReorder&&tasks.length>1&&<button type="button" className="quiet task-icon-button task-drag-handle" aria-label={`Mantenha pressionado para reordenar ${task.name}`} title="Mantenha pressionado para reordenar" onPointerDown={event=>startDrag(event,task.id)}><ReorderIcon/></button>}<button type="button" className="quiet task-icon-button task-action" aria-label={`Editar ${task.name}`} title={`Editar ${task.name}`} disabled={locked} onClick={()=>onEdit(task)}><ActionIcon name="edit"/></button><button type="button" className="quiet task-icon-button task-action danger" aria-label={`Excluir ${task.name}`} title={`Excluir ${task.name}`} disabled={locked} onClick={()=>onDelete(task)}><ActionIcon name="delete"/></button></div>}
   </div>)}
  </div>}
  {day>now&&<p className="hint">As marcações ficam disponíveis na data da tarefa.</p>}
 </section>;
}
