import { useEffect, useState, type ReactElement } from 'react';
import { obtenerResumenDia, type ResumenDia } from '../../features/resumen';

interface ModuloResumenProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
  onNavigate: (tabId: string, focusTargetId?: string) => void;
}

export function ModuloResumen({ activo, databaseReady, onNavigate }: ModuloResumenProps): ReactElement {
  const [resumen, setResumen] = useState<ResumenDia>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const datos = await obtenerResumenDia(databaseReady);
        if (montado) {
          setResumen(datos);
          setError(false);
        }
      } catch (causa) {
        console.error('No se pudo actualizar el resumen del día:', causa);
        if (montado) {
          setResumen(undefined);
          setError(true);
        }
      }
    };

    void actualizar();
    window.addEventListener('entregas-actualizadas', actualizar);
    window.addEventListener('horario-actualizado', actualizar);
    window.addEventListener('sesion-estudio-guardada', actualizar);
    return () => {
      montado = false;
      window.removeEventListener('entregas-actualizadas', actualizar);
      window.removeEventListener('horario-actualizado', actualizar);
      window.removeEventListener('sesion-estudio-guardada', actualizar);
    };
  }, [databaseReady]);

  const cargando = !resumen && !error;
  const textoEstado = error
    ? 'No se pudo cargar el resumen. Revisa tu almacenamiento local e inténtalo de nuevo.'
    : 'Cargando…';

  return (
    <section id="tab-resumen" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="hero-banner">
        <div className="hero-header">
          <div>
            <p className="hero-badge">Tu espacio académico</p>
            <h1 className="hero-title">Así va tu día</h1>
          </div>
          <button
            className="hero-action"
            type="button"
            onClick={() => onNavigate('tab-entregas', 'delivery-title-input')}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12m6-6H4" />
            </svg>
            Nueva entrega
          </button>
        </div>

        <div className="metrics-row" aria-live="polite">
          <div className="metric-card">
            <div className="metric-label"><span>Clases hoy</span></div>
            <div className="metric-value">{resumen?.cantidadClases ?? '—'}</div>
            <div className="metric-detail">
              {resumen?.siguienteClase ?? (error ? 'Agenda no disponible.' : 'El horario se mostrará aquí.')}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><span>Entregas pendientes</span></div>
            <div className="metric-value">{resumen?.cantidadPendientes ?? '—'}</div>
            <div className="metric-detail">Tareas y evaluaciones por completar</div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><span>Requieren atención</span></div>
            <div className="metric-value urgent">{resumen?.cantidadUrgentes ?? '—'}</div>
            <div className="metric-detail">Vencidas o con fecha límite en 48 horas</div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><span>Estudio registrado hoy</span></div>
            <div className="metric-value">{resumen?.tiempoEstudio ?? '—'}</div>
            <div className="metric-detail">Tiempo acumulado en sesiones de enfoque y cronómetro</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-daily-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">Agenda del día</h2>
            <span className="panel-badge">
              {resumen ? `${resumen.cantidadClases} clase${resumen.cantidadClases === 1 ? '' : 's'}` : '—'}
            </span>
          </div>
          <div className="agenda-list" aria-live="polite" aria-busy={cargando}>
            {resumen?.agenda.length
              ? resumen.agenda.map(clase => (
                  <article key={clase.clave} className="agenda-item">
                    <div className="agenda-time">
                      {clase.horaInicio}<br />
                      <small>{clase.horaFin}</small>
                    </div>
                    <div className="agenda-info">
                      <div className="agenda-subject">{clase.asignatura}</div>
                      <div className="agenda-desc">{clase.ubicacion}</div>
                    </div>
                  </article>
                ))
              : <p className="dashboard-empty">{resumen ? 'No hay clases en tu horario para hoy.' : textoEstado}</p>}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">Prioridades de hoy</h2>
            <span className="panel-badge danger">
              {resumen?.etiquetaPrioridades ?? (error ? 'No disponible' : 'Calculando…')}
            </span>
          </div>
          <div className="deliveries-list" aria-live="polite" aria-busy={cargando}>
            {resumen?.prioridades.length
              ? resumen.prioridades.map(entrega => (
                  <article
                    key={entrega.clave}
                    className={`delivery-item priority-item priority-${entrega.prioridad}`}
                  >
                    <div className="priority-item-info">
                      <strong className="delivery-title">{entrega.titulo}</strong>
                      <span className="delivery-meta">{entrega.asignatura} · {entrega.fechaLimite}</span>
                    </div>
                    <div className="priority-item-badges">
                      <span className={`tag tag-${entrega.prioridad}`}>Importancia {entrega.prioridad}</span>
                      <span className="tag tag-info">{entrega.estado}</span>
                    </div>
                  </article>
                ))
              : <p className="dashboard-empty">
                  {resumen
                    ? '¡Todo al día! No tienes entregas pendientes.'
                    : error
                      ? textoEstado
                      : 'Cargando prioridades…'}
                </p>}
          </div>
        </div>
      </div>
    </section>
  );
}
