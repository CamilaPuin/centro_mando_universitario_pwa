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
          <img src="/icons/icon-192.png" alt="Centro de Mando Universitario" class="brand-logo" />
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
          <button class="tab-btn" data-tab="tab-entregas">Tablero de Entregas</button>
          <button class="tab-btn" data-tab="tab-pomodoro">Cronómetro y Pomodoro</button>
          <button class="tab-btn" data-tab="tab-notas">Notas Privadas (Cifradas)</button>
          <button class="tab-btn" data-tab="tab-dispositivo">Perfil y Dispositivo</button>
        </nav>

      <section id="tab-resumen" class="tab-view active">
        <div class="hero-banner">
          <div class="hero-header">
            <span class="hero-badge">Centro de Control Académico</span>
            <h1 class="hero-title">¡Hola! Tu resumen de hoy está listo</h1>
            <p class="hero-subtitle">Visualiza tus prioridades del día, gestiona entregas y monitorea tus horas de estudio en un solo lugar.</p>
          </div>

          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-label">
                <span>Racha Actual</span>
              </div>
              <div class="metric-value">6 días</div>
              <div class="metric-detail">¡Constancia diaria cumplida!</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Meta de Estudio Hoy</span>
                <span id="metric-study-ratio">1h 40m / 2h 30m</span>
              </div>
              <div class="metric-value" id="metric-study-percent">67%</div>
              <div class="progress-container">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" id="metric-progress-fill" style="width: 67%;"></div>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Clases de la Jornada</span>
              </div>
              <div class="metric-value">2 sesiones</div>
              <div class="metric-detail">Próxima: Cálculo II a las 08:00 AM</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Entregas Urgentes</span>
              </div>
              <div class="metric-value urgent">1 vence hoy</div>
              <div class="metric-detail">Ensayo de Ética (23:59)</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                Agenda del Día
              </h2>
              <span class="panel-badge">3 bloques</span>
            </div>

            <div class="agenda-list">
              <div class="agenda-item record-entry" data-record-key="clase-calculo" data-record-type="clase">
                <div class="agenda-time">08:00<br><small>10:00</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Cálculo II</div>
                  <div class="agenda-desc">Salón 304 • Integrales Múltiples • Prof. Méndez</div>
                  <button class="record-delete" type="button" data-delete-key="clase-calculo" aria-label="Eliminar clase de Cálculo II">Eliminar</button>
                </div>
              </div>

              <div class="agenda-item record-entry" data-record-key="clase-bd" data-record-type="clase">
                <div class="agenda-time">10:30<br><small>12:30</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Base de Datos</div>
                  <div class="agenda-desc">Laboratorio 3 • Modelado Relacional • Prof. Ruiz</div>
                  <button class="record-delete" type="button" data-delete-key="clase-bd" aria-label="Eliminar clase de Base de Datos">Eliminar</button>
                </div>
              </div>

              <div class="agenda-item study-block record-entry" data-record-key="bloque-estudio" data-record-type="bloque-estudio">
                <div class="agenda-time">14:00<br><small>15:40</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Bloque de Estudio Personal</div>
                  <div class="agenda-desc">Biblioteca Central • Avance de proyectos y repaso</div>
                  <button class="record-delete" type="button" data-delete-key="bloque-estudio" aria-label="Eliminar bloque de estudio">Eliminar</button>
                </div>
              </div>
            </div>
          </div>

          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                Entregas Urgentes
              </h2>
              <span class="panel-badge danger">Atención requerida</span>
            </div>

            <div class="deliveries-list" id="urgent-deliveries-list">
              <div class="delivery-item urgent record-entry" id="item-etica" data-record-key="entrega-etica" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="etica" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Ensayo de Ética</div>
                    <div class="delivery-meta">Ética Profesional • Vence hoy (23:59)</div>
                  </div>
                </div>
                <span class="tag tag-urgent">Hoy</span>
                <button class="record-delete" type="button" data-delete-key="entrega-etica" aria-label="Eliminar Ensayo de Ética">Eliminar</button>
              </div>

              <div class="delivery-item warning record-entry" id="item-fisica" data-record-key="entrega-fisica" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="fisica" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Taller de Física — Cap. 4</div>
                    <div class="delivery-meta">Física II • Vence mañana (18:00)</div>
                  </div>
                </div>
                <span class="tag tag-warning">Mañana</span>
                <button class="record-delete" type="button" data-delete-key="entrega-fisica" aria-label="Eliminar Taller de Física">Eliminar</button>
              </div>

              <div class="delivery-item normal record-entry" id="item-bd" data-record-key="entrega-bd" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="bd" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Proyecto de Base de Datos</div>
                    <div class="delivery-meta">Base de Datos • Vence en 4 días</div>
                  </div>
                </div>
                <span class="tag tag-info">En progreso</span>
                <button class="record-delete" type="button" data-delete-key="entrega-bd" aria-label="Eliminar Proyecto de Base de Datos">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tab-entregas" class="tab-view">
        <div class="kanban-grid">
          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-pending"></span>
                <span>Pendiente</span>
              </div>
              <span class="panel-badge">2</span>
            </div>
            <div class="kanban-cards" id="col-pending">
              <div class="kanban-card record-entry" data-record-key="entrega-etica" data-record-type="entrega">
                <h4>Ensayo de Ética</h4>
                <p>Ética Profesional • Vence hoy</p>
                <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
                <button class="record-delete" type="button" data-delete-key="entrega-etica" aria-label="Eliminar Ensayo de Ética">Eliminar</button>
              </div>
              <div class="kanban-card record-entry" data-record-key="entrega-fisica" data-record-type="entrega">
                <h4>Taller de Física — Cap. 4</h4>
                <p>Física II • 8 ejercicios impares</p>
                <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
                <button class="record-delete" type="button" data-delete-key="entrega-fisica" aria-label="Eliminar Taller de Física">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-progress"></span>
                <span>En progreso</span>
              </div>
              <span class="panel-badge">1</span>
            </div>
            <div class="kanban-cards" id="col-progress">
              <div class="kanban-card record-entry" data-record-key="entrega-bd" data-record-type="entrega">
                <h4>Proyecto de Base de Datos</h4>
                <p>Normalización y diagramas entidad-relación</p>
                <button class="btn-move" onclick="alert('Entrega movida a Entregado')">Mover a Entregado</button>
                <button class="record-delete" type="button" data-delete-key="entrega-bd" aria-label="Eliminar Proyecto de Base de Datos">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-done"></span>
                <span>Entregado</span>
              </div>
              <span class="panel-badge">2</span>
            </div>
            <div class="kanban-cards" id="col-done">
              <div class="kanban-card delivered record-entry" data-record-key="entrega-quiz-ingles" data-record-type="entrega">
                <h4>Quiz de Inglés</h4>
                <p>Calificación: 4.8 / 5.0 • Aprobado</p>
                <button class="record-delete" type="button" data-delete-key="entrega-quiz-ingles" aria-label="Eliminar Quiz de Inglés">Eliminar</button>
              </div>
              <div class="kanban-card delivered record-entry" data-record-key="entrega-resena" data-record-type="entrega">
                <h4>Reseña de lectura</h4>
                <p>Comunicación Oral y Escrita</p>
                <button class="record-delete" type="button" data-delete-key="entrega-resena" aria-label="Eliminar Reseña de lectura">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tab-dispositivo" class="tab-view">
        ${interfazDispositivo}
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
              <option value="Cálculo II">Cálculo II</option>
              <option value="Base de Datos">Base de Datos</option>
              <option value="Física II">Física II</option>
              <option value="Ética Profesional">Ética Profesional</option>
            </select>
          </div>

          <div class="pomo-circle">
            <div class="pomo-time" id="pomo-display">25:00</div>
            <div class="pomo-subject" id="pomo-subject-label">Cálculo II</div>
          </div>

          <div class="pomo-controls">
            <button id="btn-pomo-toggle" class="btn-pomo btn-primary">Iniciar Enfoque</button>
            <button id="btn-pomo-reset" class="btn-pomo btn-secondary">Reiniciar</button>
            <button id="btn-pomo-break" class="btn-pomo btn-secondary">+5 min Descanso</button>
          </div>
        </div>
      </section>

      <section id="tab-notas" class="tab-view">
        <div class="crypto-wrapper">
          <h3>Notas Rápidas y Privadas</h3>
          <p class="subtitle">
            Bitácora de apuntes confidenciales cifrada localmente con AES-GCM 256 bits y almacenada en IndexedDB.
          </p>

          <div class="form-group">
            <label for="pass-key">Contraseña Maestra:</label>
            <input type="password" id="pass-key" class="form-control" placeholder="Introduce tu clave secreta para cifrar/descifrar" />
          </div>

          <div class="form-group">
            <label for="nota-materia">Asignatura:</label>
            <select id="nota-materia" class="form-control">
              <option value="Cálculo II">Cálculo II</option>
              <option value="Base de Datos">Base de Datos</option>
              <option value="Física II">Física II</option>
              <option value="General">Apunte General</option>
            </select>
          </div>

          <div class="form-group">
            <label for="nota-input">Contenido de la Nota:</label>
            <textarea id="nota-input" class="form-control" placeholder="Escribe aquí tu resumen, contraseña de laboratorio o apunte privado..."></textarea>
          </div>

          <div class="btn-group">
            <button id="btn-guardar" class="btn btn-save">Cifrar y Guardar en BD</button>
            <button id="btn-cargar" class="btn btn-load">Descifrar Última Nota</button>
          </div>

          <div id="crypto-output" class="crypto-result">
            Ingresa tu contraseña maestra y escribe una nota para probar la seguridad local.
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
