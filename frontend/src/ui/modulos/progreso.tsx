import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  guardarMetasProgreso,
  obtenerDatosProgreso,
  type DatosProgreso
} from '../../features/progreso';
import { describirErrorParaUsuario } from '../../utils/db';

interface ModuloProgresoProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

export function ModuloProgreso({
  activo,
  databaseReady
}: ModuloProgresoProps): ReactElement {
  const [datos, setDatos] = useState<DatosProgreso>();
  const [minutosMeta, setMinutosMeta] = useState('300');
  const [estado, setEstado] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosProgreso(databaseReady);
        if (montado) {
          setDatos(resultado);
          setMinutosMeta(String(resultado.minutosMeta));
          const errores = [resultado.errorSemanal, resultado.errorLogros].filter(Boolean);
          if (errores.length) setEstado([...new Set(errores)].join(' '));
        }
      } catch (causa) {
        console.error('No se pudo calcular el progreso semanal:', causa);
        if (montado) {
          setDatos(undefined);
          setEstado(describirErrorParaUsuario(causa, 'No se pudo cargar el progreso semanal. Inténtalo de nuevo.'));
        }
      }
    };
    const eventos = ['sesion-estudio-guardada', 'entregas-actualizadas', 'auth-changed'];

    void actualizar();
    eventos.forEach(nombre => window.addEventListener(nombre, actualizar));
    return () => {
      montado = false;
      eventos.forEach(nombre => window.removeEventListener(nombre, actualizar));
    };
  }, [databaseReady, recarga]);

  const guardarMetas = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setEstado('Guardando metas…');
    try {
      const mensaje = await guardarMetasProgreso(
        databaseReady,
        Number(minutosMeta)
      );
      setEstado(mensaje);
      setRecarga(actual => actual + 1);
    } catch (causa) {
      setEstado(describirErrorParaUsuario(causa, 'No se pudieron guardar las metas. Inténtalo de nuevo.'));
    }
  };

  return (
    <section id="tab-progreso" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">Metas semanales</h2>
          <form id="goals-form" className="delivery-form" onSubmit={guardarMetas}>
            <div className="form-group">
              <label htmlFor="goal-study-minutes">
                Minutos de estudio por semana <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="goal-study-minutes"
                className="form-control"
                type="number"
                min="1"
                max="10080"
                required
                placeholder="Ej. 300"
                value={minutosMeta}
                onChange={event => setMinutosMeta(event.currentTarget.value)}
              />
            </div>
            <button className="btn btn-save" type="submit">Guardar metas</button>
          </form>
          <p id="goals-status" className="device-status" role="status" aria-live="polite">{estado}</p>
          <div id="weekly-progress" className="goals-progress" aria-live="polite">
            {datos ? (
              <>
                <div className="progress-summary-item">
                  <span>Estudio esta semana</span>
                  <strong>{datos.minutosEstudiados} / {datos.minutosMeta} min</strong>
                </div>
                <progress
                  max={100}
                  value={datos.porcentajeMeta}
                  aria-label={`Meta de estudio completada al ${datos.porcentajeMeta}%`}
                />
                <p className="device-help">{datos.porcentajeMeta}% de la meta semanal</p>
              </>
            ) : <p className="device-help">Cargando progreso…</p>}
          </div>
        </div>
        <div className="dashboard-panel">
          <h2 className="panel-title">Resumen de esta semana</h2>
          <div id="weekly-summary" className="weekly-summary" aria-live="polite">
            {datos
              ? datos.resumenSemanal.map((item, index) => (
                  <div key={`${item.etiqueta}-${index}`} className="progress-summary-item">
                    <span>{item.etiqueta}</span>
                    <strong>{item.valor}</strong>
                  </div>
                ))
              : <p className="device-help">Cargando resumen semanal…</p>}
          </div>
        </div>
        <div className="dashboard-panel">
          <h2 className="panel-title">Constancia y logros</h2>
          <div id="gamification-summary" className="weekly-summary" aria-live="polite">
            {datos
              ? datos.resumenLogros.map((item, index) => (
                  <div key={`${item.etiqueta}-${index}`} className="progress-summary-item">
                    <span>{item.etiqueta}</span>
                    <strong>{item.valor}</strong>
                  </div>
                ))
              : <p className="device-help">Cargando logros…</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
