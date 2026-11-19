import { useEffect, useState, type ReactElement } from 'react';
import { obtenerDatosAsignaturas, type DatosAsignaturas } from '../../features/asignaturas';

interface ModuloPomodoroProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

export function ModuloPomodoro({ activo, databaseReady }: ModuloPomodoroProps): ReactElement {
  const [datos, setDatos] = useState<DatosAsignaturas>();
  const [asignatura, setAsignatura] = useState('');

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosAsignaturas(databaseReady);
        if (!montado) return;
        setDatos(resultado);
      } catch (causa) {
        console.error('No se pudieron cargar las asignaturas para el pomodoro:', causa);
      }
    };
    void actualizar();
    window.addEventListener('asignaturas-actualizadas', actualizar);
    return () => {
      montado = false;
      window.removeEventListener('asignaturas-actualizadas', actualizar);
    };
  }, [databaseReady]);

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
            value={asignatura}
            onChange={event => setAsignatura(event.currentTarget.value)}
          >
            <option value="">Registra una asignatura para empezar</option>
            {datos?.asignaturas.map(materia => (
              <option key={materia.id ?? materia.nombre} value={materia.nombre}>
                {materia.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="pomo-circle">
          <div className="pomo-time" id="pomo-display">25:00</div>
          <div className="pomo-subject" id="pomo-subject-label">Sin asignatura</div>
        </div>
        <div className="pomo-controls">
          <button id="btn-pomo-toggle" className="btn-pomo btn-primary" type="button">Iniciar Enfoque</button>
          <button id="btn-pomo-reset" className="btn-pomo btn-secondary" type="button">Reiniciar</button>
          <button id="btn-pomo-break" className="btn-pomo btn-secondary" type="button">+5 min Descanso</button>
          <button id="btn-pomo-stopwatch" className="btn-pomo btn-secondary" type="button">Cronómetro libre</button>
          <button
            id="btn-focus-mode"
            className="btn-pomo btn-secondary"
            type="button"
            aria-pressed="false"
          >
            Activar modo enfoque
          </button>
        </div>
        <p id="pomo-status" className="device-status" role="status" aria-live="polite">
          Las sesiones se registran al pausar, reiniciar o completar el enfoque.
        </p>
      </div>
    </section>
  );
}