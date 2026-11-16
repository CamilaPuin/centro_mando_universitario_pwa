import type { ReactElement } from 'react';

interface ModuloEntregasProps {
  activo: boolean;
}

export function ModuloEntregas({ activo }: ModuloEntregasProps): ReactElement {
  return (
    <section id="tab-entregas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-panel exam-week-panel">
        <h2 className="panel-title">Exámenes de la semana</h2>
        <p className="device-help">Evaluaciones con categoría “Examen” durante los próximos siete días.</p>
        <div id="exam-week-list" className="exam-week-list" aria-live="polite"></div>
      </div>
      <div className="dashboard-panel delivery-editor-panel">
        <h2 className="panel-title">Entrega o evaluación</h2>
        <p className="device-help">Los cambios se guardan automáticamente y se sincronizan con tu cuenta para verlos en otros dispositivos.</p>
        <form id="delivery-form" className="delivery-form">
          <input id="delivery-id" type="hidden" />
          <div className="form-group">
            <label htmlFor="delivery-title-input">Nombre <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="delivery-title-input" className="form-control" required maxLength={160} placeholder="Ej. Taller de límites" />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-subject-input">Asignatura <span className="required-mark" aria-hidden="true">*</span></label>
            <select id="delivery-subject-input" className="form-control" required defaultValue="">
              <option value="" disabled>Selecciona una asignatura</option>
              <option value="__otra__">Otra asignatura…</option>
            </select>
            <input
              id="delivery-subject-custom"
              className="form-control"
              maxLength={120}
              placeholder="Escribe el nombre de la asignatura"
              aria-label="Nombre de otra asignatura"
              hidden
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-date-input">Fecha y hora</label>
            <input id="delivery-date-input" className="form-control" type="datetime-local" />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-priority-input">Importancia <span className="required-mark" aria-hidden="true">*</span></label>
            <select id="delivery-priority-input" className="form-control" required defaultValue="media">
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-category-input">Categoría <span className="required-mark" aria-hidden="true">*</span></label>
            <select id="delivery-category-input" className="form-control" required defaultValue="tarea">
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-status-input">Estado <span className="required-mark" aria-hidden="true">*</span></label>
            <select id="delivery-status-input" className="form-control" required defaultValue="pendiente">
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="entregada">Entregada</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-grade-input">Calificación</label>
            <input id="delivery-grade-input" className="form-control" type="number" min="0" step="0.01" placeholder="Ej. 4,5" />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-grade-max-input">Nota máxima <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="delivery-grade-max-input" className="form-control" type="number" min="0.01" step="0.01" defaultValue="5" required />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-detail-input">Detalles</label>
            <textarea id="delivery-detail-input" className="form-control" maxLength={2000} placeholder="Agrega indicaciones, temas o materiales necesarios." />
          </div>
          <div className="profile-actions">
            <button className="btn btn-save" type="submit">Guardar entrega</button>
            <button id="delivery-cancel-edit" className="btn btn-load" type="button" hidden>Cancelar edición</button>
          </div>
        </form>
        <p id="delivery-sync-status" className="device-status" role="status" aria-live="polite"></p>
        <div id="local-deliveries" className="kanban-cards local-deliveries" aria-label="Entregas y evaluaciones registradas"></div>
      </div>
      <div className="kanban-grid">
        <div className="kanban-col">
          <div className="kanban-col-header">
            <div className="kanban-title">
              <span className="kanban-dot dot-pending"></span>
              <span>Pendiente</span>
            </div>
            <span className="panel-badge" id="count-pending">0</span>
          </div>
          <div className="kanban-cards" id="col-pending"></div>
        </div>
        <div className="kanban-col">
          <div className="kanban-col-header">
            <div className="kanban-title">
              <span className="kanban-dot dot-progress"></span>
              <span>En progreso</span>
            </div>
            <span className="panel-badge" id="count-progress">0</span>
          </div>
          <div className="kanban-cards" id="col-progress"></div>
        </div>
        <div className="kanban-col">
          <div className="kanban-col-header">
            <div className="kanban-title">
              <span className="kanban-dot dot-done"></span>
              <span>Entregado</span>
            </div>
            <span className="panel-badge" id="count-done">0</span>
          </div>
          <div className="kanban-cards" id="col-done"></div>
        </div>
      </div>
    </section>
  );
}
