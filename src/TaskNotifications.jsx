import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {today} from './model';

const STORAGE_KEY='minha-rotina-lembretes-ativados';

function readEnabled(){
 try{return localStorage.getItem(STORAGE_KEY)==='true';}
 catch{return false;}
}

function minutesUntil(day,time){
 const now=new Date();
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 const current=Date.UTC(Number(values.year),Number(values.month)-1,Number(values.day),Number(values.hour),Number(values.minute),Number(values.second));
 const target=Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7))-1,Number(day.slice(8,10)),Number(time.slice(0,2)),Number(time.slice(3,5)));
 return (target-current)/60000;
}

export function TaskNotifications({tasks,day,visible}){
 const [enabled,setEnabled]=useState(readEnabled);
 const [permission,setPermission]=useState(()=>('Notification'in window?Notification.permission:'unsupported'));
 const [message,setMessage]=useState(()=>('Notification'in window?'Ative para receber um aviso 15 minutos antes.':'Este navegador não oferece notificações.'));
 const [target,setTarget]=useState(null);

 useEffect(()=>{setTarget(visible?document.getElementById('task-notifications'):null);},[visible]);

 useEffect(()=>{
  if(!enabled||permission!=='granted')return undefined;
  const check=async()=>{
   if(day!==today())return;
   for(const task of tasks){
    if(!task.time||task.done)continue;
    const remaining=minutesUntil(day,task.time);
    if(remaining<=0||remaining>15)continue;
    const key=`minha-rotina-lembrete:${day}:${task.id}:${task.time}`;
    try{
     if(localStorage.getItem(key))continue;
     localStorage.setItem(key,'true');
     const registration=await navigator.serviceWorker?.getRegistration();
     const title='Sua próxima tarefa';
     const body=`${task.name} começa às ${task.time}.`;
     if(registration?.showNotification)await registration.showNotification(title,{body,tag:key,icon:'/icon-192.png',badge:'/icon-192.png',data:{url:'/'}});
     else new Notification(title,{body,tag:key,icon:'/icon-192.png'});
    }catch{
     try{localStorage.removeItem(`minha-rotina-lembrete:${day}:${task.id}:${task.time}`);}catch{}
     setMessage('Não foi possível mostrar o lembrete. Confira as permissões de notificação do navegador.');
    }
   }
  };
  check();
  const timer=window.setInterval(check,15000);
  return()=>window.clearInterval(timer);
 },[day,enabled,permission,tasks]);

 async function toggle(){
  if(enabled){
   setEnabled(false);
   try{localStorage.setItem(STORAGE_KEY,'false');}catch{setMessage('Não foi possível salvar essa preferência neste dispositivo.');}
   setMessage('Lembretes desativados neste dispositivo.');
   return;
  }
  if(permission==='unsupported'){setMessage('Este navegador não oferece notificações.');return;}
  try{
   const result=permission==='granted'?permission:await Notification.requestPermission();
   setPermission(result);
   if(result!=='granted'){setMessage(result==='denied'?'Permissão negada. Ative as notificações nas configurações do navegador.':'Permissão de notificação não concedida.');return;}
   localStorage.setItem(STORAGE_KEY,'true');
   setEnabled(true);
   setMessage('Lembretes ativados neste dispositivo. O app precisa estar aberto para programá-los.');
  }catch{
   setMessage('Não foi possível ativar as notificações neste navegador.');
  }
 }

 return target&&visible?createPortal(<div className="notification-controls">
  <button type="button" className="quiet notification-toggle" disabled={permission==='unsupported'} onClick={toggle}>{enabled?'Desativar lembretes':'Ativar lembretes de 15 min'}</button>
  <p className="hint" role="status">{message||'Receba um aviso antes do início; mantenha o app aberto para o lembrete funcionar.'}</p>
 </div>,target):null;
}
