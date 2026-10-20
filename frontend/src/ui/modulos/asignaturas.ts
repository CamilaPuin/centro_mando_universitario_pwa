export function renderizarModuloAsignaturas(): string {
  return `
    <section id="tab-asignaturas" class="tab-view">
      <div class="dashboard-grid">
        <div class="dashboard-panel">
          <h2 class="panel-title">Mis asignaturas</h2>
          <p class="device-help">Se guardan localmente en este dispositivo y estarán disponibles sin conexión.</p>
          <form id="subject-form" class="delivery-form">
            <input id="subject-id" type="hidden" />
            <div class="form-group">
              <label for="subject-name">Nombre de la asignatura:</label>
              <input id="subject-name" class="form-control" required maxlength="120" />
            </div>
            <div class="profile-actions">
              <button class="btn btn-save" type="submit">Agregar asignatura</button>
              <button id="subject-cancel-edit" class="btn btn-load" type="button" hidden>Cancelar edición</button>
            </div>
          </form>
          <p id="subject-status" class="device-status" role="status" aria-live="polite"></p>
          <div id="subject-list" class="local-deliveries" aria-label="Asignaturas registradas"></div>
        </div>

        <div class="dashboard-panel">
          <h2 class="panel-title">Horario semanal de clases</h2>
          <p class="device-help">Agrega sesiones recurrentes. No se permitirán cruces de horario el mismo día.</p>
          <form id="class-form" class="delivery-form">
            <input id="class-id" type="hidden" />
            <div class="form-group">
              <label for="class-subject">Asignatura:</label>
              <select id="class-subject" class="form-control" required></select>
            </div>
            <div class="form-group">
              <label for="class-weekday">Día:</label>
              <select id="class-weekday" class="form-control" required>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
              </select>
            </div>
            <div class="form-group">
              <label for="class-start">Hora de inicio:</label>
              <input id="class-start" class="form-control" type="time" required />
            </div>
            <div class="form-group">
              <label for="class-end">Hora de fin:</label>
              <input id="class-end" class="form-control" type="time" required />
            </div>
            <div class="form-group">
              <label for="class-location">Aula o ubicación (opcional):</label>
              <input id="class-location" class="form-control" maxlength="120" />
            </div>
            <div class="profile-actions">
              <button id="class-submit" class="btn btn-save" type="submit">Agregar al horario</button>
              <button id="class-cancel-edit" class="btn btn-load" type="button" hidden>Cancelar edición</button>
            </div>
          </form>
          <p id="class-status" class="device-status" role="status" aria-live="polite"></p>
          <div id="class-list" class="local-deliveries" aria-label="Clases programadas"></div>
        </div>
      </div>
    </section>
  `;
}
