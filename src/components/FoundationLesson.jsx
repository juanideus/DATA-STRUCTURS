import { AlertTriangle, CheckCircle2, Code2, Lightbulb } from 'lucide-react';
import { foundationLessonsById } from '../data/foundationLessons.js';

export default function FoundationLesson({ algorithm }) {
  const lesson = foundationLessonsById[algorithm.id];
  if (!lesson) return null;

  return <section className="complexity-lesson foundation-lesson" data-foundation-lesson={algorithm.id}>
    <article className="complexity-intro-card foundation-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>{lesson.name}</h2>
      <p>{lesson.intro}</p>
      <div className="complexity-foundations foundation-key-grid">
        {lesson.essentials.map(item => <div key={item.term}>
          <strong>{item.term}</strong><span>{item.label}</span><p>{item.text}</p>
        </div>)}
      </div>
    </article>

    <div className="foundation-section-grid">
      {lesson.sections.map((item, index) => <article key={item.title}>
        <span className="lesson-kicker">{String(index + 2).padStart(2, '0')} · CONCEPTO</span>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        {item.bullets.length > 0 && <ul>{item.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
        {item.code && <div className="foundation-code-wrap"><header><Code2 size={15}/><span>Ejemplo en Java</span></header><pre><code>{item.code}</code></pre></div>}
      </article>)}
    </div>

    <div className="foundation-review-grid">
      <article className="foundation-mistakes">
        <span className="lesson-kicker">ERRORES FRECUENTES</span>
        <h3>Qué debes revisar</h3>
        <ul>{lesson.mistakes.map(item => <li key={item}><AlertTriangle size={15}/><span>{item}</span></li>)}</ul>
      </article>
      <article className="foundation-checklist">
        <span className="lesson-kicker">GUÍA DE APLICACIÓN</span>
        <h3>Pasos para practicar</h3>
        <ol>{lesson.checklist.map(item => <li key={item}><CheckCircle2 size={15}/><span>{item}</span></li>)}</ol>
      </article>
    </div>

    <article className="complexity-summary-card foundation-summary-card">
      <Lightbulb size={20}/><div><span className="lesson-kicker">IDEA PARA RECORDAR</span><p>{lesson.remember}</p></div>
    </article>
  </section>;
}
