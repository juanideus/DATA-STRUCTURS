import { Variable } from 'lucide-react';
import { translateLearningText, useLanguage } from '../i18n.jsx';
import { SPARSE_MATRIX_COLUMNS, SPARSE_MATRIX_ROWS } from '../logic/operations.js';

const englishVariableNames = {
  filas: 'rows', columnas: 'columns', inicio: 'start', meta: 'goal',
  alto: 'height', largo: 'width', noCeros: 'non-zero cells',
  'índice activo': 'active index', 'condición': 'condition',
  algoritmo: 'algorithm', casilla: 'cell', 'distancia g': 'distance g',
  'heurística h': 'heuristic h', 'prioridad f': 'priority f',
  frontera: 'frontier', visitadas: 'visited',
  anteriorFila: 'previous row node', actualFila: 'current row node',
  anteriorCol: 'previous column node', actualCol: 'current column node',
  'vértice actual': 'current vertex', visitados: 'visited', pendientes: 'pending', rear: 'rear',
  profundidad: 'depth',
};

function formatValue(value) {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function fallbackVariables(frame, algorithm, step) {
  const values = frame?.values ?? algorithm.values ?? [];
  const position = Math.max(0, frame?.position ?? step ?? 0);
  if (['dijkstra', 'a-star'].includes(algorithm.id) && algorithm.map) {
    const { rows, columns, start, goal } = algorithm.map;
    return [
      { name: 'filas', value: rows, role: 'size' },
      { name: 'columnas', value: columns, role: 'size' },
      { name: 'inicio', value: `(${Math.floor(start / columns)}, ${start % columns})`, role: 'position' },
      { name: 'meta', value: `(${Math.floor(goal / columns)}, ${goal % columns})`, role: 'position' },
    ];
  }
  if (algorithm.id === 'matriz-dispersa') {
    return [
      { name: 'alto', value: SPARSE_MATRIX_ROWS, role: 'size' },
      { name: 'largo', value: SPARSE_MATRIX_COLUMNS, role: 'size' },
      { name: 'noCeros', value: values.length, role: 'size' },
    ];
  }
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
  const { language, t } = useLanguage();
  const variables = frame?.variables?.length ? frame.variables : fallbackVariables(frame, algorithm, step);
  const status = frame?.failed ? t('error') : frame?.completed ? t('finished') : playing ? t('running') : t('currentState');

  return <section className="variables-panel" data-tour="variables" aria-live="polite" aria-label={t('realTimeVariables')}>
    <header>
      <div><Variable size={16}/><strong>{t('realTimeVariables')}</strong></div>
      <span className={playing ? 'is-running' : ''}><i/>{status}</span>
    </header>
    <div className="variables-grid">
      {variables.map((variable, index) => <div className={`variable-item role-${variable.role ?? 'value'}`} key={`${variable.name}-${index}`}>
        <small>{language === 'en' && englishVariableNames[variable.name]
          ? englishVariableNames[variable.name]
          : translateLearningText(variable.name, language)}</small>
        <strong title={formatValue(variable.value)}>{formatValue(variable.value)}</strong>
      </div>)}
    </div>
    <p>{frame?.loopExit
      ? t('loopExit')
      : frame?.iteration !== null && frame?.iteration !== undefined
        ? t('loopState')
        : t('panelState')}</p>
  </section>;
}
