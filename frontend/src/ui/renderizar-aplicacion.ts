import { renderizarEncabezado, renderizarNavegacion, renderizarPie } from './estructura';
import { renderizarModuloAsignaturas } from './modulos/asignaturas';
import { renderizarModuloCalendario } from './modulos/calendario';
import { renderizarModuloDispositivo } from './modulos/dispositivo';
import { renderizarModuloEntregas } from './modulos/entregas';
import { renderizarModuloNotas } from './modulos/notas';
import { renderizarModuloPomodoro } from './modulos/pomodoro';
import { renderizarModuloProgreso } from './modulos/progreso';
import { renderizarModuloResumen } from './modulos/resumen';
import { renderizarDialogoCuenta } from './modulos/cuenta';

export function renderizarAplicacion(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('No se encontró el contenedor raíz #app.');
  }

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const fechaFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  const modulos = [
    renderizarModuloResumen(),
    renderizarModuloAsignaturas(),
    renderizarModuloEntregas(),
    renderizarModuloDispositivo(),
    renderizarModuloCalendario(),
    renderizarModuloPomodoro(),
    renderizarModuloNotas(),
    renderizarModuloProgreso()
  ];

  app.innerHTML = `
    <div class="app-container">
      ${renderizarEncabezado(fechaFormateada)}
      <main id="main-content">
        ${renderizarNavegacion()}
        ${modulos.join('')}
      </main>
      ${renderizarDialogoCuenta()}
      ${renderizarPie()}
    </div>
  `;
}
