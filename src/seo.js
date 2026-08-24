import { englishAlgorithmDescriptions, englishAlgorithmNames } from './data/algorithmTranslations.js';
import { translateComplexity } from './data/complexityTranslations.js';

export const SITE_ORIGIN = 'https://www.dsalab.dev';
export const SITE_HOME_URL = `${SITE_ORIGIN}/`;
export const SITE_NAME = 'DSA Lab';
export const SITE_ALTERNATE_NAMES = ['DSALab', 'Data Structures and Algorithms Lab'];
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/dsa-lab-social-v2.jpg`;

const HOME = {
  es: {
    title: 'DSA Lab — Estructuras de datos y algoritmos visuales',
    description: 'Aprende estructuras de datos y algoritmos con visualizaciones, animaciones paso a paso, código Java, ejercicios y pruebas interactivas.',
  },
  en: {
    title: 'DSA Lab — Visual Data Structures and Algorithms',
    description: 'Learn data structures and algorithms with visualizations, step-by-step animations, Java code, exercises, and interactive assessments.',
  },
};

const ENGLISH_CATEGORIES = {
  Fundamentos: 'Fundamentals',
  'Estructuras lineales': 'Linear structures',
  'Árboles': 'Trees',
  Hashing: 'Hashing',
  Grafos: 'Graphs',
  'Recursión': 'Recursion',
  Backtracking: 'Backtracking',
  Otros: 'Other topics',
};

const trimDescription = value => {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= 158) return normalized;
  return `${normalized.slice(0, 155).replace(/\s+\S*$/, '')}…`;
};

const topicTitle = (name, language) => {
  const detailed = language === 'en'
    ? `${name}: Visual Guide and Java | DSA Lab`
    : `${name}: visualización y Java | DSA Lab`;
  return detailed.length <= 68 ? detailed : `${name} | DSA Lab`;
};

export function seoPath(algorithmId = null, language = 'es') {
  const prefix = language === 'en' ? '/en' : '';
  if (algorithmId) return `${prefix}/${encodeURIComponent(algorithmId)}`;
  return language === 'en' ? '/en' : '/';
}

export function seoUrl(algorithmId = null, language = 'es') {
  return `${SITE_ORIGIN}${seoPath(algorithmId, language)}`;
}

export function languageFromPath(pathname = '/') {
  return /^\/en(?:\/|$)/i.test(pathname) ? 'en' : 'es';
}

export function algorithmIdFromPath(pathname = '/') {
  const clean = decodeURIComponent(String(pathname).replace(/^\/+|\/+$/g, '').trim());
  if (!clean || clean.toLowerCase() === 'en') return null;
  return clean.replace(/^en\//i, '');
}

export function localizedSeoAlgorithm(algorithm, language = 'es') {
  if (!algorithm || language !== 'en') return algorithm;
  const name = englishAlgorithmNames[algorithm.id] ?? algorithm.name;
  return {
    ...algorithm,
    name,
    category: ENGLISH_CATEGORIES[algorithm.category] ?? algorithm.category,
    complexity: translateComplexity(algorithm.complexity, language),
    description: englishAlgorithmDescriptions[algorithm.id]
      ?? `Learn the concepts, operations, and behavior of ${name} through an interactive step-by-step lesson.`,
  };
}

export function pageSeo(algorithm = null, language = 'es') {
  const safeLanguage = language === 'en' ? 'en' : 'es';
  if (!algorithm) {
    return {
      ...HOME[safeLanguage],
      url: seoUrl(null, safeLanguage),
      imageAlt: safeLanguage === 'en'
        ? 'DSA Lab with visual representations of arrays, trees, and graphs'
        : 'DSA Lab con representaciones visuales de arreglos, árboles y grafos',
    };
  }

  const localized = localizedSeoAlgorithm(algorithm, safeLanguage);
  const suffix = safeLanguage === 'en'
    ? 'Interactive visualization, Java code, operations, complexity, and a complete beginner-friendly explanation.'
    : 'Visualización interactiva, código Java, operaciones, complejidad y explicación completa para aprender paso a paso.';
  return {
    title: topicTitle(localized.name, safeLanguage),
    description: trimDescription(`${localized.description} ${suffix}`),
    url: seoUrl(algorithm.id, safeLanguage),
    imageAlt: safeLanguage === 'en'
      ? `${localized.name} visualized step by step in DSA Lab`
      : `${localized.name} visualizado paso a paso en DSA Lab`,
  };
}

export function structuredData(algorithm = null, language = 'es') {
  const safeLanguage = language === 'en' ? 'en' : 'es';
  const seo = pageSeo(algorithm, safeLanguage);
  const homeUrl = seoUrl(null, safeLanguage);
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: SITE_HOME_URL,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAMES,
      description: HOME[safeLanguage].description,
      inLanguage: safeLanguage === 'en' ? 'en-US' : 'es-CL',
      author: { '@id': `${SITE_ORIGIN}/#author` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_ORIGIN}/#author`,
      name: 'Juan Zúñiga Maluenda',
    },
  ];

  if (!algorithm) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${SITE_ORIGIN}/#application`,
      name: SITE_NAME,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: homeUrl,
      description: seo.description,
      inLanguage: ['es-CL', 'en-US'],
      author: { '@id': `${SITE_ORIGIN}/#author` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
  } else {
    const localized = localizedSeoAlgorithm(algorithm, safeLanguage);
    graph.push(
      {
        '@type': 'BreadcrumbList',
        '@id': `${seo.url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: safeLanguage === 'en' ? 'Home' : 'Inicio', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: localized.name, item: seo.url },
        ],
      },
      {
        '@type': 'LearningResource',
        '@id': `${seo.url}#learning-resource`,
        name: localized.name,
        description: seo.description,
        url: seo.url,
        inLanguage: safeLanguage === 'en' ? 'en-US' : 'es-CL',
        learningResourceType: algorithm.type === 'theory' || algorithm.type === 'foundation' ? 'Lesson' : 'Interactive visualization',
        educationalLevel: 'Beginner',
        teaches: localized.name,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        author: { '@id': `${SITE_ORIGIN}/#author` },
      },
    );
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
