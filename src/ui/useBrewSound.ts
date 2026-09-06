import { useEffect, useRef, useState } from 'react';
import { BrewAlarm } from '../domain/brewCompanion';
import { playBrewAlarm, stopBrewAlarm } from '../services/brewTimer';
import { BREW_ALARM_SECONDS } from '../services/brewSound';

const alarmKey = (alarm: BrewAlarm) =>
  `${alarm.id.startsWith('add-') ? 'addition' : alarm.id}:${alarm.at}`;

export function useBrewSound(due: BrewAlarm[], enabled: boolean) {
  const [ringing, setRinging] = useState(false);
  const heard = useRef(new Set<string>());
  const active = useRef(new Set<string>());
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const keys = due.map(alarmKey);
  const signature = JSON.stringify(keys);
  const stop = () => {
    stopBrewAlarm();
    clearTimeout(timeout.current);
    active.current.clear();
    setRinging(false);
  };
  const play = () => {
    if (!playBrewAlarm()) return false;
    clearTimeout(timeout.current);
    setRinging(true);
    timeout.current = setTimeout(
      () => {
        active.current.clear();
        setRinging(false);
      },
      BREW_ALARM_SECONDS * 1000 + 100
    );
    return true;
  };
  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    const fresh = keys.filter((key) => !heard.current.has(key));
    if (fresh.length && play()) {
      fresh.forEach((key) => heard.current.add(key));
      active.current = new Set([...active.current, ...fresh].filter((key) => keys.includes(key)));
    } else if (active.current.size && !keys.some((key) => active.current.has(key))) stop();
  }, [enabled, signature]);
  useEffect(
    () => () => {
      clearTimeout(timeout.current);
      stopBrewAlarm();
    },
    []
  );
  return {
    ringing,
    stop,
    test: () => {
      active.current.clear();
      return play();
    }
  };
}
