import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Clock, Maximize2, Minimize2 } from 'lucide-react';
import type { Periode } from '../../../components/periode/periode';
import { dateDeSemaine, lundiDe, type ModeleCalendrier, type Retard } from '../../../domain/calendrier';
import { creuxDepuis, miseDeCoteVisible, type CourbeCaisse, type MouvementNomme } from '../../../domain/calendrierCaisse';
import type { Orientation } from '../useOrientation';
import { entrerPleinEcran, estPleinEcran, sortirPleinEcran } from '../pleinEcran';
import { usePointeurCourbe } from '../usePointeurCourbe';
import { Courbe, CourbeZoom, HAUTEUR_MOIS, MOIS_MIN, ajouterJours, chf, jourCourt, moisDeSemaine } from './Courbe';
import { Cadre, etiquetteCadre, fenetreDePeriode, libelleDuree, periodeDeFenetre, SEMAINES_ANNEE, type FenetreSemaines } from './Fenetre';
import { BandeSemaines } from './BandeSemaines';
import { BandeAnnee } from './BandeAnnee';
import { MenuPeriode } from './MenuPeriode';
import { DetailCreux } from './DetailCreux';
import { Retards, titreRetards } from './Retards';
import { LectureDetail, LectureTete } from './LectureCourbe';
import { GrandeCourbe, geoGrande, largeurGrande } from './GrandeCourbe';
import './entete.css';

/**
 * L'en-tête du calendrier (E01 à E13) : le chiffre clé et ses boutons, la courbe de la fenêtre, la bande des semaines. z2s en portrait, w3s en
 * paysage : le même composant, le même état, une mise en page par orientation (D-205).
 *
 * L'en-tête ne lit rien : tout vient du modèle (`ModeleEnTete`, un sous-ensemble de `ModeleCalendrier` du lot A), la fenêtre et la période sont
 * à l'appelant. Les montants sont des centimes ; un solde de départ inconnu (`courbe: null`) ne trace rien et le dit.
 */

export type VueCalendrier = 'semaines' | 'annee' | 'graph' | 'liste';

/** Ce que l'en-tête lit du modèle : `ModeleCalendrier` en entier convient. */
export type ModeleEnTete = Pick<ModeleCalendrier, 'semaines' | 'courbe' | 'creux' | 'retards' | 'sansDate' | 'icones'> & Partial<Pick<ModeleCalendrier, 'mois' | 'choses' | 'hypotheses'>>;

/** La courbe recalculée pendant un geste de la frise (E02) : une `CourbeCaisse` (`courbeDecalee`, `courbeSans`…). */
export type ApercuCourbe = CourbeCaisse | { courbe: CourbeCaisse };

export interface EnTeteCalendrierProps {
  modele: ModeleEnTete;
  /** La fenêtre : le lundi de sa première semaine et son nombre de semaines (les colonnes de la frise). */
  fenetre: FenetreSemaines;
  onFenetre: (fenetre: FenetreSemaines) => void;
  /** LA période de l'app : le calendrier l'écrit, Finances la lit, et l'inverse (ET-PER). */
  periode: Periode;
  onPeriode: (periode: Periode) => void;
  vue: VueCalendrier;
  /** `ancre: 'sans-date'` ouvre la liste sur la poche (E46). */
  onVue: (vue: VueCalendrier, ancre?: 'sans-date') => void;
  mouvements: boolean;
  onMouvements: (afficher: boolean) => void;
  orientation: Orientation;
  apercu?: ApercuCourbe;
  /** Le lundi ISO de la semaine lue au doigt, `null` quand la lecture se ferme. */
  onLectureSemaine?: (lundi: string | null) => void;
  /** Appui long sur une semaine de la bande : une idée datée à ce lundi (E36). */
  onIdeeSemaine?: (lundi: string) => void;
  /** Largeur d'une colonne de la frise, en px (0 : inconnue, la courbe se mesure). */
  largeurColonne: number;
  /** Les liens « Solde et réglages › » et « Finances › Solde » (D-72). */
  onOuvrirFinances?: () => void;
  onOuvrirRetard?: (retard: Retard) => void;
  /** « Trier les rangées » et « Filtrer par type » du menu : le geste vit dans la frise (E39). */
  onTrier?: () => void;
  onFiltrer?: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Largeur de la colonne du chiffre clé et des boutons en paysage (w3s). */
const COLONNE_T = 214;
const HAUTEUR_COURBE = { portrait: 110, paysage: 74 };
const MESSAGE_ANNEE = 'Tire jusqu’au bout : l’année';
const INVITATION = 'Tourne le téléphone : 13 semaines';

/** La largeur d'un élément, mesurée ; 0 tant qu'elle est inconnue (jsdom, premier rendu). */
function useMesure(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const lire = () => { const r = Math.round(el.getBoundingClientRect().width); if (r > 0) setW(r); };
    lire();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

type Info = { genre: 'message' | 'invite' | 'date'; texte: string; colonne?: number; colonnes?: number; cle?: string };

export function EnTeteCalendrier(props: EnTeteCalendrierProps) {
  const { modele, fenetre, onFenetre, periode, onPeriode, vue, onVue, mouvements, onMouvements, orientation, apercu, onLectureSemaine, onIdeeSemaine, largeurColonne, onOuvrirFinances, onOuvrirRetard, onTrier, onFiltrer } = props;
  const paysage = orientation === 'paysage';
  const graph = vue === 'graph';
  const annee = vue === 'annee';
  const base = modele.courbe;
  const apercuC: CourbeCaisse | null = apercu ? ('semaines' in apercu ? apercu : apercu.courbe) : null;
  const courbeC = apercuC ?? base;
  const courbe = courbeC?.semaines ?? null;

  // Les semaines, la fenêtre dans leur suite.
  const semainesTot = useMemo(() => (base ? base.semaines.map(s => ({ debut: s.lundi, numero: s.numero })) : modele.semaines.map(s => ({ debut: s.debut, numero: s.numero }))), [base, modele.semaines]);
  const total = semainesTot.length;
  const premier = Math.max(0, semainesTot.findIndex(s => s.debut >= fenetre.du));
  const nombre = annee ? Math.max(1, total) : clamp(fenetre.semaines, 1, Math.max(1, total - premier));
  const index = annee ? 0 : premier;
  const visibles = semainesTot.slice(index, index + nombre);

  // La largeur : mesurée, sinon la colonne de la frise × le nombre de colonnes, sinon 390.
  const zone = useRef<HTMLDivElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const cadreCourbe = useRef<HTMLDivElement>(null);
  const cadreGrande = useRef<HTMLDivElement>(null);
  const boutonPeriode = useRef<HTMLButtonElement>(null);
  const mesure = useMesure(zone);
  const repliTotal = largeurColonne > 0 ? largeurColonne * Math.max(1, nombre) : 390;
  const repli = paysage && !graph ? Math.max(200, repliTotal - COLONNE_T - 8) : repliTotal;
  const largeur = mesure || repli;
  const hauteur = paysage ? HAUTEUR_COURBE.paysage : HAUTEUR_COURBE.portrait;
  const hauteurGrande = paysage ? clamp((typeof window !== 'undefined' ? window.innerHeight : 390) - 150, 150, 250) : 250;

  // Les états de l'en-tête.
  const [creuxOuvert, setCreuxOuvert] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [retardsOuverts, setRetardsOuverts] = useState(false);
  const [lecture, setLecture] = useState<number | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [plein, setPlein] = useState(() => estPleinEcran());
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vueAvant = useRef<VueCalendrier>('semaines');
  const fenAvantAnnee = useRef<FenetreSemaines | null>(null);

  const montrer = useCallback((i: Info, dureeMs: number | null) => {
    if (minuterie.current) clearTimeout(minuterie.current);
    setInfo(i);
    minuterie.current = dureeMs ? setTimeout(() => setInfo(null), dureeMs) : null;
  }, []);
  useEffect(() => () => { if (minuterie.current) clearTimeout(minuterie.current); }, []);

  // ---- La période de l'app et la fenêtre sont la même chose (E07, ET-PER, les deux sens) ----
  const fenRef = useRef(fenetre);
  fenRef.current = fenetre;
  const clePeriode = JSON.stringify(periode);
  useEffect(() => {
    if (!total) return;
    const d = fenetreDePeriode(periode, semainesTot[0].debut, total);
    if (!d) return;
    const f = fenRef.current;
    if (d.du !== f.du || d.semaines !== f.semaines) onFenetre(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clePeriode, total]);

  const ecrire = useCallback((f: FenetreSemaines) => { onFenetre(f); onPeriode(periodeDeFenetre(f)); }, [onFenetre, onPeriode]);

  // ---- La rotation : 13 semaines en paysage, la fenêtre d'avant au retour (E10). Jamais une période écrite : la rotation ne règle pas Finances ----
  const avantPaysage = useRef<FenetreSemaines | null>(null);
  const orientationVue = useRef<Orientation>('portrait');
  useEffect(() => {
    if (orientationVue.current === orientation) return;
    orientationVue.current = orientation;
    if (orientation === 'paysage') {
      setInfo(i => (i?.genre === 'invite' ? null : i));
      const f = (total ? fenetreDePeriode(periode, semainesTot[0].debut, total) : null) ?? fenRef.current;
      avantPaysage.current = f;
      if (f.semaines < 13) onFenetre({ du: f.du, semaines: 13 });
    } else if (avantPaysage.current) {
      onFenetre(avantPaysage.current);
      avantPaysage.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  // ---- Le plein écran (E09) ----
  useEffect(() => {
    const h = () => setPlein(estPleinEcran());
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const basculerPlein = async () => {
    if (plein) { await sortirPleinEcran(); setPlein(false); return; }
    const r = await entrerPleinEcran(document.documentElement);
    setPlein(estPleinEcran());
    if (r === 'invite' && !paysage) montrer({ genre: 'invite', texte: INVITATION }, null);
  };

  // ---- Le doigt sur la courbe : lire (c2-b), appui long (c3-a) ----
  const indexSous = (clientX: number): number => {
    const n = Math.max(1, courbe?.length ?? 1);
    if (graph && courbe) {
      const l = largeurGrande(largeur, paysage);
      const r = cadreGrande.current?.getBoundingClientRect();
      const g = geoGrande(courbe, l, hauteurGrande);
      return clamp(Math.floor((((clientX - (r?.left ?? 0)) * (r && r.width ? l / r.width : 1)) - g.xl) / g.unit), 0, n - 1);
    }
    const r = cadreCourbe.current?.getBoundingClientRect();
    return clamp(Math.floor((((clientX - (r?.left ?? 0)) * (r && r.width ? largeur / r.width : 1)) / (largeur / n))), 0, n - 1);
  };
  const { props: gestes } = usePointeurCourbe({
    indexSous,
    actif: !!courbe && !apercuC,
    onLire: i => setLecture(i),
    onAppuiLong: i => {
      if (vue === 'graph') return;
      vueAvant.current = vue;
      setLecture(i);
      onVue('graph');
    }
  });
  const gestesGrande = { ...gestes, onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => { gestes.onPointerDown(e); setLecture(indexSous(e.clientX)); } };

  const fermerLecture = () => { setLecture(null); if (vue === 'graph') onVue(vueAvant.current === 'graph' ? 'semaines' : vueAvant.current); };
  const fermerRef = useRef(fermerLecture);
  fermerRef.current = fermerLecture;
  useEffect(() => {
    if (lecture === null) return undefined;
    const dehors = (e: PointerEvent) => { if (racine.current && e.target instanceof Node && racine.current.contains(e.target)) return; fermerRef.current(); };
    document.addEventListener('pointerdown', dehors, true);
    return () => document.removeEventListener('pointerdown', dehors, true);
  }, [lecture]);
  const premiereLecture = useRef(true);
  useEffect(() => {
    if (premiereLecture.current) { premiereLecture.current = false; return; }
    onLectureSemaine?.(lecture !== null && courbe ? courbe[lecture]?.lundi ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture]);

  // ---- Les gestes de la fenêtre ----
  const versAnnee = () => {
    if (!total) return;
    fenAvantAnnee.current = fenetre;
    onVue('annee');
    ecrire({ du: semainesTot[0].debut, semaines: Math.min(SEMAINES_ANNEE, total) });
  };
  const quitterAnnee = () => {
    const f = fenAvantAnnee.current ?? { du: semainesTot[0]?.debut ?? fenetre.du, semaines: 6 };
    fenAvantAnnee.current = null;
    onVue('semaines');
    ecrire(f);
  };
  const choisirDuree = (n: number) => {
    if (n >= SEMAINES_ANNEE) { versAnnee(); return; }
    const depart = annee ? (fenAvantAnnee.current ?? fenetre) : fenetre;
    const i0 = Math.max(0, semainesTot.findIndex(s => s.debut >= depart.du));
    const i = total >= n ? Math.min(i0, total - n) : i0;
    fenAvantAnnee.current = null;
    ecrire({ du: semainesTot[i]?.debut ?? depart.du, semaines: n });
    if (annee || graph) onVue('semaines');
  };

  // ---- Ce qui se lit ----
  const creux = apercuC ? creuxDepuis(apercuC) : (modele.creux ?? (base ? creuxDepuis(base) : null));
  const icones = modele.icones ?? [];
  const idees = useMemo(() => new Set(icones.filter(i => i.genre === 'idee').map(i => i.lundi)), [icones]);
  const semainesRetard = useMemo(() => new Set(icones.filter(i => i.genre === 'retard').map(i => i.lundi)), [icones]);
  const retards = modele.retards ?? [];
  const sansDate = modele.sansDate?.length ?? 0;
  const premiereSemaine = visibles[0]?.debut ?? fenetre.du;
  const plage = `${jourCourt(premiereSemaine)} → ${jourCourt(ajouterJours(premiereSemaine, nombre * 7 - 1))}`;
  const libelle = libelleDuree(nombre, annee);
  // La rangée d'un mouvement (sa couleur) et les noms mis de côté viennent des choses du modèle.
  const rangeeDe = useMemo(() => {
    const parMouvement = new Map<string, string>();
    const parChose = new Map<string, string>();
    for (const c of modele.choses ?? []) { parChose.set(c.id, c.rangee); for (const id of c.mouvements ?? []) parMouvement.set(id, c.rangee); }
    return (m: MouvementNomme) => parMouvement.get(m.id) ?? (m.choseId ? parChose.get(m.choseId) : undefined);
  }, [modele.choses]);
  const nomsMisDeCote = useMemo(() => (modele.choses ?? []).filter(c => c.miseDeCote).map(c => c.titre), [modele.choses]);

  // Un toucher sur une semaine donne sa date ; un deuxième toucher sur la même l'efface (E04, D-158).
  const touche = (lundi: string, colonne: number) => {
    if (info?.genre === 'date' && info.cle === lundi) {
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = null;
      setInfo(null);
      return;
    }
    montrer({ genre: 'date', texte: dateDeSemaine(lundi), colonne, colonnes: Math.max(1, visibles.length), cle: lundi }, 3000);
  };

  // La mise de côté nommée sur la courbe (E03) : celle du creux, sinon la plus haute (calendrierCaisse, A10).
  const miseCourbe = useMemo(() => {
    if (!base || apercuC) return null;
    const m = miseDeCoteVisible(base, creux);
    return m ? { i: m.index, centimes: m.centimes, titres: m.titres } : null;
  }, [base, apercuC, creux]);
  // Dans l'année, le cadre dit les mois (c1-d : « nov. – oct. »).
  // Les douze mois de la bande de l'année (le premier, puis onze de plus : « nov. – oct. »), pas le treizième que touche la 52e semaine.
  const etiquetteAnnee = total ? `${MOIS_MIN[moisDeSemaine(semainesTot[0].debut)]} – ${MOIS_MIN[(moisDeSemaine(semainesTot[0].debut) + 11) % 12]}` : undefined;

  // Le chiffre clé sur UNE ligne, comme z2s (« 113 CHF à dépenser · S24 ») ; la phrase entière est dans son nom accessible (E01, D-181).
  const cle = courbe && creux ? (
    <button type="button" className="ent-k" data-ent-cle aria-expanded={creuxOuvert}
      aria-label={`${chf(creux.centimes)} CHF à dépenser sans passer sous 0 (S${creux.numero}) : voir ses causes`} onClick={() => setCreuxOuvert(o => !o)}>
      <b className={creux.centimes < 0 ? 'ent-neg' : undefined}>{chf(creux.centimes)}</b><span className="ent-k-u">CHF à dépenser ·</span><em>{`S${creux.numero}`}</em>
    </button>
  ) : <span className="ent-k ent-k-vide" />;

  return (
    <div ref={racine} className={`ent ent--${orientation}`} data-vue={vue} data-calendrier-entete aria-label="En-tête du calendrier" role="group">
      <div className="ent-t">
        {lecture !== null && !graph && courbeC ? <LectureTete courbe={courbeC} index={lecture} /> : cle}
        <span className="ent-t-b">
          <button type="button" className="ent-mb" aria-pressed={mouvements} title="Afficher les + et − et les icônes de chaque semaine" onClick={() => onMouvements(!mouvements)}>±</button>
          <button ref={boutonPeriode} type="button" className="ent-per" data-ent-periode aria-haspopup="dialog" aria-expanded={menuOuvert} title="Période, liste, tri et filtre" onClick={() => setMenuOuvert(o => !o)}>
            {libelle}<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
          {retards.length > 0 && (
            <button type="button" className="ent-ret-b" aria-label={titreRetards(retards.length)} onClick={() => setRetardsOuverts(true)}><Clock size={16} strokeWidth={2.4} aria-hidden="true" />{retards.length}</button>
          )}
          <button type="button" className="ent-pl" aria-label={plein ? 'Quitter le plein écran' : 'Plein écran'} onClick={() => { void basculerPlein(); }}>
            {plein ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
          </button>
        </span>
      </div>

      <div ref={zone} className="ent-cbz">
        {graph && courbeC && courbe ? (
          <GrandeCourbe courbe={courbeC} rangeeDe={rangeeDe} largeur={largeur} hauteur={hauteurGrande} paysage={paysage} lecture={lecture} onFermer={fermerLecture} reference={cadreGrande} gestes={gestesGrande} />
        ) : courbe && base ? (
          <Courbe courbe={courbe} largeur={largeur} hauteur={hauteur} curseur={lecture} reference={cadreCourbe} gestes={apercuC ? undefined : gestes} mise={miseCourbe}
            cadre={apercuC ? undefined : { index, nombre, etiquette: etiquetteCadre(semainesTot.map(s => s.numero), index, nombre, annee, etiquetteAnnee) }}>
            {apercuC ? (
              <div className="ent-zoom-c" style={{ height: hauteur }}>
                <CourbeZoom avant={base.semaines.slice(index, index + nombre).map(s => s.libre)} apres={apercuC.semaines.slice(index, index + nombre).map(s => s.libre)} largeur={largeur} hauteur={hauteur - HAUTEUR_MOIS + 8} />
              </div>
            ) : (
              <Cadre numeros={semainesTot.map(s => s.numero)} index={index} nombre={nombre} largeur={largeur} annee={annee}
                onChange={c => ecrire({ du: semainesTot[c.index].debut, semaines: c.nombre })} onAnnee={versAnnee} onRevient={quitterAnnee}
                onTropCourt={() => montrer({ genre: 'message', texte: MESSAGE_ANNEE }, 4000)} etiquetteAnnee={etiquetteAnnee} />
            )}
          </Courbe>
        ) : base === null ? (
          <p className="ent-inconnu">
            Solde de départ inconnu : à régler dans <a className="ent-lien" href="#finances" onClick={e => { e.preventDefault(); onOuvrirFinances?.(); }}>Finances › Solde</a>
          </p>
        ) : null}
      </div>

      {!graph && (
        <div className="ent-bz">
          {annee && courbe ? <BandeAnnee courbe={courbe} mois={modele.mois} /> : (
            <BandeSemaines semaines={visibles} courbe={courbe} decalage={index} mouvements={mouvements} idees={idees} retards={semainesRetard} onDate={touche} onIdeeSemaine={onIdeeSemaine} />
          )}
        </div>
      )}

      {lecture !== null && !graph && courbeC && <div className="ent-lu"><LectureDetail courbe={courbeC} index={lecture} rangeeDe={rangeeDe} /></div>}
      <div className="ent-live" aria-live="polite">
        {info && <p className={`ent-info ent-info--${info.genre}`} data-info={info.genre}
          style={info.genre === 'date' ? { left: `clamp(80px, ${(((info.colonne ?? 0) + 0.5) / (info.colonnes ?? 1)) * 100}%, calc(100% - 80px))` } : undefined}>{info.texte}</p>}
      </div>

      {creuxOuvert && courbe && creux && <DetailCreux courbe={courbe} index={creux.index} hypotheses={modele.hypotheses} nomsMisDeCote={nomsMisDeCote} onOuvrirFinances={onOuvrirFinances} onFermer={() => setCreuxOuvert(false)} />}
      {menuOuvert && (
        <MenuPeriode ancre={boutonPeriode.current} paysage={paysage} plage={plage} semaines={nombre} annee={annee} liste={vue === 'liste'} sansDate={sansDate}
          onChoisir={choisirDuree} onListe={() => onVue('liste')} onCalendrier={() => onVue('semaines')} onSansDate={() => onVue('liste', 'sans-date')}
          onTrier={onTrier} onFiltrer={onFiltrer} onFermer={() => setMenuOuvert(false)} />
      )}
      {retardsOuverts && <Retards retards={retards} onOuvrir={onOuvrirRetard} onFermer={() => setRetardsOuverts(false)} />}
    </div>
  );
}
