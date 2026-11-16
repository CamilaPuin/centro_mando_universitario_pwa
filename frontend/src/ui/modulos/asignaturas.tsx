import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import {
  eliminarAsignaturaLocalYSincronizar,
  eliminarClaseLocalYSincronizar,
  guardarAsignaturaLocalYSincronizar,
  guardarClaseLocalYSincronizar,
  notificarAsignaturasActualizadas,
  notificarHorarioActualizado,
  obtenerDatosAsignaturas
} from '../../features/asignaturas';
import type { Asignatura, ClaseHorario } from '../../utils/db';

interface ModuloAsignaturasProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

interface FormularioClase {
  asignaturaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const FORMULARIO_CLASE_VACIO: FormularioClase = {
  asignaturaId: '',
  diaSemana: '1',
  horaInicio: '',
  horaFin: '',
  aula: ''
};

function actualizarSelectoresDeOtrasPantallas(asignaturas: Asignatura[]): void {
  const selector = document.getElementById('pomo-materia-select');
  if (!(selector instanceof HTMLSelectElement)) return;

  const valorActual = selector.value;
  const opciones = asignaturas.map(item => new Option(item.nombre, item.nombre));
  selector.replaceChildren(...opciones);
  if (opciones.some(opcion => opcion.value === valorActual)) selector.value = valorActual;
  selector.dispatchEvent(new Event('change'));
}

function ordenarClases(clases: ClaseHorario[]): ClaseHorario[] {
  return [...clases].sort((a, b) =>
    a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)
  );
}

export function ModuloAsignaturas({
  activo,
  databaseReady
}: ModuloAsignaturasProps): ReactElement {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [clases, setClases] = useState<ClaseHorario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [nombreAsignatura, setNombreAsignatura] = useState('');
  const [asignaturaEditando, setAsignaturaEditando] = useState<number>();
  const [estadoAsignatura, setEstadoAsignatura] = useState('');
  const [guardandoAsignatura, setGuardandoAsignatura] = useState(false);
  const [formularioClase, setFormularioClase] = useState<FormularioClase>(FORMULARIO_CLASE_VACIO);
  const [claseEditando, setClaseEditando] = useState<number>();
  const [estadoClase, setEstadoClase] = useState('');
  const [guardandoClase, setGuardandoClase] = useState(false);
  const nombreRef = useRef<HTMLInputElement>(null);
  const formularioClaseRef = useRef<HTMLFormElement>(null);

  const actualizar = async (): Promise<void> => {
    try {
      const datos = await obtenerDatosAsignaturas(databaseReady);
      setAsignaturas(datos.asignaturas);
      setClases(datos.clases);
      setErrorCarga(false);
    } catch (causa) {
      console.error('No se pudieron cargar asignaturas y horario:', causa);
      setErrorCarga(true);
      setEstadoAsignatura('No se pudieron cargar las asignaturas.');
      setEstadoClase('No se pudo cargar el horario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let montado = true;
    const cargar = async (): Promise<void> => {
      try {
        const datos = await obtenerDatosAsignaturas(databaseReady);
        if (montado) {
          setAsignaturas(datos.asignaturas);
          setClases(datos.clases);
          setErrorCarga(false);
        }
      } catch (causa) {
        console.error('No se pudieron cargar asignaturas y horario:', causa);
        if (montado) {
          setErrorCarga(true);
          setEstadoAsignatura('No se pudieron cargar las asignaturas.');
          setEstadoClase('No se pudo cargar el horario.');
        }
      } finally {
        if (montado) setCargando(false);
      }
    };
    const recargar = (): void => { void cargar(); };
    void cargar();
    window.addEventListener('asignaturas-actualizadas', recargar);
    return () => {
      montado = false;
      window.removeEventListener('asignaturas-actualizadas', recargar);
    };
  }, [databaseReady]);

  useEffect(() => {
    actualizarSelectoresDeOtrasPantallas(asignaturas);
  }, [asignaturas]);

  const cancelarEdicionAsignatura = (): void => {
    setAsignaturaEditando(undefined);
    setNombreAsignatura('');
    setEstadoAsignatura('');
  };

  const cancelarEdicionClase = (): void => {
    setClaseEditando(undefined);
    setFormularioClase(FORMULARIO_CLASE_VACIO);
    setEstadoClase('');
  };

  const guardarAsignatura = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardandoAsignatura(true);
    setEstadoAsignatura('');
    try {
      const mensaje = await guardarAsignaturaLocalYSincronizar(databaseReady, {
        ...(asignaturaEditando === undefined ? {} : { id: asignaturaEditando }),
        nombre: nombreAsignatura
      });
      cancelarEdicionAsignatura();
      setEstadoAsignatura(mensaje);
      await actualizar();
      notificarAsignaturasActualizadas();
    } catch (causa) {
      console.error('No se pudo guardar la asignatura:', causa);
      setEstadoAsignatura(causa instanceof DOMException && causa.name === 'ConstraintError'
        ? 'Ya existe una asignatura con ese nombre.'
        : causa instanceof Error ? causa.message : 'No se pudo guardar la asignatura.');
    } finally {
      setGuardandoAsignatura(false);
    }
  };

  const eliminarAsignatura = async (asignatura: Asignatura): Promise<void> => {
    setEstadoAsignatura('');
    try {
      await eliminarAsignaturaLocalYSincronizar(databaseReady, asignatura);
      setEstadoAsignatura(`Se eliminó ${asignatura.nombre}.`);
      await actualizar();
      notificarAsignaturasActualizadas();
    } catch (causa) {
      setEstadoAsignatura(causa instanceof Error ? causa.message : 'No se pudo eliminar la asignatura.');
    }
  };

  const guardarClase = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardandoClase(true);
    setEstadoClase('');
    try {
      const mensaje = await guardarClaseLocalYSincronizar(databaseReady, {
        ...(claseEditando === undefined ? {} : { id: claseEditando }),
        asignaturaId: Number(formularioClase.asignaturaId),
        diaSemana: Number(formularioClase.diaSemana),
        horaInicio: formularioClase.horaInicio,
        horaFin: formularioClase.horaFin,
        aula: formularioClase.aula
      });
      cancelarEdicionClase();
      setEstadoClase(mensaje);
      await actualizar();
      notificarHorarioActualizado();
      notificarAsignaturasActualizadas();
    } catch (causa) {
      console.error('No se pudo guardar la clase:', causa);
      setEstadoClase(causa instanceof Error ? causa.message : 'No se pudo guardar la clase.');
    } finally {
      setGuardandoClase(false);
    }
  };

  const eliminarClase = async (clase: ClaseHorario): Promise<void> => {
    setEstadoClase('');
    try {
      await eliminarClaseLocalYSincronizar(databaseReady, clase);
      setEstadoClase('Clase eliminada del horario.');
      await actualizar();
      notificarHorarioActualizado();
      notificarAsignaturasActualizadas();
    } catch (causa) {
      setEstadoClase(causa instanceof Error ? causa.message : 'No se pudo eliminar la clase.');
    }
  };

  const clasesOrdenadas = ordenarClases(clases);
  const nombrePorAsignatura = new Map(asignaturas.map(asignatura => [asignatura.id, asignatura.nombre]));

  return (
    <section id="tab-asignaturas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">Mis asignaturas</h2>
          <p className="device-help">Administra tus materias y úsalas en horarios, apuntes y entregas.</p>
          <form id="subject-form" className="delivery-form" onSubmit={event => void guardarAsignatura(event)}>
            <div className="form-group">
              <label htmlFor="subject-name">Nombre de la asignatura <span className="required-mark" aria-hidden="true">*</span></label>
              <input
                ref={nombreRef}
                id="subject-name"
                className="form-control"
                required
                maxLength={120}
                placeholder="Ej. Cálculo I"
                value={nombreAsignatura}
                onChange={event => setNombreAsignatura(event.currentTarget.value)}
              />
            </div>
            <div className="profile-actions">
              <button className="btn btn-save" type="submit" disabled={guardandoAsignatura}>
                {guardandoAsignatura ? 'Guardando…' : asignaturaEditando === undefined ? 'Agregar asignatura' : 'Guardar cambios'}
              </button>
              {asignaturaEditando !== undefined && (
                <button className="btn btn-load" type="button" onClick={cancelarEdicionAsignatura}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          <p id="subject-status" className="device-status" role="status" aria-live="polite">{estadoAsignatura}</p>
          <div id="subject-list" className="local-deliveries" aria-label="Asignaturas registradas" aria-busy={cargando}>
            {cargando
              ? <p className="dashboard-empty">Cargando asignaturas…</p>
              : errorCarga && asignaturas.length === 0
                ? <p className="dashboard-empty">No se pudieron cargar las asignaturas.</p>
                : asignaturas.length === 0
                  ? <p className="dashboard-empty">Agrega tu primera asignatura para empezar a organizar el horario.</p>
                  : asignaturas.map(asignatura => (
                    <article key={asignatura.id} className="kanban-card local-delivery-card">
                      <h3>{asignatura.nombre}</h3>
                      <div className="profile-actions">
                        <button
                          className="btn btn-load"
                          type="button"
                          onClick={() => {
                            setAsignaturaEditando(asignatura.id);
                            setNombreAsignatura(asignatura.nombre);
                            setEstadoAsignatura('');
                            nombreRef.current?.focus();
                          }}
                        >
                          Editar
                        </button>
                        <button className="record-delete" type="button" onClick={() => void eliminarAsignatura(asignatura)}>
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <h2 className="panel-title">Horario semanal de clases</h2>
          <p className="device-help">Agrega sesiones recurrentes. No se permitirán cruces de horario el mismo día.</p>
          <form id="class-form" ref={formularioClaseRef} className="delivery-form" onSubmit={event => void guardarClase(event)}>
            <div className="form-group">
              <label htmlFor="class-subject">Asignatura <span className="required-mark" aria-hidden="true">*</span></label>
              <select
                id="class-subject"
                className="form-control"
                required
                disabled={asignaturas.length === 0}
                value={formularioClase.asignaturaId}
                onChange={event => {
                  const asignaturaId = event.currentTarget.value;
                  setFormularioClase(current => ({ ...current, asignaturaId }));
                }}
              >
                <option value="" disabled>
                  {asignaturas.length === 0 ? 'Primero agrega una asignatura' : 'Selecciona una asignatura'}
                </option>
                {asignaturas.map(asignatura => (
                  <option key={asignatura.id} value={asignatura.id}>{asignatura.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="class-weekday">Día <span className="required-mark" aria-hidden="true">*</span></label>
              <select
                id="class-weekday"
                className="form-control"
                required
                value={formularioClase.diaSemana}
                onChange={event => {
                  const diaSemana = event.currentTarget.value;
                  setFormularioClase(current => ({ ...current, diaSemana }));
                }}
              >
                {[1, 2, 3, 4, 5, 6, 0].map(dia => (
                  <option key={dia} value={dia}>{DIAS[dia]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="class-start">Hora de inicio <span className="required-mark" aria-hidden="true">*</span></label>
              <input
                id="class-start"
                className="form-control"
                type="time"
                required
                value={formularioClase.horaInicio}
                onChange={event => {
                  const horaInicio = event.currentTarget.value;
                  setFormularioClase(current => ({ ...current, horaInicio }));
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="class-end">Hora de fin <span className="required-mark" aria-hidden="true">*</span></label>
              <input
                id="class-end"
                className="form-control"
                type="time"
                required
                value={formularioClase.horaFin}
                onChange={event => {
                  const horaFin = event.currentTarget.value;
                  setFormularioClase(current => ({ ...current, horaFin }));
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="class-location">Aula o ubicación</label>
              <input
                id="class-location"
                className="form-control"
                maxLength={120}
                placeholder="Ej. RA303"
                value={formularioClase.aula}
                onChange={event => {
                  const aula = event.currentTarget.value;
                  setFormularioClase(current => ({ ...current, aula }));
                }}
              />
            </div>
            <div className="profile-actions">
              <button id="class-submit" className="btn btn-save" type="submit" disabled={guardandoClase || asignaturas.length === 0}>
                {guardandoClase ? 'Guardando…' : claseEditando === undefined ? 'Agregar al horario' : 'Guardar cambios'}
              </button>
              {claseEditando !== undefined && (
                <button className="btn btn-load" type="button" onClick={cancelarEdicionClase}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          <p id="class-status" className="device-status" role="status" aria-live="polite">{estadoClase}</p>
          <div id="class-list" className="local-deliveries" aria-label="Clases programadas" aria-busy={cargando}>
            {cargando
              ? <p className="dashboard-empty">Cargando horario…</p>
              : clasesOrdenadas.length === 0
                ? <p className="dashboard-empty">Aún no hay clases registradas en el horario semanal.</p>
                : clasesOrdenadas.map(clase => (
                  <article key={clase.id} className="kanban-card local-delivery-card">
                    <h3>{nombrePorAsignatura.get(clase.asignaturaId) ?? 'Asignatura eliminada'}</h3>
                    <p>
                      {DIAS[clase.diaSemana]} · {clase.horaInicio}–{clase.horaFin}
                      {clase.aula ? ` · ${clase.aula}` : ''}
                    </p>
                    <div className="profile-actions">
                      <button
                        className="btn btn-load"
                        type="button"
                        onClick={() => {
                          setClaseEditando(clase.id);
                          setFormularioClase({
                            asignaturaId: String(clase.asignaturaId),
                            diaSemana: String(clase.diaSemana),
                            horaInicio: clase.horaInicio,
                            horaFin: clase.horaFin,
                            aula: clase.aula
                          });
                          setEstadoClase('');
                          formularioClaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        Editar
                      </button>
                      <button className="record-delete" type="button" onClick={() => void eliminarClase(clase)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
