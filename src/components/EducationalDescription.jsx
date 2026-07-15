import { AlertTriangle, BookOpen, CheckCircle2, Cog, Gauge, Lightbulb, ListChecks, MapPinned } from 'lucide-react';
import { getBeginnerJava } from '../data/beginnerJava.js';
import { getEducationalDescription } from '../data/educationalDescriptions.js';
import { getGuideJavaExample } from '../data/guideJavaExamples.js';
import { getOperationDefinition } from '../logic/operations.js';

function DetailList({ icon: Icon, title, items, tone = '' }) {
  return <article className={`description-list-card ${tone}`}>
    <header><Icon size={17}/><strong>{title}</strong></header>
    <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
  </article>;
}

export default function EducationalDescription({ algorithm }) {
  const description = getEducationalDescription(algorithm.id);
  if (!description) return null;
  const firstAction = getOperationDefinition(algorithm).actions[0];
  const guideExample = getGuideJavaExample(algorithm.id);
  const javaExample = guideExample?.code ?? getBeginnerJava(algorithm, firstAction.id);
  const javaLines = javaExample.split('\n');

  return <section className="future-description available-description educational-description" aria-labelledby="educational-description-title">
    <div className="future-description-icon"><BookOpen size={20}/></div>
    <div className="educational-description-body">
      <span>Guía completa</span>
      <h2 id="educational-description-title">¿Qué es {algorithm.name}?</h2>
      <p className="description-lead">{description.definition}</p>

      <div className="description-overview-grid">
        <article>
          <header><Cog size={18}/><strong>Cómo funciona internamente</strong></header>
          <p>{description.how}</p>
        </article>
        <article className="description-example-card">
          <header><Lightbulb size={18}/><strong>Ejemplo para imaginarlo</strong></header>
          <p>{description.example}</p>
        </article>
      </div>

      <article className="description-deep-dive">
        <header><BookOpen size={18}/><strong>Para comprenderlo paso a paso</strong></header>
        <p>Comienza observando cómo se realiza <b>{description.operations[0].toLowerCase()}</b>. Después compáralo con <b>{description.operations[1].toLowerCase()}</b> y fíjate en qué datos cambian, cuáles permanecen iguales y qué condición detiene el proceso.</p>
        <p>No memorices solamente el resultado: sigue las referencias, índices, nodos o decisiones que aparecen en la visualización. Las ventajas explican cuándo conviene elegir esta solución; las limitaciones muestran cuándo otra estructura o algoritmo podría ser más adecuado.</p>
      </article>

      <div className="description-card-grid">
        <DetailList icon={ListChecks} title="Operaciones y conceptos clave" items={description.operations}/>
        <DetailList icon={CheckCircle2} title="Ventajas" items={description.strengths} tone="positive"/>
        <DetailList icon={AlertTriangle} title="Limitaciones y cuidados" items={description.limits} tone="warning"/>
        <DetailList icon={MapPinned} title="Dónde se utiliza" items={description.uses} tone="uses"/>
      </div>

      <div className="description-complexity-row">
        <Gauge size={18}/>
        <div><small>Complejidad principal</small><strong>{algorithm.complexity}</strong></div>
        <p>La complejidad indica cómo aumenta el trabajo cuando crece la cantidad de datos. El panel de código superior permite observar cada operación paso a paso.</p>
      </div>

      <div className="description-java-guide">
        <div className="description-java-copy">
          <small>Ejemplo básico en Java</small>
          <h3>{guideExample?.title ?? firstAction.label}</h3>
          <p>{guideExample?.explanation ?? `Este fragmento muestra una operación esencial de ${algorithm.name}. Está escrito de forma directa para relacionar cada línea con la visualización superior.`}</p>
          <strong>Qué debes observar</strong>
          <p>Identifica los datos de entrada, la condición principal, el cambio realizado y el valor que devuelve el método cuando corresponde.</p>
        </div>
        <pre aria-label={`Ejemplo básico de ${algorithm.name} en Java`}><code>{javaLines.map((line, index) => <span key={`${index}-${line}`}><i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}</span>)}</code></pre>
      </div>

      <div className="description-tip"><Lightbulb size={17}/><p><strong>Idea importante:</strong> {description.tip}</p></div>
    </div>
  </section>;
}
