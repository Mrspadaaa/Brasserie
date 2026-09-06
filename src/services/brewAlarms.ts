import { httpsCallable } from 'firebase/functions';
import { app, functions, auth } from './firebase';
import type { BrewAlarm } from '../domain/brewCompanion';

export const remoteAlarmsConfigured = () => !!import.meta.env.VITE_FIREBASE_VAPID_KEY;
let tokenPromise: Promise<string> | undefined;
async function deviceToken() {
  if (!auth.currentUser) throw new Error('Connecte-toi pour activer les alertes à distance.');
  if (!remoteAlarmsConfigured())
    throw new Error('Les alertes à distance ne sont pas encore activées sur ce serveur.');
  if (!('serviceWorker' in navigator) || !('Notification' in window))
    throw new Error('Ce navigateur ne propose pas les notifications.');
  if (Notification.permission !== 'granted')
    throw new Error('Autorise les notifications dans Chrome pour cet appareil.');
  if (!tokenPromise)
    tokenPromise = (async () => {
      const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
      if (!(await isSupported()))
        throw new Error('Notifications non prises en charge sur cet appareil.');
      const registration = await navigator.serviceWorker.register('/brew-alerts-sw.js');
      await navigator.serviceWorker.ready;
      return getToken(getMessaging(app), {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
    })().catch((e) => {
      tokenPromise = undefined;
      throw e;
    });
  return tokenPromise;
}
export async function enableBrewAlerts() {
  if (!remoteAlarmsConfigured())
    throw new Error('Les alertes à distance ne sont pas encore activées sur ce serveur.');
  if (!('Notification' in window))
    throw new Error('Notifications indisponibles dans ce navigateur.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error(
      'Notifications refusées. Tu peux les autoriser dans les réglages du site Chrome.'
    );
  await deviceToken();
}
export async function syncBrewAlerts(batchId: string, events: BrewAlarm[]) {
  const token = await deviceToken();
  const sync = httpsCallable(functions, 'syncBrewAlarms');
  await sync({
    batchId,
    token,
    events: events.map(({ id, at, title, body }) => ({ id, at, title, body }))
  });
}
