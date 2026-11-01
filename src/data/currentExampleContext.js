// Initialize standalone examples from the operation's immutable input snapshot.
export function seedCurrentExample(source, algorithm, cpp = false) {
  const values = algorithm.values ?? [];
  if (algorithm.id === 'heap' && cpp) {
    return source.replace('MaxHeap() : heap(new int[CAPACITY]{}) {}', `MaxHeap() : heap(new int[CAPACITY]{}) {\n${values.map((value, index) => `        heap[${index}] = ${value};`).join('\n')}\n        size = ${values.length};\n    }`);
  }
  if (algorithm.id === 'matriz') {
    if (!cpp) return source.replace(/int\[\]\[\] values = \{[\s\S]*?\};/, `int[][] values = {${Array.from({length:4},(_,r)=>`{${values.slice(r*4,r*4+4).join(', ')}}`).join(', ')}};`);
    const marker = 'for (int row = 0; row < size; row++) values[row] = new int[size]{};';
    return source.replace(marker, `${marker}\n${values.map((value,i)=>`        if (size > ${Math.max(Math.floor(i/4),i%4)}) values[${Math.floor(i/4)}][${i%4}] = ${value};`).join('\n')}`);
  }
  if (algorithm.id === 'matriz-dispersa') {
    const access = cpp ? '->' : '.';
    const height = cpp ? 'height' : 'rowCount', width = cpp ? 'width' : 'columnCount';
    const initial = [...values].sort((a,b)=>a.row-b.row||a.column-b.column).map((cell,i)=>`        if (${height} > ${cell.row} && ${width} > ${cell.column}) {\n            ${cpp?'Node*':'Node'} seed${i} = new Node(${cell.value}, ${cell.row}, ${cell.column});\n            seed${i}${access}left = AROW[${cell.row}]${access}left;\n            AROW[${cell.row}]${access}left = seed${i};\n            seed${i}${access}up = ACOL[${cell.column}]${access}up;\n            ACOL[${cell.column}]${access}up = seed${i};\n            nonZeroCount++;\n        }`).join('\n');
    const ending = `ACOL[column]${access}up = ACOL[column];\n        }`;
    return source.replace(ending, `${ending}\n${initial}`);
  }
  if (algorithm.id === 'polinomios') {
    if (!cpp) {
      for(const name of ['A','B','C']) {
        const terms=values.filter(t=>t.polynomial===name).sort((a,b)=>b.exponent-a.exponent);
        const expression=terms.reduceRight((next,t)=>`new Node(${t.coefficient}, ${t.exponent}, ${next})`,'null');
        source=source.replace(new RegExp(`Node ${name} = [\\s\\S]*?;`),`Node ${name} = ${expression};`);
      }
      return source;
    }
    const lines=[];
    for(const name of ['A','B','C']) {
      const terms=values.filter(t=>t.polynomial===name).sort((a,b)=>b.exponent-a.exponent);
      terms.forEach((t,i)=>lines.push(`        ${name}${'->next'.repeat(i)} = new Node(${t.coefficient}, ${t.exponent});`));
    }
    return source.replace(/explicit LinkedPolynomial\(bool loadExample = true\) \{[\s\S]*?\n    }/,`explicit LinkedPolynomial(bool loadExample = true) {\n        if (!loadExample) return;\n${lines.join('\n')}\n    }`);
  }
  return source;
}
