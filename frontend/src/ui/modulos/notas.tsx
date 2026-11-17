import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  eliminarApunteMateria,
  guardarApunteMateria,
  obtenerDatosApuntes,
  type DatosApuntes
} from '../../features/notas';
import type { ApunteMateria } from '../../utils/db';

interface ModuloNotasProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

export function ModuloNotas({ activo, databaseReady }: ModuloNotasProps): ReactElement {
  const [datos, setDatos] = useState<DatosApuntes>();
  const [asignatura, setAsignatura] = useState('');
  const [contenido, setContenido] = useState('');
  const [apunteEditando, setApunteEditando] = useState<number>();
  const [estado, setEstado] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosApuntes(databaseReady);
        if (montado) {
          setDatos(resultado);
          setEstado(estadoActual => estadoActual.startsWith('Los apuntes no están disponibles')
            ? ''
            : estadoActual);
        }
      } catch (causa) {
        console.error('No se pudieron cargar los apuntes:', causa);
        if (montado) {
          setEstado(causa instanceof Error
            ? causa.message
            : 'No se pudieron cargar los apuntes.');
        }
      }
    };
    const eventos = ['asignaturas-actualizadas', 'auth-changed'];

    void actualizar();
    eventos.forEach(nombre => window.addEventListener(nombre, actualizar));
    return () => {
      montado = false;
      eventos.forEach(nombre => window.removeEventListener(nombre, actualizar));
    };
  }, [databaseReady, recarga]);

  const limpiarFormulario = (): void => {
    setApunteEditando(undefined);
    setAsignatura('');
    setContenido('');
  };

  const guardar = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      const mensaje = await guardarApunteMateria(
        databaseReady,
        asignatura,
        contenido,
        apunteEditando
      );
      limpiarFormulario();
      setEstado(mensaje);
      setRecarga(actual => actual + 1);
    } catch (causa) {
      setEstado(causa instanceof Error ? causa.message : 'No se pudo guardar el apunte.');
    }
  };

  const editar = (apunte: ApunteMateria): void => {
    setApunteEditando(apunte.id);
    setAsignatura(apunte.asignatura);
    setContenido(apunte.contenido);
    document.getElementById('note-content')?.focus();
  };

  const eliminar = async (apunte: ApunteMateria): Promise<void> => {
    try {
      await eliminarApunteMateria(databaseReady, apunte);
      if (apunteEditando === apunte.id) limpiarFormulario();
      setEstado('Apunte eliminado.');
      setRecarga(actual => actual + 1);
    } catch (causa) {
      setEstado(causa instanceof Error ? causa.message : 'No se pudo eliminar el apunte.');
    }
  };

  return (
    <section id="tab-notas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="crypto-wrapper">
        <h2>Bitácora rápida por asignatura</h2>
        <p className="subtitle">Guarda recordatorios y apuntes breves junto a cada materia. Puedes editarlos después.</p>
        <form id="note-form" className="delivery-form" onSubmit={guardar}>
          <div className="form-group">
            <label htmlFor="note-subject">
              Asignatura <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="note-subject"
              className="form-control"
              required
              value={asignatura}
              onChange={event => setAsignatura(event.currentTarget.value)}
            >
              <option value="" disabled>Selecciona una asignatura</option>
              {datos?.asignaturas.map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
              <option value="General">General</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="note-content">
              Apunte <span className="required-mark" aria-hidden="true">*</span>
            </label>
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
            <button className="btn btn-save" type="submit">
              {apunteEditando === undefined ? 'Guardar apunte' : 'Guardar cambios'}
            </button>
            {apunteEditando !== undefined && (
              <button className="btn btn-load" type="button" onClick={limpiarFormulario}>
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
          aria-busy={!datos}
        >
          {!datos
            ? <p className="dashboard-empty">{estado || 'Cargando apuntes…'}</p>
            : datos.apuntes.length === 0
              ? <p className="dashboard-empty">Aún no tienes apuntes. Crea uno asociado a una asignatura.</p>
              : datos.apuntes.map((apunte, indice) => (
                  <article
                    key={apunte.id ?? `${apunte.asignatura}-${apunte.actualizadoEn}-${indice}`}
                    className="kanban-card local-delivery-card"
                  >
                    <h3>{apunte.asignatura}</h3>
                    <p className="note-content">{apunte.contenido}</p>
                    <small>Actualizado: {new Date(apunte.actualizadoEn).toLocaleString()}</small>
                    <div className="profile-actions">
                      <button
                        className="btn btn-load"
                        type="button"
                        onClick={() => editar(apunte)}
                      >
                        Editar
                      </button>
                      <button
                        className="record-delete"
                        type="button"
                        onClick={() => void eliminar(apunte)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
        </div>
      </div>
    </section>
  );
}
