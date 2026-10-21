import { Children, cloneElement, isValidElement } from 'react';
import { theoryLessonEnglish } from '../data/theoryLessonEnglish.js';

export function localizeTheory(node, language) {
  if (language !== 'en') return node;
  if (typeof node === 'string') {
    const key = node.trim().replace(/\s+/g, ' ');
    if (!Object.hasOwn(theoryLessonEnglish, key)) return node;
    const leading = node.match(/^\s*/)[0];
    const trailing = node.match(/\s*$/)[0];
    return `${leading}${theoryLessonEnglish[key]}${trailing}`;
  }
  if (Array.isArray(node)) return Children.map(node, child => localizeTheory(child, language));
  if (!isValidElement(node) || node.type === 'code' || node.type === 'pre') return node;
  const props = {};
  for (const name of ['aria-label', 'title']) {
    if (typeof node.props[name] === 'string') props[name] = localizeTheory(node.props[name], language);
  }
  return cloneElement(node, props, localizeTheory(node.props.children, language));
}
