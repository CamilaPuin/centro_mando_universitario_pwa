import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { useRecordatorios } from '../../features/notificaciones';
import type { PerfilController } from '../../features/profile';
import { abrirCamara, capturarFoto, describirErrorCamara, detenerCamara } from '../../devices/dispositivo';

interface ModuloDispositivoProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
  profile: PerfilController;
}

export function ModuloDispositivo({
  activo,
  databaseReady,
  profile
}: ModuloDispositivoProps): ReactElement {
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fotoPendiente, setFotoPendiente] = useState<Blob>();
  const [fotoPendienteUrl, setFotoPendienteUrl] = useState<string>();
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const profilePhotoFile = useRef<HTMLInputElement>(null);
  const cameraDialog = useRef<HTMLDialogElement>(null);
  const cameraVideo = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | undefined>(undefined);
  const recordatorios = useRecordatorios(databaseReady);

  useEffect(() => {
    setNombre(profile.profile?.nombre ?? '');
    setNombreUsuario(profile.profile?.nombreUsuario ?? '');
  }, [profile.profile]);

  useEffect(() => {
    if (!fotoPendiente) {
      setFotoPendienteUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(fotoPendiente);
    setFotoPendienteUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fotoPendiente]);

  const stopCamera = (): void => {
    detenerCamara(cameraStream.current);
    cameraStream.current = undefined;
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
    if (cameraDialog.current?.open) cameraDialog.current.close();
  };

  useEffect(() => () => stopCamera(), []);

  const saveProfile = async (photo = fotoPendiente): Promise<boolean> => {
    setGuardandoPerfil(true);
    profile.setStatus('Guardando perfil…');
    try {
      await profile.saveProfile(nombre, nombreUsuario, photo);
      setFotoPendiente(undefined);
      profile.setStatus('Perfil guardado.');
      return true;
    } catch (error) {
      profile.setStatus(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
      return false;
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const submitProfile = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void saveProfile();
  };

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      profile.setStatus('Selecciona un archivo de imagen válido.');
      return;
    }
    setFotoPendiente(file);
    profile.setPreviewPhoto(file);
    if (nombre.trim() && nombreUsuario.trim()) {
      void saveProfile(file).then(saved => {
        if (saved) profile.setStatus('Foto de perfil guardada.');
      });
    } else {
      profile.setStatus('Foto lista. Completa tu nombre y usuario y guarda el perfil.');
    }
  };

  const openCamera = async (): Promise<void> => {
    try {
      const stream = await abrirCamara('user');
      const video = cameraVideo.current;
      const dialog = cameraDialog.current;
      if (!video || !dialog) {
        detenerCamara(stream);
        throw new Error('No se pudo preparar la vista previa de la cámara.');
      }
      cameraStream.current = stream;
      video.srcObject = stream;
      if (!dialog.open) dialog.showModal();
      await video.play();
      profile.setStatus('Cámara activa. Captura la foto cuando estés listo.');
    } catch (error) {
      stopCamera();
      profile.setStatus(describirErrorCamara(error));
    }
  };

  const capturePhoto = async (): Promise<void> => {
    try {
      const video = cameraVideo.current;
      if (!video) throw new Error('No se pudo acceder a la vista previa de la cámara.');
      const photo = await capturarFoto(video);
      setFotoPendiente(photo);
      profile.setPreviewPhoto(photo);
      stopCamera();
      if (nombre.trim() && nombreUsuario.trim()) {
        await profile.saveProfile(nombre, nombreUsuario, photo);
        setFotoPendiente(undefined);
        profile.setStatus('Foto de perfil capturada y guardada.');
      } else {
        profile.setStatus('Foto capturada. Completa tu nombre y usuario y guarda el perfil.');
      }
    } catch (error) {
      profile.setStatus(error instanceof Error ? error.message : 'No se pudo capturar la foto.');
    }
  };

  const previewUrl = fotoPendienteUrl ?? profile.photoUrl;

  return (
    <section id="tab-dispositivo" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="device-tools">
        <section className="dashboard-panel profile-panel" aria-labelledby="profile-title">
          <h2 id="profile-title" className="panel-title">Tu perfil</h2>
          <p className="device-help">Tu perfil se guarda en este dispositivo.</p>
          <div className="profile-editor">
            <img
              id="profile-photo-preview"
              className="profile-photo-preview"
              alt="Foto de perfil"
              src={previewUrl}
              hidden={!previewUrl}
            />
            <form id="profile-form" className="delivery-form" onSubmit={submitProfile}>
              <div className="form-group">
                <label htmlFor="profile-name">Nombre <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  id="profile-name"
                  className="form-control"
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Ej. Camila Puin"
                  value={nombre}
                  onChange={event => setNombre(event.currentTarget.value)}
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
                  value={nombreUsuario}
                  onChange={event => setNombreUsuario(event.currentTarget.value)}
                />
              </div>
              <div className="profile-actions">
                <button className="btn btn-save" type="submit" disabled={guardandoPerfil}>
                  Guardar perfil
                </button>
                <button className="btn btn-load" type="button" onClick={() => void openCamera()}>
                  Tomar foto
                </button>
                <button
                  id="btn-choose-photo"
                  className="btn btn-load"
                  type="button"
                  onClick={() => profilePhotoFile.current?.click()}
                >
                  Elegir imagen
                </button>
                <input
                  ref={profilePhotoFile}
                  id="profile-photo-file"
                  type="file"
                  accept="image/*"
                  capture="user"
                  hidden
                  onChange={choosePhoto}
                />
              </div>
            </form>
          </div>
          <p id="profile-status" className="device-status" role="status" aria-live="polite">
            {profile.status}
          </p>
        </section>
        <section className="dashboard-panel" aria-labelledby="reminders-title">
          <h2 id="reminders-title" className="panel-title">Recordatorios de estudio</h2>
          <p className="device-help">
            Te avisaremos sobre fechas límite y clases próximas. Los recordatorios de este dispositivo funcionan mientras la app esté activa; las notificaciones de tu cuenta requieren habilitar las notificaciones push.
          </p>
          <button
            id="btn-enable-notifications"
            className="btn btn-save"
            type="button"
            onClick={() => void recordatorios.activate()}
          >
            Activar recordatorios
          </button>
          <p id="notification-status" className="device-status" role="status" aria-live="polite">
            {recordatorios.status}
          </p>
        </section>
      </div>
      <dialog
        ref={cameraDialog}
        id="dlg-camara"
        className="camera-dialog"
        aria-labelledby="camera-dialog-title"
        onCancel={event => {
          event.preventDefault();
          stopCamera();
        }}
      >
        <div className="camera-dialog-content">
          <h2 id="camera-dialog-title">Foto de perfil</h2>
          <video
            ref={cameraVideo}
            id="camera-video"
            autoPlay
            playsInline
            aria-label="Vista previa de la cámara"
          />
          <div className="profile-actions">
            <button className="btn btn-save" type="button" onClick={() => void capturePhoto()}>
              Capturar y guardar
            </button>
            <button className="btn btn-load" type="button" onClick={stopCamera}>Cancelar</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
