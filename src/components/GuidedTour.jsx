import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, X } from 'lucide-react';
import { useDialogFocus } from '../accessibility/useDialogFocus.js';
import { useLanguage } from '../i18n.jsx';

export const TOUR_STEPS = Object.freeze([
  { selector:'[data-tour="sidebar"]', title:'Elige qué quieres aprender', description:'El menú reúne todos los temas por categoría. También puedes buscar una estructura o algoritmo por su nombre.' },
  { selector:'[data-tour="visualizer"]', title:'Observa cómo cambia la estructura', description:'Aquí verás cada inserción, eliminación, recorrido o comparación. El elemento activo se destaca durante la ejecución.' },
  { selector:'[data-tour="operations"]', title:'Experimenta con tus propios datos', description:'Escribe valores o índices y ejecuta las operaciones disponibles. El mensaje inferior explica el resultado.' },
  { selector:'.player', title:'Controla la animación', description:'Avanza o retrocede paso a paso, pausa cuando quieras y ajusta la velocidad para estudiar con calma.' },
  { selector:'[data-tour="code"]', title:'Relaciona la animación con el código', description:'La línea activa avanza junto con la visualización. Puedes alternar entre Java y pseudocódigo.' },
  { selector:'[data-tour="variables"]', title:'Revisa las variables en tiempo real', description:'Este panel muestra valores, índices y decisiones internas para que comprendas qué está haciendo el algoritmo.' },
  { selector:'[data-tour="test"]', title:'Comprueba lo aprendido', description:'Cuando termines de practicar, responde diez preguntas conceptuales sobre la materia de esta sección.' },
]);

const ENGLISH_STEPS = [
  ['Choose what you want to learn','The menu groups every topic by category. You can also search for a structure or algorithm by name.'],
  ['Watch the structure change','Here you will see every insertion, deletion, traversal, or comparison. The active element is highlighted during execution.'],
  ['Experiment with your own data','Enter values or indices and run the available operations. The message below explains the result.'],
  ['Control the animation','Move forward or backward step by step, pause whenever you want, and adjust the speed to study comfortably.'],
  ['Connect the animation with the code','The active line advances with the visualization. You can switch between Java and pseudocode.'],
  ['Inspect variables in real time','This panel shows values, indices, and internal decisions so you can understand what the algorithm is doing.'],
  ['Check what you learned','After practicing, answer ten conceptual questions about this section.'],
];

export default function GuidedTour({ onClose, onStepChange }) {
  const { language } = useLanguage();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const closeTimerRef = useRef(null);
  const sourceStep = TOUR_STEPS[stepIndex];
  const step = language === 'en' ? { ...sourceStep, title: ENGLISH_STEPS[stepIndex][0], description: ENGLISH_STEPS[stepIndex][1] } : sourceStep;
  const tc = language === 'en'
    ? { close:'Close tour', label:'HOW IT WORKS', step:'Step', of:'of', skip:'Skip tour', back:'Back', finish:'Finish tour', next:'Next tour step', finishText:'Finish', nextText:'Next' }
    : { close:'Cerrar recorrido', label:'CÓMO FUNCIONA', step:'Paso', of:'de', skip:'Omitir recorrido', back:'Atrás', finish:'Finalizar recorrido', next:'Siguiente paso del recorrido', finishText:'Finalizar', nextText:'Siguiente' };

  const requestClose = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }, [leaving, onClose]);
  const dialogRef = useDialogFocus({ onClose: requestClose });

  useEffect(() => {
    const updateTarget = () => {
      const target = document.querySelector(step.selector);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setTargetRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };
    const target = document.querySelector(step.selector);
    updateTarget();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reduceMotion === 'true';
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: step.selector.includes('sidebar') ? 'nearest' : 'center' });
    const timer = window.setTimeout(updateTarget, reduceMotion ? 0 : 420);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [step]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const moveTo = nextIndex => {
    const boundedIndex = Math.max(0, Math.min(TOUR_STEPS.length - 1, nextIndex));
    setStepIndex(boundedIndex);
    onStepChange(boundedIndex);
  };
  const finishOrContinue = () => {
    if (stepIndex === TOUR_STEPS.length - 1) requestClose();
    else moveTo(stepIndex + 1);
  };
  const cardStyle = targetRect ? {
    left: `${Math.max(16, Math.min(window.innerWidth - 376, targetRect.left + targetRect.width + 18))}px`,
    top: `${Math.max(16, Math.min(window.innerHeight - 280, targetRect.top + Math.min(28, targetRect.height / 3)))}px`,
  } : undefined;

  return <div className={`guided-tour ${leaving ? 'is-leaving' : ''}`} role="presentation">
    <button className="guided-tour-backdrop" type="button" onClick={requestClose} aria-label={tc.close}/>
    {targetRect && <div className="guided-tour-spotlight" style={{ left:targetRect.left - 7, top:targetRect.top - 7, width:targetRect.width + 14, height:targetRect.height + 14 }}/>} 
    <section ref={dialogRef} tabIndex="-1" className="guided-tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="guided-tour-title">
      <header><span><CircleHelp size={16}/> {tc.label}</span><button type="button" onClick={requestClose} aria-label={tc.close}><X size={17}/></button></header>
      <div className="guided-tour-progress" aria-label={`${tc.step} ${stepIndex + 1} ${tc.of} ${TOUR_STEPS.length}`}>
        {TOUR_STEPS.map((_, index) => <i className={index <= stepIndex ? 'active' : ''} key={index}/>)}
      </div>
      <small>{tc.step} {stepIndex + 1} {tc.of} {TOUR_STEPS.length}</small>
      <h2 id="guided-tour-title">{step.title}</h2>
      <p>{step.description}</p>
      <footer>
        <button type="button" className="tour-skip" onClick={requestClose}>{tc.skip}</button>
        <div>
          {stepIndex > 0 && <button type="button" className="tour-previous" onClick={() => moveTo(stepIndex - 1)}><ArrowLeft size={15}/> {tc.back}</button>}
          <button type="button" className="tour-next" aria-label={stepIndex === TOUR_STEPS.length - 1 ? tc.finish : tc.next} onClick={finishOrContinue}>{stepIndex === TOUR_STEPS.length - 1 ? tc.finishText : tc.nextText}{stepIndex < TOUR_STEPS.length - 1 && <ArrowRight size={15}/>}</button>
        </div>
      </footer>
    </section>
  </div>;
}
