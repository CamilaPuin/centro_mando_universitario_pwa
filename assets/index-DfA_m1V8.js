(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`
  <div class="device-tools">
    <section class="dashboard-panel profile-panel" aria-labelledby="profile-title">
      <h2 id="profile-title" class="panel-title">Tu perfil</h2>
      <p class="device-help">Tus datos se guardan localmente. Al conectar el backend podrás habilitar su sincronización con tu cuenta.</p>
      <div class="profile-editor">
        <img id="profile-photo-preview" class="profile-photo-preview" alt="Foto de perfil" hidden />
        <form id="profile-form" class="delivery-form">
          <div class="form-group">
            <label for="profile-name">Nombre:</label>
            <input id="profile-name" class="form-control" required maxlength="100" autocomplete="name" />
          </div>
          <div class="form-group">
            <label for="profile-username">Nombre de usuario:</label>
            <input id="profile-username" class="form-control" required maxlength="40" autocomplete="username" />
          </div>
          <div class="profile-actions">
            <button class="btn btn-save" type="submit">Guardar perfil</button>
            <button id="btn-open-camera" class="btn btn-load" type="button">Tomar foto</button>
            <button id="btn-choose-photo" class="btn btn-load" type="button">Elegir imagen</button>
            <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
          </div>
        </form>
      </div>
      <p id="profile-status" class="device-status" role="status" aria-live="polite">Completa tu perfil. La cámara solo se activa cuando la solicitas.</p>
    </section>

    <section class="dashboard-panel" aria-labelledby="reminders-title">
      <h2 id="reminders-title" class="panel-title">Recordatorios de estudio</h2>
      <p class="device-help">Te avisaremos sobre fechas límite y clases próximas. Los avisos locales funcionan con las fechas de tu calendario mientras la app esté activa; las notificaciones Push requieren configurar el backend.</p>
      <button id="btn-enable-notifications" class="btn btn-save" type="button">Activar recordatorios</button>
      <p id="notification-status" class="device-status" role="status" aria-live="polite">No se solicitará permiso hasta que pulses el botón.</p>
    </section>
  </div>

  <dialog id="dlg-camara" class="camera-dialog" aria-labelledby="camera-dialog-title">
    <div class="camera-dialog-content">
      <h2 id="camera-dialog-title">Foto de perfil</h2>
      <video id="camera-video" autoplay playsinline aria-label="Vista previa de la cámara"></video>
      <div class="profile-actions">
        <button id="btn-capture-photo" class="btn btn-save" type="button">Capturar y guardar</button>
        <button id="btn-cancel-camera" class="btn btn-load" type="button">Cancelar</button>
      </div>
    </div>
  </dialog>
`;function t(){let t=document.getElementById(`app`),n=new Date().toLocaleDateString(`es-ES`,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`});t.innerHTML=`
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
            <span>${n.charAt(0).toUpperCase()+n.slice(1)}</span>
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
        ${e}
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
  `}function n(){`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/centro_mando_universitario_pwa/sw.js`).then(e=>console.log(`Workbox SW registrado:`,e.scope)).catch(e=>console.error(`Error al registrar SW:`,e))});function e(){let e=document.getElementById(`network-status`),t=document.getElementById(`offline-banner`);e&&(navigator.onLine?(e.className=`badge online`,e.innerHTML=`<span class="badge-dot"></span><span>En línea</span>`,t&&(t.hidden=!0)):(e.className=`badge offline`,e.innerHTML=`<span class="badge-dot"></span><span>Sin conexión (Offline)</span>`,t&&(t.hidden=!1)))}window.addEventListener(`online`,e),window.addEventListener(`offline`,e),e();let t,n=document.getElementById(`install-app`),r=document.getElementById(`ios-install-help`);n&&(n.hidden=!0),r&&(r.hidden=!0);let i=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform===`MacIntel`&&navigator.maxTouchPoints>1,a=/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);window.addEventListener(`beforeinstallprompt`,e=>{e.preventDefault(),t=e,n&&(n.hidden=!1),r&&(r.hidden=!0)}),n&&n.addEventListener(`click`,async()=>{if(!t)return;let e=t;t=void 0,n.hidden=!0,await e.prompt();let r=await e.userChoice;console.info(`Resultado de instalación:`,r.outcome)}),window.addEventListener(`appinstalled`,()=>{t=void 0,n&&(n.hidden=!0),r&&(r.hidden=!0)}),i&&a&&r&&(r.hidden=!1)}function r(){let e=document.querySelectorAll(`.tab-btn`),t=document.querySelectorAll(`.tab-view`);e.forEach(n=>{n.addEventListener(`click`,()=>{e.forEach(e=>e.classList.remove(`active`)),t.forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`);let r=n.getAttribute(`data-tab`);if(r&&(document.getElementById(r)?.classList.add(`active`),r!==`tab-pomodoro`&&document.body.classList.contains(`focus-mode`))){document.body.classList.remove(`focus-mode`);let e=document.getElementById(`btn-focus-mode`);e?.setAttribute(`aria-pressed`,`false`),e&&(e.textContent=`Activar modo enfoque`)}})}),document.querySelectorAll(`.delivery-check`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target,n=t.closest(`.delivery-item`);n&&n.classList.toggle(`completed`,t.checked)})})}function i(){return new Promise((e,t)=>{if(!(`indexedDB`in window)||window.indexedDB===void 0||typeof window.indexedDB.open!=`function`){t(Error(`IndexedDB no está disponible en este navegador.`));return}let n=window.indexedDB.open(`centro-mando-db`,5);n.onupgradeneeded=e=>{let t=n.result,r=e.oldVersion;if(r<1&&(t.objectStoreNames.contains(`asignaturas`)||t.createObjectStore(`asignaturas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porNombre`,`nombre`,{unique:!0}),t.objectStoreNames.contains(`entregas`)||t.createObjectStore(`entregas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porEstado`,`estado`,{unique:!1}),t.objectStoreNames.contains(`sesionesEstudio`)||t.createObjectStore(`sesionesEstudio`,{keyPath:`id`,autoIncrement:!0}),t.objectStoreNames.contains(`notasPrivadas`)||t.createObjectStore(`notasPrivadas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porMateria`,`materiaNombre`,{unique:!1})),r<2&&(t.objectStoreNames.contains(`registros`)||t.createObjectStore(`registros`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porClave`,`clave`,{unique:!0}),t.objectStoreNames.contains(`evidencias`)||t.createObjectStore(`evidencias`,{keyPath:`id`,autoIncrement:!0})),r<3&&!t.objectStoreNames.contains(`outbox`)&&t.createObjectStore(`outbox`,{keyPath:`idCambio`}),r<4&&!t.objectStoreNames.contains(`horarioClases`)){let e=t.createObjectStore(`horarioClases`,{keyPath:`id`,autoIncrement:!0});e.createIndex(`porDia`,`diaSemana`,{unique:!1}),e.createIndex(`porAsignatura`,`asignaturaId`,{unique:!1})}if(r<5){if(!t.objectStoreNames.contains(`apuntesMateria`)){let e=t.createObjectStore(`apuntesMateria`,{keyPath:`id`,autoIncrement:!0});e.createIndex(`porAsignatura`,`asignatura`,{unique:!1}),e.createIndex(`porActualizacion`,`actualizadoEn`,{unique:!1})}t.objectStoreNames.contains(`perfil`)||t.createObjectStore(`perfil`,{keyPath:`id`}),t.objectStoreNames.contains(`metas`)||t.createObjectStore(`metas`,{keyPath:`id`})}},n.onsuccess=()=>{let t=n.result;t.onversionchange=()=>{t.close(),console.warn(`La base de datos local cambió de versión; se cerró esta conexión para permitir la migración.`)},e(t)},n.onerror=()=>t(n.error),n.onblocked=()=>t(Error(`Cierra otras pestañas de la app para actualizar la base de datos.`))})}function a(e){return new Promise((t,n)=>{let r=e.transaction(`apuntesMateria`,`readonly`).objectStore(`apuntesMateria`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function o(e,t){return new Promise((n,r)=>{let i=e.transaction(`apuntesMateria`,`readwrite`),a=i.objectStore(`apuntesMateria`),o=new Date().toISOString(),s={...t,asignatura:t.asignatura.trim(),contenido:t.contenido.trim(),creadoEn:t.creadoEn??o,actualizadoEn:o},c=s.id===void 0?a.add(s):a.put(s);c.onsuccess=()=>{s.id=c.result},i.oncomplete=()=>n(s),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo guardar el apunte.`))})}function s(e,t){return new Promise((n,r)=>{let i=e.transaction(`apuntesMateria`,`readwrite`);i.objectStore(`apuntesMateria`).delete(t),i.oncomplete=()=>n(),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo eliminar el apunte.`))})}function c(e){return new Promise((t,n)=>{let r=e.transaction(`perfil`,`readonly`).objectStore(`perfil`).get(`estudiante`);r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function l(e,t){return new Promise((n,r)=>{let i=e.transaction(`perfil`,`readwrite`),a={...t,id:`estudiante`,actualizadoEn:new Date().toISOString()},o=i.objectStore(`perfil`).put(a);o.onsuccess=()=>n(a),o.onerror=()=>r(o.error),i.onerror=()=>r(i.error)})}function u(e){return new Promise((t,n)=>{let r=e.transaction(`metas`,`readonly`).objectStore(`metas`).get(`actual`);r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function d(e,t){return new Promise((n,r)=>{let i=e.transaction(`metas`,`readwrite`),a={...t,id:`actual`,actualizadoEn:new Date().toISOString()},o=i.objectStore(`metas`).put(a);o.onsuccess=()=>n(a),o.onerror=()=>r(o.error),i.onerror=()=>r(i.error)})}function f(e){return new Promise((t,n)=>{let r=e.transaction(`asignaturas`,`readonly`).objectStore(`asignaturas`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function p(e,t){return new Promise((n,r)=>{let i=e.transaction(`asignaturas`,`readwrite`),a=i.objectStore(`asignaturas`),o={...t,nombre:t.nombre.trim(),creadoEn:t.creadoEn??new Date().toISOString()},s=o.id===void 0?a.add(o):a.put(o);s.onsuccess=()=>{o.id=s.result},i.oncomplete=()=>n(o),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo guardar la asignatura.`))})}function m(e,t){return new Promise((n,r)=>{let i=e.transaction([`asignaturas`,`horarioClases`],`readwrite`),a=i.objectStore(`horarioClases`).index(`porAsignatura`).getAll(t);a.onsuccess=()=>{if(a.result.length>0){i.abort(),r(Error(`Elimina primero las clases de esta asignatura del horario.`));return}i.objectStore(`asignaturas`).delete(t)},a.onerror=()=>r(a.error),i.oncomplete=()=>n(),i.onerror=()=>r(i.error)})}function h(e){return new Promise((t,n)=>{let r=e.transaction(`horarioClases`,`readonly`).objectStore(`horarioClases`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function g(e,t){return new Promise((n,r)=>{let i=e.transaction(`horarioClases`,`readwrite`),a=t.id===void 0?i.objectStore(`horarioClases`).add(t):i.objectStore(`horarioClases`).put(t);a.onsuccess=()=>{t.id=a.result},i.oncomplete=()=>n(t),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo guardar la clase.`))})}function _(e,t){return new Promise((n,r)=>{let i=e.transaction(`horarioClases`,`readwrite`);i.objectStore(`horarioClases`).delete(t),i.oncomplete=()=>n(),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo eliminar la clase del horario.`))})}function v(e,t){return new Promise((n,r)=>{let i=e.transaction(`sesionesEstudio`,`readwrite`),a=i.objectStore(`sesionesEstudio`).add(t);a.onsuccess=()=>n(a.result),a.onerror=()=>r(a.error),i.onerror=()=>r(i.error)})}function y(e){return new Promise((t,n)=>{let r=e.transaction(`sesionesEstudio`,`readonly`).objectStore(`sesionesEstudio`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function b(e,t){return new Promise((n,r)=>{if(!(`crypto`in window)||window.crypto===void 0||typeof window.crypto.randomUUID!=`function`){r(Error(`Este navegador no permite generar un identificador seguro para sincronizar.`));return}let i=e.transaction([`entregas`,`outbox`],`readwrite`),a=i.objectStore(`entregas`),o=i.objectStore(`outbox`),s={...t,actualizadoEn:new Date().toISOString()},c=s.id===void 0?`crear`:`actualizar`,l=c===`crear`?a.add(s):a.put(s),u={idCambio:window.crypto.randomUUID(),entidad:`entrega`,operacion:c,payload:s,creadoEn:new Date().toISOString()};l.onsuccess=()=>{s.id=l.result,u.payload=s;let e=o.add(u);e.onerror=()=>r(e.error)},l.onerror=()=>r(l.error),i.oncomplete=()=>n({entrega:s,cambio:u}),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo guardar la entrega y su sincronización.`))})}function x(e){return new Promise((t,n)=>{let r=e.transaction(`entregas`,`readonly`).objectStore(`entregas`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function S(e){return new Promise((t,n)=>{let r=e.transaction(`outbox`,`readonly`).objectStore(`outbox`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function C(e){return new Promise((t,n)=>{let r=e.transaction(`evidencias`,`readonly`).objectStore(`evidencias`).openCursor(null,`prev`);r.onsuccess=()=>{let e=r.result;if(!e){t(void 0);return}let n=e.value;n.propietarioTipo===`perfil`&&n.propietarioId===`estudiante`?t(n.imagen):e.continue()},r.onerror=()=>n(r.error)})}function w(e){let t=document.getElementById(`pomo-display`),n=document.getElementById(`btn-pomo-toggle`),r=document.getElementById(`btn-pomo-reset`),i=document.getElementById(`btn-pomo-break`),a=document.getElementById(`btn-pomo-stopwatch`),o=document.getElementById(`btn-focus-mode`),s=document.getElementById(`pomo-materia-select`),c=document.getElementById(`pomo-subject-label`),l=document.getElementById(`pomo-status`);if(!t||!n||!r||!i||!a||!o||!s||!c||!l)return;let u=t,d=n,f=r,p=i,m=a,h=o,g=s,_=c,y=l,b=1500,x=b,S=`enfoque`,C,w=!1,T=0,E=0,D=``,O=``,k=!1;function A(e){let t=Math.max(0,Math.floor(e)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60;return n>0?`${String(n).padStart(2,`0`)}:${String(r).padStart(2,`0`)}:${String(i).padStart(2,`0`)}`:`${String(r).padStart(2,`0`)}:${String(i).padStart(2,`0`)}`}function j(){u.textContent=A(x),_.textContent=O||g.value||`Sin asignatura`}function M(){w?d.textContent=S===`descanso`?`Pausar descanso`:`Pausar`:E>0?d.textContent=S===`cronometro`?`Reanudar cronómetro`:S===`descanso`?`Reanudar descanso`:`Reanudar enfoque`:d.textContent=S===`descanso`?`Iniciar descanso`:S===`cronometro`?`Iniciar cronómetro`:`Iniciar enfoque`,d.classList.toggle(`btn-primary`,!w),d.classList.toggle(`btn-secondary`,w),d.disabled=k,f.disabled=k,p.disabled=k,m.disabled=k,g.disabled=w||E>0||k}function N(){C!==void 0&&clearInterval(C),C=void 0,w=!1,M()}async function P(t){if(k)return;let n=E;if(!(n<=0)){k=!0,M();try{let r=await e;if(!r)throw Error(`IndexedDB no está disponible; no se pudo guardar la sesión.`);let i=new Date,a=D||new Date(i.getTime()-n*1e3).toISOString();await v(r,{asignatura:O||g.value,tipo:t,inicio:a,fin:i.toISOString(),duracionSegundos:n}),E=0,D=``,O=``,y.textContent=`Sesión registrada: ${A(n)} de estudio.`,window.dispatchEvent(new Event(`sesion-estudio-guardada`))}finally{k=!1,M()}}}function F(){if(S!==`descanso`&&!g.value){y.textContent=`Primero registra una asignatura y selecciónala para iniciar el estudio.`;return}!D&&S!==`descanso`&&(D=new Date().toISOString(),O=g.value),w=!0,T=Date.now(),M(),C=setInterval(()=>{let e=Math.floor((Date.now()-T)/1e3);if(!(e<1)){if(T+=e*1e3,S===`cronometro`)x+=e,E+=e;else{let t=Math.min(e,x);x-=t,S===`enfoque`&&(E+=t)}if(j(),S!==`cronometro`&&x===0){let e=S;N(),e===`enfoque`?(P(`pomodoro`).catch(e=>{console.error(`No se pudo guardar la sesión Pomodoro:`,e),y.textContent=e instanceof Error?e.message:`No se pudo guardar la sesión de estudio.`}),y.textContent=`¡Enfoque completado! La sesión se está guardando.`):y.textContent=`Descanso terminado. Cuando estés lista, inicia un nuevo enfoque.`,S=`enfoque`,x=b,j(),M()}}},250)}d.addEventListener(`click`,()=>{w?(N(),y.textContent=`Temporizador pausado. Puedes reanudar o guardar el tiempo parcial al reiniciar.`):F()}),f.addEventListener(`click`,()=>{N(),P(S===`cronometro`?`cronometro`:`pomodoro`).catch(e=>{console.error(`No se pudo guardar el tiempo de estudio:`,e),y.textContent=e instanceof Error?e.message:`No se pudo guardar la sesión.`}),S=`enfoque`,x=b,j(),M()}),p.addEventListener(`click`,()=>{N(),P(S===`cronometro`?`cronometro`:`pomodoro`).catch(e=>{console.error(`No se pudo guardar el tiempo de estudio:`,e),y.textContent=e instanceof Error?e.message:`No se pudo guardar la sesión.`}),S=`descanso`,x=300,y.textContent=`Descanso de cinco minutos.`,j(),M()}),m.addEventListener(`click`,()=>{N(),P(S===`cronometro`?`cronometro`:`pomodoro`).catch(e=>{console.error(`No se pudo guardar el tiempo de estudio:`,e),y.textContent=e instanceof Error?e.message:`No se pudo guardar la sesión.`}),S=`cronometro`,x=0,y.textContent=`Cronómetro libre: inicia, pausa o reinicia para registrar el tiempo estudiado.`,j(),M()}),h.addEventListener(`click`,()=>{let e=document.body.classList.toggle(`focus-mode`);h.setAttribute(`aria-pressed`,String(e)),h.textContent=e?`Salir del modo enfoque`:`Activar modo enfoque`}),g.addEventListener(`change`,j),j(),M()}function T(e){let t=document.getElementById(`note-form`),n=document.getElementById(`note-id`),r=document.getElementById(`note-subject`),i=document.getElementById(`note-content`),c=document.getElementById(`note-cancel-edit`),l=document.getElementById(`note-status`),u=document.getElementById(`subject-notes-list`);if(!t||!n||!r||!i||!c||!l||!u)return;let d=t,f=n,p=r,m=i,h=c,g=l,_=u;function v(){d.reset(),f.value=``,h.hidden=!0,d.querySelector(`button[type="submit"]`).textContent=`Guardar apunte`}async function y(){let t=await e;if(!t){g.textContent=`Los apuntes no están disponibles porque IndexedDB no pudo abrirse.`;return}let n=(await a(t)).sort((e,t)=>t.actualizadoEn.localeCompare(e.actualizadoEn));if(_.replaceChildren(),!n.length){_.append(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`Aún no tienes apuntes. Crea uno asociado a una asignatura.`}));return}for(let t of n){let n=document.createElement(`article`);n.className=`kanban-card local-delivery-card`;let r=document.createElement(`h3`);r.textContent=t.asignatura;let i=document.createElement(`p`);i.className=`note-content`,i.textContent=t.contenido;let a=document.createElement(`small`);a.textContent=`Actualizado: ${new Date(t.actualizadoEn).toLocaleString()}`;let o=document.createElement(`div`);o.className=`profile-actions`;let c=document.createElement(`button`);c.className=`btn btn-load`,c.type=`button`,c.textContent=`Editar`,c.addEventListener(`click`,()=>{f.value=String(t.id),p.value=t.asignatura,m.value=t.contenido,h.hidden=!1,d.querySelector(`button[type="submit"]`).textContent=`Guardar cambios`,m.focus()});let l=document.createElement(`button`);l.className=`record-delete`,l.type=`button`,l.textContent=`Eliminar`,l.addEventListener(`click`,()=>{(async()=>{try{let n=await e;if(!n||t.id===void 0)throw Error(`No se pudo acceder al apunte.`);await s(n,t.id),g.textContent=`Apunte eliminado.`,await y()}catch(e){g.textContent=e instanceof Error?e.message:`No se pudo eliminar el apunte.`}})()}),o.append(c,l),n.append(r,i,a,o),_.append(n)}}d.addEventListener(`submit`,t=>{t.preventDefault(),(async()=>{try{let t=await e;if(!t)throw Error(`IndexedDB no está disponible.`);if(!p.value)throw Error(`Selecciona una asignatura.`);let n=m.value.trim();if(!n)throw Error(`Escribe el contenido del apunte.`);let r=f.value?Number(f.value):void 0,i=r===void 0?void 0:(await a(t)).find(e=>e.id===r);await o(t,{...r===void 0?{}:{id:r},asignatura:p.value,contenido:n,...i?{creadoEn:i.creadoEn}:{}}),v(),g.textContent=`Apunte guardado en este dispositivo.`,await y()}catch(e){g.textContent=e instanceof Error?e.message:`No se pudo guardar el apunte.`}})()}),h.addEventListener(`click`,v),window.addEventListener(`asignaturas-actualizadas`,()=>{y()}),y()}var E=[`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`,`Dom`];function D(e){let t=new Date(e.getFullYear(),e.getMonth(),e.getDate()),n=(t.getDay()+6)%7;return t.setDate(t.getDate()-n),t}function O(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function k(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),n}function A(e){let t=document.getElementById(`calendar-grid`),n=document.getElementById(`calendar-period`),r=document.getElementById(`calendar-view`),i=document.getElementById(`calendar-previous`),a=document.getElementById(`calendar-next`),o=document.getElementById(`calendar-today`);if(!t||!n||!r||!i||!a||!o)return;let s=t,c=n,l=r,u=i,d=a,p=o,m=new Date;async function g(){let t=await e;if(!t){s.replaceChildren(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`No se pudo abrir el calendario local.`}));return}let[n,r,i]=await Promise.all([f(t),h(t),x(t)]),a=new Map(n.map(e=>[e.id,e.nombre])),o=new Map,u=(e,t)=>{let n=o.get(e)??[];n.push(t),o.set(e,n)},d=l.value,p,g;if(d===`month`){p=D(new Date(m.getFullYear(),m.getMonth(),1));let e=D(new Date(m.getFullYear(),m.getMonth()+1,0));g=Math.round((e.getTime()-p.getTime())/864e5)+7,c.textContent=new Intl.DateTimeFormat(`es`,{month:`long`,year:`numeric`}).format(m)}else{p=D(m),g=7;let e=k(p,6);c.textContent=`${p.toLocaleDateString(`es`,{day:`numeric`,month:`short`})} – ${e.toLocaleDateString(`es`,{day:`numeric`,month:`short`,year:`numeric`})}`}for(let e=0;e<g;e++){let t=k(p,e),n=O(t);for(let e of r)e.diaSemana===t.getDay()&&u(n,{title:a.get(e.asignaturaId)??`Clase`,detail:`${e.horaInicio}–${e.horaFin}${e.aula?` · ${e.aula}`:``}`,kind:`class`});for(let e of i){if(e.estado===`entregada`||!e.fechaEntrega)continue;let t=new Date(e.fechaEntrega);if(Number.isNaN(t.getTime())||O(t)!==n)continue;let r=e.categoria===`examen`?`exam`:`delivery`;u(n,{title:e.titulo,detail:`${e.asignatura} · ${t.toLocaleTimeString(`es`,{hour:`2-digit`,minute:`2-digit`})}`,kind:r})}}if(s.replaceChildren(),s.classList.toggle(`calendar-month-view`,d===`month`),d===`month`)for(let e of E)s.append(Object.assign(document.createElement(`div`),{className:`calendar-weekday`,textContent:e}));for(let e=0;e<g;e++){let t=k(p,e),n=document.createElement(`article`);n.className=`calendar-day`,O(t)===O(new Date)&&n.classList.add(`is-today`),d===`month`&&t.getMonth()!==m.getMonth()&&n.classList.add(`outside-month`);let r=document.createElement(`h3`);r.textContent=d===`week`?`${E[e]} ${t.getDate()}`:String(t.getDate()),n.append(r);let i=o.get(O(t))??[];for(let e of i.sort((e,t)=>e.detail.localeCompare(t.detail))){let t=document.createElement(`div`);t.className=`calendar-event ${e.kind}`,t.title=e.detail;let r=document.createElement(`strong`);r.textContent=e.title;let i=document.createElement(`small`);i.textContent=e.detail,t.append(r,i),n.append(t)}d===`week`&&i.length===0&&n.append(Object.assign(document.createElement(`p`),{className:`calendar-empty`,textContent:`Sin actividades`})),s.append(n)}}u.addEventListener(`click`,()=>{m=l.value===`month`?new Date(m.getFullYear(),m.getMonth()-1,1):k(m,-7),g()}),d.addEventListener(`click`,()=>{m=l.value===`month`?new Date(m.getFullYear(),m.getMonth()+1,1):k(m,7),g()}),p.addEventListener(`click`,()=>{m=new Date,g()}),l.addEventListener(`change`,()=>void g());for(let e of[`entregas-actualizadas`,`horario-actualizado`,`asignaturas-actualizadas`])window.addEventListener(e,()=>void g());window.addEventListener(`focus`,()=>void g()),g().catch(e=>{console.error(`No se pudo cargar el calendario:`,e),s.replaceChildren(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`Ocurrió un error al cargar el calendario.`}))})}function j(e,t,n=new Date){let r=new Date(n);r.setDate(r.getDate()+7);let i=t.filter(e=>e.categoria===`examen`&&e.estado!==`entregada`&&e.fechaEntrega).filter(e=>{let t=new Date(e.fechaEntrega);return!Number.isNaN(t.getTime())&&t>=n&&t<=r}).sort((e,t)=>e.fechaEntrega.localeCompare(t.fechaEntrega));if(e.replaceChildren(),!i.length){e.append(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`No hay exámenes pendientes en los próximos siete días.`}));return}for(let t of i){let n=document.createElement(`article`);n.className=`exam-week-item`;let r=document.createElement(`strong`);r.textContent=t.titulo;let i=document.createElement(`span`);i.textContent=`${t.asignatura} · ${new Date(t.fechaEntrega).toLocaleString(`es`,{weekday:`short`,day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`})}`,n.append(r,i),e.append(n)}}function M(e){let t=document.getElementById(`delivery-form`),n=document.getElementById(`delivery-id`),r=document.getElementById(`delivery-title-input`),i=document.getElementById(`delivery-subject-input`),a=document.getElementById(`delivery-date-input`),o=document.getElementById(`delivery-priority-input`),s=document.getElementById(`delivery-status-input`),c=document.getElementById(`delivery-category-input`),l=document.getElementById(`delivery-grade-input`),u=document.getElementById(`delivery-grade-max-input`),d=document.getElementById(`delivery-detail-input`),f=document.getElementById(`delivery-sync-status`),p=document.getElementById(`local-deliveries`),m=document.getElementById(`delivery-cancel-edit`),h=document.getElementById(`exam-week-list`);if(!t||!n||!r||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!h)return;let g=t,_=n,v=r,y=i,C=a,w=o,T=s,E=c,D=l,O=u,k=d,A=f,M=p,N=h,P={pendiente:document.getElementById(`col-pending`),"en-progreso":document.getElementById(`col-progress`),entregada:document.getElementById(`col-done`)},F={pendiente:document.getElementById(`count-pending`),"en-progreso":document.getElementById(`count-progress`),entregada:document.getElementById(`count-done`)};function I(e){_.value=String(e.id),v.value=e.titulo,y.value=e.asignatura,C.value=e.fechaEntrega,w.value=e.prioridad??`media`,T.value=e.estado,E.value=e.categoria??`tarea`,D.value=e.calificacion===void 0?``:String(e.calificacion),O.value=String(e.notaMaxima??5),k.value=e.detalle,g.querySelector(`button[type="submit"]`).textContent=`Guardar cambios offline`,m&&(m.hidden=!1),v.focus()}function L(e){let t={pendiente:[],"en-progreso":[],entregada:[]};for(let n of e)t[n.estado].push(n);for(let e of Object.keys(t)){let n=P[e],r=F[e];if(n&&r){if(r.textContent=String(t[e].length),n.replaceChildren(),t[e].length===0){let e=document.createElement(`p`);e.className=`dashboard-empty`,e.textContent=`Sin registros en esta categoría.`,n.append(e);continue}for(let r of t[e]){let t=document.createElement(`article`);t.className=`kanban-card${e===`entregada`?` delivered`:``}`;let i=document.createElement(`h3`);i.textContent=r.titulo;let a=document.createElement(`p`);a.textContent=`${r.asignatura}${r.fechaEntrega?` · ${new Date(r.fechaEntrega).toLocaleString()}`:``}`;let o=document.createElement(`p`),s=r.calificacion===void 0?`Sin calificación`:`Calificación: ${r.calificacion} / ${r.notaMaxima??5}`;o.textContent=`${r.categoria??`tarea`} · Importancia: ${r.prioridad??`media`} · ${s}`;let c=document.createElement(`button`);c.className=`btn btn-load`,c.type=`button`,c.textContent=`Editar`,c.addEventListener(`click`,()=>I(r)),t.append(i,a,o,c),n.append(t)}}}j(N,e)}function R(e){let t=M.querySelector(`[data-local-delivery-id="${e.id}"]`);t||(t=document.createElement(`article`),t.className=`kanban-card local-delivery-card`,t.dataset.localDeliveryId=String(e.id),M.append(t)),t.replaceChildren();let n=document.createElement(`h3`);n.textContent=e.titulo;let r=document.createElement(`p`);r.textContent=`${e.asignatura} • ${e.categoria??`tarea`} • ${e.fechaEntrega?new Date(e.fechaEntrega).toLocaleString():`Sin fecha`}${e.calificacion===void 0?``:` • ${e.calificacion}/${e.notaMaxima??5}`}`;let i=document.createElement(`p`);i.textContent=e.detalle;let a=document.createElement(`button`);a.className=`btn btn-load`,a.type=`button`,a.textContent=`Editar`,a.addEventListener(`click`,()=>I(e)),t.append(n,r,i,a)}async function z(){}g.addEventListener(`submit`,async t=>{t.preventDefault(),A.textContent=`Guardando en este dispositivo…`;try{let t=await e;if(!t)throw Error(`IndexedDB no está disponible.`);let n=_.value?Number(_.value):void 0,r=w.value,i=r===`alta`||r===`media`||r===`baja`?r:void 0,a=T.value,o=a===`pendiente`||a===`en-progreso`||a===`entregada`?a:void 0,s=E.value,c=s===`tarea`||s===`proyecto`||s===`examen`||s===`otro`?s:void 0,l=Number(O.value),u=D.value.trim()===``?void 0:Number(D.value);if(!i||!o||!c)throw Error(`Selecciona una importancia, categoría y estado válidos.`);if(!Number.isFinite(l)||l<=0)throw Error(`La nota máxima debe ser mayor que cero.`);if(u!==void 0&&(!Number.isFinite(u)||u<0||u>l))throw Error(`La calificación debe estar entre cero y la nota máxima.`);let{entrega:d}=await b(t,{...n===void 0?{}:{id:n},titulo:v.value.trim(),asignatura:y.value.trim(),fechaEntrega:C.value,prioridad:i,categoria:c,...u===void 0?{}:{calificacion:u},notaMaxima:l,detalle:k.value.trim(),estado:o});R(d),L(await x(t)),window.dispatchEvent(new Event(`entregas-actualizadas`)),g.reset(),_.value=``,g.querySelector(`button[type="submit"]`).textContent=`Guardar offline y sincronizar`,m&&(m.hidden=!0),A.textContent=`Guardado localmente. Configura VITE_API_SYNC_ENABLED y la ruta /api del backend para habilitar la sincronización.`}catch(e){console.error(`No se pudo guardar la entrega:`,e),A.textContent=e instanceof Error?`No se pudo guardar la entrega: ${e.message}`:`No se pudo guardar la entrega.`}}),m?.addEventListener(`click`,()=>{g.reset(),_.value=``,g.querySelector(`button[type="submit"]`).textContent=`Guardar offline y sincronizar`,m.hidden=!0}),window.addEventListener(`online`,()=>{z()}),e.then(async e=>{if(e)try{let t=await x(e);t.forEach(R),L(t),window.dispatchEvent(new Event(`entregas-actualizadas`));let n=await S(e);n.length&&(A.textContent=`${n.length} cambio(s) guardado(s) localmente; configura el backend para enviarlos.`)}catch(e){console.error(`No se pudieron cargar las entregas locales:`,e),A.textContent=`No se pudieron cargar las entregas guardadas en este dispositivo.`}})}var N=`centro-mando-recordatorios-activos`,P=`centro-mando-recordatorios-enviados`,F,I;function L(){try{if(!(`localStorage`in window))return new Set;let e=JSON.parse(window.localStorage.getItem(P)??`[]`);return new Set(Array.isArray(e)?e.filter(e=>typeof e==`string`):[])}catch{return console.warn(`No se pudo leer el historial local de recordatorios.`),new Set}}function R(e){try{`localStorage`in window&&window.localStorage.setItem(P,JSON.stringify([...e].slice(-300)))}catch(e){console.warn(`El navegador no permitió guardar el historial de recordatorios:`,e)}}async function z(e,t,n){if(!(`serviceWorker`in navigator)){new Notification(e,{body:t,tag:n});return}let r=await navigator.serviceWorker.getRegistration();r?await r.showNotification(e,{body:t,tag:n,data:{url:r.scope}}):new Notification(e,{body:t,tag:n})}async function B(e,t){if(Notification.permission!==`granted`)return;let n=await e;if(!n)return;let[r,i,a]=await Promise.all([x(n),h(n),f(n)]),o=new Date,s=new Map(a.map(e=>[e.id,e.nombre]));for(let e of r){if(e.estado===`entregada`||!e.fechaEntrega)continue;let n=new Date(e.fechaEntrega),r=(n.getTime()-o.getTime())/36e5;if(Number.isNaN(n.getTime())||r<0||r>24)continue;let i=`delivery:${e.id}:${e.fechaEntrega}`;t.has(i)||(await z(e.categoria===`examen`?`Recordatorio de examen`:`Próxima entrega`,`${e.titulo} · ${e.asignatura} · ${n.toLocaleString(`es`)}`,i),t.add(i),R(t))}let c=o.getHours()*60+o.getMinutes();for(let e of i){if(e.diaSemana!==o.getDay())continue;let[n,r]=e.horaInicio.split(`:`).map(Number),i=n*60+r-c;if(i<0||i>30)continue;let a=`class:${e.id}:${o.toDateString()}`;t.has(a)||(await z(`Próxima clase`,`${s.get(e.asignaturaId)??`Clase`} comienza a las ${e.horaInicio}${e.aula?` · ${e.aula}`:``}.`,a),t.add(a),R(t))}}function V(e,t){F!==void 0&&window.clearInterval(F);let n=L(),r=()=>{B(e,n).catch(e=>{console.error(`No se pudieron revisar los próximos recordatorios:`,e),t.textContent=`El permiso está activo, pero no se pudieron revisar las fechas académicas locales.`})};I&&(window.removeEventListener(`entregas-actualizadas`,I),window.removeEventListener(`horario-actualizado`,I)),I=r,r(),F=window.setInterval(r,6e4);try{`localStorage`in window&&window.localStorage.setItem(N,`true`)}catch(e){console.warn(`No se pudo recordar la preferencia de recordatorios:`,e)}window.addEventListener(`entregas-actualizadas`,r),window.addEventListener(`horario-actualizado`,r)}async function H(e){if(!(`Notification`in window)){e.textContent=`Este navegador no admite notificaciones del sistema.`;return}if(!window.isSecureContext){e.textContent=`Las notificaciones requieren un contexto seguro (HTTPS).`;return}let t;try{t=Notification.permission==="default"?await Notification.requestPermission():Notification.permission}catch(t){console.error(`No se pudo solicitar permiso para notificaciones:`,t),e.textContent=`No se pudo solicitar el permiso de notificaciones.`;return}if(t!==`granted`){e.textContent=`Permiso de notificaciones no concedido. Puedes cambiarlo desde la configuración del navegador.`;return}try{let t=`serviceWorker`in navigator?await navigator.serviceWorker.getRegistration():void 0;if(t?await t.showNotification(`Recordatorios académicos activados`,{body:`Avisaremos sobre entregas en las próximas 24 horas, exámenes y clases próximas.`,tag:`recordatorios-activados`,data:{url:t.scope}}):new Notification(`Recordatorios académicos activados`,{body:`Avisaremos sobre entregas en las próximas 24 horas, exámenes y clases próximas.`}),!(`PushManager`in window)||!t){e.textContent=`Notificaciones locales activadas. Push requiere soporte de Push y un service worker registrado.`;return}e.textContent=`Recordatorios locales activados. Push remoto necesita la clave pública y el endpoint de suscripción de tu backend.`;return}catch(t){console.error(`No se pudieron activar las notificaciones Push:`,t),e.textContent=t instanceof Error?`Notificación local activada; Push no disponible: ${t.message}`:`Notificación local activada; no se pudo completar la suscripción Push.`}}function U(e){let t=document.getElementById(`btn-enable-notifications`),n=document.getElementById(`notification-status`);if(t&&n){t.addEventListener(`click`,()=>{H(n).then(()=>{`Notification`in window&&Notification.permission===`granted`&&V(e,n)})});try{`localStorage`in window&&window.localStorage.getItem(N)===`true`&&`Notification`in window&&Notification.permission===`granted`&&(V(e,n),n.textContent=`Recordatorios académicos activos en este dispositivo.`)}catch(e){console.warn(`No se pudo restaurar la preferencia de recordatorios:`,e)}}}var W={baja:10,media:20,alta:30};function G(e,t){if(!e)return 0;let n=(e.getTime()-t.getTime())/36e5;return n<0?100:n<=24?90:n<=48?75:n<=168?50:25}function K(e,t=new Date){return e.filter(e=>e.estado!==`entregada`).map(e=>{let n=e.fechaEntrega?new Date(e.fechaEntrega):void 0,r=n&&!Number.isNaN(n.getTime())?n:void 0,i=e.prioridad??`media`;return{entrega:e,nivel:i,puntaje:G(r,t)+W[i],fecha:r}}).sort((e,t)=>t.puntaje-e.puntaje||(e.fecha?.getTime()??2**53-1)-(t.fecha?.getTime()??2**53-1))}function q(e,t,n){let r=document.createElement(e);return r.className=t,r.textContent=n,r}function J(e,t){if(!e)return`Sin fecha límite`;let n=new Intl.DateTimeFormat(`es`,{day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`}).format(e),r=(e.getTime()-t.getTime())/36e5;return r<0?`Vencida: ${n}`:r<24?`Vence hoy, ${n}`:r<48?`Vence mañana, ${n}`:`Vence ${n}`}function Y(e,t){e.replaceChildren(q(`p`,`dashboard-empty`,t))}function X(e){let t=document.getElementById(`dashboard-agenda-list`),n=document.getElementById(`dashboard-agenda-count`),r=document.getElementById(`dashboard-pending-count`),i=document.getElementById(`dashboard-urgent-count`),a=document.getElementById(`dashboard-study-time`),o=document.getElementById(`dashboard-priority-count`),s=document.getElementById(`urgent-deliveries-list`),c=document.getElementById(`dashboard-class-count`),l=document.getElementById(`dashboard-next-class`);if(!t||!n||!r||!i||!a||!o||!s||!c||!l)return;let u=t,d=n,p=r,m=i,g=a,_=o,v=s,b=c,S=l;b.textContent=`0`,S.textContent=`Aún no has configurado un horario de clases.`,d.textContent=`0 clases`,Y(u,`Tu horario está vacío. En el módulo de asignaturas podrás registrar tus clases.`);async function C(){let t=await e;if(!t){p.textContent=`—`,m.textContent=`—`,_.textContent=`No disponible`,Y(v,`No se pudo acceder a tus entregas guardadas.`);return}let[n,r,i,a]=await Promise.all([x(t),f(t),h(t),y(t)]),o=new Date,s=a.reduce((e,t)=>Number.isFinite(t.duracionSegundos)&&new Date(t.inicio).toDateString()===o.toDateString()?e+t.duracionSegundos:e,0),c=Math.floor(s/3600),l=Math.floor(s%3600/60);g.textContent=c?`${c} h ${l} min`:s>0&&l===0?`<1 min`:`${l} min`;let C=i.filter(e=>e.diaSemana===o.getDay()).sort((e,t)=>e.horaInicio.localeCompare(t.horaInicio)),w=new Map(r.map(e=>[e.id,e.nombre]));if(b.textContent=String(C.length),d.textContent=`${C.length} clase${C.length===1?``:`s`}`,C.length===0)S.textContent=`No hay clases programadas para hoy.`,Y(u,`No hay clases en tu horario para hoy.`);else{let e=C.find(e=>e.horaInicio>=`${String(o.getHours()).padStart(2,`0`)}:${String(o.getMinutes()).padStart(2,`0`)}`);S.textContent=e?`Próxima: ${w.get(e.asignaturaId)??`Asignatura`} a las ${e.horaInicio}`:`Ya no tienes más clases programadas hoy.`;let t=document.createDocumentFragment();for(let e of C){let n=document.createElement(`article`);n.className=`agenda-item`;let r=document.createElement(`div`);r.className=`agenda-time`,r.append(document.createTextNode(e.horaInicio),document.createElement(`br`),Object.assign(document.createElement(`small`),{textContent:e.horaFin}));let i=document.createElement(`div`);i.className=`agenda-info`;let a=q(`div`,`agenda-subject`,w.get(e.asignaturaId)??`Asignatura`),o=q(`div`,`agenda-desc`,e.aula?`Aula: ${e.aula}`:`Ubicación no especificada`);i.append(a,o),n.append(r,i),t.append(n)}u.replaceChildren(t)}let T=n.filter(e=>e.estado!==`entregada`),E=K(T,o),D=E.filter(({fecha:e})=>e!==void 0&&e.getTime()-o.getTime()<=1728e5);if(p.textContent=String(T.length),m.textContent=String(D.length),_.textContent=D.length?`${D.length} urgente${D.length===1?``:`s`}`:`${E.length} pendiente${E.length===1?``:`s`}`,E.length===0){Y(v,`¡Todo al día! No tienes entregas pendientes.`);return}let O=document.createDocumentFragment();for(let{entrega:e,nivel:t,fecha:n}of E.slice(0,6)){let r=document.createElement(`article`);r.className=`delivery-item priority-item priority-${t}`;let i=document.createElement(`div`);i.className=`priority-item-info`,i.append(q(`strong`,`delivery-title`,e.titulo),q(`span`,`delivery-meta`,`${e.asignatura} · ${J(n,o)}`));let a=document.createElement(`div`);a.className=`priority-item-badges`,a.append(q(`span`,`tag tag-${t}`,`Importancia ${t}`),q(`span`,`tag tag-info`,e.estado===`en-progreso`?`En progreso`:`Pendiente`)),r.append(i,a),O.append(r)}v.replaceChildren(O)}C().catch(e=>{console.error(`No se pudo construir el resumen del día:`,e),p.textContent=`—`,m.textContent=`—`,_.textContent=`Error al cargar`,Y(v,`No se pudieron cargar las prioridades.`)});let w=()=>{C().catch(e=>{console.error(`No se pudo actualizar el resumen del día:`,e),Y(v,`No se pudieron actualizar las prioridades.`)})};window.addEventListener(`entregas-actualizadas`,w),window.addEventListener(`horario-actualizado`,w),window.addEventListener(`sesion-estudio-guardada`,w)}var ee=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`];function Z(e,t,n){let r=document.createElement(`button`);return r.className=t,r.type=`button`,r.textContent=e,r.addEventListener(`click`,n),r}function te(e){let t=document.getElementById(`subject-form`),n=document.getElementById(`subject-id`),r=document.getElementById(`subject-name`),i=document.getElementById(`subject-cancel-edit`),a=document.getElementById(`subject-status`),o=document.getElementById(`subject-list`),s=document.getElementById(`class-form`),c=document.getElementById(`class-id`),l=document.getElementById(`class-subject`),u=document.getElementById(`class-weekday`),d=document.getElementById(`class-start`),v=document.getElementById(`class-end`),y=document.getElementById(`class-location`),b=document.getElementById(`class-submit`),x=document.getElementById(`class-cancel-edit`),S=document.getElementById(`class-status`),C=document.getElementById(`class-list`);if(!t||!n||!r||!i||!a||!o||!s||!c||!l||!u||!d||!v||!y||!b||!x||!S||!C)return;let w=t,T=n,E=r,D=i,O=a,k=o,A=s,j=c,M=l,N=u,P=d,F=v,I=y,L=b,R=x,z=S,B=C;function V(){w.reset(),T.value=``,D.hidden=!0,w.querySelector(`button[type="submit"]`).textContent=`Agregar asignatura`}function H(){A.reset(),j.value=``,R.hidden=!0,L.textContent=`Agregar al horario`}function U(e){let t=M.value;if(M.replaceChildren(),e.length===0){let e=new Option(`Primero agrega una asignatura`,``);M.add(e),M.disabled=!0,L.disabled=!0}else{M.disabled=!1,L.disabled=!1;for(let t of e)M.add(new Option(t.nombre,String(t.id)));e.some(e=>String(e.id)===t)&&(M.value=t)}for(let t of[`pomo-materia-select`,`note-subject`]){let n=document.getElementById(t);if(!n)continue;let r=n.value;if(n.replaceChildren(),t===`note-subject`){let e=new Option(`Selecciona una asignatura`,``,!0,!0);e.disabled=!0,n.add(e)}for(let t of e)n.add(new Option(t.nombre,t.nombre));t===`note-subject`&&n.add(new Option(`General`,`General`)),[...n.options].some(e=>e.value===r)&&(n.value=r),t===`pomo-materia-select`&&n.dispatchEvent(new Event(`change`))}}function W(t){if(U(t),k.replaceChildren(),t.length===0){k.append(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`Agrega tu primera asignatura para empezar a organizar el horario.`}));return}for(let n of t){let t=document.createElement(`article`);t.className=`kanban-card local-delivery-card`;let r=document.createElement(`h3`);r.textContent=n.nombre;let i=document.createElement(`div`);i.className=`profile-actions`,i.append(Z(`Editar`,`btn btn-load`,()=>{T.value=String(n.id),E.value=n.nombre,w.querySelector(`button[type="submit"]`).textContent=`Guardar cambios`,D.hidden=!1,E.focus()}),Z(`Eliminar`,`record-delete`,()=>{(async()=>{try{let t=await e;if(!t||n.id===void 0)throw Error(`No se pudo abrir el almacenamiento local.`);await m(t,n.id),O.textContent=`Se eliminó ${n.nombre}.`,await K()}catch(e){O.textContent=e instanceof Error?e.message:`No se pudo eliminar la asignatura.`}})()})),t.append(r,i),k.append(t)}}function G(t,n){if(B.replaceChildren(),t.length===0){B.append(Object.assign(document.createElement(`p`),{className:`dashboard-empty`,textContent:`Aún no hay clases registradas en el horario semanal.`}));return}let r=new Map(n.map(e=>[e.id,e.nombre])),i=[...t].sort((e,t)=>e.diaSemana-t.diaSemana||e.horaInicio.localeCompare(t.horaInicio));for(let t of i){let n=document.createElement(`article`);n.className=`kanban-card local-delivery-card`;let i=document.createElement(`h3`);i.textContent=r.get(t.asignaturaId)??`Asignatura eliminada`;let a=document.createElement(`p`);a.textContent=`${ee[t.diaSemana]} · ${t.horaInicio}–${t.horaFin}${t.aula?` · ${t.aula}`:``}`;let o=document.createElement(`div`);o.className=`profile-actions`,o.append(Z(`Editar`,`btn btn-load`,()=>{j.value=String(t.id),M.value=String(t.asignaturaId),N.value=String(t.diaSemana),P.value=t.horaInicio,F.value=t.horaFin,I.value=t.aula,L.textContent=`Guardar cambios`,R.hidden=!1,A.scrollIntoView({behavior:`smooth`,block:`center`})}),Z(`Eliminar`,`record-delete`,()=>{(async()=>{try{let n=await e;if(!n||t.id===void 0)throw Error(`No se pudo abrir el almacenamiento local.`);await _(n,t.id),z.textContent=`Clase eliminada del horario.`,await K(),window.dispatchEvent(new Event(`horario-actualizado`))}catch(e){z.textContent=e instanceof Error?e.message:`No se pudo eliminar la clase.`}})()})),n.append(i,a,o),B.append(n)}}async function K(){let t=await e;if(!t){O.textContent=`El almacenamiento local no está disponible.`,z.textContent=`No se pudo cargar el horario local.`;return}let[n,r]=await Promise.all([f(t),h(t)]);W(n),G(r,n),window.dispatchEvent(new Event(`asignaturas-actualizadas`))}w.addEventListener(`submit`,async t=>{t.preventDefault();try{let t=await e;if(!t)throw Error(`IndexedDB no está disponible.`);let n=E.value.trim();if(!n)throw Error(`Escribe el nombre de la asignatura.`);await p(t,{...T.value?{id:Number(T.value)}:{},nombre:n}),V(),O.textContent=`Asignatura guardada correctamente.`,await K()}catch(e){console.error(`No se pudo guardar la asignatura:`,e),O.textContent=e instanceof DOMException&&e.name===`ConstraintError`?`Ya existe una asignatura con ese nombre.`:e instanceof Error?e.message:`No se pudo guardar la asignatura.`}}),D.addEventListener(`click`,V),R.addEventListener(`click`,H),A.addEventListener(`submit`,async t=>{t.preventDefault();try{let t=await e;if(!t)throw Error(`IndexedDB no está disponible.`);let n=Number(N.value),r=P.value,i=F.value,a=Number(M.value);if(!Number.isInteger(a))throw Error(`Selecciona una asignatura.`);if(!r||!i||r>=i)throw Error(`La hora de fin debe ser posterior a la hora de inicio.`);let o=await h(t),s=j.value?Number(j.value):void 0;if(o.some(e=>e.id!==s&&e.diaSemana===n&&r<e.horaFin&&i>e.horaInicio))throw Error(`Ese horario se cruza con otra clase del mismo día.`);await g(t,{...s===void 0?{}:{id:s},asignaturaId:a,diaSemana:n,horaInicio:r,horaFin:i,aula:I.value.trim()}),H(),z.textContent=`Horario guardado correctamente.`,await K(),window.dispatchEvent(new Event(`horario-actualizado`))}catch(e){console.error(`No se pudo guardar la clase:`,e),z.textContent=e instanceof Error?e.message:`No se pudo guardar la clase.`}}),K().catch(e=>{console.error(`No se pudieron cargar asignaturas y horario:`,e),O.textContent=`No se pudieron cargar las asignaturas.`,z.textContent=`No se pudo cargar el horario.`})}function ne(e){let t=new Date(e.getFullYear(),e.getMonth(),e.getDate());return t.setDate(t.getDate()-(t.getDay()+6)%7),t.setHours(0,0,0,0),t}function Q(e,t){let n=document.createElement(`div`);n.className=`progress-summary-item`;let r=document.createElement(`span`);r.textContent=e;let i=document.createElement(`strong`);return i.textContent=t,n.append(r,i),n}function re(e){let t=document.getElementById(`goals-form`),n=document.getElementById(`goal-study-minutes`),r=document.getElementById(`goal-average`),i=document.getElementById(`goals-status`),a=document.getElementById(`weekly-progress`),o=document.getElementById(`weekly-summary`),s=document.getElementById(`gamification-summary`);if(!t||!n||!r||!i||!a||!o||!s)return;let c=t,l=n,f=r,p=i,m=a,h=o,g=s;async function _(){let t=await e;if(!t){p.textContent=`Metas y progreso no disponibles: no se pudo abrir el almacenamiento local.`;return}let[n,r,i]=await Promise.all([u(t),y(t),x(t)]),a=n?.minutosSemanales??300,o=n?.promedioDeseado??4;l.value=String(a),f.value=String(o);let s=ne(new Date),c=r.reduce((e,t)=>new Date(t.inicio)>=s&&Number.isFinite(t.duracionSegundos)?e+t.duracionSegundos:e,0),d=Math.floor(c/60),_=Math.floor(r.reduce((e,t)=>Number.isFinite(t.duracionSegundos)&&t.duracionSegundos>0?e+t.duracionSegundos:e,0)/60),v=Math.floor(_/300)+1,b=v*300,S=Math.min(100,Math.round(d/a*100));m.replaceChildren();let C=Q(`Estudio esta semana`,`${d} / ${a} min`),w=document.createElement(`progress`);w.max=100,w.value=S,w.setAttribute(`aria-label`,`Meta de estudio completada al ${S}%`),m.append(C,w,Object.assign(document.createElement(`p`),{className:`device-help`,textContent:`${S}% de la meta semanal`}));let T=i.filter(e=>e.calificacion!==void 0&&Number.isFinite(e.calificacion)&&(e.notaMaxima??5)>0),E=T.length?T.reduce((e,t)=>e+t.calificacion/(t.notaMaxima??5)*5,0)/T.length:void 0;h.replaceChildren(Q(`Sesiones registradas`,String(r.filter(e=>new Date(e.inicio)>=s).length)),Q(`Tiempo de estudio`,`${Math.floor(d/60)} h ${d%60} min`),Q(`Evaluaciones calificadas`,String(T.length)),Q(`Promedio actual`,E===void 0?`Sin calificaciones`:`${E.toFixed(2)} / 5`),Q(`Meta de promedio`,`${o.toFixed(1)} / 5`));let D=new Set(r.filter(e=>e.duracionSegundos>0).map(e=>new Date(e.inicio).toDateString())),O=0,k=new Date;for(D.has(k.toDateString())||k.setDate(k.getDate()-1);D.has(k.toDateString());)O++,k.setDate(k.getDate()-1);let A=[...O>=3?[`Racha de 3 días`]:[],...O>=7?[`Racha de 7 días`]:[],...d>=300?[`5 horas de estudio esta semana`]:[],...E!==void 0&&E>=o?[`Meta de promedio alcanzada`]:[]];g.replaceChildren(Q(`Racha actual`,`${O} día${O===1?``:`s`}`),Q(`Nivel ${v}`,`${_} / ${b} min para el siguiente nivel`),Q(`Logros obtenidos`,A.length?A.join(` · `):`Sigue registrando sesiones para desbloquear logros.`))}c.addEventListener(`submit`,t=>{t.preventDefault(),(async()=>{try{let t=await e;if(!t)throw Error(`IndexedDB no está disponible.`);let n=Number(l.value),r=Number(f.value);if(!Number.isFinite(n)||n<1||n>10080)throw Error(`La meta semanal debe estar entre 1 y 10 080 minutos.`);if(!Number.isFinite(r)||r<0||r>5)throw Error(`El promedio deseado debe estar entre 0 y 5.`);await d(t,{minutosSemanales:n,promedioDeseado:r}),p.textContent=`Metas semanales guardadas.`,await _()}catch(e){p.textContent=e instanceof Error?e.message:`No se pudieron guardar las metas.`}})()});for(let e of[`sesion-estudio-guardada`,`entregas-actualizadas`])window.addEventListener(e,()=>void _());_().catch(e=>{console.error(`No se pudo calcular el progreso semanal:`,e),p.textContent=`No se pudo cargar el progreso semanal.`})}async function ie(e=`user`){if(!(`mediaDevices`in navigator)||navigator.mediaDevices===void 0||typeof navigator.mediaDevices.getUserMedia!=`function`)throw new DOMException(`La cámara no está disponible en este navegador.`,`NotSupportedError`);return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:e},width:{ideal:1280},height:{ideal:720}},audio:!1})}function ae(e){e?.getTracks().forEach(e=>e.stop())}function oe(e,t=640){return new Promise((n,r)=>{if(e.videoWidth<=0||e.videoHeight<=0){r(Error(`La cámara todavía no está lista para capturar una imagen.`));return}let i=Math.min(1,(Number.isFinite(t)?Math.max(1,t):640)/e.videoWidth),a=document.createElement(`canvas`);a.width=Math.round(e.videoWidth*i),a.height=Math.round(e.videoHeight*i);let o=a.getContext(`2d`);if(!o){r(Error(`No fue posible preparar la imagen capturada.`));return}o.drawImage(e,0,0,a.width,a.height),a.toBlob(e=>{e?n(e):r(Error(`El navegador no pudo codificar la fotografía.`))},`image/jpeg`,.8)})}function se(e){switch(e instanceof DOMException||e instanceof Error?e.name:``){case`NotAllowedError`:case`SecurityError`:return`No se permitió el acceso a la cámara. Autoriza el permiso en el navegador o elige una imagen del dispositivo.`;case`NotFoundError`:return`No se encontró una cámara disponible. Puedes elegir una imagen del dispositivo.`;case`NotReadableError`:return`La cámara está ocupada por otra aplicación o no se puede leer. Ciérrala e inténtalo de nuevo.`;case`OverconstrainedError`:return`La cámara no admite la configuración solicitada. Prueba con otra cámara o elige una imagen.`;case`TypeError`:case`NotSupportedError`:return`La cámara no está disponible en este contexto. Usa HTTPS o localhost, o elige una imagen.`;default:return`No fue posible abrir la cámara. Puedes elegir una imagen del dispositivo.`}}function ce(e){let t=document.getElementById(`profile-form`),n=document.getElementById(`profile-name`),r=document.getElementById(`profile-username`),i=document.getElementById(`profile-photo-preview`),a=document.getElementById(`profile-photo-file`),o=document.getElementById(`profile-status`),s=document.getElementById(`dlg-camara`),u=document.getElementById(`camera-video`),d=document.getElementById(`btn-open-camera`),f=document.getElementById(`btn-choose-photo`),p=document.getElementById(`btn-capture-photo`),m=document.getElementById(`btn-cancel-camera`);if(!t||!n||!r||!i||!a||!o||!s||!u||!d||!f||!p||!m)return;let h=t,g=n,_=r,v=i,y=a,b=o,x=s,S=u,w=d,T=f,E=p,D=m,O,k,A,j;function M(e){if(j&&URL.revokeObjectURL(j),j=void 0,!e){v.removeAttribute(`src`),v.hidden=!0;return}j=URL.createObjectURL(e),v.src=j,v.hidden=!1}function N(){ae(A),A=void 0,S.srcObject=null}async function P(t=k){let n=await e;if(!n)throw Error(`IndexedDB no está disponible.`);let r=g.value.trim(),i=_.value.trim().replace(/^@/,``);if(!r||!i)throw Error(`Completa el nombre y el nombre de usuario.`);let a=t??O?.foto;O=await l(n,{nombre:r,nombreUsuario:i,...a?{foto:a}:{}}),k=void 0,M(O.foto)}h.addEventListener(`submit`,e=>{e.preventDefault(),P().then(()=>{b.textContent=`Perfil guardado localmente en este dispositivo.`}).catch(e=>{b.textContent=e instanceof Error?e.message:`No se pudo guardar el perfil.`})}),T.addEventListener(`click`,()=>y.click()),y.addEventListener(`change`,()=>{let e=y.files?.[0];if(y.value=``,e){if(!e.type.startsWith(`image/`)){b.textContent=`Selecciona un archivo de imagen válido.`;return}k=e,M(e),g.value.trim()&&_.value.trim()?P(e).then(()=>{b.textContent=`Foto de perfil guardada localmente.`}).catch(e=>{b.textContent=e instanceof Error?e.message:`No se pudo guardar la fotografía.`}):b.textContent=`Foto lista. Completa tu nombre y usuario y guarda el perfil.`}}),w.addEventListener(`click`,()=>{(async()=>{try{A=await ie(`user`),S.srcObject=A,x.showModal(),await S.play(),b.textContent=`Cámara activa. Captura la foto cuando estés listo.`}catch(e){N(),b.textContent=se(e)}})()}),E.addEventListener(`click`,()=>{(async()=>{try{k=await oe(S),N(),x.close(),M(k),g.value.trim()&&_.value.trim()?(await P(k),b.textContent=`Foto de perfil capturada y guardada localmente.`):b.textContent=`Foto capturada. Completa tu nombre y usuario y guarda el perfil.`}catch(e){b.textContent=e instanceof Error?e.message:`No se pudo capturar la foto.`}})()}),D.addEventListener(`click`,()=>x.close()),x.addEventListener(`close`,N),window.addEventListener(`pagehide`,()=>{N(),j&&URL.revokeObjectURL(j)}),e.then(async e=>{if(!e){b.textContent=`El perfil no está disponible porque IndexedDB no pudo abrirse.`;return}if(O=await c(e),O)g.value=O.nombre,_.value=O.nombreUsuario,M(O.foto),b.textContent=`Perfil cargado desde este dispositivo.`;else{let t=await C(e);M(t),t&&(O={id:`estudiante`,nombre:``,nombreUsuario:``,foto:t,actualizadoEn:new Date().toISOString()},b.textContent=`Se recuperó la foto guardada anteriormente. Completa tu perfil para conservarla.`)}}).catch(e=>{console.error(`No se pudo cargar el perfil local:`,e),b.textContent=`No se pudo cargar el perfil local.`})}t(),n(),r();var $=`indexedDB`in window&&window.indexedDB!==void 0&&typeof window.indexedDB.open==`function`?i().catch(e=>{console.error(`No se pudo abrir el almacenamiento local:`,e)}):Promise.resolve(void 0);T($),w($),X($),te($),M($),U($),A($),re($),ce($);