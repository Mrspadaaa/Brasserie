import { httpsCallable } from 'firebase/functions';
import { functions, auth } from './firebase';
import type { BrewAlarm } from '../domain/brewCompanion';

/** Public key comes from the authenticated backend, independent of build-time flags. */
export const remoteAlarmsConfigured = () => true;
let subscriptionPromise: Promise<PushSubscription> | undefined;
export async function deviceSubscription() {
  if (!auth.currentUser) throw new Error('Connecte-toi pour activer les alertes.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    throw new Error('Ce navigateur ne propose pas les notifications push.');
  if (Notification.permission !== 'granted')
    throw new Error('Autorise les notifications dans les réglages du site.');
  if (!subscriptionPromise)
    subscriptionPromise = (async () => {
      const res = await httpsCallable<unknown, { publicKey: string }>(
        functions,
        'getBrewAlertConfig'
      )({});
      const base64 = res.data.publicKey.replace(/-/g, '+').replace(/_/g, '/');
      const key = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const registration = await navigator.serviceWorker.register('/brew-alerts-sw.js');
      await navigator.serviceWorker.ready;
      let existing = await registration.pushManager.getSubscription();
      if (
        existing &&
        existing.options.applicationServerKey &&
        !Array.from(new Uint8Array(existing.options.applicationServerKey)).every(
          (v, i) => v === key[i]
        )
      ) {
        await existing.unsubscribe();
        existing = null;
      }
      return (
        existing ??
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key
        })
      );
    })().catch((e) => {
      subscriptionPromise = undefined;
      throw e;
    });
  return subscriptionPromise;
}
export async function enableBrewAlerts() {
  if (!('Notification' in window))
    throw new Error('Notifications indisponibles dans ce navigateur.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error('Notifications refusées. Autorise-les dans les réglages du site.');
  await deviceSubscription();
}
export async function syncBrewAlerts(
  batchId: string,
  _events: BrewAlarm[],
  enabled = true,
  test = false
) {
  const subscription = await deviceSubscription();
  const res = await httpsCallable<unknown, { synced: boolean; count: number; testAt?: number }>(
    functions,
    'registerBrewDevice'
  )({ batchId, subscription: subscription.toJSON(), enabled, test });
  return res.data;
}
