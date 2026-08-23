import { useCallback, useState } from 'react';
import { Accessibility, Check, Contrast, Eye, RotateCcw, Scaling, Waves, X } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityContext.jsx';
import { useDialogFocus } from '../accessibility/useDialogFocus.js';
import { useLanguage } from '../i18n.jsx';

const FONT_OPTIONS = [
  { value: 'normal', labelEs: 'Normal', labelEn: 'Normal', sample: '100%' },
  { value: 'large', labelEs: 'Grande', labelEn: 'Large', sample: '112%' },
  { value: 'extra-large', labelEs: 'Muy grande', labelEn: 'Extra large', sample: '125%' },
];

function PreferenceSwitch({ checked, description, icon: Icon, label, onChange }) {
  return <label className="accessibility-switch">
    <span className="accessibility-switch-icon"><Icon size={18}/></span>
    <span><strong>{label}</strong><small>{description}</small></span>
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/>
    <i aria-hidden="true"><b/></i>
  </label>;
}

export default function AccessibilityPanel() {
  const { language } = useLanguage();
  const { preferences, resetPreferences, setPreference } = useAccessibility();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useDialogFocus({ open, onClose: close });
  const en = language === 'en';
  const copy = en ? {
    open:'Accessibility settings', eyebrow:'Display and navigation', title:'Make DSA Lab comfortable for you', intro:'These settings apply to the whole application and are saved only in this browser.', close:'Close accessibility settings',
    textSize:'Interface size', textHelp:'Increase text, controls, and visual panels together.', contrast:'High contrast', contrastHelp:'Strengthens text, borders, and controls.', colors:'Color-blind-safe palette', colorsHelp:'Uses blue and orange with labels and icons.', motion:'Reduce motion', motionHelp:'Removes decorative transitions and animations.', reset:'Reset settings', active:'Active accessibility preference',
  } : {
    open:'Opciones de accesibilidad', eyebrow:'Visualización y navegación', title:'Haz que DSA Lab sea cómodo para ti', intro:'Estas preferencias se aplican a toda la página y se guardan solamente en este navegador.', close:'Cerrar opciones de accesibilidad',
    textSize:'Tamaño de la interfaz', textHelp:'Amplía conjuntamente letras, controles y paneles visuales.', contrast:'Contraste alto', contrastHelp:'Refuerza textos, bordes y controles.', colors:'Paleta apta para daltonismo', colorsHelp:'Utiliza azul y naranja junto con etiquetas e iconos.', motion:'Reducir movimiento', motionHelp:'Elimina transiciones y animaciones decorativas.', reset:'Restablecer preferencias', active:'Preferencia de accesibilidad activa',
  };

  return <>
    <button className="accessibility-launch" type="button" onClick={() => setOpen(true)} aria-label={copy.open} title={copy.open}><Accessibility size={20}/><span>{copy.open}</span></button>
    {open && <div className="accessibility-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialogRef} tabIndex="-1" className="accessibility-panel" role="dialog" aria-modal="true" aria-labelledby="accessibility-title" aria-describedby="accessibility-description">
        <header><div className="accessibility-heading-icon"><Accessibility size={22}/></div><div><small>{copy.eyebrow}</small><h2 id="accessibility-title">{copy.title}</h2></div><button type="button" onClick={close} aria-label={copy.close}><X size={19}/></button></header>
        <p id="accessibility-description">{copy.intro}</p>
        <fieldset className="accessibility-font-options">
          <legend><Scaling size={17}/><span><strong>{copy.textSize}</strong><small>{copy.textHelp}</small></span></legend>
          <div role="radiogroup" aria-label={copy.textSize}>{FONT_OPTIONS.map(option => <button type="button" role="radio" aria-checked={preferences.fontScale === option.value} className={preferences.fontScale === option.value ? 'active' : ''} onClick={() => setPreference('fontScale', option.value)} key={option.value}><span>{en ? option.labelEn : option.labelEs}<small>{option.sample}</small></span>{preferences.fontScale === option.value && <Check size={16} aria-label={copy.active}/>}</button>)}</div>
        </fieldset>
        <div className="accessibility-switches">
          <PreferenceSwitch icon={Contrast} label={copy.contrast} description={copy.contrastHelp} checked={preferences.highContrast} onChange={value => setPreference('highContrast', value)}/>
          <PreferenceSwitch icon={Eye} label={copy.colors} description={copy.colorsHelp} checked={preferences.colorVision} onChange={value => setPreference('colorVision', value)}/>
          <PreferenceSwitch icon={Waves} label={copy.motion} description={copy.motionHelp} checked={preferences.reduceMotion} onChange={value => setPreference('reduceMotion', value)}/>
        </div>
        <footer><button type="button" onClick={resetPreferences}><RotateCcw size={15}/>{copy.reset}</button></footer>
      </section>
    </div>}
  </>;
}
