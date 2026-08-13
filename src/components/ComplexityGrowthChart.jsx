const COLORS = {
  constant: '#315f91',
  logarithmic: '#4f7f3b',
  linear: '#d3ae37',
  linearithmic: '#d49a26',
  quadratic: '#b53636',
  exponential: '#c22ab8',
  factorial: '#6e2b8f',
};

const PLOT = { left: 8, right: 96, top: 9, bottom: 88, maxN: 10, maxWork: 20 };
const ORDERS = ['factorial', 'exponential', 'quadratic', 'linearithmic', 'linear', 'logarithmic', 'constant'];

const gamma = n => {
  const c = [0.9999999999998099,676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.5073432786869,-0.13857109526572,0.000009984369578,0.0000001505632735];
  if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
  const z = n - 1;
  const sum = c.slice(1).reduce((total, coefficient, index) => total + coefficient / (z + index + 1), c[0]);
  const t = z + c.length - 1.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * sum;
};

const growthValue = (order, n) => {
  if (order === 'constant') return 1;
  if (order === 'logarithmic') return Math.log2(n + 1);
  if (order === 'linear') return n;
  if (order === 'linearithmic') return n * Math.log2(n + 1);
  if (order === 'quadratic') return 0.78 * n ** 2;
  if (order === 'exponential') return 1.32 * (2 ** n - 1);
  if (order === 'factorial') return 2.15 * ((gamma(n + 2) - 1) / (n + 1));
  return 0;
};

const chartPoint = (order, n) => ({
  x: PLOT.left + (n / PLOT.maxN) * (PLOT.right - PLOT.left),
  y: PLOT.bottom - (growthValue(order, n) / PLOT.maxWork) * (PLOT.bottom - PLOT.top),
});

export function complexityPath(order) {
  if (order === 'constant') {
    const y = chartPoint('constant', 0).y;
    return `M ${PLOT.left} ${y.toFixed(3)} H ${PLOT.right}`;
  }
  const sampleCount = 200;
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const n = index / sampleCount * PLOT.maxN;
    const { x, y } = chartPoint(order, n);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`;
  }).join(' ');
}

export default function ComplexityGrowthChart({ language = 'en' }) {
  const safeLanguage = language === 'es' ? 'es' : 'en';
  const clipId = `complexity-plot-${safeLanguage}`;
  return <div className="complexity-static-chart">
    <div className="complexity-chart-legend">
      {ORDERS.map(order => <span key={order}><i style={{ background: COLORS[order] }}/>{order === 'factorial' ? 'O(n!)' : order === 'exponential' ? 'O(2ⁿ)' : order === 'quadratic' ? 'O(n²)' : order === 'linearithmic' ? 'O(n log n)' : order === 'linear' ? 'O(n)' : order === 'logarithmic' ? 'O(log n)' : 'O(1)'}</span>)}
    </div>
    <svg viewBox="0 0 108 96" role="img" aria-label={safeLanguage === 'en' ? 'Comparison of common algorithmic growth rates' : 'Comparación de órdenes comunes de crecimiento algorítmico'}>
      <defs><clipPath id={clipId}><rect x={PLOT.left} y={PLOT.top} width={PLOT.right - PLOT.left} height={PLOT.bottom - PLOT.top}/></clipPath></defs>
      <path className="axis" d={`M${PLOT.left} ${PLOT.top} V${PLOT.bottom} H${PLOT.right}`}/>
      <g clipPath={`url(#${clipId})`}>
        {ORDERS.map(order => <path className={`curve curve-${order}`} d={complexityPath(order)} style={{ stroke: COLORS[order] }} key={order}/>) }
      </g>
    </svg>
  </div>;
}
