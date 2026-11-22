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
          <div className="profile-overview" id="profile-overview">
            <div className="profile-avatar">
              <span id="profile-avatar-initial" className="profile-avatar-initial" aria-hidden="true">P</span>
              <img id="profile-photo-preview" className="profile-photo-preview" alt="Foto de perfil" hidden />
            </div>
            <h3 id="profile-display-name" className="profile-display-name">Mi perfil</h3>
            <p id="profile-display-username" className="profile-display-username"></p>
            <button id="btn-edit-profile" className="btn btn-load" type="button">Editar perfil</button>
          </div>
          <div id="profile-edit-section" className="profile-edit-section" hidden>
            <form id="profile-form" className="delivery-form">
              <div className="profile-edit-avatar">
                <div className="profile-avatar profile-avatar-edit">
                  <span className="profile-avatar-initial" aria-hidden="true">P</span>
                  <img className="profile-photo-preview" alt="Vista previa de la foto de perfil" hidden />
                </div>
                <div className="profile-photo-actions">
                  <button id="btn-open-camera" className="btn btn-load" type="button">Tomar foto</button>
                  <button id="btn-choose-photo" className="btn btn-load" type="button">Elegir imagen</button>
                  <input id="profile-photo-file" type="file" accept="image/*" hidden />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="profile-name">Nombre(s) <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  id="profile-name"
                  className="form-control"
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  placeholder="Ej. Camila"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-last-name">Apellido(s) <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  id="profile-last-name"
                  className="form-control"
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  placeholder="Ej. Puin"
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
                  maxLength={50}
                  autoComplete="username"
                  placeholder="Ej. camila.puin"
                />
              </div>
              <div className="profile-actions profile-edit-actions">
                <button className="btn btn-save" type="submit">Confirmar cambios</button>
                <button id="btn-cancel-profile-edit" className="btn btn-load" type="button">Cancelar</button>
              </div>
            </form>
            <section className="profile-password-section" aria-labelledby="profile-password-title">
              <h3 id="profile-password-title">Cambiar contraseña</h3>
              <p className="device-help">Este cambio requiere conexión y confirmar tu contraseña actual.</p>
              <form id="profile-password-form" className="delivery-form">
                <div className="form-group">
                  <label htmlFor="profile-current-password">Contraseña actual</label>
                  <input
                    id="profile-current-password"
                    className="form-control"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-new-password">Nueva contraseña</label>
                  <input
                    id="profile-new-password"
                    className="form-control"
                    type="password"
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="profile-actions">
                  <button className="btn btn-load" type="submit">Actualizar contraseña</button>
                </div>
              </form>
            </section>
          </div>
          <p id="profile-status" className="device-status" role="status" aria-live="polite">
            Tus cambios se guardan en este dispositivo y se sincronizan cuando tengas conexión.
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
            El navegador pedirá permiso cuando pulses “Activar recordatorios”. Si eliges “Ahora no”, podrás activarlos desde aquí después.
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
