import type { ReactElement } from 'react';

interface ModuloProgresoProps {
  activo: boolean;
}

export function ModuloProgreso({ activo }: ModuloProgresoProps): ReactElement {
  return (
    <section id="tab-progreso" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">Metas semanales</h2>
          <form id="goals-form" className="delivery-form">
            <div className="form-group">
              <label htmlFor="goal-study-minutes">Minutos de estudio por semana <span className="required-mark" aria-hidden="true">*</span></label>
              <input id="goal-study-minutes" className="form-control" type="number" min="1" max="10080" required placeholder="Ej. 300" />
            </div>
            <div className="form-group">
              <label htmlFor="goal-average">Promedio deseado (escala 0-5) <span className="required-mark" aria-hidden="true">*</span></label>
              <input id="goal-average" className="form-control" type="number" min="0" max="5" step="0.1" required placeholder="Ej. 4,0" />
            </div>
            <button className="btn btn-save" type="submit">Guardar metas</button>
          </form>
          <p id="goals-status" className="device-status" role="status" aria-live="polite"></p>
          <div id="weekly-progress" className="goals-progress" aria-live="polite"></div>
        </div>
        <div className="dashboard-panel">
          <h2 className="panel-title">Resumen de esta semana</h2>
          <div id="weekly-summary" className="weekly-summary" aria-live="polite"></div>
        </div>
        <div className="dashboard-panel">
          <h2 className="panel-title">Constancia y logros</h2>
          <div id="gamification-summary" className="weekly-summary" aria-live="polite"></div>
        </div>
      </div>
    </section>
  );
}
