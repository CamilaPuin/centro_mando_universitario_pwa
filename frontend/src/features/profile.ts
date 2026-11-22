import {
  actualizarSesionAutenticada,
  apiRequest,
  getCurrentUsername,
  isAuthenticated
} from '../services/api';
import { abrirCamara, capturarFoto, describirErrorCamara, detenerCamara } from '../devices/dispositivo';
import {
  describirErrorConexionBaseDatos,
  guardarPerfil,
  obtenerCredencialOffline,
  obtenerPerfil,
  guardarCredencialOffline,
  renombrarUsuarioLocal,
  describirErrorParaUsuario,
  type PerfilEstudiante
} from '../utils/db';
import { crearCredencialLocal } from '../utils/auth-crypto';

const MAX_PHOTO_BYTES = 1024 * 1024;

interface ProfileUpdateResponse {
  username: string;
  firstName: string;
  lastName: string;
  token: string;
}

function splitLegacyName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/);
  return { firstName, lastName: lastNameParts.join(' ') };
}

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
  const profileForm = document.getElementById('profile-form') as HTMLFormElement | null;
  const profileName = document.getElementById('profile-name') as HTMLInputElement | null;
  const profileLastName = document.getElementById('profile-last-name') as HTMLInputElement | null;
  const profileUsername = document.getElementById('profile-username') as HTMLInputElement | null;
  const profileOverview = document.getElementById('profile-overview');
  const profileEditSection = document.getElementById('profile-edit-section');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileDisplayUsername = document.getElementById('profile-display-username');
  const editProfileButton = document.getElementById('btn-edit-profile') as HTMLButtonElement | null;
  const cancelProfileEditButton = document.getElementById('btn-cancel-profile-edit');
  const passwordForm = document.getElementById('profile-password-form') as HTMLFormElement | null;
  const currentPassword = document.getElementById('profile-current-password') as HTMLInputElement | null;
  const newPassword = document.getElementById('profile-new-password') as HTMLInputElement | null;
  const photoPreview = document.getElementById('profile-photo-preview') as HTMLImageElement | null;
  const photoPreviews = Array.from(document.querySelectorAll<HTMLImageElement>('.profile-photo-preview'));
  const avatarInitials = Array.from(document.querySelectorAll<HTMLElement>('.profile-avatar-initial'));
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
  if (!profileForm || !profileName || !profileLastName || !profileUsername || !profileOverview ||
      !profileEditSection || !profileDisplayName || !profileDisplayUsername ||
      !editProfileButton || !cancelProfileEditButton ||
      !passwordForm || !currentPassword || !newPassword || !photoPreview || !photoFile || !status ||
      !cameraDialog || !cameraVideo || !openCamera || !choosePhoto || !capturePhoto || !cancelCamera) return;
  const profileOverviewElement = profileOverview;
  const profileEditSectionElement = profileEditSection;
  const profileDisplayNameElement = profileDisplayName;
  const profileDisplayUsernameElement = profileDisplayUsername;
  const editProfileButtonElement = editProfileButton;
  const cancelProfileEditButtonElement = cancelProfileEditButton;
  const profileNameInput = profileName;
  const profileLastNameInput = profileLastName;
  const profileUsernameInput = profileUsername;
  const profilePasswordForm = passwordForm;
  const currentPasswordInput = currentPassword;
  const newPasswordInput = newPassword;
  const profilePhotoPreview = photoPreview;
  const profileStatus = status;
  const profileCameraVideo = cameraVideo;

  let currentProfile: PerfilEstudiante | undefined;
  let cameraStream: MediaStream | undefined;
  let photoUrl: string | undefined;
  let draftPhoto: Blob | undefined;
  let synchronizingProfile = false;

  function updateProfileMenu(name: string): void {
    const displayName = name.trim() || 'Mi perfil';
    if (menuName) menuName.textContent = displayName;
    const initial = displayName.charAt(0).toLocaleUpperCase('es');
    if (menuInitial) menuInitial.textContent = initial;
    for (const avatarInitial of avatarInitials) avatarInitial.textContent = initial;
  }

  function showPhoto(blob: Blob | undefined): void {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = undefined;
    if (!blob) {
      for (const preview of photoPreviews) {
        preview.removeAttribute('src');
        preview.hidden = true;
      }
      for (const avatarInitial of avatarInitials) avatarInitial.hidden = false;
      if (menuPhoto) {
        menuPhoto.removeAttribute('src');
        menuPhoto.hidden = true;
      }
      if (menuInitial) menuInitial.hidden = false;
      return;
    }
    photoUrl = URL.createObjectURL(blob);
    for (const preview of photoPreviews) {
      preview.src = photoUrl;
      preview.hidden = false;
    }
    for (const avatarInitial of avatarInitials) avatarInitial.hidden = true;
    profilePhotoPreview.hidden = false;
    if (menuPhoto) {
      menuPhoto.src = photoUrl;
      menuPhoto.hidden = false;
      if (menuInitial) menuInitial.hidden = true;
    }
  }

  function populateEditFields(): void {
    if (!currentProfile) return;
    const nameParts = splitLegacyName(currentProfile.nombre);
    profileNameInput.value = currentProfile.firstName ?? nameParts.firstName;
    profileLastNameInput.value = currentProfile.lastName ?? nameParts.lastName;
    profileUsernameInput.value = currentProfile.usernamePendiente ?? currentProfile.nombreUsuario;
  }

  function updateProfileSummary(): void {
    const firstName = profileNameInput.value.trim();
    const lastName = profileLastNameInput.value.trim();
    const username = profileUsernameInput.value.trim();
    const displayName = `${firstName} ${lastName}`.trim() || 'Mi perfil';
    profileDisplayNameElement.textContent = displayName;
    profileDisplayUsernameElement.textContent = username ? `@${username}` : '';
    updateProfileMenu(displayName);
  }

  function setEditMode(editing: boolean): void {
    profileOverviewElement.hidden = editing;
    profileEditSectionElement.hidden = !editing;
    if (editing) {
      populateEditFields();
      draftPhoto = currentProfile?.foto;
      showPhoto(draftPhoto);
    }
  }

  function stagePhoto(photo: Blob): void {
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new Error('La foto supera el máximo de 1 MB. Elige una imagen más pequeña.');
    }
    const username = getCurrentUsername();
    if (!username) throw new Error('Inicia sesión para cambiar tu foto de perfil.');
    if (!currentProfile || currentProfile.nombreUsuario !== username) {
      throw new Error('No se pudo cargar el perfil de la cuenta.');
    }
    draftPhoto = photo;
    showPhoto(photo);
    profileStatus.textContent = 'Foto lista. Confirma los cambios para guardarla en tu perfil.';
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
      profileNameInput.value = '';
      profileLastNameInput.value = '';
      profileUsernameInput.value = '';
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      editProfileButtonElement.disabled = true;
      profileDisplayNameElement.textContent = 'Mi perfil';
      profileDisplayUsernameElement.textContent = '';
      draftPhoto = undefined;
      updateProfileMenu('');
      showPhoto(undefined);
      setEditMode(false);
      return;
    }
    editProfileButtonElement.disabled = false;
    currentProfile = await obtenerPerfil(db, username);
    if (!currentProfile || currentProfile.nombreUsuario !== username) {
      currentProfile = {
        id: username,
        nombre: username,
        nombreUsuario: username,
        firstName: username,
        lastName: '',
        actualizadoEn: new Date().toISOString()
      };
    }
    populateEditFields();
    updateProfileSummary();
    draftPhoto = currentProfile.foto;
    showPhoto(currentProfile.foto);
    setEditMode(false);
  }

  editProfileButtonElement.addEventListener('click', () => {
    if (!getCurrentUsername()) {
      profileStatus.textContent = 'Inicia sesión para editar tu perfil.';
      return;
    }
    profileStatus.textContent = '';
    setEditMode(true);
  });

  cancelProfileEditButtonElement.addEventListener('click', () => {
    draftPhoto = currentProfile?.foto;
    showPhoto(draftPhoto);
    setEditMode(false);
    profileStatus.textContent = '';
  });

  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      try {
        const db = await databaseReady;
        const username = getCurrentUsername();
        if (!db) throw new Error('IndexedDB no está disponible.');
        if (!username) throw new Error('Inicia sesión para guardar tu perfil.');
        const name = profileNameInput.value.trim();
        const lastName = profileLastNameInput.value.trim();
        const requestedUsername = profileUsernameInput.value.trim();
        if (!name || !lastName) throw new Error('Escribe tu nombre y apellido para guardar el perfil.');
        if (!requestedUsername) throw new Error('Escribe un nombre de usuario válido.');
        const photo = draftPhoto ?? currentProfile?.foto;
        const savedProfile = await guardarPerfil(db, {
          nombre: `${name} ${lastName}`,
          nombreUsuario: username,
          firstName: name,
          lastName,
          ...(requestedUsername === username ? {} : { usernamePendiente: requestedUsername }),
          ...(photo ? { foto: photo } : {}),
          syncPending: true
        });
        if (getCurrentUsername() !== username) return;
        currentProfile = savedProfile;
        draftPhoto = photo;
        updateProfileSummary();
        showPhoto(photo);
        setEditMode(false);
        profileStatus.textContent = 'Perfil guardado en este dispositivo. Se sincronizará cuando haya conexión.';
        if (navigator.onLine && isAuthenticated()) {
          await synchronizePendingProfile();
        }
      } catch (error) {
        const dbMessage = describirErrorConexionBaseDatos(error);
        const message = dbMessage ?? describirErrorParaUsuario(error, 'No se pudo guardar el perfil. Inténtalo de nuevo.');
        profileStatus.textContent = currentProfile?.syncPending && !dbMessage
          ? `Perfil guardado localmente. No se pudo sincronizar: ${message}`
          : message;
      }
    })();
  });

  async function synchronizePendingProfile(): Promise<void> {
    if (synchronizingProfile || !navigator.onLine || !isAuthenticated()) return;
    synchronizingProfile = true;
    try {
      const db = await databaseReady;
      const username = getCurrentUsername();
      if (!db || !username) return;
      const profile = await obtenerPerfil(db, username);
      if (!profile?.syncPending) return;

      const nameParts = splitLegacyName(profile.nombre);
      const firstName = profile.firstName ?? nameParts.firstName;
      const lastName = profile.lastName ?? nameParts.lastName;
      const newUsername = profile.usernamePendiente?.trim() || username;
      if (newUsername !== username && await obtenerCredencialOffline(db, newUsername)) {
        throw new Error('Ese nombre de usuario ya está asociado a otra cuenta guardada en este dispositivo.');
      }

      const response = await apiRequest<ProfileUpdateResponse>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ username: newUsername, firstName, lastName })
      });
      if (getCurrentUsername() !== username) return;

      if (response.username !== username) {
        await renombrarUsuarioLocal(db, username, response.username, response.firstName, response.lastName);
        actualizarSesionAutenticada(response.token, response.username);
      }
      const activeUsername = getCurrentUsername();
      if (!activeUsername) return;
      let updatedProfile = await obtenerPerfil(db, activeUsername);
      const photo = updatedProfile?.foto ?? profile.foto;
      if (photo) {
        await apiRequest('/users/me/photo', {
          method: 'PUT',
          body: JSON.stringify({ photo: await blobToBase64(photo) })
        });
      }
      updatedProfile = await guardarPerfil(db, {
        nombre: `${response.firstName} ${response.lastName}`.trim(),
        nombreUsuario: activeUsername,
        firstName: response.firstName,
        lastName: response.lastName,
        ...(photo ? { foto: photo } : {}),
        syncPending: false
      });
      if (getCurrentUsername() !== activeUsername) return;
      currentProfile = updatedProfile;
      profileNameInput.value = response.firstName;
      profileLastNameInput.value = response.lastName;
      profileUsernameInput.value = activeUsername;
      draftPhoto = photo;
      updateProfileSummary();
      showPhoto(photo);
      profileStatus.textContent = 'Perfil sincronizado con tu cuenta y tus otros dispositivos.';
    } finally {
      synchronizingProfile = false;
    }
  }

  profilePasswordForm.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      try {
        if (!navigator.onLine || !isAuthenticated()) {
          throw new Error('Necesitas conexión e iniciar sesión para cambiar la contraseña.');
        }
        const db = await databaseReady;
        const username = getCurrentUsername();
        if (!db || !username) throw new Error('No se pudo acceder a la cuenta actual.');
        const response = await apiRequest<{ token: string }>('/users/me/password', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value
          })
        });
        if (getCurrentUsername() !== username) return;
        actualizarSesionAutenticada(response.token, username);
        const existingCredential = await obtenerCredencialOffline(db, username);
        const localNames = currentProfile
          ? {
              firstName: currentProfile.firstName ?? splitLegacyName(currentProfile.nombre).firstName,
              lastName: currentProfile.lastName ?? splitLegacyName(currentProfile.nombre).lastName
            }
          : { firstName: username, lastName: '' };
        await guardarCredencialOffline(db, {
          ...(existingCredential ?? {
            username,
            ...localNames,
            pendingRegistration: false
          }),
          ...localNames,
          ...await crearCredencialLocal(newPasswordInput.value),
          pendingRegistration: false
        });
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        profileStatus.textContent = 'Contraseña actualizada. La contraseña anterior ya no es válida.';
      } catch (error) {
        profileStatus.textContent = describirErrorParaUsuario(error, 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
      }
    })();
  });

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
    try {
      stagePhoto(file);
    } catch (error) {
      profileStatus.textContent = describirErrorParaUsuario(error, 'No se pudo guardar la fotografía. Inténtalo de nuevo.');
    }
  });

  openCamera.addEventListener('click', () => {
    void (async () => {
      try {
        cameraDialog.showModal();
        profileStatus.textContent = 'Solicitando acceso a la cámara…';
        cameraStream = await abrirCamara('user');
        profileCameraVideo.srcObject = cameraStream;
        await profileCameraVideo.play();
        profileStatus.textContent = 'Cámara activa. Captura la foto cuando estés listo.';
      } catch (error) {
        stopCamera();
        if (cameraDialog.open) cameraDialog.close();
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
        stagePhoto(photo);
      } catch (error) {
        profileStatus.textContent = describirErrorParaUsuario(error, 'No se pudo capturar la foto. Inténtalo de nuevo.');
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
    void synchronizePendingProfile().catch(error => {
      console.error('No se pudo sincronizar el perfil:', error);
      profileStatus.textContent = `Perfil guardado localmente. No se pudo sincronizar: ${describirErrorParaUsuario(error, 'Inténtalo de nuevo más tarde.')}`;
    });
  });
  window.addEventListener('profile-updated', () => {
    void loadProfile().catch(error => {
      console.error('No se pudo actualizar el perfil:', error);
      profileStatus.textContent = 'No se pudo actualizar el perfil.';
    });
    void synchronizePendingProfile().catch(error => {
      console.error('No se pudo sincronizar el perfil:', error);
      profileStatus.textContent = `Perfil guardado localmente. No se pudo sincronizar: ${describirErrorParaUsuario(error, 'Inténtalo de nuevo más tarde.')}`;
    });
  });
  window.addEventListener('online', () => {
    void synchronizePendingProfile().catch(error => {
      console.error('No se pudo sincronizar el perfil:', error);
      profileStatus.textContent = `Perfil guardado localmente. No se pudo sincronizar: ${describirErrorParaUsuario(error, 'Inténtalo de nuevo más tarde.')}`;
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
