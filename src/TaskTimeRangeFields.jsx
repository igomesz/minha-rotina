import React from 'react';

export function TaskTimeRangeFields({start,end,onChange}){
 return <fieldset className="task-time-fields">
  <legend>Horários <span className="optional">(opcional)</span></legend>
  <p className="hint">Defina o início e, se quiser, o término da tarefa.</p>
  <div className="task-time-inputs">
   <label className="field">Início<input type="time" value={start} onChange={event=>onChange(event.target.value,end)}/></label>
   <label className="field">Término<input type="time" min={start||undefined} value={end} onChange={event=>onChange(start,event.target.value)}/></label>
  </div>
 </fieldset>;
}
