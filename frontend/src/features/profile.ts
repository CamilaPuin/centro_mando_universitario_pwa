import {
  guardarPerfil,
  obtenerPerfil,
  obtenerUltimaFotoPerfil,
  type PerfilEstudiante
} from '../utils/db';
import { abrirCamara, capturarFoto, describirErrorCamara, detenerCamara } from '../devices/dispositivo';

export function inicializarPerfil(databaseReady: Promise<IDBDatabase | undefined>): void {
  const form = document.getElementById('profile-form') as HTMLFormElement | null;
  const nameInput = document.getElementById('profile-name') as HTMLInputElement | null;
  const usernameInput = document.getElementById('profile-username') as HTMLInputElement | null;
  const photoPreview = document.getElementById('profile-photo-preview') as HTMLImageElement | null;
  const photoFile = document.getElementById('profile-photo-file') as HTMLInputElement | null;
  const status = document.getElementById('profile-status');
  const cameraDialog = document.getElementById('dlg-camara') as HTMLDialogElement | null;
  const cameraVideo = document.getElementById('camera-video') as HTMLVideoElement | null;
  const openCamera = document.getElementById('btn-open-camera');
  const choosePhoto = document.getElementById('btn-choose-photo');
  const capturePhoto = document.getElementById('btn-capture-photo');
  const cancelCamera = document.getElementById('btn-cancel-camera');
  if (!form || !nameInput || !usernameInput || !photoPreview || !photoFile || !status ||
      !cameraDialog || !cameraVideo || !openCamera || !choosePhoto || !capturePhoto || !cancelCamera) return;
  const profileForm = form;
  const profileNameInput = nameInput;
  const profileUsernameInput = usernameInput;
  const profilePhotoPreview = photoPreview;
  const profilePhotoFile = photoFile;
  const profileStatus = status;
  const profileCameraDialog = cameraDialog;
  const profileCameraVideo = cameraVideo;
  const openCameraButton = openCamera;
  const choosePhotoButton = choosePhoto;
  const capturePhotoButton = capturePhoto;
  const cancelCameraButton = cancelCamera;

  let currentProfile: PerfilEstudiante | undefined;
  let pendingPhoto: Blob | undefined;
  let cameraStream: MediaStream | undefined;
  let photoUrl: string | undefined;

  function showPhoto(blob: Blob | undefined): void {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = undefined;
    if (!blob) {
      profilePhotoPreview.removeAttribute('src');
      profilePhotoPreview.hidden = true;
      return;
    }
    photoUrl = URL.createObjectURL(blob);
    profilePhotoPreview.src = photoUrl;
    profilePhotoPreview.hidden = false;
  }

  function stopCamera(): void {
    detenerCamara(cameraStream);
    cameraStream = undefined;
    profileCameraVideo.srcObject = null;
  }

  async function saveProfile(photo = pendingPhoto): Promise<void> {
    const db = await databaseReady;
    if (!db) throw new Error('IndexedDB no está disponible.');
    const nombre = profileNameInput.value.trim();
    const nombreUsuario = profileUsernameInput.value.trim().replace(/^@/, '');
    if (!nombre || !nombreUsuario) throw new Error('Completa el nombre y el nombre de usuario.');
    const foto = photo ?? currentProfile?.foto;
    currentProfile = await guardarPerfil(db, {
      nombre,
      nombreUsuario,
      ...(foto ? { foto } : {})
    });
    pendingPhoto = undefined;
    showPhoto(currentProfile.foto);
  }

  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    void saveProfile().then(() => {
      profileStatus.textContent = 'Perfil guardado localmente en este dispositivo.';
    }).catch(error => {
      profileStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar el perfil.';
    });
  });

  choosePhotoButton.addEventListener('click', () => profilePhotoFile.click());
  profilePhotoFile.addEventListener('change', () => {
    const file = profilePhotoFile.files?.[0];
    profilePhotoFile.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      profileStatus.textContent = 'Selecciona un archivo de imagen válido.';
      return;
    }
    pendingPhoto = file;
    showPhoto(file);
    if (profileNameInput.value.trim() && profileUsernameInput.value.trim()) {
      void saveProfile(file).then(() => {
        profileStatus.textContent = 'Foto de perfil guardada localmente.';
      }).catch(error => {
        profileStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar la fotografía.';
      });
    } else {
      profileStatus.textContent = 'Foto lista. Completa tu nombre y usuario y guarda el perfil.';
    }
  });

  openCameraButton.addEventListener('click', () => {
    void (async () => {
      try {
        cameraStream = await abrirCamara('user');
        profileCameraVideo.srcObject = cameraStream;
        profileCameraDialog.showModal();
        await profileCameraVideo.play();
        profileStatus.textContent = 'Cámara activa. Captura la foto cuando estés listo.';
      } catch (error) {
        stopCamera();
        profileStatus.textContent = describirErrorCamara(error);
      }
    })();
  });

  capturePhotoButton.addEventListener('click', () => {
    void (async () => {
      try {
        pendingPhoto = await capturarFoto(profileCameraVideo);
        stopCamera();
        profileCameraDialog.close();
        showPhoto(pendingPhoto);
        if (profileNameInput.value.trim() && profileUsernameInput.value.trim()) {
          await saveProfile(pendingPhoto);
          profileStatus.textContent = 'Foto de perfil capturada y guardada localmente.';
        } else {
          profileStatus.textContent = 'Foto capturada. Completa tu nombre y usuario y guarda el perfil.';
        }
      } catch (error) {
        profileStatus.textContent = error instanceof Error ? error.message : 'No se pudo capturar la foto.';
      }
    })();
  });

  cancelCameraButton.addEventListener('click', () => profileCameraDialog.close());
  profileCameraDialog.addEventListener('close', stopCamera);
  window.addEventListener('pagehide', () => {
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  void databaseReady.then(async db => {
    if (!db) {
      profileStatus.textContent = 'El perfil no está disponible porque IndexedDB no pudo abrirse.';
      return;
    }
    currentProfile = await obtenerPerfil(db);
    if (currentProfile) {
      profileNameInput.value = currentProfile.nombre;
      profileUsernameInput.value = currentProfile.nombreUsuario;
      showPhoto(currentProfile.foto);
      profileStatus.textContent = 'Perfil cargado desde este dispositivo.';
    } else {
      const legacyPhoto = await obtenerUltimaFotoPerfil(db);
      showPhoto(legacyPhoto);
      if (legacyPhoto) {
        currentProfile = {
          id: 'estudiante',
          nombre: '',
          nombreUsuario: '',
          foto: legacyPhoto,
          actualizadoEn: new Date().toISOString()
        };
        profileStatus.textContent = 'Se recuperó la foto guardada anteriormente. Completa tu perfil para conservarla.';
      }
    }
  }).catch(error => {
    console.error('No se pudo cargar el perfil local:', error);
    profileStatus.textContent = 'No se pudo cargar el perfil local.';
  });
}
