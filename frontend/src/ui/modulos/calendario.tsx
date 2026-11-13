import { useEffect, useState, type ReactElement } from 'react';
import {
  obtenerDatosCalendario,
  type DatosCalendario,
  type VistaCalendario
} from '../../features/calendario';

interface ModuloCalendarioProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

function desplazarFecha(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

export function ModuloCalendario({
  activo,
  databaseReady
}: ModuloCalendarioProps): ReactElement {
  const [ancla, setAncla] = useState(() => new Date());
  const [vista, setVista] = useState<VistaCalendario>('week');
  const [datos, setDatos] = useState<DatosCalendario>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosCalendario(databaseReady, ancla, vista);
        if (montado) {
          setDatos(resultado);
          setError(false);
        }
      } catch (causa) {
        console.error('No se pudo cargar el calendario:', causa);
        if (montado) {
          setDatos(undefined);
          setError(true);
        }
      }
    };
    const eventos = [
      'entregas-actualizadas',
      'horario-actualizado',
      'asignaturas-actualizadas'
    ];

    void actualizar();
    eventos.forEach(nombre => window.addEventListener(nombre, actualizar));
    window.addEventListener('focus', actualizar);
    return () => {
      montado = false;
      eventos.forEach(nombre => window.removeEventListener(nombre, actualizar));
      window.removeEventListener('focus', actualizar);
    };
  }, [ancla, databaseReady, vista]);

  const moverPeriodo = (direccion: number): void => {
    setAncla(vista === 'month'
      ? new Date(ancla.getFullYear(), ancla.getMonth() + direccion, 1)
      : desplazarFecha(ancla, direccion * 7));
  };
  const cargando = !datos && !error;

  return (
    <section id="tab-calendario" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-panel">
        <div className="panel-header">
          <h2 className="panel-title">Calendario académico</h2>
          <div className="calendar-controls">
            <button
              id="calendar-previous"
              className="btn btn-load"
              type="button"
              aria-label="Periodo anterior"
              onClick={() => moverPeriodo(-1)}
            >
              ‹
            </button>
            <h3 id="calendar-period" aria-live="polite">
              {datos?.periodo ?? (error ? 'Calendario no disponible' : 'Cargando…')}
            </h3>
            <button
              id="calendar-next"
              className="btn btn-load"
              type="button"
              aria-label="Periodo siguiente"
              onClick={() => moverPeriodo(1)}
            >
              ›
            </button>
            <button
              id="calendar-today"
              className="btn btn-load"
              type="button"
              onClick={() => setAncla(new Date())}
            >
              Hoy
            </button>
            <select
              id="calendar-view"
              className="form-control inline"
              aria-label="Vista del calendario"
              value={vista}
              onChange={event => setVista(event.currentTarget.value === 'month' ? 'month' : 'week')}
            >
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
        </div>
        <div
          id="calendar-grid"
          className={`calendar-grid${vista === 'month' ? ' calendar-month-view' : ''}`}
          aria-live="polite"
          aria-busy={cargando}
        >
          {vista === 'month' && ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
            <div key={dia} className="calendar-weekday">{dia}</div>
          ))}
          {datos?.dias.map(dia => (
            <article
              key={dia.clave}
              className={[
                'calendar-day',
                dia.esHoy ? 'is-today' : '',
                dia.fueraDelMes ? 'outside-month' : ''
              ].filter(Boolean).join(' ')}
            >
              <h3>{dia.encabezado}</h3>
              {dia.eventos.map((evento, indice) => (
                <div
                  key={`${evento.tipo}-${evento.titulo}-${evento.detalle}-${indice}`}
                  className={`calendar-event ${evento.tipo}`}
                  title={evento.detalle}
                >
                  <strong>{evento.titulo}</strong>
                  <small>{evento.detalle}</small>
                </div>
              ))}
              {vista === 'week' && dia.eventos.length === 0 && (
                <p className="calendar-empty">Sin actividades</p>
              )}
            </article>
          ))}
          {!datos && (
            <p className="dashboard-empty">
              {error ? 'Ocurrió un error al cargar el calendario.' : 'Cargando calendario…'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
