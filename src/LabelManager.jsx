import React,{useState} from 'react';

function createId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');}

export function LabelManager({date,dayLabel,labels,locked,onDateChange,onAdd,onUpdate,onRemove,onClose}){
 const [mode,setMode]=useState(labels.length?'': 'add');
 const [editingId,setEditingId]=useState('');
 const [text,setText]=useState('');
 const [time,setTime]=useState('');
 function add(){setMode('add');setEditingId('');setText('');setTime('');}
 function edit(label){setMode('edit');setEditingId(label.id);setText(label.text);setTime(label.time||'');}
 function cancel(){setMode('');setEditingId('');setText('');setTime('');}
 async function submit(event){
  event.preventDefault();
  const value=text.trim();
  if(!value)return;
  const saved=mode==='add'?await onAdd({id:createId(),text:value,time}):await onUpdate(editingId,{text:value,time});
  if(saved){if(mode==='add'){setText('');setTime('');}else cancel();}
 }
 async function remove(id){if(await onRemove(id)&&editingId===id)cancel();}
 return <div className="overlay"><section className="modal label-manager" role="dialog" aria-modal="true" aria-labelledby="label-title">
  <h2 id="label-title">Etiquetas do dia</h2>
  <label className="field">Data<input autoFocus={labels.length>0} type="date" required min="1900-01-01" max="9999-12-31" value={date} onChange={event=>{if(event.target.value)onDateChange(event.target.value);}}/></label>
  <p className="hint">{dayLabel}. Você pode adicionar mais de uma etiqueta e definir um horário para cada uma.</p>
  {labels.length?<ul className="label-manager-list">{labels.map(label=><li key={label.id}><div className="label-manager-copy"><strong>{label.text}</strong>{label.time&&<time dateTime={label.time}>{label.time}</time>}</div><div className="row-actions"><button type="button" className="quiet" disabled={locked||mode!==''} onClick={()=>edit(label)}>Editar</button><button type="button" className="quiet danger" disabled={locked} onClick={()=>remove(label.id)}>Excluir</button></div></li>)}</ul>:<p className="hint">Ainda não há etiquetas neste dia.</p>}
  {mode&&<form className="label-manager-form" onSubmit={submit}><h3>{mode==='add'?'Adicionar etiqueta':'Editar etiqueta'}</h3><label className="field">Nome da etiqueta<input autoFocus maxLength={80} required value={text} onChange={event=>setText(event.target.value)} placeholder="Ex.: Consulta"/></label><label className="field">Horário <span className="optional">(opcional)</span><input type="time" value={time} onChange={event=>setTime(event.target.value)}/></label><div className="row-actions"><button type="button" className="quiet" onClick={cancel}>Cancelar</button><button className="primary" disabled={locked||!text.trim()}>{mode==='add'?'Adicionar etiqueta':'Salvar alterações'}</button></div></form>}
  <div className="row-actions label-manager-footer">{mode===''&&<button type="button" className="quiet" disabled={locked} onClick={add}>+ Adicionar etiqueta</button>}<button type="button" className="quiet" onClick={onClose}>Fechar</button></div>
 </section></div>;
}
