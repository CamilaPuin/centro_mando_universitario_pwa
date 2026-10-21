export function renderizarEncabezado(fechaFormateada: string): string {
  return `
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
        <button id="auth-button" class="install-button" type="button">Conectar con el servidor</button>
        <span id="auth-session-status" class="auth-session-status" role="status" aria-live="polite"></span>
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
  `;
}

export function renderizarNavegacion(): string {
  return `
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
  `;
}

export function renderizarPie(): string {
  return `
    <footer class="app-footer">
      Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
    </footer>
  `;
}
