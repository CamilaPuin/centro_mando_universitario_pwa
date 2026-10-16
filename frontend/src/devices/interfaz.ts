export const interfazDispositivo = `
  <div class="device-tools" aria-label="Herramientas del dispositivo">
    <div class="dashboard-panel profile-panel">
      <h2 class="panel-title">Perfil y evidencias</h2>
      <p class="device-help">Toma una foto para tu perfil o selecciona una imagen. La foto se guarda en este dispositivo.</p>
      <div class="profile-actions">
        <button id="btn-open-camera" class="btn btn-save" type="button">Tomar foto</button>
        <button id="btn-choose-photo" class="btn btn-load" type="button">Elegir imagen</button>
        <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
      </div>
      <p id="camera-status" class="device-status" role="status" aria-live="polite">La cámara solo se activa cuando eliges “Tomar foto”.</p>
      <img id="profile-photo-preview" class="profile-photo-preview" alt="Foto guardada del perfil" hidden />
    </div>

    <div class="dashboard-panel record-entry" data-record-key="parcial-proximo" data-record-type="parcial">
      <h2 class="panel-title">Próximo parcial</h2>
      <p class="device-help">El cálculo usa el reloj local del dispositivo y funciona sin conexión.</p>
      <div class="deadline-controls">
        <label for="exam-date">Fecha y hora del parcial:</label>
        <input id="exam-date" class="form-control" type="datetime-local" />
        <button id="btn-calculate-deadline" class="btn btn-load" type="button">Calcular tiempo restante</button>
        <button class="record-delete" type="button" data-delete-key="parcial-proximo" aria-label="Eliminar fecha del próximo parcial" disabled>Eliminar parcial</button>
      </div>
      <p id="exam-countdown" class="device-status" role="status" aria-live="polite">Selecciona la fecha del próximo parcial.</p>
    </div>

    <div class="dashboard-panel undo-panel">
      <h2 class="panel-title">Acciones y sensores</h2>
      <div class="profile-actions">
        <button id="btn-undo-delete" class="btn btn-load" type="button" disabled>↩ Deshacer eliminación</button>
        <button id="btn-toggle-shake" class="btn btn-save" type="button">Activar agitar para deshacer</button>
      </div>
      <p id="shake-status" class="device-status" role="status" aria-live="polite">También puedes deshacer con el botón; el gesto es opcional.</p>
    </div>
  </div>

  <dialog id="dlg-camara" class="camera-dialog" aria-labelledby="camera-dialog-title">
    <div class="camera-dialog-content">
      <h2 id="camera-dialog-title">Capturar foto</h2>
      <video id="camera-video" autoplay playsinline aria-label="Vista previa de la cámara"></video>
      <div class="profile-actions">
        <button id="btn-capture-photo" class="btn btn-save" type="button">Capturar</button>
        <button id="btn-cancel-camera" class="btn btn-load" type="button">Cancelar</button>
      </div>
    </div>
  </dialog>
`;
