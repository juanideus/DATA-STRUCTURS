export default function CodeListing({ lines, activeLine }) {
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    const isHelperLabel = trimmedLine.startsWith('// Método auxiliar utilizado arriba:')
      || trimmedLine.startsWith('// Helper method used above:');

    return (
      <code
        className={`${index === activeLine ? 'active' : ''} ${isHelperLabel ? 'helper-method-label' : ''}`.trim()}
        key={index}
      >
        <i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}
      </code>
    );
  });
}
