import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  eliminarApunteLocalYSincronizar,
  guardarApunteLocalYSincronizar,
  obtenerDatosApuntes
} from '../../features/notas';
import type { ApunteMateria } from '../../utils/db';

interface ModuloNotasProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

export function ModuloNotas({
  activo,
  databaseReady
}: ModuloNotasProps): ReactElement {
  const [apuntes, setApuntes] = useState<ApunteMateria[]>([]);
  const [asignaturas, setAsignaturas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [idEditando, setIdEditando] = useState<number>();
  const [asignatura, setAsignatura] = useState('');
  const [contenido, setContenido] = useState('');
  const [estado, setEstado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number>();

  const actualizar = useCallback(async (): Promise<void> => {
    try {
      const datos = await obtenerDatosApuntes(databaseReady);
      setApuntes(datos.apuntes);
      setAsignaturas(datos.asignaturas);
    } catch (causa) {
      console.error('No se pudieron cargar los apuntes:', causa);
      setEstado('No se pudieron cargar los apuntes de este dispositivo.');
    } finally {
      setCargando(false);
    }
  }, [databaseReady]);

  useEffect(() => {
    void actualizar();
    window.addEventListener('asignaturas-actualizadas', actualizar);
    window.addEventListener('auth-changed', actualizar);
    return () => {
      window.removeEventListener('asignaturas-actualizadas', actualizar);
      window.removeEventListener('auth-changed', actualizar);
    };
  }, [actualizar]);

  const cancelarEdicion = (): void => {
    setIdEditando(undefined);
    setAsignatura('');
    setContenido('');
    setEstado('');
  };

  const editar = (apunte: ApunteMateria): void => {
    setIdEditando(apunte.id);
    setAsignatura(apunte.asignatura);
    setContenido(apunte.contenido);
    setEstado('');
    document.getElementById('note-content')?.focus();
  };

  const guardar = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardando(true);
    setEstado('');
    try {
      const mensaje = await guardarApunteLocalYSincronizar(databaseReady, {
        ...(idEditando === undefined ? {} : { id: idEditando }),
        asignatura,
        contenido
      });
      cancelarEdicion();
      setEstado(mensaje);
      await actualizar();
    } catch (causa) {
      console.error('No se pudo guardar el apunte:', causa);
      setEstado(causa instanceof Error ? causa.message : 'No se pudo guardar el apunte.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (apunte: ApunteMateria): Promise<void> => {
    if (apunte.id === undefined) return;
    setEliminandoId(apunte.id);
    setEstado('');
    try {
      await eliminarApunteLocalYSincronizar(databaseReady, apunte);
      setEstado('Apunte eliminado.');
      if (idEditando === apunte.id) cancelarEdicion();
      await actualizar();
    } catch (causa) {
      console.error('No se pudo eliminar el apunte:', causa);
      setEstado(causa instanceof Error ? causa.message : 'No se pudo eliminar el apunte.');
    } finally {
      setEliminandoId(undefined);
    }
  };

  return (
    <section id="tab-notas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="crypto-wrapper">
        <h2>Bitácora rápida por asignatura</h2>
        <p className="subtitle">Guarda recordatorios y apuntes breves junto a cada materia. Puedes editarlos después.</p>
        <form id="note-form" className="delivery-form" onSubmit={event => void guardar(event)}>
          <input id="note-id" type="hidden" value={idEditando ?? ''} readOnly />
          <div className="form-group">
            <label htmlFor="note-subject">Asignatura <span className="required-mark" aria-hidden="true">*</span></label>
            <select
              id="note-subject"
              className="form-control"
              required
              value={asignatura}
              onChange={event => setAsignatura(event.currentTarget.value)}
            >
              <option value="" disabled>Selecciona una asignatura</option>
              {asignaturas.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
              <option value="General">General</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="note-content">Apunte <span className="required-mark" aria-hidden="true">*</span></label>
            <textarea
              id="note-content"
              className="form-control"
              required
              maxLength={4000}
              placeholder="Ej. Repasar integración por partes antes del jueves."
              value={contenido}
              onChange={event => setContenido(event.currentTarget.value)}
            />
          </div>
          <div className="profile-actions">
            <button className="btn btn-save" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : idEditando === undefined ? 'Guardar apunte' : 'Guardar cambios'}
            </button>
            {idEditando !== undefined && (
              <button className="btn btn-load" type="button" onClick={cancelarEdicion}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
        <p id="note-status" className="device-status" role="status" aria-live="polite">{estado}</p>
        <div
          id="subject-notes-list"
          className="local-deliveries"
          aria-label="Apuntes guardados por asignatura"
          aria-busy={cargando}
        >
          {!cargando && apuntes.length === 0 && (
            <p className="dashboard-empty">Aún no tienes apuntes. Crea uno asociado a una asignatura.</p>
          )}
          {apuntes.map(apunte => (
            <article key={apunte.id} className="kanban-card local-delivery-card">
              <h3>{apunte.asignatura}</h3>
              <p className="note-content">{apunte.contenido}</p>
              <small>Actualizado: {new Date(apunte.actualizadoEn).toLocaleString()}</small>
              <div className="profile-actions">
                <button className="btn btn-load" type="button" onClick={() => editar(apunte)}>
                  Editar
                </button>
                <button
                  className="record-delete"
                  type="button"
                  disabled={eliminandoId === apunte.id}
                  onClick={() => void eliminar(apunte)}
                >
                  {eliminandoId === apunte.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
