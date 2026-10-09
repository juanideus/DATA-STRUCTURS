export const copyVisualValues = values => values.map(value => (
  value && typeof value === 'object' ? { ...value } : value
));
