import {useEffect,useRef,useState,useCallback} from 'react';
import {KEY,empty,validate} from './model.js';
import {supabase} from './supabase.js';
import {createCloudStore,storageError} from './cloud-store.js';
export function useRoutineStore(user){
 const [state,setState]=useState(empty),[error,setError]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[online,setOnline]=useState(navigator.onLine),[syncStatus,setSyncStatus]=useState('Carregando…');
 const guard=useRef(false),sequence=useRef(0),alive=useRef(true),revision=useRef(0),current=useRef(state),blocked=useRef(false);
 const store=useRef(user?createCloudStore(supabase,user.id):null).current;
 const apply=useCallback((payload)=>{current.current=payload;setState(payload);},[]);
 const refresh=useCallback(async()=>{if(!store||guard.current||!navigator.onLine)return;const ticket=++sequence.current;try{const next=await store.read();if(!alive.current||ticket!==sequence.current||guard.current)return;revision.current=next.revision;apply(next.payload);setReady(true);setSyncStatus('Sincronizado');}catch{if(alive.current&&ticket===sequence.current)setSyncStatus('Falha ao sincronizar. Tente atualizar.');}},[store,apply]);
 useEffect(()=>{alive.current=true;
  if(store){refresh();}else{try{const raw=localStorage.getItem(KEY);apply(raw?validate(JSON.parse(raw)):empty());setSyncStatus('Salvo neste navegador');}catch{blocked.current=true;setError('Não foi possível ler os dados locais. Importe um backup válido para continuar.');}setReady(true);}
  const onOnline=()=>{setOnline(true);refresh();};const onOffline=()=>{setOnline(false);setSyncStatus('Sem internet — leitura apenas');};const onFocus=()=>{if(!document.hidden)refresh();};
  const onStorage=e=>{if(store||e.key!==KEY)return;try{apply(e.newValue?validate(JSON.parse(e.newValue)):empty());}catch{blocked.current=true;setError('Dados locais inválidos. Importe um backup válido.');}};
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);window.addEventListener('focus',onFocus);window.addEventListener('storage',onStorage);document.addEventListener('visibilitychange',onFocus);
  const interval=store?setInterval(()=>{if(!document.hidden)refresh();},15000):null;
  return()=>{alive.current=false;++sequence.current;clearInterval(interval);window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);window.removeEventListener('focus',onFocus);window.removeEventListener('storage',onStorage);document.removeEventListener('visibilitychange',onFocus);};
 },[store,refresh,apply]);
 async function save(next,restore=false){
  if(guard.current||!ready||(blocked.current&&!restore)){return false;}if(store&&!navigator.onLine){setError('Conecte à internet para salvar na sua conta.');return false;}
  try{validate(next);}catch(e){setError(e.message);return false;}
  if(!store){try{localStorage.setItem(KEY,JSON.stringify(next));apply(next);blocked.current=false;setError('');return true;}catch{setError('Não foi possível salvar no navegador. Exporte seu backup.');return false;}}
  guard.current=true;++sequence.current;setBusy(true);setError('');setSyncStatus('Salvando…');const previous=current.current;apply(next);
  try{const saved=await store.write(next,revision.current);if(!alive.current)return false;revision.current=saved.revision;apply(saved.payload);setSyncStatus('Sincronizado');return true;}
  catch(e){if(alive.current){apply(previous);setError(storageError(e));setSyncStatus('Alteração não confirmada');}return false;}
  finally{guard.current=false;if(alive.current){setBusy(false);await refresh();}}
 }
 return {state,error,setError,ready,busy,locked:!ready||busy||blocked.current||Boolean(store&&!online),save,refresh,syncStatus:store&&!online?'Sem internet — leitura apenas':syncStatus};
}
