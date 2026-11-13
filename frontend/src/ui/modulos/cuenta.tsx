import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { autenticarCuenta, type CredencialesCuenta } from '../../features/auth';

interface DialogoCuentaProps {
  open: boolean;
  online: boolean;
  onClose: () => void;
}

export function DialogoCuenta({ open, online, onClose }: DialogoCuentaProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setStatus(online
        ? ''
        : 'No hay conexión para iniciar sesión. Puedes usar la app en modo local y conectarte después para autenticarte y sincronizar.');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const user = username.trim();
    if (!user || !password) {
      setStatus('Escribe tu usuario y contraseña.');
      return;
    }

    const credenciales: CredencialesCuenta = registerMode
      ? {
          modo: 'registro',
          username: user,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        }
      : { modo: 'inicio', username: user, password };

    setSubmitting(true);
    setStatus(registerMode ? 'Creando cuenta…' : 'Iniciando sesión…');
    try {
      await autenticarCuenta(credenciales);
      setPassword('');
      setStatus('Sesión iniciada. Tus cambios se sincronizarán automáticamente.');
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="auth-dialog"
      className="auth-dialog"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <form id="auth-form" className="delivery-form" onSubmit={submit}>
        <h2>Inicia sesión o crea tu cuenta</h2>
        <p>
          Usa tu cuenta para mantener tus materias, entregas y avances sincronizados entre dispositivos.
          Puedes seguir usando la app sin iniciar sesión.
        </p>
        <div className="form-group" hidden={!registerMode}>
          <label htmlFor="auth-first-name">
            Nombre <span className="required-mark" aria-hidden="true" hidden={!registerMode}>*</span>
          </label>
          <input
            id="auth-first-name"
            className="form-control"
            maxLength={100}
            autoComplete="given-name"
            placeholder="Ej. Camila"
            required={registerMode}
            value={firstName}
            onChange={event => setFirstName(event.currentTarget.value)}
          />
        </div>
        <div className="form-group" hidden={!registerMode}>
          <label htmlFor="auth-last-name">
            Apellido <span className="required-mark" aria-hidden="true" hidden={!registerMode}>*</span>
          </label>
          <input
            id="auth-last-name"
            className="form-control"
            maxLength={100}
            autoComplete="family-name"
            placeholder="Ej. Puin"
            required={registerMode}
            value={lastName}
            onChange={event => setLastName(event.currentTarget.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="auth-username">
            Usuario <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="auth-username"
            className="form-control"
            maxLength={50}
            autoComplete="username"
            required
            placeholder="Tu nombre de usuario"
            value={username}
            onChange={event => setUsername(event.currentTarget.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="auth-password">
            Contraseña <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="auth-password"
            className="form-control"
            type="password"
            minLength={8}
            maxLength={100}
            autoComplete={registerMode ? 'new-password' : 'current-password'}
            required
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={event => setPassword(event.currentTarget.value)}
          />
        </div>
        <p id="auth-status" className="device-status" role="status" aria-live="polite">{status}</p>
        <div className="profile-actions">
          <button className="btn btn-save" type="submit" disabled={submitting}>
            {registerMode ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
          <button
            id="auth-mode-toggle"
            className="btn btn-load"
            type="button"
            onClick={() => setRegisterMode(mode => !mode)}
          >
            {registerMode ? 'Ya tengo una cuenta' : 'Crear cuenta nueva'}
          </button>
          <button className="btn btn-load" type="button" onClick={onClose}>Cerrar</button>
        </div>
      </form>
    </dialog>
  );
}
