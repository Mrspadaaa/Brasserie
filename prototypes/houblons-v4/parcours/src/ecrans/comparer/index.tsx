// Comparer — « Cascade, Idaho 7 ou Galaxy pour ma stout ? ». r6a, le choix du brasseur (« r6a reste le meilleur »,
// 23.10), portée en React et calculée en direct par le moteur, avec les petites améliorations des autres versions
// (NOTE.md, « Idées reprises ») et, D124, ce que r6n2 montrait sous le premier écran de r6a (« r6n2 donne vraiment
// bien ») : la pastille de critère, « pourquoi ? », la carte du houblon derrière le « + » et le dock à six feuilles
// (Défi · Égaler · Valeurs · Preuve · Frise · Souche). Un seul facteur libre : le houblon (retenir une colonne, en
// ajouter une 4ᵉ) ; le critère ne fait que classer. Dose, moment et levure sont fixés sur la ligne de contexte.
// Ponts : « Placer <retenu> » → Dryhopper ; Suggérer, Levure depuis les feuilles.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CadreOutil, COULEURS, COURT, Legende, LigneContexte, Picto, Pont, nombre, plage, useAppuiLong } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import { CONDITIONS, H, VISEE, nomLevure } from '../../donnees/cas';
import { useRecette } from '../../etat/EtatParcours';
import { nouvelId } from '../../etat/operations';
import { style } from '../../moteur';
import { STOCK, hopRef, type FamilyId } from '../../../../src/engine';
import Fiche from '../fiche';
import { ABSOLU, CRITERES, ORANGE, depart, houblonDeBase, lireColonnes, lireEtapes, reponse, scoreDefi, type CelluleLue, type ColonneLue, type Critere } from './calcul';
import { AuxEtapes, PiedEtapes } from './Etapes';
import {
  FeuilleAjouter, FeuilleDefi, FeuilleDock, FeuilleEgaler, FeuilleFrise, FeuillePourquoi, FeuillePreuve, FeuilleSouche, FeuilleValeurs, Point, signeCran,
} from './Feuilles';
import { Chevron, IconeCible, IconeEgal, IconeFiole, IconeFrise, IconeLivre, IconeOk, IconePanel, IconeRisque, IconeSouche, IconeStock } from './icones';
import { Radar } from './Radar';
import './comparer.css';

/** Ta dégustation du 18.10 : « trop résineuse, je la veux plus florale ». */
const TROP: FamilyId = 'resin';
const MAX_COLONNES = 4;
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;
const nombreMot = (n: number) => ['aucun', 'le seul', 'les deux', 'les trois', 'les quatre'][n] ?? `les ${n}`;
type FeuilleOuverte = null | 'defi' | 'egaler' | 'valeurs' | 'preuve' | 'frise' | 'souche' | 'ajouter' | 'pourquoi';

export default function Comparer({ houblons }: { houblons: string[] }) {
  const recette = useRecette();
  const ouvrir = useOuvrir();
  const { route, aller } = useNavigation();
  const sc = style(recette.styleCode);
  // Le houblon épinglé par Substituer (#/comparer?h=…&pin=<houblon>), porté par la route : en colonne 1.
  const pin = route.ecran === 'comparer' ? route.pin ?? null : null;
  const [ajoutes, setAjoutes] = useState<string[]>([]);
  const cles = useMemo(() => {
    const base = [...(pin ? [pin] : []), ...houblons, ...ajoutes];
    return [...new Set(base)].filter((c) => !!hopRef(c)).slice(0, MAX_COLONNES);
  }, [houblons, ajoutes, pin]);
  // En direct : le moteur simule chaque houblon à chaque changement de la recette ou des colonnes (mémoïsé).
  const cols = useMemo(() => lireColonnes(recette, cles), [recette, cles]);
  // Aux étapes (D107) : chaque houblon et la référence (le houblon de base de ta recette) à 60′, 10′ et au dry hop.
  const reference = useMemo(() => houblonDeBase(recette, cles), [recette, cles]);
  const etapes = useMemo(() => lireEtapes(recette, reference ? [...cles, reference] : cles), [recette, cles, reference]);
  // Le critère de classement (r6n2) : floral au départ (ta demande). Il change le ★, la réponse et le mis en avant.
  const [critere, setCritere] = useState<Critere>(CRITERES[0]);
  const [retenu, setRetenu] = useState<string | null>(null);
  const cleRetenue = retenu && cols.some((c) => c.cle === retenu) ? retenu : depart(cols, critere.famille, critere.sens) ?? cols[0]?.cle ?? '';
  const sel = cols.find((c) => c.cle === cleRetenue) ?? null;
  const rep = useMemo(() => reponse(cols, cleRetenue, critere.famille, critere.sens), [cols, cleRetenue, critere]);
  const [absolu, setAbsolu] = useState(false);
  const [feuille, setFeuille] = useState<FeuilleOuverte>(null);
  const basculer = (f: FeuilleOuverte) => setFeuille((x) => (x === f ? null : f));
  const fermer = useCallback(() => setFeuille(null), []);
  const [fiche, setFiche] = useState<string | null>(null);

  // La fiche (composant de la voie p1) pousse une entrée d'historique : le retour du téléphone et sa fermeture
  // (retour) la referment, Comparer reste dessous, intact.
  useEffect(() => {
    const fermerFiche = () => setFiche(null);
    window.addEventListener('popstate', fermerFiche);
    return () => window.removeEventListener('popstate', fermerFiche);
  }, []);
  // Pont provisoire (RESULTAT.md, besoin vers p1) : la fiche marque sa feuille data-role="fiche" à son montage,
  // avant que la feuille (portail) n'existe quand elle s'ouvre hors de sa route ; on pose la marque si elle manque.
  useEffect(() => {
    if (!fiche) return;
    let n = 0;
    const id = window.setInterval(() => {
      const d = document.querySelector('[data-ecran="fiche"]')?.closest('[role="dialog"]');
      if (d && !d.hasAttribute('data-role')) d.setAttribute('data-role', 'fiche');
      if (d || ++n > 20) window.clearInterval(id);
    }, 25);
    return () => window.clearInterval(id);
  }, [fiche]);
  const ouvrirFiche = (cle: string, apresAppui = false) => {
    if (fiche) return;
    if (apresAppui) {
      // Au doigt, le « click » qui suit le relâché tombe sur le voile de la feuille tout juste ouverte et la
      // refermerait : ce seul click est avalé (800 ms au plus).
      const avaler = (e: Event) => { e.stopPropagation(); e.preventDefault(); window.removeEventListener('click', avaler, true); };
      window.addEventListener('click', avaler, true);
      window.setTimeout(() => window.removeEventListener('click', avaler, true), 800);
    }
    setFeuille(null);
    aller({ ecran: 'comparer', houblons: cles.filter((c) => c !== pin), ...(pin ? { pin } : {}) });
    setFiche(cle);
  };

  const lignes = sc.order.filter((f) => !cols.every((c) => c.cellules[f].inconnu));
  const tousInconnus = sc.order.filter((f) => cols.length > 0 && cols.every((c) => c.cellules[f].inconnu));
  const noms = cols.map((c) => c.houblon.nom);
  const question = `${noms.slice(0, -1).join(', ')}${noms.length > 1 ? ' ou ' : ''}${noms.at(-1) ?? ''} pour ma stout ?`;
  const quatre = cols.length >= 4;
  const disponibles = STOCK.filter((s) => s.grams > 0 && !cles.includes(s.key)).map((s) => s.key);
  const placer = () => sel && ouvrir({ ecran: 'dryhopper', ajout: nouvelId(recette, sel.cle) });
  // La question de r6a est le titre de l'écran : le h1 que le cadre (CadreOutil du socle) pose sous l'en-tête commun
  // (D119, onglets et croix), en tête du contenu ; il porte la marque r6a-question (D104).
  useEffect(() => {
    document.querySelectorAll('.pq-outil-comparer h1').forEach((h) => { if (h.textContent?.trim() === question) h.setAttribute('data-element', 'r6a-question'); });
  }, [question]);
  const score = sel ? scoreDefi(sel) : null;
  // Le pont nomme son outil (title du bouton de Pont, composant du socle) : « Doser Idaho 7 dans Dryhopper », comme r6a.
  const refPont = useRef<HTMLSpanElement>(null);
  const nomRetenu = sel?.houblon.nom ?? '';
  useEffect(() => { refPont.current?.querySelector('button')?.setAttribute('title', `Doser ${nomRetenu} dans Dryhopper`); }, [nomRetenu]);

  return (
    <CadreOutil ecran="comparer" question={question}
      contexte={
        <div className="pq-comparer-tete" role="group" data-etat="etat-comp-repos" data-element="etat-acquis-comparer-v3"
          aria-label={`Fixé pour ${nombreMot(cols.length)} : Stout ${sc.code}, dose égale ${nombre(CONDITIONS.doseGL)} g/L chacun, ${nomLevure(recette.yeastId)}`}>
          <LigneContexte items={[
            { cle: 'base', contenu: <span data-element="y1b-ligne-contexte r6a-contexte">Stout {sc.code}</span> },
            { cle: 'dose', contenu: <span className="pq-comparer-dose" aria-label={`dose égale : ${nombre(CONDITIONS.doseGL)} g/L chacun`}><IconeEgal />{nombre(CONDITIONS.doseGL)} g/L</span> },
            { cle: 'levure', contenu: <span data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change">{nomLevure(recette.yeastId)}</span> },
          ]} />
          <span data-element="l8b-legende-cachee" data-etat="etat-comp-legende"><Legende><ContenuLegende /></Legende></span>
        </div>
      }
      dock={sel && (
        <nav className="pq-comparer-dock" aria-label="Le reste, à un toucher" data-element="etat-acquis-r6n2-dock">
          <BoutonDock nom="defi" actif={feuille === 'defi'} etat="etat-comp-defi" ouvre="y1b-defi y1b-jauge-amertume w2-piste-commune s5-deux-objectifs" onClick={() => basculer('defi')} icone={<IconeCible taille={18} />}
            label={<>Défi <b className="pq-comparer-nb">{`${score!.points}/${score!.sur}`}</b></>} aria={`Défi : ${sel.houblon.nom} tient ${score!.points} critères sur ${score!.sur}`} />
          <BoutonDock nom="egaler" actif={feuille === 'egaler'} etat="etat-comp-egaler" ouvre="y3-pour-egaler" controle="pq-comparer-egaler" onClick={() => basculer('egaler')} icone={<IconeEgal taille={18} label="" />} label="Égaler" />
          <BoutonDock nom="valeurs" actif={feuille === 'valeurs'} etat="etat-comp-chimie" ouvre="r6a-chimie v1-vraies-valeurs v1-en-a-plus v1-linalol-en-biere d1-tout-ouvert p03-plages-sources" onClick={() => basculer('valeurs')} icone={<IconeFiole taille={18} />} label="Valeurs" aria="Valeurs : chimie et vraies valeurs" />
          <BoutonDock nom="preuve" actif={feuille === 'preuve'} etat="etat-comp-preuve" ouvre="r6a-osu y3-panel-osu y1b-tirage-preuve" onClick={() => basculer('preuve')} icone={<IconePanel taille={18} />} label="Preuve" aria="Preuve : panel OSU et 20 bières tirées" />
          <BoutonDock nom="frise" actif={feuille === 'frise'} etat="etat-comp-frise-levure" onClick={() => basculer('frise')} icone={<IconeFrise taille={18} />} label="Frise" />
          <BoutonDock nom="souche" actif={feuille === 'souche'} onClick={() => basculer('souche')} icone={<IconeSouche taille={18} />} label="Souche" />
        </nav>
      )}>
      <div className="pq-comparer" data-colonnes={cols.length}>
        <div className="pq-comparer-crit">
          <PastilleCritere critere={critere} onChoisir={(c) => { setCritere(c); setRetenu(null); }} />
          {sel && (
            <span ref={refPont} className="pq-comparer-placer" data-etat="etat-comp-placer" data-element="y1b-dock-pouce y1b-second-houblon-puis">
              <Pont nom="placer" onClick={placer}>Placer {sel.houblon.nom}</Pont>
            </span>
          )}
        </div>
        {rep && <LigneReponse rep={rep} critere={critere} onPourquoi={() => basculer('pourquoi')} />}

        <section className="pq-comparer-rad" data-acquis="radar" data-element="r6a-radar p03-radar-superpose p02-radar-intervalle h4-radar-demande" aria-label="Radar r2">
          <div className="pq-comparer-rad-h">
            <span className="pq-comparer-puce" data-nature="simule" data-element="r6a-simule" title="profil simulé par le moteur">~ simulé</span>
            <span className="pq-comparer-lentille" role="radiogroup" aria-label="Lecture" data-lecture="" data-element="r6a-lentille">
              <button type="button" role="radio" data-e="style" aria-checked={!absolu} onClick={() => setAbsolu(false)}>Au style</button>
              <button type="button" role="radio" data-e="absolu" data-etat="etat-comp-absolu" aria-checked={absolu} onClick={() => setAbsolu(true)}>Absolu</button>
            </span>
          </div>
          {sel && <Radar axes={sc.order} cols={cols} retenu={cleRetenue} absolu={absolu} visee={VISEE.famille} trop={TROP} />}
        </section>

        <section className="pq-comparer-tab" data-role="simulation" aria-label="Les houblons, côte à côte"
          data-element="l8-disposition y1b-plan-d-avant y1b-bandes-style l5b-barres-voie l5b-pistes-objectif">
          <div className="pq-comparer-grille-tab pq-comparer-tetes" role="radiogroup" aria-label="Houblon retenu" data-libre="houblon"
            data-element="r6a-tetes l5f-carte-role-alpha w2-cartes-verdict p06-grille-familles g1-fiche fiche-citra-cryo l8b-verdicts-pictos-trait">
            <TaStout quatre={quatre} plein={cols.length >= MAX_COLONNES || !disponibles.length} ouvert={feuille === 'ajouter'} onPlus={() => basculer('ajouter')} />
            {cols.map((c) => (
              <TeteColonne key={c.cle} c={c} retenu={c.cle === cleRetenue} quatre={quatre} epinglee={c.cle === pin}
                retirable={ajoutes.includes(c.cle)}
                onRetenir={() => setRetenu(c.cle)} onFiche={(apresAppui) => ouvrirFiche(c.cle, apresAppui)}
                onRetirer={() => { setAjoutes((a) => a.filter((x) => x !== c.cle)); if (retenu === c.cle) setRetenu(null); }} />
            ))}
          </div>
          <AuxEtapes cols={cols} etapes={etapes} reference={reference} nomReference={reference ? hopRef(reference)?.name ?? reference : null} retenu={cleRetenue} />
          <p className="pq-comparer-rg-t">Toutes les familles <b>au dry hop, après {CONDITIONS.jours} j</b>, comme le radar</p>
          <div className="pq-comparer-rgs" data-element="r6a-rangees">
            {lignes.map((f, i) => (
              <div key={f} className={cx('pq-comparer-grille-tab pq-comparer-rg', (f === VISEE.famille || f === TROP) && 'pq-comparer-demande', i === lignes.length - 1 && 'pq-comparer-derniere')} data-famille-ligne={f}
                {...(f === VISEE.famille || f === TROP ? { 'data-element': 'r6a-ecarts' } : {})}>
                <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}>
                  <Picto famille={f} />{!quatre && <span>{COURT[f]}</span>}
                  {f === VISEE.famille && <span className="pq-comparer-dem" aria-label="ta demande : plus de floral">↑</span>}
                  {f === TROP && <span className="pq-comparer-dem pq-comparer-dem-trop" aria-label="ta dégustation : trop de résineux">↓</span>}
                </span>
                {cols.map((c) => <Cellule key={c.cle} c={c} cel={c.cellules[f]} retenu={c.cle === cleRetenue} absolu={absolu} montre={f === VISEE.famille || f === TROP} />)}
              </div>
            ))}
            {tousInconnus.length > 0 && (
              <div className="pq-comparer-grille-tab pq-comparer-rg pq-comparer-inc-t" data-element="r6a-inconnus">
                <span className="pq-comparer-rn">{tousInconnus.map((f) => <Picto key={f} famille={f} />)}</span>
                <span className="pq-comparer-inc-l"><i className="pq-comparer-hach" aria-hidden="true" />inconnus, pas zéro</span>
              </div>
            )}
          </div>
          <PiedEtapes cols={cols} retenu={cleRetenue} onDryhopper={placer} />
        </section>
        {/* D114 : le panel OSU (un acquis) reste replié, au rang d'une note, sous le tableau comme dans r6a ; un toucher ouvre
            Preuve, sa feuille dans le dock de r6n2. */}
        <section className="pq-comparer-osu-ligne" aria-label="Panel OSU">
          <button type="button" className="pq-comparer-lien pq-comparer-osu-tch" data-ouvre-element="y3-panel-osu r6a-osu" onClick={() => setFeuille('preuve')}>Panel OSU, Cascade : la courbe mesurée, dans Preuve ›</button>
        </section>
        <p className="pq-comparer-vsrc">~ simulé par le moteur à {nombre(CONDITIONS.doseGL)} g/L chacun : centre conventionnel, bande = incertitude. Le reste, à un toucher sous le pouce.</p>
      </div>

      {sel && feuille === 'defi' && <FeuilleDock titre="Ton défi" onFermer={fermer}><FeuilleDefi cols={cols} retenu={cleRetenue} etapes={etapes} onSuggerer={() => ouvrir({ ecran: 'suggerer' })} /></FeuilleDock>}
      {sel && feuille === 'egaler' && <FeuilleDock titre="Pour égaler" id="pq-comparer-egaler" onFermer={fermer}><FeuilleEgaler cols={cols} sel={sel} critere={critere} etapes={etapes} /></FeuilleDock>}
      {sel && feuille === 'valeurs' && <FeuilleDock titre="Vraies valeurs et chimie" onFermer={fermer}><FeuilleValeurs cols={cols} sel={sel} quatre={quatre} etapes={etapes} familles={sc.order} onPreuve={() => setFeuille('preuve')} /></FeuilleDock>}
      {sel && feuille === 'preuve' && <FeuilleDock titre="La preuve : mesuré et tiré" onFermer={fermer}><FeuillePreuve cols={cols} familles={lignes} /></FeuilleDock>}
      {sel && feuille === 'frise' && <FeuilleDock titre="Le moment, dans Dryhopper" onFermer={fermer}><FeuilleFrise cols={cols} sel={sel} onDryhopper={placer} /></FeuilleDock>}
      {sel && feuille === 'souche' && <FeuilleDock titre="La souche, dans Levure" onFermer={fermer}><FeuilleSouche cols={cols} sel={sel} familles={lignes} onLevure={() => ouvrir({ ecran: 'levure', ajout: nouvelId(recette, sel.cle) })} /></FeuilleDock>}
      {feuille === 'ajouter' && <FeuilleDock titre="Ajouter un houblon" onFermer={fermer}><FeuilleAjouter disponibles={disponibles} onAjouter={(cle) => { setFeuille(null); setAjoutes((a) => [...a, cle]); setRetenu(cle); }} /></FeuilleDock>}
      {feuille === 'pourquoi' && <FeuilleDock titre="Pourquoi ce classement" onFermer={fermer}><FeuillePourquoi cols={cols} critere={critere} /></FeuilleDock>}
      {fiche && <Fiche houblon={fiche} />}
    </CadreOutil>
  );
}

// ---------- le dock de r6n2 : une icône et un mot, sous le pouce ----------
function BoutonDock({ nom, actif, etat, ouvre, controle, onClick, icone, label, aria }: {
  nom: string; actif: boolean; etat?: string; ouvre?: string; controle?: string; onClick: () => void; icone: React.ReactNode; label: React.ReactNode; aria?: string;
}) {
  return (
    <button type="button" className="pq-comparer-dk" data-dock={nom} aria-pressed={actif} aria-haspopup="dialog" onClick={onClick}
      {...(etat ? { 'data-etat': etat } : {})} {...(ouvre ? { 'data-ouvre-element': ouvre } : {})} {...(controle ? { 'aria-controls': controle } : {})} {...(aria ? { 'aria-label': aria } : {})}>
      {icone}<span>{label}</span>
    </button>
  );
}

// ---------- « Face à ta stout, par [floral ⌄] » (y1b, r6n2) ----------
function PastilleCritere({ critere, onChoisir }: { critere: Critere; onChoisir: (c: Critere) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    const hors = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('keydown', k);
    document.addEventListener('pointerdown', hors);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('pointerdown', hors); };
  }, [ouvert]);
  return (
    <span ref={ref} className="pq-comparer-crit-g" data-element="y1b-pastille-critere">
      <span className="pq-comparer-crit-l">Face à ta stout, par</span>
      <button type="button" className="pq-comparer-crit-p" data-etat="etat-comp-critere" aria-haspopup="listbox" aria-expanded={ouvert}
        aria-label={`Critère de classement : ${critere.nom}`} onClick={() => setOuvert((o) => !o)}>
        <Picto famille={critere.famille} taille={14} /><span>{critere.nom.replace('moins ', '− ')}</span><Chevron ouvert={ouvert} />
      </button>
      {ouvert && (
        <span className="pq-comparer-menu pq-comparer-crit-m" role="listbox" aria-label="Critère de classement">
          {CRITERES.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected={c.id === critere.id} onClick={() => { setOuvert(false); onChoisir(c); }}>
              <Picto famille={c.famille} taille={16} />{c.nom}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

// ---------- la réponse face à ta stout (y1b, r6n2) et « contre ★ » (r6p2) ----------
function LigneReponse({ rep, critere, onPourquoi }: { rep: NonNullable<ReturnType<typeof reponse>>; critere: Critere; onPourquoi: () => void }) {
  const { etoile, autre, ecart, retenuEstEtoile } = rep;
  const nb = (x: number) => <span className="pq-comparer-nb" data-nature="simule">{signeCran(x)}</span>;
  const f = critere.famille;
  return (
    <p className="pq-comparer-rep" data-role="reponse" data-element="y1b-face-a-ta-stout" aria-live="polite">
      {retenuEstEtoile || !autre ? (
        <>
          <span className="pq-comparer-etoile" aria-label={`le ${critere.sens > 0 ? 'plus' : 'moins'} ${COURT[f].toLowerCase()} dans ta 16D`}>★</span><Point c={etoile} /><b>{etoile.houblon.nom}</b>
          {autre && ecart != null && <> devant <Point c={autre} /><b>{autre.houblon.nom}</b> {nb(ecart)} cran</>}
          <Picto famille={f} />
        </>
      ) : (
        <>
          <Point c={autre} /><b>{autre.houblon.nom}</b> {ecart != null ? nb(ecart) : <span data-inconnu="">?</span>} cran <Picto famille={f} />
          {' '}contre <span className="pq-comparer-etoile" aria-hidden="true">★</span><b>{etoile.houblon.nom}</b>
          {autre.sorties.length > 0 && <span className="pq-comparer-hors-mini" data-nature="simule" aria-label={`~ sort de ta 16D : ${autre.sorties.map((x) => COURT[x].toLowerCase()).join(', ')}`}>~<IconeRisque />{autre.sorties.map((x) => <Picto key={x} famille={x} taille={12} />)}</span>}
        </>
      )}
      <button type="button" className="pq-comparer-lien pq-comparer-pourquoi" onClick={onPourquoi}>pourquoi ?</button>
    </p>
  );
}

// ---------- Ta stout, et le « + » (p4, r6n2) ----------
function TaStout({ quatre, plein, ouvert, onPlus }: { quatre: boolean; plein: boolean; ouvert: boolean; onPlus: () => void }) {
  return (
    <div className="pq-comparer-ta" data-element="r6a-ta-stout m4-radar-degustation" aria-label="Ta stout : trop résineuse, tu la veux plus florale (dégustation du 18.10)">
      <span className="pq-comparer-ta-n"><i className="pq-comparer-trait" aria-hidden="true" />{!quatre && <b>Ta stout</b>}</span>
      <span className="pq-comparer-ta-l"><Picto famille={TROP} taille={14} />{!quatre ? <span>trop</span> : <span aria-hidden="true">↓</span>}</span>
      <span className="pq-comparer-ta-l"><Picto famille={VISEE.famille} taille={14} />{!quatre ? <span>plus</span> : <span aria-hidden="true">↑</span>}</span>
      {!plein && (
        <button type="button" className="pq-comparer-plus" data-role="ajouter-colonne" data-etat="etat-comp-colonne-plus" data-element="p4-plus-comparaison" aria-haspopup="dialog" aria-expanded={ouvert}
          aria-label="Ajouter un houblon à la comparaison" onClick={onPlus}>+</button>
      )}
    </div>
  );
}

// ---------- tête de colonne : nom, α, rôle en mot, familles, verdict (l5f, w2), stock en icône ----------
function TeteColonne({ c, retenu, quatre, epinglee, retirable, onRetenir, onFiche, onRetirer }: {
  c: ColonneLue; retenu: boolean; quatre: boolean; epinglee: boolean; retirable: boolean; onRetenir: () => void; onFiche: (apresAppui: boolean) => void; onRetirer: () => void;
}) {
  const appui = useAppuiLong(() => onFiche(true), onRetenir);
  // À l'ordinateur (souris, sans toucher) : un survol long ouvre aussi la fiche (D25).
  const survol = useRef<number | null>(null);
  const finSurvol = () => { if (survol.current != null) window.clearTimeout(survol.current); survol.current = null; };
  const surEntree = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    finSurvol();
    survol.current = window.setTimeout(() => onFiche(false), 700);
  };
  useEffect(() => finSurvol, []);
  const h = c.houblon;
  const a = h.alpha, lot = !!h.stock && hopRef(c.cle)?.stock?.alphaFrom === 'fiche de stock';
  const deduit = h.role.source.startsWith('règle');
  const familles = (Object.keys(h.familles) as FamilyId[]).filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((x, y) => (h.familles[y].niveau === 'marqué' ? 1 : 0) - (h.familles[x].niveau === 'marqué' ? 1 : 0)).slice(0, quatre ? 3 : 5);
  // Contrat de controle-etats (D124) : retenir Cascade, et l'appui long sur son nom (la fiche).
  const cascade = c.cle === H.cascade;
  return (
    <div className={cx('pq-comparer-tc-cel', retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }}>
      <button type="button" role="radio" aria-checked={retenu} data-role="reglage" data-col={c.cle}
        aria-label={`Retenir ${h.nom} ; appui long : sa fiche`} className="pq-comparer-tc" {...(cascade ? { 'data-etat': 'etat-comp-retenir' } : {})}
        {...appui}
        onPointerDown={(e) => { finSurvol(); appui.onPointerDown(e); }}
        onPointerEnter={surEntree} onPointerLeave={(e) => { finSurvol(); appui.onPointerLeave(); void e; }}>
        <span className="pq-comparer-tc-n">
          {epinglee && <span className="pq-comparer-pin" aria-label="épinglé : le houblon à remplacer">⌖</span>}
          <span className="pq-comparer-hn" data-houblon={c.cle} data-houblon-compare={c.cle} {...(cascade ? { 'data-etat': 'etat-comp-fiche' } : {})}>{h.nom}</span>
          {h.stock != null && h.stock > 0 && <IconeStock />}
        </span>
        <span className="pq-comparer-tc-a">
          {a ? (lot
            ? <span data-role="alpha" data-source="lot" data-nature="mesure" className={cx('pq-comparer-al', a.horsFiches && 'pq-comparer-al-hors')}
                aria-label={`α du lot en stock : ${nombre(a.valeur, 1)} %${a.horsFiches && a.plage ? ` ; hors des fiches (${plage(a.plage[0], a.plage[1])} %)` : ''}`}>
                α {nombre(a.valeur, 1)}%{a.horsFiches && <span aria-hidden="true"> ≠</span>}
              </span>
            : <span data-role="alpha" data-source="fiches" data-nature="mesure" className="pq-comparer-al pq-comparer-al-fi"
                aria-label={`α des fiches : ${a.plage ? plage(a.plage[0], a.plage[1]) : nombre(a.valeur, 1)} %`}>
                <IconeLivre />{a.plage ? (quatre ? `${nombre(a.plage[0], 1)}–${nombre(a.plage[1], 0)}` : plage(a.plage[0], a.plage[1])) : nombre(a.valeur, 1)}%
              </span>)
            : <span data-role="alpha" data-inconnu="" className="pq-comparer-al">α ?</span>}
        </span>
        {h.role.mot && (
          <span className={cx('pq-comparer-us', deduit && 'pq-comparer-deduit')} data-role="usage" data-usage={h.role.mot === 'mixte' ? 'double' : h.role.mot}
            data-source={deduit ? 'règle' : 'fournisseur'} aria-label={`Usage : ${h.role.mot}${deduit ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}`}>{h.role.mot}</span>
        )}
        <span className="pq-comparer-tc-f" aria-label="ses familles, d’après ses fiches">
          {familles.map((f) => <Picto key={f} famille={f} taille={h.familles[f].niveau === 'marqué' ? 16 : 13} />)}
        </span>
        <span className="pq-comparer-tc-v">
          {c.sorties.length
            ? <span className="pq-comparer-vd pq-comparer-vd-hors" data-nature="simule" aria-label={`~ sort de ta 16D : ${c.sorties.map((f) => COURT[f].toLowerCase()).join(', ')}`}>~<IconeRisque />{c.sorties.map((f) => <Picto key={f} famille={f} taille={12} />)}</span>
            : <span className="pq-comparer-vd pq-comparer-vd-dans" data-nature="simule" aria-label="~ reste dans ta 16D, hors le résineux déjà au-dessus">~<IconeOk /></span>}
        </span>
        {h.partSansFamille != null && h.partSansFamille > 0.5 && (
          <span className="pq-comparer-autres" aria-label={`autres : ${nombre(h.partSansFamille * 100)} % de ses mots hors des 12 familles`}>
            <i data-role="autres" data-houblon={h.nom} data-part={String(h.partSansFamille)} style={{ width: `${Math.max(24, Math.round(h.partSansFamille * 40))}px` }} />
            <span>autres</span>
          </span>
        )}
      </button>
      {retirable && <button type="button" className="pq-comparer-retirer" aria-label={`Retirer ${h.nom} de la comparaison`} onClick={onRetirer}>×</button>}
    </div>
  );
}

// ---------- une cellule : la barre de l5b face à ta 16D ----------
function Cellule({ c, cel, retenu, absolu, montre }: { c: ColonneLue; cel: CelluleLue; retenu: boolean; absolu: boolean; montre: boolean }) {
  const nom = COURT[cel.famille];
  if (cel.inconnu) {
    return (
      <span className={cx('pq-comparer-cel pq-comparer-cel-inc', retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }} data-col={c.cle}
        role="img" aria-label={`${nom}, ${c.houblon.nom} : apport inconnu, pas zéro (${cel.raison ?? ''})`}>
        <i className="pq-comparer-hach" />
      </span>
    );
  }
  const k = absolu ? ABSOLU : cel.domaine;
  const s = (x: number) => x / k;
  const bande = cel.bandeHaut;
  const z = bande != null ? s(bande) : 0;
  const gb = s(bande != null ? Math.min(cel.centre, bande) : cel.centre);
  const xo = bande != null && cel.centre > bande ? Math.min(1, s(cel.centre)) - Math.min(1, s(bande)) : 0;
  const depasse = s(cel.centre) > 1;
  const d = cel.dCran;
  return (
    <span className={cx('pq-comparer-cel', retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }} data-col={c.cle} role="img"
      aria-label={`${nom}, ${c.houblon.nom} ${nombre(CONDITIONS.doseGL)} g/L : ~ ${nombre(cel.centre)} sur 100 (bande ${nombre(cel.bas)}–${nombre(cel.haut)})${d != null ? `, ${signeCran(d)} cran` : ''}${bande != null ? ` ; ta 16D jusqu’à ${nombre(bande)}` : ''}${cel.hors ? ' : au-dessus' : ''}`}>
      <span className="pq-comparer-pis">
        {bande != null && <i data-role="zone" data-famille={cel.famille} className="pq-comparer-zo" style={{ width: pc(z), background: COULEURS[cel.famille].fond, boxShadow: `inset -1.5px 0 0 ${COULEURS[cel.famille].texte}` }} />}
        <i data-famille={cel.famille} className="pq-comparer-ba" style={{ width: pc(gb), background: COULEURS[cel.famille].base }} />
        {xo > 0 && <i className="pq-comparer-xo" style={{ left: pc(Math.min(1, s(bande ?? 0))), width: pc(xo), background: ORANGE }} />}
        <i data-role="incertitude-cellule" className="pq-comparer-wh" style={{ left: pc(s(cel.bas)), width: pc(Math.min(1, s(cel.haut)) - Math.min(1, s(cel.bas))) }} />
        {cel.avant != null && <i className="pq-comparer-av" style={{ left: `calc(${pc(s(cel.avant))} - 1px)` }} />}
        {depasse && <i className="pq-comparer-fl" style={{ borderLeftColor: ORANGE }} aria-hidden="true" />}
      </span>
      {montre && d != null && <span className={cx('pq-comparer-dl', cel.hors || (cel.famille === TROP && d > 0) ? 'pq-comparer-dl-hors' : '')} data-nature="simule">{signeCran(d)}</span>}
    </span>
  );
}

// ---------- légende, derrière « ? » (D89), dans la forme de r6a ----------
function ContenuLegende() {
  const sc = style('16D');
  return (
    <div className="pq-comparer-leg">
      <p><b>Les familles</b></p>
      <p className="pq-comparer-leg-f">{sc.order.map((f) => <span key={f} style={{ color: COULEURS[f].texte }}><Picto famille={f} taille={12} />{COURT[f]}</span>)}</p>
      <p><b>Une barre, par houblon</b></p>
      <p>zone pâle : ce que ta 16D permet ; barre : ~ simulé à 4 g/L ; trait fin : sa bande d’incertitude ; trait noir : ta stout aujourd’hui ; orangé : au-dessus de ta 16D ; hachuré : inconnu, jamais zéro.</p>
      <p><b>~+1,3</b> : crans du style gagnés. ↑ ↓ : ta demande du 18.10.</p>
      <p><b>Aux étapes</b> (60′, 10′, dry hop) : chaque houblon posé à ce moment, à 4 g/L ; le nombre : crans de floral gagnés ; bande orangée : le résineux gagné ; pointillé gris : ton Nugget au même moment ; en gras, le plus floral de l’étape. Le radar et les rangées : au dry hop, après 3 j.</p>
      <p><b>Le radar</b> : le houblon retenu plein, avec son intervalle en trait fin (// : il continue au-delà) ; les autres en contour.</p>
      <p><b>★</b> : le meilleur par le critère qui reste dans ta 16D. Toucher une colonne la retient ; appui long sur un nom : sa fiche ; « + » : un 4ᵉ houblon de ton stock.</p>
      <p><b>Sous le pouce</b> : Défi (tes deux objectifs), Égaler, Valeurs (chimie), Preuve (panel, 20 bières), Frise (le moment), Souche (la levure).</p>
    </div>
  );
}
