import { interfazDispositivo } from '../devices/interfaz';

export function renderizarAplicacion(): void {
  const app = document.getElementById('app')!;

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const fechaFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  app.innerHTML = `
    <div class="app-container">
      <header class="top-nav">
        <div class="brand-section">
          <img src="icons/icon-192.png" alt="Centro de Mando Universitario" class="brand-logo" />
          <div>
            <div class="brand-title">Centro de Mando Universitario</div>
            <div class="brand-subtitle">Gestión académica personal</div>
          </div>
        </div>
        <div class="nav-meta">
          <div class="date-pill">
            <span>${fechaFormateada}</span>
          </div>
          <button id="install-app" class="install-button" type="button" hidden>Instalar Centro de Mando</button>
          <span id="network-status" class="badge online">
            <span class="badge-dot"></span>
            <span>En línea</span>
          </span>
        </div>
      </header>

      <div id="offline-banner" class="offline-banner" role="status" aria-live="polite" hidden>
        Sin conexión: mostrando datos guardados en caché
      </div>
      <p id="ios-install-help" class="ios-install-help" role="note" hidden>
        Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
      </p>

      <main id="main-content">
        <nav class="nav-tabs" aria-label="Secciones del Centro de Mando">
          <button class="tab-btn active" data-tab="tab-resumen">Resumen del Día</button>
          <button class="tab-btn" data-tab="tab-asignaturas">Asignaturas y Horario</button>
          <button class="tab-btn" data-tab="tab-entregas">Tablero de Entregas</button>
          <button class="tab-btn" data-tab="tab-calendario">Calendario</button>
          <button class="tab-btn" data-tab="tab-pomodoro">Cronómetro y Pomodoro</button>
          <button class="tab-btn" data-tab="tab-notas">Apuntes por Materia</button>
          <button class="tab-btn" data-tab="tab-progreso">Metas y Progreso</button>
          <button class="tab-btn" data-tab="tab-dispositivo">Perfil y Recordatorios</button>
        </nav>

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

      <section id="tab-dispositivo" class="tab-view">
        ${interfazDispositivo}
      </section>

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

      <section id="tab-pomodoro" class="tab-view">
        <div class="pomodoro-wrapper">
          <h3>Cronómetro y Modo Pomodoro</h3>
          <p class="pomo-subtitle">
            Sesiones de concentración asociadas directamente a tus asignaturas.
          </p>

          <div class="pomo-materia-row">
            <label for="pomo-materia-select">Asignatura:</label>
            <select id="pomo-materia-select" class="form-control inline">
              <option value="">Registra una asignatura para empezar</option>
            </select>
          </div>

          <div class="pomo-circle">
            <div class="pomo-time" id="pomo-display">25:00</div>
            <div class="pomo-subject" id="pomo-subject-label">Sin asignatura</div>
          </div>

          <div class="pomo-controls">
            <button id="btn-pomo-toggle" class="btn-pomo btn-primary">Iniciar Enfoque</button>
            <button id="btn-pomo-reset" class="btn-pomo btn-secondary">Reiniciar</button>
            <button id="btn-pomo-break" class="btn-pomo btn-secondary">+5 min Descanso</button>
            <button id="btn-pomo-stopwatch" class="btn-pomo btn-secondary">Cronómetro libre</button>
            <button id="btn-focus-mode" class="btn-pomo btn-secondary" aria-pressed="false">Activar modo enfoque</button>
          </div>
          <p id="pomo-status" class="device-status" role="status" aria-live="polite">Las sesiones se registran al pausar, reiniciar o completar el enfoque.</p>
        </div>
      </section>

      <section id="tab-notas" class="tab-view">
        <div class="crypto-wrapper">
          <h2>Bitácora rápida por asignatura</h2>
          <p class="subtitle">Guarda recordatorios y apuntes breves junto a cada materia. Se almacenan en este dispositivo y puedes editarlos después.</p>
          <form id="note-form" class="delivery-form">
            <input id="note-id" type="hidden" />
            <div class="form-group">
              <label for="note-subject">Asignatura:</label>
              <select id="note-subject" class="form-control" required>
                <option value="" disabled selected>Selecciona una asignatura</option>
              </select>
            </div>
            <div class="form-group">
              <label for="note-content">Apunte:</label>
              <textarea id="note-content" class="form-control" required maxlength="4000" placeholder="Ej. Repasar integración por partes antes del jueves."></textarea>
            </div>
            <div class="profile-actions">
              <button class="btn btn-save" type="submit">Guardar apunte</button>
              <button id="note-cancel-edit" class="btn btn-load" type="button" hidden>Cancelar edición</button>
            </div>
          </form>
          <p id="note-status" class="device-status" role="status" aria-live="polite"></p>
          <div id="subject-notes-list" class="local-deliveries" aria-label="Apuntes guardados por asignatura"></div>
        </div>
      </section>

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
                <label for="goal-average">Promedio deseado (escala 0–5):</label>
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

      </main>

      <footer class="app-footer">
        Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
      </footer>
    </div>
  `;

}
