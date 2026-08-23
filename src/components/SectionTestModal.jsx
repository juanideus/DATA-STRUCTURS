import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert, X, XCircle } from 'lucide-react';
import { createSectionTest, gradeSectionTest, lockSectionTest, saveSectionTestResult } from '../logic/sectionTests.js';
import { translateLearningText, useLanguage } from '../i18n.jsx';

const violationLabels = {
  hidden: 'Se cambió de pestaña o se ocultó DSA Lab.',
  blur: 'La ventana de DSA Lab perdió el foco.',
  navigation: 'Se intentó cambiar de sección durante la prueba.',
  history: 'Se utilizó la navegación del navegador durante la prueba.',
  unload: 'Se cerró o recargó la página durante la prueba.',
};
const LINEAR_VISUAL_TYPES = new Set(['array', 'queue', 'deque', 'linked-list', 'skip-list', 'polynomial', 'cache']);
const TREE_VISUAL_TYPES = new Set(['tree', 'general-tree', 'nary-tree', 'binary-tree', 'bst', 'avl', 'red-black', 'splay', 'threaded-tree', 'heap', 'range-tree', 'btree', 'merkle', 'trie', 'expression', 'ast']);
const GRID_VISUAL_TYPES = new Set(['matrix', 'sparse-matrix', 'board', 'sudoku', 'maze', 'spatial']);

function QuestionVisual({ visual, language }) {
  if (!visual) return null;
  const type = visual.type;

  let drawing;
  if (LINEAR_VISUAL_TYPES.has(type)) {
    drawing = <>
      {[0, 1, 2, 3].map(index => <g key={index}>
        <rect x={32 + index * 62} y={58 - (type === 'skip-list' && index % 2 ? 14 : 0)} width="44" height="38" rx="7"/>
        <text x={54 + index * 62} y={82 - (type === 'skip-list' && index % 2 ? 14 : 0)}>{type === 'polynomial' ? `${index + 1}x` : String.fromCharCode(65 + index)}</text>
        {index < 3 && <path d={`M ${77 + index * 62} 77 L ${91 + index * 62} 77`}/>}
      </g>)}
      {type === 'queue' && <><text className="diagram-label" x="20" y="118">front</text><text className="diagram-label" x="235" y="118">rear</text></>}
      {type === 'deque' && <><path d="M22 77 L30 77"/><path d="M282 77 L292 77"/></>}
      {type === 'linked-list' && <text className="diagram-label" x="252" y="82">null</text>}
      {type === 'cache' && <text className="diagram-label" x="75" y="122">{language === 'en' ? 'least recent → most recent' : 'menos reciente → más reciente'}</text>}
    </>;
  } else if (type === 'stack') {
    drawing = <>{[0, 1, 2, 3].map(index => <g key={index}><rect x="112" y={104 - index * 28} width="76" height="24" rx="5"/><text x="150" y={121 - index * 28}>{String.fromCharCode(65 + index)}</text></g>)}<path d="M205 31 L190 31"/><text className="diagram-label" x="210" y="35">top</text></>;
  } else if (TREE_VISUAL_TYPES.has(type)) {
    const root = type === 'trie' ? 'P' : type === 'expression' ? '+' : type === 'ast' ? '=' : type === 'heap' ? '90' : type === 'bst' ? '50' : type === 'avl' ? '40' : type === 'splay' ? '↑' : 'R';
    drawing = <>
      <path d="M150 40 L92 77 M150 40 L208 77 M92 77 L60 112 M92 77 L120 112 M208 77 L180 112 M208 77 L240 112"/>
      {[[150,32,root],[92,76,type === 'trie'?'R':'A'],[208,76,type === 'trie'?'E':'B'],[60,116,'C'],[120,116,'D'],[180,116,'E'],[240,116,type === 'trie'?'•':'F']].map(([x,y,label], index)=><g key={index}><circle cx={x} cy={y} r={index?16:19}/><text x={x} y={y+4}>{label}</text></g>)}
      {type === 'threaded-tree' && <path className="diagram-dashed" d="M60 116 C35 70 105 48 130 36"/>}
      {type === 'btree' && <rect className="diagram-accent" x="122" y="15" width="56" height="34" rx="7"/>}
      {type === 'merkle' && <text className="diagram-label" x="132" y="8">{language === 'en' ? 'root hash' : 'hash raíz'}</text>}
      {type === 'heap' && <text className="diagram-label" x="124" y="8">{language === 'en' ? 'maximum' : 'máximo'}</text>}
      {type === 'avl' && <><text className="diagram-label" x="150" y="8">BF = 0</text><text className="diagram-label" x="92" y="53">BF = 0</text></>}
      {type === 'red-black' && <><circle className="diagram-red-node" cx="92" cy="76" r="16"/><circle className="diagram-red-node" cx="208" cy="76" r="16"/><text x="92" y="80">R</text><text x="208" y="80">R</text></>}
      {type === 'splay' && <path className="diagram-route" d="M60 116 C60 42 118 20 145 28"/>}
      {type === 'bst' && <><text x="92" y="80">25</text><text x="208" y="80">75</text></>}
    </>;
  } else if (type === 'graph' || type === 'route') {
    drawing = <>
      <path d="M55 85 L120 38 L185 87 L250 45 M55 85 L145 120 L185 87 M145 120 L250 45"/>
      {[[55,85,'A'],[120,38,'B'],[185,87,'C'],[250,45,'D'],[145,120,'E']].map(([x,y,label])=><g key={label}><circle cx={x} cy={y} r="17"/><text x={x} y={y+4}>{label}</text></g>)}
      {type === 'route' && <path className="diagram-route" d="M55 85 L120 38 L185 87 L250 45"/>}
      {type === 'route' && <><text className="diagram-label" x="82" y="55">2</text><text className="diagram-label" x="150" y="55">3</text></>}
    </>;
  } else if (GRID_VISUAL_TYPES.has(type)) {
    drawing = <>
      {[0,1,2,3].flatMap(row => [0,1,2,3].map(column => <rect key={`${row}-${column}`} className={(type === 'sparse-matrix' && ![[0,2],[2,1],[3,3]].some(([r,c])=>r===row&&c===column)) || (type === 'maze' && [[0,1],[1,1],[2,3]].some(([r,c])=>r===row&&c===column)) ? 'diagram-muted' : ''} x={91 + column*30} y={20 + row*30} width="28" height="28" rx="3"/>))}
      {type === 'board' && <><text x="105" y="42">♛</text><text x="195" y="102">♛</text></>}
      {type === 'sudoku' && <><text x="105" y="42">5</text><text x="165" y="72">7</text><text x="135" y="132">9</text></>}
      {type === 'maze' && <path className="diagram-route" d="M105 125 L105 95 L165 95 L165 65 L195 65 L195 35"/>}
      {type === 'spatial' && <path className="diagram-accent-line" d="M151 20 L151 140 M91 80 L211 80"/>}
      {type === 'sparse-matrix' && <text className="diagram-label" x="225" y="76">{language === 'en' ? 'only ≠ 0' : 'solo ≠ 0'}</text>}
    </>;
  } else if (type === 'hash' || type === 'bloom') {
    drawing = <>
      <rect x="28" y="52" width="65" height="42" rx="8"/><text x="60" y="77">{language === 'en' ? 'key' : 'clave'}</text><path d="M96 73 L132 73"/>
      {[0,1,2,3,4].map(index=><g key={index}><rect className={type === 'bloom' && [0,2,4].includes(index)?'diagram-accent':''} x={138+index*28} y="55" width="24" height="36" rx="4"/><text x={150+index*28} y="78">{type === 'bloom' ? ([0,2,4].includes(index)?'1':'0') : index}</text></g>)}
      <text className="diagram-label" x="120" y="118">{type === 'bloom' ? (language === 'en' ? 'enabled bits' : 'bits activados') : (language === 'en' ? 'hash function → bucket' : 'función hash → cubeta')}</text>
    </>;
  } else if (type === 'hanoi') {
    drawing = <><path d="M65 115 L65 35 M150 115 L150 35 M235 115 L235 35 M30 116 L270 116"/>{[0,1,2].map(index=><rect key={index} x={42+index*8} y={96-index*17} width={46-index*16} height="12" rx="5"/>)}</>;
  } else if (type === 'recursion') {
    drawing = <>{[0,1,2,3].map(index=><g key={index}><rect x={35+index*45} y={30+index*22} width="92" height="32" rx="7"/><text x={81+index*45} y={50+index*22}>f({4-index})</text></g>)}</>;
  } else if (type === 'complexity') {
    drawing = <><path d="M45 125 L45 25 M45 125 L265 125"/><path className="diagram-route" d="M45 120 C100 110 185 86 260 35"/><path d="M45 120 C135 115 210 105 260 92"/><text className="diagram-label" x="222" y="30">O(n²)</text><text className="diagram-label" x="222" y="88">O(log n)</text></>;
  } else if (type === 'oop') {
    drawing = <><rect x="105" y="20" width="100" height="65" rx="8"/><text x="155" y="43">{language === 'en' ? 'Class' : 'Clase'}</text><path d="M115 52 L195 52"/><text className="diagram-label" x="125" y="70">{language === 'en' ? 'state + methods' : 'estado + métodos'}</text><path d="M155 87 L95 112 M155 87 L215 112"/><circle cx="90" cy="120" r="20"/><circle cx="220" cy="120" r="20"/><text className="diagram-label" x="72" y="148">{language === 'en' ? 'object' : 'objeto'}</text><text className="diagram-label" x="202" y="148">{language === 'en' ? 'object' : 'objeto'}</text></>;
  } else {
    drawing = <><circle cx="80" cy="80" r="28"/><circle cx="150" cy="48" r="28"/><circle cx="220" cy="80" r="28"/><path d="M107 68 L123 60 M177 60 L193 68"/><text x="80" y="84">idea</text><text x="150" y="52">regla</text><text x="220" y="84">paso</text></>;
  }

  return <figure className={`section-test-diagram diagram-${type}`} aria-label={`${language === 'en' ? 'Concept diagram' : 'Diagrama conceptual'}: ${translateLearningText(visual.caption, language)}`}>
    <svg viewBox="0 0 300 155" role="img" aria-hidden="true">{drawing}</svg>
    <figcaption>{translateLearningText(visual.caption, language)}</figcaption>
  </figure>;
}

export default function SectionTestModal({ algorithm, externalViolation, onClose, onActiveChange, onLockout }) {
  const { language } = useLanguage();
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
  const lt = value => translateLearningText(value, language);
  const c = language === 'en' ? {
    test:'Test', testName:name=>`Test: ${name}`, close:'Close test', evaluation:'Section assessment', answer:`You will answer ${test.questions.length} questions. You need at least 60% to pass.`, anti:'Anti-cheating rule',
    warning:'If you change section, tab, or window, reload, or leave the page, the attempt is recorded as cheating and this topic test is locked for 45 minutes.', later:'Not now', begin:'Start test',
    active:'Test in progress · Do not change windows', submit:'Submit test', next:'Next question', annulled:'Attempt voided', cancelled:'Test cancelled due to cheating',
    detected:'DSA Lab detected that the assessment was abandoned.', saved:'The attempt was saved and you cannot retake this test for 45 minutes.', understood:'Understood',
    finished:'Test completed', passed:'Section passed', practice:'Keep practicing', passedText:'You understood the main concepts in this section.', failedText:'Review the explanation and try again when you are ready.', back:'Return to section',
  } : {
    test:'Prueba', testName:name=>`Prueba de ${name}`, close:'Cerrar prueba', evaluation:'Evaluación de la sección', answer:`Responderás ${test.questions.length} preguntas. Necesitas al menos un 60% para aprobar.`, anti:'Regla contra copia',
    warning:'Si cambias de sección, pestaña o ventana, recargas o sales de la página, el intento se registra como copia y la prueba de este tema queda bloqueada durante 45 minutos.', later:'Ahora no', begin:'Comenzar prueba',
    active:'Prueba en curso · No cambies de ventana', submit:'Entregar prueba', next:'Siguiente pregunta', annulled:'Intento anulado', cancelled:'Prueba cancelada por copia',
    detected:'DSA Lab detectó que se abandonó la evaluación.', saved:'El intento quedó guardado y no podrás repetir esta prueba durante 45 minutos.', understood:'Entendido',
    finished:'Prueba finalizada', passed:'Sección aprobada', practice:'Sigue practicando', passedText:'Comprendiste los conceptos principales de esta sección.', failedText:'Repasa la explicación y vuelve a intentarlo cuando estés preparado.', back:'Volver a la sección',
  };

  return <div className="section-test-overlay" role="dialog" aria-modal="true" aria-label={c.testName(algorithm.name)}>
    <section className="section-test-modal">
      {status !== 'active' && <button className="section-test-close" onClick={onClose} aria-label={c.close}><X size={19}/></button>}

      {status === 'instructions' && <>
        <div className="section-test-icon"><ClipboardCheck size={28}/></div>
        <small>{c.evaluation}</small>
        <h2 id="section-test-title">{c.testName(algorithm.name)}</h2>
        <p>{c.answer}</p>
        <div className="section-test-warning">
          <ShieldAlert size={22}/>
          <div><strong>{c.anti}</strong><span>{c.warning}</span></div>
        </div>
        <div className="section-test-actions">
          <button className="secondary" onClick={onClose}>{c.later}</button>
          <button className="primary" onClick={begin}>{c.begin}</button>
        </div>
      </>}

      {status === 'active' && question && <>
        <header className="section-test-progress">
          <div><small>{c.active}</small><strong id="section-test-title">{algorithm.name}</strong></div>
          <span>{questionIndex + 1}/{test.questions.length}</span>
        </header>
        <div className="section-test-progressbar"><span style={{ width: `${(questionIndex + 1) / test.questions.length * 100}%` }}/></div>
        <fieldset className="section-test-question">
          <legend>{language === 'en' && question.promptEn ? question.promptEn : lt(question.prompt)}</legend>
          <QuestionVisual visual={question.visual} language={language}/>
          {question.code && <pre className="section-test-code" aria-label={language === 'en' ? 'Code to analyze' : 'Código para analizar'}><code>{question.code}</code></pre>}
          {question.choices.map(choice => <label className={selectedChoice === choice.id ? 'selected' : ''} key={choice.id}>
            <input type="radio" name={question.id} checked={selectedChoice === choice.id} onChange={() => selectAnswer(choice.id)}/>
            <span>{lt(choice.label)}</span>
          </label>)}
        </fieldset>
        <div className="section-test-actions right">
          <button className="primary" disabled={!selectedChoice} onClick={advance}>{questionIndex === test.questions.length - 1 ? c.submit : c.next}</button>
        </div>
      </>}

      {status === 'cancelled' && <div className="section-test-result cancelled">
        <AlertTriangle size={34}/><small>{c.annulled}</small>
        <h2 id="section-test-title">{c.cancelled}</h2>
        <p>{lt(violationLabels[violation] ?? c.detected)}</p>
        <span>{c.saved}</span>
        <button className="primary" onClick={onClose}>{c.understood}</button>
      </div>}

      {status === 'completed' && result && <div className={`section-test-result ${result.passed ? 'passed' : 'failed'}`}>
        {result.passed ? <CheckCircle2 size={36}/> : <XCircle size={36}/>}<small>{c.finished}</small>
        <h2 id="section-test-title">{result.passed ? c.passed : c.practice}</h2>
        <strong>{result.correct}/{result.total} · {result.percentage}%</strong>
        <p>{result.passed ? c.passedText : c.failedText}</p>
        <button className="primary" onClick={onClose}>{c.back}</button>
      </div>}
    </section>
  </div>;
}
