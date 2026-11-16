import type { ReactElement } from 'react';

interface ModuloDispositivoProps {
  activo: boolean;
}

export function ModuloDispositivo({ activo }: ModuloDispositivoProps): ReactElement {
  return (
    <section id="tab-dispositivo" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="device-tools">
        <section className="dashboard-panel profile-panel" aria-labelledby="profile-title">
          <h2 id="profile-title" className="panel-title">Tu perfil</h2>
          <p className="device-help">Este perfil pertenece a tu cuenta y se sincroniza cuando hay conexión.</p>
          <div className="profile-editor">
            <img id="profile-photo-preview" className="profile-photo-preview" alt="Foto de perfil" hidden />
            <p><strong>Nombre:</strong> <span id="profile-name-display">Inicia sesión para ver tu perfil.</span></p>
            <p><strong>Usuario:</strong> <span id="profile-username-display" /></p>
            <div className="profile-actions">
              <button id="btn-open-camera" className="btn btn-load" type="button">Tomar foto</button>
              <button id="btn-choose-photo" className="btn btn-load" type="button">Elegir imagen</button>
              <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
            </div>
          </div>
          <p id="profile-status" className="device-status" role="status" aria-live="polite">
            La cámara solo se activa cuando la solicitas.
          </p>
        </section>

        <section className="dashboard-panel" aria-labelledby="reminders-title">
          <h2 id="reminders-title" className="panel-title">Recordatorios de estudio</h2>
          <p className="device-help">
            Te avisaremos sobre fechas límite y clases próximas. Los recordatorios de este dispositivo funcionan
            mientras la app esté activa; las notificaciones de tu cuenta requieren habilitar las notificaciones push.
          </p>
          <button id="btn-enable-notifications" className="btn btn-save" type="button">
            Activar recordatorios
          </button>
          <p id="notification-status" className="device-status" role="status" aria-live="polite">
            No se solicitará permiso hasta que pulses el botón.
          </p>
        </section>
      </div>

      <dialog id="dlg-camara" className="camera-dialog" aria-labelledby="camera-dialog-title">
        <div className="camera-dialog-content">
          <h2 id="camera-dialog-title">Foto de perfil</h2>
          <video id="camera-video" autoPlay playsInline aria-label="Vista previa de la cámara" />
          <div className="profile-actions">
            <button id="btn-capture-photo" className="btn btn-save" type="button">Capturar y guardar</button>
            <button id="btn-cancel-camera" className="btn btn-load" type="button">Cancelar</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
