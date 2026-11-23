import React, { useEffect, useRef, useState } from 'react';
import { BrewAlarm } from '../domain/brewCompanion';
import { enableBrewAlerts, syncBrewAlerts } from '../services/brewAlarms';
import { brewControl } from './BrewDayMeasurements';

export function BrewAlarmSettings({
  batchId,
  alarms,
  ready = true
}: {
  batchId: string;
  alarms: BrewAlarm[];
  ready?: boolean;
}) {
  const storageKey = `brew-push-${batchId}`;
  const [enabled, setEnabled] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState('');
  const scheduleKey = JSON.stringify(alarms);
  const serial = useRef(Promise.resolve());
  const cancelling = useRef(false);
  const latest = useRef(scheduleKey);
  latest.current = scheduleKey;
  useEffect(() => {
    if (!enabled || !ready) return;
    const sync = () => {
      const key = scheduleKey;
      serial.current = serial.current
        .catch(() => {})
        .then(async () => {
          if (latest.current !== key || cancelling.current) return;
          try {
            const result = await syncBrewAlerts(
              batchId,
              alarms.filter((a) => a.at > Date.now())
            );
            if (result && !result.synced)
              throw new Error(
                'Programmation encore en cours. Réessaie dans les options d’alertes.'
              );
            setConfirmed(key);
            setNotice('');
          } catch (e) {
            setConfirmed('');
            setNotice(e instanceof Error ? e.message : 'Alertes non synchronisées.');
          }
        });
    };
    let pending = true;
    const id = setTimeout(() => {
      pending = false;
      sync();
    }, 350);
    window.addEventListener('online', sync);
    return () => {
      clearTimeout(id);
      window.removeEventListener('online', sync);
      // Une fermeture juste après +5 doit aussi envoyer le dernier horaire.
      if (pending && latest.current === scheduleKey && !cancelling.current) sync();
    };
  }, [enabled, scheduleKey, batchId, ready]);
  const toggle = async () => {
    setBusy(true);
    setNotice('');
    try {
      if (enabled) {
        cancelling.current = true;
        setConfirmed('');
        await serial.current;
        await syncBrewAlerts(batchId, [], false);
        setEnabled(false);
        localStorage.removeItem(storageKey);
        setConfirmed('');
      } else {
        await enableBrewAlerts();
        cancelling.current = false;
        localStorage.setItem(storageKey, 'true');
        setEnabled(true);
      }
    } catch (e) {
      setConfirmed('');
      setNotice(e instanceof Error ? e.message : 'Activation impossible.');
    }
    setBusy(false);
  };
  return (
    <details className="border-t border-cave-800 text-sm">
      <summary className="min-h-11 cursor-pointer flex items-center justify-between text-cave-200">
        Alertes Android / écran fermé{' '}
        <span
          className={
            enabled && ready && confirmed === scheduleKey ? 'text-cave-200' : 'text-cave-400'
          }
        >
          {enabled
            ? ready && confirmed === scheduleKey
              ? 'Synchronisées'
              : 'À synchroniser'
            : 'Inactives'}{' '}
          ⌄
        </span>
      </summary>
      <div className="pb-2 space-y-2">
        <button type="button" disabled={busy} className={brewControl} onClick={toggle}>
          {busy
            ? 'Un instant…'
            : enabled
              ? 'Désactiver sur cet appareil'
              : 'Activer sur cet appareil'}
        </button>
        {enabled && (
          <button
            type="button"
            disabled={busy}
            className={brewControl}
            onClick={async () => {
              setBusy(true);
              try {
                await syncBrewAlerts(batchId, alarms, true, true);
                setNotice(
                  'Test programmé dans 10 secondes. Verrouille l’écran pour vérifier la réception.'
                );
              } catch (e) {
                setNotice(e instanceof Error ? e.message : 'Test non programmé.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Tester écran fermé
          </button>
        )}
        {notice && (
          <p role="status" className="text-ebc-straw text-2xs">
            {notice}
          </p>
        )}
        {enabled && (!ready || confirmed !== scheduleKey) && (
          <p className="text-ebc-straw text-2xs">
            Les derniers horaires ne sont pas encore confirmés par le serveur. Garde l’application
            ouverte.
          </p>
        )}
        <p className="text-2xs text-cave-400">
          Les rappels sont programmés sur le serveur. Leur réception écran fermé dépend du réseau et
          des réglages du téléphone ; vérifie-la avec le test.
        </p>
        {alarms
          .filter((a) => a.at > Date.now())
          .slice(0, 4)
          .map((a) => (
            <p key={a.id} className="text-2xs text-cave-200">
              {new Date(a.at).toLocaleTimeString('fr-CH', {
                hour: '2-digit',
                minute: '2-digit'
              })}{' '}
              · {a.title} · {a.body}
            </p>
          ))}
      </div>
    </details>
  );
}
