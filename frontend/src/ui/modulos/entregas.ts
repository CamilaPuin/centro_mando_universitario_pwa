export function renderizarModuloEntregas(): string {
  return `
    <section id="tab-entregas" class="tab-view">
      <div class="dashboard-panel exam-week-panel">
        <h2 class="panel-title">Semana de exámenes</h2>
        <p class="device-help">Evaluaciones con categoría “Examen” durante los próximos siete días.</p>
        <div id="exam-week-list" class="exam-week-list" aria-live="polite"></div>
      </div>
      <div class="dashboard-panel delivery-editor-panel">
        <h2 class="panel-title">Entrega o evaluación</h2>
        <p class="device-help">Se guarda primero en el dispositivo y se sincroniza al recuperar conexión.</p>
        <form id="delivery-form" class="delivery-form">
          <input id="delivery-id" type="hidden" />
          <div class="form-group">
            <label for="delivery-title-input">Nombre:</label>
            <input id="delivery-title-input" class="form-control" required maxlength="160" />
          </div>
          <div class="form-group">
            <label for="delivery-subject-input">Asignatura:</label>
            <input id="delivery-subject-input" class="form-control" required maxlength="120" />
          </div>
          <div class="form-group">
            <label for="delivery-date-input">Fecha y hora:</label>
            <input id="delivery-date-input" class="form-control" type="datetime-local" />
          </div>
          <div class="form-group">
            <label for="delivery-priority-input">Importancia:</label>
            <select id="delivery-priority-input" class="form-control">
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div class="form-group">
            <label for="delivery-category-input">Categoría:</label>
            <select id="delivery-category-input" class="form-control">
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label for="delivery-status-input">Estado:</label>
            <select id="delivery-status-input" class="form-control">
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="entregada">Entregada</option>
            </select>
          </div>
          <div class="form-group">
            <label for="delivery-grade-input">Calificación (opcional):</label>
            <input id="delivery-grade-input" class="form-control" type="number" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label for="delivery-grade-max-input">Nota máxima:</label>
            <input id="delivery-grade-max-input" class="form-control" type="number" min="0.01" step="0.01" value="5" />
          </div>
          <div class="form-group">
            <label for="delivery-detail-input">Detalles:</label>
            <textarea id="delivery-detail-input" class="form-control" maxlength="2000"></textarea>
          </div>
          <div class="profile-actions">
            <button class="btn btn-save" type="submit">Guardar offline y sincronizar</button>
            <button id="delivery-cancel-edit" class="btn btn-load" type="button" hidden>Cancelar edición</button>
          </div>
        </form>
        <p id="delivery-sync-status" class="device-status" role="status" aria-live="polite">Los cambios pendientes se conservarán en este dispositivo.</p>
        <div id="local-deliveries" class="kanban-cards local-deliveries" aria-label="Entregas y evaluaciones guardadas localmente"></div>
      </div>
      <div class="kanban-grid">
        <div class="kanban-col">
          <div class="kanban-col-header">
            <div class="kanban-title">
              <span class="kanban-dot dot-pending"></span>
              <span>Pendiente</span>
            </div>
            <span class="panel-badge" id="count-pending">0</span>
          </div>
          <div class="kanban-cards" id="col-pending"></div>
        </div>

        <div class="kanban-col">
          <div class="kanban-col-header">
            <div class="kanban-title">
              <span class="kanban-dot dot-progress"></span>
              <span>En progreso</span>
            </div>
            <span class="panel-badge" id="count-progress">0</span>
          </div>
          <div class="kanban-cards" id="col-progress"></div>
        </div>

        <div class="kanban-col">
          <div class="kanban-col-header">
            <div class="kanban-title">
              <span class="kanban-dot dot-done"></span>
              <span>Entregado</span>
            </div>
            <span class="panel-badge" id="count-done">0</span>
          </div>
          <div class="kanban-cards" id="col-done"></div>
        </div>
      </div>
    </section>
  `;
}
