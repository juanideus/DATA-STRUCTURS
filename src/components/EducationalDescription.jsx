import { AlertTriangle, BookOpen, CheckCircle2, Cog, Gauge, Lightbulb, ListChecks, MapPinned } from 'lucide-react';
import { completeJavaSnippet, getBeginnerJava } from '../data/beginnerJava.js';
import { getEducationalDescription } from '../data/educationalDescriptions.js';
import { getGuideJavaExample } from '../data/guideJavaExamples.js';
import { getOperationDefinition } from '../logic/operations.js';
import { useLanguage } from '../i18n.jsx';
import { getEnglishEducationalDescription } from '../data/educationalDescriptionsEnglish.js';

function DetailList({ icon: Icon, title, items, tone = '' }) {
  return <article className={`description-list-card ${tone}`}>
    <header><Icon size={17}/><strong>{title}</strong></header>
    <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
  </article>;
}

export default function EducationalDescription({ algorithm }) {
  const { language } = useLanguage();
  const description = language === 'en' ? getEnglishEducationalDescription(algorithm) : getEducationalDescription(algorithm.id);
  if (!description) return null;
  const firstAction = getOperationDefinition(algorithm).actions[0];
  const guideExample = getGuideJavaExample(algorithm.id);
  const javaExample = guideExample?.code
    ? completeJavaSnippet(guideExample.code, algorithm.id)
    : getBeginnerJava(algorithm, firstAction.id);
  const javaLines = javaExample.split('\n');

  const copy = language === 'en' ? {
    complete:'Complete guide',what:'What is',internal:'How it works internally',imagine:'A simple way to picture it',understand:'Understanding it step by step',
    deepA:'Begin by observing how',deepB:'Then compare it with',deepC:'and identify which data changes, which data remains unchanged, and which condition stops the process.',
    deep2:'Do not memorize only the result: follow the references, indices, nodes, and decisions shown in the visualization. The advantages explain when this solution is useful; the limitations show when another structure or algorithm may be more suitable.',
    key:'Key operations and concepts',advantages:'Advantages',limits:'Limitations and precautions',uses:'Where it is used',mainComplexity:'Main complexity',
    complexityText:'Complexity describes how the amount of work grows as the input grows. The code panel above lets you observe every operation step by step.',
    javaExample:'Basic Java example',exampleTitle:`Basic ${algorithm.name} example`,exampleText:`This fragment demonstrates an essential ${algorithm.name} operation and connects the Java statements with the visualization above.`,
    observe:'What to observe',observeText:'Identify the input data, the main condition, the state change, and the value returned by the method when applicable.',important:'Important idea:',
  } : {
    complete:'Guía completa',what:'¿Qué es',internal:'Cómo funciona internamente',imagine:'Ejemplo para imaginarlo',understand:'Para comprenderlo paso a paso',
    deepA:'Comienza observando cómo se realiza',deepB:'Después compáralo con',deepC:'y fíjate en qué datos cambian, cuáles permanecen iguales y qué condición detiene el proceso.',
    deep2:'No memorices solamente el resultado: sigue las referencias, índices, nodos o decisiones que aparecen en la visualización. Las ventajas explican cuándo conviene elegir esta solución; las limitaciones muestran cuándo otra estructura o algoritmo podría ser más adecuado.',
    key:'Operaciones y conceptos clave',advantages:'Ventajas',limits:'Limitaciones y cuidados',uses:'Dónde se utiliza',mainComplexity:'Complejidad principal',
    complexityText:'La complejidad indica cómo aumenta el trabajo cuando crece la cantidad de datos. El panel de código superior permite observar cada operación paso a paso.',
    javaExample:'Ejemplo básico en Java',exampleTitle:guideExample?.title ?? firstAction.label,exampleText:guideExample?.explanation ?? `Este fragmento muestra una operación esencial de ${algorithm.name}. Está escrito de forma directa para relacionar cada línea con la visualización superior.`,
    observe:'Qué debes observar',observeText:'Identifica los datos de entrada, la condición principal, el cambio realizado y el valor que devuelve el método cuando corresponde.',important:'Idea importante:',
  };

  return <section className="future-description available-description educational-description" aria-labelledby="educational-description-title">
    <div className="future-description-icon"><BookOpen size={20}/></div>
    <div className="educational-description-body">
      <span>{copy.complete}</span>
      <h2 id="educational-description-title">{copy.what} {algorithm.name}?</h2>
      <p className="description-lead">{description.definition}</p>

      <div className="description-overview-grid">
        <article>
          <header><Cog size={18}/><strong>{copy.internal}</strong></header>
          <p>{description.how}</p>
        </article>
        <article className="description-example-card">
          <header><Lightbulb size={18}/><strong>{copy.imagine}</strong></header>
          <p>{description.example}</p>
        </article>
      </div>

      <article className="description-deep-dive">
        <header><BookOpen size={18}/><strong>{copy.understand}</strong></header>
        <p>{copy.deepA} <b>{description.operations[0].toLowerCase()}</b>. {copy.deepB} <b>{description.operations[1].toLowerCase()}</b> {copy.deepC}</p>
        <p>{copy.deep2}</p>
      </article>

      <div className="description-card-grid">
        <DetailList icon={ListChecks} title={copy.key} items={description.operations}/>
        <DetailList icon={CheckCircle2} title={copy.advantages} items={description.strengths} tone="positive"/>
        <DetailList icon={AlertTriangle} title={copy.limits} items={description.limits} tone="warning"/>
        <DetailList icon={MapPinned} title={copy.uses} items={description.uses} tone="uses"/>
      </div>

      <div className="description-complexity-row">
        <Gauge size={18}/>
        <div><small>{copy.mainComplexity}</small><strong>{algorithm.complexity}</strong></div><p>{copy.complexityText}</p>
      </div>

      <div className="description-java-guide">
        <div className="description-java-copy">
          <small>{copy.javaExample}</small><h3>{copy.exampleTitle}</h3><p>{copy.exampleText}</p><strong>{copy.observe}</strong><p>{copy.observeText}</p>
        </div>
        <pre aria-label={`Ejemplo básico de ${algorithm.name} en Java`}><code>{javaLines.map((line, index) => <span className={line.trim().startsWith('// Método auxiliar utilizado arriba:') ? 'helper-method-label' : ''} key={`${index}-${line}`}><i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}</span>)}</code></pre>
      </div>

      <div className="description-tip"><Lightbulb size={17}/><p><strong>{copy.important}</strong> {description.tip}</p></div>
    </div>
  </section>;
}
