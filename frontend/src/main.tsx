import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('No se encontró el contenedor raíz #app.');
}

createRoot(rootElement).render(<App />);
