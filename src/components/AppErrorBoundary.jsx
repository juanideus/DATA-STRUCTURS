import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, information) {
    console.error('DSA Lab no pudo completar la vista.', error, information);
  }

  goHome = () => {
    window.history.replaceState({ dsaLab: 'welcome' }, '', '/');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return <main className="app-error-screen">
      <section>
        <span><AlertTriangle size={28}/></span>
        <small>Recuperación segura</small>
        <h1>No pudimos mostrar esta sección</h1>
        <p>Tu navegador y el resto de DSA Lab siguen funcionando. Puedes intentar recargar o regresar a la bienvenida.</p>
        <div>
          <button type="button" onClick={()=>window.location.reload()}><RotateCcw size={17}/> Recargar página</button>
          <button type="button" onClick={this.goHome}><Home size={17}/> Ir a la bienvenida</button>
        </div>
      </section>
    </main>;
  }
}
