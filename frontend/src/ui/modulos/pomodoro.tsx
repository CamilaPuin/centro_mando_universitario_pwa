import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import {
  guardarSesionPomodoro,
  listarAsignaturasPomodoro,
  type TipoSesionPomodoro
} from '../../features/pomodoro';
import type { Asignatura } from '../../utils/db';

interface ModuloPomodoroProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

type ModoTemporizador = 'enfoque' | 'descanso' | 'cronometro';

const DURACION_ENFOQUE = 25 * 60;
const DURACION_DESCANSO = 5 * 60;

function formatearTiempo(totalSegundos: number): string {
  const segundosSeguros = Math.max(0, Math.floor(totalSegundos));
  const horas = Math.floor(segundosSeguros / 3600);
  const minutos = Math.floor((segundosSeguros % 3600) / 60);
  const segundos = segundosSeguros % 60;
  if (horas > 0) {
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function mensajeDeError(causa: unknown): string {
  return causa instanceof Error ? causa.message : 'No se pudo guardar la sesión de estudio.';
}

export function ModuloPomodoro({ activo, databaseReady }: ModuloPomodoroProps): ReactElement {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(DURACION_ENFOQUE);
  const [modo, setModo] = useState<ModoTemporizador>('enfoque');
  const [enMarcha, setEnMarcha] = useState(false);
  const [segundosEstudio, setSegundosEstudio] = useState(0);
  const [guardandoSesion, setGuardandoSesion] = useState(false);
  const [modoEnfoque, setModoEnfoque] = useState(false);
  const [estado, setEstado] = useState(
    'Las sesiones se registran al pausar, reiniciar o completar el enfoque.'
  );
  const segundosRef = useRef(DURACION_ENFOQUE);
  const modoRef = useRef<ModoTemporizador>('enfoque');
  const enMarchaRef = useRef(false);
  const segundosEstudioRef = useRef(0);
  const guardandoSesionRef = useRef(false);
  const asignaturaSeleccionadaRef = useRef('');
  const inicioSesionRef = useRef('');
  const asignaturaActivaRef = useRef('');
  const ultimoTickRef = useRef(0);

  const actualizarSegundos = (valor: number): void => {
    segundosRef.current = valor;
    setSegundosRestantes(valor);
  };
  const actualizarModo = (valor: ModoTemporizador): void => {
    modoRef.current = valor;
    setModo(valor);
  };
  const actualizarMarcha = (valor: boolean): void => {
    enMarchaRef.current = valor;
    setEnMarcha(valor);
  };
  const actualizarSegundosEstudio = (valor: number): void => {
    segundosEstudioRef.current = valor;
    setSegundosEstudio(valor);
  };

  useEffect(() => {
    let montado = true;
    const cargarAsignaturas = async (): Promise<void> => {
      try {
        const resultado = await listarAsignaturasPomodoro(databaseReady);
        if (montado) setAsignaturas(resultado);
      } catch (causa) {
        console.error('No se pudieron cargar las asignaturas para el temporizador:', causa);
        if (montado) setEstado('No se pudieron cargar las asignaturas para el temporizador.');
      }
    };

    void cargarAsignaturas();
    window.addEventListener('asignaturas-actualizadas', cargarAsignaturas);
    return () => {
      montado = false;
      window.removeEventListener('asignaturas-actualizadas', cargarAsignaturas);
    };
  }, [databaseReady]);

  useEffect(() => {
    const salirDelModoEnfoque = (): void => setModoEnfoque(false);
    window.addEventListener('salir-modo-enfoque', salirDelModoEnfoque);
    return () => window.removeEventListener('salir-modo-enfoque', salirDelModoEnfoque);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('focus-mode', modoEnfoque);
    return () => document.body.classList.remove('focus-mode');
  }, [modoEnfoque]);

  const guardarSesion = useCallback(async (
    tipo: TipoSesionPomodoro,
    duracionSegundos = segundosEstudioRef.current
  ): Promise<void> => {
    if (guardandoSesionRef.current || duracionSegundos <= 0) return;
    guardandoSesionRef.current = true;
    setGuardandoSesion(true);
    try {
      await guardarSesionPomodoro(databaseReady, {
        asignatura: asignaturaActivaRef.current || asignaturaSeleccionadaRef.current,
        tipo,
        inicio: inicioSesionRef.current,
        duracionSegundos
      });
      actualizarSegundosEstudio(0);
      inicioSesionRef.current = '';
      asignaturaActivaRef.current = '';
      setEstado(`Sesión registrada: ${formatearTiempo(duracionSegundos)} de estudio.`);
    } finally {
      guardandoSesionRef.current = false;
      setGuardandoSesion(false);
    }
  }, [databaseReady]);

  useEffect(() => {
    if (!enMarcha) return;
    const interval = setInterval(() => {
      const ahora = Date.now();
      const transcurridos = Math.floor((ahora - ultimoTickRef.current) / 1000);
      if (transcurridos < 1) return;
      ultimoTickRef.current += transcurridos * 1000;

      const modoActual = modoRef.current;
      if (modoActual === 'cronometro') {
        actualizarSegundos(segundosRef.current + transcurridos);
        actualizarSegundosEstudio(segundosEstudioRef.current + transcurridos);
        return;
      }

      const decremento = Math.min(transcurridos, segundosRef.current);
      actualizarSegundos(segundosRef.current - decremento);
      if (modoActual === 'enfoque') {
        actualizarSegundosEstudio(segundosEstudioRef.current + decremento);
      }
      if (segundosRef.current !== 0) return;

      actualizarMarcha(false);
      if (modoActual === 'enfoque') {
        setEstado('¡Enfoque completado! La sesión se está guardando.');
        void guardarSesion('pomodoro', segundosEstudioRef.current).catch(causa => {
          console.error('No se pudo guardar la sesión Pomodoro:', causa);
          setEstado(mensajeDeError(causa));
        });
      } else {
        setEstado('Descanso terminado. Cuando estés lista, inicia un nuevo enfoque.');
      }
      actualizarModo('enfoque');
      actualizarSegundos(DURACION_ENFOQUE);
    }, 250);
    return () => clearInterval(interval);
  }, [enMarcha, guardarSesion]);

  const iniciarTemporizador = (): void => {
    if (modoRef.current !== 'descanso' && !asignaturaSeleccionadaRef.current) {
      setEstado('Primero registra una asignatura y selecciónala para iniciar el estudio.');
      return;
    }
    if (!inicioSesionRef.current && modoRef.current !== 'descanso') {
      inicioSesionRef.current = new Date().toISOString();
      asignaturaActivaRef.current = asignaturaSeleccionadaRef.current;
    }
    ultimoTickRef.current = Date.now();
    actualizarMarcha(true);
  };

  const alternarTemporizador = (): void => {
    if (enMarchaRef.current) {
      actualizarMarcha(false);
      setEstado('Temporizador pausado. Puedes reanudar o guardar el tiempo parcial al reiniciar.');
      return;
    }
    iniciarTemporizador();
  };

  const mostrarErrorAlGuardar = (causa: unknown, accion: string): void => {
    console.error(`No se pudo guardar ${accion}:`, causa);
    setEstado(mensajeDeError(causa));
  };

  const reiniciarTemporizador = (): void => {
    actualizarMarcha(false);
    const tipoSesion: TipoSesionPomodoro = modoRef.current === 'cronometro'
      ? 'cronometro'
      : 'pomodoro';
    void guardarSesion(tipoSesion).catch(causa => mostrarErrorAlGuardar(causa, 'el tiempo de estudio'));
    actualizarModo('enfoque');
    actualizarSegundos(DURACION_ENFOQUE);
  };

  const iniciarDescanso = (): void => {
    actualizarMarcha(false);
    const tipoSesion: TipoSesionPomodoro = modoRef.current === 'cronometro'
      ? 'cronometro'
      : 'pomodoro';
    void guardarSesion(tipoSesion).catch(causa => mostrarErrorAlGuardar(causa, 'el tiempo de estudio'));
    actualizarModo('descanso');
    actualizarSegundos(DURACION_DESCANSO);
    setEstado('Descanso de cinco minutos.');
  };

  const iniciarCronometro = (): void => {
    actualizarMarcha(false);
    const tipoSesion: TipoSesionPomodoro = modoRef.current === 'cronometro'
      ? 'cronometro'
      : 'pomodoro';
    void guardarSesion(tipoSesion).catch(causa => mostrarErrorAlGuardar(causa, 'el tiempo de estudio'));
    actualizarModo('cronometro');
    actualizarSegundos(0);
    setEstado('Cronómetro libre: inicia, pausa o reinicia para registrar el tiempo estudiado.');
  };

  const cambiarAsignatura = (nombre: string): void => {
    asignaturaSeleccionadaRef.current = nombre;
    setAsignaturaSeleccionada(nombre);
  };

  const textoBotonTemporizador = enMarcha
    ? modo === 'descanso' ? 'Pausar descanso' : 'Pausar'
    : segundosEstudio > 0
      ? modo === 'cronometro'
        ? 'Reanudar cronómetro'
        : modo === 'descanso' ? 'Reanudar descanso' : 'Reanudar enfoque'
      : modo === 'descanso'
        ? 'Iniciar descanso'
        : modo === 'cronometro' ? 'Iniciar cronómetro' : 'Iniciar enfoque';
  const asignaturaMostrada = asignaturaActivaRef.current ||
    asignaturaSeleccionada || 'Sin asignatura';

  return (
    <section id="tab-pomodoro" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="pomodoro-wrapper">
        <h3>Cronómetro y Modo Pomodoro</h3>
        <p className="pomo-subtitle">
          Sesiones de concentración asociadas directamente a tus asignaturas.
        </p>
        <div className="pomo-materia-row">
          <label htmlFor="pomo-materia-select">Asignatura:</label>
          <select
            id="pomo-materia-select"
            className="form-control inline"
            value={asignaturaSeleccionada}
            disabled={enMarcha || segundosEstudio > 0 || guardandoSesion}
            onChange={event => cambiarAsignatura(event.currentTarget.value)}
          >
            <option value="">Registra una asignatura para empezar</option>
            {asignaturas.map((asignatura, indice) => (
              <option key={asignatura.id ?? `${asignatura.nombre}-${indice}`} value={asignatura.nombre}>
                {asignatura.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="pomo-circle">
          <div className="pomo-time" id="pomo-display">{formatearTiempo(segundosRestantes)}</div>
          <div className="pomo-subject" id="pomo-subject-label">{asignaturaMostrada}</div>
        </div>
        <div className="pomo-controls">
          <button
            id="btn-pomo-toggle"
            className={`btn-pomo ${enMarcha ? 'btn-secondary' : 'btn-primary'}`}
            type="button"
            disabled={guardandoSesion}
            onClick={alternarTemporizador}
          >
            {textoBotonTemporizador}
          </button>
          <button
            id="btn-pomo-reset"
            className="btn-pomo btn-secondary"
            type="button"
            disabled={guardandoSesion}
            onClick={reiniciarTemporizador}
          >
            Reiniciar
          </button>
          <button
            id="btn-pomo-break"
            className="btn-pomo btn-secondary"
            type="button"
            disabled={guardandoSesion}
            onClick={iniciarDescanso}
          >
            +5 min Descanso
          </button>
          <button
            id="btn-pomo-stopwatch"
            className="btn-pomo btn-secondary"
            type="button"
            disabled={guardandoSesion}
            onClick={iniciarCronometro}
          >
            Cronómetro libre
          </button>
          <button
            id="btn-focus-mode"
            className="btn-pomo btn-secondary"
            type="button"
            aria-pressed={modoEnfoque}
            onClick={() => setModoEnfoque(actual => !actual)}
          >
            {modoEnfoque ? 'Salir del modo enfoque' : 'Activar modo enfoque'}
          </button>
        </div>
        <p id="pomo-status" className="device-status" role="status" aria-live="polite">
          {estado}
        </p>
      </div>
    </section>
  );
}
