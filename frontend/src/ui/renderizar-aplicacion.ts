import { renderizarEncabezado, renderizarNavegacion, renderizarPie } from './estructura';
import { renderizarModuloAsignaturas } from './modulos/asignaturas';
import { renderizarModuloCalendario } from './modulos/calendario';
import { renderizarModuloDispositivo } from './modulos/dispositivo';
import { renderizarModuloEntregas } from './modulos/entregas';
import { renderizarModuloNotas } from './modulos/notas';
import { renderizarModuloPomodoro } from './modulos/pomodoro';
import { renderizarModuloProgreso } from './modulos/progreso';
import { renderizarModuloResumen } from './modulos/resumen';
import { renderizarDialogoCuenta } from './modulos/cuenta';

export function renderizarAplicacion(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('No se encontró el contenedor raíz #app.');
  }

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const fechaFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  const modulos = [
    renderizarModuloResumen(),
    renderizarModuloAsignaturas(),
    renderizarModuloEntregas(),
    renderizarModuloDispositivo(),
    renderizarModuloCalendario(),
    renderizarModuloPomodoro(),
    renderizarModuloNotas(),
    renderizarModuloProgreso()
  ];

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
          <span id="network-status" class="badge online">
            <span class="badge-dot"></span>
            <span>En línea</span>
          </span>
          <button id="install-app" class="install-button" type="button" hidden>Instalar</button>
          <div class="header-menu tools-menu">
            <button id="tools-menu-button" class="header-menu-button" type="button"
                    aria-expanded="false" aria-controls="tools-menu">
              <span>Más</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="tools-menu" class="header-popover" hidden>
              <p class="popover-heading">Herramientas</p>
              <button class="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
              <button class="popover-item" type="button" data-tab="tab-notas">Apuntes por materia</button>
            </div>
          </div>
          <div class="header-menu mobile-nav-menu">
            <button id="mobile-menu-button" class="header-menu-button hamburger-button" type="button"
                    aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="mobile-nav-menu">
              <span class="hamburger-icon" aria-hidden="true"><span></span><span></span><span></span></span>
              <span>Menú</span>
            </button>
            <div id="mobile-nav-menu" class="header-popover mobile-nav-popover" hidden>
              <p class="popover-heading">Navegación</p>
              <button class="popover-item" type="button" data-tab="tab-resumen">Hoy</button>
              <button class="popover-item" type="button" data-tab="tab-asignaturas">Materias y horario</button>
              <button class="popover-item" type="button" data-tab="tab-entregas">Entregas</button>
              <button class="popover-item" type="button" data-tab="tab-calendario">Calendario</button>
              <button class="popover-item" type="button" data-tab="tab-progreso">Progreso</button>
              <button class="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
              <button class="popover-item" type="button" data-tab="tab-notas">Apuntes</button>
              <button class="popover-item" type="button" data-tab="tab-dispositivo">Perfil y recordatorios</button>
            </div>
          </div>
          <div class="header-menu profile-menu">
            <button id="profile-menu-button" class="profile-menu-button" type="button"
                    aria-label="Abrir menú de perfil" aria-expanded="false" aria-controls="profile-menu">
              <span class="profile-menu-avatar" aria-hidden="true">
                <span id="profile-menu-initial" class="profile-menu-initial">P</span>
                <img id="profile-menu-photo" class="profile-menu-photo" alt="" hidden />
              </span>
              <span id="profile-menu-name" class="profile-menu-name">Mi perfil</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="profile-menu" class="header-popover profile-popover" hidden>
              <p class="popover-heading">Tu cuenta</p>
              <button class="popover-item" type="button" data-tab="tab-dispositivo">Perfil y recordatorios</button>
              <button id="auth-button" class="popover-item" type="button">Iniciar sesión o crear cuenta</button>
            </div>
          </div>
        </div>
      </header>

      <div id="offline-banner" class="offline-banner" role="status" aria-live="polite" hidden>
        Sin conexión. Tus cambios se guardan y, si has iniciado sesión, se sincronizarán automáticamente cuando vuelva la conexión.
      </div>
      <p id="ios-install-help" class="ios-install-help" role="note" hidden>
        Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
      </p>

      <main id="main-content">
        <nav class="nav-tabs" aria-label="Secciones principales">
          <button class="tab-btn active" type="button" data-tab="tab-resumen" aria-current="page" aria-controls="tab-resumen">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3.75 10.5 12 3.75l8.25 6.75v9a.75.75 0 0 1-.75.75h-5.25v-6h-4.5v6H4.5a.75.75 0 0 1-.75-.75v-9Z" /></svg>
            <span class="tab-label">Hoy</span>
          </button>
          <button class="tab-btn" type="button" data-tab="tab-asignaturas" aria-controls="tab-asignaturas">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4.5 5.25h10.125A2.625 2.625 0 0 1 17.25 7.875V20.25H7.125A2.625 2.625 0 0 1 4.5 17.625V5.25Zm12.75 3h2.25v12h-2.25M8.25 9h6M8.25 12.75h6" /></svg>
            <span class="tab-label">Materias</span>
          </button>
          <button class="tab-btn" type="button" data-tab="tab-entregas" aria-controls="tab-entregas">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M8.25 5.25h-3A1.5 1.5 0 0 0 3.75 6.75v12A1.5 1.5 0 0 0 5.25 20.25h13.5a1.5 1.5 0 0 0 1.5-1.5v-12a1.5 1.5 0 0 0-1.5-1.5h-3M8.25 5.25a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5v1.5h-7.5v-1.5Zm-.75 7.5 2.25 2.25 6-6" /></svg>
            <span class="tab-label">Entregas</span>
          </button>
          <button class="tab-btn" type="button" data-tab="tab-calendario" aria-controls="tab-calendario">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M7.5 3.75v3m9-3v3m-12 3h15m-15-3h15a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-10.5a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>
            <span class="tab-label">Calendario</span>
          </button>
          <button class="tab-btn" type="button" data-tab="tab-progreso" aria-controls="tab-progreso">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4.5 19.5V12m5 7.5V7.5m5 12V4.5m5 15v-9" /></svg>
            <span class="tab-label">Progreso</span>
          </button>
        </nav>

      <section id="tab-resumen" class="tab-view active" aria-labelledby="dashboard-title">
        <div class="hero-banner">
          <div class="hero-header">
            <div>
              <h1 id="dashboard-title" class="hero-title">Así va tu día</h1>
              <p class="hero-subtitle">Clases, entregas y tiempo de estudio.</p>
            </div>
            <button class="hero-action" type="button" data-tab="tab-entregas" data-focus="delivery-title-input">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M10 4v12m6-6H4" /></svg>
              Nueva entrega
            </button>
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
             <form id="subject-form" class="delivery-form">
              <input id="subject-id" type="hidden" />
              <div class="form-group">
                <label for="subject-name">Nombre de la asignatura <span class="required-mark" aria-hidden="true">*</span></label>
                <input id="subject-name" class="form-control" required maxlength="120" placeholder="Ej. Cálculo I" />
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
                <label for="class-subject">Asignatura <span class="required-mark" aria-hidden="true">*</span></label>
                <select id="class-subject" class="form-control" required></select>
              </div>
              <div class="form-group">
                <label for="class-weekday">Día <span class="required-mark" aria-hidden="true">*</span></label>
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
                <label for="class-start">Hora de inicio <span class="required-mark" aria-hidden="true">*</span></label>
                <input id="class-start" class="form-control" type="time" required />
              </div>
              <div class="form-group">
                <label for="class-end">Hora de fin <span class="required-mark" aria-hidden="true">*</span></label>
                <input id="class-end" class="form-control" type="time" required />
              </div>
              <div class="form-group">
                <label for="class-location">Aula o ubicación</label>
                <input id="class-location" class="form-control" maxlength="120" placeholder="Ej. Bloque 3, aula 204" />
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
          <h2 class="panel-title">Exámenes de la semana</h2>
          <p class="device-help">Evaluaciones con categoría “Examen” durante los próximos siete días.</p>
          <div id="exam-week-list" class="exam-week-list" aria-live="polite"></div>
        </div>
        <div class="dashboard-panel delivery-editor-panel">
          <h2 class="panel-title">Entrega o evaluación</h2>
          <p class="device-help">Los cambios se guardan automáticamente. Inicia sesión para verlos también en tus otros dispositivos.</p>
          <form id="delivery-form" class="delivery-form">
            <input id="delivery-id" type="hidden" />
            <div class="form-group">
              <label for="delivery-title-input">Nombre <span class="required-mark" aria-hidden="true">*</span></label>
              <input id="delivery-title-input" class="form-control" required maxlength="160" placeholder="Ej. Taller de límites" />
            </div>
            <div class="form-group">
              <label for="delivery-subject-input">Asignatura <span class="required-mark" aria-hidden="true">*</span></label>
              <select id="delivery-subject-input" class="form-control" required>
                <option value="" selected disabled>Selecciona una asignatura</option>
                <option value="__otra__">Otra asignatura…</option>
              </select>
              <input id="delivery-subject-custom" class="form-control" maxlength="120"
                     placeholder="Escribe el nombre de la asignatura" aria-label="Nombre de otra asignatura" hidden />
            </div>
            <div class="form-group">
              <label for="delivery-date-input">Fecha y hora</label>
              <input id="delivery-date-input" class="form-control" type="datetime-local" />
            </div>
            <div class="form-group">
              <label for="delivery-priority-input">Importancia <span class="required-mark" aria-hidden="true">*</span></label>
              <select id="delivery-priority-input" class="form-control" required>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div class="form-group">
              <label for="delivery-category-input">Categoría <span class="required-mark" aria-hidden="true">*</span></label>
              <select id="delivery-category-input" class="form-control" required>
                <option value="tarea">Tarea</option>
                <option value="proyecto">Proyecto</option>
                <option value="examen">Examen</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="delivery-status-input">Estado <span class="required-mark" aria-hidden="true">*</span></label>
              <select id="delivery-status-input" class="form-control" required>
                <option value="pendiente">Pendiente</option>
                <option value="en-progreso">En progreso</option>
                <option value="entregada">Entregada</option>
              </select>
            </div>
            <div class="form-group">
              <label for="delivery-grade-input">Calificación</label>
              <input id="delivery-grade-input" class="form-control" type="number" min="0" step="0.01" placeholder="Ej. 4,5" />
            </div>
            <div class="form-group">
              <label for="delivery-grade-max-input">Nota máxima <span class="required-mark" aria-hidden="true">*</span></label>
              <input id="delivery-grade-max-input" class="form-control" type="number" min="0.01" step="0.01" value="5" required />
            </div>
            <div class="form-group">
              <label for="delivery-detail-input">Detalles</label>
              <textarea id="delivery-detail-input" class="form-control" maxlength="2000" placeholder="Agrega indicaciones, temas o materiales necesarios."></textarea>
            </div>
            <div class="profile-actions">
              <button class="btn btn-save" type="submit">Guardar entrega</button>
              <button id="delivery-cancel-edit" class="btn btn-load" type="button" hidden>Cancelar edición</button>
            </div>
          </form>
          <p id="delivery-sync-status" class="device-status" role="status" aria-live="polite">Los cambios pendientes se conservarán en este dispositivo.</p>
          <div id="local-deliveries" class="kanban-cards local-deliveries" aria-label="Entregas y evaluaciones registradas"></div>
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
          <p id="pomo-status" class="device-status" role="status" aria-live="polite">Las sesiones se guardan al pausar, reiniciar o completar el enfoque.</p>
        </div>
      </section>

      <section id="tab-notas" class="tab-view">
        <div class="crypto-wrapper">
          <h2>Bitácora rápida por asignatura</h2>
          <p class="subtitle">Guarda recordatorios y apuntes breves junto a cada materia. Se almacenan en este dispositivo y puedes editarlos después.</p>
          <form id="note-form" class="delivery-form">
            <input id="note-id" type="hidden" />
            <div class="form-group">
              <label for="note-subject">Asignatura <span class="required-mark" aria-hidden="true">*</span></label>
              <select id="note-subject" class="form-control" required>
                <option value="" disabled selected>Selecciona una asignatura</option>
              </select>
            </div>
            <div class="form-group">
              <label for="note-content">Apunte <span class="required-mark" aria-hidden="true">*</span></label>
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
                <label for="goal-study-minutes">Minutos de estudio por semana <span class="required-mark" aria-hidden="true">*</span></label>
                <input id="goal-study-minutes" class="form-control" type="number" min="1" max="10080" required placeholder="Ej. 300" />
              </div>
              <div class="form-group">
                <label for="goal-average">Promedio deseado (escala 0-5) <span class="required-mark" aria-hidden="true">*</span></label>
                <input id="goal-average" class="form-control" type="number" min="0" max="5" step="0.1" required placeholder="Ej. 4,0" />
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

      <dialog id="auth-dialog" class="auth-dialog">
        <form id="auth-form" class="delivery-form">
          <h2>Tu cuenta</h2>
          <p>Usa tu cuenta para mantener tus materias, entregas y avances sincronizados entre dispositivos. Puedes seguir usando la app sin iniciar sesión.</p>
          <div class="form-group">
            <label for="auth-first-name">Nombre <span id="auth-first-name-required" class="required-mark" aria-hidden="true" hidden>*</span></label>
            <input id="auth-first-name" class="form-control" maxlength="100" autocomplete="given-name" placeholder="Ej. Camila" />
          </div>
          <div class="form-group">
            <label for="auth-last-name">Apellido <span id="auth-last-name-required" class="required-mark" aria-hidden="true" hidden>*</span></label>
            <input id="auth-last-name" class="form-control" maxlength="100" autocomplete="family-name" placeholder="Ej. Puin" />
          </div>
          <div class="form-group">
            <label for="auth-username">Usuario <span class="required-mark" aria-hidden="true">*</span></label>
            <input id="auth-username" class="form-control" maxlength="50" autocomplete="username" required placeholder="Tu nombre de usuario" />
          </div>
          <div class="form-group">
            <label for="auth-password">Contraseña <span class="required-mark" aria-hidden="true">*</span></label>
            <input id="auth-password" class="form-control" type="password" minlength="8" maxlength="100" autocomplete="current-password" required placeholder="Mínimo 8 caracteres" />
          </div>
          <p id="auth-status" class="device-status" role="status" aria-live="polite"></p>
          <div class="profile-actions">
            <button class="btn btn-save" type="submit">Iniciar sesión</button>
            <button id="auth-mode-toggle" class="btn btn-load" type="button">Crear cuenta nueva</button>
            <button class="btn btn-load" type="button" data-close-auth>Cerrar</button>
          </div>
        </form>
      </dialog>

      <footer class="app-footer">
        Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
      </footer>
    </div>
  `;
}
