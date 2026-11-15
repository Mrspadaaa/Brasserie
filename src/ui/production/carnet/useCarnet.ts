import { useCallback, useEffect, useRef, useState } from 'react';
import type { Batch } from '../../../types';
import { StorageService } from '../../../services/storage';
import { avecEntree, avecEssai, instantSuisse, sansVrac, vracDe, type TypeEntree } from './carnetModel';
import { RANGEMENT_IA_BRANCHE, rangeurActif, type MorceauPropose } from './rangement';
import { jourN, releves } from '../fiche/ficheModel';

/**
 * e3gb : l'état du carnet d'un brassin en fermentation. Ce que le brasseur voit : « repos » (une note en vrac attend « Ranger »), « geste » (les morceaux
 * proposés, chacun à son jour), « rangement » (ce qui est accepté, avec « Annuler »). Rien n'est appliqué sans un geste : une proposition ne touche
 * jamais aux notes, seul « ✓ » ou « Accepter les N » écrit.
 */

type Annulation = { self: { notesTasting?: string; notesBrewDay?: string }; autres: { id: string; notesTasting?: string }[] };
export interface Fait { n: number; autres: string[]; note: string | null }

export interface CarnetControleur {
  propositions: MorceauPropose[] | null;
  range: boolean;
  message: string;
  fait: Fait | null;
  composer: boolean;
  enAttente: boolean;
  enLigne: boolean;
  dictee: 'indisponible' | 'repos' | 'ecoute';
  ranger: () => void;
  accepter: (id: string) => void;
  accepterTous: () => void;
  laisserEnVrac: () => void;
  corriger: (id: string, patch: Partial<Pick<MorceauPropose, 'texte' | 'jour'>>) => void;
  choisirJour: (id: string, jour: string) => void;
  annuler: () => void;
  ouvrirComposer: (ouvert: boolean) => void;
  poser: (texte: string) => void;
  dicter: () => void;
  ecrireVise: (texte: string) => void;
  ecrireEssai: (texte: string) => void;
  aujourdhui: string;
}

type Reconnaissance = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void };

const peutRanger = (p: MorceauPropose) => p.type === 'prochain-essai' || !!p.brassin || p.jour !== null;

/** `batch` : le brassin ouvert (ou `null`) ; l'écriture passe par le stockage et rebase le brouillon de la feuille. */
export function useCarnet(batch: Batch | null, appliquer: (patch: Partial<Batch>) => void): CarnetControleur {
  const [propositions, setPropositions] = useState<MorceauPropose[] | null>(null);
  const [range, setRange] = useState(false);
  const [message, setMessage] = useState('');
  const [fait, setFait] = useState<Fait | null>(null);
  const [composer, setComposer] = useState(false);
  const [enAttente, setEnAttente] = useState(false);
  const [enLigne, setEnLigne] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [dictee, setDictee] = useState<'indisponible' | 'repos' | 'ecoute'>(() => typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ? 'repos' : 'indisponible');
  const source = useRef<string[]>([]);
  const annulation = useRef<Annulation | null>(null);
  const reco = useRef<Reconnaissance | null>(null);
  const courant = useRef(batch); courant.current = batch;
  const id = batch?.id;

  // Un autre brassin, un autre carnet : plus rien de l'ancien ne reste.
  useEffect(() => { setPropositions(null); setFait(null); setMessage(''); setComposer(false); setEnAttente(false); source.current = []; annulation.current = null; }, [id]);
  useEffect(() => { if (!fait) return; const t = window.setTimeout(() => setFait(null), 10000); return () => window.clearTimeout(t); }, [fait]);

  const aujourdhui = instantSuisse(Date.now()).date;
  /** Les notes à l'état enregistré (pas le brouillon) : un correctif ne doit pas emporter une saisie encore refusée ailleurs dans la feuille. */
  const enregistre = () => StorageService.getBatches().find(b => b.id === id) ?? courant.current;

  const ranger = useCallback(async () => {
    const b = courant.current;
    if (!b) return;
    const vrac = vracDe(b);
    if (!vrac.length) return;
    setMessage(''); setFait(null);
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setEnAttente(true); setMessage('Hors ligne : la note reste en vrac, elle sera rangée au retour du réseau.'); return; }
    const rangeur = rangeurActif();
    if (!rangeur) { setMessage(RANGEMENT_IA_BRANCHE ? 'Le rangement n’a pas pu démarrer. La note reste en vrac.' : 'Le rangement par l’IA n’est pas encore branché : ta note reste en vrac.'); return; }
    setRange(true);
    try {
      const j = jourN(b, Date.now());
      const morceaux = await rangeur({
        texte: vrac.map(v => v.texte).join('\n'), aujourdhui,
        brassin: { id: b.id, nom: b.name, jour0: j?.date ?? '' },
        autres: StorageService.getBatches().filter(x => x.id !== b.id && x.status !== 'annule').map(x => ({ id: x.id, nom: x.name, style: x.style })),
        releves: releves(b).map(r => ({ jour: r.swiss, sg: r.sg }))
      });
      if (!morceaux.length) { setMessage('Rien à ranger dans cette note : elle reste en vrac.'); return; }
      source.current = vrac.map(v => v.texte);
      annulation.current = null;
      setPropositions(morceaux);
    } catch (e) {
      setMessage(`Rangement impossible (${e instanceof Error ? e.message : 'erreur'}) : la note reste en vrac.`);
    } finally { setRange(false); }
  }, [aujourdhui]);

  // Hors ligne : la note attend, rangée au retour du réseau.
  useEffect(() => {
    const surLigne = () => { setEnLigne(navigator.onLine); };
    window.addEventListener('online', surLigne); window.addEventListener('offline', surLigne);
    return () => { window.removeEventListener('online', surLigne); window.removeEventListener('offline', surLigne); };
  }, []);
  useEffect(() => { if (enLigne && enAttente) { setEnAttente(false); setMessage(''); void ranger(); } }, [enLigne, enAttente, ranger]);

  const ecrire = (notes: { notesTasting?: string; notesBrewDay?: string }) => {
    const base = enregistre();
    if (!base) return;
    StorageService.updateBatch({ ...base, ...notes });
    appliquer(notes);
  };
  const premiereAnnulation = (b: Batch, autres: string[]) => {
    if (!annulation.current) annulation.current = { self: { notesTasting: b.notesTasting, notesBrewDay: b.notesBrewDay }, autres: [] };
    for (const a of autres) if (!annulation.current.autres.some(x => x.id === a)) annulation.current.autres.push({ id: a, notesTasting: StorageService.getBatches().find(x => x.id === a)?.notesTasting });
  };

  /** Pose des morceaux : sur ce brassin (`notesTasting`, `notesBrewDay` pour le brassage), ou sur l'autre brassin visé. Rend ce qui a été fait. */
  const poserMorceaux = (liste: MorceauPropose[]) => {
    const b = enregistre();
    if (!b || !liste.length) return;
    premiereAnnulation(b, liste.flatMap(m => m.brassin ? [m.brassin.id] : []));
    let tasting = b.notesTasting, brewDay = b.notesBrewDay;
    const autres = new Map<string, string | undefined>();
    for (const m of liste) {
      if (m.brassin) {
        const cible = StorageService.getBatches().find(x => x.id === m.brassin!.id);
        if (!cible) continue;
        const notes = autres.has(cible.id) ? autres.get(cible.id) : cible.notesTasting;
        autres.set(cible.id, avecEntree(notes, { type: m.type === 'prochain-essai' ? 'degustation' : m.type, date: m.jour ?? aujourdhui, texte: m.texte }));
      } else if (m.type === 'prochain-essai') tasting = avecEssai(tasting, m.texte);
      else if (m.type === 'brassage') brewDay = avecEntree(brewDay, { type: 'brassage', date: m.jour ?? aujourdhui, texte: m.texte });
      else tasting = avecEntree(tasting, { type: m.type as TypeEntree, date: m.jour ?? aujourdhui, texte: m.texte });
    }
    for (const [autreId, notes] of autres) { const cible = StorageService.getBatches().find(x => x.id === autreId); if (cible) StorageService.updateBatch({ ...cible, notesTasting: notes }); }
    const restant = (propositions ?? []).filter(p => !liste.some(m => m.id === p.id));
    if (!restant.length) { tasting = sansVrac(tasting, source.current); }
    ecrire({ notesTasting: tasting, notesBrewDay: brewDay });
    setPropositions(restant.length ? restant : null);
    setFait(f => ({ n: (f?.n ?? 0) + liste.length, autres: [...(f?.autres ?? []), ...liste.flatMap(m => m.brassin ? [m.brassin.libelle] : [])], note: f?.note ?? (vracDe(b)[0]?.heure ?? null) }));
    if (!restant.length) source.current = [];
  };

  const accepter = (idMorceau: string) => { const m = propositions?.find(p => p.id === idMorceau); if (m && peutRanger(m)) poserMorceaux([m]); };
  const accepterTous = () => poserMorceaux((propositions ?? []).filter(peutRanger));
  const laisserEnVrac = () => { setPropositions(null); source.current = []; };
  const corriger = (idMorceau: string, patch: Partial<Pick<MorceauPropose, 'texte' | 'jour'>>) => setPropositions(l => l && l.map(p => p.id === idMorceau ? { ...p, ...patch } : p));
  const choisirJour = (idMorceau: string, jour: string) => corriger(idMorceau, { jour });

  const annuler = () => {
    const a = annulation.current;
    if (!a) return;
    ecrire(a.self);
    for (const o of a.autres) { const cible = StorageService.getBatches().find(x => x.id === o.id); if (cible) StorageService.updateBatch({ ...cible, notesTasting: o.notesTasting }); }
    annulation.current = null; setFait(null); setPropositions(null);
  };

  const poser = (texte: string) => {
    const t = texte.trim();
    const b = enregistre();
    if (!t || !b) return;
    const { date, heure } = instantSuisse(Date.now());
    ecrire({ notesTasting: avecEntree(b.notesTasting, { type: 'vrac', date, heure, texte: t }) });
    setComposer(false); setMessage(''); setFait(null);
  };
  const ecrireVise = (texte: string) => { const b = enregistre(); if (b) { const patch = { notesCreation: texte.trim() }; StorageService.updateBatch({ ...b, ...patch }); appliquer(patch); } };
  const ecrireEssai = (texte: string) => { const b = enregistre(); if (b) ecrire({ notesTasting: avecEssai(b.notesTasting, texte) }); };

  const dicter = () => {
    if (dictee === 'ecoute') { reco.current?.stop(); return; }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const r: Reconnaissance = new Ctor();
    r.lang = 'fr-CH'; r.interimResults = false;
    r.onresult = e => { const dit = Array.from(e.results).map(x => x[0]?.transcript ?? '').join(' ').trim(); if (dit) poser(dit); };
    r.onend = () => setDictee('repos');
    r.onerror = () => { setDictee('repos'); setMessage('La dictée n’a pas pu démarrer : écris la note.'); };
    reco.current = r; setDictee('ecoute'); r.start();
  };

  return {
    propositions, range, message, fait, composer, enAttente, enLigne, dictee, aujourdhui,
    ranger: () => void ranger(), accepter, accepterTous, laisserEnVrac, corriger, choisirJour, annuler,
    ouvrirComposer: setComposer, poser, dicter, ecrireVise, ecrireEssai
  };
}
