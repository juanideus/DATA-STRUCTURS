import { algorithms } from '../src/data/algorithms.js';
import { createSectionTest, gradeSectionTest } from '../src/logic/sectionTests.js';

const failures = [];
let questionCount = 0;
const questionCombinations = new Set();
const visualTypes = new Set();
const forbiddenInterfaceTerms = /DSA Lab|panel|página|sección|laboratorio|visualizador|ficha|catálogo/i;

for (const algorithm of algorithms) {
  const sectionTest = createSectionTest(algorithm);
  questionCount += sectionTest.questions.length;
  questionCombinations.add(sectionTest.questions.map(question => question.id).join('|'));
  const visualQuestions = sectionTest.questions.filter(question => question.visual);
  visualQuestions.forEach(question => visualTypes.add(question.visual.type));

  if (sectionTest.questions.length !== 10) {
    failures.push(`${algorithm.id}: genera ${sectionTest.questions.length} preguntas en vez de 10.`);
  }
  if (new Set(sectionTest.questions.map(question => question.prompt)).size !== sectionTest.questions.length) {
    failures.push(`${algorithm.id}: contiene preguntas repetidas.`);
  }
  if (visualQuestions.length !== 1) failures.push(`${algorithm.id}: debe incluir exactamente una pregunta visual.`);

  if (algorithm.id === 'complejidad-algoritmica') {
    const codeQuestions = sectionTest.questions.filter(question => question.code);
    const assessedComplexities = new Set(codeQuestions.flatMap(question => question.choices.filter(choice => choice.correct).map(choice => choice.label)));
    if (codeQuestions.length !== 9) failures.push(`${algorithm.id}: debe incluir 9 ejercicios de análisis de código.`);
    if (!codeQuestions.some(question => /for[\s\S]*for/.test(question.code))) failures.push(`${algorithm.id}: falta un ejemplo con for anidados.`);
    if (!codeQuestions.some(question => /while[\s\S]*while/.test(question.code))) failures.push(`${algorithm.id}: falta un ejemplo con while anidados.`);
    for (const expected of ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)']) {
      if (!assessedComplexities.has(expected)) failures.push(`${algorithm.id}: no evalúa ${expected} mediante código.`);
    }
  }

  for (const question of sectionTest.questions) {
    if (question.choices.length < 3) failures.push(`${algorithm.id}/${question.id}: tiene menos de 3 alternativas.`);
    if (question.choices.filter(choice => choice.correct).length !== 1) {
      failures.push(`${algorithm.id}/${question.id}: debe tener exactamente una respuesta correcta.`);
    }
    const assessedText = [question.prompt, question.explanation, ...question.choices.map(choice => choice.label)].join(' ');
    if (forbiddenInterfaceTerms.test(assessedText)) {
      failures.push(`${algorithm.id}/${question.id}: evalúa información de la interfaz en vez de materia.`);
    }
  }

  const correctAnswers = Object.fromEntries(sectionTest.questions.map(question => [
    question.id,
    question.choices.find(choice => choice.correct)?.id,
  ]));
  const perfectGrade = gradeSectionTest(sectionTest, correctAnswers);
  if (!perfectGrade.passed || perfectGrade.percentage !== 100) {
    failures.push(`${algorithm.id}: la corrección de una prueba perfecta no entrega 100%.`);
  }
}

if (questionCombinations.size < algorithms.length * 0.75) {
  failures.push(`solo existen ${questionCombinations.size} combinaciones de preguntas para ${algorithms.length} temas.`);
}
if (visualTypes.size < 20) failures.push(`solo existen ${visualTypes.size} tipos de diagramas conceptuales.`);

if (failures.length) {
  console.error(`AUDITORÍA DE PRUEBAS POR SECCIÓN FALLÓ (${failures.length} errores):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PRUEBAS POR SECCIÓN OK: ${algorithms.length} temas, ${questionCount} preguntas, ${questionCombinations.size} combinaciones y ${visualTypes.size} diagramas verificados.`);
