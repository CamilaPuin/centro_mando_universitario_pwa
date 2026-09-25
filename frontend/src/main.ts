if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(reg => console.log('SW registrado:', reg.scope))
    .catch(err => console.error('Error al registrar SW:', err));
}
/// <reference types="vite/client" />

import './style.css';

declare module '*.css';
const appContainer = document.querySelector<HTMLDivElement>('#app')!;

function renderApp() {
  appContainer.innerHTML = `
    <div class="card">
      <h1>Centro de Mando Universitario</h1>
      <p>U Control</p>
      <hr class="divider" />

      <h3> Resumen del Día</h3>
      <ul>
        <li><strong>Matemáticas:</strong> Entrega de taller pendiente</li>
        <li><strong>Sesión de estudio:</strong> 45 min acumulados</li>
      </ul>

    </div>
  `;
}

window.addEventListener('online', renderApp);
window.addEventListener('offline', renderApp);

renderApp();