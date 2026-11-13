import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import {
  eliminarAsignaturaMateria,
  eliminarClaseMateria,
  guardarAsignaturaMateria,
  guardarClaseMateria,
  obtenerDatosAsignaturas,
  type DatosAsignaturas
} from '../../features/asignaturas';
import type { Asignatura, ClaseHorario } from '../../utils/db';

interface ModuloAsignaturasProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ModuloAsignaturas({
  activo,
  databaseReady
}: ModuloAsignaturasProps): ReactElement {
  const [datos, setDatos] = useState<DatosAsignaturas>();
  const [nombreAsignatura, setNombreAsignatura] = useState('');
  const [asignaturaEditando, setAsignaturaEditando] = useState<number>();
  const [asignaturaClase, setAsignaturaClase] = useState('');
  const [diaSemana, setDiaSemana] = useState('1');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [aula, setAula] = useState('');
  const [claseEditando, setClaseEditando] = useState<number>();
  const [estadoAsignaturas, setEstadoAsignaturas] = useState('');
  const [estadoHorario, setEstadoHorario] = useState('');
  const cargaInicialDisparada = useRef(false);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosAsignaturas(databaseReady);
        if (!montado) return;
        setDatos(resultado);
        setEstadoAsignaturas(estado => estado === 'No se pudieron cargar las asignaturas.' ? '' : estado);
        setEstadoHorario(estado => estado === 'No se pudo cargar el horario.' ? '' : estado);
        if (!cargaInicialDisparada.current) {
          cargaInicialDisparada.current = true;
          window.dispatchEvent(new Event('asignaturas-actualizadas'));
        }
      } catch (causa) {
        console.error('No se pudieron cargar asignaturas y horario:', causa);
        if (montado) {
          setEstadoAsignaturas('No se pudieron cargar las asignaturas.');
          setEstadoHorario('No se pudo cargar el horario.');
        }
      }
    };

    void actualizar();
    window.addEventListener('asignaturas-actualizadas', actualizar);
    window.addEventListener('horario-actualizado', actualizar);
    return () => {
      montado = false;
      window.removeEventListener('asignaturas-actualizadas', actualizar);
      window.removeEventListener('horario-actualizado', actualizar);
    };
  }, [databaseReady]);

  const limpiarFormularioAsignatura = (): void => {
    setAsignaturaEditando(undefined);
    setNombreAsignatura('');
  };

  const limpiarFormularioClase = (): void => {
    setClaseEditando(undefined);
    setAsignaturaClase('');
    setDiaSemana('1');
    setHoraInicio('');
    setHoraFin('');
    setAula('');
  };

  const guardarAsignatura = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      const mensaje = await guardarAsignaturaMateria(
        databaseReady,
        nombreAsignatura,
        asignaturaEditando
      );
      limpiarFormularioAsignatura();
      setEstadoAsignaturas(mensaje);
      window.dispatchEvent(new Event('asignaturas-actualizadas'));
    } catch (causa) {
      console.error('No se pudo guardar la asignatura:', causa);
      setEstadoAsignaturas(causa instanceof DOMException && causa.name === 'ConstraintError'
        ? 'Ya existe una asignatura con ese nombre.'
        : causa instanceof Error
          ? causa.message
          : 'No se pudo guardar la asignatura.');
    }
  };

  const eliminarAsignatura = async (asignatura: Asignatura): Promise<void> => {
    try {
      const mensaje = await eliminarAsignaturaMateria(databaseReady, asignatura);
      setEstadoAsignaturas(mensaje);
      window.dispatchEvent(new Event('asignaturas-actualizadas'));
    } catch (causa) {
      setEstadoAsignaturas(causa instanceof Error ? causa.message : 'No se pudo eliminar la asignatura.');
    }
  };

  const guardarClase = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      const mensaje = await guardarClaseMateria(databaseReady, {
        ...(claseEditando === undefined ? {} : { id: claseEditando }),
        asignaturaId: Number(asignaturaClase),
        diaSemana: Number(diaSemana),
        horaInicio,
        horaFin,
        aula
      });
      limpiarFormularioClase();
      setEstadoHorario(mensaje);
      window.dispatchEvent(new Event('asignaturas-actualizadas'));
      window.dispatchEvent(new Event('horario-actualizado'));
    } catch (causa) {
      console.error('No se pudo guardar la clase:', causa);
      setEstadoHorario(causa instanceof Error ? causa.message : 'No se pudo guardar la clase.');
    }
  };

  const eliminarClase = async (clase: ClaseHorario): Promise<void> => {
    try {
      await eliminarClaseMateria(databaseReady, clase);
      setEstadoHorario('Clase eliminada del horario.');
      window.dispatchEvent(new Event('asignaturas-actualizadas'));
      window.dispatchEvent(new Event('horario-actualizado'));
    } catch (causa) {
      setEstadoHorario(causa instanceof Error ? causa.message : 'No se pudo eliminar la clase.');
    }
  };

  const editarAsignatura = (asignatura: Asignatura): void => {
    setAsignaturaEditando(asignatura.id);
    setNombreAsignatura(asignatura.nombre);
    document.getElementById('subject-name')?.focus();
  };

  const editarClase = (clase: ClaseHorario): void => {
    setClaseEditando(clase.id);
    setAsignaturaClase(String(clase.asignaturaId));
    setDiaSemana(String(clase.diaSemana));
    setHoraInicio(clase.horaInicio);
    setHoraFin(clase.horaFin);
    setAula(clase.aula);
    document.getElementById('class-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const nombres = new Map(datos?.asignaturas.map(asignatura => [asignatura.id, asignatura.nombre]));
  const clasesOrdenadas = [...(datos?.clases ?? [])].sort((a, b) =>
    a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)
  );
  const tieneAsignaturas = (datos?.asignaturas.length ?? 0) > 0;

  return (
    <section id="tab-asignaturas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">Mis asignaturas</h2>
          <p className="device-help">Administra tus materias y úsalas en horarios, apuntes y entregas.</p>
          <form id="subject-form" className="delivery-form" onSubmit={guardarAsignatura}>
            <input id="subject-id" type="hidden" value={asignaturaEditando ?? ''} readOnly />
            <div className="form-group">
              <label htmlFor="subject-name">
                Nombre de la asignatura <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
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
              <button className="btn btn-save" type="submit">
                {asignaturaEditando === undefined ? 'Agregar asignatura' : 'Guardar cambios'}
              </button>
              {asignaturaEditando !== undefined && (
                <button
                  id="subject-cancel-edit"
                  className="btn btn-load"
                  type="button"
                  onClick={limpiarFormularioAsignatura}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          <p id="subject-status" className="device-status" role="status" aria-live="polite">
            {estadoAsignaturas}
          </p>
          <div id="subject-list" className="local-deliveries" aria-label="Asignaturas registradas">
            {!datos
              ? <p className="dashboard-empty">{estadoAsignaturas || 'Cargando asignaturas…'}</p>
              : datos.asignaturas.length === 0
                ? <p className="dashboard-empty">Agrega tu primera asignatura para empezar a organizar el horario.</p>
                : datos.asignaturas.map((asignatura, indice) => (
                    <article
                      key={asignatura.id ?? `${asignatura.nombre}-${indice}`}
                      className="kanban-card local-delivery-card"
                    >
                      <h3>{asignatura.nombre}</h3>
                      <div className="profile-actions">
                        <button
                          className="btn btn-load"
                          type="button"
                          onClick={() => editarAsignatura(asignatura)}
                        >
                          Editar
                        </button>
                        <button
                          className="record-delete"
                          type="button"
                          onClick={() => void eliminarAsignatura(asignatura)}
                        >
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
          <form id="class-form" className="delivery-form" onSubmit={guardarClase}>
            <input id="class-id" type="hidden" value={claseEditando ?? ''} readOnly />
            <div className="form-group">
              <label htmlFor="class-subject">
                Asignatura <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="class-subject"
                className="form-control"
                required
                disabled={!tieneAsignaturas}
                value={asignaturaClase}
                onChange={event => setAsignaturaClase(event.currentTarget.value)}
              >
                {tieneAsignaturas
                  ? <>
                      <option value="" disabled>Selecciona una asignatura</option>
                      {datos?.asignaturas.map(asignatura => (
                        <option key={asignatura.id} value={String(asignatura.id)}>
                          {asignatura.nombre}
                        </option>
                      ))}
                    </>
                  : <option value="">Primero agrega una asignatura</option>}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="class-weekday">
                Día <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="class-weekday"
                className="form-control"
                required
                value={diaSemana}
                onChange={event => setDiaSemana(event.currentTarget.value)}
              >
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="class-start">
                Hora de inicio <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="class-start"
                className="form-control"
                type="time"
                required
                value={horaInicio}
                onChange={event => setHoraInicio(event.currentTarget.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="class-end">
                Hora de fin <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="class-end"
                className="form-control"
                type="time"
                required
                value={horaFin}
                onChange={event => setHoraFin(event.currentTarget.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="class-location">Aula o ubicación</label>
              <input
                id="class-location"
                className="form-control"
                maxLength={120}
                placeholder="Ej. Bloque 3, aula 204"
                value={aula}
                onChange={event => setAula(event.currentTarget.value)}
              />
            </div>
            <div className="profile-actions">
              <button id="class-submit" className="btn btn-save" type="submit" disabled={!tieneAsignaturas}>
                {claseEditando === undefined ? 'Agregar al horario' : 'Guardar cambios'}
              </button>
              {claseEditando !== undefined && (
                <button
                  id="class-cancel-edit"
                  className="btn btn-load"
                  type="button"
                  onClick={limpiarFormularioClase}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          <p id="class-status" className="device-status" role="status" aria-live="polite">
            {estadoHorario}
          </p>
          <div id="class-list" className="local-deliveries" aria-label="Clases programadas">
            {!datos
              ? <p className="dashboard-empty">{estadoHorario || 'Cargando horario…'}</p>
              : clasesOrdenadas.length === 0
                ? <p className="dashboard-empty">Aún no hay clases registradas en el horario semanal.</p>
                : clasesOrdenadas.map((clase, indice) => (
                    <article
                      key={clase.id ?? `${clase.asignaturaId}-${clase.diaSemana}-${clase.horaInicio}-${indice}`}
                      className="kanban-card local-delivery-card"
                    >
                      <h3>{nombres.get(clase.asignaturaId) ?? 'Asignatura eliminada'}</h3>
                      <p>
                        {DIAS[clase.diaSemana]} · {clase.horaInicio}–{clase.horaFin}
                        {clase.aula ? ` · ${clase.aula}` : ''}
                      </p>
                      <div className="profile-actions">
                        <button
                          className="btn btn-load"
                          type="button"
                          onClick={() => editarClase(clase)}
                        >
                          Editar
                        </button>
                        <button
                          className="record-delete"
                          type="button"
                          onClick={() => void eliminarClase(clase)}
                        >
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
