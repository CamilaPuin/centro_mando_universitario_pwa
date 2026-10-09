import './style.css';
import { abrirBaseDeDatos, agregarNotaPrivada, obtenerNotasPrivadas, type NotaPrivada } from './utils/db';
import { derivarClave, cifrarTexto, descifrarTexto } from './utils/crypto';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('Service Worker registrado correctamente con alcance:', reg.scope),
      (err) => console.warn('Fallo al registrar Service Worker:', err)
    );
  });
}

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
        <span id="network-status" class="badge online">
          <span class="badge-dot"></span>
          <span>En línea</span>
        </span>
      </div>
    </header>

    <nav class="nav-tabs">
      <button class="tab-btn active" data-tab="tab-resumen">Resumen del Día</button>
      <button class="tab-btn" data-tab="tab-entregas">Tablero de Entregas</button>
      <button class="tab-btn" data-tab="tab-pomodoro">Cronómetro y Pomodoro</button>
      <button class="tab-btn" data-tab="tab-notas">Notas Privadas (Cifradas)</button>
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
            <div class="agenda-item">
              <div class="agenda-time">08:00<br><small>10:00</small></div>
              <div class="agenda-info">
                <div class="agenda-subject">Cálculo II</div>
                <div class="agenda-desc">Salón 304 • Integrales Múltiples • Prof. Méndez</div>
              </div>
            </div>

            <div class="agenda-item">
              <div class="agenda-time">10:30<br><small>12:30</small></div>
              <div class="agenda-info">
                <div class="agenda-subject">Base de Datos</div>
                <div class="agenda-desc">Laboratorio 3 • Modelado Relacional • Prof. Ruiz</div>
              </div>
            </div>

            <div class="agenda-item study-block">
              <div class="agenda-time">14:00<br><small>15:40</small></div>
              <div class="agenda-info">
                <div class="agenda-subject">Bloque de Estudio Personal</div>
                <div class="agenda-desc">Biblioteca Central • Avance de proyectos y repaso</div>
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
            <div class="delivery-item urgent" id="item-etica">
              <div class="delivery-left">
                <input type="checkbox" class="delivery-check" data-id="etica" title="Marcar como lista" />
                <div>
                  <div class="delivery-title">Ensayo de Ética</div>
                  <div class="delivery-meta">Ética Profesional • Vence hoy (23:59)</div>
                </div>
              </div>
              <span class="tag tag-urgent">Hoy</span>
            </div>

            <div class="delivery-item warning" id="item-fisica">
              <div class="delivery-left">
                <input type="checkbox" class="delivery-check" data-id="fisica" title="Marcar como lista" />
                <div>
                  <div class="delivery-title">Taller de Física — Cap. 4</div>
                  <div class="delivery-meta">Física II • Vence mañana (18:00)</div>
                </div>
              </div>
              <span class="tag tag-warning">Mañana</span>
            </div>

            <div class="delivery-item normal" id="item-bd">
              <div class="delivery-left">
                <input type="checkbox" class="delivery-check" data-id="bd" title="Marcar como lista" />
                <div>
                  <div class="delivery-title">Proyecto de Base de Datos</div>
                  <div class="delivery-meta">Base de Datos • Vence en 4 días</div>
                </div>
              </div>
              <span class="tag tag-info">En progreso</span>
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
            <div class="kanban-card">
              <h4>Ensayo de Ética</h4>
              <p>Ética Profesional • Vence hoy</p>
              <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
            </div>
            <div class="kanban-card">
              <h4>Taller de Física — Cap. 4</h4>
              <p>Física II • 8 ejercicios impares</p>
              <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
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
            <div class="kanban-card">
              <h4>Proyecto de Base de Datos</h4>
              <p>Normalización y diagramas entidad-relación</p>
              <button class="btn-move" onclick="alert('Entrega movida a Entregado')">Mover a Entregado</button>
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
            <div class="kanban-card delivered">
              <h4>Quiz de Inglés</h4>
              <p>Calificación: 4.8 / 5.0 • Aprobado</p>
            </div>
            <div class="kanban-card delivered">
              <h4>Reseña de lectura</h4>
              <p>Comunicación Oral y Escrita</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="tab-pomodoro" class="tab-view">
      <div class="pomodoro-wrapper">
        <h3>Cronómetro y Modo Pomodoro</h3>
        <p class="pomo-subtitle">
          Sesiones de concentración asociadas directamente a tus asignaturas.
        </p>

        <div class="pomo-materia-row">
          <label>Asignatura:</label>
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

    <footer class="app-footer">
      Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
    </footer>
  </div>
`;

function actualizarEstadoRed() {
  const badge = document.getElementById('network-status');
  if (!badge) return;
  if (navigator.onLine) {
    badge.className = 'badge online';
    badge.innerHTML = `<span class="badge-dot"></span><span>En línea</span>`;
  } else {
    badge.className = 'badge offline';
    badge.innerHTML = `<span class="badge-dot"></span><span>Sin conexión (Offline)</span>`;
  }
}
window.addEventListener('online', actualizarEstadoRed);
window.addEventListener('offline', actualizarEstadoRed);
actualizarEstadoRed();

const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const tabViews = document.querySelectorAll<HTMLElement>('.tab-view');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab');
    if (targetId) {
      document.getElementById(targetId)?.classList.add('active');
    }
  });
});

document.querySelectorAll<HTMLInputElement>('.delivery-check').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const parent = target.closest<HTMLElement>('.delivery-item');
    if (parent) {
      parent.classList.toggle('completed', target.checked);
    }
  });
});

let pomoSeconds = 25 * 60;
let pomoInterval: any = null;
let isRunning = false;

const pomoDisplay = document.getElementById('pomo-display')!;
const pomoToggleBtn = document.getElementById('btn-pomo-toggle') as HTMLButtonElement;
const pomoResetBtn = document.getElementById('btn-pomo-reset') as HTMLButtonElement;
const pomoBreakBtn = document.getElementById('btn-pomo-break') as HTMLButtonElement;
const pomoSubjectSelect = document.getElementById('pomo-materia-select') as HTMLSelectElement;
const pomoSubjectLabel = document.getElementById('pomo-subject-label')!;

pomoSubjectSelect.addEventListener('change', () => {
  pomoSubjectLabel.textContent = pomoSubjectSelect.value;
});

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updatePomoDisplay() {
  pomoDisplay.textContent = formatTime(pomoSeconds);
}

pomoToggleBtn.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(pomoInterval);
    isRunning = false;
    pomoToggleBtn.textContent = 'Reanudar Enfoque';
    pomoToggleBtn.classList.remove('btn-secondary');
    pomoToggleBtn.classList.add('btn-primary');
  } else {
    isRunning = true;
    pomoToggleBtn.textContent = 'Pausar';
    pomoToggleBtn.classList.remove('btn-primary');
    pomoToggleBtn.classList.add('btn-secondary');
    pomoInterval = setInterval(() => {
      if (pomoSeconds > 0) {
        pomoSeconds--;
        updatePomoDisplay();
      } else {
        clearInterval(pomoInterval);
        isRunning = false;
        alert(`Sesión de estudio completada para ${pomoSubjectSelect.value}.`);
        pomoToggleBtn.textContent = 'Iniciar Enfoque';
        pomoToggleBtn.classList.remove('btn-secondary');
        pomoToggleBtn.classList.add('btn-primary');
        pomoSeconds = 25 * 60;
        updatePomoDisplay();
      }
    }, 1000);
  }
});

pomoResetBtn.addEventListener('click', () => {
  clearInterval(pomoInterval);
  isRunning = false;
  pomoSeconds = 25 * 60;
  updatePomoDisplay();
  pomoToggleBtn.textContent = 'Iniciar Enfoque';
  pomoToggleBtn.classList.remove('btn-secondary');
  pomoToggleBtn.classList.add('btn-primary');
});

pomoBreakBtn.addEventListener('click', () => {
  clearInterval(pomoInterval);
  isRunning = false;
  pomoSeconds = 5 * 60;
  updatePomoDisplay();
  pomoToggleBtn.textContent = 'Iniciar Descanso';
});

let db: IDBDatabase;

abrirBaseDeDatos().then(database => {
  db = database;
  console.log('IndexedDB conectada correctamente para Centro de Mando');
}).catch(err => console.error('Error al abrir la BD:', err));

const passInput = document.getElementById('pass-key') as HTMLInputElement;
const notaInput = document.getElementById('nota-input') as HTMLTextAreaElement;
const materiaSelect = document.getElementById('nota-materia') as HTMLSelectElement;
const btnGuardar = document.getElementById('btn-guardar') as HTMLButtonElement;
const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
const output = document.getElementById('crypto-output') as HTMLDivElement;

btnGuardar.addEventListener('click', async () => {
  const password = passInput.value;
  const textoNota = notaInput.value;
  const materia = materiaSelect.value;

  if (!password || !textoNota) {
    output.className = 'crypto-result state-error';
    output.innerHTML = 'Escribe la contraseña y el contenido de la nota primero.';
    return;
  }

  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const clave = await derivarClave(password, salt);
    const { cifrado, iv } = await cifrarTexto(clave, textoNota);

    const nuevaNota: NotaPrivada = {
      materiaNombre: materia,
      titulo: `Nota de ${materia}`,
      fechaCreacion: new Date().toISOString(),
      contenidoCifrado: cifrado,
      iv: iv
    };

    await agregarNotaPrivada(db, nuevaNota);
    output.className = 'crypto-result state-success';
    output.innerHTML = `<strong>Nota cifrada con AES-GCM 256 bits y almacenada con éxito.</strong><br><small>Materia: ${materia} • ${new Date().toLocaleTimeString()}</small>`;
    notaInput.value = '';
  } catch (error) {
    console.error(error);
    output.className = 'crypto-result state-error';
    output.textContent = 'Error al cifrar la nota.';
  }
});

btnCargar.addEventListener('click', async () => {
  const password = passInput.value;

  if (!password) {
    output.className = 'crypto-result state-error';
    output.innerHTML = 'Ingresa la contraseña maestra para descifrar.';
    return;
  }

  try {
    const notas = await obtenerNotasPrivadas(db);
    if (notas.length === 0) {
      output.className = 'crypto-result state-muted';
      output.innerHTML = 'No hay notas guardadas aún en la base de datos.';
      return;
    }

    const ultimaNota = notas[notas.length - 1];
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const clave = await derivarClave(password, salt);
    
    const textoDescifrado = await descifrarTexto(clave, {
      cifrado: ultimaNota.contenidoCifrado,
      iv: ultimaNota.iv
    });

    output.className = 'crypto-result state-info';
    output.innerHTML = `
      <div class="decrypted-note">
        <div class="decrypted-note-label">Nota Descifrada (${ultimaNota.materiaNombre}):</div>
        <div class="decrypted-note-body">${textoDescifrado}</div>
        <div class="decrypted-note-date">Fecha: ${new Date(ultimaNota.fechaCreacion).toLocaleString()}</div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    output.className = 'crypto-result state-error';
    output.textContent = 'Contraseña incorrecta o error al descifrar.';
  }
});