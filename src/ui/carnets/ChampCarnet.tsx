/**
 * Le champ unique du carnet (R24, R27, R37 ; gestes 1, 4, 5, 7) : il écrit ou colle, un geste envoie, l'IA range.
 * - En bas, au-dessus du clavier : `useKeyboardInset` (visualViewport) retranche le clavier (CARNET-CLAV).
 * - Sur la liste : « Une idée, un besoin… » et ↑ ; dans un carnet : « Ajouter à <titre>… » (G7) et « Ajouter »
 *   (§ Points ouverts 6). Pendant une modification : « Enregistrer ».
 * - 📷 (photo, § Points ouverts 8) et un petit 🎤 seulement si le navigateur sait dicter (CR-VOIX, R37).
 * - Puce « Coller : … » au-dessus quand le presse-papier tient un lien (R15).
 * - Bulle G8 au focus (R44) : calcul local, picto local, jamais le ✻ ; un toucher remplit « <critère> : ».
 * - Puces « Va dans » (R13) : correction seulement, préchoisies ; rangées derrière le champ.
 */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Mic, X } from 'lucide-react';
import { useDictee } from '../atelier/dictee';
import { useKeyboardInset } from '../useViewport';
import { PictoLocal } from './EtatIA';

export interface SuggestionCritere { critere: string; a: string; b: string }
export interface VaDans { options: { id: string; libelle: string }[]; choisi: string; onChoisir: (id: string) => void }

export interface ChampCarnetProps {
  valeur: string;
  onChange: (texte: string) => void;
  onEnvoyer: () => void;
  /** Titre du carnet ouvert : le champ dit où ça va (G7). Absent : on est sur la liste. */
  titreCarnet?: string;
  /** « Enregistrer » pendant une modification de note (R20), « Renommer » ne passe pas ici (R21 a son cadre). */
  libelleEnvoi?: string;
  onPhoto?: (fichier: File) => void;
  /** Lien lu dans le presse-papier, proposé d'un toucher (R15). */
  coller?: string;
  onColler?: () => void;
  /** Le champ prend le focus : la vue lit alors le presse-papier (R15, G14). */
  onFocusChamp?: () => void;
  /** Le champ perd le focus (Créer · avant se replie, P28). */
  onBlurChamp?: () => void;
  suggestion?: SuggestionCritere | null;
  vaDans?: VaDans | null;
  /** Grisé pendant la confirmation de suppression d'une idée (G34). */
  desactive?: boolean;
  inputRef?: React.Ref<HTMLTextAreaElement>;
  /**
   * P7 (tour 3) : la photo choisie, jointe au champ avant l'envoi. `lecture` : le fichier se lit et se réduit (« photo jointe ·
   * lecture… ») ; puis `apercu` (la vignette). Retirable d'un ✕ ; l'envoi la range avec le texte, s'il y en a.
   */
  jointe?: { apercu?: string; lecture: boolean } | null;
  onRetirerJointe?: () => void;
  /**
   * Critique 5, n° 3 (G4) : le carnet où la phrase ira, préchoisi, corrigeable d'un toucher (« Va dans » : Évier inox · Ventilation).
   * Rendu seulement quand un autre carnet que l'ouvert en parle ; sinon la phrase reste ici, sans puce de plus.
   */
  vaDansCarnet?: VaDans | null;
  /** Critique 5, n° 26 (g4:v01-13) : la ligne sous le champ (« Annuler · Entrée = renommer »). */
  pied?: React.ReactNode;
}

/** Les petits mots qu'un titre raccourci ne garde pas en dernier (« Ventilation de… » se lit « Ventilation… »). */
const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'à', 'au', 'aux', 'pour', 'et', 'en', 'sur', 'avec', 'd’', 'l’', "d'", "l'"]);
/**
 * Critique 5, n° 34 : « Ajouter à Ventilation de » coupé par le téléphone. Le titre se raccourcit au mot, sans finir sur un petit mot,
 * pour que le placeholder se lise entier à 390 (« Ajouter à Ventilation… ») ; un titre court reste tel quel.
 */
export function titreCourt(titre: string, max = 18): string {
  const t = titre.trim();
  /* décision du pilote (critique 6) : le titre stocké, « ZZ TEST — » compris ; la marque reste entière, le raccourci porte sur le reste */
  const pre = /^ZZ TEST\s*[—–-]\s*/i.exec(t)?.[0] ?? '';
  const corps = t.slice(pre.length);
  if (corps.length <= max) return t;
  const mots = corps.split(/\s+/);
  const garde: string[] = [];
  for (const m of mots) {
    if ([...garde, m].join(' ').length > max) break;
    garde.push(m);
  }
  while (garde.length > 1 && MOTS_VIDES.has(garde[garde.length - 1].toLowerCase())) garde.pop();
  /* critique 6, n° 26 : coupé sur un mot, jamais au milieu, et « … » le dit */
  return `${pre}${garde.length ? garde.join(' ') : mots[0]}…`;
}

/**
 * Critique 6, n° 26 : le titre qui tient dans la place mesurée du champ (`measureText` sur sa police : la méthode standard pour ajuster un
 * texte), coupé sur un mot avec « … ». Sans mesure possible (tests), `titreCourt`.
 */
export function titreQuiTient(titre: string, place: number, mesurer: (s: string) => number, avant = 'Ajouter à '): string {
  const t = titre.trim();
  if (mesurer(`${avant}${t}…`) <= place) return t;
  /* du plus long au plus court, mot par mot sur le titre entier (marque comprise : à 390, « ZZ TEST — Évier inox » devient « ZZ TEST… »
     plutôt que « ZZ TEST — Évi ») ; jamais un petit mot ni un tiret en dernier */
  const mots = t.split(/\s+/);
  for (let n = mots.length - 1; n >= 1; n--) {
    const garde = mots.slice(0, n);
    while (garde.length > 1 && (MOTS_VIDES.has(garde[garde.length - 1].toLowerCase()) || /^[—–-]$/.test(garde[garde.length - 1]))) garde.pop();
    const c = `${garde.join(' ')}…`;
    if (mesurer(`${avant}${c}`) <= place) return c;
  }
  return `${mots[0]}…`;
}
function mesureurDe(el: HTMLElement | null): ((s: string) => number) | null {
  if (!el || typeof navigator === 'undefined' || /jsdom/i.test(navigator.userAgent)) return null;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  const st = getComputedStyle(el);
  ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  return s => ctx.measureText(s).width;
}
/** Large (≥ 900 px) : le titre entier tient dans le champ ; sinon le titre court. */
function useLarge(): boolean {
  const q = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 900px)') : null;
  const [large, setLarge] = useState(() => !!q?.matches);
  useEffect(() => {
    if (!q) return;
    const maj = () => setLarge(q.matches);
    q.addEventListener?.('change', maj);
    return () => q.removeEventListener?.('change', maj);
  }, [q]);
  return large;
}

/** « plaque-froid.ch/echan… » : le lien en clair, raccourci pour tenir sur la puce. */
export function lienCourt(url: string, max = 22): string {
  const sans = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return sans.length > max ? `${sans.slice(0, max)}…` : sans;
}

/**
 * Tour 3, f7 n° 3 : un rang « Va dans » ne se fond à droite (`data-deborde`, carnets-fil.css) que si sa dernière puce dépasse vraiment ;
 * sinon il montre toutes ses puces entières. La mesure lit la position de la dernière puce (scroll compris), pas `scrollWidth`, que la marge
 * du fondu fausserait. À chaque rendu (le texte change les puces) et au redimensionnement.
 */
function useDebordVaDans(zone: React.RefObject<HTMLDivElement | null>) {
  const mesurer = React.useCallback(() => {
    zone.current?.querySelectorAll<HTMLElement>('.cn-vadans').forEach(rang => {
      const derniere = rang.lastElementChild;
      const deborde = !!derniere && derniere.getBoundingClientRect().right + rang.scrollLeft > rang.getBoundingClientRect().right + 0.5;
      if (deborde !== rang.hasAttribute('data-deborde')) rang.toggleAttribute('data-deborde', deborde);
    });
  }, [zone]);
  useLayoutEffect(mesurer);
  useEffect(() => {
    window.addEventListener('resize', mesurer);
    return () => window.removeEventListener('resize', mesurer);
  }, [mesurer]);
}

/** Le conteneur qui défile sous le champ : la zone voisine qui défile (vue à hauteur bornée), sinon un ancêtre, sinon la page. */
function defileurDe(zone: HTMLElement): Element | null {
  const defile = (e: Element) => {
    const o = getComputedStyle(e).overflowY;
    return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1;
  };
  for (let e = zone.previousElementSibling; e; e = e.previousElementSibling) if (defile(e)) return e;
  for (let e = zone.parentElement; e; e = e.parentElement) if (defile(e)) return e;
  return document.scrollingElement;
}

/**
 * R27 et G8 : le champ publie sa hauteur (`--cn-champ-h`) et le retrait du clavier (`--cn-clavier`) sur la vue des carnets
 * (`[data-carnets]`, sinon son parent). La page s'en sert pour réserver le bas (dernière note au-dessus du champ, clavier ouvert) et
 * pour les `scroll-margin` du cadre. Quand la bulle G8 paraît, la page défile de sa hauteur : elle lui fait place au lieu d'être
 * recouverte.
 */
function useChampPublie(zone: React.RefObject<HTMLDivElement | null>, inset: number, bulle: boolean) {
  const hauteur = useRef(0);
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const racine = (el.closest('[data-carnets]') as HTMLElement | null) ?? el.parentElement;
    if (!racine) return;
    const publier = () => {
      hauteur.current = el.offsetHeight;
      racine.style.setProperty('--cn-champ-h', `${el.offsetHeight}px`);
    };
    publier();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publier) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); racine.style.removeProperty('--cn-champ-h'); };
  }, [zone]);
  useEffect(() => {
    const el = zone.current;
    const racine = (el?.closest('[data-carnets]') as HTMLElement | null) ?? el?.parentElement;
    if (!racine) return;
    racine.style.setProperty('--cn-clavier', `${inset}px`);
    return () => { racine.style.removeProperty('--cn-clavier'); };
  }, [zone, inset]);
  useLayoutEffect(() => {
    if (!bulle) return;
    const el = zone.current;
    const b = el?.querySelector<HTMLElement>('.cn-bulle');
    if (!el || !b) return;
    const d = defileurDe(el);
    /* la bulle et son écart (gap de la zone) ; rien à faire en haut d'une page qui ne défile pas. Tour 3, f5d n° 4 : seulement si la
       page était en bas (la bulle couvrirait sa dernière ligne) ; en haut, défiler poussait le titre sous la barre À venir / Carnets / Réalisés. */
    if (!d || d.scrollTop <= 0 || d.scrollTop + d.clientHeight < d.scrollHeight - b.offsetHeight - 10) return;
    d.scrollBy?.({ top: b.offsetHeight + 8 });
  }, [zone, bulle]);
}

export function ChampCarnet(p: ChampCarnetProps) {
  const inset = useKeyboardInset();
  const [focus, setFocus] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const id = useId();
  const dictee = useDictee(t => p.onChange(p.valeur ? `${p.valeur} ${t}` : t));
  const dansCarnet = !!p.titreCarnet;
  const ecoute = dictee.disponible && dictee.ecoute;
  const large = useLarge();
  /* critique 6, n° 26 : la place réelle du champ, mesurée (ResizeObserver), pour que le placeholder se coupe sur un mot */
  const zoneTexte = useRef<HTMLTextAreaElement | null>(null);
  const [placeTexte, setPlaceTexte] = useState(0);
  useEffect(() => {
    const el = zoneTexte.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setPlaceTexte(el.clientWidth));
    ro.observe(el);
    setPlaceTexte(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const mesurer = placeTexte > 0 ? mesureurDe(zoneTexte.current) : null;
  const titreVu = p.titreCarnet ? (mesurer ? titreQuiTient(p.titreCarnet, placeTexte - 2, mesurer) : large ? p.titreCarnet : titreCourt(p.titreCarnet)) : '';
  const placeholder = ecoute ? 'J’écoute…' : dansCarnet ? `Ajouter à ${titreVu}${titreVu.endsWith('…') ? '' : '…'}` : 'Une idée, un besoin…';
  const libelle = dansCarnet ? `Ajouter à ${p.titreCarnet}…` : 'Une idée, un besoin…';
  /* Critique 5, n° 42 : un seul habit d'envoi partout, le bouton vert à mot des maquettes du champ qui tape (g5:v02-10, v03-7, v07-10,
     v01-15 sur la liste) : « Ajouter », et « Enregistrer » ou « Renommer » quand le champ modifie. */
  const envoi = p.libelleEnvoi ?? 'Ajouter';
  const plein = p.valeur.trim().length > 0;
  /* une photo prête s'envoie seule ; pendant sa lecture, l'envoi attend */
  const jointe = p.jointe ?? null;
  const pret = (plein || (!!jointe && !jointe.lecture)) && !jointe?.lecture;
  const montrerBulle = !!p.suggestion && focus && !plein;
  useChampPublie(zone, inset, montrerBulle);
  useDebordVaDans(zone);

  return (
    <div ref={zone} className="cn-champ-zone" style={{ bottom: inset, marginBottom: inset }} aria-disabled={p.desactive || undefined} data-clavier={inset || undefined}>
      {/* P37 (R27, CARNET-CLAV) : clavier ouvert, la bulle G8 et la puce « Coller » tiennent ensemble sur une ligne (`.cnf-aides-ligne`),
          pour laisser au carnet le plus de hauteur ; clavier fermé, chacune sa ligne. */}
      {/* Critique 5, n° 5 et 21 ; tour 3, PCN-103 : la bulle G8 tient en deux lignes au plus, clavier ouvert ou non */}
      {(montrerBulle || (p.coller && !plein)) && (
        /* tour 3, f5b n° 13 : seule (sans la bulle), la puce « Coller » prend sa ligne (`.cnf-aides`), jamais bornée à 55 % ni coupée net */
        <div className={montrerBulle ? 'cnf-aides-ligne' : 'cnf-aides'}>
          {montrerBulle && p.suggestion && (
            <button
              type="button"
              className="cn-bulle"
              onMouseDown={e => e.preventDefault()}
              onClick={() => p.onChange(`${p.suggestion!.critere} : `)}
              title={`Le critère « ${p.suggestion.critere} » tranche entre ${p.suggestion.a} et ${p.suggestion.b}`}
            >
              <PictoLocal />
              {/* tour 3, PCN-103 : dit entre quoi, en deux lignes au plus (carnets-fil.css) */}
              <span>« {p.suggestion.critere} » tranche entre {p.suggestion.a} et {p.suggestion.b}</span>
            </button>
          )}
          {p.coller && !plein && (
            <button type="button" className="cn-puce cn-coller" onMouseDown={e => e.preventDefault()} onClick={p.onColler}>
              {/* à côté de la bulle (55 %), le lien se coupe par « … » visible, jamais net (f5b n° 13) */}
              Coller : <span className="cn-mono" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lienCourt(p.coller)}</span>
            </button>
          )}
        </div>
      )}
      {plein && p.vaDansCarnet && (
        <div className="cn-vadans cnf-vadans-carnet" role="group" aria-label="Va dans le carnet">
          <span className="cn-mut cn-vadans-libelle">Va dans</span>
          {p.vaDansCarnet.options.map(o => (
            /* critique 6, n° 29 : un rang à 390 ; le titre court sur la puce, entier au survol et pour le lecteur d'écran */
            <button key={o.id} type="button" className="cn-puce" aria-pressed={o.id === p.vaDansCarnet!.choisi} title={o.libelle} aria-label={o.libelle} onMouseDown={e => e.preventDefault()} onClick={() => p.vaDansCarnet!.onChoisir(o.id)}>
              {large ? o.libelle : titreCourt(o.libelle, 14)}
            </button>
          ))}
        </div>
      )}
      {p.vaDans && plein && (
        <div className="cn-vadans" role="group" aria-label="Va dans">
          {/* P6 : un libellé insécable ; ce sont les puces qui passent à la ligne. Sous la ligne du carnet (n° 3), « en » suffit. */}
          {p.vaDansCarnet && <span className="cn-mut cn-vadans-libelle" aria-hidden>en</span>}
          <span className={p.vaDansCarnet ? 'cn-cache' : 'cn-mut cn-vadans-libelle'}>Va{' '}dans</span>
          {p.vaDans.options.map(o => (
            <button key={o.id} type="button" className="cn-puce" aria-pressed={o.id === p.vaDans!.choisi} onClick={() => p.vaDans!.onChoisir(o.id)}>
              {o.libelle}
            </button>
          ))}
        </div>
      )}
      <form
        className={`cn-champ${focus ? ' cn-champ-focus' : ''}${plein ? ' cn-champ-plein' : ''}${jointe ? ' cn-champ-joint' : ''}${ecoute ? ' cn-champ-ecoute' : ''}`}
        onSubmit={e => { e.preventDefault(); if (pret && !p.desactive) p.onEnvoyer(); }}
      >
        {jointe && (
          <div className="cn-jointe" role="status">
            {jointe.apercu ? <img src={jointe.apercu} alt="" /> : <span className="cn-jointe-vide" aria-hidden />}
            <span className="cn-sp">photo jointe{jointe.lecture ? <span className="cn-mut"> · lecture…</span> : null}</span>
            <button type="button" className="cn-x" aria-label="Retirer la photo" onMouseDown={e => e.preventDefault()} onClick={p.onRetirerJointe}><X size={18} aria-hidden /></button>
          </div>
        )}
        <label htmlFor={id} className="cn-cache">{libelle}</label>
        <textarea
          id={id}
          ref={el => {
            zoneTexte.current = el;
            const r = p.inputRef;
            if (typeof r === 'function') r(el); else if (r) (r as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
          }}
          rows={1}
          value={p.valeur}
          placeholder={placeholder}
          disabled={p.desactive}
          onFocus={() => { setFocus(true); p.onFocusChamp?.(); }}
          onBlur={() => { setFocus(false); p.onBlurChamp?.(); }}
          onChange={e => p.onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (pret && !p.desactive) p.onEnvoyer();
            }
          }}
          enterKeyHint="send"
          autoCapitalize="sentences"
        />
        {p.onPhoto && !plein && !jointe && !ecoute && (
          <>
            <button type="button" className="cn-ico" aria-label="Photo" disabled={p.desactive} onClick={() => fichier.current?.click()}>
              <Camera size={20} aria-hidden />
            </button>
            <input
              ref={fichier}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) p.onPhoto!(f); e.target.value = ''; }}
            />
          </>
        )}
        {/* R37 (CR-VOIX) : un petit micro, rien de plus. P7 : pendant la dictée, il reste là (même si le texte arrive) et se voit :
            couleur de zone et « Arrêter la dictée » écrit ; ni onde ni écran voix (D-83). */}
        {dictee.disponible && (!plein || ecoute) && !jointe && (
          <button type="button" className={`cn-ico${ecoute ? ' cn-ecoute' : ''}`} aria-label={ecoute ? 'Arrêter la dictée' : 'Dicter'} aria-pressed={ecoute} disabled={p.desactive} onClick={dictee.basculer}>
            <Mic size={20} aria-hidden />
            {ecoute && <span className="cn-ecoute-mot" aria-hidden>Arrêter la dictée</span>}
          </button>
        )}
        {(plein || jointe) && !ecoute && <button type="submit" className="cn-envoi-mot" disabled={p.desactive || !pret}>{envoi}</button>}
      </form>
      {p.pied}
    </div>
  );
}
