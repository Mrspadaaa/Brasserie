import React from 'react';
import { Beer, FileText, Hammer, Link2, ListChecks, PartyPopper, ShoppingCart, TrendingUp } from 'lucide-react';
import { etiquetteS, francsSignes, jourLisible, texteDuree, type ChoseCalendrier, type Rangee } from '../../../domain/calendrier';
import { usePointeur } from './usePointeur';

/* ---------- la largeur réelle d'un texte (CRITIQUE-4 n° 24) ----------
   Problème d'école : mesurer un texte avant de le poser. Méthode standard du navigateur : `CanvasRenderingContext2D.measureText` avec la police
   de la page (aucune dépendance). Sous jsdom (tests), aucun canvas : l'estimation de 7,6 px par lettre à 14 px, comme avant. */
let contexte: CanvasRenderingContext2D | null | undefined;
let famille = 'sans-serif';
const PX_PAR_LETTRE_14 = 7.6;
export function largeurTexte(texte: string, poids = 600, taille = 14): number {
  if (!texte) return 0;
  if (contexte === undefined) {
    contexte = null;
    const jsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (!jsdom && typeof document !== 'undefined') {
      try { contexte = document.createElement('canvas').getContext('2d'); } catch { contexte = null; }
      try { famille = getComputedStyle(document.body).fontFamily || famille; } catch { /* rien */ }
    }
  }
  if (!contexte) return texte.length * PX_PAR_LETTRE_14 * (taille / 14);
  contexte.font = `${poids} ${taille}px ${famille}`;
  return contexte.measureText(texte).width;
}

/** Le nom court d'un lien : « La Cigogne » pour « lié à La Cigogne » (CRITIQUE-4 n° 15). */
export function nomLie(lie: NonNullable<ChoseCalendrier['lie']>): string {
  if (lie.client) return lie.client;
  const t = lie.texte.trim();
  return t.toLocaleLowerCase('fr').startsWith('lié à ') ? t.slice(6) : t;
}
/** Un texte comparable : sans accents, apostrophes unifiées, minuscules, espaces simples. */
const aplatir = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();

/**
 * CRITIQUE-6 n° 15 : la pastille « lié à » qui ne dit rien de plus que le nom (« La Cigogne +900 » et sa pastille « La Cigogne ») n'est pas
 * montrée. Le domaine cesse de la produire (lot A) ; ce garde-fou reste côté vue. Lier vers un brassin (« Hotte », lié à « Blonde d'automne »)
 * garde sa pastille. `undefined` : rien à montrer.
 */
export function lieMontre(c: Pick<ChoseCalendrier, 'lie' | 'titre' | 'etiquette'>, nom: string = c.etiquette ?? c.titre): ChoseCalendrier['lie'] {
  if (!c.lie) return undefined;
  const lie = aplatir(nomLie(c.lie));
  return lie && aplatir(nom).includes(lie) ? undefined : c.lie;
}

/**
 * CRITIQUE-7 n° 6 (D-113, D-126) : l'aperçu d'un lien écrit juste après son nom (« lié à Blonde d'automne · … » du détail) ne le répète
 * pas : « brassage 23 nov. · prête 21 déc. ». L'aperçu de la pastille, lui, est une note à part sous le bouton : il ne suit aucun nom sur sa
 * ligne et garde le sien (c5). Avec deux liens (« La Cigogne · client ; Blonde d'automne · prête 21 déc. »), chaque
 * morceau garde son nom, sans quoi on ne sait plus lequel est lequel. Sans rien d'autre que le nom : l'aperçu entier.
 */
export function apercuSansNom(lie: NonNullable<ChoseCalendrier['lie']>): string {
  const morceaux = lie.apercu.split(' ; ').map(x => x.trim()).filter(Boolean);
  if (morceaux.length !== 1) return lie.apercu;
  const [tete, ...reste] = morceaux[0].split(' · ');
  return reste.length && aplatir(tete) === aplatir(nomLie(lie)) ? reste.join(' · ') : lie.apercu;
}

/**
 * CRITIQUE-6 n° 6 : un nom trop long pour la place d'un côté passe sur deux lignes, coupé entre deux mots, le montant au bout de la deuxième
 * (« Commande groupée » puis « de malt −540 »). La coupe la plus équilibrée : la plus petite largeur de la plus longue ligne. `null` : un seul mot.
 */
export function couperNom(nom: string, montant: string | null, mesure: (t: string, poids: number) => number = largeurTexte): { l1: string; l2: string; largeur: number } | null {
  /* « Brouwland · malt » se coupe après le point médian, jamais devant : « Brouwland · » puis « malt » */
  const mots = nom.trim().split(/\s+/).reduce<string[]>((l, m) => (l.length && /^[·:,;]/.test(m) ? [...l.slice(0, -1), `${l[l.length - 1]} ${m}`] : [...l, m]), []);
  if (mots.length < 2) return null;
  const lm = montant ? mesure(montant, 700) + 6 : 0;
  let mieux: { l1: string; l2: string; largeur: number } | null = null;
  for (let i = 1; i < mots.length; i++) {
    const l1 = mots.slice(0, i).join(' '), l2 = mots.slice(i).join(' ');
    const largeur = Math.ceil(Math.max(mesure(l1, 600), mesure(l2, 600) + lm));
    if (!mieux || largeur < mieux.largeur) mieux = { l1, l2, largeur };
  }
  return mieux;
}

/** La largeur de la pastille « lié à » : l'icône, le texte (court ou entier), son bord et son jeu. */
export function largeurPastilleLie(lie: NonNullable<ChoseCalendrier['lie']>, court: boolean): number {
  return Math.ceil(14 + 4 + largeurTexte(court ? nomLie(lie) : lie.texte, 600) + 14);
}

/**
 * La pastille « lié à La Cigogne » (E37, D-113, D-126) : lisible en 3 s (14 px), elle se touche et montre l'aperçu sur place
 * (`lie.apercu` : « La Cigogne · client ; Blonde d'automne · prête 21 déc. »). Elle vit à côté du nom, hors des gestes de la barre.
 * CRITIQUE-4 n° 15 : l'icône lien et le nom, jamais « lié … » ; au téléphone et dès 3 mois, le nom court (« ↔ La Cigogne »), au 1280 le texte
 * entier. Elle ne rétrécit pas (le nom de la chose cède d'abord) ; son aperçu reste dans l'écran.
 */
export function PastilleLie({ lie, court = false, icone }: { lie: NonNullable<ChoseCalendrier['lie']>; court?: boolean; icone?: string }) {
  const [ouvert, setOuvert] = React.useState(false);
  const ap = React.useRef<HTMLSpanElement | null>(null);
  React.useLayoutEffect(() => {
    const el = ap.current;
    if (!el || typeof window === 'undefined') return;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const deborde = r.right - (window.innerWidth - 8);
    if (deborde > 0) el.style.transform = `translateX(-${Math.ceil(Math.min(deborde, Math.max(0, r.left - 8)))}px)`;
  }, [ouvert]);
  return (
    <span className="cal-lie-z">
      <button
        type="button" className={`cal-lie${icone ? ' cal-lie-icone' : ''}`} data-lie data-lie-court={court || icone ? '' : undefined} aria-expanded={ouvert}
        /* CRITIQUE-9 n° 10 : l'icône seule (sans place pour le nom) se nomme avec sa chose : « Hotte, liée à Blonde d'automne : aperçu » */
        aria-label={icone ? `${icone}, liée à ${nomLie(lie)} : aperçu` : `${lie.texte} : aperçu`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOuvert(o => !o); }}
      >{!icone && <><Link2 size={14} aria-hidden="true" /><span>{court ? nomLie(lie) : lie.texte}</span></>}</button>
      {ouvert && <span ref={ap} role="note" className="cal-lie-ap" data-apercu-lien>{lie.apercu}</span>}
    </span>
  );
}

/**
 * La marque (E27, D-198, D-199 ; « les évènements sont trop petits, peut-être utiliser une icône ») : en 3 mois, 6 mois et An, une chose
 * qui ferait moins de 24 px de large devient l'icône de sa rangée, avec un vrai nom pour le lecteur d'écran. Son nom vient aussi au
 * toucher (le détail). Un appui long ouvre la vue 6 semaines centrée sur sa semaine, où elle se déplace (f1-a).
 *
 * La même forme sert de pastille (E26 : « Ventes en pastilles, les livraisons aussi ») et aux sorties dérivées sans montant (le bruit
 * d'Achats, CAL-INFO-TROP) : dans la vue 6 semaines elle se glisse et s'ouvre en menu comme une barre. Elle porte alors son nom et son
 * montant à côté (E13 : « gardent leurs noms et leurs montants »), sauf une sortie dérivée sans montant, dont le nom vient au toucher.
 * **Nouveau, à valider** : la forme de la marque.
 */

export const ICONE_RANGEE: Record<Rangee, typeof Beer> = {
  brassins: Beer, fetes: PartyPopper, ventes: TrendingUp, achats: ShoppingCart, travaux: Hammer, activites: ListChecks, papiers: FileText
};

/** Les couleurs de zone de l'app, une classe par rangée (`frise.css` pose `--c`). */
export const CLASSE_TEINTE: Record<Rangee, string> = {
  brassins: 'cal-t-brassins', fetes: 'cal-t-fetes', ventes: 'cal-t-ventes', achats: 'cal-t-achats', travaux: 'cal-t-travaux', activites: 'cal-t-activites', papiers: 'cal-t-papiers'
};

/**
 * Le nom lu à l'écran : « Frigo, 14 déc., S51 ». Jamais seulement une icône. CRITIQUE-5 n° 21 (E47 c) : une échéance récurrente (le loyer) est
 * « à payer », jamais « proposé » ; « proposé » reste à la vente probable et au brassin habituel.
 */
export function nomAccessible(chose: ChoseCalendrier): string {
  const jour = chose.debut ? `${jourLisible(chose.debut)}, ${etiquetteS(chose.debut)}` : 'sans date';
  const etat = chose.proposition === 'echeance' ? ', à payer' : chose.proposition || chose.probable ? ', proposé' : '';
  return `${chose.titre}${etat}, ${jour}`;
}

/** « J0 / 28 · prête 14 déc. » : vit dans le domaine (jamais « J0 / 0 »), réexporté pour les vues. */
export { texteDuree };

/** Un champ que le lot A ajoute (`duree`, `pasBrassee`, `frais`) : lu en optionnel, sans supposer son type. */
export const champ = (c: object, k: string): unknown => (c as Record<string, unknown>)[k];

/**
 * La durée montrée d'un brassin (CRITIQUE-3 n° 19, n° 30) : celle du domaine (« J7 / 28 · prête 7 déc. »), « pas brassée » quand la date
 * prévue est passée sans brassage, sinon « durée inconnue ». Jamais une fin inventée ; rien pour ce qui n'est pas un brassin.
 */
export function dureeVue(c: ChoseCalendrier): string | null {
  const d = champ(c, 'duree');
  if (typeof d === 'string' && d.trim()) return d;
  const t = texteDuree(c);
  if (t) return t;
  if (c.rangee !== 'brassins' || c.brassinLie || c.conditionne || c.proposition || c.probable) return null;
  if (champ(c, 'pasBrassee') === true) return 'pas brassée';
  return c.source.genre === 'batch' || c.source.genre === 'prevision-brassin' ? 'durée inconnue' : null;
}

/**
 * Deux lignes à côté d'un objet, pour une chose liée (CRITIQUE-5 n° 26) : `nom`, le nom et son montant insécables, puis la pastille « lié à »
 * seule ; `nomSeul` (quand nom et montant ensemble seraient coupés, au téléphone), le nom entier, puis le montant et la pastille.
 */
export type ModeDeuxLignes = false | 'nom' | 'nomSeul' | 'duree' | 'coupe';

/** Le contenu d'une étiquette posée à côté (barre ou marque) : nom, montant, durée d'un brassin, pastille « lié à », sur une ligne ou deux. */
export function ContenuEtiquette({ chose, nom, montant, duree, deux, lieCourt, sansLie }: { chose: ChoseCalendrier; nom: string; montant: string | null; duree?: string | null; deux?: ModeDeuxLignes; lieCourt?: boolean; sansLie?: boolean }) {
  const m = montant ? <b aria-hidden="true" className={`cal-lbl-m${chose.centimes !== undefined && chose.centimes < 0 ? ' cal-neg' : ''}`}>{montant}</b> : null;
  const lieVu = sansLie ? undefined : lieMontre(chose, nom);
  const lie = lieVu ? <PastilleLie lie={lieVu} court={lieCourt} /> : null;
  const t = <span className="cal-lbl-t" aria-hidden="true">{nom}</span>;
  /* CRITIQUE-6 n° 6 : le nom entier sur deux lignes, coupé entre deux mots, le montant au bout de la deuxième */
  const coupe = deux === 'coupe' ? couperNom(nom, montant) : null;
  if (coupe) return <><span className="cal-lbl-l1"><span className="cal-lbl-t cal-lbl-ent" aria-hidden="true">{coupe.l1}</span></span><span className="cal-lbl-l2"><span className="cal-lbl-t cal-lbl-ent" aria-hidden="true">{coupe.l2}</span>{m}{lie}</span></>;
  if (deux === 'nom') return <><span className="cal-lbl-l1">{t}{m}</span>{lie && <span className="cal-lbl-l2">{lie}</span>}</>;
  if (deux === 'nomSeul') return <>{t}<span className="cal-lbl-l2">{m}{lie}</span></>;
  /* un brassin (as/cap/p-repos : « Blonde d'automne −148 » puis « J0 / 28 ») : le nom et son montant, puis sa durée entière dessous */
  if (deux === 'duree') return <><span className="cal-lbl-l1">{t}{m}{lie}</span>{duree && <span className="cal-lbl-l2"><small aria-hidden="true" className="cal-lbl-j">{duree}</small></span>}</>;
  return <>{t}{m}{duree && <small aria-hidden="true" className="cal-lbl-j">{duree}</small>}{lie}</>;
}

/** Le nom et le montant à côté d'une marque ; `texte` remplace le nom court (le caddie d'un brassin en 6 semaines). */
/** `retrait` (CRITIQUE-12 n° 4) : à gauche, l'étiquette finit avant la zone du + volant, à `retrait` px de plus que d'habitude de sa marque. */
export interface LibelleMarque { cote: 'droite' | 'gauche'; place: number; texte?: string; deux?: ModeDeuxLignes; sansLie?: boolean; retrait?: number }

export interface MarqueProps {
  chose: ChoseCalendrier;
  /** Centre de la marque dans la rangée, en px. */
  centre: number;
  haut: number;
  hauteur?: number;
  largeurColonne: number;
  epinglee?: boolean;
  etoilee?: boolean;
  selectionnee?: boolean;
  menuOuvert?: boolean;
  /** Le nom et le montant à côté (pastille) ; absent : le nom vient au toucher. */
  libelle?: LibelleMarque;
  /** La pastille « lié à » en nom court (téléphone, 3 mois et plus). */
  lieCourt?: boolean;
  /** Pendant un glisser, la pastille suit le doigt (px). */
  decalage?: number;
  /** Pas permis pour le glisser, en semaines ; présent : la pastille se glisse et s'ouvre en menu comme une barre. */
  bornes?: [number, number];
  onToucher: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  /** Appui long d'une marque en 3 mois, 6 mois ou An : la vue 6 semaines centrée sur cette chose (E27, D-199). Absent : rien. */
  onSixSemaines?: (chose: ChoseCalendrier) => void;
  onAppuiLong?: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  onGlisse?: (chose: ChoseCalendrier, k: number) => void;
  onLacheGlisse?: (chose: ChoseCalendrier, k: number, annule: boolean) => void;
  onRefus?: (chose: ChoseCalendrier, raison: string) => void;
  /** D386 : un jalon d'un jour (icône à sa date, nom à côté). */
  jalon?: boolean;
  /** D386 : l'id de la barre liée (fil discret) ; absent : aucun fil. */
  lieA?: string;
  /** D386 : au toucher d'une barre, ses jalons liés s'allument, les autres pâlissent. */
  ton?: 'allume' | 'pale';
  /** D390 : la rangée de la barre liée ; présent : un petit point de sa couleur sur le jalon (au repos, le lien se lit sans fil). */
  pointLie?: Rangee;
}

const montantDe = (c: ChoseCalendrier): string | null => (c.centimes === undefined ? null : `${francsSignes(c.centimes)}${c.partiel ? ' +' : ''}`);

export const Marque: React.FC<MarqueProps> = props => {
  const { chose, centre, haut, hauteur = 28, largeurColonne, epinglee, etoilee, selectionnee, menuOuvert, libelle, decalage = 0, bornes } = props;
  const cible = React.useRef<HTMLButtonElement | null>(null);
  const Icone = chose.brassinLie ? ShoppingCart : ICONE_RANGEE[chose.rangee];
  const commeBarre = !!bornes;
  const gestes = usePointeur({
    largeurColonne,
    borne: () => bornes ?? [0, 0],
    refuseGlisse: () => (commeBarre && chose.deplacable !== true ? chose.deplacable.raison : commeBarre ? null : 'marque'),
    onRefus: raison => { if (commeBarre) props.onRefus?.(chose, raison); },
    onToucher: () => cible.current && props.onToucher(chose, cible.current),
    onAppuiLong: () => {
      if (commeBarre && cible.current && props.onAppuiLong) props.onAppuiLong(chose, cible.current);
      else props.onSixSemaines?.(chose);
    },
    onGlisse: k => props.onGlisse?.(chose, k),
    onLacheGlisse: (k, annule) => props.onLacheGlisse?.(chose, k, annule)
  });
  const proposee = !!(chose.proposition || chose.probable);
  const montant = montantDe(chose);
  const style: React.CSSProperties = { left: centre - hauteur / 2, top: haut, width: hauteur, height: hauteur, transform: decalage ? `translateX(${decalage}px)` : undefined };
  const lbl: React.CSSProperties | undefined = libelle
    ? {
      ...(libelle.deux ? { top: haut - 2, height: Math.max(hauteur + 4, 30) } : { top: haut, height: hauteur }), maxWidth: Math.max(40, libelle.place),
      ...(libelle.cote === 'droite' ? { left: centre + 14 + decalage + 6 } : { right: `calc(100% - ${centre - 14 + decalage - (libelle.retrait ?? 0)}px + 6px)` })
    }
    : undefined;
  return (
    <>
      <button
        ref={cible}
        type="button"
        data-chose={chose.id}
        data-chose-id={chose.id}
        data-marque
        data-rangee={chose.rangee}
        data-titre={chose.titre}
        {...(chose.debut ? { 'data-semaine': etiquetteS(chose.debut) } : {})}
        {...(chose.brassinLie ? { 'data-brassin-lie': chose.brassinLie } : {})}
        {...(props.jalon ? { 'data-ponctuel': chose.debut } : {})}
        {...(props.lieA ? { 'data-lie-a': props.lieA } : {})}
        {...(props.ton ? { 'data-ton': props.ton } : {})}
        {...(chose.proposition ? { 'data-proposition': chose.proposition } : {})}
        {...(proposee ? { 'data-probable': '' } : {})}
        aria-label={`${nomAccessible(chose)}${montant ? `, ${montant}` : ''}${props.jalon && chose.lie ? `, ${chose.lie.texte}` : ''}`}
        aria-pressed={selectionnee || undefined}
        aria-haspopup={commeBarre ? 'menu' : undefined}
        aria-expanded={menuOuvert || undefined}
        className={`cal-marque ${CLASSE_TEINTE[chose.rangee]}${proposee ? ' cal-pointille' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}${decalage ? ' cal-glisse' : ''}${props.jalon ? ' cal-ponctuel' : ''}${props.ton ? ` cal-ponctuel-${props.ton}` : ''}`}
        style={style}
        {...gestes}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cible.current) props.onToucher(chose, cible.current); } }}
      >
        <Icone size={16} aria-hidden="true" />
        {etoilee && <span className="cal-etoile" aria-hidden="true">★</span>}
        {props.pointLie && <i className={`cal-point-lie ${CLASSE_TEINTE[props.pointLie]}`} data-point-lie={props.pointLie} aria-hidden="true" />}
      </button>
      {libelle && lbl && (
        <span className={`cal-lbl cal-lbl-${libelle.cote}${libelle.deux ? ' cal-lbl-2n' : ''} ${CLASSE_TEINTE[chose.rangee]}${props.ton ? ` cal-ponctuel-${props.ton}` : ''}`} style={lbl}>
          <ContenuEtiquette chose={chose} nom={libelle.texte ?? chose.etiquette ?? chose.titre} montant={montant} deux={libelle.deux} lieCourt={props.lieCourt} sansLie={libelle.sansLie} />
        </span>
      )}
    </>
  );
};
