import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { algorithms, categories } from '../src/data/algorithms.js';
import { localizedSeoAlgorithm, pageSeo, seoPath, seoUrl, SITE_ORIGIN, SOCIAL_IMAGE_URL, structuredData } from '../src/seo.js';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const template = await readFile(resolve(dist, 'index.html'), 'utf8');

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeXml = value => escapeHtml(value);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`(<meta\\s+[^>]*${attribute}="${escapeRegExp(key)}"[^>]*content=")[^"]*("[^>]*>)`, 'i');
  if (!pattern.test(html)) throw new Error(`No se encontró meta ${attribute}="${key}".`);
  return html.replace(pattern, `$1${escapeHtml(content)}$2`);
}

function replaceLink(html, relation, href, hreflang = null) {
  const languagePart = hreflang ? `[^>]*hreflang="${escapeRegExp(hreflang)}"` : '';
  const pattern = new RegExp(`(<link\\s+[^>]*rel="${escapeRegExp(relation)}"${languagePart}[^>]*href=")[^"]*("[^>]*>)`, 'i');
  if (!pattern.test(html)) throw new Error(`No se encontró link rel="${relation}"${hreflang ? ` hreflang="${hreflang}"` : ''}.`);
  return html.replace(pattern, `$1${escapeHtml(href)}$2`);
}

function relatedAlgorithms(algorithm) {
  if (!algorithm) return algorithms;
  const peers = algorithms.filter(item => item.category === algorithm.category && item.id !== algorithm.id);
  return peers.slice(0, 12);
}

function renderNavigation(algorithm, language) {
  const label = language === 'en' ? 'Explore related topics' : 'Explora temas relacionados';
  return `<nav aria-label="${label}"><h2>${label}</h2><ul>${relatedAlgorithms(algorithm).map(item => {
    const localized = localizedSeoAlgorithm(item, language);
    return `<li><a href="${seoPath(item.id, language)}">${escapeHtml(localized.name)}</a></li>`;
  }).join('')}</ul></nav>`;
}

function renderFallback(algorithm, language) {
  const seo = pageSeo(algorithm, language);
  if (!algorithm) {
    const categoryLists = categories.map(category => {
      const items = algorithms.filter(item => item.category === category);
      const categoryName = language === 'en' && items.length
        ? localizedSeoAlgorithm(items[0], language).category
        : category;
      return `<section><h2>${escapeHtml(categoryName)}</h2><ul>${items.map(item => {
        const localized = localizedSeoAlgorithm(item, language);
        return `<li><a href="${seoPath(item.id, language)}">${escapeHtml(localized.name)}</a></li>`;
      }).join('')}</ul></section>`;
    }).join('');
    return `<main class="seo-prerendered"><header><p>DSA Lab</p><h1>${escapeHtml(seo.title)}</h1><p>${escapeHtml(seo.description)}</p></header><div class="seo-topic-index">${categoryLists}</div></main>`;
  }

  const localized = localizedSeoAlgorithm(algorithm, language);
  const labels = language === 'en'
    ? { category: 'Category', complexity: 'Complexity', learn: 'Learn with an interactive visualization' }
    : { category: 'Categoría', complexity: 'Complejidad', learn: 'Aprende con una visualización interactiva' };
  return `<main class="seo-prerendered"><article><header><p>${escapeHtml(localized.category)}</p><h1>${escapeHtml(localized.name)}</h1><p>${escapeHtml(localized.description)}</p></header><section><h2>${labels.learn}</h2><p><strong>${labels.category}:</strong> ${escapeHtml(localized.category)}. <strong>${labels.complexity}:</strong> ${escapeHtml(localized.complexity)}.</p><p>${escapeHtml(seo.description)}</p></section></article>${renderNavigation(algorithm, language)}</main>`;
}

function renderPage(algorithm, language) {
  const seo = pageSeo(algorithm, language);
  const currentId = algorithm?.id ?? null;
  let html = template.replace(/<html\s+lang="[^"]*"/i, `<html lang="${language}"`);
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(seo.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', seo.description);
  html = replaceMeta(html, 'itemprop', 'name', seo.title);
  html = replaceMeta(html, 'itemprop', 'description', seo.description);
  html = replaceMeta(html, 'itemprop', 'image', SOCIAL_IMAGE_URL);
  html = replaceMeta(html, 'property', 'og:locale', language === 'en' ? 'en_US' : 'es_CL');
  html = replaceMeta(html, 'property', 'og:locale:alternate', language === 'en' ? 'es_CL' : 'en_US');
  html = replaceMeta(html, 'property', 'og:title', seo.title);
  html = replaceMeta(html, 'property', 'og:description', seo.description);
  html = replaceMeta(html, 'property', 'og:url', seo.url);
  html = replaceMeta(html, 'property', 'og:image', SOCIAL_IMAGE_URL);
  html = replaceMeta(html, 'property', 'og:image:url', SOCIAL_IMAGE_URL);
  html = replaceMeta(html, 'property', 'og:image:secure_url', SOCIAL_IMAGE_URL);
  html = replaceMeta(html, 'property', 'og:image:alt', seo.imageAlt);
  html = replaceMeta(html, 'name', 'twitter:url', seo.url);
  html = replaceMeta(html, 'name', 'twitter:title', seo.title);
  html = replaceMeta(html, 'name', 'twitter:description', seo.description);
  html = replaceMeta(html, 'name', 'twitter:image', SOCIAL_IMAGE_URL);
  html = replaceMeta(html, 'name', 'twitter:image:alt', seo.imageAlt);
  html = replaceLink(html, 'canonical', seo.url);
  html = replaceLink(html, 'alternate', seoUrl(currentId, 'es'), 'es');
  html = replaceLink(html, 'alternate', seoUrl(currentId, 'en'), 'en');
  html = replaceLink(html, 'alternate', seoUrl(currentId, 'es'), 'x-default');
  const jsonLd = JSON.stringify(structuredData(algorithm, language)).replaceAll('<', '\\u003c');
  html = html.replace(/<script\s+id="dsa-structured-data"[^>]*>.*?<\/script>/is, `<script id="dsa-structured-data" type="application/ld+json">${jsonLd}</script>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${renderFallback(algorithm, language)}</div>`);
  return html;
}

async function writeRoute(algorithm, language) {
  const relative = algorithm
    ? language === 'en' ? `en/${algorithm.id}.html` : `${algorithm.id}.html`
    : language === 'en' ? 'en.html' : 'index.html';
  const destination = resolve(dist, relative);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, renderPage(algorithm, language), 'utf8');
}

await writeRoute(null, 'es');
await writeRoute(null, 'en');
for (const algorithm of algorithms) {
  await writeRoute(algorithm, 'es');
  await writeRoute(algorithm, 'en');
}

const sitemapEntries = [null, ...algorithms].flatMap(algorithm => ['es', 'en'].map(language => {
  const id = algorithm?.id ?? null;
  const location = seoUrl(id, language);
  return `  <url>\n    <loc>${escapeXml(location)}</loc>\n    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(seoUrl(id, 'es'))}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(seoUrl(id, 'en'))}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(seoUrl(id, 'es'))}"/>\n  </url>`;
}));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`;
await writeFile(resolve(dist, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`, 'utf8');

console.log(`SEO generado: ${algorithms.length * 2 + 2} páginas, ${sitemapEntries.length} URLs y metadatos bilingües.`);
