import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { algorithms } from '../src/data/algorithms.js';
import {
  localizedSeoAlgorithm,
  pageSeo,
  seoUrl,
  SITE_ALTERNATE_NAMES,
  SITE_HOME_URL,
  SITE_NAME,
} from '../src/seo.js';

const dist = resolve(import.meta.dirname, '..', 'dist');
const failures = [];

for (const algorithm of [null, ...algorithms]) {
  for (const language of ['es', 'en']) {
    const relative = algorithm
      ? language === 'en' ? `en/${algorithm.id}.html` : `${algorithm.id}.html`
      : language === 'en' ? 'en.html' : 'index.html';
    const file = resolve(dist, relative);
    try {
      await access(file);
      const html = await readFile(file, 'utf8');
      const seo = pageSeo(algorithm, language);
      const required = [
        `<html lang="${language}"`,
        `<title>${seo.title}</title>`,
        `rel="canonical" href="${seo.url}"`,
        `hreflang="es" href="${seoUrl(algorithm?.id ?? null, 'es')}"`,
        `hreflang="en" href="${seoUrl(algorithm?.id ?? null, 'en')}"`,
        'id="dsa-structured-data"',
        `name="application-name" content="${SITE_NAME}"`,
        'rel="icon" type="image/svg+xml" href="/favicon.svg"',
        `"url":"${SITE_HOME_URL}"`,
        `"name":"${SITE_NAME}"`,
        `"alternateName":${JSON.stringify(SITE_ALTERNATE_NAMES)}`,
        'class="seo-prerendered"',
      ];
      for (const marker of required) if (!html.includes(marker)) failures.push(`${relative}: falta ${marker}`);
      if (algorithm && !html.includes('<h1>')) failures.push(`${relative}: falta un H1 prerenderizado`);
      if (algorithm && language === 'en') {
        const complexity = localizedSeoAlgorithm(algorithm, language).complexity;
        const spanishTerms = /[áéíóúñÁÉÍÓÚÑ]|\b(?:insertar|eliminar|buscar|extraer|recorrer|acceso|consulta|tiempo|espacio|promedio|peor|amortizado|conceptos|clasificación|elección)\b/i;
        if (spanishTerms.test(complexity)) failures.push(`${relative}: complejidad inglesa contiene texto en español (${complexity})`);
      }
      if (seo.title.length > 68) failures.push(`${relative}: título demasiado largo (${seo.title.length})`);
      if (seo.description.length > 160) failures.push(`${relative}: descripción demasiado larga (${seo.description.length})`);
    } catch (error) {
      failures.push(`${relative}: ${error.message}`);
    }
  }
}

const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = sitemap.match(/<url>/g)?.length ?? 0;
const expectedUrls = (algorithms.length + 1) * 2;
if (sitemapUrls !== expectedUrls) failures.push(`sitemap.xml contiene ${sitemapUrls} URLs; se esperaban ${expectedUrls}`);

const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Allow: /') || !robots.includes('/sitemap.xml')) failures.push('robots.txt no permite el rastreo o no declara el sitemap');

try {
  await access(resolve(dist, 'favicon.svg'));
} catch {
  failures.push('falta el favicon estable en dist/favicon.svg');
}

if (failures.length) {
  console.error(`AUDITORÍA SEO FALLÓ:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`SEO OK: ${expectedUrls} URLs bilingües, nombre del sitio, favicon, canonicals, hreflang, JSON-LD, sitemap y robots verificados.`);
