const exactMessages = new Map([
  ['Esta lección usa enteros de 32 bits; no admite decimales. La división trunca hacia cero.', 'This lesson uses 32-bit integers, not decimals. Division truncates toward zero.'],
  ['Cada operando debe ser un entero entre 0 y 2147483647. Usa una resta para representar un valor negativo.', 'Each operand must be an integer from 0 through 2147483647. Use subtraction to represent a negative value.'],
  ['El árbol de expresión está incompleto.', 'The expression tree is incomplete.'],
  ['Un operando está fuera del rango de enteros de 32 bits.', 'An operand is outside the 32-bit integer range.'],
  ['No se puede dividir por cero. La estructura anterior se conservó.', 'Division by zero is not allowed. The previous structure was preserved.'],
  ['El árbol contiene un operador no admitido.', 'The tree contains an unsupported operator.'],
  ['El resultado de una operación está fuera del rango de enteros de 32 bits. La estructura anterior se conservó.', 'An operation result is outside the 32-bit integer range. The previous structure was preserved.'],
  ['La expresión no es válida o está incompleta. Usa enteros, paréntesis y operadores + - * /.', 'The expression is invalid or incomplete. Use integers, parentheses, and the operators + - * /.'],
  ['La expresión no es válida. Usa enteros, paréntesis y operadores + - * /.', 'The expression is invalid. Use integers, parentheses, and the operators + - * /.'],
  ['Ingresa un coeficiente entre -2147483648 y 2147483647 y un exponente entero entre 0 y 2147483647.', 'Enter a coefficient from -2147483648 through 2147483647 and an integer exponent from 0 through 2147483647.'],
  ['La suma de coeficientes excede el rango de 32 bits; los polinomios no cambiaron.', 'The coefficient sum exceeds the 32-bit range; the polynomials were not changed.'],
  ['La suma de coeficientes excede el rango de 32 bits; A, B y C no cambiaron.', 'The coefficient sum exceeds the 32-bit range; A, B, and C were not changed.'],
  ['Ingresa un entero entre -2147483648 y 2147483647.', 'Enter an integer from -2147483648 through 2147483647.'],
  ['Ingresa un entero entre -2147483648 y 2147483647 para guardar.', 'Enter an integer from -2147483648 through 2147483647 to store.'],
  ['Ingresa un entero entre -2147483648 y 2147483647 para rellenar.', 'Enter an integer from -2147483648 through 2147483647 to fill the matrix.'],
  ['El valor actualizado debe permanecer entre -2147483648 y 2147483647. No se modificó el Fenwick Tree.', 'The updated value must remain from -2147483648 through 2147483647. The Fenwick Tree was not changed.'],
  ['El ordenamiento admite hasta 100 elementos. Elimina uno antes de insertar otro.', 'The sorting demonstration supports up to 100 elements. Remove one before inserting another.'],
  ['Ingresa ambos elementos antes de unir sus conjuntos.', 'Enter both elements before joining their sets.'],
  ['Ingresa el elemento cuya raíz quieres encontrar.', 'Enter the element whose root you want to find.'],
  ['El rango excede las 4096 posiciones permitidas; se devuelve false sin modificar los datos.', 'The range exceeds the 4096 allowed positions; return false without changing the data.'],
  ['El rango está dentro de las 4096 posiciones permitidas.', 'The range is within the 4096 allowed positions.'],
  ['Counting Sort necesita un rango entre mínimo y máximo de hasta 4096 posiciones para mantener segura esta demostración.', 'Counting Sort requires a range of at most 4096 positions between the minimum and maximum to keep this demonstration safe.'],
  ['Radix Sort preparará claves no negativas y las ordenará dígito por dígito.', 'Radix Sort prepares nonnegative keys and sorts them one digit at a time.'],
  ['Hay menos de dos valores: el arreglo ya está ordenado.', 'There are fewer than two values: the array is already sorted.'],
  ['Hay al menos dos valores: comienzan las pasadas por dígito.', 'There are at least two values: the digit passes begin.'],
  ['Radix Sort terminó: no era necesario mover valores.', 'Radix Sort finished: no values needed to be moved.'],
  ['Radix Sort terminó: las pasadas estables por dígitos dejaron el arreglo ordenado.', 'Radix Sort finished: the stable digit passes left the array sorted.'],
]);

const sentencePatterns = [
  [/^(-?\d+) fue agregado al (inicio|final)\.$/, ([, value, end]) => `${value} was added at the ${end === 'inicio' ? 'start' : 'end'}.`],
  [/^(-?\d+) fue insertado en el índice (\d+)\.$/, ([, value, index]) => `${value} was inserted at index ${index}.`],
  [/^(-?\d+) fue eliminado del inicio\.$/, ([, value]) => `${value} was removed from the start.`],
  [/^(-?\d+) fue eliminado del índice (\d+)\.$/, ([, value, index]) => `${value} was removed from index ${index}.`],
  [/^(-?\d+) fue extraído de la estructura\.$/, ([, value]) => `${value} was removed from the structure.`],
  [/^(-?\d+) fue eliminado\.$/, ([, value]) => `${value} was removed.`],
  [/^(-?\d+) no existe en la estructura\.$/, ([, value]) => `${value} does not exist in the structure.`],
  [/^(-?\d+) no fue encontrado\.$/, ([, value]) => `${value} was not found.`],
  [/^(-?\d+) fue encontrado en la posición (\d+)\.$/, ([, value, index]) => `${value} was found at position ${index}.`],
  [/^Índice (\d+) actualizado a (-?\d+)\.$/, ([, index, value]) => `Index ${index} was updated to ${value}.`],
  [/^Se usa (-?\d+) como desplazamiento; value - offset será una clave no negativa\.$/, ([, offset]) => `Use ${offset} as the offset; value - offset will be a nonnegative key.`],
  [/^La clave desplazada más grande es (\d+)\.$/, ([, maximum]) => `The largest shifted key is ${maximum}.`],
  [/^Se crea output con (\d+) posiciones para la distribución estable\.$/, ([, size]) => `Create output with ${size} positions for stable distribution.`],
  [/^Se ordenará usando el dígito correspondiente a exp = (\d+)\.$/, ([, exponent]) => `Sort using the digit corresponding to exp = ${exponent}.`],
  [/^Se prepara el conteo estable para el dígito de posición (\d+)\.$/, ([, exponent]) => `Prepare stable counting for the digit at position ${exponent}.`],
  [/^(-?\d+) tiene dígito (\d) en esta pasada\.$/, ([, value, digit]) => `${value} has digit ${digit} in this pass.`],
  [/^El contador del dígito (\d) aumenta a (\d+)\.$/, ([, digit, count]) => `The count for digit ${digit} increases to ${count}.`],
  [/^El acumulado hasta el dígito (\d) es (\d+)\.$/, ([, digit, count]) => `The cumulative count through digit ${digit} is ${count}.`],
  [/^(-?\d+) se coloca de forma estable en output\[(\d+)\]\.$/, ([, value, index]) => `${value} is placed stably at output[${index}].`],
  [/^La próxima clave con dígito (\d) se colocará una posición antes\.$/, ([, digit]) => `The next key with digit ${digit} will be placed one position earlier.`],
  [/^(-?\d+) vuelve al índice (\d+) después de esta pasada\.$/, ([, value, index]) => `${value} returns to index ${index} after this pass.`],
  [/^Hay contenido inesperado desde la posición (\d+)\.$/, ([, position]) => `There is unexpected content starting at position ${position}.`],
  [/^El rango se calcula sin desbordar un entero de 32 bits: (\d+)\.$/, ([, range]) => `The range is calculated without overflowing a 32-bit integer: ${range}.`],
  [/^placeQueen entra por primera vez con row = (\d+)\.$/, ([, row]) => `placeQueen is entered for the first time with row = ${row}.`],
  [/^Resumen de construcción: se valida (.+) sin reemplazar todavía la lista anterior\.$/s, ([, source]) => `Construction overview: validate ${source} while preserving the previous list.`],
  [/^Resumen de construcción: A = (.+)\. La nueva raíz se asigna únicamente después de validar todo el texto\.$/s, ([, list]) => `Construction overview: A = ${list}. Assign the new root only after all input is valid.`],
  [/^A = (.+) quedó construida\.$/s, ([, list]) => `A = ${list} was constructed.`],
  [/^Recorrido ordenado de (claves|hojas): (.*)\.$/s, ([, kind, values]) => `Ordered ${kind === 'hojas' ? 'leaf' : 'key'} traversal: ${values}.`],
];

// Only complete messages from the coherence corrections are translated here.
// Unknown messages return null so the existing translator can handle them.
export function translateCoherenceMessage(value) {
  if (typeof value !== 'string') return null;
  const exact = exactMessages.get(value);
  if (exact !== undefined) return exact;
  for (const [pattern, translate] of sentencePatterns) {
    const match = value.match(pattern);
    if (match) return translate(match);
  }
  return null;
}
