import { guardarSesionEstudio } from '../utils/db';

type ModoTemporizador = 'enfoque' | 'descanso' | 'cronometro';
type TipoSesion = 'pomodoro' | 'cronometro';

export function inicializarPomodoro(databaseReady: Promise<IDBDatabase | undefined>): void {
  const pomoDisplay = document.getElementById('pomo-display');
  const toggleButton = document.getElementById('btn-pomo-toggle') as HTMLButtonElement | null;
  const resetButton = document.getElementById('btn-pomo-reset') as HTMLButtonElement | null;
  const breakButton = document.getElementById('btn-pomo-break') as HTMLButtonElement | null;
  const stopwatchButton = document.getElementById('btn-pomo-stopwatch') as HTMLButtonElement | null;
  const focusButton = document.getElementById('btn-focus-mode') as HTMLButtonElement | null;
  const subjectSelect = document.getElementById('pomo-materia-select') as HTMLSelectElement | null;
  const subjectLabel = document.getElementById('pomo-subject-label');
  const status = document.getElementById('pomo-status');
  if (!pomoDisplay || !toggleButton || !resetButton || !breakButton ||
      !stopwatchButton || !focusButton || !subjectSelect || !subjectLabel || !status) return;
  const display = pomoDisplay;
  const toggle = toggleButton;
  const reset = resetButton;
  const rest = breakButton;
  const stopwatch = stopwatchButton;
  const focus = focusButton;
  const subject = subjectSelect;
  const subjectName = subjectLabel;
  const timerStatus = status;

  const focusDuration = 25 * 60;
  let secondsRemaining = focusDuration;
  let mode: ModoTemporizador = 'enfoque';
  let interval: ReturnType<typeof setInterval> | undefined;
  let isRunning = false;
  let lastTickAt = 0;
  let elapsedStudySeconds = 0;
  let sessionStartedAt = '';
  let activeSubject = '';
  let savingSession = false;

  function formatTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function actualizarDisplay(): void {
    display.textContent = formatTime(secondsRemaining);
    subjectName.textContent = activeSubject || subject.value || 'Sin asignatura';
  }

  function actualizarBoton(): void {
    if (isRunning) {
      toggle.textContent = mode === 'descanso' ? 'Pausar descanso' : 'Pausar';
    } else if (elapsedStudySeconds > 0) {
      toggle.textContent = mode === 'cronometro'
        ? 'Reanudar cronómetro'
        : mode === 'descanso' ? 'Reanudar descanso' : 'Reanudar enfoque';
    } else {
      toggle.textContent = mode === 'descanso'
        ? 'Iniciar descanso'
        : mode === 'cronometro' ? 'Iniciar cronómetro' : 'Iniciar enfoque';
    }
    toggle.classList.toggle('btn-primary', !isRunning);
    toggle.classList.toggle('btn-secondary', isRunning);
    toggle.disabled = savingSession;
    reset.disabled = savingSession;
    rest.disabled = savingSession;
    stopwatch.disabled = savingSession;
    subject.disabled = isRunning || elapsedStudySeconds > 0 || savingSession;
  }

  function detenerTemporizador(): void {
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
    isRunning = false;
    actualizarBoton();
  }

  async function guardarSesion(tipo: TipoSesion): Promise<void> {
    if (savingSession) return;
    const duracionSegundos = elapsedStudySeconds;
    if (duracionSegundos <= 0) return;
    savingSession = true;
    actualizarBoton();
    try {
      const db = await databaseReady;
      if (!db) throw new Error('IndexedDB no está disponible; no se pudo guardar la sesión.');
      const fin = new Date();
      const inicio = sessionStartedAt || new Date(fin.getTime() - duracionSegundos * 1000).toISOString();
      await guardarSesionEstudio(db, {
        asignatura: activeSubject || subject.value,
        tipo,
        inicio,
        fin: fin.toISOString(),
        duracionSegundos
      });
      elapsedStudySeconds = 0;
      sessionStartedAt = '';
      activeSubject = '';
      timerStatus.textContent = `Sesión registrada: ${formatTime(duracionSegundos)} de estudio.`;
      window.dispatchEvent(new Event('sesion-estudio-guardada'));
    } finally {
      savingSession = false;
      actualizarBoton();
    }
  }

  function iniciarTemporizador(): void {
    if (mode !== 'descanso' && !subject.value) {
      timerStatus.textContent = 'Primero registra una asignatura y selecciónala para iniciar el estudio.';
      return;
    }
    if (!sessionStartedAt && mode !== 'descanso') {
      sessionStartedAt = new Date().toISOString();
      activeSubject = subject.value;
    }
    isRunning = true;
    lastTickAt = Date.now();
    actualizarBoton();
    interval = setInterval(() => {
      const ahora = Date.now();
      const transcurridos = Math.floor((ahora - lastTickAt) / 1000);
      if (transcurridos < 1) return;
      lastTickAt += transcurridos * 1000;

      if (mode === 'cronometro') {
        secondsRemaining += transcurridos;
        elapsedStudySeconds += transcurridos;
      } else {
        const decremento = Math.min(transcurridos, secondsRemaining);
        secondsRemaining -= decremento;
        if (mode === 'enfoque') elapsedStudySeconds += decremento;
      }
      actualizarDisplay();

      if (mode !== 'cronometro' && secondsRemaining === 0) {
        const modoTerminado = mode;
        detenerTemporizador();
        if (modoTerminado === 'enfoque') {
          void guardarSesion('pomodoro').catch(error => {
            console.error('No se pudo guardar la sesión Pomodoro:', error);
            timerStatus.textContent = error instanceof Error
              ? error.message
              : 'No se pudo guardar la sesión de estudio.';
          });
          timerStatus.textContent = '¡Enfoque completado! La sesión se está guardando.';
        } else {
          timerStatus.textContent = 'Descanso terminado. Cuando estés lista, inicia un nuevo enfoque.';
        }
        mode = 'enfoque';
        secondsRemaining = focusDuration;
        actualizarDisplay();
        actualizarBoton();
      }
    }, 250);
  }

  toggle.addEventListener('click', () => {
    if (isRunning) {
      detenerTemporizador();
      timerStatus.textContent = 'Temporizador pausado. Puedes reanudar o guardar el tiempo parcial al reiniciar.';
    } else {
      iniciarTemporizador();
    }
  });

  reset.addEventListener('click', () => {
    detenerTemporizador();
    const tipoSesion: TipoSesion = mode === 'cronometro' ? 'cronometro' : 'pomodoro';
    void guardarSesion(tipoSesion).catch(error => {
      console.error('No se pudo guardar el tiempo de estudio:', error);
      timerStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar la sesión.';
    });
    mode = 'enfoque';
    secondsRemaining = focusDuration;
    actualizarDisplay();
    actualizarBoton();
  });

  rest.addEventListener('click', () => {
    detenerTemporizador();
    const tipoSesion: TipoSesion = mode === 'cronometro' ? 'cronometro' : 'pomodoro';
    void guardarSesion(tipoSesion).catch(error => {
      console.error('No se pudo guardar el tiempo de estudio:', error);
      timerStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar la sesión.';
    });
    mode = 'descanso';
    secondsRemaining = 5 * 60;
    timerStatus.textContent = 'Descanso de cinco minutos.';
    actualizarDisplay();
    actualizarBoton();
  });

  stopwatch.addEventListener('click', () => {
    detenerTemporizador();
    const tipoSesion: TipoSesion = mode === 'cronometro' ? 'cronometro' : 'pomodoro';
    void guardarSesion(tipoSesion).catch(error => {
      console.error('No se pudo guardar el tiempo de estudio:', error);
      timerStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar la sesión.';
    });
    mode = 'cronometro';
    secondsRemaining = 0;
    timerStatus.textContent = 'Cronómetro libre: inicia, pausa o reinicia para registrar el tiempo estudiado.';
    actualizarDisplay();
    actualizarBoton();
  });

  focus.addEventListener('click', () => {
    const activo = document.body.classList.toggle('focus-mode');
    focus.setAttribute('aria-pressed', String(activo));
    focus.textContent = activo ? 'Salir del modo enfoque' : 'Activar modo enfoque';
  });

  subject.addEventListener('change', actualizarDisplay);
  actualizarDisplay();
  actualizarBoton();
}
