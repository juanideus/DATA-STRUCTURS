import assert from 'node:assert/strict';
import { foundationLessons } from '../src/data/foundationLessons.js';
import {
  foundationLessonsEnglish,
  foundationLessonsEnglishById,
  getFoundationLessonEnglish,
} from '../src/data/foundationLessonsEnglish.js';

const sortedKeys = item => Object.keys(item).sort();
assert.equal(foundationLessonsEnglish.length, 17);
assert.equal(foundationLessonsEnglish.length, foundationLessons.length);
let sections = 0;
let examples = 0;
for (const original of foundationLessons) {
  const translated = getFoundationLessonEnglish(original.id);
  assert.ok(translated, `Missing English foundation lesson: ${original.id}`);
  assert.equal(foundationLessonsEnglishById[original.id], translated);
  assert.deepEqual(sortedKeys(translated), sortedKeys(original));
  for (const key of ['name', 'navName', 'scope', 'summary', 'pseudocode', 'intro', 'remember']) {
    assert.equal(typeof translated[key], 'string', `${original.id}/${key}`);
    assert.ok(translated[key].trim(), `${original.id}/${key} cannot be empty`);
  }
  for (const key of ['essentials', 'sections', 'mistakes', 'checklist', 'values']) {
    assert.equal(translated[key].length, original[key].length, `${original.id}/${key} parity`);
  }
  assert.deepEqual(sortedKeys(translated.guide), sortedKeys(original.guide));
  assert.equal(translated.guide.operations.length, original.guide.operations.length);
  assert.equal(translated.guide.strengths.length, original.guide.strengths.length);
  assert.equal(translated.guide.limits.length, original.guide.limits.length);
  assert.equal(translated.guide.uses.length, original.guide.uses.length);
  original.essentials.forEach((item, index) => {
    assert.deepEqual(sortedKeys(translated.essentials[index]), sortedKeys(item));
  });
  original.sections.forEach((item, index) => {
    const english = translated.sections[index];
    assert.deepEqual(sortedKeys(english), sortedKeys(item));
    assert.ok(english.title.trim());
    assert.ok(english.text.trim());
    assert.notEqual(english.text, item.text, `${original.id}/${index} needs authored English text`);
    assert.equal(english.bullets.length, item.bullets.length, `${original.id}/${index}/bullets parity`);
    assert.equal(Boolean(english.code), Boolean(item.code), `${original.id}/${index}/example parity`);
    // The design lesson contains pseudocode labeled as Java in the original;
    // its English version correctly identifies and translates that example.
    if (item.codeLabel === 'Ejemplo en Java' && original.id !== 'diseno-representacion-algoritmos') {
      assert.equal(english.code, item.code, `${original.id}/${index}: Java code must not drift`);
    }
    sections++;
    if (english.code) examples++;
  });
}
assert.equal(getFoundationLessonEnglish('not-a-foundation-lesson'), null);
assert.equal(sections, 80);
assert.equal(examples, 45);
console.log(`Foundation language parity: 17 lessons, ${sections} sections and ${examples} examples verified.`);
