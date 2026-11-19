import React, { useRef, useState } from 'react';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { Units } from '../../services/units';
import {
  HORIZONS, POSITION_SEUIL, etiquetteSemaine, fenetreDeReglage, libelleFenetre, lignesDeReglage, phraseReglage, reglageDeFenetre,
  type Fenetre, type Horizon, type LigneHorizon, type Reglage, type VueHorizon
} from '../../domain/stock/horizon';
import { debutGeste, deplacerGeste, finGeste, pousserPoignee, type Geste, type ModeGeste } from './fenetreGeste';
import type { StockItem } from '../../types';
import './chiffreACommander.css';

/**
 * Le chiffre clé du Stocks, de la maquette choisie « pastille C » (16.11) : le gros chiffre « à commander », le réglage
 * « S49 · 6 sem. · Tout » qui règle ENSEMBLE ce chiffre et la pastille de l'onglet Stocks, l'histogramme semaine par semaine,
 * la liste par semaine et « Commander ces N ». Les nombres viennent de `domain/stock/horizon.ts`, jamais d'ici.
 * Se corrige (page des choix) : la liste garde une marge basse, le + ne couvre plus une quantité.
 *
 * La fenêtre se règle au doigt (demande du 16.11 : « jusqu'à S50 par exemple, ou juste 50 51 ») : poignées aimantées aux colonnes,
 * fenêtre qu'on glisse, colonne qu'on touche (la colonne seuil aussi). « S49 · 6 sem. · Tout » restent des raccourcis.
 * Pointer events, `touch-action: pan-y` : un geste vertical défile la page, un geste horizontal règle la fenêtre.
 */

const LIGNES_VISIBLES = 6;

/**
 * Le même bloc, replié en tête de Courses (19.11, ses mots : « la vue de commande de matériel soit replié, et pas très visible, elle
 * apporte peu », puis « Ou mettre cette vue dans les courses... »). Replié : une ligne discrète « n à commander › » (texte secondaire,
 * 44 px). Un toucher déplie le bloc entier de la maquette Pastille C, intact (chiffre, horizon, histogramme, liste, « Commander ces n ») ;
 * ici « Commander ces n » replie le bloc pour laisser la liste de courses sous le doigt.
 */
export function CommandeRepliee({ vue, horizon, onHorizon, onOuvrir, manquent }: {
  vue: VueHorizon;
  horizon: Reglage;
  onHorizon: (r: Reglage) => void;
  onOuvrir: (item: StockItem) => void;
  /** Le compte « manque » d'Étagère (pastille), pour que Courses dise le même. Absent : tous les articles comptent comme manquants. */
  manquent?: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const rien = vue.comptes.tout === 0;
  return (
    <div className="cac-repli" data-testid="commande-repliee">
      <button type="button" className="cac-repli-l" aria-expanded={ouvert} aria-controls="cac-repli-bloc" onClick={() => setOuvert((o) => !o)}>
        {/* La seule phrase de compte de Courses (vision du 19.11, n° 2 et 3 ; tour 3, T2-6) : le compte de l'horizon, puis les mots d'Étagère
            (« 22 manquent · 2 au seuil »). Rien à commander : dit ici une fois, replié ; déplié, l'encadré du bloc le dit et la ligne s'efface. */}
        <span>{rien && ouvert ? 'À commander' : phraseRepliee(vue, horizon, manquent)}</span>
        <ChevronRight size={16} aria-hidden="true" className="cac-repli-c" />
      </button>
      {ouvert && (
        <div id="cac-repli-bloc">
          <ChiffreACommander vue={vue} horizon={horizon} onHorizon={onHorizon} onOuvrir={onOuvrir} onCommander={() => setOuvert(false)} />
        </div>
      )}
    </div>
  );
}

/**
 * L'horizon en trois mots, pour la ligne repliée : « avant S48 », « d'ici S52 », « jusqu'à S50 », « en S50–S51 », « au seuil ».
 * Le nom du brassin reste dans le bloc déplié (« avant S48 · Saison de ferme »).
 */
export function horizonCourt(vue: VueHorizon, r: Reglage): string {
  if (r === 'tout') return 'en tout';
  if (r === 'brassin') return vue.brassin ? `avant ${etiquetteSemaine(vue.limiteBrassin)}` : 'cette semaine';
  if (r === 'six') return `d’ici ${etiquetteSemaine(vue.limiteSix)}`;
  const f = fenetreDeReglage(vue, r);
  if (f.a === f.b) return vue.colonnes[f.a]?.semaine == null ? 'au seuil' : `en ${vue.colonnes[f.a].etiquette}`;
  const l = libelleFenetre(vue, f);
  return f.a === 0 || f.b === POSITION_SEUIL ? l : `en ${l}`;
}

/**
 * La ligne repliée de Courses (vision du 19.11, n° 2) : « Rien à commander » quand la liste est vraiment vide ; sinon le compte de
 * l'horizon choisi (celui du chiffre clé et de la pastille de l'onglet), puis le total, qui est celui d'Étagère : « 0 à commander avant
 * S48 · 24 en tout ». Jamais « Rien à commander » quand des articles manquent hors de l'horizon.
 */
export function phraseRepliee(vue: VueHorizon, r: Reglage, manquent?: number): string {
  const tout = vue.comptes.tout;
  if (tout === 0) return 'Rien à commander';
  const m = Math.min(tout, Math.max(0, manquent ?? tout));
  const auSeuil = tout - m;
  // Les mots et le compte de la pastille « manque » d'Étagère ; les articles pile au seuil (retenus, mais « bas » en Étagère) à part.
  const total = [m > 0 ? `${m} ${m > 1 ? 'manquent' : 'manque'}` : '', auSeuil > 0 ? `${auSeuil} au seuil` : ''].filter(Boolean).join(' · ');
  const n = lignesDeReglage(vue, r).length;
  return n === tout ? total : `${n} à commander ${horizonCourt(vue, r)} · ${total}`;
}

const quantite = (l: LigneHorizon) => l.missing > 0 ? `${l.auMoins ? 'au moins ' : ''}${Units.format(l.missing, l.item.unit)}` : 'à définir';
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function ChiffreACommander({ vue, horizon, onHorizon, onOuvrir, onCommander }: {
  vue: VueHorizon;
  horizon: Reglage;
  onHorizon: (r: Reglage) => void;
  onOuvrir: (item: StockItem) => void;
  onCommander: () => void;
}) {
  const [toutes, setToutes] = useState(false);
  const [mode, setMode] = useState<ModeGeste | null>(null);
  const zone = useRef<HTMLDivElement>(null); // la grille : sa largeur sert de règle au geste
  const prise = useRef<HTMLDivElement>(null); // la zone qui reçoit le doigt, plus large que la grille de 10 px de chaque côté
  const geste = useRef<Geste | null>(null);

  const raccourci = typeof horizon === 'string' ? horizon : null;
  const fen = fenetreDeReglage(vue, horizon);
  const fenCourante = useRef<Fenetre>(fen);
  fenCourante.current = fen;
  const comptees = lignesDeReglage(vue, horizon);
  const n = comptees.length;
  const rien = vue.comptes.tout === 0;
  const visibles = toutes ? comptees : comptees.slice(0, LIGNES_VISIBLES);
  const plusTard = vue.comptes.tout - n;
  const max = Math.max(1, ...vue.colonnes.map((c) => c.n));
  const libelle = libelleFenetre(vue, fen);
  const nomHorizon: Record<Horizon, { t: string; s: string }> = {
    brassin: { t: vue.brassin ? etiquetteSemaine(vue.limiteBrassin) : 'Cette sem.', s: vue.brassin ? 'prochain brassin' : 'aucun brassin prévu' },
    six: { t: '6 sem.', s: `jusqu’à ${etiquetteSemaine(vue.limiteSix)}` },
    tout: { t: 'Tout', s: 'au seuil compris' }
  };
  const dans = (i: number) => i >= fen.a && i <= fen.b;
  const nomPosition = (i: number) => (vue.colonnes[i].semaine === null ? 'seuil' : vue.colonnes[i].etiquette);

  // « pastille et chiffre comptent … » : le raccourci garde sa phrase, une fenêtre libre dit ce qu'elle prend.
  const dit = raccourci || fen.a === 0
    ? `pastille et chiffre comptent jusqu’à`
    : `pastille et chiffre comptent ${fen.a === fen.b ? (vue.colonnes[fen.a].semaine === null ? 'le seuil seul' : `${nomPosition(fen.a)} seule`) : fen.b === POSITION_SEUIL ? `de ${nomPosition(fen.a)} au seuil` : `de ${nomPosition(fen.a)} à ${nomPosition(fen.b)}`}`;
  const precision = !raccourci && fen.a === 0 ? ` ${nomPosition(fen.b)}` : '';
  const titre = raccourci === 'tout' ? 'Tout, par urgence'
    : raccourci ? `Avant ${etiquetteSemaine(raccourci === 'brassin' ? vue.limiteBrassin : vue.limiteSix)}, par semaine`
      : `${majuscule(libelle)}${fen.b === POSITION_SEUIL ? ', par urgence' : ', par semaine'}`;

  const poser = (f: Fenetre) => {
    const c = fenCourante.current;
    if (f.a === c.a && f.b === c.b) return;
    fenCourante.current = f;
    onHorizon(reglageDeFenetre(vue, f));
  };
  const abscisse = (e: React.PointerEvent) => {
    const r = zone.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, largeur: r.width };
  };
  const lacher = () => { geste.current = null; setMode(null); };

  const auDebut = (e: React.PointerEvent) => {
    if (!e.isPrimary || e.button > 0) return;
    const { x, largeur } = abscisse(e);
    geste.current = debutGeste(fenCourante.current, x, largeur);
    setMode(geste.current.mode);
    try { prise.current!.setPointerCapture(e.pointerId); } catch { /* le geste suit quand même la zone */ }
  };
  const enMouvement = (e: React.PointerEvent) => {
    if (!geste.current) return;
    const { x, largeur } = abscisse(e);
    const r = deplacerGeste(geste.current, x, largeur, fenCourante.current);
    geste.current = r.geste;
    if (r.fenetre) poser(r.fenetre);
  };
  const alaLevee = () => {
    if (!geste.current) return;
    const f = finGeste(geste.current);
    lacher();
    if (f) poser(f);
  };
  const touche = (cote: 'g' | 'd') => (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1
      : e.key === 'Home' ? -POSITION_SEUIL : e.key === 'End' ? POSITION_SEUIL : 0;
    if (!delta) return;
    e.preventDefault();
    poser(pousserPoignee(fenCourante.current, cote, delta));
  };

  return (
    <section className="cac" aria-label="À commander" data-testid="chiffre-a-commander">
      <div className="cac-tete">
        <span className="cac-gros" data-testid="cac-gros">{n}</span>
        {/* Rien à commander : l'encadré plus bas le dit, une fois ; ici le chiffre n'a que son étiquette. */}
        <p className="cac-phrase" aria-live="polite">
          <span>à commander</span>
          {!rien && <b>{phraseReglage(vue, horizon)}</b>}
        </p>
      </div>

      {rien
        ? <p className="cac-vide" role="status"><b>Rien à commander</b><span>rien au seuil, rien de daté dans cette fenêtre</span></p>
        : <>
          <div className="cac-reglage">
            <p className="cac-lab"><span className="cac-mp" aria-hidden="true">{n}</span>{dit}{precision}</p>
            <div className="cac-seg" role="radiogroup" aria-label="Horizon du chiffre et de la pastille">
              {HORIZONS.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={raccourci === h} data-h={h} className={raccourci === h ? 'on' : ''} onClick={() => onHorizon(h)}>
                  <b>{nomHorizon[h].t}</b>{nomHorizon[h].s}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={prise}
            className={`cac-prise${mode ? ' drag' : ''}`}
            data-testid="cac-fenetre"
            onPointerDown={auDebut}
            onPointerMove={enMouvement}
            onPointerUp={alaLevee}
            onPointerCancel={lacher} /* le navigateur a repris le geste pour défiler la page : pas un toucher, rien ne change */
            onLostPointerCapture={lacher}
          >
            <div ref={zone} className="cac-zone" style={{ '--a': fen.a, '--n': fen.b - fen.a + 1 } as React.CSSProperties}>
            <div className="cac-his" aria-hidden="true">
              {vue.colonnes.map((c, i) => (
                <div key={c.etiquette} style={{ '--c': dans(i) ? (c.semaine === null ? 'rgb(var(--attention-texte))' : 'rgb(var(--area-finances))') : 'rgb(var(--cave-600))' } as React.CSSProperties}>
                  <span>{c.n || ''}</span><i style={{ height: c.n ? Math.max(6, (c.n / max) * 70) : 0 }} />
                </div>
              ))}
            </div>
            <div className="cac-ov">
              <b className="cac-br" aria-hidden="true" />
              <i className={`cac-hd cac-hg${mode === 'g' ? ' on' : ''}`} role="slider" tabIndex={0} aria-label="Début de la fenêtre"
                aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={fen.b} aria-valuenow={fen.a} aria-valuetext={nomPosition(fen.a)} onKeyDown={touche('g')} />
              <i className={`cac-hd cac-hdd${mode === 'd' ? ' on' : ''}`} role="slider" tabIndex={0} aria-label="Fin de la fenêtre"
                aria-orientation="horizontal" aria-valuemin={fen.a} aria-valuemax={POSITION_SEUIL} aria-valuenow={fen.b} aria-valuetext={nomPosition(fen.b)} onKeyDown={touche('d')} />
            </div>
            <div className="cac-sem" aria-hidden="true">{vue.colonnes.map((c) => <span key={c.etiquette}>{c.etiquette}</span>)}</div>
            </div>
          </div>
          <p className="sr-only">
            {vue.colonnes.map((c) => `${c.etiquette} : ${c.n}`).join(', ')}
          </p>

          <p className="cac-titre"><b>{titre}</b></p>
          {n === 0
            ? <p className="cac-vide" role="status">
              <b>Rien à commander {raccourci === 'brassin' && vue.brassin ? `avant ${etiquetteSemaine(vue.limiteBrassin)}` : raccourci ? 'dans ces semaines' : `sur ${libelle}`}</b>
              <span>{plusTard} {plusTard > 1 ? 'articles viennent' : 'article vient'} {raccourci ? 'plus tard · touchez Tout' : 'ailleurs · tirez le cadre ou touchez Tout'}</span>
            </p>
            : <ul className="cac-liste">
              {visibles.map((l) => (
                <li key={l.item.ref}>
                  <button type="button" className="cac-ligne" aria-label={`Ouvrir ${l.item.name}`} onClick={() => onOuvrir(l.item)}>
                    <i className="cac-pt" style={{ background: l.semaine === null ? 'rgb(var(--attention-texte))' : 'rgb(var(--area-finances))' }} />
                    <span className="cac-tx">
                      <span className="cac-nm">{l.item.name}</span>
                      <span className="cac-sb">
                        {l.semaine !== null
                          ? <><em>{etiquetteSemaine(l.semaine)}</em> · {l.pour}</>
                          : <><em className="cac-seuil">{l.recetteSeule ? 'sans date' : 'au seuil'}</em> · {l.pour ?? 'aucun brassin prévu'}</>}
                      </span>
                    </span>
                    <span className="cac-q">{quantite(l)}</span>
                  </button>
                </li>
              ))}
              {comptees.length > LIGNES_VISIBLES && (
                <li><button type="button" className="cac-plus" aria-expanded={toutes} onClick={() => setToutes((t) => !t)}>
                  {toutes ? 'Replier la liste' : `Voir les ${comptees.length - LIGNES_VISIBLES} autres`}
                </button></li>
              )}
            </ul>}
          {n > 0 && (
            <button type="button" className="cac-cta" onClick={onCommander}>
              <ShoppingCart size={20} aria-hidden="true" />Commander {n > 1 ? `ces ${n}` : 'cet article'}
            </button>
          )}
        </>}
    </section>
  );
}
