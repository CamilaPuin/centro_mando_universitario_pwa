import { API_BASE_URL, PUSH_PUBLIC_KEY } from '../config';
import {
  listarAsignaturas,
  listarClasesHorario,
  listarEntregas
} from '../utils/db';

interface PushManagerRegistration extends ServiceWorkerRegistration {
  pushManager: PushManager;
}

function clavePublicaABytes(clave: string): ArrayBuffer {
  const normalizada = clave.replace(/-/g, '+').replace(/_/g, '/');
  const rellena = normalizada.padEnd(Math.ceil(normalizada.length / 4) * 4, '=');
  const decodificados = atob(rellena);
  const buffer = new ArrayBuffer(decodificados.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < decodificados.length; index++) {
    bytes[index] = decodificados.charCodeAt(index);
  }
  return buffer;
}

const ENABLED_KEY = 'centro-mando-recordatorios-activos';
const SENT_REMINDERS_KEY = 'centro-mando-recordatorios-enviados';
let reminderTimer: number | undefined;
let reminderRun: (() => void) | undefined;

function readSentReminders(): Set<string> {
  try {
    if (!('localStorage' in window)) return new Set();
    const stored: unknown = JSON.parse(window.localStorage.getItem(SENT_REMINDERS_KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    console.warn('No se pudo leer el historial local de recordatorios.');
    return new Set();
  }
}

function storeSentReminders(sent: Set<string>): void {
  try {
    if ('localStorage' in window) {
      window.localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify([...sent].slice(-300)));
    }
  } catch (error) {
    console.warn('El navegador no permitió guardar el historial de recordatorios:', error);
  }
}

async function sendReminder(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    new Notification(title, { body, tag });
    return;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification(title, {
      body,
      tag,
      data: { url: registration.scope }
    });
  } else {
    new Notification(title, { body, tag });
  }
}

async function revisarRecordatorios(
  databaseReady: Promise<IDBDatabase | undefined>,
  sent: Set<string>
): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const db = await databaseReady;
  if (!db) return;
  const [deliveries, classes, subjects] = await Promise.all([
    listarEntregas(db),
    listarClasesHorario(db),
    listarAsignaturas(db)
  ]);
  const now = new Date();
  const subjectNames = new Map(subjects.map(subject => [subject.id, subject.nombre]));
  for (const delivery of deliveries) {
    if (delivery.estado === 'entregada' || !delivery.fechaEntrega) continue;
    const dueAt = new Date(delivery.fechaEntrega);
    const hoursLeft = (dueAt.getTime() - now.getTime()) / 3_600_000;
    if (Number.isNaN(dueAt.getTime()) || hoursLeft < 0 || hoursLeft > 24) continue;
    const key = `delivery:${delivery.id}:${delivery.fechaEntrega}`;
    if (sent.has(key)) continue;
    const exam = delivery.categoria === 'examen';
    await sendReminder(
      exam ? 'Recordatorio de examen' : 'Próxima entrega',
      `${delivery.titulo} · ${delivery.asignatura} · ${dueAt.toLocaleString('es')}`,
      key
    );
    sent.add(key);
    storeSentReminders(sent);
  }

  const minute = now.getHours() * 60 + now.getMinutes();
  for (const classItem of classes) {
    if (classItem.diaSemana !== now.getDay()) continue;
    const [hour, minutes] = classItem.horaInicio.split(':').map(Number);
    const startMinute = hour * 60 + minutes;
    const minutesLeft = startMinute - minute;
    if (minutesLeft < 0 || minutesLeft > 30) continue;
    const key = `class:${classItem.id}:${now.toDateString()}`;
    if (sent.has(key)) continue;
    await sendReminder(
      'Próxima clase',
      `${subjectNames.get(classItem.asignaturaId) ?? 'Clase'} comienza a las ${classItem.horaInicio}${classItem.aula ? ` · ${classItem.aula}` : ''}.`,
      key
    );
    sent.add(key);
    storeSentReminders(sent);
  }
}

function activateAcademicReminders(
  databaseReady: Promise<IDBDatabase | undefined>,
  status: HTMLElement
): void {
  if (reminderTimer !== undefined) window.clearInterval(reminderTimer);
  const sent = readSentReminders();
  const run = (): void => {
    void revisarRecordatorios(databaseReady, sent).catch(error => {
      console.error('No se pudieron revisar los próximos recordatorios:', error);
      status.textContent = 'El permiso está activo, pero no se pudieron revisar las fechas académicas locales.';
    });
  };
  if (reminderRun) {
    window.removeEventListener('entregas-actualizadas', reminderRun);
    window.removeEventListener('horario-actualizado', reminderRun);
  }
  reminderRun = run;
  run();
  reminderTimer = window.setInterval(run, 60_000);
  try {
    if ('localStorage' in window) window.localStorage.setItem(ENABLED_KEY, 'true');
  } catch (error) {
    console.warn('No se pudo recordar la preferencia de recordatorios:', error);
  }
  window.addEventListener('entregas-actualizadas', run);
  window.addEventListener('horario-actualizado', run);
}

async function habilitarNotificaciones(status: HTMLElement): Promise<void> {
  if (!('Notification' in window)) {
    status.textContent = 'Este navegador no admite notificaciones del sistema.';
    return;
  }

  if (!window.isSecureContext) {
    status.textContent = 'Las notificaciones requieren un contexto seguro (HTTPS).';
    return;
  }

  let permiso: NotificationPermission;
  try {
    permiso = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
  } catch (error) {
    console.error('No se pudo solicitar permiso para notificaciones:', error);
    status.textContent = 'No se pudo solicitar el permiso de notificaciones.';
    return;
  }
  if (permiso !== 'granted') {
    status.textContent = 'Permiso de notificaciones no concedido. Puedes cambiarlo desde la configuración del navegador.';
    return;
  }

  try {
    const registration = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistration()
      : undefined;
    if (registration) {
      await registration.showNotification('Recordatorios académicos activados', {
        body: 'Gracias por aceptar el permiso de notificaciones, avisaremos sobre entregas en las próximas 24 horas, exámenes y clases próximas.',
        tag: 'recordatorios-activados',
        data: { url: registration.scope }
      });
    } else {
      new Notification('Recordatorios académicos activados', {
        body: 'Avisaremos sobre entregas en las próximas 24 horas, exámenes y clases próximas.'
      });
    }

    if (!('PushManager' in window) || !registration) {
      status.textContent = 'Notificaciones locales activadas. Push requiere soporte de Push y un service worker registrado.';
      return;
    }

    const workerRegistration = registration as PushManagerRegistration;
    const clavePublica = PUSH_PUBLIC_KEY;
    if (!clavePublica) {
      status.textContent = 'Recordatorios locales activados. Push remoto necesita la clave pública y el endpoint de suscripción de tu backend.';
      return;
    }

    const subscription = await workerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: clavePublicaABytes(clavePublica)
    });
    const response = await fetch(`${API_BASE_URL}/suscribir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) {
      throw new Error(`No se pudo guardar la suscripción Push (HTTP ${response.status}).`);
    }
    status.textContent = 'Recordatorios académicos locales y Push activados.';
  } catch (error) {
    console.error('No se pudieron activar las notificaciones Push:', error);
    status.textContent = error instanceof Error
      ? `Notificación local activada; Push no disponible: ${error.message}`
      : 'Notificación local activada; no se pudo completar la suscripción Push.';
  }
}

export function inicializarNotificaciones(databaseReady: Promise<IDBDatabase | undefined>): void {
  const button = document.getElementById('btn-enable-notifications') as HTMLButtonElement | null;
  const status = document.getElementById('notification-status');
  if (!button || !status) return;

  button.addEventListener('click', () => {
    void habilitarNotificaciones(status).then(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        activateAcademicReminders(databaseReady, status);
      }
    });
  });
  try {
    if (
      'localStorage' in window &&
      window.localStorage.getItem(ENABLED_KEY) === 'true' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      activateAcademicReminders(databaseReady, status);
      status.textContent = 'Recordatorios académicos activos en este dispositivo.';
    }
  } catch (error) {
    console.warn('No se pudo restaurar la preferencia de recordatorios:', error);
  }
}
