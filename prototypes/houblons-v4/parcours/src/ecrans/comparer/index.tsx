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
import { ABSOLU, CRITERES, ETAPES, ORANGE, depart, type CodeEtape, houblonDeBase, lireColonnes, lireEtapes, reponse, scoreDefi, sesMots, type MotLu, type CelluleLue, type ColonneLue, type Critere } from './calcul';
import { BandeEtapes, PiedEtapes } from './Etapes';
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
  // D128 : le premier écran est celui de r6a (radar, colonnes, rangées de familles) ; les étapes de x3b deviennent un
  // sélecteur sur ces rangées et le radar. Au dry hop (départ), les colonnes de r6a ; à 60′ ou 10′, le moteur pose
  // chaque houblon à ce moment, à la même dose. Le Défi et les feuilles du dock restent au dry hop (leur moment).
  const [moment, setMoment] = useState<CodeEtape>('dryPost');
  const vue = useMemo(() => (moment === 'dryPost' ? cols : lireColonnes(recette, cles, undefined, ETAPES.find((e) => e.code === moment)!.quand)), [recette, cles, cols, moment]);
  // Aux étapes (D107) : chaque houblon et la référence (le houblon de base de ta recette) à 60′, 10′ et au dry hop.
  const reference = useMemo(() => houblonDeBase(recette, cles), [recette, cles]);
  // D128 bis : ses mots, tirés de ses fiches, face aux autres houblons comparés (flb5).
  const mots = useMemo(() => sesMots(cles), [cles]);
  // D130 : « les type spéciaux des houblons hors 16d » d'abord : hors des 12 familles (◇), puis dans une famille que la
  // 16D n'attend pas, puis dans une famille qu'elle attend (floral, herbacé, terreux).
  const horsStyle = useMemo(() => {
    const rang = (m: MotLu) => (m.famille == null ? 0 : sc.families[m.famille]?.status === 'attendue' ? 2 : 1);
    return Object.fromEntries(cles.map((k) => [k, (mots[k] ?? []).filter((m) => m.seul).sort((a, b) => rang(a) - rang(b))]));
  }, [cles, mots, sc]);
  const etapes = useMemo(() => lireEtapes(recette, reference ? [...cles, reference] : cles), [recette, cles, reference]);
  // Le critère de classement (r6n2) : floral au départ (ta demande). Il change le ★, la réponse et le mis en avant.
  const [critere, setCritere] = useState<Critere>(CRITERES[0]);
  const [retenu, setRetenu] = useState<string | null>(null);
  const cleRetenue = retenu && cols.some((c) => c.cle === retenu) ? retenu : depart(cols, critere.famille, critere.sens) ?? cols[0]?.cle ?? '';
  const sel = cols.find((c) => c.cle === cleRetenue) ?? null;
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

  // L'écart chiffré de r6a sur les rangées de ta demande (Floral ↑, Résineux ↓), sauf la famille du critère : la bande
  // des étapes, juste au-dessus, la chiffre déjà à chaque moment (le même nombre, 80 mots au premier écran).
  // D128 (80 mots, la ligne « Face à ta stout, par » rendue) : au repos, l'écart chiffré vit dans la bande des étapes
  // (la famille du critère, à chaque moment) ; sur les rangées, celui de ta demande qui n'est ni le critère ni le trop.
  const chiffre = (f: FamilyId) => f === VISEE.famille && f !== critere.famille;
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
  // La réponse de y1b (r6n2), au moment choisi : en conclusion, au-dessus de « Placer » (80 mots au premier écran, D128).
  const rep = useMemo(() => reponse(vue, cleRetenue, critere.famille, critere.sens), [vue, cleRetenue, critere]);
  // Le pont nomme son outil (title du bouton de Pont, composant du socle) : « Doser Idaho 7 dans Dryhopper », comme r6a.
  const refPont = useRef<HTMLSpanElement>(null);
  const nomRetenu = sel?.houblon.nom ?? '';
  useEffect(() => { refPont.current?.querySelector('button')?.setAttribute('title', `Doser ${nomRetenu} dans Dryhopper`); }, [nomRetenu]);

  return (
    <CadreOutil ecran="comparer" question={question}
      contexte={
        <div className="pq-comparer-tete" role="group" data-etat="etat-comp-repos etat-acquis-comparer-v3 etat-acquis-premier-plan-80-mots etat-acquis-simule-marque etat-acquis-au-style-absolu"
          aria-label={`Fixé pour ${nombreMot(cols.length)} : Stout ${sc.code}, dose égale ${nombre(CONDITIONS.doseGL)} g/L chacun, ${nomLevure(recette.yeastId)}`}>
          <LigneContexte items={[
            { cle: 'base', contenu: <span data-element="y1b-ligne-contexte r6a-contexte" aria-label={`Stout ${sc.code}`}>{sc.code}</span> },
            { cle: 'dose', contenu: <span className="pq-comparer-dose" aria-label={`dose égale : ${nombre(CONDITIONS.doseGL)} g/L chacun`}>{nombre(CONDITIONS.doseGL)} g/L chacun</span> },
            { cle: 'levure', contenu: <span data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change">{nomLevure(recette.yeastId)}</span> },
          ]} sansMot />
          <span data-element="l8b-legende-cachee" data-etat="etat-comp-legende"><Legende><ContenuLegende /></Legende></span>
        </div>
      }
      dock={sel && (
        <nav className="pq-comparer-dock" aria-label="Le reste, à un toucher" data-etat="etat-acquis-r6n2-dock etat-acquis-r6a-elements-notes">
          <BoutonDock nom="defi" actif={feuille === 'defi'} etat="etat-comp-defi" ouvre="y1b-defi y1b-jauge-amertume w2-piste-commune s5-deux-objectifs" onClick={() => basculer('defi')} icone={<IconeCible taille={18} />}
            label={<>Défi <b className="pq-comparer-nb">{`${score!.points}/${score!.sur}`}</b></>} aria={`Défi : ${sel.houblon.nom} tient ${score!.points} critères sur ${score!.sur}`} />
          <BoutonDock nom="egaler" actif={feuille === 'egaler'} etat="etat-comp-egaler" ouvre="y3-pour-egaler" controle="pq-comparer-egaler" onClick={() => basculer('egaler')} icone={<IconeEgal taille={18} label="" />} label="Égaler" />
          <BoutonDock nom="valeurs" actif={feuille === 'valeurs'} etat="etat-comp-chimie etat-acquis-vraies-valeurs-v1" ouvre="r6a-chimie v1-vraies-valeurs v1-en-a-plus v1-linalol-en-biere d1-tout-ouvert p03-plages-sources" onClick={() => basculer('valeurs')} icone={<IconeFiole taille={18} />} label="Valeurs" aria="Valeurs : chimie et vraies valeurs" />
          <BoutonDock nom="preuve" actif={feuille === 'preuve'} etat="etat-comp-preuve" ouvre="r6a-osu y3-panel-osu y1b-tirage-preuve" onClick={() => basculer('preuve')} icone={<IconePanel taille={18} />} label="Preuve" aria="Preuve : panel OSU et 20 bières tirées" />
          <BoutonDock nom="frise" actif={feuille === 'frise'} etat="etat-comp-frise-levure" onClick={() => basculer('frise')} icone={<IconeFrise taille={18} />} label="Frise" />
          <BoutonDock nom="souche" actif={feuille === 'souche'} onClick={() => basculer('souche')} icone={<IconeSouche taille={18} />} label="Souche" />
        </nav>
      )}>
      <div className="pq-comparer" data-colonnes={cols.length}>
        <section className="pq-comparer-rad" data-acquis="radar" data-element="r6a-radar p03-radar-superpose p02-radar-intervalle h4-radar-demande" aria-label="Radar r2">
          <div className="pq-comparer-rad-h">
            <span className="pq-comparer-puce" data-nature="simule" data-element="r6a-simule" title="profil simulé par le moteur">~ simulé</span>
            <span className="pq-comparer-lentille" role="radiogroup" aria-label="Lecture" data-lecture="" data-element="r6a-lentille">
              <button type="button" role="radio" data-e="style" aria-checked={!absolu} onClick={() => setAbsolu(false)}>Au style</button>
              <button type="button" role="radio" data-e="absolu" data-etat="etat-comp-absolu" aria-checked={absolu} onClick={() => setAbsolu(true)}>Absolu</button>
            </span>
          </div>
          {sel && <Radar axes={sc.order} cols={vue} retenu={cleRetenue} absolu={absolu} visee={VISEE.famille} trop={TROP} />}
        </section>

        <section className="pq-comparer-tab" data-role="simulation" aria-label="Les houblons, côte à côte"
          data-element="l8-disposition y1b-plan-d-avant y1b-bandes-style l5b-barres-voie l5b-pistes-objectif">
          <div className="pq-comparer-grille-tab pq-comparer-tetes" role="radiogroup" aria-label="Houblon retenu" data-libre="houblon"
            data-element="r6a-tetes l5f-carte-role-alpha w2-cartes-verdict p06-grille-familles g1-fiche fiche-citra-cryo l8b-verdicts-pictos-trait">
            <TaStout quatre={quatre} plein={cols.length >= MAX_COLONNES || !disponibles.length} ouvert={feuille === 'ajouter'} onPlus={() => basculer('ajouter')} />
            {vue.map((c) => (
              <TeteColonne key={c.cle} c={c} retenu={c.cle === cleRetenue} quatre={quatre} epinglee={c.cle === pin} mots={horsStyle[c.cle] ?? []}
                retirable={ajoutes.includes(c.cle)}
                onRetenir={() => setRetenu(c.cle)} onFiche={(apresAppui) => ouvrirFiche(c.cle, apresAppui)}
                onRetirer={() => { setAjoutes((a) => a.filter((x) => x !== c.cle)); if (retenu === c.cle) setRetenu(null); }} />
            ))}
          </div>
          {/* D128 : les étapes de x3b en bande-sélecteur sur les rangées de r6a ; la pastille du critère (r6n2) choisit la
              famille qu'elle chiffre, ★ au meilleur de chaque étape (la réponse de y1b, à chaque moment). */}
          <BandeEtapes cols={cols} etapes={etapes} reference={reference} nomReference={reference ? hopRef(reference)?.name ?? reference : null} retenu={cleRetenue}
            moment={moment} onMoment={setMoment} critere={critere}
            pastille={<PastilleCritere critere={critere} onChoisir={(c) => { setCritere(c); setRetenu(null); }} onPourquoi={() => basculer('pourquoi')} />} />
          <div className="pq-comparer-rgs" data-element="r6a-rangees" data-moment={moment}>
            {lignes.map((f, i) => (
              <div key={f} className={cx('pq-comparer-grille-tab pq-comparer-rg', chiffre(f) && 'pq-comparer-demande', i === lignes.length - 1 && 'pq-comparer-derniere')} data-famille-ligne={f}
                {...(f === VISEE.famille || f === TROP ? { 'data-element': 'r6a-ecarts' } : {})}>
                <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}>
                  <Picto famille={f} />{!quatre && <span>{COURT[f]}</span>}
                  {f === VISEE.famille && <span className="pq-comparer-dem" aria-label="ta demande : plus de floral">↑</span>}
                  {f === TROP && <span className="pq-comparer-dem pq-comparer-dem-trop" aria-label="ta dégustation : trop de résineux">↓</span>}
                </span>
                {vue.map((c) => <Cellule key={c.cle} c={c} cel={c.cellules[f]} retenu={c.cle === cleRetenue} absolu={absolu} montre={chiffre(f)} moment={moment} />)}
              </div>
            ))}
            {tousInconnus.length > 0 && (
              <div className="pq-comparer-grille-tab pq-comparer-rg pq-comparer-inc-t" data-element="r6a-inconnus">
                <span className="pq-comparer-rn">{tousInconnus.map((f) => <Picto key={f} famille={f} />)}</span>
                <span className="pq-comparer-inc-l"><i className="pq-comparer-hach" aria-hidden="true" />inconnus, pas zéro</span>
              </div>
            )}
          </div>
          <SesMots cols={cols} mots={mots} retenu={cleRetenue} quatre={quatre} />
          <PiedEtapes cols={cols} retenu={cleRetenue} onDryhopper={placer} />
        </section>
        {/* D114 : le panel OSU (un acquis) reste replié, au rang d'une note, sous le tableau comme dans r6a ; un toucher ouvre
            Preuve, sa feuille dans le dock de r6n2. */}
        <section className="pq-comparer-osu-ligne" aria-label="Panel OSU">
          <button type="button" className="pq-comparer-lien pq-comparer-osu-tch" data-ouvre-element="y3-panel-osu r6a-osu" onClick={() => setFeuille('preuve')}>Panel OSU, Cascade : la courbe mesurée, dans Preuve ›</button>
        </section>
        {/* « Placer <houblon> › » en bas, comme le « Doser Idaho 7 dans Dryhopper » de r6a (80 mots au premier écran), sous
            la réponse de y1b qui conclut la comparaison. */}
        {rep && <LigneReponse rep={rep} critere={critere} moment={moment} onPourquoi={() => basculer('pourquoi')} />}
        {sel && (
          <span ref={refPont} className="pq-comparer-placer" data-etat="etat-comp-placer" data-element="y1b-dock-pouce y1b-second-houblon-puis">
            <Pont nom="placer" onClick={placer}>Placer {sel.houblon.nom}</Pont>
          </span>
        )}
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
function PastilleCritere({ critere, onChoisir, onPourquoi }: { critere: Critere; onChoisir: (c: Critere) => void; onPourquoi: () => void }) {
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
        aria-label={`Critère de classement, face à ta stout : ${critere.nom}`} onClick={() => setOuvert((o) => !o)}>
        <Picto famille={critere.famille} taille={14} /><span>{critere.nom.replace('moins ', '− ')}</span><Chevron ouvert={ouvert} />
      </button>
      {ouvert && (
        <span className="pq-comparer-menu pq-comparer-crit-m" role="listbox" aria-label="Critère de classement">
          {CRITERES.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected={c.id === critere.id} onClick={() => { setOuvert(false); onChoisir(c); }}>
              <Picto famille={c.famille} taille={16} />{c.nom}
            </button>
          ))}
          <button type="button" className="pq-comparer-menu-pq" onClick={() => { setOuvert(false); onPourquoi(); }}>Pourquoi ce classement ›</button>
        </span>
      )}
    </span>
  );
}

// ---------- la réponse face à ta stout (y1b, r6n2) et « contre ★ » (r6p2), en conclusion, au-dessus de « Placer » ----------
function LigneReponse({ rep, critere, moment, onPourquoi }: { rep: NonNullable<ReturnType<typeof reponse>>; critere: Critere; moment: CodeEtape; onPourquoi: () => void }) {
  const { etoile, autre, ecart, retenuEstEtoile } = rep;
  const nb = (x: number) => <span className="pq-comparer-nb" data-nature="simule">{signeCran(x)}</span>;
  const f = critere.famille;
  const quand = moment === 'dryPost' ? 'au dry hop' : `à ${ETAPES.find((e) => e.code === moment)!.nom}`;
  return (
    <p className="pq-comparer-rep" data-role="reponse" aria-live="polite">
      {retenuEstEtoile || !autre ? (
        <>
          <span className="pq-comparer-etoile" aria-label={`le ${critere.sens > 0 ? 'plus' : 'moins'} ${COURT[f].toLowerCase()} dans ta 16D`}>★</span><Point c={etoile} /><b>{etoile.houblon.nom}</b>
          {autre && ecart != null && <> devant <Point c={autre} /><b>{autre.houblon.nom}</b> <span aria-label={`${signeCran(ecart)} cran`}>{nb(ecart)}</span></>}
          <Picto famille={f} />
        </>
      ) : (
        <>
          <Point c={autre} /><b>{autre.houblon.nom}</b> {ecart != null ? <span aria-label={`${signeCran(ecart)} cran`}>{nb(ecart)}</span> : <span data-inconnu="">?</span>} <Picto famille={f} />
          {' '}contre <span className="pq-comparer-etoile" aria-hidden="true">★</span><b>{etoile.houblon.nom}</b>
          {autre.sorties.length > 0 && <span className="pq-comparer-hors-mini" data-nature="simule" aria-label={`~ sort de ta 16D : ${autre.sorties.map((x) => COURT[x].toLowerCase()).join(', ')}`}>~<IconeRisque />{autre.sorties.map((x) => <Picto key={x} famille={x} taille={12} />)}</span>}
        </>
      )}
      <span className="pq-comparer-rep-q">{quand}</span>
      <button type="button" className="pq-comparer-pourquoi-zone" aria-label="pourquoi ce classement ?" onClick={onPourquoi} />
    </p>
  );
}

// ---------- ses mots, au-delà de la 16D (D128 bis, à la manière de flb5) ----------
// Sous le premier écran (80 mots) : en tête, le bandeau de flb5 pour le houblon retenu (« Idaho 7 seul dit … ») ; puis,
// sous chaque colonne, ses mots : en gras ceux que lui seul dit face aux autres, en gris ceux qu'un autre dit aussi ;
// le picto de sa famille devant, ◇ pour un mot hors des 12 familles.
/** Une césure douce dans un mot long (9 lettres et plus), entre une voyelle et une consonne : « pample-mousse ». */
const coupure = (w: string) => { if (w.length < 9) return w; for (let i = 5; i <= w.length - 4; i++) if (/[aeiouyéèê]/i.test(w[i - 1]) && !/[aeiouyéèê]/i.test(w[i])) return w.slice(0, i) + String.fromCharCode(173) + w.slice(i); return w; };
const liste = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l.at(-1)}` : l[0] ?? '');
function SesMots({ cols, mots, retenu, quatre }: { cols: ColonneLue[]; mots: Record<string, MotLu[]>; retenu: string; quatre: boolean }) {
  const sel = cols.find((c) => c.cle === retenu) ?? cols[0];
  if (!sel) return null;
  const seuls = (mots[sel.cle] ?? []).filter((m) => m.seul);
  const max = quatre ? 5 : 6;
  return (
    <section className="pq-comparer-mots" aria-label="Ses mots : ce que chaque houblon dit en plus des familles de la 16D, d’après ses fiches" data-element="d128bis-ses-mots flb5-lui-seul">
      <p className="pq-comparer-mots-b" style={{ ['--pq-h' as string]: sel.couleur }} data-role="lui-seul">
        {seuls.length
          ? <><b>{sel.houblon.nom}</b> seul dit <b>{seuls.slice(0, 4).map((m) => m.mot).join(', ')}</b></>
          : <><b>{sel.houblon.nom}</b> : ses mots, les autres les disent aussi</>}
        <span className="pq-comparer-mots-s">face à {liste(cols.filter((c) => c.cle !== sel.cle).map((c) => c.houblon.nom))}, d’après ses fiches · en gras : ce que lui seul dit</span>
      </p>
      <div className="pq-comparer-grille-tab pq-comparer-mots-g">
        <span className="pq-comparer-mots-l">{!quatre && 'ses mots'}</span>
        {cols.map((c) => {
          const l = mots[c.cle] ?? [];
          return (
            <span key={c.cle} className={cx('pq-comparer-mots-c', c.cle === retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }} data-col={c.cle}>
              {l.length === 0 && <span className="pq-comparer-mots-rien">rien de plus que ses familles</span>}
              {l.slice(0, max).map((m) => (
                <span key={m.mot} className={cx('pq-comparer-mot', m.seul && 'pq-comparer-mot-seul')} data-mot={m.mot} data-seul={m.seul ? '' : undefined}
                  title={`${m.mot} : ${m.fiches.join(', ')}${m.aussi.length ? ` ; aussi chez ${m.aussi.join(', ')}` : ' ; lui seul ici'}${m.famille ? ` ; famille ${COURT[m.famille].toLowerCase()}` : ' ; hors des 12 familles'}`}>
                  {m.famille ? <Picto famille={m.famille} taille={12} /> : <span className="pq-comparer-mot-hors" aria-label="hors des 12 familles">◇</span>}<span className="pq-comparer-mot-t">{m.mot.split(' ').map(coupure).join(' ')}</span>
                </span>
              ))}
              {l.length > max && <span className="pq-comparer-mots-rien">+{l.length - max}</span>}
            </span>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Ta stout, et le « + » (p4, r6n2) ----------
function TaStout({ quatre, plein, ouvert, onPlus }: { quatre: boolean; plein: boolean; ouvert: boolean; onPlus: () => void }) {
  return (
    <div className="pq-comparer-ta" data-element="r6a-ta-stout m4-radar-degustation" aria-label="Ta stout : trop résineuse, tu la veux plus florale (dégustation du 18.10)">
      <span className="pq-comparer-ta-n"><i className="pq-comparer-trait" aria-hidden="true" />{!quatre && <b>Ta stout</b>}</span>
      <span className="pq-comparer-ta-l"><Picto famille={TROP} taille={14} /><span aria-hidden="true">↓</span></span>
      <span className="pq-comparer-ta-l"><Picto famille={VISEE.famille} taille={14} /><span aria-hidden="true">↑</span></span>
      {!plein && (
        <button type="button" className="pq-comparer-plus" data-role="ajouter-colonne" data-etat="etat-comp-colonne-plus" data-element="p4-plus-comparaison" aria-haspopup="dialog" aria-expanded={ouvert}
          aria-label="Ajouter un houblon à la comparaison" onClick={onPlus}>+</button>
      )}
      {/* D130 : la clé de la ligne noire des têtes, une fois, dans la colonne de Ta stout */}
      {!quatre && <span className="pq-comparer-ta-seul" aria-hidden="true">lui seul</span>}
    </div>
  );
}

// ---------- « lui seul : … » dans la tête (D130, à la manière du bandeau de flb5b) ----------
// « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! » (24.10) : au premier
// écran, dans chaque colonne, ce que ses fiches disent et qu'aucun des autres houblons comparés ne dit (sesMots, D128 bis :
// ses mots, sans nom de famille ni « fruité », jamais inventés) ; d'abord les mots hors des 12 familles (◇), puis les
// autres, ~26 signes au plus (le détail sous le premier écran, dans « ses mots »).
function LuiSeul({ cle, nom, mots, quatre }: { cle: string; nom: string; mots: MotLu[]; quatre: boolean }) {
  const seuls = mots.filter((m) => m.seul);
  const pris: MotLu[] = [];
  let n = 0;
  for (const m of seuls) { if (pris.length && n + m.mot.length > (quatre ? 9 : 13)) break; pris.push(m); n += m.mot.length + 2; }
  const reste = seuls.length - pris.length;
  return (
    <span className="pq-comparer-seul" data-role="hors-16d" data-houblon={cle}
      aria-label={seuls.length ? `${nom}, lui seul, d’après ses fiches : ${seuls.map((m) => m.mot).join(', ')}` : `${nom} : rien que les autres ne disent aussi`}>
      {seuls.length
        ? <>{pris.map((m, i) => (
            <span key={m.mot} className="pq-comparer-seul-m" aria-hidden="true">{m.famille ? null : <span className="pq-comparer-seul-hors">◇</span>}{m.mot}{i < pris.length - 1 ? ',' : ''}</span>
          ))}{reste > 0 && <span className="pq-comparer-seul-p" aria-hidden="true">+{reste}</span>}</>
        : <span className="pq-comparer-seul-rien" aria-hidden="true">—</span>}
    </span>
  );
}

// ---------- tête de colonne : nom, α, rôle en mot, familles, verdict (l5f, w2), stock en icône ----------
function TeteColonne({ c, retenu, quatre, epinglee, mots, retirable, onRetenir, onFiche, onRetirer }: {
  c: ColonneLue; retenu: boolean; quatre: boolean; epinglee: boolean; mots: MotLu[]; retirable: boolean; onRetenir: () => void; onFiche: (apresAppui: boolean) => void; onRetirer: () => void;
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
            ? <span className="pq-comparer-vd pq-comparer-vd-hors" data-nature="simule" aria-label={`~ sort de ta 16D : ${c.sorties.map((f) => COURT[f].toLowerCase()).join(', ')}`}>~<IconeRisque /><span className="pq-comparer-vd-mot">hors</span>{c.sorties.map((f) => <Picto key={f} famille={f} taille={12} />)}</span>
            : <span className="pq-comparer-vd pq-comparer-vd-dans" data-nature="simule" aria-label="~ reste dans ta 16D, hors le résineux déjà au-dessus">~<IconeOk /><span className="pq-comparer-vd-mot">dans</span></span>}
        </span>
        <LuiSeul cle={c.cle} nom={h.nom} mots={mots} quatre={quatre} />
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
function Cellule({ c, cel, retenu, absolu, montre, moment }: { c: ColonneLue; cel: CelluleLue; retenu: boolean; absolu: boolean; montre: boolean; moment: CodeEtape }) {
  const nom = `${COURT[cel.famille]}, posé ${moment === 'dryPost' ? `au dry hop (${CONDITIONS.jours} j)` : `à ${ETAPES.find((e) => e.code === moment)!.nom}`}`;
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
      <p><b>~+1,9</b> : crans du style gagnés. ↑ ↓ : ta demande du 18.10 (Ta stout : plus floral, moins résineux).</p>
      <p><b>Les étapes</b> (60′, 10′, dry hop), sur les rangées : chaque houblon posé à ce moment, à 4 g/L ; le nombre : crans gagnés de la famille de la pastille ; ★ : le meilleur de l’étape ; à gauche et en pointillé gris : ton Nugget au même moment. Toucher une étape la pose sur le radar et les rangées ; au départ, le dry hop, après 3 j.</p>
      <p><b>Le radar</b> : le houblon retenu plein, avec son intervalle en trait fin (// : il continue au-delà) ; les autres en contour.</p>
      <p><b>★</b> : le meilleur par le critère qui reste dans ta 16D. Toucher une colonne la retient ; appui long sur un nom : sa fiche ; « + » : un 4ᵉ houblon de ton stock.</p>
      <p><b>Sous le pouce</b> : Défi (tes deux objectifs), Égaler, Valeurs (chimie), Preuve (panel, 20 bières), Frise (le moment), Souche (la levure).</p>
    </div>
  );
}
