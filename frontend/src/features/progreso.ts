import {
  guardarMetas,
  listarEntregas,
  listarSesionesEstudio,
  obtenerMetas
} from '../utils/db';

function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function renderItem(label: string, value: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'progress-summary-item';
  const name = document.createElement('span');
  name.textContent = label;
  const result = document.createElement('strong');
  result.textContent = value;
  item.append(name, result);
  return item;
}

export function inicializarProgreso(databaseReady: Promise<IDBDatabase | undefined>): void {
  const form = document.getElementById('goals-form') as HTMLFormElement | null;
  const minutesInput = document.getElementById('goal-study-minutes') as HTMLInputElement | null;
  const averageInput = document.getElementById('goal-average') as HTMLInputElement | null;
  const status = document.getElementById('goals-status');
  const progress = document.getElementById('weekly-progress');
  const weeklySummary = document.getElementById('weekly-summary');
  const gamification = document.getElementById('gamification-summary');
  if (!form || !minutesInput || !averageInput || !status || !progress || !weeklySummary || !gamification) return;
  const goalsForm = form;
  const weeklyMinutesInput = minutesInput;
  const desiredAverageInput = averageInput;
  const goalsStatus = status;
  const progressContainer = progress;
  const weeklySummaryContainer = weeklySummary;
  const gamificationContainer = gamification;

  async function update(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      goalsStatus.textContent = 'Metas y progreso no disponibles: no se pudo abrir el almacenamiento local.';
      return;
    }
    const [goals, sessions, deliveries] = await Promise.all([
      obtenerMetas(db),
      listarSesionesEstudio(db),
      listarEntregas(db)
    ]);
    const goalMinutes = goals?.minutosSemanales ?? 300;
    const goalAverage = goals?.promedioDeseado ?? 4;
    weeklyMinutesInput.value = String(goalMinutes);
    desiredAverageInput.value = String(goalAverage);

    const weekStart = mondayOf(new Date());
    const studySecondsThisWeek = sessions.reduce((total, session) => {
      const startedAt = new Date(session.inicio);
      return startedAt >= weekStart && Number.isFinite(session.duracionSegundos)
        ? total + session.duracionSegundos
        : total;
    }, 0);
    const studiedMinutes = Math.floor(studySecondsThisWeek / 60);
    const totalStudyMinutes = Math.floor(sessions.reduce((total, session) =>
      Number.isFinite(session.duracionSegundos) && session.duracionSegundos > 0
        ? total + session.duracionSegundos
        : total, 0) / 60);
    const studyLevel = Math.floor(totalStudyMinutes / 300) + 1;
    const nextLevelMinutes = studyLevel * 300;
    const studyProgress = Math.min(100, Math.round(studiedMinutes / goalMinutes * 100));
    progressContainer.replaceChildren();
    const progressText = renderItem('Estudio esta semana', `${studiedMinutes} / ${goalMinutes} min`);
    const bar = document.createElement('progress');
    bar.max = 100;
    bar.value = studyProgress;
    bar.setAttribute('aria-label', `Meta de estudio completada al ${studyProgress}%`);
    progressContainer.append(progressText, bar, Object.assign(document.createElement('p'), {
      className: 'device-help',
      textContent: `${studyProgress}% de la meta semanal`
    }));

    const graded = deliveries.filter(item =>
      item.calificacion !== undefined &&
      Number.isFinite(item.calificacion) &&
      (item.notaMaxima ?? 5) > 0
    );
    const average = graded.length
      ? graded.reduce((sum, item) => sum + (item.calificacion! / (item.notaMaxima ?? 5)) * 5, 0) / graded.length
      : undefined;
    weeklySummaryContainer.replaceChildren(
      renderItem('Sesiones registradas', String(sessions.filter(session => new Date(session.inicio) >= weekStart).length)),
      renderItem('Tiempo de estudio', `${Math.floor(studiedMinutes / 60)} h ${studiedMinutes % 60} min`),
      renderItem('Evaluaciones calificadas', String(graded.length)),
      renderItem('Promedio actual', average === undefined ? 'Sin calificaciones' : `${average.toFixed(2)} / 5`),
      renderItem('Meta de promedio', `${goalAverage.toFixed(1)} / 5`)
    );
    const studyDays = new Set(sessions
      .filter(session => session.duracionSegundos > 0)
      .map(session => new Date(session.inicio).toDateString()));
    let streak = 0;
    const day = new Date();
    if (!studyDays.has(day.toDateString())) day.setDate(day.getDate() - 1);
    while (studyDays.has(day.toDateString())) {
      streak++;
      day.setDate(day.getDate() - 1);
    }
    const earned = [
      ...(streak >= 3 ? ['Racha de 3 días'] : []),
      ...(streak >= 7 ? ['Racha de 7 días'] : []),
      ...(studiedMinutes >= 300 ? ['5 horas de estudio esta semana'] : []),
      ...(average !== undefined && average >= goalAverage ? ['Meta de promedio alcanzada'] : [])
    ];
    gamificationContainer.replaceChildren(
      renderItem('Racha actual', `${streak} día${streak === 1 ? '' : 's'}`),
      renderItem(`Nivel ${studyLevel}`, `${totalStudyMinutes} / ${nextLevelMinutes} min para el siguiente nivel`),
      renderItem('Logros obtenidos', earned.length ? earned.join(' · ') : 'Sigue registrando sesiones para desbloquear logros.')
    );
  }

  goalsForm.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      try {
        const db = await databaseReady;
        if (!db) throw new Error('IndexedDB no está disponible.');
        const minutosSemanales = Number(weeklyMinutesInput.value);
        const promedioDeseado = Number(desiredAverageInput.value);
        if (!Number.isFinite(minutosSemanales) || minutosSemanales < 1 || minutosSemanales > 10080) {
          throw new Error('La meta semanal debe estar entre 1 y 10 080 minutos.');
        }
        if (!Number.isFinite(promedioDeseado) || promedioDeseado < 0 || promedioDeseado > 5) {
          throw new Error('El promedio deseado debe estar entre 0 y 5.');
        }
        await guardarMetas(db, { minutosSemanales, promedioDeseado });
        goalsStatus.textContent = 'Metas semanales guardadas.';
        await update();
      } catch (error) {
        goalsStatus.textContent = error instanceof Error ? error.message : 'No se pudieron guardar las metas.';
      }
    })();
  });
  for (const eventName of ['sesion-estudio-guardada', 'entregas-actualizadas']) {
    window.addEventListener(eventName, () => void update());
  }
  void update().catch(error => {
    console.error('No se pudo calcular el progreso semanal:', error);
    goalsStatus.textContent = 'No se pudo cargar el progreso semanal.';
  });
}
