import { algorithms } from '../src/data/algorithms.js';
import { createSectionTest, gradeSectionTest } from '../src/logic/sectionTests.js';

const failures = [];
let questionCount = 0;

for (const algorithm of algorithms) {
  const sectionTest = createSectionTest(algorithm);
  questionCount += sectionTest.questions.length;

  if (sectionTest.questions.length !== 10) {
    failures.push(`${algorithm.id}: genera ${sectionTest.questions.length} preguntas en vez de 10.`);
  }
  if (new Set(sectionTest.questions.map(question => question.prompt)).size !== sectionTest.questions.length) {
    failures.push(`${algorithm.id}: contiene preguntas repetidas.`);
  }

  for (const question of sectionTest.questions) {
    if (question.choices.length < 3) failures.push(`${algorithm.id}/${question.id}: tiene menos de 3 alternativas.`);
    if (question.choices.filter(choice => choice.correct).length !== 1) {
      failures.push(`${algorithm.id}/${question.id}: debe tener exactamente una respuesta correcta.`);
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

if (failures.length) {
  console.error(`AUDITORÍA DE PRUEBAS POR SECCIÓN FALLÓ (${failures.length} errores):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PRUEBAS POR SECCIÓN OK: ${algorithms.length} temas y ${questionCount} preguntas conceptuales verificadas.`);
