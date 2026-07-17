import { useEffect, useState } from 'react';
import { getOperationDefinition } from '../logic/operations.js';

export default function OperationsPanel({ algorithm, message, status = 'idle', activeOperation, onAction }) {
  const definition = getOperationDefinition(algorithm);
  const [fields, setFields] = useState({ value: '', second: '', index: '' });

  useEffect(() => setFields({ value: '', second: '', index: '' }), [algorithm.id]);

  const run = actionId => {
    onAction(actionId, fields);
    if (!['find','peek','front','word-find','prefix-sum','range-min','evaluate','cache-get','bloom-check','find-root'].includes(actionId)) {
      setFields(current => ({ ...current, value: '', second: '' }));
    }
  };

  return <section className="operations-panel">
    <div className="operation-fields">
      {definition.fields.map(input => <label key={input.id}>
        <span>{input.label}</span>
        <input aria-label={input.label} type={input.type} value={fields[input.id]} placeholder={input.type === 'number' ? '0' : 'Escribe aquí'} onChange={event=>setFields({...fields,[input.id]:event.target.value})} onKeyDown={event=>{if(event.key==='Enter')run(definition.actions[0].id)}} />
      </label>)}
    </div>
    <div className="operation-actions">
      {definition.actions.map(button => <button type="button" title={`Ejecutar: ${button.label}`} className={`${button.tone === 'danger' ? 'danger ' : ''}${activeOperation === button.id ? 'selected-operation' : ''}`} onClick={()=>run(button.id)} key={button.id}>{button.label}</button>)}
    </div>
    <div className={`operation-message ${status}`} role="status" aria-live="polite"><span>{status === 'error' ? 'Revisar' : status === 'success' ? 'Operación completada' : 'Resultado'}</span><p>{message}</p></div>
  </section>;
}
