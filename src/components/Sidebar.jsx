import { memo, useCallback, useMemo, useState } from 'react';
import { Boxes, ChevronDown, PanelLeftClose, Search, Sparkles, X } from 'lucide-react';
import { algorithms, categories, navigationIndexes } from '../data/algorithms.js';
import { useDialogFocus } from '../accessibility/useDialogFocus.js';
import { categoryNames, localizeAlgorithm, useLanguage } from '../i18n.jsx';
import { seoPath } from '../seo.js';

const normalizeSidebarText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const sidebarGroupIds = new Map(categories.map(category => [category, `nav-group-${normalizeSidebarText(category).replace(/[^a-z0-9]+/g, '-')}`]));
const initiallyClosedSidebarGroups = Object.fromEntries(categories.map(category => [category, category !== 'Estructuras lineales']));

function Sidebar({ selected, onSelect, onHome, query, setQuery, mobileOpen, setMobileOpen, collapsed, onToggle }) {
  const { language, setLanguage, t } = useLanguage();
  const [closedGroups, setClosedGroups] = useState(() => initiallyClosedSidebarGroups);
  const groupedAlgorithms = useMemo(() => {
    const term = normalizeSidebarText(query);
    const groups = new Map(categories.map(category => [category, []]));
    for (const algorithm of algorithms) {
      const localized = localizeAlgorithm(algorithm, language);
      const searchable = normalizeSidebarText(`${algorithm.name} ${algorithm.navName ?? ''} ${localized.name} ${localized.navName ?? ''} ${algorithm.category} ${categoryNames[algorithm.category] ?? ''}`);
      if (!term || searchable.includes(term)) groups.get(algorithm.category)?.push(algorithm);
    }
    return groups;
  }, [query, language]);
  const hasQuery = Boolean(query.trim());
  const toggleGroup = useCallback(category => setClosedGroups(current => ({ ...current, [category]: !current[category] })), []);
  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const sidebarRef = useDialogFocus({ open: mobileOpen, onClose: closeMobile });
  const navigationLabel = language === 'en' ? 'Algorithm navigation' : 'Navegación de algoritmos';

  return <aside ref={sidebarRef} tabIndex={mobileOpen ? -1 : undefined} data-tour="sidebar" className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined} aria-label={navigationLabel}>
    <div className="brand">
      <a className="brand-home" href={seoPath(null, language)} onClick={event => { event.preventDefault(); onHome(); setMobileOpen(false); }} aria-label={t('welcome')}>
        <span className="brand-mark"><Boxes size={21}/></span>
        <span className="brand-copy"><strong>DSA Lab</strong><span>{t('visualAlgorithms')}</span></span>
      </a>
      <button className="sidebar-collapse-button" onClick={onToggle} aria-label={t('hideMenu')} title={t('hideMenu')}><PanelLeftClose size={18}/></button>
      <button className="close-mobile" onClick={closeMobile} aria-label={t('close')}><X/></button>
    </div>
    <div className="search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')}/></div>
    <div className="language-switch" role="group" aria-label="Language / Idioma">
      <button type="button" className={language === 'es' ? 'active' : ''} aria-pressed={language === 'es'} onClick={() => setLanguage('es')}>ES</button>
      <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    </div>
    <nav aria-label={navigationLabel}>
      {categories.map(category => {
        const list = groupedAlgorithms.get(category) ?? [];
        if (!list.length) return null;
        const groupId = sidebarGroupIds.get(category);
        const isClosed = !hasQuery && Boolean(closedGroups[category]);
        return <div className="nav-group" key={category}>
          <button type="button" className="nav-heading" onClick={() => toggleGroup(category)} aria-expanded={!isClosed} aria-controls={groupId}>
            <span className="nav-heading-label"><ChevronDown className="nav-chevron" size={14}/>{language === 'en' ? categoryNames[category] ?? category : category}</span>
            <em>{String(list.length).padStart(2, '0')}</em>
          </button>
          <div id={groupId} className={`nav-items ${isClosed ? 'closed' : ''}`} aria-hidden={isClosed} inert={isClosed ? true : undefined}>
            <div className="nav-items-inner">
              {list.map(algorithm => {
                const localized = localizeAlgorithm(algorithm, language);
                return <a href={seoPath(algorithm.id, language)} data-algorithm-id={algorithm.id} className={`nav-item ${selected === algorithm.id ? 'selected' : ''}`} onClick={event => { event.preventDefault(); onSelect(algorithm.id); setMobileOpen(false); }} key={algorithm.id}><span>{String((navigationIndexes.get(algorithm.id) ?? 0) + 1).padStart(2, '0')}</span>{localized.navName ?? localized.name}</a>;
              })}
            </div>
          </div>
        </div>;
      })}
    </nav>
    <div className="sidebar-foot">
      <span><Sparkles size={14}/> {algorithms.length} {t('includedTopics')}</span>
      <div className="author-credit"><small>{t('author')}</small><strong>Juan Zúñiga Maluenda</strong></div>
    </div>
  </aside>;
}

export default memo(Sidebar);
