export function renderizarModuloNotas(): string {
  return `
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
  `;
}
