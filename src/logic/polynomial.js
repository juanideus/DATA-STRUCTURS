export const DEFAULT_POLYNOMIAL_VALUES = [
  { polynomial: 'A', coefficient: 3, exponent: 14 },
  { polynomial: 'A', coefficient: 2, exponent: 8 },
  { polynomial: 'A', coefficient: 1, exponent: 0 },
  { polynomial: 'B', coefficient: 8, exponent: 14 },
  { polynomial: 'B', coefficient: -3, exponent: 10 },
  { polynomial: 'B', coefficient: 10, exponent: 6 },
];

export function polynomialTerms(values, polynomial) {
  return values
    .filter(term => term.polynomial === polynomial && Number(term.coefficient) !== 0)
    .map(term => ({
      polynomial,
      coefficient: Number(term.coefficient),
      exponent: Number(term.exponent),
    }))
    .sort((first, second) => second.exponent - first.exponent);
}

export function combinePolynomialValues(a, b, c = []) {
  return [
    ...a.map(term => ({ ...term, polynomial: 'A' })),
    ...b.map(term => ({ ...term, polynomial: 'B' })),
    ...c.map(term => ({ ...term, polynomial: 'C' })),
  ];
}

export function insertPolynomialTerm(terms, coefficient, exponent) {
  const next = terms.map(term => ({ ...term }));
  const existing = next.findIndex(term => term.exponent === exponent);
  if (existing >= 0) {
    next[existing].coefficient += coefficient;
    if (next[existing].coefficient === 0) next.splice(existing, 1);
  } else if (coefficient !== 0) {
    next.push({ coefficient, exponent });
  }
  return next.sort((first, second) => second.exponent - first.exponent);
}

export function addPolynomials(firstTerms, secondTerms) {
  const result = [];
  let first = 0;
  let second = 0;
  while (first < firstTerms.length && second < secondTerms.length) {
    const left = firstTerms[first];
    const right = secondTerms[second];
    if (left.exponent === right.exponent) {
      const coefficient = left.coefficient + right.coefficient;
      if (coefficient !== 0) result.push({ coefficient, exponent: left.exponent });
      first++;
      second++;
    } else if (left.exponent > right.exponent) {
      result.push({ coefficient: left.coefficient, exponent: left.exponent });
      first++;
    } else {
      result.push({ coefficient: right.coefficient, exponent: right.exponent });
      second++;
    }
  }
  while (first < firstTerms.length) result.push({ ...firstTerms[first++] });
  while (second < secondTerms.length) result.push({ ...secondTerms[second++] });
  return result;
}

export function formatPolynomial(terms) {
  if (!terms.length) return '0';
  return terms.map((term, index) => {
    const absolute = Math.abs(term.coefficient);
    const variable = term.exponent === 0
      ? String(absolute)
      : `${absolute === 1 ? '' : absolute}x${term.exponent === 1 ? '' : `^${term.exponent}`}`;
    if (index === 0) return term.coefficient < 0 ? `-${variable}` : variable;
    return `${term.coefficient < 0 ? '−' : '+'} ${variable}`;
  }).join(' ');
}
