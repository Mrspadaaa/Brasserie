// Substituer = u4, son choix du 19.10 (« Substitution, ça serait plus du u4 » ; fils11-substitution/u4/vue.html,
// capture captures/u4-vue-390.png), reprise telle qu'elle est, moteur v4 en direct (voie r6, 24.10, D34) :
//  1. la réponse en une phrase (« Magnat et Yeoman, 99 sans inconnue. ») et la plage de ceux qu'une composante
//     inconnue ouvre (« Altus, Trident, Zenia vont de 78 à 99. ») ;
//  2. l'échelle de ressemblance 50–100 à paliers (partiel, proche, très proche), huit remplaçants (cinq du catalogue,
//     trois du stock) rangés par le pire cas : un point si tout est connu, une plage hachurée sinon ; stock en icône ;
//  3. le face à face, même IBU, sur la grammaire de Comparer p3 : bandes (usage, stock, dose), α par source (lot ou
//     article nommé), arômes en barres face au style (attendues d'abord, « hors 16D », « ce n'est pas zéro »), radar D3,
//     β, huiles, relation au style ; puis « Ajouter … aux achats » et « Lire ces scores ».
// Écarts voulus : la croix (D109) ; « Annuler » à côté de « Remplacer » en pied (D120) ; la légende des gestes derrière
// « ? » (D89). Plancher enrichi (L07) : toucher un remplaçant le met au face à face et en fait le remplaçant (u4 :
// « choix des deux comparés statique ») ; « Ma bière avec chacun », au style ou en absolu (D75) ; la part des mots
// sans famille (L14) ; « à 60′, surtout l'amertume ». Classes propres préfixées pq-substituer- (L26).
// Reprise D127 (24.10, soir : « trop centré ibu […] aussi en dry hop […] ajouter à comparé doit être facile. Et le
// remplacement aussi. Ainsi que ferme la vue ») : la puce de moment (60′, whirlpool, dry hop, un toucher), les arômes
// de chaque remplaçant à côté de son score (crans du tableau « Arômes 16D », Nugget en tête pour comparer), le « + »
// de Comparer sur chaque ligne et « Comparer (n) › » (Nugget épinglé) ; au dry hop, le tableau des arômes monte.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { COULEURS, COURT, FAMILIES, Inconnu, Legende, Picto, Pont, Simule, nombre, plage, type Echelle } from './commun';
import { CadreOutil, PiedAnnuler, useBrouillon, useComparaison, useFiche, useGestes, useNavigation, useRecette, useTermes } from '../dryhopper/hote';
import { CONDITIONS } from '../comparer/cas';
import { quandDe, remplacer, trouver } from '../parcours/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../parcours/types';
import { houblon, ibuAjout, lireBiere, style, type BiereLue, type FamilleLue, type HoublonLu } from '../parcours/adaptateur';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { Usage } from '../fiche/briques';
import { Lentille } from '../maBiere/Lentille';
import { noterAvant } from '../maBiere/repere';
import { huilesDe, LIGNES_HUILE, mesures, useRemplacants, motsHors, stockOriginal, TEXTE_STOCK, type Candidat, type EtatStock, type Intervalle } from './donnees';
import { RadarU4 } from './Radar';
import SYMBOLES from '../../../data/hopV4/pictos-familles.svg?raw';
import '../dryhopper/pied-annuler.css';
import './substituer.css';

/** Les petites variantes de u4 enrichi (« quelques petites variante, amélioration », 24.10, soir), une par point,
 * ouvertes par `?u4e=u4e1`… et figées en pages statiques dans fils24-u4-enrichi ; sans paramètre, u4 enrichi. */
const VARIANTE: string | null = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('u4e');

/** Dose du remplaçant à IBU égal, au demi-gramme (le moteur arrondit au gramme : jusqu'à 0,65 IBU d'écart). */
export function doseExacte(recette: RecetteParcours, ajoutId: string, cle: string): { grams: number; recette: RecetteParcours } {
  const r1 = remplacer(recette, ajoutId, cle);
  const a0 = trouver(recette, ajoutId)!, a1 = trouver(r1, ajoutId)!;
  const i0 = ibuAjout(a0, recette).ibu, i1 = ibuAjout(a1, r1).ibu;
  if (!i0 || !i1 || i1.valeur <= 0 || quandDe(a0, recette).type === 'dryhop') return { grams: a1.grams, recette: r1 };
  const g = Math.round(((a1.grams * i0.valeur) / i1.valeur) * 2) / 2;
  return { grams: g, recette: { ...r1, additions: r1.additions.map((x) => (x.id === ajoutId ? { ...x, grams: g } : x)) } };
}

// Couleurs de u4 : l'original en gris foncé, les deux comparés en Okabe et Ito (bleu, vert) ; gris pour les autres.
const GRIS_ORIGINAL = '#4d4d4d';
const SLOTS = ['#0072B2', '#009E73'] as const;
/** Les mêmes, foncés pour un texte (4,5:1 au moins sur #f5f5f5, D86). */
const SLOTS_TEXTE: Record<string, string> = { '#0072B2': '#0072B2', '#009E73': '#007a5c' };
const GRIS_RANG = '#8a8a8a';

/** Le stock en icône seule, celle de u4 : chariot (à acheter), boîte pleine (suffit), boîte basse (ne suffit pas),
 * boîte pointillée (épuisé). Le mot est dans aria-label et title. */
function IconeStock({ etat }: { etat: EtatStock }) {
  const t = TEXTE_STOCK[etat];
  const boite = <><rect x="3" y="3.5" width="10" height="10" rx="1.5" fill="none" stroke="#555" strokeWidth="1.3" strokeDasharray={etat === 'epuise' ? '2 1.5' : undefined} /><path d="M5 1.8h6" stroke="#555" strokeWidth="1.3" /></>;
  return (
    <svg className="pq-substituer-ico" viewBox="0 0 16 16" role="img" aria-label={t} data-stock={etat}>
      <title>{t}</title>
      {etat === 'acheter' ? (
        <><path d="M1.5 2.5h2l1.6 8h7.4l1.5-5.5H4.3" fill="none" stroke="#555" strokeWidth="1.3" strokeLinejoin="round" /><circle cx="6.3" cy="13.3" r="1.2" fill="#555" /><circle cx="11.6" cy="13.3" r="1.2" fill="#555" /></>
      ) : (
        <>{boite}{etat === 'suffisant' && <rect x="4.5" y="5" width="7" height="7" rx=".5" fill="#555" />}{etat === 'insuffisant' && <rect x="4.5" y="9" width="7" height="3" rx=".5" fill="#555" />}</>
      )}
    </svg>
  );
}

const fr = (v: number) => nombre(v, 2);

/** Le picto de la planche standard (src/data/hopV4/pictos-familles.svg, le même que <Picto>), dessiné en ligne plutôt que par
 * <use> : son trait porte la couleur de la famille dans le document (lisible par les contrôles de couleur, D74). */
const PLANCHE = typeof DOMParser === 'undefined' ? null : new DOMParser().parseFromString(SYMBOLES, 'image/svg+xml');
function PictoEnLigne({ famille, taille = 16 }: { famille: FamilyId; taille?: number }) {
  const s = PLANCHE?.getElementById(`p-${famille}`);
  if (!s) return <Picto famille={famille} taille={taille} />;
  const a = (n: string) => s.getAttribute(n) ?? undefined;
  return (
    <svg width={taille} height={taille} viewBox={a('viewBox') ?? '0 0 24 24'} data-famille={famille} className="shrink-0" role="img" aria-label={COURT[famille]}>
      <g fill={a('fill')} stroke={a('stroke')} strokeWidth={a('stroke-width')} strokeLinecap={a('stroke-linecap') as 'round' | undefined}
        strokeLinejoin={a('stroke-linejoin') as 'round' | undefined} dangerouslySetInnerHTML={{ __html: s.innerHTML }} />
    </svg>
  );
}

/** Les familles que ses fiches citent, marquées d'abord, en pictos à la couleur de la famille (L04 : les arômes en
 * couleur sur la carte du houblon ; D74). Le détail cité / marqué est dans le tableau des arômes. */
function PictosCites({ h, max = 5 }: { h: HoublonLu; max?: number }) {
  const fs = FAMILIES.filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((p, q) => (h.familles[q].niveau === 'marqué' ? 1 : 0) - (h.familles[p].niveau === 'marqué' ? 1 : 0));
  if (!fs.length) return null;
  return (
    <span className="pq-substituer-pictos" aria-label={`Arômes cités : ${fs.map((f) => COURT[f]).join(', ')}`}>
      {fs.slice(0, max).map((f) => <PictoEnLigne key={f} famille={f} taille={15} />)}
      {fs.length > max && <span className="pq-substituer-gris">+{fs.length - max}</span>}
    </span>
  );
}

/** Une rangée de mesure (grammaire de Comparer p3) : sources en traits fins, plage, milieu moyen des sources en noir,
 * le lot ou l'article nommé au-dessus. */
function Rangee({ dom, nom, couleur, src, lot, mesure }: { dom: Intervalle; nom: string; couleur: string; src: Intervalle[]; lot?: { v: number; origine: 'lot' | 'article' } | null; mesure: string }) {
  const x = (v: number) => `${Math.max(0, Math.min(100, ((v - dom[0]) / (dom[1] - dom[0])) * 100)).toFixed(1)}%`;
  if (!src.length) {
    return (
      <div className="pq-substituer-mr" data-plage-inconnue={mesure} data-houblon={nom}>
        <span className="pq-substituer-mr-h">{nom}</span><span className="pq-substituer-mr-v pq-substituer-gris">?</span>
        <span className="pq-substituer-note">non renseigné</span>
      </div>
    );
  }
  const lo = Math.min(...src.map((s) => s[0])), hi = Math.max(...src.map((s) => s[1]));
  const centre = src.reduce((t, s) => t + (s[0] + s[1]) / 2, 0) / src.length;
  return (
    <div className="pq-substituer-mr" style={{ ['--c' as string]: couleur }}>
      <span className="pq-substituer-mr-h">{nom}</span>
      <span className="pq-substituer-mr-v">{plage(lo, hi, 2)}</span>
      <span className="pq-substituer-tb" data-plage="" data-houblon={nom} data-mesure={mesure} data-min={lo} data-max={hi}>
        <span className="pq-substituer-tb-fond" />
        <span className="pq-substituer-tb-pg" style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} />
        {src.map((s, i) => <span key={i} className="pq-substituer-tb-src" style={{ left: x(s[0]), width: `calc(${x(s[1])} - ${x(s[0])})`, top: 26 + i * 4 }} />)}
        <span className="pq-substituer-tb-ctr" data-role="central" data-valeur={Math.round(centre * 100) / 100} style={{ left: x(centre) }} />
        {lot && <span className={`pq-substituer-tb-lot ${lot.origine === 'article' ? 'pq-substituer-article' : ''}`} data-role="lot" data-valeur={lot.v} data-origine={lot.origine === 'article' ? 'article' : 'stock'} style={{ left: x(lot.v) }}>{lot.origine} {fr(lot.v)}</span>}
      </span>
    </div>
  );
}

/** Mini barre l5b de Ma bière, au style (zone = moitié gauche) ou en absolu ; rond = ma bière avec l'original. */
function MiniBarre({ x, avant, echelle }: { x: FamilleLue; avant?: FamilleLue; echelle: Echelle }) {
  const haut = x.bande?.[1] ?? null;
  const pos = (v: number) => `${Math.max(0, Math.min(100, echelle === 'style' && haut ? (v / haut) * 50 : (v / 110) * 100)).toFixed(1)}%`;
  const zone = echelle === 'style' && haut ? { left: '0%', width: '50%' }
    : x.bande ? { left: pos(x.bande[0]), width: `calc(${pos(x.bande[1])} - ${pos(x.bande[0])})` } : null;
  const f = x.famille;
  if (!x.valeur) return <span data-inconnu="" title={x.raison ?? 'inconnu'} className="pq-hachure block h-2 rounded-full" />;
  return (
    <span data-barre={f} className="relative block h-2 rounded-full bg-cave-850">
      {zone && <i data-role="zone" className="absolute inset-y-0 rounded-full bg-cave-700/70" style={zone} />}
      <i className="absolute inset-y-0 left-0 rounded-full" style={{ width: pos(x.valeur.centre), background: x.horsStyle === 'au-dessus' ? '#c2410c' : COULEURS[f].base }} />
      {avant?.valeur && <i className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-cave-950 bg-cave-50" style={{ left: pos(avant.valeur.centre) }} />}
    </span>
  );
}


// ---------- Le moment (D127) : trois lectures, un toucher ----------
type CleMoment = 'chaud' | 'whirlpool' | 'dryhop';
const cleMoment = (q: Quand): CleMoment => (q.type === 'whirlpool' ? 'whirlpool' : q.type === 'dryhop' ? 'dryhop' : 'chaud');
/** « à 60′ », « au whirlpool », « au dry hop » : le moment dans une phrase. */
const aMoment = (q: Quand) => (q.type === 'ebullition' ? `à ${q.minutes}′` : q.type === 'premierMout' ? 'au premier moût' : q.type === 'whirlpool' ? 'au whirlpool' : 'au dry hop');
/** Les trois moments de la puce : celui de la recette quand il est à chaud (Nugget : 60′), le whirlpool, le dry hop
 * (actif, 3 j, comme Dryhopper, sauf si l'ajout est déjà à froid). */
function momentsDe(original: Quand): { cle: CleMoment; quand: Quand; mot: string }[] {
  const chaud: Quand = original.type === 'ebullition' || original.type === 'premierMout' ? original : { type: 'ebullition', minutes: 60 };
  const froid: Quand = original.type === 'dryhop' ? original : { type: 'dryhop', phase: 'actif', jours: CONDITIONS.jours };
  return [
    { cle: 'chaud', quand: chaud, mot: chaud.type === 'ebullition' ? `${chaud.minutes}′` : 'premier moût' },
    { cle: 'whirlpool', quand: { type: 'whirlpool' }, mot: 'whirlpool' },
    { cle: 'dryhop', quand: froid, mot: 'dry hop' },
  ];
}

/** Les crans d'un houblon pour les familles de sa stout (les attendues du style, puis celles hors style dans ma bière) :
 * la grammaire du tableau « Arômes 16D » (2 crans : cité, marqué ; pointillé : non décrit), en petit, à côté du score. */
function CransRang({ h, familles, attendues }: { h: HoublonLu; familles: FamilyId[]; attendues: FamilyId[] }) {
  if (VARIANTE === 'u4e2') return <PictosRang h={h} familles={familles} attendues={attendues} />;
  return (
    <span className="pq-substituer-mc" aria-label={`Arômes des fiches : ${familles.map((f) => `${COURT[f]} ${h.familles[f].niveau}`).join(', ')}`}>
      {familles.map((f, i) => {
        const n = NIV[h.familles[f].niveau];
        const coupe = i > 0 && attendues.includes(familles[i - 1]) && !attendues.includes(f);
        return (
          <span key={f} className={`pq-substituer-mc-f ${n ? '' : 'pq-substituer-mc-nd'} ${coupe ? 'pq-substituer-mc-hors' : ''}`} style={{ ['--c' as string]: COULEURS[f].base }}
            data-role="arome-rang" data-famille-rang={f} data-niveau={n} title={`${h.nom}, ${COURT[f]} : ${h.familles[f].niveau}`}>
            <i className={n >= 1 ? 'pq-substituer-mc-on' : ''} /><i className={n >= 2 ? 'pq-substituer-mc-on' : ''} />
          </span>
        );
      })}
    </span>
  );
}

/** u4e2 : le picto de la famille, cerclé à sa valeur dans les fiches : marqué = disque plein pâle et cercle à la couleur,
 * cité = cercle fin, non décrit = cercle pointillé vide (ce n'est pas zéro). Lisible sans en-tête. */
function PictosRang({ h, familles, attendues }: { h: HoublonLu; familles: FamilyId[]; attendues: FamilyId[] }) {
  return (
    <span className="pq-substituer-mc pq-substituer-pr" aria-label={`Arômes des fiches : ${familles.map((f) => `${COURT[f]} ${h.familles[f].niveau}`).join(', ')}`}>
      {familles.map((f, i) => {
        const n = NIV[h.familles[f].niveau];
        const coupe = i > 0 && attendues.includes(familles[i - 1]) && !attendues.includes(f);
        return (
          <span key={f} className={`pq-substituer-pr-f pq-substituer-pr-${n} ${coupe ? 'pq-substituer-mc-hors' : ''}`} style={{ ['--c' as string]: COULEURS[f].base, ['--cf' as string]: COULEURS[f].fond }}
            data-role="arome-rang" data-famille-rang={f} data-niveau={n} title={`${h.nom}, ${COURT[f]} : ${h.familles[f].niveau}`}>
            {n > 0 ? <PictoEnLigne famille={f} taille={n === 2 ? 15 : 13} /> : null}
          </span>
        );
      })}
    </span>
  );
}

interface Face { cle: string; nom: string; h: HoublonLu; couleur: string; stock: EtatStock; dose: { grams: number; min: number; max: number } | null; original: boolean; biere: BiereLue; cand: Candidat | null }

const NIV = { 'non décrit': 0, 'cité': 1, 'marqué': 2 } as const;
const liste = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs.at(-1)}`);

export default function Substituer({ houblon: cle }: { houblon: string }) {
  const b = useBrouillon()!;
  const inscrite = useRecette();
  const gestes = useGestes();
  const aComparer = useComparaison();
  const { revenirMaBiere, aller } = useNavigation();
  const fiche = useFiche();
  const T = useTermes();
  const ajout: AjoutParcours | null = b.remplace ? trouver(b.recette, b.remplace.ajoutId) : null;
  const lecture = useRemplacants(b.recette, ajout);
  const cands = lecture?.candidats ?? [];
  // Le moment lu (D127) : celui de l'ajout dans le brouillon ; la puce le change, « Remplacer » l'inscrit tel quel.
  const qLu = ajout ? quandDe(ajout, b.recette) : null;
  const cleLue = qLu ? cleMoment(qLu) : 'chaud';
  // u4 : Magnat, premier sûr à acheter ; Nelson Sauvin, premier du stock qui suffit. Il remplace par celui du stock.
  const defauts = useMemo(() => {
    const B = cands.find((c) => c.stock === 'suffisant') ?? null;
    const A = cands.find((c) => c.min === c.max && c !== B && c.stock !== 'suffisant') ?? cands.find((c) => c !== B) ?? null;
    const B2 = B ?? cands.find((c) => c !== A) ?? null;
    return { compares: [A?.cle, B2?.cle].filter(Boolean) as string[], choix: B2?.cle ?? A?.cle ?? null };
  }, [cands]);
  const [compares, setCompares] = useState<string[]>(defauts.compares);
  const [choix, setChoix] = useState<string | null>(defauts.choix);
  const [echelle, setEchelle] = useState<Echelle>('style');
  const [achats, setAchats] = useState<Set<string>>(() => new Set());
  // Un autre moment, d'autres remplaçants : le face à face repart de ses deux par défaut (u4) à ce moment.
  // Les remplaçants arrivés après le premier rendu (client sans réponse immédiate, #165) : le face à face part alors aussi
  // de ses deux par défaut. Sur le fil principal, ils sont là dès le premier rendu : rien ne change.
  const recue = lecture != null;
  useEffect(() => { setCompares(defauts.compares); setChoix(defauts.choix); }, [cleLue, recue]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ajout || !lecture) return null;

  const h0 = houblon(cle);
  const sc = style(b.recette.styleCode);
  const q = quandDe(ajout, b.recette);
  const moment = aMoment(q);
  const Moment = moment.charAt(0).toUpperCase() + moment.slice(1);
  const amertume = lecture.contexte === 'amertume';
  const biere0 = lireBiere(b.recette);
  // Le moment de la recette inscrite, et ce que coûte de le quitter (l'IBU de Nugget part avec lui).
  const ajoutInscrit = trouver(inscrite, ajout.id) ?? ajout;
  const q0 = quandDe(ajoutInscrit, inscrite);
  const deplace = cleMoment(q0) !== cleLue;
  const biereInscrite = lireBiere(inscrite);
  const ibuInscrit = biereInscrite.ibu.valeur;
  const moments = momentsDe(q0);
  const choisirMoment = (m: (typeof moments)[number]) => { if (m.cle !== cleLue) gestes.moment('brouillon', ajout.id, m.cle === cleMoment(q0) ? q0 : m.quand); };
  const froid = q.type === 'dryhop';
  // Comparer (D127) : le « + » d'une ligne ajoute le remplaçant à la liste partagée (celle de Suggérer) ;
  // « Comparer (n) › » ouvre Comparer avec Nugget épinglé en colonne 1 (4 colonnes au plus).
  const envoyes = aComparer.filter((k) => k !== cle).slice(0, 3);
  const versComparer = () => aller({ ecran: 'comparer', houblons: envoyes, pin: cle });
  const doseDe = (c: Candidat) => doseExacte(b.recette, ajout.id, c.cle);

  // Toucher un remplaçant : il entre au face à face (à la place de l'autre comparé) et devient le remplaçant.
  const toucher = (c: string) => {
    if (!compares.includes(c)) {
      setCompares((cs) => {
        if (cs.length < 2) return [...cs, c];
        const garde = choix && cs.includes(choix) ? choix : cs[1];
        return cs.map((x) => (x === garde ? x : c));
      });
    }
    setChoix(c);
  };

  const faces: Face[] = [
    { cle, nom: h0.nom, h: h0, couleur: GRIS_ORIGINAL, stock: stockOriginal(h0, b.recette), dose: { grams: ajout.grams, min: ajout.grams, max: ajout.grams }, original: true, biere: biere0, cand: null },
    ...compares.map((k, i): Face | null => {
      const c = cands.find((x) => x.cle === k);
      if (!c) return null;
      const d = doseDe(c);
      return { cle: k, nom: c.nom, h: c.h, couleur: SLOTS[i], stock: c.stock, dose: { grams: d.grams, min: c.dose.min, max: c.dose.max }, original: false, biere: lireBiere(d.recette), cand: c };
    }).filter((f): f is Face => !!f),
  ];
  // L'état « toucher un remplaçant » (u4 : Yeoman) : le premier rang qui n'est pas au face à face par défaut.
  const premierLibre = cands.find((c) => !defauts.compares.includes(c.cle))?.cle ?? null;
  const couleurDe = (k: string) => { const i = compares.indexOf(k); return i >= 0 ? SLOTS[i] : GRIS_RANG; };
  const choisi = faces.find((f) => f.cle === choix && !f.original) ?? null;

  // 1. La réponse : les meilleurs sans inconnue, puis la plage de ceux qu'une composante inconnue ouvre.
  const surs = cands.filter((c) => c.min === c.max);
  const hautSur = surs.length ? Math.max(...surs.map((c) => c.min)) : null;
  const tete = surs.filter((c) => c.min === hautSur);
  const ouverts = cands.filter((c) => c.min < c.max);
  const reponse = tete.length ? `${liste(tete.map((c) => c.nom))}, ${hautSur} sans inconnue.` : `Aucun remplaçant sans inconnue.`;
  const sousReponse = ouverts.length ? `${ouverts.map((c) => c.nom).join(", ")} ${ouverts.length > 1 ? 'vont' : 'va'} de ${Math.min(...ouverts.map((c) => c.min))} à ${Math.max(...ouverts.map((c) => c.max))}.` : null;

  // 2. L'échelle 50–100 : paliers partiel 50, proche 65, très proche 80.
  const P = (v: number) => ((Math.max(50, Math.min(100, v)) - 50) / 50) * 86 + 2;

  // 3. Arômes face au style.
  const attendues = sc.order.filter((f) => sc.families[f].status === 'attendue');
  const niveaux = (h: HoublonLu) => Object.fromEntries(FAMILIES.map((f) => [f, NIV[h.familles[f].niveau]])) as Record<FamilyId, 0 | 1 | 2>;
  const inconnues = FAMILIES.filter((f) => faces.every((x) => x.h.familles[f].niveau === 'non décrit'));
  const horsStyle = FAMILIES.filter((f) => !attendues.includes(f) && !inconnues.includes(f));
  const ligneArome = (f: FamilyId, att: boolean) => (
    <div key={f} className={`pq-substituer-lg ${att ? 'pq-substituer-att' : ''}`} data-statut-style={att ? 'attendue' : 'neutre'} style={{ gridTemplateColumns: `1fr repeat(${faces.length}, 4.25rem)` }}>
      <span className="pq-substituer-lg-nom"><Picto famille={f} taille={14} />{COURT[f]}</span>
      {faces.map((x) => {
        const d = x.h.familles[f], n = NIV[d.niveau];
        return (
          <span key={x.cle} className={`pq-substituer-crans ${n ? '' : 'pq-substituer-nd'}`} style={{ ['--c' as string]: x.couleur }} data-role="arome" data-col={x.cle}
            data-houblon={x.nom} data-famille-fiche={f} data-niveau={n} data-sources={d.fiches} data-de={d.sur} title={`${x.nom}, ${COURT[f]} : ${d.niveau} (${d.fiches}/${d.sur})`}>
            <i className={n >= 1 ? 'pq-substituer-on' : ''} /><i className={n >= 2 ? 'pq-substituer-on' : ''} />
          </span>
        );
      })}
    </div>
  );

  // 4. Mesures par source.
  const M = Object.fromEntries(faces.map((x) => [x.cle, mesures(x.h)]));
  const domaine = (rs: Intervalle[], pad: number): Intervalle => {
    if (!rs.length) return [0, 1];
    const lo = Math.min(...rs.map((r) => r[0])), hi = Math.max(...rs.map((r) => r[1]));
    return [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)];
  };
  const domA = domaine(faces.flatMap((x) => [...M[x.cle].alpha.src.map((s) => s.r), ...(M[x.cle].alpha.lot ? [[M[x.cle].alpha.lot!.v, M[x.cle].alpha.lot!.v] as Intervalle] : [])]), 1.5);
  const domB = domaine(faces.flatMap((x) => M[x.cle].beta.src.map((s) => s.r)), 1);
  const HUILES = [['myrcene', 'Myrcène'], ['humulene', 'Humulène'], ['caryophyllene', 'Caryophyllène'], ['linalool', 'Linalol']] as const;
  const domH = (k: (typeof HUILES)[number][0]) => {
    const rs = faces.map((x) => M[x.cle].huiles[k]).filter((r): r is Intervalle => !!r);
    if (!rs.length) return [0, 1] as Intervalle;
    const lo = Math.min(...rs.map((r) => r[0])), hi = Math.max(...rs.map((r) => r[1]));
    const pad = Math.max(0.2, (hi - lo) * 0.35);
    return [Math.max(0, Math.round((lo - pad) * 10) / 10), Math.round((hi + pad) * 10) / 10] as Intervalle;
  };
  const sansSource = faces.filter((x) => M[x.cle].alpha.src.length === 1).map((x) => x.nom);
  const sousPlage = faces.filter((x) => { const l = M[x.cle].alpha.lot; const s = M[x.cle].alpha.src; return l && s.length && l.v < Math.min(...s.map((y) => y.r[0])); });
  const surPlage = faces.filter((x) => { const l = M[x.cle].alpha.lot; const s = M[x.cle].alpha.src; return l && s.length && l.v > Math.max(...s.map((y) => y.r[1])); });
  const aPlageDose = faces.filter((x) => !x.original && x.dose && x.dose.min !== x.dose.max);
  const huileInconnue = faces.flatMap((x) => HUILES.filter(([k]) => !M[x.cle].huiles[k]).map(([, n]) => `${n} de ${x.nom}`));

  // 5. Relation au style.
  const nomsAtt = attendues.map((f) => COURT[f].toLowerCase());
  const relation = (x: Face): ReactNode => {
    const n = niveaux(x.h);
    const cites = attendues.filter((f) => n[f] > 0), marques = attendues.filter((f) => n[f] === 2);
    const m = M[x.cle];
    // « stout citée » est la phrase de la maquette (S1) ; pour une autre recette, le nom de SON style (jamais la stout d'un autre cas).
    const cible = T.biere === 'stout' ? 'stout' : sc.name.toLowerCase();
    const stout = m.styles.some((s) => s.toLowerCase().includes(cible));
    const emploi = m.styles.length
      ? <> Employé en <span data-role="styles-usage" data-houblon={x.nom}>{m.styles.join(', ')}</span>{m.stylesSource ? ` (${m.stylesSource})` : ''}&nbsp;; {T.biere === 'stout' ? (stout ? 'stout citée.' : 'aucune stout citée.') : (stout ? `${sc.name} cité.` : `${sc.name} non cité.`)}</>
      : <> Aucun style d’emploi dans le dépôt.</>;
    const mots = m.mots.length ? <> <span data-role="descripteurs" data-houblon={x.nom}>{m.mots.join(', ')}</span> ({m.motsSource}).</> : null;
    if (x.original) {
      const dit = cites.length === attendues.length ? `cite ${attendues.length === 3 ? 'les trois' : 'toutes'}` : cites.length ? `cite ${liste(cites.map((f) => COURT[f].toLowerCase()))}` : `ne cite aucune des ${attendues.length}`;
      return <><b>{x.nom}</b> {dit}{marques.length ? ` (${liste(marques.map((f) => COURT[f].toLowerCase()))} marqué${marques.length > 1 ? 's' : ''})` : ''}.{emploi}</>;
    }
    const perd = attendues.filter((f) => n[f] === 0);
    const dit = !cites.length ? `ne cite aucune des ${attendues.length === 3 ? 'trois' : attendues.length}.`
      : `garde ${liste(cites.map((f) => `${COURT[f].toLowerCase()} (${x.h.familles[f].niveau})`))}${perd.length ? `, perd ${liste(perd.map((f) => COURT[f].toLowerCase()))}` : ''}.`;
    return <><b>{x.nom}</b> {dit}{mots}{emploi}</>;
  };

  // 6. Ma bière avec chacun (D75) : familles attendues, puis celles hors du style dans ma bière.
  const clesBiere = [...attendues, ...FAMILIES.filter((f) => biere0.profil[f].horsStyle)].filter((f, k, t) => t.indexOf(f) === k).slice(0, 4);
  // Les familles de sa stout à côté de chaque score (D127) : les attendues du style, puis celles hors style dans la
  // recette inscrite (la stout : résineux), quatre au plus.
  const colsAro = [...attendues, ...FAMILIES.filter((f) => biereInscrite.profil[f].horsStyle && !attendues.includes(f))].slice(0, 4);
  // Au whirlpool et au dry hop, le premier se dit aussi par les familles de sa stout (D127 : l'arôme répond).
  const premier = tete[0] ?? cands[0] ?? null;
  const aromeTete = (() => {
    if (!premier) return null;
    const n0 = (f: FamilyId) => NIV[h0.familles[f].niveau], n1 = (f: FamilyId) => NIV[premier.h.familles[f].niveau];
    const garde = colsAro.filter((f) => n0(f) > 0 && n1(f) > 0), perd = colsAro.filter((f) => n0(f) > 0 && n1(f) === 0);
    const mot = (fs: FamilyId[]) => liste(fs.map((f) => COURT[f].toLowerCase()));
    return `${premier.nom} ${garde.length ? `garde ${mot(garde)}` : 'ne garde aucune de ses familles'}${perd.length ? `, perd ${mot(perd)}` : ''} (fiches).`;
  })();


  const remplacerPar = () => {
    if (!choisi) return;
    gestes.remplacer('brouillon', ajout.id, choisi.cle);
    gestes.dose('brouillon', ajout.id, choisi.dose!.grams);
    noterAvant(inscrite);
    // L'app peut refuser (porte unique) : l'outil reste alors ouvert, l'erreur est dite par l'hôte.
    if (gestes.inscrire() === false) return;
    revenirMaBiere();
  };
  // D130 : ce que chaque houblon du face à face est seul à avoir, hors des familles (ses fiches, jamais inventé) : les mots
  // qu'aucune famille ne range et qu'aucun des autres comparés ne cite. C'est là qu'on voit ce qu'on perd ou gagne.
  const HORS = Object.fromEntries(faces.map((x) => [x.cle, motsHors(x.cle)]));
  const horsDe = (k: string): ReactNode => {
    const m = HORS[k];
    if (!m.hors.length) return <>hors familles&#8239;: <span className="pq-substituer-hors-rien">aucun mot dans ses fiches</span></>;
    const autres = faces.filter((y) => y.cle !== k).map((y) => HORS[y.cle].tous);
    const seul = m.hors.filter((w) => !autres.some((t) => t.has(w.mot)));
    if (!seul.length) return <>lui seul&#8239;: <span className="pq-substituer-hors-rien">rien, ses mots ({liste(m.hors.slice(0, 2).map((w) => w.mot))}) sont aussi chez les autres</span></>;
    return <>lui seul&#8239;: <b>{seul.slice(0, 4).map((w) => w.mot).join(', ')}</b>{seul.length > 4 ? ` +${seul.length - 4}` : ''}</>;
  };
  // D130 bis (« ajouter des La matrice nettoyée flb5b · de flb5 sur les arômes hors 16d + les huiles ») : deux matrices de la
  // grammaire de flb5b. Colonnes : Nugget, puis ses remplaçants (les deux du face à face, puis la tête de l'échelle), 5 au
  // plus. Lignes : ses mots hors familles (ses fiches), puis ceux des remplaçants qu'il n'a pas ; un seul gris, un point
  // plein si toutes ses fiches le citent, petit sinon, vide s'il n'est pas cité. Puis les huiles : plages des fiches, « ? ».
  const colsM = [cle, ...compares, ...cands.map((c) => c.cle)].filter((k, i, t) => t.indexOf(k) === i).slice(0, 5);
  const HM = Object.fromEntries(colsM.map((k) => [k, HORS[k] ?? motsHors(k)]));
  const surDe = (k: string) => houblon(k).familles.citrus.sur;
  const nomCol = (k: string) => (k === cle ? h0.nom : cands.find((c) => c.cle === k)?.nom ?? houblon(k).nom);
  const scoreCol = (k: string) => { const c = cands.find((x) => x.cle === k); return c ? (c.min === c.max ? `${c.min}` : `${c.min}–${c.max}`) : null; };
  const motsM = (() => {
    const vus = new Map<string, number>();
    for (const k of colsM) for (const w of HM[k].hors) if (!vus.has(w.mot)) vus.set(w.mot, colsM.indexOf(k));
    const cite = (k: string, m: string) => HM[k].hors.find((w) => w.mot === m) ?? null;
    return [...vus.entries()]
      .map(([m, i]) => ({ m, i, n: colsM.filter((k) => HM[k].tous.has(m)).length, f0: cite(cle, m)?.fiches ?? 0 }))
      .sort((a, b) => a.i - b.i || b.f0 - a.f0 || b.n - a.n || a.m.localeCompare(b.m, 'fr'));
  })();
  const MAX_MOTS = 9;
  const seulNugget = HM[cle].hors.filter((w) => !colsM.slice(1).some((k) => HM[k].tous.has(w.mot)));
  const gM = { gridTemplateColumns: `1fr repeat(${colsM.length}, 2.6rem)` };
  const enteteM = (titre: string) => (
    <div className="pq-substituer-mx-l pq-substituer-mx-tete" style={gM}>
      <span className="pq-substituer-mx-titre">{titre}</span>
      {colsM.map((k) => (
        <span key={k} className={`pq-substituer-mx-col ${k === cle ? 'pq-substituer-mx-lui' : ''}`}>
          <span className="pq-substituer-mx-nom" data-houblon-col={k}>{nomCol(k)}</span>
          {scoreCol(k) && <small>{scoreCol(k)}</small>}
        </span>
      ))}
    </div>
  );
  const matrices = (
    <section className="pq-substituer-mx" data-role="matrices" aria-label={`Mots hors familles et huiles : ${liste(colsM.map(nomCol))}`}>
      <p className="pq-substituer-mx-bandeau" data-role="hors-16d" data-houblon={cle}>
        {seulNugget.length ? <>{h0.nom} seul&#8239;: <b>{seulNugget.slice(0, 4).map((w) => w.mot).join(', ')}</b></>
          : HM[cle].hors.length ? <>{h0.nom} seul&#8239;: <span className="pq-substituer-hors-rien">rien, ses mots hors familles sont aussi chez eux</span></>
            : <>{h0.nom}&#8239;: <span className="pq-substituer-hors-rien">aucun mot hors familles dans ses fiches</span></>}
      </p>
      <div className="pq-substituer-mx-cadre">
        {enteteM('hors familles')}
        {motsM.slice(0, MAX_MOTS).map((r) => (
          <div key={r.m} className="pq-substituer-mx-l" style={gM} data-role="mot-hors" data-mot={r.m}>
            <span className={`pq-substituer-mx-mot ${r.f0 ? 'pq-substituer-mx-sien' : ''}`}>{r.f0 ? <i className="pq-substituer-mx-losange" aria-hidden="true" /> : null}{r.m}</span>
            {colsM.map((k) => {
              const w = HM[k].hors.find((x) => x.mot === r.m);
              const sur = surDe(k);
              const plein = !!w && w.fiches >= Math.max(1, Math.ceil(sur / 2));
              return (
                <span key={k} className={`pq-substituer-mx-c ${k === cle ? 'pq-substituer-mx-lui' : ''}`} data-col-mot={k} data-fiches={w?.fiches ?? 0} data-sur={sur}>
                  {w ? <i className={plein ? 'pq-substituer-mx-pt' : 'pq-substituer-mx-pt pq-substituer-mx-pt-petit'} aria-label={`cité par ${w.fiches} fiche${w.fiches > 1 ? 's' : ''} sur ${sur}`} /> : HM[k].tous.has(r.m) ? <i className="pq-substituer-mx-classe" aria-label="cité, rangé dans une famille" /> : null}
                  {k === cle && w ? <small>{w.fiches}/{sur}</small> : null}
                </span>
              );
            })}
          </div>
        ))}
        {motsM.length > MAX_MOTS && <p className="pq-substituer-note pq-substituer-mx-plus">+{motsM.length - MAX_MOTS} autres mots, moins cités.</p>}
        {enteteM('huiles')}
        {LIGNES_HUILE.map((l) => (
          <div key={l.id} className="pq-substituer-mx-l" style={gM} data-role="huile-matrice" data-huile={l.id}>
            <span className="pq-substituer-mx-mot">{l.nom} <span className="pq-substituer-gris">{l.unite}</span></span>
            {colsM.map((k) => {
              const r = huilesDe(k)[l.id];
              return (
                <span key={k} className={`pq-substituer-mx-c pq-substituer-mx-v ${k === cle ? 'pq-substituer-mx-lui' : ''}`} data-col-huile={k} data-min={r?.[0] ?? ''} data-max={r?.[1] ?? ''}>
                  {r ? plage(r[0], r[1], 1) : <span className="pq-substituer-gris" title="aucune fiche ne la donne, ce n’est pas zéro">?</span>}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="pq-substituer-note">Points&#8239;: cité par ses fiches (gros&#8239;: la moitié au moins), cercle&#8239;: le mot est rangé dans une famille chez lui. <b>?</b>&#8239;: aucune fiche ne donne la valeur, ce n’est pas zéro. Huiles en % de l’huile (Beer Maverick, Hopsteiner, dépôt).</p>
    </section>
  );
  // D130 bis : au dry hop, le tableau des arômes de u4e5 au premier écran, dans u4 enrichi (« Très bien »).
  const tableauAuFroid = froid && (VARIANTE === null || VARIANTE === 'u4e5');
  const avecMatrices = VARIANTE === null;
  const aAcheter = faces.find((x) => !x.original && x.stock !== 'suffisant') ?? null;
  const ibu0 = ibuAjout(ajout, b.recette).ibu;
  const grille = { gridTemplateColumns: `1fr repeat(${faces.length}, 4.25rem)` };
  // « + » de Comparer (u4 enrichi) ou case à cocher (u4e4), et la pilule « Comparer (n) › ».
  const plusComparer = (c: Candidat, envoye: boolean) => VARIANTE === 'u4e4' ? (
    <button type="button" role="checkbox" className="pq-substituer-coche" data-role="ajout-comparer" data-houblon-comparer={c.cle} aria-checked={envoye}
      aria-label={`Comparer ${c.nom} avec ${h0.nom}`} onClick={() => gestes.basculerComparaison(c.cle)}>
      <span aria-hidden="true">{envoye ? '✓' : ''}</span>
    </button>
  ) : (
    <button type="button" className="pq-substituer-plus" data-role="ajout-comparer" data-houblon-comparer={c.cle} aria-pressed={envoye}
      aria-label={envoye ? `Retirer ${c.nom} de Comparer` : `Ajouter ${c.nom} à Comparer`} onClick={() => gestes.basculerComparaison(c.cle)}>
      {/* Le signe est dessiné, pas écrit : « + » et « ✓ » ne sont pas des mots du premier écran. */}
      <span aria-hidden="true"><svg className="pq-substituer-ico-plus" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg><svg className="pq-substituer-ico-ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </button>
  );
  const piluleComparer = (
    <button type="button" className="pq-substituer-vers-comparer" data-role="pont-comparer-substituer" disabled={!envoyes.length} onClick={versComparer}
      aria-label={envoyes.length ? `Comparer ${liste([h0.nom, ...envoyes.map((k) => houblon(k).nom)])}` : `Comparer : touche + sur un remplaçant`}>
      Comparer{envoyes.length ? ` (${envoyes.length + 1})` : ''}<svg className="pq-substituer-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
  // u4e3 (passe 2, rejet du critique : D98, D94, deux réponses sur un écran) : une seule réponse. Le titre lit la tête
  // de l'échelle au moment choisi (les meilleurs sans inconnue, sinon le premier rang, rangé par le pire cas) et dit,
  // arôme d'abord, ce qu'ils gardent et perdent des familles de sa stout ; le score suit en gris.
  const titreArome = (() => {
    const tetes = (tete.length ? tete : cands.slice(0, 1)).slice(0, 2);
    if (!tetes.length) return 'Aucun remplaçant.';
    const n0 = (f: FamilyId) => NIV[h0.familles[f].niveau];
    const garde = (h: HoublonLu) => colsAro.filter((f) => n0(f) > 0 && NIV[h.familles[f].niveau] > 0);
    const perd = (h: HoublonLu) => colsAro.filter((f) => n0(f) > 0 && NIV[h.familles[f].niveau] === 0);
    const mot = (fs: FamilyId[]) => liste(fs.map((f) => COURT[f].toLowerCase()));
    const [a, b2] = tetes;
    const ga = garde(a.h), pa = perd(a.h);
    const premiere = `${a.nom} ${ga.length ? `garde ${mot(ga)}` : 'ne garde aucune famille'} de ta ${T.biere}${!b2 && pa.length ? `, perd ${mot(pa)}` : ''}`;
    if (!b2) return `${premiere}.`;
    const gb = garde(b2.h);
    return `${premiere} ; ${b2.nom}, ${gb.length ? mot(gb) : 'aucune'}.`;
  })();
  // u4e5 : au dry hop, le tableau « Arômes 16D » à côté des scores : une ligne par remplaçant, une colonne par famille
  // (attendues en gras sur fond gris, puis hors style), 2 crans, pointillé = non décrit ; le score au bout.
  const famsT = [...attendues, ...FAMILIES.filter((f) => !attendues.includes(f) && [h0, ...cands.map((c) => c.h)].some((h) => h.familles[f].niveau !== 'non décrit'))];
  const nulle = FAMILIES.filter((f) => !famsT.includes(f));
  const gT = { gridTemplateColumns: `5.75rem repeat(${famsT.length}, 15px) 1fr` };
  const cellules = (h: HoublonLu) => famsT.map((f) => {
    const n = NIV[h.familles[f].niveau];
    return (
      <span key={f} className={`pq-substituer-tf-c ${attendues.includes(f) ? 'pq-substituer-tf-att' : ''} ${n ? '' : 'pq-substituer-mc-nd'}`} style={{ ['--c' as string]: COULEURS[f].base }}
        data-role="arome-rang" data-famille-rang={f} data-niveau={n} title={`${h.nom}, ${COURT[f]} : ${h.familles[f].niveau}`}>
        <i className={n >= 1 ? 'pq-substituer-mc-on' : ''} /><i className={n >= 2 ? 'pq-substituer-mc-on' : ''} />
      </span>
    );
  });
  const tableauFroid = (
    <section className="pq-substituer-tf" data-etat="etat-subst-echelle" aria-label={`Remplaçants de ${h0.nom} ${moment}, leurs arômes face au ${sc.code}`}>
      <div className="pq-substituer-l pq-substituer-tf-tete">
        <div className="pq-substituer-tf-r" style={gT}>
          <span className="pq-substituer-tf-t">Arômes <span className="pq-substituer-gris">{sc.code}</span></span>
          {famsT.map((f) => <span key={f} className={`pq-substituer-tf-p ${attendues.includes(f) ? 'pq-substituer-tf-att' : ''}`}><PictoEnLigne famille={f} taille={14} /></span>)}
          <span className="pq-substituer-tf-s">score</span>
        </div>
        <span className="pq-substituer-legende"><Legende>
          <p><b>Une ligne par remplaçant</b>&#8239;: ses arômes dans les fiches, famille par famille, attendues en {sc.code} sur fond gris. Deux crans&#8239;: cité, marqué&#8239;; pointillé&#8239;: non décrit, ce n’est pas zéro.</p>
          <p><b>Le score</b>, {moment}&#8239;: surtout l’arôme (poids {nombre(lecture.poids.arome, 1)}). Une plage hachurée&#8239;: une composante inconnue, ouverte de 0 à 100.</p>
          <p><b>Toucher un nom</b>&#8239;: il passe au face à face&#8239;; appui long&#8239;: sa fiche. <b>+</b>&#8239;: il part à Comparer, avec {h0.nom}.</p>
        </Legende></span>
      </div>
      <div className="pq-substituer-l" data-role="original-rang">
        <div className="pq-substituer-tf-r pq-substituer-r-orig" style={gT} {...fiche.appui(cle)}>
          <span className="pq-substituer-nom"><IconeStock etat={stockOriginal(h0, b.recette)} /><span {...fiche.nom(cle)}>{h0.nom}</span></span>
          {cellules(h0)}
          <span className="pq-substituer-tf-s pq-substituer-gris">l’original</span>
        </div>
        <span />
      </div>
      <div data-libre="houblon" role="group" aria-label={`Remplaçants de ${h0.nom}`}>
        {cands.map((c) => {
          const col = couleurDe(c.cle), compare = compares.includes(c.cle), envoye = aComparer.includes(c.cle);
          return (
            <div key={c.cle} className="pq-substituer-l">
              <div role="button" tabIndex={0} aria-pressed={compare} data-remplacant={c.cle} data-houblon-rang={c.nom} data-min={c.min} data-max={c.max}
                title={`${c.nom} : ${c.min === c.max ? c.min : `${c.min} à ${c.max}`} (moteur ${c.moteur})`}
                className={`pq-substituer-tf-r pq-substituer-r ${c.cle === choix ? 'pq-substituer-r-choisi' : ''}`} style={{ ...gT, ['--c' as string]: col, ['--ct' as string]: SLOTS_TEXTE[col] ?? col }}
                {...fiche.appui(c.cle, () => toucher(c.cle))}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toucher(c.cle); } }}>
                <span className="pq-substituer-nom"><IconeStock etat={c.stock} /><span data-houblon-nom={c.nom} {...fiche.nom(c.cle)}>{c.nom}</span></span>
                {cellules(c.h)}
                <span className="pq-substituer-tf-s">{c.min === c.max
                  ? <><i className="pq-substituer-tf-pt" /><b>{c.min}</b></>
                  : <span className="pq-substituer-tf-pl"><b>{c.min}–{c.max}</b></span>}</span>
              </div>
              {plusComparer(c, envoye)}
            </div>
          );
        })}
      </div>
      <div className="pq-substituer-cle-l">
        <p className="pq-substituer-cle" data-etat="etat-subst-plage">
          {nulle.length > 0 && <span>{nulle.map((f) => COURT[f]).join(', ')}&#8239;: aucune fiche ne les décrit, ce n’est pas zéro.</span>}
        </p>
        {piluleComparer}
      </div>
    </section>
  );

  // À 60′, l'α suit les bandes (u4) ; au whirlpool et au dry hop, le tableau des arômes répond d'abord (D127).
  const blocAlpha = (
    <div className="pq-substituer-mesure" data-etat="etat-subst-alpha"><span className="pq-substituer-t">α</span>
      <div>{faces.map((x) => <Rangee key={x.cle} dom={domA} nom={x.nom} couleur={x.couleur} src={M[x.cle].alpha.src.map((s) => s.r)} lot={M[x.cle].alpha.lot} mesure="alpha" />)}</div>
    </div>
  );

  const pied = (
    <PiedAnnuler resume={choisi && choisi.dose ? (
      <span data-role="choix-dock" className="pq-substituer-dock">{nombre(ajout.grams, 1)} g de {h0.nom}{deplace ? ` ${aMoment(q0)}` : ''} <svg className="pq-substituer-fleche" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M9 4.5L12.5 8 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="sr-only">remplacés par</span> <b className="font-semibold text-cave-50">{nombre(choisi.dose.grams, 1)} g de {choisi.nom}{deplace ? ` ${moment}` : ''}</b></span>
    ) : undefined}>
      <Pont nom="remplacer" disabled={!choisi} onClick={remplacerPar}>Remplacer</Pont>
    </PiedAnnuler>
  );

  return (
    <CadreOutil ecran="substituer" question={h0.nom}
      // u4e4 : la barre « Comparer (n) › » au-dessus du pied ; sinon le pied seul, comme u4 enrichi.
      dock={VARIANTE === 'u4e4' ? <div className="pq-substituer-dock-pile">
        {VARIANTE === 'u4e4' && envoyes.length > 0 && (
          <button type="button" className="pq-substituer-barre-cmp" data-role="pont-comparer-substituer" onClick={versComparer}>
            <span>Comparer {liste([h0.nom, ...envoyes.map((k) => houblon(k).nom)])}</span><b>({envoyes.length + 1}) ›</b>
          </button>
        )}
        {pied}
      </div> : pied}>
      <div className="pq-substituer" data-u4e={VARIANTE ?? undefined}>

        {VARIANTE === 'u4e1' ? (
          <div className="pq-substituer-frise" role="radiogroup" aria-label={`Moment des remplaçants de ${h0.nom}, sur le brassin : ${moment}`} data-contexte="moment" data-role="puce-moment" data-etat="etat-subst-repos">
            <span className="pq-substituer-frise-trait" aria-hidden="true"><i /><i /></span>
            <span className="pq-substituer-frise-ferm">fermentation</span>
            {moments.map((m) => (
              <button key={m.cle} type="button" role="radio" aria-checked={m.cle === cleLue} data-moment={m.cle} onClick={() => choisirMoment(m)}
                className={`pq-substituer-frise-st ${m.cle === cleLue ? 'pq-substituer-frise-on' : ''}`}>
                <i aria-hidden="true" /><span>{m.cle === 'chaud' ? `ébullition ${m.mot}` : m.mot}</span>{m.cle === cleMoment(q0) && <small>ta recette</small>}
              </button>
            ))}
          </div>
        ) : <div className="pq-substituer-moments" role="radiogroup" aria-label={`Moment des remplaçants de ${h0.nom} : ${moment}`} data-contexte="moment" data-role="puce-moment" data-etat="etat-subst-repos">
          {moments.map((m) => (
            <button key={m.cle} type="button" role="radio" aria-checked={m.cle === cleLue} data-moment={m.cle} onClick={() => choisirMoment(m)}
              className={`pq-substituer-moment ${m.cle === cleLue ? 'pq-substituer-moment-on' : ''}`}>
              {m.mot}{m.cle === cleMoment(q0) && <span className="pq-substituer-moment-r" aria-label="(ta recette)">recette</span>}
            </button>
          ))}
        </div>}
        {deplace && (
          <p className="pq-substituer-effet" data-role="moment-effet">
            <b>{Moment}, l’arôme fait le score.</b>{' '}
            {h0.nom} {moment}&#8239;: ta {T.biere} passerait de {nombre(ibuInscrit, 1)} à {nombre(biere0.ibu.valeur, 1)}&nbsp;IBU&#8239;; chaque remplaçant {froid ? 'à masse égale' : 'à IBU égal'}.
          </p>
        )}

        {VARIANTE === 'u4e3' ? (
          <section className="pq-substituer-reponse" data-role="reponse">
            <strong data-role="reponse-aromes">{titreArome}</strong>
            <span>{reponse}{sousReponse ? ` ${sousReponse}` : ''}</span>
          </section>
        ) : <section className="pq-substituer-reponse" data-role="reponse">
          <strong>{reponse}</strong>
          {sousReponse && <span>{sousReponse}</span>}
          {!amertume && aromeTete && <span data-role="reponse-aromes">{aromeTete}</span>}
        </section>}

        {tableauAuFroid ? <>{tableauFroid}{avecMatrices && matrices}</> : <>
        <section className="pq-substituer-echelle" data-etat="etat-subst-echelle" aria-label={`Ressemblance à ${h0.nom}, de 50 à 100, rangée par le pire cas`}>
          <div className="pq-substituer-paliers">
            <span className="pq-substituer-mc pq-substituer-mc-tete" aria-label={`Familles de ta ${sc.code} : ${colsAro.map((f) => COURT[f]).join(', ')}`}>
              {colsAro.map((f, i) => <span key={f} className={`pq-substituer-mc-f ${i > 0 && attendues.includes(colsAro[i - 1]) && !attendues.includes(f) ? 'pq-substituer-mc-hors' : ''}`}><PictoEnLigne famille={f} taille={16} /></span>)}
            </span>
            <span className="pq-substituer-paliers-t">
              {([[50, 'partiel'], [65, 'proche'], [80, 'très proche']] as const).map(([v, t]) => <span key={v} style={{ left: `${P(v)}%` }}>{t}</span>)}
            </span>
            <span className="pq-substituer-legende"><Legende>
              <p><b>Toucher un nom</b>&#8239;: il passe au face à face et devient le remplaçant&#8239;; appui long&#8239;: sa fiche. <b>+</b>&#8239;: il part à Comparer, avec {h0.nom}.</p>
              <p><b>Sous le nom</b>&#8239;: ses arômes dans les fiches, pour {liste(attendues.map((f) => COURT[f].toLowerCase()))} (attendus en {sc.code}){colsAro.length > attendues.length ? <>, puis {liste(colsAro.slice(attendues.length).map((f) => COURT[f].toLowerCase()))}, hors style dans ta stout</> : null}. Deux crans&#8239;: cité, marqué&#8239;; pointillé&#8239;: non décrit, ce n’est pas zéro.</p>
              <p><b>Un point</b>&#8239;: tout est connu. <b>Une plage hachurée</b>&#8239;: une composante inconnue, ouverte de 0 à 100.</p>
              <p><b>Icône</b>&#8239;: chariot à acheter, boîte pleine en stock qui suffit, boîte basse qui ne suffit pas, pointillée épuisé.</p>
            </Legende></span>
          </div>
          <div className="pq-substituer-rangs" data-libre="houblon" role="group" aria-label={`Remplaçants de ${h0.nom}`}>
            <div className="pq-substituer-fondp" style={{ left: `calc(var(--pq-n) + (100% - var(--pq-n) - var(--pq-g)) * ${P(80) / 100})`, right: 'var(--pq-g)', background: '#f2f2f2' }} />
            <div className="pq-substituer-fondp" style={{ left: `calc(var(--pq-n) + (100% - var(--pq-n) - var(--pq-g)) * ${P(65) / 100})`, width: `calc((100% - var(--pq-n) - var(--pq-g)) * ${(P(80) - P(65)) / 100})`, background: '#f9f9f9', borderLeft: '1px dashed #ddd' }} />
            <div className="pq-substituer-l" data-role="original-rang">
              <div className="pq-substituer-r pq-substituer-r-orig" {...fiche.appui(cle)}>
                <span className="pq-substituer-nb">
                  <span className="pq-substituer-nom"><IconeStock etat={stockOriginal(h0, b.recette)} /><span {...fiche.nom(cle)}>{h0.nom}</span></span>
                  <CransRang h={h0} familles={colsAro} attendues={attendues} />
                </span>
                <span className="pq-substituer-tr pq-substituer-orig-t">l’original</span>
              </div>
              {VARIANTE === 'u4e4' ? <span className="pq-substituer-coche-t">comparer</span> : <span />}
            </div>
            {cands.map((c) => {
              const col = couleurDe(c.cle), compare = compares.includes(c.cle), envoye = aComparer.includes(c.cle);
              return (
                <div key={c.cle} className="pq-substituer-l">
                  <div role="button" tabIndex={0} aria-pressed={compare} data-remplacant={c.cle} data-houblon-rang={c.nom} data-min={c.min} data-max={c.max}
                    data-etat={c.cle === premierLibre ? 'etat-subst-toucher-rang' : undefined}
                    title={`${c.nom} : ${c.min === c.max ? c.min : `${c.min} à ${c.max}`} (moteur ${c.moteur})`}
                    className={`pq-substituer-r ${c.cle === choix ? 'pq-substituer-r-choisi' : ''}`} style={{ ['--c' as string]: col, ['--ct' as string]: SLOTS_TEXTE[col] ?? col }}
                    {...fiche.appui(c.cle, () => toucher(c.cle))}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toucher(c.cle); } }}>
                    <span className="pq-substituer-nb">
                      <span className="pq-substituer-nom"><IconeStock etat={c.stock} /><span data-houblon-nom={c.nom} {...fiche.nom(c.cle)}>{c.nom}</span></span>
                      <CransRang h={c.h} familles={colsAro} attendues={attendues} />
                    </span>
                    <span className="pq-substituer-tr">
                      {c.min === c.max ? (
                        <><span className="pq-substituer-pt" role="img" aria-label="tout connu" style={{ left: `${P(c.min)}%` }} /><span className="pq-substituer-val" style={{ left: `calc(${P(c.min)}% + 10px)` }}><b>{c.min}</b></span></>
                      ) : (
                        <><span className="pq-substituer-pl" role="img" aria-label="plage, une composante inconnue" style={{ left: `${P(c.min)}%`, width: `${P(c.max) - P(c.min)}%` }} />
                          <span className="pq-substituer-val" style={{ left: `calc(${P(c.min)}% - 24px)` }}><b>{c.min}</b></span>
                          <span className="pq-substituer-val" style={{ left: `calc(${P(c.max)}% + 3px)` }}><b>{c.max}</b></span></>
                      )}
                    </span>
                  </div>
                  {plusComparer(c, envoye)}
                </div>
              );
            })}
          </div>
          <div className="pq-substituer-axe">{[50, 65, 80, 100].map((v) => <span key={v} style={{ left: `${P(v)}%` }}>{v}</span>)}</div>
        </section>
        <div className="pq-substituer-cle-l pq-substituer-cle-seule" data-etat="etat-subst-plage">
          {/* D129 (« être modéré avec les mots ») : la clé point / plage, redite de la légende « ? », passe au toucher ;
              chaque point et chaque plage portent leur mot (aria-label). */}
          {VARIANTE !== 'u4e4' && piluleComparer}
        </div>
        </>}

        <h2 className="pq-substituer-h2" data-etat="etat-subst-face">{VARIANTE === 'u4e3' ? <>Face à face <span className="pq-substituer-gris pq-substituer-h2-sous">doses {froid ? 'à masse égale' : 'à IBU égal'}</span></> : <>Face à face, {froid ? 'même masse' : 'même IBU'}</>}</h2>
        <div className="pq-substituer-bandes" role="radiogroup" aria-label={`À la place de ${h0.nom}`}>
          {faces.map((x) => {
            const plageDose = !x.original && x.dose && x.dose.min !== x.dose.max;
            return (
              <div key={x.cle} data-col={x.cle} data-houblon-compare={x.nom} style={{ ['--c' as string]: x.couleur }}
                className={`pq-substituer-bande ${!x.original && x.cle === choix ? 'pq-substituer-bande-choisie' : ''}`}
                {...(x.original ? { 'data-role': 'epingle', ...fiche.appui(x.cle) } : { role: 'radio', 'aria-checked': x.cle === choix, tabIndex: 0, ...fiche.appui(x.cle, () => setChoix(x.cle)), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setChoix(x.cle); } } })}>
                <span className="pq-substituer-bande-n"><span data-houblon={x.nom} {...fiche.nom(x.cle)}>{x.nom}</span> <IconeStock etat={x.stock} /></span>
                {VARIANTE === 'u4e3' ? (
                  <span className="pq-substituer-bande-d pq-substituer-bande-aro"><CransRang h={x.h} familles={colsAro} attendues={attendues} /></span>
                ) : <span className="pq-substituer-bande-d">
                  <b data-role="dose-remplacant" data-grammes={String(x.dose?.grams ?? '')}>{plageDose ? `${plage(x.dose!.min, x.dose!.max, 0)} g` : `${nombre(x.dose!.grams, 1)} g`}</b>
                  {plageDose && x.cle === choix && <small>{nombre(x.dose!.grams, 1)} g à α {nombre(x.h.alpha?.valeur ?? 0, 1)}</small>}
                  {x.original && (froid ? <small>à froid, sans IBU</small> : ibu0 && <small>{nombre(ibu0.valeur, 1)} IBU</small>)}
                </span>}
                <span className="pq-substituer-hors" data-role="hors-16d" data-houblon={x.cle}>{horsDe(x.cle)}</span>
                <span className="pq-substituer-bande-m"><Usage h={x.h} long />{VARIANTE === 'u4e3' ? (
                  <span className="pq-substituer-dose-discret"><b data-role="dose-remplacant" data-grammes={String(x.dose?.grams ?? '')}>{plageDose ? `${plage(x.dose!.min, x.dose!.max, 0)} g` : `${nombre(x.dose!.grams, 1)} g`}</b>{x.original ? (froid ? ' · sans IBU' : ibu0 ? ` · ${nombre(ibu0.valeur, 1)} IBU` : '') : ''}</span>
                ) : <PictosCites h={x.h} />}</span>
              </div>
            );
          })}
        </div>

        {amertume && blocAlpha}

        <section className="pq-substituer-aro" data-etat="etat-subst-aromes" aria-label={`Arômes des fiches, face au ${sc.code}`}>
          <div className="pq-substituer-tete" style={grille}>
            <span>Arômes <span className="pq-substituer-gris">{sc.code}</span></span>
            {faces.map((x) => <span key={x.cle} style={{ ['--c' as string]: x.couleur }}>{x.nom.split(' ')[0]}</span>)}
          </div>
          {attendues.map((f) => ligneArome(f, true))}
          {horsStyle.length > 0 && <div className="pq-substituer-groupe">Hors {sc.code}</div>}
          {horsStyle.map((f) => ligneArome(f, false))}
          <div className="pq-substituer-lg" style={grille} data-role="sans-famille">
            <span className="pq-substituer-lg-nom pq-substituer-gris">sans famille</span>
            {faces.map((x) => <span key={x.cle} className="pq-substituer-autres" data-role="autres" data-houblon={x.nom} data-part={x.h.partSansFamille ?? ''}>
              {x.h.partSansFamille == null ? '?' : <><i style={{ width: `${Math.max(3, Math.round(x.h.partSansFamille * 40))}px` }} />{Math.round(x.h.partSansFamille * 100)}&nbsp;%</>}
            </span>)}
          </div>
          {inconnues.length > 0 && <p className="pq-substituer-inc">{inconnues.map((f) => COURT[f]).join(', ')}&#8239;: aucune des {faces.length === 3 ? 'trois' : faces.length} fiches ne les décrit, ce n’est pas zéro.</p>}
          <p className="pq-substituer-note">Fiches lues&#8239;: {faces.map((x) => `${x.nom} ${x.h.familles.citrus.sur}`).join(', ')}. Pointillé&#8239;: non décrit.{amertume ? <> <b data-role="a-l-ebullition">{Moment}, surtout l’amertume</b>&#8239;: ces arômes partent en grande partie à l’ébullition.</> : null}</p>
        </section>

        {avecMatrices && !tableauAuFroid && matrices}

        <section data-etat="etat-subst-radar">
          <div className="pq-substituer-graphe">
            <RadarU4 series={faces.map((x) => ({ cle: x.cle, nom: x.nom, couleur: x.couleur, original: x.original, niveaux: niveaux(x.h) }))} retenu={choisi?.cle} attendues={new Set(attendues)} inconnues={new Set(inconnues)} nomStyle={sc.code} />
          </div>
          <p className="pq-substituer-legende-radar">
            {faces.map((x) => <span key={x.cle}><i style={x.original ? { background: '#fff', border: `2.5px solid ${x.couleur}` } : { background: x.couleur }} />{x.nom}{x.original ? ' (l’original, contour seul)' : ''}</span>)}
            <span>gras&#8239;: attendu en {sc.code}</span>
          </p>
          <p className="pq-substituer-note">Du centre vers le bord&#8239;: non décrit, cité, marqué. <b>?</b>&#8239;: aucune des {faces.length === 3 ? 'trois' : faces.length} fiches ne décrit la famille, ce n’est pas zéro.</p>
        </section>

        {!amertume && blocAlpha}

        <div className="pq-substituer-mesure" data-etat="etat-subst-beta"><span className="pq-substituer-t">β</span>
          <div>{faces.map((x) => <Rangee key={x.cle} dom={domB} nom={x.nom} couleur={x.couleur} src={M[x.cle].beta.src.map((s) => s.r)} mesure="beta" />)}</div>
        </div>
        <p className="pq-substituer-note">
          α et β&#8239;: traits fins, une source chacun (Beer Maverick, Hopsteiner)&#8239;; trait noir, milieu moyen des sources
          {aPlageDose.length ? <>&#8239;; plage de dose de {liste(aPlageDose.map((x) => `${x.nom} selon son α (${plage(M[x.cle].alpha.src[0]?.r[0] ?? 0, M[x.cle].alpha.src[0]?.r[1] ?? 0)})`))}</> : null}.
          {sousPlage.map((x) => <> L’{M[x.cle].alpha.lot!.origine === 'article' ? 'article' : 'lot'} de {x.nom} ({fr(M[x.cle].alpha.lot!.v)}) est sous sa plage variétale&#8239;: la dose de {nombre(x.dose!.grams, 1)}&nbsp;g en tient compte.</>)}
          {surPlage.map((x) => <> Le lot de {x.nom} ({fr(M[x.cle].alpha.lot!.v)}) est au-dessus de sa plage variétale&#8239;: la dose de {nombre(x.dose!.grams, 1)}&nbsp;g en tient compte.</>)}
          {sansSource.length ? <> {liste(sansSource)}&#8239;: une seule source{faces.filter((x) => sansSource.includes(x.nom) && !M[x.cle].alpha.lot).length ? ', pas de lot' : ''}.</> : null}
        </p>

        <section data-etat="etat-subst-huiles">
          <h2 className="pq-substituer-h2 pq-substituer-h2-petit">Huiles, composants <span className="pq-substituer-gris">% de l’huile</span></h2>
          {HUILES.map(([k, n]) => (
            <div key={k}>
              <div className="pq-substituer-groupe">{n}</div>
              {faces.map((x) => { const r = M[x.cle].huiles[k]; return <Rangee key={x.cle} dom={domH(k)} nom={x.nom} couleur={x.couleur} src={r ? [r] : []} mesure={n} />; })}
            </div>
          ))}
          <p className="pq-substituer-note">{huileInconnue.length ? `${liste(huileInconnue)} non renseigné${huileInconnue.length > 1 ? 's' : ''}, ce n’est pas zéro. ` : ''}Farnésène publié par Beer Maverick, non importé.</p>
        </section>

        <section className="pq-substituer-style" data-etat="etat-subst-style">
          <p style={{ ['--c' as string]: GRIS_ORIGINAL }}><b data-role="style" data-code={sc.code}>{sc.code} {sc.name}</b> attend {nomsAtt.join(", ")}
            {biere0.bandeIbu ? <>&#8239;; IBU {plage(biere0.bandeIbu[0], biere0.bandeIbu[1], 0)}, la recette est à {nombre(biere0.ibu.valeur, 1)} et chaque dose la garde.</> : '.'}</p>
          {faces.map((x) => <p key={x.cle} style={{ ['--c' as string]: x.couleur }}>{relation(x)}</p>)}
        </section>

        <section className="pq-substituer-biere" data-role="ma-biere-avec" aria-label="Ma bière avec chacun">
          <div className="pq-substituer-biere-tete">
            <h2 className="pq-substituer-h2 pq-substituer-h2-petit">Ma bière avec chacun <span className="pq-substituer-gris">~ simulé</span></h2>
            <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          </div>
          <div className="pq-substituer-tete" style={grille}>
            <span />
            {faces.map((x) => <span key={x.cle} style={{ ['--c' as string]: x.couleur }}>{x.nom.split(' ')[0]}</span>)}
          </div>
          {clesBiere.map((f) => (
            <div key={f} className="pq-substituer-lg pq-substituer-lg-biere" style={grille} data-famille-ligne={f}>
              <span className="pq-substituer-lg-nom"><Picto famille={f} taille={14} />{COURT[f]}</span>
              {faces.map((x) => {
                const v = x.biere.profil[f], a = biere0.profil[f];
                const d = v.valeur && a.valeur ? v.valeur.centre - a.valeur.centre : null;
                return (
                  <span key={x.cle} className="pq-substituer-mb">
                    <MiniBarre x={v} avant={x.original ? undefined : a} echelle={echelle} />
                    <span className="pq-substituer-mb-e">
                      {x.original ? (v.horsStyle === 'au-dessus' ? <span className="text-alert">hors style</span> : null)
                        : d == null ? <Inconnu raison={v.raison ?? 'inconnu'} /> : Math.abs(d) >= 0.5 ? <Simule valeur={d} ecart couleur={COULEURS[f].texte} /> : <span className="pq-substituer-gris">=</span>}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
          <p className="pq-substituer-note">Après le remplacement, {moment}, {froid ? 'à masse égale' : 'à IBU égal'}&#8239;; le rond, ma bière avec {h0.nom}.</p>
        </section>

        {aAcheter && (
          <div className="pq-substituer-choisir" data-etat="etat-subst-actions">
            <button type="button" data-role="achats" aria-pressed={achats.has(aAcheter.cle)} title="Maquette : la liste d’achats n’existe pas encore"
              onClick={() => setAchats((s) => { const n = new Set(s); if (n.has(aAcheter.cle)) n.delete(aAcheter.cle); else n.add(aAcheter.cle); return n; })}>
              {achats.has(aAcheter.cle) ? `${aAcheter.nom} noté aux achats ✓` : `Ajouter ${aAcheter.nom} aux achats`}
            </button>
          </div>
        )}

        <details open className="pq-substituer-details" data-etat="etat-subst-lire">
          <summary data-etat="etat-subst-lire-fermer">Lire ces scores</summary>
          <div className="pq-substituer-regle">
            <p><b>Calculés depuis nos fiches</b>, pas les scores de substitution de Beer Maverick (non importés). Prix, rareté et cohumulone&nbsp;: inconnus.</p>
            {ouverts[0] && <p><b>La plage</b>&nbsp;: le moteur calcule le score sans la composante inconnue (poids renormalisés), ce qui donne {ouverts[0].moteur} à {ouverts[0].nom}. Ici, l’inconnue est laissée ouverte de 0 à 100&nbsp;: {moment} (poids arôme {nombre(lecture.poids.arome, 1)}, huiles {nombre(lecture.poids.huiles, 1)}, amertume {nombre(lecture.poids.amertume, 1)}), {ouverts[0].nom} vaut entre {ouverts[0].min} et {ouverts[0].max}. Les composantes connues restent celles du moteur, sans plage propre.</p>}
            <p><b>Sans inconnue ne veut pas dire sûr</b>&nbsp;: chaque composante connue vient de peu de fiches ({faces.map((x) => `${x.nom} : ${x.h.familles.citrus.sur}`).join(', ')}). Le score n’a pas d’intervalle statistique, seulement cette plage.</p>
            {amertume && <p><b>{Moment}, l’arôme compte peu</b>&nbsp;: il ne mesure que ce que le remplaçant apporte de plus que {h0.nom}, pas ce qu’il perd (l’arôme de {h0.nom} part à l’ébullition). Un remplaçant qui perd six familles peut y valoir 100&#8239;: c’est pour cela que l’écran ne l’affiche pas seul.</p>}
            <p><b>Le pire cas d’abord</b>&nbsp;: rangés par le bas de la plage. Le moteur, lui, range par score, puis par nom.</p>
            <p><b>{cands.length} des {lecture.total}</b>&nbsp;: les {cands.filter((c) => c.vient === 'catalogue').length} premiers du catalogue et les {lecture.stockRangs.length} premiers de ton stock ({lecture.stockRangs.map((s) => `${s.nom} ${s.rang}e`).join(', ')}).</p>
            <p><b>Face à face</b>&nbsp;: {faces[1] ? `${faces[1].nom}, ${faces[1].stock === 'suffisant' ? 'en stock' : 'premier sûr à acheter'}` : ''}{faces[2] ? ` ; ${faces[2].nom}, ${faces[2].stock === 'suffisant' ? 'premier du stock qui suffit' : faces[2].stock === 'acheter' ? 'à acheter' : 'en stock, ne suffit pas'}` : ''}. Arômes&nbsp;: citations dans les fiches, pas une intensité dans la bière.</p>
          </div>
        </details>
      </div>
      {fiche.rendu}
    </CadreOutil>
  );
}
