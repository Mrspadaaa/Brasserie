import React, { useEffect, useRef, useState } from 'react';
import { Clock, Lightbulb } from 'lucide-react';
import { dateDeSemaine } from '../../../domain/calendrier';
import { sg, variation, type SoldeSemaine } from './Courbe';
import { INITIALES } from './BandeAnnee';

/**
 * La bande des semaines (E04, E05, E36) : au repos, la semaine seule (S47…), sans solde, sans mouvement, sans icône (D-184). Un toucher donne
 * sa date (« S50, 7 – 13 déc. », i3). Le bouton ± affiche, sous chaque semaine, son + ou son − et les petites icônes (idée datée du carnet,
 * retard), puis les masque (D-185, D-186). Un appui long de 500 ms sur une semaine note une idée à cette date (L1 b, D-122).
 */
export interface SemaineBande { debut: string; numero: number }

export interface BandeSemainesProps {
  /** Les semaines de la fenêtre, de la première à la dernière colonne. */
  semaines: readonly SemaineBande[];
  /** La courbe entière et l'index de la première colonne dans cette courbe : pour la variation de chaque semaine. */
  courbe: readonly SoldeSemaine[] | null;
  decalage: number;
  mouvements: boolean;
  /** Lundis ISO qui portent une idée datée, et lundis qui portent un retard. */
  idees: ReadonlySet<string>;
  retards: ReadonlySet<string>;
  onDate: (lundi: string, colonne: number) => void;
  onIdeeSemaine?: (lundi: string) => void;
  /** La largeur mesurée d'une colonne (celle de la frise) : elle choisit le pas des étiquettes (CRITIQUE-7 n° 1). 0 : inconnue. */
  largeurColonne?: number;
}

const DELAI = 500;

/**
 * Le pas des étiquettes (CRITIQUE-7 n° 1, E04, E07, E43) : en 6 mois à 390, 26 colonnes de 14 px ne tiennent pas « S53 » chacune
 * (« S47484950… »). Chaque semaine si « S53 » tient dans sa colonne avec 4 px d'écart ; sinon une sur deux, sinon une sur quatre (les semaines
 * rondes : S48, S52, S4…) ; sinon les mois, comme l'An (N D J F…). Colonne inconnue (0) : chaque semaine, comme avant.
 */
export type PasEtiquettes = 1 | 2 | 4 | 'mois';
export const ECART_ETIQUETTES = 4;
export function pasEtiquettes(largeurColonne: number, largeurEtiquette: number): PasEtiquettes {
  if (!(largeurColonne > 0)) return 1;
  const besoin = largeurEtiquette + ECART_ETIQUETTES;
  for (const pas of [1, 2, 4] as const) if (pas * largeurColonne >= besoin) return pas;
  return 'mois';
}

/** La largeur de « S53 », l'étiquette la plus large, dans la police de la bande (14 px, 600) ; hors navigateur, la chasse de Source Sans 3. */
let largeurS53: number | null = null;
export function largeurEtiquetteMax(): number {
  if (largeurS53 !== null) return largeurS53;
  let w = 0;
  try {
    const c = typeof document !== 'undefined' && !/jsdom/i.test(navigator.userAgent) ? document.createElement('canvas').getContext('2d') : null;
    if (c) {
      c.font = `600 14px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
      w = Math.ceil(c.measureText('S53').width);
    }
  } catch { w = 0; }
  // Ne se garde que mesurée avec la police chargée (la première mesure peut tomber sur la police de repli, plus large ou plus étroite).
  if (w > 0 && (typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded')) largeurS53 = w;
  return w > 0 ? w : 23;
}

/** Le mois (0 à 11) du jeudi d'une semaine (ISO 8601), comme la bande de l'An. */
const moisDuJeudi = (lundi: string): number => new Date(Date.parse(`${lundi}T00:00:00Z`) + 3 * 86400000).getUTCMonth();

/**
 * Les étiquettes visibles de la bande : l'index de la colonne et son texte. Avec un pas de 2 ou 4, les semaines dont le numéro en est un multiple ;
 * en mois, l'initiale du mois à la première semaine de chaque mois (celle de son jeudi). Garde-fou : une étiquette trop près de la précédente
 * (fin et début d'année, mois entamé à la première colonne) n'est pas posée ; aucune n'en chevauche une autre.
 */
export function etiquettesBande(semaines: readonly SemaineBande[], pas: PasEtiquettes, largeurColonne: number, largeurEtiquette: number): Map<number, string> {
  const res = new Map<number, string>();
  const candidates: Array<[number, string]> = pas === 'mois'
    ? semaines.flatMap((s, k) => (k === 0 || moisDuJeudi(s.debut) !== moisDuJeudi(semaines[k - 1].debut) ? [[k, INITIALES[moisDuJeudi(s.debut)]] as [number, string]] : []))
    : semaines.flatMap((s, k) => (s.numero % pas === 0 ? [[k, `S${s.numero}`] as [number, string]] : []));
  if (!(largeurColonne > 0)) { candidates.forEach(([k, t]) => res.set(k, t)); return res; }
  const largeur = (t: string) => (t.length === 1 ? Math.ceil(largeurEtiquette / 2) : largeurEtiquette);
  let derniere: [number, string] | null = null;
  for (const [k, t] of candidates) {
    if (derniere && (k - derniere[0]) * largeurColonne < (largeur(derniere[1]) + largeur(t)) / 2 + ECART_ETIQUETTES) {
      // Le mois entamé de la première colonne cède la place au mois entier qui le suit (« D » plutôt que la fin de « N »).
      if (pas === 'mois' && derniere[0] === 0 && res.size === 1) { res.clear(); res.set(k, t); derniere = [k, t]; }
      continue;
    }
    res.set(k, t);
    derniere = [k, t];
  }
  return res;
}

export function BandeSemaines({ semaines, courbe, decalage, mouvements, idees, retards, onDate, onIdeeSemaine, largeurColonne = 0 }: BandeSemainesProps) {
  const appui = useRef<{ id: number; x: number; y: number; timer: ReturnType<typeof setTimeout>; long: boolean } | null>(null);
  const annule = () => { if (appui.current) { clearTimeout(appui.current.timer); appui.current = null; } };
  const wEtiquette = largeurEtiquetteMax();
  const pas = pasEtiquettes(largeurColonne, wEtiquette);
  const etiquettes = pas === 1 ? null : etiquettesBande(semaines, pas, largeurColonne, wEtiquette);
  // CRITIQUE-9 (doute « cadre noir sur S48 », m390-11) : l'anneau de focus d'une colonne n'est que pour le clavier. Après un toucher ou un clic
  // (où qu'il soit sur la page), une colonne qui reçoit le focus (rendu par une feuille qui se ferme, focus programmé) ne le montre pas, même si
  // le navigateur la dit `:focus-visible` ; une touche du clavier le rend (entete.css, `.ent-bd[data-doigt]`).
  const [doigt, setDoigt] = useState(false);
  useEffect(() => {
    const parDoigt = () => setDoigt(true);
    const parClavier = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) setDoigt(false); };
    document.addEventListener('pointerdown', parDoigt, true);
    document.addEventListener('keydown', parClavier, true);
    return () => { document.removeEventListener('pointerdown', parDoigt, true); document.removeEventListener('keydown', parClavier, true); };
  }, []);
  return (
    <div className="ent-bd" data-bande-semaines data-pas={pas} data-doigt={doigt ? 'oui' : undefined} role="group" aria-label="Semaines ; ± affiche les mouvements et les icônes" style={{ ['--n' as string]: semaines.length }}>
      {semaines.map((s, k) => {
        const v = courbe ? variation(courbe, decalage + k) : null;
        const idee = idees.has(s.debut), retard = retards.has(s.debut);
        return (
          <button key={s.debut} type="button" className="ent-bd-c" data-semaine={s.numero} data-lundi={s.debut} data-courant={decalage + k === 0 ? 'oui' : undefined}
            aria-label={`${dateDeSemaine(s.debut)}${mouvements && v !== null ? ` ; mouvement ${sg(v)}` : ''}${mouvements && idee ? ' ; idée du carnet' : ''}${mouvements && retard ? ' ; en retard' : ''}`}
            onPointerDown={e => {
              if (e.button > 0 || !onIdeeSemaine) return;
              annule();
              const timer = setTimeout(() => { if (appui.current) { appui.current.long = true; onIdeeSemaine(s.debut); } }, DELAI);
              appui.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer, long: false };
            }}
            onPointerMove={e => { const a = appui.current; if (a && !a.long && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8) annule(); }}
            onPointerUp={() => { if (appui.current && !appui.current.long) annule(); }}
            onPointerCancel={annule}
            onContextMenu={e => e.preventDefault()}
            onClick={() => {
              // L'appui long a déjà ouvert l'idée : le toucher qui suit ne donne pas la date.
              if (appui.current?.long) { appui.current = null; return; }
              onDate(s.debut, k);
            }}>
            {/* Pas de 2, 4 ou mois : seules les étiquettes posées se lisent ; chaque colonne reste touchable et garde son nom (« S50, 7 – 13 déc. »). */}
            {etiquettes === null ? <span className="ent-sem">{`S${s.numero}`}</span>
              : etiquettes.has(k) ? <span className="ent-sem ent-sem--pas" aria-hidden="true">{etiquettes.get(k)}</span> : null}
            {mouvements && (
              <span className="ent-bd-m">
                {v !== null && <span className={v < 0 ? 'ent-m' : 'ent-p'}>{sg(v)}</span>}
                {(idee || retard) && (
                  <span className="ent-ic">
                    {retard && <Clock size={14} strokeWidth={2.4} aria-hidden="true" />}
                    {idee && <Lightbulb size={14} strokeWidth={2.4} aria-hidden="true" />}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
