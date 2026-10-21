export function renderizarModuloProgreso(): string {
  return `
    <section id="tab-progreso" class="tab-view">
      <div class="dashboard-grid">
        <div class="dashboard-panel">
          <h2 class="panel-title">Metas semanales</h2>
          <form id="goals-form" class="delivery-form">
            <div class="form-group">
              <label for="goal-study-minutes">Minutos de estudio por semana:</label>
              <input id="goal-study-minutes" class="form-control" type="number" min="1" max="10080" required />
            </div>
            <div class="form-group">
              <label for="goal-average">Promedio deseado (escala 0-5):</label>
              <input id="goal-average" class="form-control" type="number" min="0" max="5" step="0.1" required />
            </div>
            <button class="btn btn-save" type="submit">Guardar metas</button>
          </form>
          <p id="goals-status" class="device-status" role="status" aria-live="polite"></p>
          <div id="weekly-progress" class="goals-progress" aria-live="polite"></div>
        </div>
        <div class="dashboard-panel">
          <h2 class="panel-title">Resumen de esta semana</h2>
          <div id="weekly-summary" class="weekly-summary" aria-live="polite"></div>
        </div>
        <div class="dashboard-panel">
          <h2 class="panel-title">Constancia y logros</h2>
          <div id="gamification-summary" class="weekly-summary" aria-live="polite"></div>
        </div>
      </div>
    </section>
  `;
}
