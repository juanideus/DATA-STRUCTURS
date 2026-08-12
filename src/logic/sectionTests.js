import { algorithms } from '../data/algorithms.js';
import { getOperationDefinition } from './operations.js';

const THEORY_TYPES = new Set(['theory', 'complexity', 'oop', 'foundation']);
const TEST_LENGTH = 10;

const hash = value => [...String(value)].reduce((total, character) => (
  (total * 31 + character.charCodeAt(0)) >>> 0
), 17);

function rotate(values, seed) {
  if (!values.length) return values;
  const offset = hash(seed) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

const unique = values => [...new Set(values.filter(value => (
  value !== undefined && value !== null && String(value).trim()
)))];

function choices(correct, distractors, seed) {
  const values = unique([correct, ...distractors]).slice(0, 4);
  let fallback = 1;
  while (values.length < 3) {
    const value = `Alternativa ${fallback}`;
    if (!values.includes(value)) values.push(value);
    fallback += 1;
  }
  return rotate(values, seed).map((label, index) => ({
    id: `choice-${index}`,
    label: String(label),
    correct: String(label) === String(correct),
  }));
}

const firstCodeLine = algorithm => (
  algorithm.code.split('\n').map(line => line.trim()).find(Boolean) ?? algorithm.name
);

function createConceptualQuestions(algorithm) {
  const otherAlgorithms = algorithms.filter(item => item.id !== algorithm.id);
  const sameCategory = otherAlgorithms.filter(item => item.category === algorithm.category);
  const outsideCategory = otherAlgorithms.filter(item => item.category !== algorithm.category);
  const otherCategories = unique(outsideCategory.map(item => item.category));
  const otherComplexities = unique(otherAlgorithms.map(item => item.complexity));
  const shuffledOthers = rotate(otherAlgorithms, `${algorithm.id}-others`);
  const ownConcepts = unique(algorithm.complexity.split(/·|\||,/).map(value => value.trim()));
  const foreignConcepts = unique(otherAlgorithms.flatMap(item => (
    item.complexity.split(/·|\||,/).map(value => value.trim())
  ))).filter(value => !ownConcepts.includes(value));
  const isTheory = THEORY_TYPES.has(algorithm.type);
  const presentation = isTheory ? 'Guía teórica' : 'Práctica interactiva con visualización';

  const questions = [
    {
      id: 'category',
      prompt: `¿A qué sección pertenece «${algorithm.name}»?`,
      explanation: `${algorithm.name} está incluido en la sección ${algorithm.category}.`,
      choices: choices(algorithm.category, otherCategories, `${algorithm.id}-category`),
    },
    {
      id: 'complexity',
      prompt: `¿Qué complejidad o contenido principal muestra DSA Lab para «${algorithm.name}»?`,
      explanation: `La ficha del tema indica: ${algorithm.complexity}.`,
      choices: choices(algorithm.complexity, otherComplexities, `${algorithm.id}-complexity`),
    },
    {
      id: 'description',
      prompt: `¿Cuál descripción corresponde a «${algorithm.name}»?`,
      explanation: algorithm.description,
      choices: choices(
        algorithm.description,
        shuffledOthers.slice(0, 3).map(item => item.description),
        `${algorithm.id}-description`,
      ),
    },
    {
      id: 'same-category',
      prompt: `¿Qué otro tema pertenece a la misma sección que «${algorithm.name}»?`,
      explanation: `${sameCategory[0].name} también pertenece a ${algorithm.category}.`,
      choices: choices(sameCategory[0].name, outsideCategory.map(item => item.name), `${algorithm.id}-same-category`),
    },
    {
      id: 'recognize-topic',
      prompt: `¿Qué tema describe esta idea? «${algorithm.description}»`,
      explanation: `La definición corresponde a ${algorithm.name}.`,
      choices: choices(algorithm.name, shuffledOthers.map(item => item.name), `${algorithm.id}-recognize`),
    },
    {
      id: 'code-step',
      prompt: `¿Qué línea de pseudocódigo pertenece a «${algorithm.name}»?`,
      explanation: `La representación del tema incluye: «${firstCodeLine(algorithm)}».`,
      choices: choices(
        firstCodeLine(algorithm),
        shuffledOthers.map(firstCodeLine),
        `${algorithm.id}-code`,
      ),
    },
    {
      id: 'outside-category',
      prompt: `¿Cuál de estos temas NO pertenece a la sección ${algorithm.category}?`,
      explanation: `${outsideCategory[0].name} pertenece a ${outsideCategory[0].category}, no a ${algorithm.category}.`,
      choices: choices(outsideCategory[0].name, sameCategory.map(item => item.name), `${algorithm.id}-outside-category`),
    },
    {
      id: 'presentation',
      prompt: `¿Cómo se estudia «${algorithm.name}» dentro de DSA Lab?`,
      explanation: `${algorithm.name} se presenta como ${presentation.toLowerCase()}.`,
      choices: choices(presentation, [
        isTheory ? 'Práctica interactiva con visualización' : 'Guía teórica',
        'Configuración administrativa',
      ], `${algorithm.id}-presentation`),
    },
  ];

  if (isTheory) {
    questions.push({
      id: 'key-concept',
      prompt: `¿Qué concepto forma parte del contenido de «${algorithm.name}»?`,
      explanation: `La guía incluye el concepto «${ownConcepts[0]}».`,
      choices: choices(ownConcepts[0], foreignConcepts, `${algorithm.id}-key-concept`),
    });
    questions.push({
      id: 'foreign-concept',
      prompt: `¿Qué concepto NO corresponde al contenido principal de «${algorithm.name}»?`,
      explanation: `«${foreignConcepts[0]}» pertenece a otro tema del catálogo.`,
      choices: choices(foreignConcepts[0], ownConcepts, `${algorithm.id}-foreign-concept`),
    });
  } else {
    const actions = getOperationDefinition(algorithm).actions;
    const foreignActions = unique(outsideCategory.flatMap(item => (
      getOperationDefinition(item).actions.map(action => action.label)
    ))).filter(label => !actions.some(action => action.label === label));
    questions.push({
      id: 'operation-primary',
      prompt: `¿Qué operación puedes ejecutar en el visualizador de «${algorithm.name}»?`,
      explanation: `«${actions[0].label}» es una operación disponible en esta sección.`,
      choices: choices(actions[0].label, foreignActions, `${algorithm.id}-operation-primary`),
    });
    questions.push({
      id: 'operation-secondary',
      prompt: `¿Cuál es otra operación disponible en «${algorithm.name}»?`,
      explanation: `El panel de la sección también permite ejecutar «${actions[1].label}».`,
      choices: choices(actions[1].label, foreignActions, `${algorithm.id}-operation-secondary`),
    });
  }

  return questions.slice(0, TEST_LENGTH);
}

export function createSectionTest(algorithm) {
  return {
    id: `${algorithm.id}-${Date.now()}`,
    algorithmId: algorithm.id,
    algorithmName: algorithm.name,
    questions: createConceptualQuestions(algorithm),
  };
}

export function gradeSectionTest(test, answers) {
  const correct = test.questions.reduce((total, question) => (
    total + (question.choices.find(choice => choice.id === answers[question.id])?.correct ? 1 : 0)
  ), 0);
  const total = test.questions.length;
  return {
    correct,
    total,
    percentage: total ? Math.round(correct / total * 100) : 0,
    passed: total > 0 && correct / total >= 0.6,
  };
}

export const SECTION_TEST_STORAGE_KEY = 'dsa-section-test-results-v1';
export const SECTION_TEST_LOCK_STORAGE_KEY = 'dsa-section-test-locks-v1';
export const SECTION_TEST_LOCK_DURATION_MS = 45 * 60 * 1000;

function readSectionTestLocks() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SECTION_TEST_LOCK_STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function lockSectionTest(algorithmId, now = Date.now()) {
  const lockedUntil = now + SECTION_TEST_LOCK_DURATION_MS;
  try {
    const locks = readSectionTestLocks();
    window.localStorage.setItem(SECTION_TEST_LOCK_STORAGE_KEY, JSON.stringify({
      ...locks,
      [algorithmId]: lockedUntil,
    }));
  } catch {
    // La cancelación continúa aunque el navegador bloquee el almacenamiento local.
  }
  return lockedUntil;
}

export function getSectionTestLockedUntil(algorithmId, now = Date.now()) {
  const locks = readSectionTestLocks();
  const lockedUntil = Number(locks[algorithmId]) || 0;
  if (lockedUntil <= now && lockedUntil !== 0) {
    try {
      delete locks[algorithmId];
      window.localStorage.setItem(SECTION_TEST_LOCK_STORAGE_KEY, JSON.stringify(locks));
    } catch {
      // El bloqueo vencido se ignora aunque no pueda limpiarse del almacenamiento.
    }
    return 0;
  }
  return lockedUntil;
}

export function saveSectionTestResult(result) {
  try {
    const previous = JSON.parse(window.localStorage.getItem(SECTION_TEST_STORAGE_KEY) ?? '[]');
    const history = Array.isArray(previous) ? previous : [];
    window.localStorage.setItem(SECTION_TEST_STORAGE_KEY, JSON.stringify([...history.slice(-99), result]));
  } catch {
    // La evaluación continúa aunque el navegador bloquee el almacenamiento local.
  }
}
