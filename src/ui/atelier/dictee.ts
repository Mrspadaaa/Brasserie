import { useCallback, useEffect, useRef, useState } from 'react';

interface Reconnaissance {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
}

function constructeur(): (new () => Reconnaissance) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Dictée du navigateur, quand il en a une : sinon `disponible` est faux et l'écran n'affiche pas de micro qui ne ferait rien. */
export function useDictee(onTexte: (t: string) => void) {
  const [ecoute, setEcoute] = useState(false);
  const rec = useRef<Reconnaissance | null>(null);
  const rappel = useRef(onTexte);
  rappel.current = onTexte;
  useEffect(() => () => { rec.current?.stop(); }, []);
  const basculer = useCallback(() => {
    if (rec.current) { rec.current.stop(); return; }
    const C = constructeur();
    if (!C) return;
    const r = new C();
    r.lang = 'fr-CH'; r.interimResults = false; r.continuous = false;
    r.onresult = e => { const t = Array.from(e.results).map(x => x[0]?.transcript ?? '').join(' ').trim(); if (t) rappel.current(t); };
    r.onend = r.onerror = () => { rec.current = null; setEcoute(false); };
    rec.current = r; setEcoute(true);
    r.start();
  }, []);
  return { disponible: !!constructeur(), ecoute, basculer };
}
