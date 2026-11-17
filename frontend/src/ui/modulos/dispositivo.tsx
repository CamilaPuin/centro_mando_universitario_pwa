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
          <p className="device-help">Tu perfil se guarda en este dispositivo.</p>
          <div className="profile-editor">
            <img id="profile-photo-preview" className="profile-photo-preview" alt="Foto de perfil" hidden />
            <form id="profile-form" className="delivery-form">
              <div className="form-group">
                <label htmlFor="profile-name">Nombre <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  id="profile-name"
                  className="form-control"
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Ej. Camila Puin"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-username">
                  Nombre de usuario <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <input
                  id="profile-username"
                  className="form-control"
                  required
                  maxLength={40}
                  autoComplete="username"
                  placeholder="Ej. camila.puin"
                />
              </div>
              <div className="profile-actions">
                <button className="btn btn-save" type="submit">Guardar perfil</button>
                <button id="btn-open-camera" className="btn btn-load" type="button">Tomar foto</button>
                <button id="btn-choose-photo" className="btn btn-load" type="button">Elegir imagen</button>
                <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
              </div>
            </form>
          </div>
          <p id="profile-status" className="device-status" role="status" aria-live="polite">
            Completa tu perfil. La cámara solo se activa cuando la solicitas.
          </p>
        </section>
        <section className="dashboard-panel" aria-labelledby="reminders-title">
          <h2 id="reminders-title" className="panel-title">Recordatorios de estudio</h2>
          <p className="device-help">
            Te avisaremos sobre fechas límite y clases próximas. Los recordatorios de este dispositivo funcionan mientras la app esté activa; las notificaciones de tu cuenta requieren habilitar las notificaciones push.
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
            <button id="btn-capture-photo" className="btn btn-save" type="button">
              Capturar y guardar
            </button>
            <button id="btn-cancel-camera" className="btn btn-load" type="button">Cancelar</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
