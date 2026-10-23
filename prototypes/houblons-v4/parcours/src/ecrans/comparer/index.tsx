// Comparer — « Cascade, Idaho 7 ou Galaxy pour ma stout ? ». r6a, le choix du brasseur (« r6a reste le meilleur »,
// 23.10), portée en React et calculée en direct par le moteur, avec les petites améliorations des autres versions
// (NOTE.md, « Idées reprises »). Un seul facteur libre : le houblon (retenir une colonne, en ajouter une 4ᵉ).
// Dose, moment et levure sont fixés sur la ligne de contexte. Pont : « Placer <retenu> » → Dryhopper.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CadreOutil, COULEURS, COURT, Legende, LigneContexte, Picto, Pont, nombre, plage, useAppuiLong } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import { CONDITIONS, VISEE, nomLevure } from '../../donnees/cas';
import { useRecette } from '../../etat/EtatParcours';
import { nouvelId } from '../../etat/operations';
import { style } from '../../moteur';
import { STOCK, hopRef, type FamilyId } from '../../../../src/engine';
import Fiche from '../fiche';
import { ABSOLU, ORANGE, couleurHoublon, depart, egaler, lireColonnes, reponse, type CelluleLue, type ColonneLue } from './calcul';
import { Radar } from './Radar';
import { CHIMIE, acides, compose, huile, linalolEnBiere, panelOSU, titreRef, type ValeurReelle } from './valeurs';
import './comparer.css';

/** Ta dégustation du 18.10 : « trop résineuse, je la veux plus florale ». */
const TROP: FamilyId = 'resin';
const MAX_COLONNES = 4;
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const signeCran = (x: number) => `~${x >= 0 ? '+' : '−'}${nombre(Math.abs(x), 1)}`;
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;

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
  const [retenu, setRetenu] = useState<string | null>(null);
  const cleRetenue = retenu && cols.some((c) => c.cle === retenu) ? retenu : depart(cols, VISEE.famille) ?? cols[0]?.cle ?? '';
  const sel = cols.find((c) => c.cle === cleRetenue) ?? null;
  const rep = useMemo(() => reponse(cols, cleRetenue, VISEE.famille), [cols, cleRetenue]);
  const [absolu, setAbsolu] = useState(false);
  const [ouvert, setOuvert] = useState<null | 'vraies' | 'egaler'>(null);
  const [fiche, setFiche] = useState<string | null>(null);

  // La fiche (composant de la voie p1) pousse une entrée d'historique : le retour du téléphone et sa fermeture
  // (retour) la referment, Comparer reste dessous, intact.
  useEffect(() => {
    const fermer = () => setFiche(null);
    window.addEventListener('popstate', fermer);
    return () => window.removeEventListener('popstate', fermer);
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
    aller({ ecran: 'comparer', houblons: cles.filter((c) => c !== pin), ...(pin ? { pin } : {}) });
    setFiche(cle);
  };

  const lignes = sc.order.filter((f) => !cols.every((c) => c.cellules[f].inconnu));
  const tousInconnus = sc.order.filter((f) => cols.length > 0 && cols.every((c) => c.cellules[f].inconnu));
  const noms = cols.map((c) => c.houblon.nom);
  const question = `${noms.slice(0, -1).join(', ')}${noms.length > 1 ? ' ou ' : ''}${noms.at(-1) ?? ''} pour ma stout ?`;
  const quatre = cols.length >= 4;

  return (
    <CadreOutil ecran="comparer" question={question}
      contexte={
        <div className="pq-comparer-tete">
          <LigneContexte items={[
            { cle: 'base', contenu: <span data-element="y1b-ligne-contexte">Stout {sc.code}</span> },
            { cle: 'dose', contenu: <>{nombre(CONDITIONS.doseGL)} g/L chacun</> },
            { cle: 'moment', contenu: <>après, {CONDITIONS.jours} j</> },
            { cle: 'levure', contenu: <span data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change">{nomLevure(recette.yeastId)}</span> },
          ]} />
          <span data-element="l8b-legende-cachee"><Legende><ContenuLegende /></Legende></span>
        </div>
      }
      dock={sel && (
        <nav className="pq-comparer-dock" aria-label="Suite" data-element="y1b-dock-pouce y1b-second-houblon-puis x3b-cuve-jour-apres-jour">
          <Pont nom="placer" onClick={() => ouvrir({ ecran: 'dryhopper', ajout: nouvelId(recette, sel.cle) })}>
            Placer {sel.houblon.nom}<span className="pq-comparer-lu"> dans Dryhopper</span>
          </Pont>
        </nav>
      )}>
      <div className="pq-comparer" data-colonnes={cols.length}>
        {rep && <LigneReponse rep={rep} />}

        <section className="pq-comparer-rad" data-acquis="radar" data-element="p03-radar-superpose p02-radar-intervalle h4-radar-demande" aria-label="Radar r2">
          <div className="pq-comparer-rad-h">
            <span className="pq-comparer-puce" data-nature="simule" title="profil simulé par le moteur">~ simulé</span>
            <span className="pq-comparer-lentille" role="radiogroup" aria-label="Lecture" data-lecture="">
              <button type="button" role="radio" data-e="style" aria-checked={!absolu} onClick={() => setAbsolu(false)}>Au style</button>
              <button type="button" role="radio" data-e="absolu" aria-checked={absolu} onClick={() => setAbsolu(true)}>Absolu</button>
            </span>
          </div>
          {sel && <Radar axes={sc.order} cols={cols} retenu={cleRetenue} absolu={absolu} visee={VISEE.famille} trop={TROP} />}
        </section>

        <section className="pq-comparer-tab" data-role="simulation" aria-label="Les houblons, côte à côte"
          data-element="l8-disposition y1b-plan-d-avant y1b-bandes-style l5b-barres-voie l5b-pistes-objectif">
          <div className="pq-comparer-grille-tab pq-comparer-tetes" role="radiogroup" aria-label="Houblon retenu" data-libre="houblon"
            data-element="l5f-carte-role-alpha w2-cartes-verdict p06-grille-familles g1-fiche fiche-citra-cryo l8b-verdicts-pictos-trait">
            <TaStout quatre={quatre} disponibles={STOCK.filter((s) => s.grams > 0 && !cles.includes(s.key)).map((s) => s.key)}
              plein={cols.length >= MAX_COLONNES} onAjouter={(cle) => { setAjoutes((a) => [...a, cle]); setRetenu(cle); }} />
            {cols.map((c) => (
              <TeteColonne key={c.cle} c={c} retenu={c.cle === cleRetenue} quatre={quatre} epinglee={c.cle === pin}
                retirable={ajoutes.includes(c.cle)}
                onRetenir={() => setRetenu(c.cle)} onFiche={(apresAppui) => ouvrirFiche(c.cle, apresAppui)}
                onRetirer={() => { setAjoutes((a) => a.filter((x) => x !== c.cle)); if (retenu === c.cle) setRetenu(null); }} />
            ))}
          </div>
          <div className="pq-comparer-rgs">
            {lignes.map((f, i) => (
              <div key={f} className={cx('pq-comparer-grille-tab pq-comparer-rg', (f === VISEE.famille || f === TROP) && 'pq-comparer-demande', i === lignes.length - 1 && 'pq-comparer-derniere')} data-famille-ligne={f}>
                <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}>
                  <Picto famille={f} />{!quatre && <span>{COURT[f]}</span>}
                  {f === VISEE.famille && <span className="pq-comparer-dem" aria-label="ta demande : plus de floral">↑</span>}
                  {f === TROP && <span className="pq-comparer-dem pq-comparer-dem-trop" aria-label="ta dégustation : trop de résineux">↓</span>}
                </span>
                {cols.map((c) => <Cellule key={c.cle} c={c} cel={c.cellules[f]} retenu={c.cle === cleRetenue} absolu={absolu} montre={f === VISEE.famille || f === TROP} />)}
              </div>
            ))}
            {tousInconnus.length > 0 && (
              <div className="pq-comparer-grille-tab pq-comparer-rg pq-comparer-inc-t">
                <span className="pq-comparer-rn">{tousInconnus.map((f) => <Picto key={f} famille={f} />)}</span>
                <span className="pq-comparer-inc-l"><i className="pq-comparer-hach" aria-hidden="true" />inconnus</span>
              </div>
            )}
          </div>
        </section>

        <div className="pq-comparer-touchers">
          <button type="button" className="pq-comparer-tch" aria-expanded={ouvert === 'vraies'} aria-controls="pq-comparer-vraies"
            data-ouvre-acquis="valeurs chimie" onClick={() => setOuvert((o) => (o === 'vraies' ? null : 'vraies'))}>
            <IconeFiole /><span>Chimie et vraies valeurs</span><Chevron ouvert={ouvert === 'vraies'} />
          </button>
          <button type="button" className="pq-comparer-tch" aria-expanded={ouvert === 'egaler'} aria-controls="pq-comparer-egaler"
            onClick={() => setOuvert((o) => (o === 'egaler' ? null : 'egaler'))}>
            <span aria-hidden="true" className="pq-comparer-egal">=</span><span>Égaler</span><Chevron ouvert={ouvert === 'egaler'} />
          </button>
        </div>
        <section id="pq-comparer-vraies" className="pq-comparer-vraies" data-acquis="valeurs" hidden={ouvert !== 'vraies'} aria-label="Vraies valeurs et chimie"
          data-element="v1-vraies-valeurs v1-en-a-plus v1-linalol-en-biere d1-tout-ouvert p03-plages-sources">
          {ouvert === 'vraies' && <VraiesValeurs cols={cols} quatre={quatre} />}
        </section>
        <section id="pq-comparer-egaler" className="pq-comparer-egaler" data-role="simulation" hidden={ouvert !== 'egaler'} aria-label="Égaler" data-element="y3-pour-egaler">
          {ouvert === 'egaler' && sel && <Egaler cols={cols} sel={sel} />}
        </section>

        <PanelOSU noms={noms} />
      </div>
      {fiche && <Fiche houblon={fiche} />}
    </CadreOutil>
  );
}

// ---------- la réponse face à ta stout (y1b, r6n2) et « contre ★ » (r6p2) ----------
function Point({ c }: { c: ColonneLue }) {
  return <i className="pq-comparer-pt" style={{ background: c.couleur }} aria-hidden="true" />;
}
function LigneReponse({ rep }: { rep: NonNullable<ReturnType<typeof reponse>> }) {
  const { etoile, autre, ecart, retenuEstEtoile } = rep;
  const nb = (x: number) => <span className="pq-comparer-nb" data-nature="simule">{signeCran(x)}</span>;
  return (
    <p className="pq-comparer-rep" data-role="reponse" data-element="y1b-face-a-ta-stout" aria-live="polite">
      {retenuEstEtoile || !autre ? (
        <>
          <span className="pq-comparer-etoile" aria-label="le plus floral dans ta 16D">★</span><Point c={etoile} /><b>{etoile.houblon.nom}</b>
          {autre && ecart != null && <> devant <Point c={autre} /><b>{autre.houblon.nom}</b> {nb(ecart)} cran</>}
          <Picto famille={VISEE.famille} />
        </>
      ) : (
        <>
          <Point c={autre} /><b>{autre.houblon.nom}</b> {ecart != null ? nb(ecart) : <span data-inconnu="">?</span>} cran <Picto famille={VISEE.famille} />
          {' '}contre <span className="pq-comparer-etoile" aria-hidden="true">★</span><b>{etoile.houblon.nom}</b>
          {autre.sorties.length > 0 && <span className="pq-comparer-hors-mini" data-nature="simule" aria-label={`~ sort de ta 16D : ${autre.sorties.map((f) => COURT[f].toLowerCase()).join(', ')}`}>~<IconeRisque />{autre.sorties.map((f) => <Picto key={f} famille={f} taille={12} />)}</span>}
        </>
      )}
    </p>
  );
}

// ---------- Ta stout, et le « + » (p4) ----------
function TaStout({ quatre, disponibles, plein, onAjouter }: { quatre: boolean; disponibles: string[]; plein: boolean; onAjouter: (cle: string) => void }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    const hors = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('keydown', k);
    document.addEventListener('pointerdown', hors);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('pointerdown', hors); };
  }, [menu]);
  return (
    <div ref={ref} className="pq-comparer-ta" data-element="m4-radar-degustation" aria-label="Ta stout : trop résineuse, tu la veux plus florale (dégustation du 18.10)">
      <span className="pq-comparer-ta-n"><i className="pq-comparer-trait" aria-hidden="true" />{!quatre && <b>Ta stout</b>}</span>
      <span className="pq-comparer-ta-l"><Picto famille={TROP} taille={14} />{!quatre ? <span>trop</span> : <span aria-hidden="true">↓</span>}</span>
      <span className="pq-comparer-ta-l"><Picto famille={VISEE.famille} taille={14} />{!quatre ? <span>plus</span> : <span aria-hidden="true">↑</span>}</span>
      {!plein && (
        <button type="button" className="pq-comparer-plus" data-role="ajouter-colonne" data-element="p4-plus-comparaison" aria-haspopup="menu" aria-expanded={menu}
          aria-label="Ajouter un houblon à comparer" onClick={() => setMenu((m) => !m)}>+</button>
      )}
      {menu && (
        <div className="pq-comparer-menu" role="menu" aria-label="Houblons de ton stock">
          {disponibles.map((cle) => {
            const h = hopRef(cle)!;
            return (
              <button key={cle} type="button" role="menuitem" data-ajouter={cle} onClick={() => { setMenu(false); onAjouter(cle); }}>
                <i className="pq-comparer-pt" style={{ background: couleurHoublon(cle) }} aria-hidden="true" />{h.name}
              </button>
            );
          })}
        </div>
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
  return (
    <div className={cx('pq-comparer-tc-cel', retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }}>
      <button type="button" role="radio" aria-checked={retenu} data-role="reglage" data-col={c.cle}
        aria-label={`Retenir ${h.nom} ; appui long : sa fiche`} className="pq-comparer-tc"
        {...appui}
        onPointerDown={(e) => { finSurvol(); appui.onPointerDown(e); }}
        onPointerEnter={surEntree} onPointerLeave={(e) => { finSurvol(); appui.onPointerLeave(); void e; }}>
        <span className="pq-comparer-tc-n">
          {epinglee && <span className="pq-comparer-pin" aria-label="épinglé : le houblon à remplacer">⌖</span>}
          <span className="pq-comparer-hn" data-houblon={h.nom} data-couleur={c.couleur}>{h.nom}</span>
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

// ---------- vraies valeurs et chimie (v1, d1 rangé, p03), à un toucher ----------
function LigneValeurs({ cle, nom, unite, famille, icone, cols, cellules, note, quatre }: {
  cle?: string; nom: string; unite: string; famille?: FamilyId; icone?: ReactNode; cols: ColonneLue[]; cellules: (ValeurReelle | null)[]; note?: string; quatre: boolean;
}) {
  const mil = cellules.map((c) => (c ? (c.lo + (c.hi ?? c.lo * 1.6)) / 2 : null));
  const connus = mil.filter((x): x is number => x != null);
  const top = !note && connus.length >= 2 ? mil.indexOf(Math.max(...connus)) : -1;
  const mx = Math.max(...cellules.filter(Boolean).map((c) => Math.max(c!.hi ?? c!.lo * 1.6, c!.lot ?? 0)), 0) * 1.08 || 1;
  return (
    <div className="pq-comparer-grille-tab pq-comparer-vg" {...(cle ? { 'data-compose': cle } : {})}>
      <span className="pq-comparer-vn">{famille ? <Picto famille={famille} /> : icone}{!quatre && <span><b>{nom}</b><span className="pq-comparer-vu">{unite}</span></span>}</span>
      {cols.map((col, i) => {
        const v = cellules[i];
        if (!v) return <span key={col.cle} className="pq-comparer-vc pq-comparer-vc-inc"><i className="pq-comparer-hach" /><span className="pq-comparer-vi">inconnu</span></span>;
        const l = (v.lo / mx) * 100, r = ((v.hi ?? mx) / mx) * 100;
        const refs = v.refs.map((x) => `${x} ${titreRef(x)}`).join(' ; ');
        return (
          <span key={col.cle} className={cx('pq-comparer-vc', i === top && 'pq-comparer-vc-max', v.aConfirmer && 'pq-comparer-vc-verif')} style={{ ['--pq-h' as string]: col.couleur }}>
            <span className="pq-comparer-vv" data-nature="mesure" data-source={refs}>{v.texte}{!quatre && !unite.includes(" g") && <span className="pq-comparer-vu-in"> {unite.split(" ")[0]}</span>}</span>
            <span className="pq-comparer-vb"><i style={{ left: `${l.toFixed(1)}%`, width: `${Math.max(3, r - l).toFixed(1)}%` }} />{v.lot != null && <i className="pq-comparer-vlot" style={{ left: `${((v.lot / mx) * 100).toFixed(1)}%` }} aria-label={`ton lot ${nombre(v.lot, 1)} %`} />}</span>
            <span className="pq-comparer-vr">{v.refs.join(' ')}{v.aConfirmer ? ' · à confirmer' : ''}{v.note ? ` · ${v.note}` : ''}</span>
          </span>
        );
      })}
      {note && <p className="pq-comparer-vnote">{note}</p>}
    </div>
  );
}
function VraiesValeurs({ cols, quatre }: { cols: ColonneLue[]; quatre: boolean }) {
  const refs = new Set<string>();
  const garder = (v: ValeurReelle | null) => { v?.refs.forEach((r) => refs.add(r)); return v; };
  const alpha = cols.map((c) => garder(acides(c.cle, 'alpha')));
  const beta = cols.map((c) => garder(acides(c.cle, 'beta')));
  const hu = cols.map((c) => garder(huile(c.cle)));
  const chimie = CHIMIE.map((x) => ({ ...x, cellules: cols.map((c) => garder(compose(c.cle, x.cle))) }));
  const lin = cols.map((c) => garder(linalolEnBiere(c.cle, c.houblon.nom)));
  return (
    <>
      <div className="pq-comparer-grille-tab pq-comparer-vh"><span />{cols.map((c) => <span key={c.cle} style={{ color: c.couleur }}>{c.houblon.nom}</span>)}</div>
      <LigneValeurs nom="α" unite="% masse" icone={<b className="pq-comparer-sym" aria-hidden="true">α</b>} cols={cols} cellules={alpha} quatre={quatre} />
      <LigneValeurs nom="β" unite="% masse" icone={<b className="pq-comparer-sym" aria-hidden="true">β</b>} cols={cols} cellules={beta} quatre={quatre} />
      <div className="pq-comparer-chim" data-acquis="chimie" aria-label="Composés de l’huile, rangés par famille">
        <LigneValeurs cle="huile" nom="huile" unite="mL/100 g" icone={<IconeGoutte />} cols={cols} cellules={hu} quatre={quatre} />
        {chimie.map((x) => <LigneValeurs key={x.cle} cle={x.cle} nom={x.nom} unite={x.unite} famille={x.famille} cols={cols} cellules={x.cellules} quatre={quatre} />)}
      </div>
      {lin.some(Boolean) && <LigneValeurs cle="linalol-biere" nom="linalol en bière" unite="µg/L" famille="floral" cols={cols} cellules={lin} quatre={quatre}
        note="Pas comparables entre eux : doses, moments et bières diffèrent." />}
      <div className="pq-comparer-grille-tab pq-comparer-vg" aria-label="IBU à cru : non modélisé">
        <span className="pq-comparer-vn"><IconeGoutte />{!quatre && <span><b>IBU</b><span className="pq-comparer-vu">à cru</span></span>}</span>
        {cols.map((c) => <span key={c.cle} className="pq-comparer-vc pq-comparer-vc-inc"><i className="pq-comparer-hach" /><span className="pq-comparer-vi">non modélisé</span></span>)}
      </div>
      <p className="pq-comparer-vsrc">mesuré : fiches et études ; plage = du plus bas au plus haut des sources ; la plus haute de chaque rangée à la couleur de son houblon.</p>
      <p className="pq-comparer-vrefs">{[...refs].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })).map((r) => <span key={r}><b>{r}</b> {titreRef(r)}</span>)}</p>
    </>
  );
}

// ---------- Égaler (y3) : la dose qui égale le retenu sur ta demande, calculée par le moteur ----------
function Egaler({ cols, sel }: { cols: ColonneLue[]; sel: ColonneLue }) {
  const recette = useRecette();
  const autres = cols.filter((c) => c.cle !== sel.cle);
  const res = useMemo(() => egaler(recette, sel, autres, VISEE.famille), [recette, sel, autres]);
  const but = sel.cellules[VISEE.famille].dCran;
  return (
    <div className="pq-comparer-eg">
      <p className="pq-comparer-eg-t">
        <Picto famille={VISEE.famille} />Pour égaler <Point c={sel} /><b>{sel.houblon.nom}</b> à {nombre(CONDITIONS.doseGL)} g/L
        {but != null && <span>(<span data-nature="simule">{signeCran(but)}</span> cran),</span>} il faudrait :
      </p>
      {autres.map((c) => {
        const r = res.find((x) => x.cle === c.cle);
        return (
          <p key={c.cle} className="pq-comparer-eg-l">
            <Point c={c} /><b>{c.houblon.nom}</b>
            {r?.doseGL != null
              ? <span data-nature="simule" className="pq-comparer-nb">~{nombre(r.doseGL, 1)} g/L</span>
              : <span className="pq-comparer-eg-jamais" data-nature="simule">~jamais, même à 16 g/L</span>}
          </p>
        );
      })}
      <p className="pq-comparer-vsrc">~ simulé par le moteur, dose cherchée de 0,5 à 16 g/L, moment et levure fixés.</p>
    </div>
  );
}

// ---------- panel OSU (y3), mesuré, Cascade seul, sans molette ----------
function PanelOSU({ noms }: { noms: string[] }) {
  const O = useMemo(panelOSU, []);
  if (!O) return null;
  const W = 358, H = 128, x0 = 30, x1 = W - 96, y0 = 10, y1 = H - 22;
  const xs = O.doses.map((_, i) => x0 + ((x1 - x0) * i) / (O.doses.length - 1));
  const y = (v: number) => y1 - ((y1 - y0) * v) / 15;
  const rd = (v: number) => Math.round(v * 10) / 10;
  const iDose = O.doses.findIndex((d) => Math.abs(d - 3.86) < 0.01);
  const iz0 = O.doses.findIndex((d) => d >= 3.86), iz1 = O.doses.findIndex((d) => d >= 8);
  const serie = (vals: number[], couleur: string, nom: string, famille?: FamilyId) => (
    <g key={nom}>
      <polyline points={vals.map((v, i) => `${rd(xs[i])},${rd(y(v))}`).join(' ')} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinejoin="round" />
      {vals.map((v, i) => <circle key={i} cx={rd(xs[i])} cy={rd(y(v))} r="3" className="pq-comparer-osu-pt" stroke={couleur} strokeWidth="2" />)}
      {famille && <svg x={x1 + 4} y={rd(y(vals.at(-1)!) - 7)} width="14" height="14" overflow="visible"><Picto famille={famille} taille={14} /></svg>}
      <text x={x1 + (famille ? 21 : 8)} y={rd(y(vals.at(-1)!) + 4)} className="pq-comparer-osu-l" fill={couleur}>{nom} {nombre(vals.at(-1)!, 1)}</text>
    </g>
  );
  const sans = noms.filter((n) => n !== 'Cascade');
  return (
    <section className="pq-comparer-osu" data-acquis="osu" data-element="y3-panel-osu" data-nature="mesure" data-source="H22 Lafontaine 2018 (E04)" aria-label="Panel OSU">
      <p className="pq-comparer-osu-t"><IconePanel /><b>Panel OSU, Cascade</b><span className="pq-comparer-puce">panel</span><span className="pq-comparer-osu-u">sur 15, g/L</span></p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Panel OSU, Cascade : intensité, herbacé et agrumes selon la dose, sur 15">
        {iz0 >= 0 && iz1 >= 0 && <rect x={xs[iz0]} y={y0} width={xs[iz1] - xs[iz0]} height={y1 - y0} className="pq-comparer-osu-z" />}
        {[0, 5, 10, 15].map((v) => <g key={v}><line x1={x0} x2={x1} y1={rd(y(v))} y2={rd(y(v))} className="pq-comparer-grille" /><text x={x0 - 6} y={rd(y(v) + 4)} textAnchor="end" className="pq-comparer-osu-ax">{v}</text></g>)}
        {O.doses.map((d, i) => <text key={d} x={rd(xs[i])} y={H - 6} textAnchor="middle" className="pq-comparer-osu-ax">{nombre(d, 2)}</text>)}
        {iDose >= 0 && <line x1={rd(xs[iDose])} x2={rd(xs[iDose])} y1={y0 - 4} y2={y1} className="pq-comparer-encre-trait" strokeWidth="2" />}
        {serie(O.intensite, 'rgb(var(--cave-50))', 'intensité')}
        {serie(O.herbace, COULEURS.herbal.texte, 'herbacé', 'herbal')}
        {serie(O.agrumes, COULEURS.citrus.texte, 'agrumes', 'citrus')}
      </svg>
      <p className="pq-comparer-osu-n"><span><i className="pq-comparer-ld" />3,86 g/L ≈ ta dose égale</span><span><i className="pq-comparer-lz" />4–8 g/L : retenu par les auteurs</span></p>
      <p className="pq-comparer-osu-n">Agrumes : plafond dès 8 g/L ; l’herbacé monte encore.{sans.length > 0 && <b> {sans.join(', ')} : pas de panel publié.</b>}</p>
      <p className="pq-comparer-osu-s">H22 Lafontaine 2018 · H77 Brülosophy 2019 : 10 contre 15 g/L non distingués.</p>
    </section>
  );
}

// ---------- légende, derrière « ? » (D89) ----------
function ContenuLegende() {
  return (
    <div className="pq-comparer-leg">
      <p><b>Une barre, par houblon</b> : zone pâle, ce que ta 16D permet ; barre, ~ simulé à 4 g/L ; trait fin, sa bande d’incertitude ; trait noir, ta stout aujourd’hui ; orangé, au-dessus de ta 16D ; hachuré, inconnu, jamais zéro.</p>
      <p><b>~+1,3</b> : crans du style gagnés. ↑ ↓ : ta demande du 18.10.</p>
      <p><b>Le radar</b> : le houblon retenu plein, avec son intervalle en trait fin (// : il continue au-delà) ; les autres en contour. Flèche orangée au bout d’un axe : au-delà de l’échelle. Flèche verte : ta demande.</p>
      <p><b>★</b> : le plus floral qui reste dans ta 16D. Toucher une colonne la retient ; appui long sur un nom : sa fiche ; « + » : un 4ᵉ houblon de ton stock.</p>
      <p><b>α</b> : du lot en stock (≠ hors de ses fiches) ou des fiches (livre). Rôle pâle : déduit de l’α. ~✓ dans ta 16D ; ~⚠ en sort.</p>
      <p>Moteur profil-simulé : centre conventionnel, bande = incertitude.</p>
    </div>
  );
}

// ---------- icônes : grille de 24 px comme lucide ; trait rendu de 1,33 px à toute taille, celui des icônes de
// l'app à 16 px (D83, S4 : une seule épaisseur de trait rendue) ----------
const TRAIT_ICONE = 4 / 3;
const Ic = ({ children, taille = 14, label }: { children: ReactNode; taille?: number; label?: string }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(TRAIT_ICONE * 24) / taille}strokeLinecap="round" strokeLinejoin="round"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} className="pq-comparer-ic">{children}</svg>
);
const IconeStock = () => <Ic label="en stock"><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></Ic>;
const IconeLivre = () => <Ic taille={12}><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" /></Ic>;
const IconeOk = () => <Ic taille={13}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Ic>;
const IconeRisque = () => <Ic taille={13}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></Ic>;
const IconeFiole = () => <Ic taille={16}><path d="M9 3h6M10 3v6L4 20h16L14 9V3" /></Ic>;
const IconeGoutte = () => <Ic taille={16}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></Ic>;
const IconePanel = () => <Ic taille={16}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .5 3 2 3 5" /></Ic>;
const Chevron = ({ ouvert }: { ouvert: boolean }) => <Ic taille={14}><path d={ouvert ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></Ic>;
