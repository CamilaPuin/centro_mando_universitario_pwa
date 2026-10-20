import {
  eliminarApunte,
  guardarApunte,
  listarApuntes
} from '../utils/db';

export function inicializarNotas(databaseReady: Promise<IDBDatabase | undefined>): void {
  const form = document.getElementById('note-form') as HTMLFormElement | null;
  const idInput = document.getElementById('note-id') as HTMLInputElement | null;
  const subjectSelect = document.getElementById('note-subject') as HTMLSelectElement | null;
  const contentInput = document.getElementById('note-content') as HTMLTextAreaElement | null;
  const cancelButton = document.getElementById('note-cancel-edit') as HTMLButtonElement | null;
  const status = document.getElementById('note-status');
  const notesList = document.getElementById('subject-notes-list');
  if (!form || !idInput || !subjectSelect || !contentInput || !cancelButton || !status || !notesList) return;
  const noteForm = form;
  const noteIdInput = idInput;
  const noteSubjectSelect = subjectSelect;
  const noteContentInput = contentInput;
  const noteCancelButton = cancelButton;
  const noteStatus = status;
  const noteList = notesList;

  function resetForm(): void {
    noteForm.reset();
    noteIdInput.value = '';
    noteCancelButton.hidden = true;
    noteForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar apunte';
  }

  async function renderNotes(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      noteStatus.textContent = 'Los apuntes no están disponibles porque IndexedDB no pudo abrirse.';
      return;
    }
    const notes = (await listarApuntes(db)).sort((a, b) =>
      b.actualizadoEn.localeCompare(a.actualizadoEn)
    );
    noteList.replaceChildren();
    if (!notes.length) {
      noteList.append(Object.assign(document.createElement('p'), {
        className: 'dashboard-empty',
        textContent: 'Aún no tienes apuntes. Crea uno asociado a una asignatura.'
      }));
      return;
    }
    for (const note of notes) {
      const card = document.createElement('article');
      card.className = 'kanban-card local-delivery-card';
      const title = document.createElement('h3');
      title.textContent = note.asignatura;
      const body = document.createElement('p');
      body.className = 'note-content';
      body.textContent = note.contenido;
      const date = document.createElement('small');
      date.textContent = `Actualizado: ${new Date(note.actualizadoEn).toLocaleString()}`;
      const actions = document.createElement('div');
      actions.className = 'profile-actions';
      const edit = document.createElement('button');
      edit.className = 'btn btn-load';
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => {
        noteIdInput.value = String(note.id);
        noteSubjectSelect.value = note.asignatura;
        noteContentInput.value = note.contenido;
        noteCancelButton.hidden = false;
        noteForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar cambios';
        noteContentInput.focus();
      });
      const remove = document.createElement('button');
      remove.className = 'record-delete';
      remove.type = 'button';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => {
        void (async () => {
          try {
            const database = await databaseReady;
            if (!database || note.id === undefined) throw new Error('No se pudo acceder al apunte.');
            await eliminarApunte(database, note.id);
            noteStatus.textContent = 'Apunte eliminado.';
            await renderNotes();
          } catch (error) {
            noteStatus.textContent = error instanceof Error ? error.message : 'No se pudo eliminar el apunte.';
          }
        })();
      });
      actions.append(edit, remove);
      card.append(title, body, date, actions);
      noteList.append(card);
    }
  }

  noteForm.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      try {
        const db = await databaseReady;
        if (!db) throw new Error('IndexedDB no está disponible.');
        if (!noteSubjectSelect.value) throw new Error('Selecciona una asignatura.');
        const contenido = noteContentInput.value.trim();
        if (!contenido) throw new Error('Escribe el contenido del apunte.');
        const id = noteIdInput.value ? Number(noteIdInput.value) : undefined;
        const existing = id === undefined
          ? undefined
          : (await listarApuntes(db)).find(note => note.id === id);
        await guardarApunte(db, {
          ...(id === undefined ? {} : { id }),
          asignatura: noteSubjectSelect.value,
          contenido,
          ...(existing ? { creadoEn: existing.creadoEn } : {})
        });
        resetForm();
        noteStatus.textContent = 'Apunte guardado en este dispositivo.';
        await renderNotes();
      } catch (error) {
        noteStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar el apunte.';
      }
    })();
  });

  noteCancelButton.addEventListener('click', resetForm);
  window.addEventListener('asignaturas-actualizadas', () => {
    void renderNotes();
  });
  void renderNotes();
}
