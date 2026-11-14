import { renderizarModuloAsignaturas } from './modulos/asignaturas';
import { renderizarModuloDispositivo } from './modulos/dispositivo';
import { renderizarModuloEntregas } from './modulos/entregas';
import { renderizarModuloNotas } from './modulos/notas';
import { renderizarModuloPomodoro } from './modulos/pomodoro';
import { renderizarModuloProgreso } from './modulos/progreso';
import { renderizarDialogoCuenta } from './modulos/cuenta';

export interface VistaAplicacion {
  id: string;
  contenido: string;
}

export interface ContenidoAplicacion {
  vistas: VistaAplicacion[];
  dialogoCuenta: string;
}

function extraerContenidoVista(id: string, markup: string): VistaAplicacion {
  const markupLimpio = markup.trim();
  const inicioContenido = markupLimpio.indexOf('>');
  const finContenido = markupLimpio.lastIndexOf('</section>');
  if (!markupLimpio.startsWith(`<section id="${id}"`) || inicioContenido === -1 || finContenido < inicioContenido) {
    throw new Error(`El módulo ${id} no tiene una sección raíz válida.`);
  }

  return { id, contenido: markupLimpio.slice(inicioContenido + 1, finContenido) };
}

export function obtenerContenidoAplicacion(): ContenidoAplicacion {
  const modulos = [
    ['tab-asignaturas', renderizarModuloAsignaturas()],
    ['tab-entregas', renderizarModuloEntregas()],
    ['tab-pomodoro', renderizarModuloPomodoro()],
    ['tab-notas', renderizarModuloNotas()],
    ['tab-progreso', renderizarModuloProgreso()],
    ['tab-dispositivo', renderizarModuloDispositivo()]
  ] as const;

  return {
    vistas: modulos.map(([id, markup]) => extraerContenidoVista(id, markup)),
    dialogoCuenta: renderizarDialogoCuenta()
  };
}
