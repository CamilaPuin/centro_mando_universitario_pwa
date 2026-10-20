export function renderizarModuloResumen(): string {
  return `
    <section id="tab-resumen" class="tab-view active">
      <div class="hero-banner">
        <div class="hero-header">
          <span class="hero-badge">Centro de Control Académico</span>
          <h1 class="hero-title">Tu día, con prioridades claras</h1>
          <p class="hero-subtitle">Un resumen basado en tus entregas guardadas en este dispositivo. Las prioridades se calculan según la fecha límite y la importancia que asignaste.</p>
        </div>

        <div class="metrics-row" aria-live="polite">
          <div class="metric-card">
            <div class="metric-label"><span>Clases hoy</span></div>
            <div class="metric-value" id="dashboard-class-count">—</div>
            <div class="metric-detail" id="dashboard-next-class">El horario se mostrará aquí.</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><span>Entregas pendientes</span></div>
            <div class="metric-value" id="dashboard-pending-count">—</div>
            <div class="metric-detail">Tareas y evaluaciones por completar</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><span>Requieren atención</span></div>
            <div class="metric-value urgent" id="dashboard-urgent-count">—</div>
            <div class="metric-detail">Vencidas o con fecha límite en 48 horas</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><span>Estudio registrado hoy</span></div>
            <div class="metric-value" id="dashboard-study-time">0 min</div>
            <div class="metric-detail">Tiempo acumulado en sesiones de enfoque y cronómetro</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid dashboard-daily-grid">
        <div class="dashboard-panel">
          <div class="panel-header">
            <h2 class="panel-title">Agenda del día</h2>
            <span class="panel-badge" id="dashboard-agenda-count">0 clases</span>
          </div>
          <div class="agenda-list" id="dashboard-agenda-list" aria-live="polite">
            <p class="dashboard-empty">Cargando tu agenda…</p>
          </div>
        </div>

        <div class="dashboard-panel">
          <div class="panel-header">
            <h2 class="panel-title">Prioridades de hoy</h2>
            <span class="panel-badge danger" id="dashboard-priority-count">Calculando…</span>
          </div>
          <div class="deliveries-list" id="urgent-deliveries-list" aria-live="polite">
            <p class="dashboard-empty">Cargando prioridades…</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
