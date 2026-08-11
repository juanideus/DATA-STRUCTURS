import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import {
  CHALLENGE_ALGORITHM_IDS,
  challengeOutcomeMatches,
  createChallenge,
  recordChallengeAttempt,
  supportsChallenges,
} from '../src/logic/challenges.js';
import { DEFAULT_GRAPH_EDGES, executeOperation } from '../src/logic/operations.js';

let generated = 0;
let verified = 0;

for (const algorithmId of CHALLENGE_ALGORITHM_IDS) {
  const algorithm = algorithms.find(item => item.id === algorithmId);
  assert.ok(algorithm, `No existe el algoritmo ${algorithmId}.`);
  assert.equal(supportsChallenges(algorithm), true);

  const completeTree = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15];
  const fullLinear = Array.from({ length: 15 }, (_, index) => index + 1);
  const scenarios = ['array', 'pila', 'cola', 'bst', 'avl'].includes(algorithmId)
    ? [[...algorithm.values], [], [10], ['bst', 'avl'].includes(algorithmId) ? completeTree : fullLinear]
    : [[...algorithm.values]];

  for (let attempt = 0; attempt < scenarios.length * 10; attempt += 1) {
    const values = scenarios[Math.floor(attempt / 10)];
    const challenge = createChallenge(algorithm, values, attempt);
    generated += 1;
    assert.ok(challenge, `${algorithmId} no generó el desafío ${attempt}.`);
    assert.equal(challenge.algorithmId, algorithmId);
    assert.ok(challenge.question.length >= 20, `${algorithmId} tiene una pregunta demasiado breve.`);
    assert.ok(challenge.hint.length >= 20, `${algorithmId} tiene una pista incompleta.`);
    assert.ok(challenge.explanation.length >= 20, `${algorithmId} tiene una explicación incompleta.`);
    assert.ok(challenge.options.length >= 2 && challenge.options.length <= 4);
    assert.equal(new Set(challenge.options.map(option => option.label)).size, challenge.options.length);
    assert.ok(challenge.options.some(option => option.id === challenge.correctChoiceId));

    const result = executeOperation({
      algorithm,
      actionId: challenge.action.id,
      fields: challenge.action.fields,
      values: [...values],
      edges: DEFAULT_GRAPH_EDGES.map(edge => [...edge]),
      initialValues: [...values],
      initialEdges: DEFAULT_GRAPH_EDGES.map(edge => [...edge]),
    });
    assert.ok(result, `${algorithmId} no ejecutó ${challenge.action.id}.`);
    assert.notEqual(result.ok, false, `${algorithmId}: ${result.message}`);
    assert.equal(
      challengeOutcomeMatches(challenge, result.values),
      true,
      `${algorithmId}: la predicción no coincide con ${challenge.action.id}.`,
    );
    verified += 1;
  }
}

const first = recordChallengeAttempt(null, 'array', true, false);
const second = recordChallengeAttempt(first, 'array', false, true);
const third = recordChallengeAttempt(second, 'avl', true, false);
assert.deepEqual(
  { attempts: third.attempts, correct: third.correct, hints: third.hints },
  { attempts: 3, correct: 2, hints: 1 },
);
assert.deepEqual(third.byAlgorithm.array, { attempts: 2, correct: 1 });
assert.deepEqual(third.byAlgorithm.avl, { attempts: 1, correct: 1 });

console.log(`DESAFÍOS OK: ${generated} generados y ${verified} resultados verificados en ${CHALLENGE_ALGORITHM_IDS.length} estructuras.`);
