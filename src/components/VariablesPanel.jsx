import { Variable } from 'lucide-react';

function formatValue(value) {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function fallbackVariables(frame, algorithm, step) {
  const values = frame?.values ?? algorithm.values ?? [];
  const position = Math.max(0, frame?.position ?? step ?? 0);
  const variables = [{ name: 'size', value: values.length, role: 'size' }];

  if (algorithm.id === 'sudoku') {
    variables.push(
      { name: 'fila', value: Math.floor(position / 9), role: 'index' },
      { name: 'columna', value: position % 9, role: 'index' },
      { name: 'value', value: values[position] ?? 0, role: 'value' },
    );
  } else if (algorithm.id === 'laberinto') {
    variables.push(
      { name: 'fila', value: Math.floor(position / 6), role: 'index' },
      { name: 'columna', value: position % 6, role: 'index' },
      { name: 'celda', value: values[position] ?? '—', role: 'value' },
    );
  } else if (algorithm.id === 'n-reinas') {
    variables.push(
      { name: 'fila', value: position, role: 'index' },
      { name: 'columna', value: values[position] ?? '—', role: 'value' },
    );
  } else if (values.length) {
    const safePosition = Math.min(position, values.length - 1);
    variables.push(
      { name: 'índice activo', value: safePosition, role: 'position' },
      { name: 'elemento', value: values[safePosition], role: 'value' },
    );
  }
  return variables;
}

export default function VariablesPanel({ frame, algorithm, step, playing }) {
  const variables = frame?.variables?.length ? frame.variables : fallbackVariables(frame, algorithm, step);
  const status = frame?.failed ? 'Error' : frame?.completed ? 'Finalizado' : playing ? 'Ejecutando' : 'Estado actual';

  return <section className="variables-panel" aria-live="polite" aria-label="Variables en tiempo real">
    <header>
      <div><Variable size={16}/><strong>Variables en tiempo real</strong></div>
      <span className={playing ? 'is-running' : ''}><i/>{status}</span>
    </header>
    <div className="variables-grid">
      {variables.map((variable, index) => <div className={`variable-item role-${variable.role ?? 'value'}`} key={`${variable.name}-${index}`}>
        <small>{variable.name}</small>
        <strong title={formatValue(variable.value)}>{formatValue(variable.value)}</strong>
      </div>)}
    </div>
    <p>{frame?.loopExit
      ? 'La condición dio false: el ciclo termina y el programa continúa.'
      : frame?.iteration !== null && frame?.iteration !== undefined
        ? 'Estos valores cambian al mismo tiempo que la línea activa y la animación.'
        : 'El panel refleja el estado visible de la estructura en este paso.'}</p>
  </section>;
}
