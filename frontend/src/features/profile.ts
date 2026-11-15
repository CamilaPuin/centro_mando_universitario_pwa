import { apiRequest, getCurrentUsername, isAuthenticated } from '../services/api';
import { abrirCamara, capturarFoto, describirErrorCamara, detenerCamara } from '../devices/dispositivo';
import {
  describirErrorConexionBaseDatos,
  guardarPerfil,
  obtenerPerfil,
  type PerfilEstudiante
} from '../utils/db';

const MAX_PHOTO_BYTES = 1024 * 1024;

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then(buffer => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  });
}

export function inicializarPerfil(databaseReady: Promise<IDBDatabase | undefined>): void {
  const nameDisplay = document.getElementById('profile-name-display');
  const usernameDisplay = document.getElementById('profile-username-display');
  const photoPreview = document.getElementById('profile-photo-preview') as HTMLImageElement | null;
  const menuName = document.getElementById('profile-menu-name');
  const menuInitial = document.getElementById('profile-menu-initial');
  const menuPhoto = document.getElementById('profile-menu-photo') as HTMLImageElement | null;
  const photoFile = document.getElementById('profile-photo-file') as HTMLInputElement | null;
  const status = document.getElementById('profile-status');
  const cameraDialog = document.getElementById('dlg-camara') as HTMLDialogElement | null;
  const cameraVideo = document.getElementById('camera-video') as HTMLVideoElement | null;
  const openCamera = document.getElementById('btn-open-camera');
  const choosePhoto = document.getElementById('btn-choose-photo');
  const capturePhoto = document.getElementById('btn-capture-photo');
  const cancelCamera = document.getElementById('btn-cancel-camera');
  if (!nameDisplay || !usernameDisplay || !photoPreview || !photoFile || !status ||
      !cameraDialog || !cameraVideo || !openCamera || !choosePhoto || !capturePhoto || !cancelCamera) return;
  const profileNameDisplay = nameDisplay;
  const profileUsernameDisplay = usernameDisplay;
  const profilePhotoPreview = photoPreview;
  const profileStatus = status;
  const profileCameraVideo = cameraVideo;

  let currentProfile: PerfilEstudiante | undefined;
  let cameraStream: MediaStream | undefined;
  let photoUrl: string | undefined;

  function updateProfileMenu(name: string): void {
    const displayName = name.trim() || 'Mi perfil';
    if (menuName) menuName.textContent = displayName;
    if (menuInitial) menuInitial.textContent = displayName.charAt(0).toLocaleUpperCase('es');
  }

  function showPhoto(blob: Blob | undefined): void {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = undefined;
    if (!blob) {
      profilePhotoPreview.removeAttribute('src');
      profilePhotoPreview.hidden = true;
      if (menuPhoto) {
        menuPhoto.removeAttribute('src');
        menuPhoto.hidden = true;
      }
      if (menuInitial) menuInitial.hidden = false;
      return;
    }
    photoUrl = URL.createObjectURL(blob);
    profilePhotoPreview.src = photoUrl;
    profilePhotoPreview.hidden = false;
    if (menuPhoto) {
      menuPhoto.src = photoUrl;
      menuPhoto.hidden = false;
      if (menuInitial) menuInitial.hidden = true;
    }
  }

  async function savePhoto(photo: Blob): Promise<void> {
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new Error('La foto supera el máximo de 1 MB. Elige una imagen más pequeña.');
    }
    const db = await databaseReady;
    if (!db) throw new Error('IndexedDB no está disponible.');
    const username = getCurrentUsername();
    if (!username) throw new Error('Inicia sesión para guardar tu foto de perfil.');
    if (!currentProfile) throw new Error('No se pudo cargar el perfil de la cuenta.');

    currentProfile = await guardarPerfil(db, {
      nombre: currentProfile.nombre,
      nombreUsuario: username,
      foto: photo,
      syncPending: true
    });
    showPhoto(photo);

    if (navigator.onLine && isAuthenticated()) {
      await apiRequest('/users/me/photo', {
        method: 'PUT',
        body: JSON.stringify({ photo: await blobToBase64(photo) })
      });
      currentProfile = await guardarPerfil(db, {
        nombre: currentProfile.nombre,
        nombreUsuario: username,
        foto: photo,
        syncPending: false
      });
      profileStatus.textContent = 'Foto de perfil sincronizada con tu cuenta.';
    } else {
      profileStatus.textContent = 'Foto guardada localmente. Se sincronizará al recuperar la conexión.';
    }
  }

  async function loadProfile(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      profileStatus.textContent = 'El perfil no está disponible porque IndexedDB no pudo abrirse.';
      return;
    }
    const username = getCurrentUsername();
    if (!username) {
      currentProfile = undefined;
      profileNameDisplay.textContent = 'Inicia sesión para ver tu perfil.';
      profileUsernameDisplay.textContent = '';
      updateProfileMenu('');
      showPhoto(undefined);
      return;
    }
    currentProfile = await obtenerPerfil(db);
    if (!currentProfile || currentProfile.nombreUsuario !== username) {
      profileNameDisplay.textContent = username;
      profileUsernameDisplay.textContent = username;
      currentProfile = {
        id: 'estudiante',
        nombre: username,
        nombreUsuario: username,
        actualizadoEn: new Date().toISOString()
      };
    } else {
      profileNameDisplay.textContent = currentProfile.nombre;
      profileUsernameDisplay.textContent = currentProfile.nombreUsuario;
    }
    updateProfileMenu(profileNameDisplay.textContent ?? username);
    showPhoto(currentProfile.foto);
  }

  async function synchronizePendingPhoto(): Promise<void> {
    const db = await databaseReady;
    if (!db || !navigator.onLine || !isAuthenticated()) return;
    const profile = await obtenerPerfil(db);
    if (!profile?.syncPending || !profile.foto) return;
    await apiRequest('/users/me/photo', {
      method: 'PUT',
      body: JSON.stringify({ photo: await blobToBase64(profile.foto) })
    });
    currentProfile = await guardarPerfil(db, {
      nombre: profile.nombre,
      nombreUsuario: profile.nombreUsuario,
      foto: profile.foto,
      syncPending: false
    });
    profileStatus.textContent = 'Foto de perfil sincronizada con tu cuenta.';
  }

  menuPhoto?.addEventListener('error', () => {
    menuPhoto.hidden = true;
    if (menuInitial) menuInitial.hidden = false;
  });

  function stopCamera(): void {
    detenerCamara(cameraStream);
    cameraStream = undefined;
    profileCameraVideo.srcObject = null;
  }

  choosePhoto.addEventListener('click', () => photoFile.click());
  photoFile.addEventListener('change', () => {
    const file = photoFile.files?.[0];
    photoFile.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      profileStatus.textContent = 'Selecciona un archivo de imagen válido.';
      return;
    }
    void savePhoto(file).catch(error => {
      profileStatus.textContent = describirErrorConexionBaseDatos(error) ??
        (error instanceof Error ? error.message : 'No se pudo guardar la fotografía.');
    });
  });

  openCamera.addEventListener('click', () => {
    void (async () => {
      try {
        cameraStream = await abrirCamara('user');
        profileCameraVideo.srcObject = cameraStream;
        cameraDialog.showModal();
        await profileCameraVideo.play();
        profileStatus.textContent = 'Cámara activa. Captura la foto cuando estés listo.';
      } catch (error) {
        stopCamera();
        profileStatus.textContent = describirErrorCamara(error);
      }
    })();
  });

  capturePhoto.addEventListener('click', () => {
    void (async () => {
      try {
        const photo = await capturarFoto(profileCameraVideo);
        stopCamera();
        cameraDialog.close();
        await savePhoto(photo);
      } catch (error) {
        profileStatus.textContent = describirErrorConexionBaseDatos(error) ??
          (error instanceof Error ? error.message : 'No se pudo capturar la foto.');
      }
    })();
  });

  cancelCamera.addEventListener('click', () => cameraDialog.close());
  cameraDialog.addEventListener('close', stopCamera);
  window.addEventListener('auth-changed', () => {
    void loadProfile().catch(error => {
      console.error('No se pudo cargar el perfil de la cuenta:', error);
      profileStatus.textContent = 'No se pudo cargar el perfil de la cuenta.';
    });
  });
  window.addEventListener('profile-updated', () => {
    void loadProfile().catch(error => {
      console.error('No se pudo actualizar el perfil:', error);
      profileStatus.textContent = 'No se pudo actualizar el perfil.';
    });
    void synchronizePendingPhoto().catch(error => {
      console.error('No se pudo sincronizar la foto de perfil:', error);
      profileStatus.textContent = 'No se pudo sincronizar la foto de perfil.';
    });
  });
  window.addEventListener('online', () => {
    void synchronizePendingPhoto().catch(error => {
      console.error('No se pudo sincronizar la foto de perfil:', error);
      profileStatus.textContent = 'No se pudo sincronizar la foto de perfil.';
    });
  });
  window.addEventListener('pagehide', () => {
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  void loadProfile().catch(error => {
    console.error('No se pudo cargar el perfil local:', error);
    profileStatus.textContent = 'No se pudo cargar el perfil local.';
  });
}
