import FoundationLesson from './FoundationLesson.jsx';
import { ComplexityLesson, DataStructuresLesson, OopLesson } from './TheoryLessons.jsx';
import { foundationLessonsEnglishById } from '../data/foundationLessonsEnglish.js';

// Both locales share the complete lesson layout instead of a generic summary.
export default function EnglishFoundationLesson({ algorithm }) {
  if (algorithm.type === 'complexity') return <ComplexityLesson language="en"/>;
  if (algorithm.type === 'oop') return <OopLesson language="en"/>;
  if (algorithm.type === 'theory') return <DataStructuresLesson language="en"/>;
  return <FoundationLesson algorithm={algorithm} language="en" lesson={foundationLessonsEnglishById[algorithm.id]}/>;
}
