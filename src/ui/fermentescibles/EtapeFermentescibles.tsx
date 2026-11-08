import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Fermentable, FermentableKind, StockItem } from '../../types';
import type { LearnIngredient } from '../../domain/ingredientFacts';
import './correctifs.css';
import { messageSansMaltDeBase } from '../../domain/fermentables/base';
import { Ajout, type DefFamille } from './Ajout';
import { Ligne, type ActionsLigne, type AnnMoment } from './Ligne';
import { Plateau } from './Plateau';
import { Reperes } from './Reperes';
import {
  FAMILLES, JOUR_PAR_DEFAUT, kgTxt, MASSE_MAX_KG, messageMoment, MOMENT_SUIVANT, momentParDefaut, momentsPermis, pmax, teinte, type Candidat,
} from './modele';

/**
 * L'étape Malts/sucres (s1 : la maquette `v7/s1`, sur p6-b2). Le ticket (une ligne par ingrédient, la barre porte la masse, le moment sans
 * pilule), le champ d'ajout et sa recherche, le plateau toujours visible, les repères. Les nombres de la bière viennent de l'app (OG, EBC,
 * rendement, plages du style) et arrivent par les props : rien n'est recalculé ici.
 */
export interface EtapeFermentesciblesProps {
  fermentables: Fermentable[];
  onFermentables: Dispatch<SetStateAction<Fermentable[]>>;
  stockItems: StockItem[];
  famille: FermentableKind;
  onFamille: (k: FermentableKind) => void;
  /** `KIND_DEF` de l'étape : les familles, leurs rayons de stock, leur moment, leur fermentescibilité. */
  defs: Record<FermentableKind, DefFamille>;
  familles?: readonly FermentableKind[];
  onCreateStockItem: (name: string, category: string, unit: string) => StockItem;
  onLearnIngredient: LearnIngredient;
  nolo: boolean;
  og: number | null;
  teinteBiere: { ebc: number; label: string } | null;
  rendementPct: number;
  rendementDeclare: boolean;
  ogPlage?: { min: number; max: number };
  ebcPlage?: { min: number; max: number };
  styleCode?: string | null;
  ebcVise?: number | null;
  /** La borne haute de la plage de teinte du style (relais de la voie a1). */
  ebcMax?: number | null;
  /** La note du moût qui sature (BrewingMath.efficiencyAtGravity), s'il y en a une. */
  alerteDensite?: string | null;
  /** Le message d'erreur d'un champ de la validation du brouillon. */
  erreur: (champ: string) => string | undefined;
}

const focus = (sel: string) => {
  const e = document.querySelector<HTMLElement>(sel);
  if (!e) return false;
  e.focus({ preventScroll: false });
  return true;
};

export const EtapeFermentescibles: React.FC<EtapeFermentesciblesProps> = ({
  fermentables, onFermentables, stockItems, famille, onFamille, defs, familles = FAMILLES, onCreateStockItem, onLearnIngredient, nolo,
  og, teinteBiere, rendementPct, rendementDeclare, ogPlage, ebcPlage, styleCode, ebcVise, ebcMax, alerteDensite, erreur,
}) => {
  const [sel, setSel] = useState(0);
  const [neuf, setNeuf] = useState<number | null>(null);
  const [couleurLigne, setCouleurLigne] = useState(-1);
  const chaine = useRef(false);
  // Les retraits en cours d'annulation, du plus ancien au dernier : « Annuler » rend le dernier, puis le précédent (B1 n° 6 : le second retrait ne perd plus le premier).
  const [annules, setAnnules] = useState<Array<{ f: Fermentable; i: number; sel: number }>>([]);
  const annule = annules.length ? annules[annules.length - 1] : null;
  const [annMom, setAnnMom] = useState<AnnMoment | null>(null);
  const minutRetrait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const minutMoment = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [repsOuvert, setRepsOuvert] = useState<boolean | null>(null);
  const retour = useRef(-1);
  const aFocaliser = useRef<number | null>(null);
  const echelles = useRef(new Map<string, number>());

  const n = fermentables.length;
  const selI = n ? Math.min(sel, n - 1) : -1;
  const aRenseigner = fermentables.filter((f) => f.kind === 'grain' && f.colorEbc == null).length;
  useEffect(() => () => { clearTimeout(minutRetrait.current); clearTimeout(minutMoment.current); clearTimeout(minutPlafond.current); }, []);

  // L'ajout mène à la masse de la ligne, sur la ligne (le focus est donné quand la ligne est montée).
  useLayoutEffect(() => {
    const i = aFocaliser.current;
    if (i !== null && n > i) { aFocaliser.current = null; focus(`[data-kl="${i}"]`); }
  }, [n, fermentables]);

  const patch = useCallback((i: number, p: Partial<Fermentable>) =>
    onFermentables((l) => l.map((f, k) => (k === i ? { ...f, ...p } : f))), [onFermentables]);
  // Le plafond de la masse (10 t) est dit : « 99999 » devient 10 000 kg et l'écran l'écrit sous la recette, jusqu'à la masse suivante ou 6 s (B1 n° 12).
  const [plafond, setPlafond] = useState(false);
  const minutPlafond = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setKg = useCallback((i: number, brut: number) => {
    // Un nombre illisible (curseur sur une piste sans largeur : 0 ÷ 0) n'est pas une masse : rien n'est retenu, jamais NaN dans la recette.
    if (!Number.isFinite(brut)) return;
    const kg = Math.min(MASSE_MAX_KG, brut);
    clearTimeout(minutPlafond.current);
    if (brut > MASSE_MAX_KG) { setPlafond(true); minutPlafond.current = setTimeout(() => setPlafond(false), 6000); } else setPlafond(false);
    onFermentables((l) => (l[i] && l[i].weightKg !== kg ? l.map((f, k) => (k === i ? { ...f, weightKg: kg } : f)) : l));
  }, [onFermentables]);

  const echelleDe = (f: Fermentable) => {
    const cle = `${f.kind}|${f.name}`;
    let m = echelles.current.get(cle);
    if (!m || f.weightKg > m) { m = pmax(f.weightKg); echelles.current.set(cle, m); }
    return m;
  };

  const versAjout = () => { focus('[data-role="ajout"]'); };

  // Retirer : sans dialogue ; la place reste 6 s avec « Annuler » ; un nouveau retrait s'empile sur le précédent (6 s après le dernier geste).
  const retirer = (i: number) => {
    const f = fermentables[i];
    if (!f) return;
    clearTimeout(minutRetrait.current);
    setAnnules((a) => [...a, { f, i, sel }]);
    onFermentables((l) => l.filter((_, k) => k !== i));
    if (sel > i) setSel(sel - 1);
    retour.current = -1; setCouleurLigne(-1); setAnnMom(null);
    minutRetrait.current = setTimeout(() => setAnnules([]), 6000);
  };
  // « Annuler » rend TOUS les retraits en attente, du dernier au premier (banc d'actionneurs N1 : un double toucher sur la corbeille en retire deux, et un seul « Annuler » en rendait un).
  const rendreLigne = () => {
    const pile = annules;
    if (!pile.length) return;
    clearTimeout(minutRetrait.current);
    setAnnules([]);
    onFermentables((l) => {
      let r = [...l];
      for (let k = pile.length - 1; k >= 0; k--) r = [...r.slice(0, pile[k].i), pile[k].f, ...r.slice(pile[k].i)];
      return r;
    });
    const premier = pile[0];
    setSel(premier.sel); setNeuf(premier.i);
    requestAnimationFrame(() => focus(`[data-ret="${premier.i}"]`));
  };

  // Un toucher fait tourner le moment ; « Annuler » rend celui d'avant la série de touchers (6 s, comme le retrait).
  const tourner = (i: number) => {
    const f = fermentables[i];
    // Le moment suivant parmi ceux que la famille permet (AM 1 et 2) : un grain bien placé ne bouge pas ; un grain mal placé revient à l'empâtage, sans jour J+.
    const use = f ? MOMENT_SUIVANT(f) : undefined;
    if (!f || use === undefined || use === f.use) return;
    clearTimeout(minutMoment.current);
    setCouleurLigne(-1);
    setAnnMom((a) => ({ ...(a && a.i === i ? a : { i, use: f.use, dayOffset: f.dayOffset }), t: Date.now() }));
    patch(i, { use, ...(f.kind === 'grain' ? { dayOffset: undefined } : use === 'fermentation' && f.dayOffset == null ? { dayOffset: JOUR_PAR_DEFAUT } : {}) });
    requestAnimationFrame(() => focus(`[data-ml="${i}"]`));
    minutMoment.current = setTimeout(() => setAnnMom(null), 6000);
  };
  const annulerMoment = () => {
    const a = annMom;
    if (!a) return;
    clearTimeout(minutMoment.current);
    setAnnMom(null);
    patch(a.i, { use: a.use, dayOffset: a.dayOffset });
    requestAnimationFrame(() => focus(`[data-ml="${a.i}"]`));
  };

  // La couleur, sur la ligne. Ouverte par « N couleurs à renseigner », la saisie enchaîne : Entrée passe au « ? » suivant.
  const ouvrirEbc = (i: number, enchaine = false) => { chaine.current = enchaine; setCouleurLigne(i); };
  const finEbc = (i: number, mode: 'ok' | 'echap' | 'sortie', v: number | null) => {
    if (mode !== 'echap' && v != null) patch(i, { colorEbc: v });
    const suite = mode === 'ok' && chaine.current
      ? fermentables.findIndex((g, k) => k !== i && g.kind === 'grain' && g.colorEbc == null) : -1;
    if (suite >= 0) { setCouleurLigne(suite); return; }
    chaine.current = false;
    setCouleurLigne(-1);
  };

  const a: ActionsLigne = {
    selectionner: (i) => { setSel(i); echelles.current.clear(); },
    retirer, setKg,
    setJour: (i, j) => patch(i, { dayOffset: j }),
    tourner, annulerMoment, ouvrirEbc: (i) => ouvrirEbc(i), finEbc,
    entreeMasse: (i) => {
      if (retour.current === i) { retour.current = -1; return focus('[data-role="ajout"]'); }
      return false;
    },
    tabMasse: (i, d) => {
      if (focus(`[data-kl="${i + d}"]`)) return true;
      return d > 0 ? focus('[data-role="ajout"]') : false;
    },
  };

  // Le champ d'ajout : un candidat de la recherche. Il ne crée pas de doublon.
  // `fam` : la famille de la ligne. Celle du champ, sauf pour un article trouvé dans un autre rayon (« dext » en Grain → Dextrose, famille Sucre ; B1 n° 4).
  const ajouterLigne = (nom: string, article: StockItem | undefined, kg: number | null, fam: FermentableKind = famille) => {
    const def = defs[fam];
    // Le moment de la famille, s'il est permis par la table ; sinon le premier permis (jamais un grain hors de l'empâtage).
    const use = momentsPermis(fam).includes(def.use) ? def.use : momentParDefaut(fam);
    const nouvelle: Fermentable = {
      name: nom,
      stockItemRef: article?.ref,
      // Zéro, pas une quantité plausible : c'est au brasseur de la poser.
      weightKg: kg ?? 0,
      kind: fam,
      use,
      fermentabilityPct: def.fermentability,
      colorEbc: article?.colorEbc ?? (fam === 'grain' ? undefined : 0),
      potentialPpg: article?.potentialPpg ?? def.ppg,
      ...(use === 'fermentation' ? { dayOffset: JOUR_PAR_DEFAUT } : {}),
    };
    echelles.current.clear();
    setSel(n); setNeuf(n);
    setTimeout(() => setNeuf(null), 700);
    // `versMasse` de s1 (D230, règle n° 1), au toucher comme à la souris : sans masse tapée, le focus va dans la masse de la ligne ajoutée.
    if (kg == null) { retour.current = n; aFocaliser.current = n; } else retour.current = -1;
    onFermentables((l) => [...l, nouvelle]);
  };
  // RJ-9 : « Pilsner Malz 1,8 » tapé dans la famille Sucre ne réécrit pas en silence la masse du grain déjà là (6,6 → 1,8 kg, OG 1,080 → 1,034) :
  // la ligne est sélectionnée, l'écran dit ce qui va se passer et demande. Dans sa propre famille, taper un nom et une masse reste le geste de mise à jour.
  const [aRemplacer, setARemplacer] = useState<{ ligne: number; kg: number } | null>(null);
  const remplacer = aRemplacer && fermentables[aRemplacer.ligne] && fermentables[aRemplacer.ligne].kind !== famille ? aRemplacer : null;
  const choisir = (c: Candidat, kg: number | null) => {
    const existante = c.ligne >= 0 ? fermentables[c.ligne] : undefined;
    if (existante && kg != null && existante.kind !== famille && existante.weightKg > 0 && existante.weightKg !== kg) {
      setSel(c.ligne); setARemplacer({ ligne: c.ligne, kg });
      return;
    }
    setARemplacer(null);
    if (c.ligne >= 0) {
      setSel(c.ligne);
      if (kg != null) setKg(c.ligne, kg);
      if (kg == null) { retour.current = c.ligne; focus(`[data-kl="${c.ligne}"]`); } else versAjout();
      return;
    }
    ajouterLigne(c.nom, c.article, kg, c.famille);
    if (kg != null) requestAnimationFrame(versAjout);
  };
  const creer = (nom: string, kg: number | null) => {
    const cree = onCreateStockItem(nom, defs[famille].newCat, 'kg');
    ajouterLigne(cree.name, cree, kg);
    if (kg != null) requestAnimationFrame(versAjout);
  };

  const ticket = fermentables.map((f, i) => (
    <Ligne key={`${f.kind}|${f.name}|${f.stockItemRef ?? ''}`} f={f} i={i} fermentables={fermentables} selectionnee={selI === i} neuf={neuf === i}
      couleurOuverte={couleurLigne === i} annMom={annMom} nolo={nolo} etiquetteFamille={defs[f.kind].label} echelle={echelleDe(f)}
      invalide={!!erreur(`wz-fermentable-${i}`)} decrit={erreur(`wz-fermentable-${i}`) ? 'wz-validation' : undefined} a={a} />
  ));

  const lignes: React.ReactNode[] = [...ticket];
  if (annule) {
    lignes.splice(Math.min(annule.i, lignes.length), 0, (
      <li className="fer-ote" key={`ote-${annules.length}`} aria-live="polite">
        <s>{annule.f.name}</s> retiré
        {annules.length > 1 && <span className="fer-ote-n">· {annules.length - 1} de plus</span>}
        <button type="button" className="fer-ann" data-role="annuler" onClick={rendreLigne}>Annuler</button>
        <i className="fer-file" aria-hidden="true" />
      </li>
    ));
  }

  const lactose = fermentables.some((f) => f.kind === 'lactose' && f.weightKg > 0);
  const sansBase = messageSansMaltDeBase(fermentables);
  const selF = selI >= 0 ? fermentables[selI] : undefined;
  // `ajuster()` de la maquette (D212, D228 : le critère de la maquette) : les repères se replient d'eux-mêmes quand le pied (« Suivant ») sortirait du
  // premier écran avec eux ouverts, et se rouvrent quand il y tient ; jamais si le brasseur les a ouverts ou fermés à la main. Le calcul projette le pied
  // « repères ouverts » (sa hauteur ouverte est mémorisée), donc ne dépend pas de leur état courant. Il attend la fin d'une recherche (les tuiles
  // ouvertes allongent la page) et se refait après la mise en page (polices).
  const [plie, setPlie] = useState(false);
  const [mesure, setMesure] = useState(0);
  const racine = useRef<HTMLDivElement | null>(null);
  const hauteurOuverte = useRef<number | null>(null);
  const repsVisible = repsOuvert ?? (n <= 5 && !plie);
  useEffect(() => { const id = setTimeout(() => setMesure((m) => m + 1), 400); return () => clearTimeout(id); }, [n, selI, selF?.use, famille]);
  // La fiche du plateau s'ouvre et se ferme sans que l'étape se rende : la hauteur de la page le dit (le calcul se refait, projeté, sans boucle).
  useEffect(() => {
    const r = racine.current;
    if (!r || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setMesure((m) => m + 1));
    ro.observe(r);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (repsOuvert !== null || n === 0 || n > 5) return;
    if (document.querySelector('.fer-tuiles')) return;
    const pied = [...document.querySelectorAll<HTMLElement>('button')].find((x) => /^Suivant/.test(x.textContent ?? ''));
    const reps = racine.current?.querySelector<HTMLElement>('[data-role="reps"]');
    if (!pied || !reps) return;
    const h = reps.getBoundingClientRect().height;
    if (repsVisible) hauteurOuverte.current = h;
    const basSiOuverts = pied.getBoundingClientRect().bottom + (repsVisible ? 0 : (hauteurOuverte.current ?? 170) - h);
    const doitPlier = basSiOuverts > window.innerHeight + 0.5;
    if (doitPlier !== plie) setPlie(doitPlier);
  }, [repsOuvert, n, plie, repsVisible, mesure, selI, selF?.use, famille, fermentables, annule]);

  return (
    <div ref={racine} className={`fer${n <= 4 ? ' fer-ample' : ''}`} data-etape="fermentescibles">
      <div className="fer-comp" data-role="comp" data-booster="barre-composition" role="img" style={{ visibility: n ? 'visible' : 'hidden' }}
        aria-label={`Composition : ${fermentables.map((f) => `${f.name} ${kgTxt(f.weightKg)} kg`).join(', ')}`}>
        {fermentables.map((f, i) => (
          <i key={i} className={f.kind !== 'grain' ? 'fer-sucre' : f.colorEbc == null ? 'fer-inc' : ''}
            style={{ flexGrow: f.weightKg, ...(f.kind === 'grain' && f.colorEbc != null ? { background: teinte(f.colorEbc) } : {}) }} />
        ))}
      </div>
      <ul className="fer-ticket" data-role="ticket" aria-label="Malts et sucres de la recette" data-booster="ticket-selection">
        {lignes.length ? lignes : <li className="fer-vide">Rien encore.</li>}
      </ul>
      <Ajout famille={famille} familles={familles} defs={defs} onFamille={onFamille} stockItems={stockItems} fermentables={fermentables}
        styleCode={styleCode} ebcVise={ebcVise} ebcMax={ebcMax} onChoisir={choisir} onCreer={creer} />
      {n > 0 && (
        <Reperes rendementPct={rendementPct} rendementDeclare={rendementDeclare} og={og} ogPlage={ogPlage} teinteBiere={teinteBiere} ebcPlage={ebcPlage}
          aRenseigner={aRenseigner} ouvert={repsVisible} onBascule={() => setRepsOuvert(!repsVisible)}
          onRenseigner={() => { const i = fermentables.findIndex((f) => f.kind === 'grain' && f.colorEbc == null); if (i >= 0) ouvrirEbc(i, true); }} />
      )}
      <div data-role="alertes">
        {remplacer && (
          <div className="fer-alerte" role="alert" data-role="remplacer">
            <p style={{ margin: 0 }}>
              « {fermentables[remplacer.ligne].name} » est déjà dans la recette ({defs[fermentables[remplacer.ligne].kind].label.toLowerCase()}, {kgTxt(fermentables[remplacer.ligne].weightKg)} kg), pas un {defs[famille].label.toLowerCase()} à ajouter.
              Remplacer sa masse par {kgTxt(remplacer.kg)} kg ?
            </p>
            <div className="fer-remp">
              <button type="button" className="fer-ann" data-role="remplacer-oui"
                onClick={() => { setKg(remplacer.ligne, remplacer.kg); setARemplacer(null); versAjout(); }}>Remplacer par {kgTxt(remplacer.kg)} kg</button>
              <button type="button" className="fer-ann fer-ann-non" data-role="remplacer-non"
                onClick={() => { setARemplacer(null); versAjout(); }}>Garder {kgTxt(fermentables[remplacer.ligne].weightKg)} kg</button>
            </div>
          </div>
        )}
        {plafond && <p className="fer-alerte" role="status">Masse limitée à {`${MASSE_MAX_KG / 1000} 000`} kg par ligne.</p>}
        {lactose && <p className="fer-alerte">Lactose : non fermentescible, il remonte la densité finale.</p>}
        {/* Une donnée ancienne mal placée (grain bouilli ou au fermenteur) : dite ici, en clair, tout de suite ; la ligne porte « compté 0 ». */}
        {fermentables.map((f, i) => {
          const m = messageMoment(f);
          return m ? <p key={`mom-${i}`} className="fer-alerte" data-hors="moment" data-ah={i}>{m} Touche son moment pour le remettre.</p> : null;
        })}
        {sansBase && <p className="fer-alerte" data-hors="base" role="status">{sansBase}</p>}
        {alerteDensite && <p className="fer-alerte">{alerteDensite}</p>}
      </div>
      <Plateau f={selF} i={selI} setKg={setKg} setJour={a.setJour} tourner={tourner} retirer={retirer}
        setCouleur={(i, v) => patch(i, { colorEbc: v })} patch={patch} onLearnIngredient={onLearnIngredient} versAjout={versAjout} />
    </div>
  );
};
