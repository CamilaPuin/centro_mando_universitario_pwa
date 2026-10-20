export function renderizarModuloCalendario(): string {
  return `
    <section id="tab-calendario" class="tab-view">
      <div class="dashboard-panel">
        <div class="panel-header">
          <h2 class="panel-title">Calendario académico</h2>
          <div class="calendar-controls">
            <button id="calendar-previous" class="btn btn-load" type="button" aria-label="Periodo anterior">‹</button>
            <h3 id="calendar-period" aria-live="polite"></h3>
            <button id="calendar-next" class="btn btn-load" type="button" aria-label="Periodo siguiente">›</button>
            <button id="calendar-today" class="btn btn-load" type="button">Hoy</button>
            <select id="calendar-view" class="form-control inline" aria-label="Vista del calendario">
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
        </div>
        <div id="calendar-grid" class="calendar-grid" aria-live="polite"></div>
      </div>
    </section>
  `;
}
