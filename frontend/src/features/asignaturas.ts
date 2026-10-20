import {
  eliminarAsignatura,
  eliminarClaseHorario,
  guardarAsignatura,
  guardarClaseHorario,
  listarAsignaturas,
  listarClasesHorario,
  type Asignatura,
  type ClaseHorario
} from '../utils/db';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function crearBoton(texto: string, clase: string, accion: () => void): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.className = clase;
  boton.type = 'button';
  boton.textContent = texto;
  boton.addEventListener('click', accion);
  return boton;
}

export function inicializarAsignaturas(databaseReady: Promise<IDBDatabase | undefined>): void {
  const subjectForm = document.getElementById('subject-form') as HTMLFormElement | null;
  const subjectId = document.getElementById('subject-id') as HTMLInputElement | null;
  const subjectName = document.getElementById('subject-name') as HTMLInputElement | null;
  const subjectCancel = document.getElementById('subject-cancel-edit') as HTMLButtonElement | null;
  const subjectStatus = document.getElementById('subject-status');
  const subjectList = document.getElementById('subject-list');
  const classForm = document.getElementById('class-form') as HTMLFormElement | null;
  const classId = document.getElementById('class-id') as HTMLInputElement | null;
  const classSubject = document.getElementById('class-subject') as HTMLSelectElement | null;
  const classWeekday = document.getElementById('class-weekday') as HTMLSelectElement | null;
  const classStart = document.getElementById('class-start') as HTMLInputElement | null;
  const classEnd = document.getElementById('class-end') as HTMLInputElement | null;
  const classLocation = document.getElementById('class-location') as HTMLInputElement | null;
  const classSubmit = document.getElementById('class-submit') as HTMLButtonElement | null;
  const classCancel = document.getElementById('class-cancel-edit') as HTMLButtonElement | null;
  const classStatus = document.getElementById('class-status');
  const classList = document.getElementById('class-list');

  if (!subjectForm || !subjectId || !subjectName || !subjectCancel || !subjectStatus ||
      !subjectList || !classForm || !classId || !classSubject || !classWeekday ||
      !classStart || !classEnd || !classLocation || !classSubmit || !classCancel ||
      !classStatus || !classList) return;

  const formSubject = subjectForm;
  const inputSubjectId = subjectId;
  const inputSubjectName = subjectName;
  const subjectEditCancel = subjectCancel;
  const subjectFeedback = subjectStatus;
  const subjectsContainer = subjectList;
  const formClass = classForm;
  const inputClassId = classId;
  const selectClassSubject = classSubject;
  const selectClassWeekday = classWeekday;
  const inputClassStart = classStart;
  const inputClassEnd = classEnd;
  const inputClassLocation = classLocation;
  const classSubmitButton = classSubmit;
  const classEditCancel = classCancel;
  const classFeedback = classStatus;
  const classesContainer = classList;

  function resetSubjectForm(): void {
    formSubject.reset();
    inputSubjectId.value = '';
    subjectEditCancel.hidden = true;
    formSubject.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Agregar asignatura';
  }

  function resetClassForm(): void {
    formClass.reset();
    inputClassId.value = '';
    classEditCancel.hidden = true;
    classSubmitButton.textContent = 'Agregar al horario';
  }

  function llenarSelectAsignaturas(asignaturas: Asignatura[]): void {
    const selectedId = selectClassSubject.value;
    selectClassSubject.replaceChildren();
    if (asignaturas.length === 0) {
      const option = new Option('Primero agrega una asignatura', '');
      selectClassSubject.add(option);
      selectClassSubject.disabled = true;
      classSubmitButton.disabled = true;
    } else {
      selectClassSubject.disabled = false;
      classSubmitButton.disabled = false;
      for (const asignatura of asignaturas) {
        selectClassSubject.add(new Option(asignatura.nombre, String(asignatura.id)));
      }
      if (asignaturas.some(asignatura => String(asignatura.id) === selectedId)) {
        selectClassSubject.value = selectedId;
      }
    }

    for (const selectorId of ['pomo-materia-select', 'note-subject']) {
      const selector = document.getElementById(selectorId) as HTMLSelectElement | null;
      if (!selector) continue;
      const valorActual = selector.value;
      selector.replaceChildren();
      if (selectorId === 'note-subject') {
        const placeholder = new Option('Selecciona una asignatura', '', true, true);
        placeholder.disabled = true;
        selector.add(placeholder);
      }
      for (const asignatura of asignaturas) {
        selector.add(new Option(asignatura.nombre, asignatura.nombre));
      }
      if (selectorId === 'note-subject') {
        selector.add(new Option('General', 'General'));
      }
      if ([...selector.options].some(option => option.value === valorActual)) {
        selector.value = valorActual;
      }
      if (selectorId === 'pomo-materia-select') {
        selector.dispatchEvent(new Event('change'));
      }
    }
  }

  function renderizarAsignaturas(asignaturas: Asignatura[]): void {
    llenarSelectAsignaturas(asignaturas);
    subjectsContainer.replaceChildren();
    if (asignaturas.length === 0) {
      subjectsContainer.append(Object.assign(document.createElement('p'), {
        className: 'dashboard-empty',
        textContent: 'Agrega tu primera asignatura para empezar a organizar el horario.'
      }));
      return;
    }

    for (const asignatura of asignaturas) {
      const card = document.createElement('article');
      card.className = 'kanban-card local-delivery-card';
      const title = document.createElement('h3');
      title.textContent = asignatura.nombre;
      const actions = document.createElement('div');
      actions.className = 'profile-actions';
      actions.append(
        crearBoton('Editar', 'btn btn-load', () => {
          inputSubjectId.value = String(asignatura.id);
          inputSubjectName.value = asignatura.nombre;
          formSubject.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar cambios';
          subjectEditCancel.hidden = false;
          inputSubjectName.focus();
        }),
        crearBoton('Eliminar', 'record-delete', () => {
          void (async () => {
            try {
              const db = await databaseReady;
              if (!db || asignatura.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
              await eliminarAsignatura(db, asignatura.id);
              subjectFeedback.textContent = `Se eliminó ${asignatura.nombre}.`;
              await actualizar();
            } catch (error) {
              subjectFeedback.textContent = error instanceof Error
                ? error.message
                : 'No se pudo eliminar la asignatura.';
            }
          })();
        })
      );
      card.append(title, actions);
      subjectsContainer.append(card);
    }
  }

  function renderizarClases(clases: ClaseHorario[], asignaturas: Asignatura[]): void {
    classesContainer.replaceChildren();
    if (clases.length === 0) {
      classesContainer.append(Object.assign(document.createElement('p'), {
        className: 'dashboard-empty',
        textContent: 'Aún no hay clases registradas en el horario semanal.'
      }));
      return;
    }

    const nombres = new Map(asignaturas.map(asignatura => [asignatura.id, asignatura.nombre]));
    const ordenadas = [...clases].sort((a, b) =>
      a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)
    );
    for (const clase of ordenadas) {
      const card = document.createElement('article');
      card.className = 'kanban-card local-delivery-card';
      const title = document.createElement('h3');
      title.textContent = nombres.get(clase.asignaturaId) ?? 'Asignatura eliminada';
      const detail = document.createElement('p');
      detail.textContent = `${DIAS[clase.diaSemana]} · ${clase.horaInicio}–${clase.horaFin}${clase.aula ? ` · ${clase.aula}` : ''}`;
      const actions = document.createElement('div');
      actions.className = 'profile-actions';
      actions.append(
        crearBoton('Editar', 'btn btn-load', () => {
          inputClassId.value = String(clase.id);
          selectClassSubject.value = String(clase.asignaturaId);
          selectClassWeekday.value = String(clase.diaSemana);
          inputClassStart.value = clase.horaInicio;
          inputClassEnd.value = clase.horaFin;
          inputClassLocation.value = clase.aula;
          classSubmitButton.textContent = 'Guardar cambios';
          classEditCancel.hidden = false;
          formClass.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }),
        crearBoton('Eliminar', 'record-delete', () => {
          void (async () => {
            try {
              const db = await databaseReady;
              if (!db || clase.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
              await eliminarClaseHorario(db, clase.id);
              classFeedback.textContent = 'Clase eliminada del horario.';
              await actualizar();
              window.dispatchEvent(new Event('horario-actualizado'));
            } catch (error) {
              classFeedback.textContent = error instanceof Error
                ? error.message
                : 'No se pudo eliminar la clase.';
            }
          })();
        })
      );
      card.append(title, detail, actions);
      classesContainer.append(card);
    }
  }

  async function actualizar(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      subjectFeedback.textContent = 'El almacenamiento local no está disponible.';
      classFeedback.textContent = 'No se pudo cargar el horario local.';
      return;
    }
    const [asignaturas, clases] = await Promise.all([
      listarAsignaturas(db),
      listarClasesHorario(db)
    ]);
    renderizarAsignaturas(asignaturas);
    renderizarClases(clases, asignaturas);
    window.dispatchEvent(new Event('asignaturas-actualizadas'));
  }

  formSubject.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const db = await databaseReady;
      if (!db) throw new Error('IndexedDB no está disponible.');
      const nombre = inputSubjectName.value.trim();
      if (!nombre) throw new Error('Escribe el nombre de la asignatura.');
      await guardarAsignatura(db, {
        ...(inputSubjectId.value ? { id: Number(inputSubjectId.value) } : {}),
        nombre
      });
      resetSubjectForm();
      subjectFeedback.textContent = 'Asignatura guardada correctamente.';
      await actualizar();
    } catch (error) {
      console.error('No se pudo guardar la asignatura:', error);
      subjectFeedback.textContent = error instanceof DOMException && error.name === 'ConstraintError'
        ? 'Ya existe una asignatura con ese nombre.'
        : error instanceof Error
          ? error.message
          : 'No se pudo guardar la asignatura.';
    }
  });

  subjectEditCancel.addEventListener('click', resetSubjectForm);
  classEditCancel.addEventListener('click', resetClassForm);

  formClass.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const db = await databaseReady;
      if (!db) throw new Error('IndexedDB no está disponible.');
      const diaSemana = Number(selectClassWeekday.value);
      const horaInicio = inputClassStart.value;
      const horaFin = inputClassEnd.value;
      const asignaturaId = Number(selectClassSubject.value);
      if (!Number.isInteger(asignaturaId)) throw new Error('Selecciona una asignatura.');
      if (!horaInicio || !horaFin || horaInicio >= horaFin) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
      }
      const clases = await listarClasesHorario(db);
      const idActual = inputClassId.value ? Number(inputClassId.value) : undefined;
      const cruza = clases.some(clase =>
        clase.id !== idActual &&
        clase.diaSemana === diaSemana &&
        horaInicio < clase.horaFin &&
        horaFin > clase.horaInicio
      );
      if (cruza) throw new Error('Ese horario se cruza con otra clase del mismo día.');

      await guardarClaseHorario(db, {
        ...(idActual === undefined ? {} : { id: idActual }),
        asignaturaId,
        diaSemana,
        horaInicio,
        horaFin,
        aula: inputClassLocation.value.trim()
      });
      resetClassForm();
      classFeedback.textContent = 'Horario guardado correctamente.';
      await actualizar();
      window.dispatchEvent(new Event('horario-actualizado'));
    } catch (error) {
      console.error('No se pudo guardar la clase:', error);
      classFeedback.textContent = error instanceof Error
        ? error.message
        : 'No se pudo guardar la clase.';
    }
  });

  void actualizar().catch(error => {
    console.error('No se pudieron cargar asignaturas y horario:', error);
    subjectFeedback.textContent = 'No se pudieron cargar las asignaturas.';
    classFeedback.textContent = 'No se pudo cargar el horario.';
  });
}
