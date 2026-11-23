import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellRing, LoaderCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { deviceSubscription, enableBrewAlerts } from '../services/brewAlarms';
import './companion/limites.css';

async function register() {
  const subscription = await deviceSubscription();
  await httpsCallable(
    functions,
    'registerBrewerNotifications'
  )({ subscription: subscription.toJSON(), enabled: true });
}

export type BrewerNotificationState = 'off' | 'busy' | 'on' | 'unsupported';

/**
 * L'état des notifications « à la réponse » de cet appareil, et le geste qui les active.
 *
 * `error` dit pourquoi l'activation a échoué (permission refusée, appareil sans notifications) : la réponse reste
 * lisible dans le fil, la notification n'est qu'un confort. Aucun geste ne les coupe : le navigateur seul les retire.
 */
export function useBrewerNotifications(): { state: BrewerNotificationState; enable(): Promise<void>; error: string } {
  const unsupported = typeof window !== 'undefined' && !('Notification' in window);
  const [state, setState] = useState<'off' | 'busy' | 'on'>('off'),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    if ('Notification' in window && Notification.permission === 'granted') {
      void register()
        .then(() => {
          if (live) setState('on');
        })
        .catch(() => {
          if (live)
            setError(
              'Les notifications ne sont pas synchronisées sur cet appareil. Réessaie leur activation.'
            );
        });
    }
    return () => {
      live = false;
    };
  }, []);
  const enable = useCallback(async () => {
    setState('busy');
    setError('');
    try {
      await enableBrewAlerts();
      await register();
      setState('on');
    } catch (e) {
      setState('off');
      setError((e as Error).message);
    }
  }, []);
  return { state: unsupported ? 'unsupported' : state, enable, error };
}

/** La ligne à bascule de la maquette (« Me notifier à la réponse »). */
export function BrewerNotifySwitch({ label = 'Me notifier à la réponse' }: { label?: string }) {
  const { state, enable, error } = useBrewerNotifications();
  const sous =
    state === 'on'
      ? 'Activé sur cet appareil'
      : state === 'unsupported'
        ? 'Indisponible sur cet appareil'
        : state === 'busy'
          ? 'Activation…'
          : null;
  return (
    <div className="cmp-lx">
      <div className="cmp-reglage-l">
        {state === 'busy' ? (
          <LoaderCircle className="cmp-i brewer-chat-spin" size={16} aria-hidden="true" />
        ) : state === 'on' ? (
          <BellRing className="cmp-i" size={16} aria-hidden="true" />
        ) : (
          <Bell className="cmp-i" size={16} aria-hidden="true" />
        )}
        <span>
          {label}
          {sous && <small>{sous}</small>}
        </span>
        <button
          type="button"
          role="switch"
          className="cmp-bascule"
          aria-checked={state === 'on'}
          aria-label={label}
          aria-busy={state === 'busy'}
          disabled={state === 'busy' || state === 'on' || state === 'unsupported'}
          onClick={() => void enable()}
        >
          <i />
        </button>
      </div>
      {error && (
        <p role="alert" className="cmp-note">
          {error} La réponse reste accessible dans le fil.
        </p>
      )}
    </div>
  );
}

/** Ancien bouton « Me notifier à la réponse », gardé pour les écrans qui l'importent encore. */
function BrewerNotificationOption() {
  const { state, enable, error } = useBrewerNotifications();
  return (
    <div className="brewer-notification-option">
      {state === 'on' ? (
        <span>
          <BellRing size={14} /> Notification à la réponse activée
        </span>
      ) : (
        <button type="button" disabled={state === 'busy'} onClick={() => void enable()}>
          <Bell size={15} />{' '}
          {state === 'busy' ? (
            <>
              <LoaderCircle size={14} className="brewer-chat-spin" /> Activation…
            </>
          ) : (
            'Me notifier à la réponse'
          )}
        </button>
      )}
      {error && <p role="alert">{error} La réponse reste accessible dans le fil.</p>}
    </div>
  );
}
