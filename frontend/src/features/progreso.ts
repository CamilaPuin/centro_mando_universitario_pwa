import {
  guardarMetas,
  listarSesionesEstudio,
  obtenerMetas,
  describirErrorParaUsuario
} from '../utils/db';
import {
  ApiConnectionError,
  ApiResponseError,
  apiRequest,
  getCurrentUsername,
  isAuthenticated
} from '../services/api';

interface ElementoResumen {
  etiqueta: string;
  valor: string;
}

interface WeeklySummaryReport {
  weekRange: string;
  totalMinutesStudied: number;
  tasksCompletedThisWeek: number;
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

interface ResultadoConCache<T> {
  datos: T;
  desdeCache: boolean;
}

export interface DatosProgreso {
  minutosMeta: number;
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

function esResumenSemanal(value: unknown): value is WeeklySummaryReport {
  if (!value || typeof value !== 'object') return false;
  const report = value as Record<string, unknown>;
  return typeof report.weekRange === 'string' &&
    typeof report.totalMinutesStudied === 'number' &&
    Number.isFinite(report.totalMinutesStudied) &&
    typeof report.tasksCompletedThisWeek === 'number' &&
    Number.isFinite(report.tasksCompletedThisWeek) &&
    typeof report.mostStudiedSubject === 'string' &&
    typeof report.selfEvaluationFeedback === 'string' &&
    typeof report.recommendation === 'string';
}

function esPerfilGamificacion(value: unknown): value is GamificationProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.level === 'number' &&
    Number.isFinite(profile.level) &&
    typeof profile.currentLevelXp === 'number' &&
    Number.isFinite(profile.currentLevelXp) &&
    typeof profile.xpForNextLevel === 'number' &&
    Number.isFinite(profile.xpForNextLevel) &&
    typeof profile.currentStreakDays === 'number' &&
    Number.isFinite(profile.currentStreakDays) &&
    Array.isArray(profile.badges) &&
    profile.badges.every(badge =>
      badge !== null &&
      typeof badge === 'object' &&
      typeof badge.name === 'string' &&
      typeof badge.status === 'string'
    );
}

function leerCache<T>(clave: string, validar: (value: unknown) => value is T): T | undefined {
  try {
    const guardado = localStorage.getItem(clave);
    if (!guardado) return undefined;
    const datos: unknown = JSON.parse(guardado);
    if (validar(datos)) return datos;
    console.error(`El contenido de la caché de progreso "${clave}" no tiene un formato válido.`);
  } catch (error) {
    console.error(`No se pudo leer la caché de progreso "${clave}":`, error);
  }
  return undefined;
}

function guardarCache<T>(clave: string, datos: T): void {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (error) {
    console.error(`No se pudo guardar la caché de progreso "${clave}":`, error);
  }
}

async function obtenerConCache<T>(
  path: string,
  recurso: string,
  validar: (value: unknown) => value is T
): Promise<ResultadoConCache<T>> {
  const username = getCurrentUsername();
  if (!username) throw new Error('No se encontró la cuenta para consultar el progreso.');

  const clave = `centro-mando-progreso:${encodeURIComponent(username)}:${recurso}`;
  try {
    const datos = await apiRequest<T>(path);
    guardarCache(clave, datos);
    return { datos, desdeCache: false };
  } catch (error) {
    const puedeUsarCache = error instanceof ApiConnectionError ||
      (error instanceof ApiResponseError && error.status >= 500);
    const datosGuardados = puedeUsarCache ? leerCache(clave, validar) : undefined;
    if (datosGuardados) return { datos: datosGuardados, desdeCache: true };
    throw error;
  }
}

export async function obtenerDatosProgreso(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosProgreso> {
  const db = await databaseReady;
  if (!db) throw new Error('Metas y progreso no disponibles: no se pudo abrir el almacenamiento local.');

  const [goals, sessions] = await Promise.all([
    obtenerMetas(db),
    listarSesionesEstudio(db)
  ]);
  const goalMinutes = goals?.minutosSemanales ?? 300;
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

  let resumenSemanal = [
    elemento('Sesiones registradas', String(sessions.filter(session => new Date(session.inicio) >= weekStart).length)),
    elemento('Tiempo de estudio', `${Math.floor(studiedMinutes / 60)} h ${studiedMinutes % 60} min`)
  ];
  let errorSemanal: string | undefined;

  if (isAuthenticated()) {
    try {
      const resultado = await obtenerConCache(
        '/statistics/weekly',
        'resumen-semanal',
        esResumenSemanal
      );
      const report = resultado.datos;
      resumenSemanal = [
        elemento('Semana', report.weekRange),
        elemento('Tiempo de estudio', `${Math.floor(report.totalMinutesStudied / 60)} h ${report.totalMinutesStudied % 60} min`),
        elemento('Entregas completadas', String(report.tasksCompletedThisWeek)),
        elemento('Materia más estudiada', report.mostStudiedSubject || 'Sin datos'),
        elemento('Autoevaluación', report.selfEvaluationFeedback),
        elemento('Sugerencia', report.recommendation)
      ];
      if (resultado.desdeCache) {
        errorSemanal = 'No se pudo conectar con el servidor. Se muestra el último resumen semanal guardado.';
      }
    } catch (error) {
      console.error('No se pudo cargar el resumen semanal del servidor:', error);
      errorSemanal = `No se pudo actualizar el resumen semanal: ${describirErrorParaUsuario(error, 'Inténtalo de nuevo.')}`;
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
    ...(studiedMinutes >= 300 ? ['5 horas de estudio esta semana'] : [])
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

  if (isAuthenticated()) {
    try {
      const resultado = await obtenerConCache(
        '/gamification/profile',
        'perfil-gamificacion',
        esPerfilGamificacion
      );
      const profile = resultado.datos;
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
      if (resultado.desdeCache) {
        errorLogros = 'No se pudo conectar con el servidor. Se muestran los últimos logros guardados.';
      }
    } catch (error) {
      console.error('No se pudo cargar el perfil de gamificación del servidor:', error);
      errorLogros = `No se pudo actualizar el resumen de logros: ${describirErrorParaUsuario(error, 'Inténtalo de nuevo.')}`;
    }
  }

  return {
    minutosMeta: goalMinutes,
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
  minutosSemanales: number
): Promise<string> {
  if (!Number.isFinite(minutosSemanales) || minutosSemanales < 1 || minutosSemanales > 10080) {
    throw new Error('La meta semanal debe estar entre 1 y 10 080 minutos.');
  }
  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible.');
  await guardarMetas(db, { minutosSemanales, syncPending: true });

  if (isAuthenticated() && navigator.onLine) {
    try {
      await apiRequest('/statistics/goals', {
        method: 'PUT',
        body: JSON.stringify({
          targetWeeklyMinutes: minutosSemanales
        })
      });
      await guardarMetas(db, { minutosSemanales, syncPending: false });
      return 'Metas guardadas.';
    } catch (error) {
      return `Metas guardadas. Se volverán a sincronizar automáticamente: ${describirErrorParaUsuario(error, 'No se pudo completar la sincronización. Inténtalo de nuevo.')}`;
    }
  }

  return isAuthenticated()
    ? 'Metas guardadas. Se sincronizarán automáticamente cuando vuelva la conexión.'
    : 'Metas guardadas en este dispositivo.';
}
