export function renderizarModuloPomodoro(): string {
  return `
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
  `;
}
