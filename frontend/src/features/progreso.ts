import {
  guardarMetas,
  listarEntregas,
  listarSesionesEstudio,
  obtenerMetas
} from '../utils/db';
import { apiRequest, isAuthenticated } from '../services/api';

interface ElementoResumen {
  etiqueta: string;
  valor: string;
}

interface WeeklySummaryReport {
  weekRange: string;
  totalMinutesStudied: number;
  tasksCompletedThisWeek: number;
  overallGpa: number;
  mostStudiedSubject: string;
  selfEvaluationFeedback: string;
  recommendation: string;
}

interface GamificationProfile {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  currentStreakDays: number;
  badges: Array<{ name: string; status: string }>;
}

export interface DatosProgreso {
  minutosMeta: number;
  promedioMeta: number;
  minutosEstudiados: number;
  porcentajeMeta: number;
  resumenSemanal: ElementoResumen[];
  resumenLogros: ElementoResumen[];
  errorSemanal?: string;
  errorLogros?: string;
}

function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function elemento(etiqueta: string, valor: string): ElementoResumen {
  return { etiqueta, valor };
}

export async function obtenerDatosProgreso(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosProgreso> {
  const db = await databaseReady;
  if (!db) throw new Error('Metas y progreso no disponibles: no se pudo abrir el almacenamiento local.');

  const [goals, sessions, deliveries] = await Promise.all([
    obtenerMetas(db),
    listarSesionesEstudio(db),
    listarEntregas(db)
  ]);
  const goalMinutes = goals?.minutosSemanales ?? 300;
  const goalAverage = goals?.promedioDeseado ?? 4;
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

  const graded = deliveries.filter(item =>
    item.calificacion !== undefined &&
    Number.isFinite(item.calificacion) &&
    (item.notaMaxima ?? 5) > 0
  );
  const average = graded.length
    ? graded.reduce((sum, item) =>
        sum + ((item.calificacion ?? 0) / (item.notaMaxima ?? 5)) * 5, 0
      ) / graded.length
    : undefined;

  let resumenSemanal = [
    elemento('Sesiones registradas', String(sessions.filter(session => new Date(session.inicio) >= weekStart).length)),
    elemento('Tiempo de estudio', `${Math.floor(studiedMinutes / 60)} h ${studiedMinutes % 60} min`),
    elemento('Evaluaciones calificadas', String(graded.length)),
    elemento('Promedio actual', average === undefined ? 'Sin calificaciones' : `${average.toFixed(2)} / 5`),
    elemento('Meta de promedio', `${goalAverage.toFixed(1)} / 5`)
  ];
  let errorSemanal: string | undefined;

  if (isAuthenticated() && navigator.onLine) {
    try {
      const report = await apiRequest<WeeklySummaryReport>('/statistics/weekly');
      resumenSemanal = [
        elemento('Semana', report.weekRange),
        elemento('Tiempo de estudio', `${Math.floor(report.totalMinutesStudied / 60)} h ${report.totalMinutesStudied % 60} min`),
        elemento('Entregas completadas', String(report.tasksCompletedThisWeek)),
        elemento('Promedio general', `${report.overallGpa.toFixed(2)} / 5`),
        elemento('Materia más estudiada', report.mostStudiedSubject || 'Sin datos'),
        elemento('Autoevaluación', report.selfEvaluationFeedback),
        elemento('Sugerencia', report.recommendation)
      ];
    } catch (error) {
      console.error('No se pudo cargar el resumen semanal del servidor:', error);
      errorSemanal = `No se pudo actualizar el resumen semanal: ${error instanceof Error ? error.message : 'inténtalo de nuevo.'}`;
    }
  }

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
  let resumenLogros = [
    elemento('Racha actual', `${streak} día${streak === 1 ? '' : 's'}`),
    elemento(`Nivel ${studyLevel}`, `${totalStudyMinutes} / ${nextLevelMinutes} min para el siguiente nivel`),
    elemento(
      'Logros obtenidos',
      earned.length ? earned.join(' · ') : 'Sigue registrando sesiones para desbloquear logros.'
    )
  ];
  let errorLogros: string | undefined;

  if (isAuthenticated() && navigator.onLine) {
    try {
      const profile = await apiRequest<GamificationProfile>('/gamification/profile');
      const badges = profile.badges
        .filter(badge => badge.status === 'UNLOCKED')
        .map(badge => badge.name);
      resumenLogros = [
        elemento('Racha actual', `${profile.currentStreakDays} día${profile.currentStreakDays === 1 ? '' : 's'}`),
        elemento(`Nivel ${profile.level}`, `${profile.currentLevelXp} / ${profile.xpForNextLevel} XP`),
        elemento(
          'Insignias desbloqueadas',
          badges.length ? badges.join(' · ') : 'Sigue registrando actividad para desbloquear insignias.'
        )
      ];
    } catch (error) {
      console.error('No se pudo cargar el perfil de gamificación del servidor:', error);
      errorLogros = 'No se pudo actualizar el resumen de logros.';
    }
  }

  return {
    minutosMeta: goalMinutes,
    promedioMeta: goalAverage,
    minutosEstudiados: studiedMinutes,
    porcentajeMeta: Math.min(100, Math.round(studiedMinutes / goalMinutes * 100)),
    resumenSemanal,
    resumenLogros,
    errorSemanal,
    errorLogros
  };
}

export async function guardarMetasProgreso(
  databaseReady: Promise<IDBDatabase | undefined>,
  minutosSemanales: number,
  promedioDeseado: number
): Promise<string> {
  if (!Number.isFinite(minutosSemanales) || minutosSemanales < 1 || minutosSemanales > 10080) {
    throw new Error('La meta semanal debe estar entre 1 y 10 080 minutos.');
  }
  if (!Number.isFinite(promedioDeseado) || promedioDeseado < 0 || promedioDeseado > 5) {
    throw new Error('El promedio deseado debe estar entre 0 y 5.');
  }

  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible.');
  await guardarMetas(db, { minutosSemanales, promedioDeseado, syncPending: true });

  if (isAuthenticated() && navigator.onLine) {
    try {
      await apiRequest('/statistics/goals', {
        method: 'PUT',
        body: JSON.stringify({
          targetWeeklyMinutes: minutosSemanales,
          targetAverageGrade: promedioDeseado
        })
      });
      await guardarMetas(db, { minutosSemanales, promedioDeseado, syncPending: false });
      return 'Metas guardadas.';
    } catch (error) {
      return `Metas guardadas. Se volverán a sincronizar automáticamente: ${error instanceof Error ? error.message : 'No se pudo completar la sincronización.'}`;
    }
  }

  return isAuthenticated()
    ? 'Metas guardadas. Se sincronizarán automáticamente cuando vuelva la conexión.'
    : 'Metas guardadas en este dispositivo.';
}
