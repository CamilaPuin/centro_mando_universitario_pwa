export const interfazDispositivo = `
  <div class="device-tools">
    <section class="dashboard-panel profile-panel" aria-labelledby="profile-title">
      <h2 id="profile-title" class="panel-title">Tu perfil</h2>
      <p class="device-help">Este perfil pertenece a tu cuenta y se sincroniza cuando hay conexión.</p>
      <div class="profile-editor">
        <img id="profile-photo-preview" class="profile-photo-preview" alt="Foto de perfil" hidden />
        <p><strong>Nombre:</strong> <span id="profile-name-display">Inicia sesión para ver tu perfil.</span></p>
        <p><strong>Usuario:</strong> <span id="profile-username-display"></span></p>
        <div class="profile-actions">
          <button id="btn-open-camera" class="btn btn-load" type="button">Tomar foto</button>
          <button id="btn-choose-photo" class="btn btn-load" type="button">Elegir imagen</button>
          <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
        </div>
      </div>
      <p id="profile-status" class="device-status" role="status" aria-live="polite">La cámara solo se activa cuando la solicitas.</p>
    </section>

    <section class="dashboard-panel" aria-labelledby="reminders-title">
      <h2 id="reminders-title" class="panel-title">Recordatorios de estudio</h2>
      <p class="device-help">Te avisaremos sobre fechas límite y clases próximas. Los recordatorios de este dispositivo funcionan mientras la app esté activa; las notificaciones de tu cuenta requieren habilitar las notificaciones push.</p>
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
`;
