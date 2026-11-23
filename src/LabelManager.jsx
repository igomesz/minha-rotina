import React,{useState} from 'react';
import {LABEL_COLORS} from './model';

function createId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');}

const colorNames={green:'Verde',lime:'Lima',blue:'Azul',violet:'Violeta',rose:'Rosa',amber:'Âmbar'};

export function LabelManager({date,dayLabel,labels,locked,onDateChange,onAdd,onUpdate,onRemove,onClose}){
 const [mode,setMode]=useState(labels.length?'': 'add');
 const [editingId,setEditingId]=useState('');
 const [text,setText]=useState('');
 const [time,setTime]=useState('');
 const [color,setColor]=useState('green');
 function add(){setMode('add');setEditingId('');setText('');setTime('');setColor('green');}
 function edit(label){setMode('edit');setEditingId(label.id);setText(label.text);setTime(label.time||'');setColor(label.color||'green');}
 function cancel(){setMode('');setEditingId('');setText('');setTime('');setColor('green');}
 async function submit(event){
  event.preventDefault();
  const value=text.trim();
  if(!value)return;
  const saved=mode==='add'?await onAdd({id:createId(),text:value,time,color}):await onUpdate(editingId,{text:value,time,color});
  if(saved){if(mode==='add'){setText('');setTime('');}else cancel();}
 }
 async function remove(id){if(await onRemove(id)&&editingId===id)cancel();}
 return <div className="overlay"><section className="modal label-manager" role="dialog" aria-modal="true" aria-labelledby="label-title">
  <h2 id="label-title">Etiquetas do dia</h2>
  <label className="field">Data<input autoFocus={labels.length>0} type="date" required min="1900-01-01" max="9999-12-31" value={date} onChange={event=>{if(event.target.value)onDateChange(event.target.value);}}/></label>
  <p className="hint">{dayLabel}. Você pode adicionar mais de uma etiqueta e definir um horário para cada uma.</p>
  {labels.length?<ul className="label-manager-list">{labels.map(label=><li data-color={label.color||'green'} key={label.id}><div className="label-manager-copy"><strong>{label.text}</strong>{label.time&&<time dateTime={label.time}>{label.time}</time>}</div><div className="row-actions"><button type="button" className="quiet" disabled={locked||mode!==''} onClick={()=>edit(label)}>Editar</button><button type="button" className="quiet danger" disabled={locked} onClick={()=>remove(label.id)}>Excluir</button></div></li>)}</ul>:<p className="hint">Ainda não há etiquetas neste dia.</p>}
  {mode&&<form className="label-manager-form" onSubmit={submit}><h3>{mode==='add'?'Adicionar etiqueta':'Editar etiqueta'}</h3><label className="field">Nome da etiqueta<input autoFocus maxLength={80} required value={text} onChange={event=>setText(event.target.value)} placeholder="Ex.: Consulta"/></label><label className="field">Horário <span className="optional">(opcional)</span><input type="time" value={time} onChange={event=>setTime(event.target.value)}/></label><fieldset className="label-color-picker"><legend>Cor da etiqueta</legend><div>{LABEL_COLORS.map(value=><button type="button" key={value} className={`label-color-option ${value}`} aria-label={colorNames[value]} aria-pressed={color===value} title={colorNames[value]} onClick={()=>setColor(value)}/>)}</div><span className="hint">{colorNames[color]}</span></fieldset><div className="row-actions"><button type="button" className="quiet" onClick={cancel}>Cancelar</button><button className="primary" disabled={locked||!text.trim()}>{mode==='add'?'Adicionar etiqueta':'Salvar alterações'}</button></div></form>}
  <div className="row-actions label-manager-footer">{mode===''&&<button type="button" className="quiet" disabled={locked} onClick={add}>+ Adicionar etiqueta</button>}<button type="button" className="quiet" onClick={onClose}>Fechar</button></div>
 </section></div>;
}
