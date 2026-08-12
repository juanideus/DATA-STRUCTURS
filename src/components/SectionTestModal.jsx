import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert, X, XCircle } from 'lucide-react';
import { createSectionTest, gradeSectionTest, lockSectionTest, saveSectionTestResult } from '../logic/sectionTests.js';

const violationLabels = {
  hidden: 'Se cambió de pestaña o se ocultó DSA Lab.',
  blur: 'La ventana de DSA Lab perdió el foco.',
  navigation: 'Se intentó cambiar de sección durante la prueba.',
  history: 'Se utilizó la navegación del navegador durante la prueba.',
  unload: 'Se cerró o recargó la página durante la prueba.',
};

export default function SectionTestModal({ algorithm, externalViolation, onClose, onActiveChange, onLockout }) {
  const test = useMemo(() => createSectionTest(algorithm), [algorithm.id]);
  const [status, setStatus] = useState('instructions');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [violation, setViolation] = useState(null);
  const statusRef = useRef(status);
  const savedRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
    onActiveChange(status === 'active');
  }, [status, onActiveChange]);

  const persistCancellation = reason => {
    if (savedRef.current) return;
    savedRef.current = true;
    const lockedUntil = lockSectionTest(algorithm.id);
    onLockout(lockedUntil);
    saveSectionTestResult({
      algorithmId: algorithm.id,
      algorithmName: algorithm.name,
      status: 'cancelled-copy',
      reason,
      lockedUntil,
      createdAt: new Date().toISOString(),
    });
  };

  const cancelForViolation = reason => {
    if (statusRef.current !== 'active') return;
    statusRef.current = 'cancelled';
    persistCancellation(reason);
    setViolation(reason);
    setStatus('cancelled');
  };

  useEffect(() => {
    if (!externalViolation) return;
    cancelForViolation(externalViolation);
  }, [externalViolation]);

  useEffect(() => {
    if (status !== 'active') return undefined;
    let blurTimer;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') cancelForViolation('hidden');
    };
    const onBlur = () => {
      blurTimer = window.setTimeout(() => {
        if (!document.hasFocus()) cancelForViolation('blur');
      }, 250);
    };
    const onFocus = () => window.clearTimeout(blurTimer);
    const onBeforeUnload = () => persistCancellation('unload');
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [status]);

  const begin = () => {
    savedRef.current = false;
    setAnswers({});
    setQuestionIndex(0);
    setStatus('active');
  };

  const selectAnswer = choiceId => {
    const question = test.questions[questionIndex];
    setAnswers(current => ({ ...current, [question.id]: choiceId }));
  };

  const advance = () => {
    if (questionIndex < test.questions.length - 1) {
      setQuestionIndex(index => index + 1);
      return;
    }
    const grade = gradeSectionTest(test, answers);
    const completed = {
      algorithmId: algorithm.id,
      algorithmName: algorithm.name,
      status: 'completed',
      ...grade,
      createdAt: new Date().toISOString(),
    };
    savedRef.current = true;
    saveSectionTestResult(completed);
    setResult(grade);
    setStatus('completed');
  };

  const question = test.questions[questionIndex];
  const selectedChoice = question ? answers[question.id] : null;

  return <div className="section-test-overlay" role="dialog" aria-modal="true" aria-label={`Prueba de ${algorithm.name}`}>
    <section className="section-test-modal">
      {status !== 'active' && <button className="section-test-close" onClick={onClose} aria-label="Cerrar prueba"><X size={19}/></button>}

      {status === 'instructions' && <>
        <div className="section-test-icon"><ClipboardCheck size={28}/></div>
        <small>Evaluación de la sección</small>
        <h2 id="section-test-title">Prueba de {algorithm.name}</h2>
        <p>Responderás {test.questions.length} preguntas. Necesitas al menos un 60% para aprobar.</p>
        <div className="section-test-warning">
          <ShieldAlert size={22}/>
          <div><strong>Regla contra copia</strong><span>Si cambias de sección, pestaña o ventana, recargas o sales de la página, el intento se registra como copia y la prueba de este tema queda bloqueada durante 45 minutos.</span></div>
        </div>
        <div className="section-test-actions">
          <button className="secondary" onClick={onClose}>Ahora no</button>
          <button className="primary" onClick={begin}>Comenzar prueba</button>
        </div>
      </>}

      {status === 'active' && question && <>
        <header className="section-test-progress">
          <div><small>Prueba en curso · No cambies de ventana</small><strong id="section-test-title">{algorithm.name}</strong></div>
          <span>{questionIndex + 1}/{test.questions.length}</span>
        </header>
        <div className="section-test-progressbar"><span style={{ width: `${(questionIndex + 1) / test.questions.length * 100}%` }}/></div>
        <fieldset className="section-test-question">
          <legend>{question.prompt}</legend>
          {question.choices.map(choice => <label className={selectedChoice === choice.id ? 'selected' : ''} key={choice.id}>
            <input type="radio" name={question.id} checked={selectedChoice === choice.id} onChange={() => selectAnswer(choice.id)}/>
            <span>{choice.label}</span>
          </label>)}
        </fieldset>
        <div className="section-test-actions right">
          <button className="primary" disabled={!selectedChoice} onClick={advance}>{questionIndex === test.questions.length - 1 ? 'Entregar prueba' : 'Siguiente pregunta'}</button>
        </div>
      </>}

      {status === 'cancelled' && <div className="section-test-result cancelled">
        <AlertTriangle size={34}/><small>Intento anulado</small>
        <h2 id="section-test-title">Prueba cancelada por copia</h2>
        <p>{violationLabels[violation] ?? 'DSA Lab detectó que se abandonó la evaluación.'}</p>
        <span>El intento quedó guardado y no podrás repetir esta prueba durante 45 minutos.</span>
        <button className="primary" onClick={onClose}>Entendido</button>
      </div>}

      {status === 'completed' && result && <div className={`section-test-result ${result.passed ? 'passed' : 'failed'}`}>
        {result.passed ? <CheckCircle2 size={36}/> : <XCircle size={36}/>}<small>Prueba finalizada</small>
        <h2 id="section-test-title">{result.passed ? 'Sección aprobada' : 'Sigue practicando'}</h2>
        <strong>{result.correct}/{result.total} · {result.percentage}%</strong>
        <p>{result.passed ? 'Comprendiste los conceptos principales de esta sección.' : 'Repasa la explicación y vuelve a intentarlo cuando estés preparado.'}</p>
        <button className="primary" onClick={onClose}>Volver a la sección</button>
      </div>}
    </section>
  </div>;
}
