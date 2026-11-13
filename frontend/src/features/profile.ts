import { useCallback, useEffect, useRef, useState } from 'react';
import {
  guardarPerfil as guardarPerfilDb,
  obtenerPerfil,
  obtenerUltimaFotoPerfil,
  type PerfilEstudiante
} from '../utils/db';

export interface PerfilController {
  profile: PerfilEstudiante | undefined;
  photoUrl: string | undefined;
  setPreviewPhoto: (photo: Blob | undefined) => void;
  displayName: string;
  initial: string;
  status: string;
  setStatus: (status: string) => void;
  saveProfile: (name: string, username: string, photo?: Blob) => Promise<void>;
}

export function usePerfilLocal(
  databaseReady: Promise<IDBDatabase | undefined>
): PerfilController {
  const [profile, setProfile] = useState<PerfilEstudiante>();
  const [previewPhoto, setPreviewPhoto] = useState<Blob>();
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [status, setStatus] = useState('Completa tu perfil. La cámara solo se activa cuando la solicitas.');
  const profileChannel = useRef<BroadcastChannel | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async (): Promise<void> => {
      try {
        const db = await databaseReady;
        if (!db) {
          if (mounted) setStatus('El perfil no está disponible porque IndexedDB no pudo abrirse.');
          return;
        }
        const savedProfile = await obtenerPerfil(db);
        if (savedProfile) {
          if (!mounted) return;
          setProfile(savedProfile);
          setPreviewPhoto(undefined);
          setStatus('Perfil cargado desde este dispositivo.');
          return;
        }

        const legacyPhoto = await obtenerUltimaFotoPerfil(db);
        if (!mounted) return;
        setPreviewPhoto(undefined);
        if (legacyPhoto) {
          setProfile({
            id: 'estudiante',
            nombre: '',
            nombreUsuario: '',
            foto: legacyPhoto,
            actualizadoEn: new Date().toISOString()
          });
          setStatus('Se recuperó la foto guardada anteriormente. Completa tu perfil para conservarla.');
        } else {
          setProfile(undefined);
        }
      } catch (error) {
        console.error('No se pudo cargar el perfil local:', error);
        if (mounted) setStatus('No se pudo cargar el perfil local.');
      }
    };

    void loadProfile();
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('centro-mando-profile');
      profileChannel.current = channel;
      channel.addEventListener('message', event => {
        if (event.data === 'profile-updated') void loadProfile();
      });
    }

    return () => {
      mounted = false;
      profileChannel.current?.close();
      profileChannel.current = undefined;
    };
  }, [databaseReady]);

  useEffect(() => {
    const photo = previewPhoto ?? profile?.foto;
    if (!photo) {
      setPhotoUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewPhoto, profile?.foto]);

  const saveProfile = useCallback(async (
    name: string,
    username: string,
    photo?: Blob
  ): Promise<void> => {
    const db = await databaseReady;
    if (!db) throw new Error('IndexedDB no está disponible.');
    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanName || !cleanUsername) {
      throw new Error('Completa el nombre y el nombre de usuario.');
    }

    const savedPhoto = photo ?? profile?.foto;
    const savedProfile = await guardarPerfilDb(db, {
      nombre: cleanName,
      nombreUsuario: cleanUsername,
      ...(savedPhoto ? { foto: savedPhoto } : {})
    });
    setProfile(savedProfile);
    setPreviewPhoto(undefined);
    profileChannel.current?.postMessage('profile-updated');
  }, [databaseReady, profile?.foto]);

  const displayName = profile?.nombre.trim() || 'Mi perfil';
  return {
    profile,
    photoUrl,
    setPreviewPhoto,
    displayName,
    initial: displayName.charAt(0).toLocaleUpperCase('es'),
    status,
    setStatus,
    saveProfile
  };
}
