import './style.css';
import { renderizarAplicacion } from './ui/renderizar-aplicacion';
import { inicializarPwa } from './features/pwa';
import { inicializarNavegacion } from './features/navegacion';
import { inicializarPomodoro } from './features/pomodoro';
import { inicializarNotas } from './features/notas';
import { inicializarHerramientasDispositivo } from './devices/controlador';

renderizarAplicacion();
inicializarPwa();
inicializarNavegacion();
inicializarPomodoro();
inicializarHerramientasDispositivo(inicializarNotas());
