/**
 * La piste de l'horloge (p2c : « pH · 13 h 15 · dans 10 min », « eau de rinçage · 13 h 50 », « Magnum ✓ · Citra en retard · Amarillo »).
 * Des rendez-vous posés entre le début et la fin d'une étape, proportionnels au temps. Pur : aucune heure inventée, un rendez-vous sans heure
 * ou hors de l'étape n'est pas posé (il ne dit rien de faux).
 */
export type EtatPoint = 'ok' | 'du' | 'red' | 'fin' | 'vide';

export interface RendezVous {
  id: string;
  /** Heure du rendez-vous, dans la même unité que `debut` et `fin` ; `null` si inconnue. */
  heure: number | null;
  etat: EtatPoint;
  /** Ce que la piste écrit sous le point ; vide : un point sans mot. */
  texte?: string;
}

export interface PointPiste {
  id: string;
  /** % de la piste, 0 à 100. */
  pos: number;
  etat: EtatPoint;
  texte: string;
}

const borne = (v: number) => Math.max(0, Math.min(100, v));

export function pointsPiste(o: {
  debut: number | null;
  fin: number | null;
  now: number;
  rendezVous: readonly RendezVous[];
  /** Pose le carré de fin à 100 %, avec ce mot (« fin »). */
  finTexte?: string;
  /** Pose le rond de départ à 0 %. */
  depart?: EtatPoint;
}): { points: PointPiste[]; avance: number } {
  const { debut, fin, now } = o;
  if (debut == null || fin == null || !(fin > debut)) return { points: [], avance: 0 };
  const pos = (t: number) => borne(((t - debut) / (fin - debut)) * 100);
  const points: PointPiste[] = [];
  if (o.depart) points.push({ id: 'depart', pos: 0, etat: o.depart, texte: '' });
  for (const r of o.rendezVous) {
    if (r.heure == null || r.heure < debut || r.heure > fin) continue;
    points.push({ id: r.id, pos: pos(r.heure), etat: r.etat, texte: r.texte ?? '' });
  }
  if (o.finTexte != null) points.push({ id: 'fin', pos: 100, etat: 'fin', texte: o.finTexte });
  points.sort((a, b) => a.pos - b.pos);
  return { points, avance: pos(now) };
}

/** « dans 10 min », « dans 1 h 05 », « à relever » une fois l'heure passée (jamais un compte à rebours négatif). */
export function dansDit(heure: number, now: number): string {
  const min = Math.round((heure - now) / 60000);
  if (min <= 0) return 'maintenant';
  if (min < 60) return `dans ${min} min`;
  return `dans ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
