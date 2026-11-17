import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import {
  EVENTO_ESTADO_SINCRONIZACION,
  EVENTO_SOLICITAR_SINCRONIZACION,
  guardarEntrega,
  obtenerDatosEntregas,
  obtenerExamenesProximos,
  type DatosEntregas,
  type FormularioEntrega
} from '../../features/entregas';
import type { EntregaAcademica } from '../../utils/db';

interface ModuloEntregasProps {
  activo: boolean;
  databaseReady: Promise<IDBDatabase | undefined>;
}

type EstadoEntrega = EntregaAcademica['estado'];

const COLUMNAS: Array<{ estado: EstadoEntrega; titulo: string; clase: string; contador: string }> = [
  { estado: 'pendiente', titulo: 'Pendiente', clase: 'dot-pending', contador: 'count-pending' },
  { estado: 'en-progreso', titulo: 'En progreso', clase: 'dot-progress', contador: 'count-progress' },
  { estado: 'entregada', titulo: 'Entregado', clase: 'dot-done', contador: 'count-done' }
];

export function ModuloEntregas({ activo, databaseReady }: ModuloEntregasProps): ReactElement {
  const [datos, setDatos] = useState<DatosEntregas>();
  const [idEditando, setIdEditando] = useState<number>();
  const [titulo, setTitulo] = useState('');
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState('');
  const [otraAsignatura, setOtraAsignatura] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [categoria, setCategoria] = useState('tarea');
  const [estadoEntrega, setEstadoEntrega] = useState('pendiente');
  const [calificacion, setCalificacion] = useState('');
  const [notaMaxima, setNotaMaxima] = useState('5');
  const [detalle, setDetalle] = useState('');
  const [estado, setEstado] = useState('');
  const cargaInicialDisparada = useRef(false);
  const inputOtraAsignatura = useRef<HTMLInputElement>(null);
  const enfocarOtraAsignatura = useRef(false);

  useEffect(() => {
    let montado = true;
    const actualizar = async (): Promise<void> => {
      try {
        const resultado = await obtenerDatosEntregas(databaseReady);
        if (!montado) return;
        setDatos(resultado);
        if (!cargaInicialDisparada.current) {
          cargaInicialDisparada.current = true;
          window.dispatchEvent(new Event('entregas-actualizadas'));
        }
      } catch (causa) {
        console.error('No se pudieron cargar las entregas locales:', causa);
        if (montado) setEstado('No se pudieron cargar las entregas guardadas en este dispositivo.');
      }
    };
    const actualizarEstadoSincronizacion = (event: Event): void => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') {
        setEstado(event.detail);
      }
    };

    void actualizar();
    window.addEventListener('entregas-actualizadas', actualizar);
    window.addEventListener('asignaturas-actualizadas', actualizar);
    window.addEventListener(EVENTO_ESTADO_SINCRONIZACION, actualizarEstadoSincronizacion);
    return () => {
      montado = false;
      window.removeEventListener('entregas-actualizadas', actualizar);
      window.removeEventListener('asignaturas-actualizadas', actualizar);
      window.removeEventListener(EVENTO_ESTADO_SINCRONIZACION, actualizarEstadoSincronizacion);
    };
  }, [databaseReady]);

  useEffect(() => {
    if (enfocarOtraAsignatura.current) {
      enfocarOtraAsignatura.current = false;
      inputOtraAsignatura.current?.focus();
    }
  }, [asignaturaSeleccionada]);

  const limpiarFormulario = (): void => {
    setIdEditando(undefined);
    setTitulo('');
    setAsignaturaSeleccionada('');
    setOtraAsignatura('');
    setFechaEntrega('');
    setPrioridad('media');
    setCategoria('tarea');
    setEstadoEntrega('pendiente');
    setCalificacion('');
    setNotaMaxima('5');
    setDetalle('');
  };

  const editarEntrega = (entrega: EntregaAcademica): void => {
    setIdEditando(entrega.id);
    setTitulo(entrega.titulo);
    const asignaturas = datos?.asignaturas.map(item => item.nombre) ?? [];
    if (asignaturas.includes(entrega.asignatura)) {
      setAsignaturaSeleccionada(entrega.asignatura);
      setOtraAsignatura('');
    } else {
      setAsignaturaSeleccionada('__otra__');
      setOtraAsignatura(entrega.asignatura);
    }
    setFechaEntrega(entrega.fechaEntrega);
    setPrioridad(entrega.prioridad ?? 'media');
    setEstadoEntrega(entrega.estado);
    setCategoria(entrega.categoria ?? 'tarea');
    setCalificacion(entrega.calificacion === undefined ? '' : String(entrega.calificacion));
    setNotaMaxima(String(entrega.notaMaxima ?? 5));
    setDetalle(entrega.detalle);
    document.getElementById('delivery-title-input')?.focus();
  };

  const guardar = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setEstado('Guardando entrega…');
    try {
      const resultado = await guardarEntrega(databaseReady, {
        ...(idEditando === undefined ? {} : { id: idEditando }),
        titulo,
        asignaturaSeleccionada,
        otraAsignatura,
        fechaEntrega,
        prioridad,
        categoria,
        estado: estadoEntrega,
        calificacion,
        notaMaxima,
        detalle
      } satisfies FormularioEntrega);
      limpiarFormulario();
      setEstado(resultado.mensaje);
      window.dispatchEvent(new Event('entregas-actualizadas'));
      if (resultado.nuevaAsignatura) {
        window.dispatchEvent(new Event('asignaturas-actualizadas'));
      }
      if (resultado.sincronizar) {
        window.dispatchEvent(new Event(EVENTO_SOLICITAR_SINCRONIZACION));
      }
    } catch (causa) {
      console.error('No se pudo guardar la entrega:', causa);
      setEstado(causa instanceof Error
        ? `No se pudo guardar la entrega: ${causa.message}`
        : 'No se pudo guardar la entrega.');
    }
  };

  const grupos: Record<EstadoEntrega, EntregaAcademica[]> = {
    pendiente: [],
    'en-progreso': [],
    entregada: []
  };
  for (const entrega of datos?.entregas ?? []) grupos[entrega.estado].push(entrega);
  const examenes = obtenerExamenesProximos(datos?.entregas ?? []);
  const mostrarOtraAsignatura = asignaturaSeleccionada === '__otra__';
  const cargando = datos === undefined;

  return (
    <section id="tab-entregas" className={activo ? 'tab-view active' : 'tab-view'}>
      <div className="dashboard-panel exam-week-panel">
        <h2 className="panel-title">Exámenes de la semana</h2>
        <p className="device-help">Evaluaciones con categoría “Examen” durante los próximos siete días.</p>
        <div id="exam-week-list" className="exam-week-list" aria-live="polite" aria-busy={cargando}>
          {cargando
            ? <p className="dashboard-empty">{estado || 'Cargando exámenes…'}</p>
            : examenes.length === 0
              ? <p className="dashboard-empty">No hay exámenes pendientes en los próximos siete días.</p>
              : examenes.map((examen, indice) => (
                  <article
                    key={examen.id ?? `${examen.titulo}-${examen.fechaEntrega}-${indice}`}
                    className="exam-week-item"
                  >
                    <strong>{examen.titulo}</strong>
                    <span>
                      {examen.asignatura} · {new Date(examen.fechaEntrega).toLocaleString('es', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </article>
                ))}
        </div>
      </div>
      <div className="dashboard-panel delivery-editor-panel">
        <h2 className="panel-title">Entrega o evaluación</h2>
        <p className="device-help">
          Los cambios se guardan automáticamente. Inicia sesión para verlos también en tus otros dispositivos.
        </p>
        <form id="delivery-form" className="delivery-form" onSubmit={guardar}>
          <input id="delivery-id" type="hidden" value={idEditando ?? ''} readOnly />
          <div className="form-group">
            <label htmlFor="delivery-title-input">
              Nombre <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="delivery-title-input"
              className="form-control"
              required
              maxLength={160}
              placeholder="Ej. Taller de límites"
              value={titulo}
              onChange={event => setTitulo(event.currentTarget.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-subject-input">
              Asignatura <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="delivery-subject-input"
              className="form-control"
              required
              value={asignaturaSeleccionada}
              onChange={event => {
                const valor = event.currentTarget.value;
                enfocarOtraAsignatura.current = valor === '__otra__';
                setAsignaturaSeleccionada(valor);
              }}
            >
              <option value="" disabled>Selecciona una asignatura</option>
              {datos?.asignaturas.map((asignatura, indice) => (
                <option key={asignatura.id ?? `${asignatura.nombre}-${indice}`} value={asignatura.nombre}>
                  {asignatura.nombre}
                </option>
              ))}
              <option value="__otra__">Otra asignatura…</option>
            </select>
            <input
              ref={inputOtraAsignatura}
              id="delivery-subject-custom"
              className="form-control"
              maxLength={120}
              placeholder="Escribe el nombre de la asignatura"
              aria-label="Nombre de otra asignatura"
              hidden={!mostrarOtraAsignatura}
              required={mostrarOtraAsignatura}
              value={otraAsignatura}
              onChange={event => setOtraAsignatura(event.currentTarget.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-date-input">Fecha y hora</label>
            <input
              id="delivery-date-input"
              className="form-control"
              type="datetime-local"
              value={fechaEntrega}
              onChange={event => setFechaEntrega(event.currentTarget.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-priority-input">
              Importancia <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="delivery-priority-input"
              className="form-control"
              required
              value={prioridad}
              onChange={event => setPrioridad(event.currentTarget.value)}
            >
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-category-input">
              Categoría <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="delivery-category-input"
              className="form-control"
              required
              value={categoria}
              onChange={event => setCategoria(event.currentTarget.value)}
            >
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-status-input">
              Estado <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="delivery-status-input"
              className="form-control"
              required
              value={estadoEntrega}
              onChange={event => setEstadoEntrega(event.currentTarget.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="entregada">Entregada</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delivery-grade-input">Calificación</label>
            <input
              id="delivery-grade-input"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 4,5"
              value={calificacion}
              onChange={event => setCalificacion(event.currentTarget.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-grade-max-input">
              Nota máxima <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="delivery-grade-max-input"
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={notaMaxima}
              onChange={event => setNotaMaxima(event.currentTarget.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-detail-input">Detalles</label>
            <textarea
              id="delivery-detail-input"
              className="form-control"
              maxLength={2000}
              placeholder="Agrega indicaciones, temas o materiales necesarios."
              value={detalle}
              onChange={event => setDetalle(event.currentTarget.value)}
            />
          </div>
          <div className="profile-actions">
            <button className="btn btn-save" type="submit">Guardar entrega</button>
            {idEditando !== undefined && (
              <button className="btn btn-load" type="button" onClick={limpiarFormulario}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
        <p id="delivery-sync-status" className="device-status" role="status" aria-live="polite">{estado}</p>
        <div
          id="local-deliveries"
          className="kanban-cards local-deliveries"
          aria-label="Entregas y evaluaciones registradas"
          aria-busy={cargando}
        >
          {cargando
            ? <p className="dashboard-empty">Cargando entregas…</p>
            : datos.entregas.length === 0
              ? <p className="dashboard-empty">Aún no tienes entregas registradas.</p>
              : datos.entregas.map((entrega, indice) => (
                  <article
                    key={entrega.id ?? `${entrega.titulo}-${entrega.asignatura}-${indice}`}
                    className="kanban-card local-delivery-card"
                  >
                    <h3>{entrega.titulo}</h3>
                    <p>
                      {entrega.asignatura} • {entrega.categoria ?? 'tarea'} •
                      {' '}{entrega.fechaEntrega ? new Date(entrega.fechaEntrega).toLocaleString() : 'Sin fecha'}
                      {entrega.calificacion === undefined
                        ? ''
                        : ` • ${entrega.calificacion}/${entrega.notaMaxima ?? 5}`}
                    </p>
                    <p>{entrega.detalle}</p>
                    <button className="btn btn-load" type="button" onClick={() => editarEntrega(entrega)}>
                      Editar
                    </button>
                  </article>
                ))}
        </div>
      </div>
      <div className="kanban-grid">
        {COLUMNAS.map(columna => (
          <div key={columna.estado} className="kanban-col">
            <div className="kanban-col-header">
              <div className="kanban-title">
                <span className={`kanban-dot ${columna.clase}`} />
                <span>{columna.titulo}</span>
              </div>
              <span className="panel-badge" id={columna.contador}>
                {grupos[columna.estado].length}
              </span>
            </div>
            <div className="kanban-cards" id={
              columna.estado === 'pendiente'
                ? 'col-pending'
                : columna.estado === 'en-progreso' ? 'col-progress' : 'col-done'
            }>
              {grupos[columna.estado].length === 0
                ? <p className="dashboard-empty">Sin registros en esta categoría.</p>
                : grupos[columna.estado].map((entrega, indice) => (
                    <article
                      key={entrega.id ?? `${entrega.titulo}-${entrega.asignatura}-${indice}`}
                      className={`kanban-card${columna.estado === 'entregada' ? ' delivered' : ''}`}
                    >
                      <h3>{entrega.titulo}</h3>
                      <p>
                        {entrega.asignatura}
                        {entrega.fechaEntrega ? ` · ${new Date(entrega.fechaEntrega).toLocaleString()}` : ''}
                      </p>
                      <p>
                        {entrega.categoria ?? 'tarea'} · Importancia: {entrega.prioridad ?? 'media'} ·
                        {' '}{entrega.calificacion === undefined
                          ? 'Sin calificación'
                          : `Calificación: ${entrega.calificacion} / ${entrega.notaMaxima ?? 5}`}
                      </p>
                      <button className="btn btn-load" type="button" onClick={() => editarEntrega(entrega)}>
                        Editar
                      </button>
                    </article>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
