import React from 'react';
import './cout-brassin.css';
import type { BrewBudgetSnapshot, BrewCostKey, BrewBudgetLine } from '../../domain/finance/brewBudget';
import type { CoutLitre, TroisNotions } from '../../domain/finance/chaineLitre';

/**
 * Le flux de c3a (maquette choisie, 09.11) : « quand tu paies » (déjà payé, à payer, coût de l'année) → « pour quoi », puis le litre.
 * Les montants viennent du snapshot de `estimateBrewBudget` (d1/uc) : rien n'est recalculé ici sauf la géométrie. L'inconnu est « ? », jamais 0.
 */
export type SourceId = 'stock' | 'now' | 'an';
export type NoeudId = 'malt' | 'ener' | 'net' | 'emb' | 'imp' | 'q' | 'autres' | 'mat' | 'fix';

export interface Destination {
  id: NoeudId; label: string; couleur: string;
  /** null : inconnu, dessiné « ? » hachuré. */
  montant: number | null;
  /** pointillé : montant estimé (saisi à la main, sans facture ni calcul). */
  estime: boolean;
  /** Houblon et levure absents de la recette : « hors recette », ce n'est pas un prix manquant. */
  horsRecette?: boolean;
}
export interface FluxLigne { source: SourceId; dest: NoeudId; montant: number }
export interface FluxDuBrassin { sources: Record<SourceId, number>; destinations: Destination[]; flux: FluxLigne[] }

const nk = (s: string) => s.trim().toLocaleLowerCase('fr-CH');
const fini = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Format de la maquette : espace pour les milliers, virgule décimale, signe moins typographique. */
export function fr(n: number, decimales = 2): string {
  const [entier, decimal] = Math.abs(n).toFixed(decimales).replace('.', ',').split(',');
  return (n < 0 ? '−' : '') + entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (decimal === undefined ? '' : `,${decimal}`);
}
/** Litres : 27 → « 27 », 26,6 → « 26,6 ». */
export function frL(n: number): string { return fr(n, 2).replace(/,?0+$/, ''); }

/** Malt = fermentescibles ; Houblon, levure ; le reste (adjuvants, eau, sels) = Autres. Une ligne n'a pas de genre : on la retrouve par son nom dans la recette. */
export function groupeIngredient(line: Pick<BrewBudgetLine, 'name' | 'kind'>, recette: BrewBudgetSnapshot['recipeSnapshot']): 'malt' | 'q' | 'autres' {
  if (line.kind !== 'ingredient') return 'autres';
  const n = nk(line.name);
  if (recette.fermentables?.some(f => nk(f.name) === n)) return 'malt';
  if (recette.hops?.some(h => nk(h.name) === n) || (recette.yeast?.name && nk(recette.yeast.name) === n)) return 'q';
  return 'autres';
}

const COULEURS: Record<NoeudId, string> = { malt: 'var(--cbf-malt)', ener: 'var(--cbf-ener)', net: 'var(--cbf-net)', emb: 'var(--cbf-emb)', imp: 'var(--cbf-imp)', q: 'var(--cbf-hop)', autres: 'var(--cbf-hop)', mat: 'var(--cbf-mat)', fix: 'var(--cbf-fix)' };
const FRAIS: Array<[BrewCostKey, NoeudId, string]> = [['energy', 'ener', 'Énergie'], ['cleaning', 'net', 'Nettoyage'], ['packaging', 'emb', 'Emballage'], ['beerTax', 'imp', 'Impôt bière']];

/** Qui paie quoi : ingrédients par part « déjà payée » (stock) et « à payer » (achat), frais → à payer, charges et usure → année. */
export function fluxDuBrassin(s: BrewBudgetSnapshot, estimes: Partial<Record<NoeudId, boolean>> = {}): FluxDuBrassin {
  const flux: FluxLigne[] = [];
  const destinations: Destination[] = [];
  const dejaPaye = s.dejaPaye ?? s.lines.reduce((n, l) => n + (l.stockCost ?? 0), 0);
  const annee = s.annee ?? s.fixedAllocation + s.depreciationAllocation;
  const sources: Record<SourceId, number> = { stock: dejaPaye, now: s.aPayer ?? Math.round((s.totalCost - dejaPaye - annee) * 100) / 100, an: annee };
  const parGroupe: Record<'malt' | 'q' | 'autres', BrewBudgetLine[]> = { malt: [], q: [], autres: [] };
  s.lines.forEach(l => parGroupe[groupeIngredient(l, s.recipeSnapshot)].push(l));
  const ingredient = (id: 'malt' | 'q' | 'autres', label: string) => {
    const lignes = parGroupe[id];
    if (!lignes.length) {
      if (id === 'q') destinations.push({ id, label, couleur: COULEURS[id], montant: null, estime: false, horsRecette: true });
      return;
    }
    const inconnu = lignes.some(l => l.consumedCost === null);
    const montant = inconnu ? null : Math.round(lignes.reduce((n, l) => n + (l.consumedCost ?? 0), 0) * 100) / 100;
    destinations.push({ id, label, couleur: COULEURS[id], montant, estime: false });
    if (!inconnu) {
      const stock = lignes.reduce((n, l) => n + (l.stockCost ?? 0), 0), achat = lignes.reduce((n, l) => n + (l.purchaseCost ?? 0), 0);
      if (stock > 0) flux.push({ source: 'stock', dest: id, montant: stock });
      if (achat > 0) flux.push({ source: 'now', dest: id, montant: achat });
    }
  };
  ingredient('malt', 'Malt');
  for (const [key, id, label] of FRAIS) {
    const poste = s.fraisParPoste?.[key];
    if (!poste) continue; // poste désactivé : pas de nœud (jamais 0)
    destinations.push({ id, label, couleur: COULEURS[id], montant: poste.cout, estime: estimes[id] ?? true });
    if (poste.cout !== null && poste.cout > 0) flux.push({ source: 'now', dest: id, montant: poste.cout });
  }
  ingredient('q', 'Houblon, levure');
  ingredient('autres', 'Autres ingrédients');
  const annuel = (actif: boolean | undefined, annuelCHF: number | undefined) => actif === false ? undefined : fini(annuelCHF) && annuelCHF >= 0 && (s.settings.annualVolumeL ?? 0) > 0;
  const usure = annuel(s.settings.includeDepreciation, s.settings.annualDepreciationCHF), fixe = annuel(s.settings.includeFixed, s.settings.annualFixedCHF);
  if (usure !== undefined) { destinations.push({ id: 'mat', label: 'Usure matériel', couleur: COULEURS.mat, montant: usure ? s.depreciationAllocation : null, estime: estimes.mat ?? false }); if (usure && s.depreciationAllocation > 0) flux.push({ source: 'an', dest: 'mat', montant: s.depreciationAllocation }); }
  if (fixe !== undefined) { destinations.push({ id: 'fix', label: 'Charges fixes', couleur: COULEURS.fix, montant: fixe ? s.fixedAllocation : null, estime: estimes.fix ?? false }); if (fixe && s.fixedAllocation > 0) flux.push({ source: 'an', dest: 'fix', montant: s.fixedAllocation }); }
  return { sources, destinations, flux };
}

/**
 * Les trois parts du litre, au centime, sommant au litre affiché (plus grand reste ; égalité : l'ordre payé, à payer, année).
 * `complet` est le litre déjà arrondi (`coutLitre(...).affiche.complet`) : l'arrondi se fait une seule fois, à la fin.
 */
export function litreTroisTemps(notions: Pick<TroisNotions, 'dejaPaye' | 'aPayer' | 'annee'>, litres: number, complet: number): [number, number, number] {
  const exact = [notions.dejaPaye, notions.aPayer, notions.annee].map(v => Math.round(v / litres * 100 * 1e6) / 1e6);
  const plancher = exact.map(Math.floor);
  let reste = Math.round(complet * 100) - plancher.reduce((a, b) => a + b, 0);
  const ordre = [0, 1, 2].sort((a, b) => (exact[b] - plancher[b]) - (exact[a] - plancher[a]) || a - b);
  for (const i of ordre) { if (reste <= 0) break; plancher[i]++; reste--; }
  return [plancher[0] / 100, plancher[1] / 100, plancher[2] / 100];
}

const PX = 1.62, MIN = 12, X0 = 112, X1 = 236, W = 10, TOP = 10, H_MAX = 330;
const SRC: Array<{ id: SourceId; nom: string; c: string }> = [{ id: 'stock', nom: 'Déjà payé', c: 'var(--cbf-stock)' }, { id: 'now', nom: 'À payer', c: 'var(--cbf-now)' }, { id: 'an', nom: 'Coût de l’année', c: 'var(--cbf-an)' }];

export interface CoutBrassinFluxProps {
  snapshot: BrewBudgetSnapshot;
  notions: TroisNotions | null;
  litre: CoutLitre | null;
  /** Litres nets connus (saisis, enregistrés ou conditionnés) ; null : inconnu. */
  litres: number | null;
  /** Pourquoi le litre est « — » : litres nets inconnus, ou prix à compléter. */
  motifSansLitre?: 'litres' | 'prix';
  estimes?: Partial<Record<NoeudId, boolean>>;
  selection: SourceId | null;
  onSelect: (id: SourceId | null) => void;
  onNoeud: (id: NoeudId) => void;
  onVolumes: () => void;
  assujetti?: boolean;
  children?: React.ReactNode;
}

export function CoutBrassinFlux({ snapshot, notions, litre, litres, motifSansLitre, estimes, selection, onSelect, onNoeud, onVolumes, assujetti, children }: CoutBrassinFluxProps) {
  const { sources, destinations, flux } = React.useMemo(() => fluxDuBrassin(snapshot, estimes), [snapshot, estimes]);
  const geo = React.useMemo(() => {
    const total = flux.reduce((n, f) => n + f.montant, 0) || 1;
    const px = Math.min(PX, H_MAX / total);
    const haut = (m: number) => Math.max(m * px, MIN);
    const sh: Record<string, number> = {}, dh: Record<string, number> = {};
    flux.forEach(f => { const t = haut(f.montant); sh[f.source] = (sh[f.source] ?? 0) + t; dh[f.dest] = (dh[f.dest] ?? 0) + t; });
    let y = TOP; const sp: Record<string, { y: number; h: number; o: number }> = {};
    SRC.forEach(s => { const h = sh[s.id] ?? MIN; sp[s.id] = { y, h, o: 0 }; y += h + 26; });
    const finSources = y;
    y = TOP; const dp: Record<string, { y: number; h: number; o: number }> = {};
    destinations.forEach(d => { const h = d.montant === null ? MIN : Math.max(dh[d.id] ?? 0, MIN); dp[d.id] = { y, h, o: 0 }; y += h + 7; });
    const hauteur = Math.ceil(Math.max(y, finSources, 120) + 18);
    const rubans = flux.map(f => {
      const t = haut(f.montant), a = sp[f.source], b = dp[f.dest];
      const y0 = a.y + a.o, y1 = b.y + b.o; a.o += t; b.o += t;
      const xm = (X0 + W + X1) / 2;
      return { f, d: `M${X0 + W} ${y0} C${xm} ${y0} ${xm} ${y1} ${X1} ${y1} L${X1} ${y1 + t} C${xm} ${y1 + t} ${xm} ${y0 + t} ${X0 + W} ${y0 + t} Z` };
    });
    const ly: number[] = [];
    destinations.forEach((d, i) => { const p = dp[d.id]; let c = p.y + p.h / 2; if (i && c < ly[i - 1] + 19) c = ly[i - 1] + 19; ly.push(c); });
    return { sp, dp, hauteur, rubans, ly };
  }, [flux, destinations]);

  const pale = (s: SourceId) => selection !== null && selection !== s;
  const destPale = (d: Destination) => selection !== null && (d.montant === null ? selection !== 'now' : !flux.some(f => f.dest === d.id && f.source === selection));
  const total = notions?.total ?? snapshot.totalCost;
  const partiel = !notions?.complet;
  const poche = snapshot.cashRequiredTTC;
  const q = snapshot.quandPaye;
  const horsRecette = destinations.find(d => d.id === 'q')?.horsRecette;
  const emballageCompris = snapshot.fraisParPoste?.packaging?.cout != null;
  const parts = litre && litres ? litreTroisTemps(notions!, litres, litre.affiche.complet) : null;
  const libelleParts = ['payé', 'à payer', 'année'];

  return <div className="cbf">
    <div className="cbf-fil">
      <button type="button" className="cbf-vol cbf-m" onClick={onVolumes} aria-label={litres ? `Volumes : ${frL(litres)} L nets` : 'Volumes : litres nets à renseigner'} data-inconnu={litres ? undefined : 'true'}>{litres ? `${frL(litres)} L nets` : '? L nets'}</button>
    </div>
    <div className="cbf-cols"><span>Quand tu paies</span><span>Pour quoi</span></div>
    <div className="cbf-sk" style={{ height: geo.hauteur }} data-booster="flux-cout">
      <svg className="cbf-flux" viewBox={`0 0 390 ${geo.hauteur}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id="cbf-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--cbf-fond)" /><rect width="2" height="5" fill="var(--cbf-trait)" /></pattern></defs>
        {geo.rubans.map(({ f, d }, i) => <path key={i} d={d} fill={SRC.find(s => s.id === f.source)!.c} opacity={pale(f.source) ? 0.05 : 0.3} />)}
        {destinations.filter(d => d.montant === null).map(d => { const p = geo.dp[d.id]; const a = geo.sp.now; return <path key={`l${d.id}`} d={`M${X0 + W} ${a.y + a.h - 2} C174 ${a.y + a.h} 174 ${p.y + 6} ${X1} ${p.y + 6}`} fill="none" stroke="var(--cbf-trait)" strokeWidth="1.5" strokeDasharray="4 3" opacity={selection && selection !== 'now' ? 0.12 : 1} />; })}
        {SRC.map(s => { const p = geo.sp[s.id]; return <rect key={s.id} x={X0} y={p.y} width={W} height={p.h} rx="2" fill={s.c} opacity={pale(s.id) ? 0.12 : 1} />; })}
        {destinations.map(d => { const p = geo.dp[d.id]; return d.montant === null
          ? <rect key={d.id} x={X1} y={p.y} width={W} height={12} rx="2" fill="url(#cbf-hach)" stroke="var(--cbf-trait)" />
          : <rect key={d.id} x={X1} y={p.y} width={W} height={p.h} rx="2" fill={d.couleur} />; })}
      </svg>
      {SRC.map(s => { const p = geo.sp[s.id], c = p.y + p.h / 2; return <button key={s.id} type="button" className={`cbf-src${pale(s.id) ? ' cbf-pale' : ''}`} data-s={s.id} data-pale={pale(s.id) ? 'true' : undefined}
        aria-pressed={selection === s.id} onClick={() => onSelect(selection === s.id ? null : s.id)} style={{ top: Math.max(0, Math.round(c - 24)) }}>
        <small><i style={{ background: s.c }} />{s.nom}{s.id === 'now' && assujetti ? ' (HT)' : ''}</small><b className="cbf-m">{fr(sources[s.id])}</b></button>; })}
      {destinations.map((d, i) => <button key={d.id} type="button" className={`cbf-dst${d.estime ? ' cbf-ex' : ''}${d.montant === null ? ' cbf-q' : ''}${destPale(d) ? ' cbf-pale' : ''}`} data-d={d.id} data-pale={destPale(d) ? 'true' : undefined}
        style={{ top: Math.round(geo.ly[i]) }} onClick={() => onNoeud(d.id)} aria-label={`${d.label} : ${d.montant === null ? (d.horsRecette ? 'hors recette' : 'à compléter') : `${fr(d.montant)} CHF`}`}>
        <span>{d.label}</span><b className="cbf-m">{d.montant === null ? '?' : fr(d.montant)}</b></button>)}
      <div className="cbf-exl"><span className="cbf-m">0,00</span> pointillé : estimé</div>
    </div>
    {selection === 'now'
      ? <div className="cbf-res cbf-now" data-booster="deux-nombres">
        <div className="cbf-row"><span className="cbf-div">À payer</span><span className="cbf-eq">=</span><span className="cbf-big cbf-m">{fr(poche)}</span><span className="cbf-u">CHF<b>TTC</b>{partiel || q?.avantBrassage === null || q?.plusTard === null ? <em>partiel</em> : null}</span></div>
        <div className="cbf-quand">
          <span>avant le brassage <b className="cbf-m">{q?.avantBrassage == null ? '?' : fr(q.avantBrassage)}</b></span>
          <span>plus tard <small>emballage, impôt</small> <b className="cbf-m">{q?.plusTard == null ? '?' : fr(q.plusTard)}</b></span>
        </div>
        {snapshot.resteEnStock ? <p className="cbf-note">dont {fr(snapshot.resteEnStock)} restent en stock (sacs entiers)</p> : null}
      </div>
      : <div className="cbf-res" data-booster="deux-nombres">
        <div className="cbf-row">
          <span className="cbf-div"><span className="cbf-m">{fr(total)}</span><b className="cbf-m">÷ {litres ? `${frL(litres)} L` : '? L'}</b></span><span className="cbf-eq">=</span>
          <span className="cbf-big cbf-m" aria-label={litre ? `${fr(litre.affiche.complet)} CHF par litre` : 'Coût du litre inconnu'}>{litre ? fr(litre.affiche.complet) : '—'}</span>
          <span className="cbf-u">CHF/L<em>{litre ? `${emballageCompris ? 'emballage compris · ' : ''}estimé` : motifSansLitre === 'litres' ? 'litres nets à confirmer' : 'prix à compléter'}</em>{litre && horsRecette ? <em>sans houblon ni levure</em> : null}</span>
        </div>
      </div>}
    <div className="cbf-litw">
      <div className="cbf-litt">Ton litre, quand tu le paies</div>
      {parts
        ? <><div className="cbf-lit" data-booster="litre-trois-temps">{SRC.map((s, i) => <span key={s.id} style={{ flex: Math.max(parts[i], 0.001), background: s.c, opacity: selection && selection !== s.id ? 0.25 : 1 }} />)}</div>
          <div className="cbf-litl">{parts.map((v, i) => <span key={i} style={{ flex: Math.max(v / parts.reduce((a, b) => a + b, 0), 0.14) }}>{libelleParts[i]} <b className="cbf-m">{fr(v)}</b></span>)}</div></>
        : <><div className="cbf-lit cbf-lit-vide" aria-hidden="true" /><div className="cbf-litl"><span>—</span></div></>}
    </div>
    {children}
  </div>;
}
