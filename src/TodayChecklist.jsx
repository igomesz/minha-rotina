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

function moveTask(order,taskId,targetId){
 const from=order.indexOf(taskId),to=order.indexOf(targetId);
 if(from<0||to<0||from===to)return order;
 const next=order.slice();
 next.splice(to,0,next.splice(from,1)[0]);
 return next;
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
     if(drag.pointerType==='mouse'){
      drag.active=true;
      setDragging(drag.id);
     }else if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>14){
     window.clearTimeout(drag.timer);
     dragged.current=null;
      return;
    }
     if(!drag.active)return;
   }
   if(event.cancelable)event.preventDefault();
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-task-id]');
   const targetId=target?.dataset.taskId;
   if(!targetId){setDragOver(null);return;}
   setDragOver(targetId);
   const next=moveTask(drag.order,drag.id,targetId);
   if(next===drag.order)return;
   drag.order=next;
   setDragOrder(next);
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
  if(!canReorder||!event.isPrimary||event.pointerType==='mouse')return;
  event.preventDefault();
  const order=tasks.map(task=>task.id);
  const drag={id:taskId,pointerId:event.pointerId,pointerType:event.pointerType,startX:event.clientX,startY:event.clientY,order,initialOrder:order.slice(),active:false,timer:null};
  dragged.current=drag;
  if(event.currentTarget.setPointerCapture)event.currentTarget.setPointerCapture(event.pointerId);
  drag.timer=window.setTimeout(()=>{
   if(dragged.current!==drag)return;
   drag.active=true;
   setDragging(taskId);
  },220);
 }

 function startNativeDrag(event,taskId){
  if(!canReorder||!event.dataTransfer||event.target.closest('button:not(.task-drag-handle),input,a')){event.preventDefault();return;}
  const order=tasks.map(task=>task.id);
  dragged.current={id:taskId,pointerId:null,pointerType:'native',order,initialOrder:order.slice(),active:true,timer:null};
  event.dataTransfer.effectAllowed='move';
  event.dataTransfer.setData('text/plain',taskId);
  setDragging(taskId);
 }

 function dragOverTask(event,taskId){
  if(dragged.current?.pointerType!=='native')return;
  event.preventDefault();
  event.dataTransfer.dropEffect='move';
  setDragOver(taskId);
 }

 function dropOnTask(event,taskId){
  const drag=dragged.current;
  if(drag?.pointerType!=='native')return;
  event.preventDefault();
  const order=moveTask(drag.order,drag.id,taskId);
  dragged.current=null;
  setDragging(null);
  setDragOver(null);
  if(order.some((id,index)=>id!==drag.initialOrder[index]))onReorderRef.current(order);
 }

 function finishNativeDrag(){
  if(dragged.current?.pointerType!=='native')return;
  dragged.current=null;
  setDragging(null);
  setDragOver(null);
 }

 return <section className="card task-card">
  <div className="section-title"><div><h2>{editable?'Tarefas de hoje':'Tarefas do dia'}</h2><p className="task-subtitle">Seu plano do dia, com horários e progresso.</p></div>{editable?<button className="primary task-add" disabled={locked} onClick={()=>onEdit(null)}>+ Nova tarefa</button>:<span className="pill">{day.slice(8,10)}/{day.slice(5,7)}</span>}</div>
  {editable&&<div className="task-highlights">{sleep!==null&&<span className="sleep-badge" title="Intervalo entre o fim da última tarefa de hoje e o início da primeira de amanhã"><span aria-hidden="true">☾</span>Descanso estimado: <strong>{sleep}</strong> até {nextDay}</span>}<div id="task-notifications"/></div>}
  {!tasks.length?<div className="empty"><span>☀</span><h3>Sem tarefas hoje</h3><p>Adicione sua primeira tarefa.</p><button className="quiet" onClick={onManage}>Ver tarefas</button></div>:<div className="task-list" role="list">
   {canReorder&&tasks.length>1&&<p className="task-reorder-hint">Arraste uma tarefa para reordenar; no celular, mantenha pressionado o ícone.</p>}
   {orderedTasks.map((task,index)=><div className={`task ${task.done?'done':''} ${dragOver===task.id?'drag-over':''} ${dragging===task.id?'is-dragging':''}`} key={task.id} data-task-id={task.id} role="listitem" draggable={canReorder&&tasks.length>1} onDragStart={event=>startNativeDrag(event,task.id)} onDragOver={event=>dragOverTask(event,task.id)} onDrop={event=>dropOnTask(event,task.id)} onDragEnd={finishNativeDrag}>
    <label className="task-main"><input type="checkbox" checked={task.done} disabled={day>now||locked} onChange={()=>onToggle(day,task.id)}/><span className="task-copy"><span className="task-title-line"><strong className="task-name">{task.name}</strong>{(task.time||task.endTime)&&<time className="task-time" dateTime={task.time||undefined}>{formatTaskTime(task.time,task.endTime)}</time>}</span>{task.description&&<span className="task-description">{task.description}</span>}<small>{task.done?'Concluída':'Toque para concluir'}</small></span></label>
    {editable&&<div className="task-actions">{canReorder&&tasks.length>1&&<button type="button" className="quiet task-icon-button task-drag-handle" aria-label={`Arraste para reordenar ${task.name}`} title="Arraste para reordenar; no celular, mantenha pressionado" onPointerDown={event=>startDrag(event,task.id)}><ReorderIcon/></button>}<button type="button" className="quiet task-icon-button task-action" aria-label={`Editar ${task.name}`} title={`Editar ${task.name}`} disabled={locked} onClick={()=>onEdit(task)}><ActionIcon name="edit"/></button><button type="button" className="quiet task-icon-button task-action danger" aria-label={`Excluir ${task.name}`} title={`Excluir ${task.name}`} disabled={locked} onClick={()=>onDelete(task)}><ActionIcon name="delete"/></button></div>}
   </div>)}
  </div>}
  {day>now&&<p className="hint">As marcações ficam disponíveis na data da tarefa.</p>}
 </section>;
}
