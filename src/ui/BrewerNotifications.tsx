import React, { useEffect, useState } from 'react';
import { Bell, BellRing, LoaderCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { deviceSubscription, enableBrewAlerts } from '../services/brewAlarms';

async function register() {
  const subscription = await deviceSubscription();
  await httpsCallable(
    functions,
    'registerBrewerNotifications'
  )({ subscription: subscription.toJSON(), enabled: true });
}
export function BrewerNotificationOption() {
  const [status, setStatus] = useState<'off' | 'busy' | 'on'>('off'),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    if ('Notification' in window && Notification.permission === 'granted') {
      void register()
        .then(() => {
          if (live) setStatus('on');
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
  return (
    <div className="brewer-notification-option">
      {status === 'on' ? (
        <span>
          <BellRing size={14} /> Notification à la réponse activée
        </span>
      ) : (
        <button
          type="button"
          disabled={status === 'busy'}
          onClick={async () => {
            setStatus('busy');
            setError('');
            try {
              await enableBrewAlerts();
              await register();
              setStatus('on');
            } catch (e) {
              setStatus('off');
              setError((e as Error).message);
            }
          }}
        >
          <Bell size={15} />{' '}
          {status === 'busy' ? (
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
