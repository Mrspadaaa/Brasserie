// La bande de dose de la carte Ma levure, telle que le brasseur l'a choisie (20.11) : au repos et au cas limite, r3 v05
// (« 23 g · couvre le conseil », piste en sachets, trait du conseil, stock à droite) ; juste après − / +, r4 v02 (« 151 % du besoin »,
// le besoin de la recette en trait noir au-dessus de la piste, l'excédent en vert, le manque hachuré en rouge, le remède « → N sachets »).
// Le besoin vient du moteur (`besoinDeLaLevure` : taux × volume × °P) ; rien n'est inventé : sans sachet connu, la piste reste en pointillé.
import { Box, Minus, Plus } from 'lucide-react';
import type { BesoinLevure } from './dose';

const dec = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
/** 1,5 → « 1,5 » ; 0,75 → « 0,75 » ; 2 → « 2 ». */
const souple = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const entier = (n: number) => Math.abs(n - Math.round(n)) < 1e-9;
const borne = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pc = (v: number, max: number) => `${borne(v / max * 100, 0, 100)}%`;

export type EtatDose = 'repos' | 'apres' | 'a-choisir' | 'libre';
export interface StockDose { n: number; trouve: boolean }

/** Le conseil du fabricant en mots : « ≥ 15 g », « 15–24 g ». */
export const conseilTexte = (f: NonNullable<BesoinLevure['fabricant']>) =>
  f.borne || f.max === undefined || f.max === f.min ? `${f.borne ? '≥ ' : ''}${dec(f.min)} g` : `${dec(f.min)}–${dec(f.max)} g`;
/** « sachet » / « sachets », « pack » / « packs ». */
export const motUnite = (unite: string, n: number) => (unite === 'sachet' || unite === 'pack') && n >= 2 ? `${unite}s` : unite;

/** Ce que dit le stock à droite de la dose : « manque N » (un toucher ouvre l'offre), sinon le cube seul. */
function PuceStock({ qty, stock, apres, onOffre }: { qty?: number; stock: StockDose; apres: boolean; onOffre: () => void }) {
  const manque = qty !== undefined ? Math.ceil(qty - stock.n - 1e-9) : 0;
  if (manque > 0) return <button type="button" className={`ml-manque${apres ? ' ml-achat' : ''}`} data-lv="manque" onClick={onOffre}
    aria-label={`Il manque ${manque} en stock (${dec(stock.n)} en stock) : ouvrir l’offre`}><Box size={17} aria-hidden="true" />manque {dec(manque)}</button>;
  const etat = qty === undefined ? (stock.n > 0 ? 'neutre' : 'vide') : 'ok';
  return <span className="ml-enstock" data-lv="stock" data-stock={etat} role="img" aria-label={stock.n > 0 ? `${dec(stock.n)} en stock` : 'pas en stock'}><Box size={17} aria-hidden="true" /></span>;
}

export function BandeDose({ etat, qty, unite, besoin, stock, onPas, onEcrire, onDose, onOffre }: {
  etat: EtatDose;
  /** La quantité écrite dans la recette (dans `unite`), absente : « à choisir ». */
  qty?: number; unite: string;
  besoin?: BesoinLevure;
  stock: StockDose;
  /** − / + : la quantité suivante (jamais sous 1). */
  onPas: (next: number) => void;
  /** « Mettre N sachets », « → N sachets » : écrit N. */
  onEcrire: (n: number) => void;
  /** Le volet « Dose, ensemencement et starter » (saisie en grammes, ensemencement, starter). */
  onDose?: () => void;
  onOffre: () => void;
}) {
  const sachet = besoin?.sachet;
  const fab = besoin?.fabricant;
  const conseilSachets = fab && sachet?.grammes ? fab.min / sachet.grammes : undefined;
  const auChoix = besoin?.sachets !== undefined ? Math.max(1, Math.ceil(besoin.sachets - 1e-9)) : besoin?.sachetsFabricant;
  const max = Math.max(4, Math.ceil(Math.max(qty ?? 0, besoin?.sachets ?? 0, conseilSachets ?? 0) - 1e-9) + 1);
  const unitePl = motUnite(unite, 2);
  const libreGeste = etat === 'libre';
  const moins = <button type="button" className="ml-pas" data-lv="moins" onClick={() => libreGeste ? onDose?.() : qty !== undefined && qty > 1 && onPas(qty - 1)}
    disabled={!libreGeste && (qty === undefined || qty <= 1)}
    aria-label={libreGeste ? 'Régler la dose en grammes' : qty !== undefined && qty > 1 ? `Descendre à ${dec(qty - 1)} ${motUnite(unite, qty - 1)}` : 'Dose au plus bas'}><Minus size={22} strokeWidth={2.4} aria-hidden="true" /></button>;
  const suivant = qty !== undefined ? Math.floor(qty + 1e-9) + 1 : 1;
  const plus = <button type="button" className="ml-pas" data-lv="plus" onClick={() => libreGeste ? onDose?.() : onPas(suivant)}
    aria-label={libreGeste ? 'Régler la dose en grammes' : `Monter à ${dec(suivant)} ${motUnite(unite, suivant)}`}><Plus size={22} strokeWidth={2.4} aria-hidden="true" /></button>;
  const grammes = qty !== undefined ? (unite === 'g' ? qty : sachet?.grammes !== undefined ? qty * sachet.grammes : undefined) : undefined;
  const grammesTexte = grammes !== undefined ? `${dec(grammes, entier(grammes) ? 0 : 1)} g` : undefined;
  const crans = Array.from({ length: max - 1 }, (_, i) => i + 1);

  if (etat === 'apres' && qty !== undefined && besoin?.sachets !== undefined) {
    const part = Math.round(qty / besoin.sachets * 100);
    const mot = part < 100 ? 'sous' : part > 200 ? 'sur-dosé' : 'couvre';
    const b = besoin.sachets;
    const reperes = [fab && `fabricant ${conseilTexte(fab)}`, `taux ${besoin.regime} ${souple(besoin.taux)} M/mL/°P`, `${dec(besoin.volumeL, entier(besoin.volumeL) ? 0 : 1)} L`,
      sachet?.poidsAConfirmer && sachet.grammes !== undefined && `sachet ${dec(sachet.grammes, 1)} g à confirmer`].filter(Boolean).join(' · ');
    return <div className="ml-dose" data-lv="bande-dose" data-etat="apres">
      <div className="ml-verdict">
        <span className="ml-pc" data-sous={part < 100 || undefined}>{dec(part)} %</span><span className="ml-ty">du besoin</span>
        <span className="ml-mot" data-mot={mot}>{mot}</span><span className="ml-esp" />
        {part < 100 && auChoix !== undefined
          ? <button type="button" className="ml-remede" data-lv="remede" onClick={() => onEcrire(auChoix)}>→ {dec(auChoix)} {motUnite(unite, auChoix)}</button>
          : <PuceStock qty={qty} stock={stock} apres onOffre={onOffre} />}
      </div>
      <div className="ml-regle ml-regle-apres">
        {moins}
        <span className="ml-pistebloc ml-pb-apres">
          <span className="ml-blab" style={{ left: `${borne(b / max * 100, 16, 84)}%` }}>besoin {besoin.regime} {dec(b, 1)}</span>
          <span className="ml-piste3" role="img" aria-label={`${dec(qty)} ${motUnite(unite, qty)} pour un besoin de ${dec(b, 1)} : ${dec(part)} %`}>
            <i className="ml-r-or" style={{ left: 0, width: pc(Math.min(qty, b), max) }} />
            {qty > b && <i className="ml-r-plus" style={{ left: pc(b, max), width: pc(qty - b, max) }} />}
            {qty < b && <i className="ml-r-manque" style={{ left: pc(qty, max), width: pc(b - qty, max) }} />}
            <i className="ml-besoin" style={{ left: pc(b, max) }} />
            <i className="ml-poignee" style={{ left: pc(qty, max) }} />
          </span>
          <span className="ml-ticks" aria-hidden="true">{Array.from({ length: max + 1 }, (_, i) => <i key={i} style={{ left: pc(i, max) }} />)}</span>
          <span className="ml-grad" aria-hidden="true">{Array.from({ length: max + 1 }, (_, i) => {
            const sel = entier(qty) && i === qty;
            const cls = i === 0 ? 'd' : i === max ? 'f' : 'm';
            return <span key={i} className={`${cls}${sel ? ' sel' : ''}`} style={{ left: pc(i, max) }}>{sel ? `${dec(i)}${grammesTexte ? ` · ${grammesTexte}` : ''}` : dec(i)}</span>;
          })}</span>
        </span>
        {plus}
      </div>
      <div className="ml-reperes">{reperes}</div>
    </div>;
  }

  // Repos, à choisir, libre : r3 v05.
  const repere = fab ? (conseilSachets !== undefined ? { pos: conseilSachets, txt: `${conseilTexte(fab)} conseillé` } : undefined)
    : besoin?.sachets !== undefined ? { pos: besoin.sachets, txt: `besoin ${dec(besoin.sachets, 1)}` } : undefined;
  let mot: { txt: string; ok: boolean } | undefined;
  if (qty !== undefined && grammes !== undefined && fab) mot = grammes + 1e-9 >= fab.min ? { txt: 'couvre le conseil', ok: true } : { txt: 'sous le conseil', ok: false };
  else if (qty !== undefined && unite !== 'g' && besoin?.sachets !== undefined) mot = qty + 1e-9 >= besoin.sachets ? { txt: 'couvre le besoin', ok: true } : { txt: 'sous le besoin', ok: false };
  const vide = etat !== 'repos';

  return <div className="ml-dose" data-lv="bande-dose" data-etat={etat}>
    <div className="ml-part">
      {etat === 'repos' && <>{grammesTexte && <><span className="ml-g ml-m">{grammesTexte}</span>{mot && <span className="ml-g">·</span>}</>}
        {mot && <span className="ml-partmot" data-ok={mot.ok}>{mot.txt}</span>}</>}
      {etat === 'a-choisir' && <span className="ml-g">aucune dose écrite</span>}
      {etat === 'libre' && (qty !== undefined && grammesTexte
        ? <><span className="ml-g ml-m">{grammesTexte}</span>{mot && <><span className="ml-g">·</span><span className="ml-partmot" data-ok={mot.ok}>{mot.txt}</span></>}</>
        : <span className="ml-g">{fab ? `${conseilTexte(fab)} conseillé · sachet inconnu` : 'pas de conseil · fiche absente'}</span>)}
      <span className="ml-esp" />
      {etat === 'a-choisir' && auChoix !== undefined && <button type="button" className="ml-mettre" data-lv="mettre" onClick={() => onEcrire(auChoix)}>Mettre {dec(auChoix)} {motUnite(unite, auChoix)}</button>}
      <PuceStock qty={etat === 'repos' ? qty : undefined} stock={stock} apres={false} onOffre={onOffre} />
    </div>
    <div className="ml-regle">
      {moins}
      <span className="ml-pistebloc">
        <span className={`ml-piste${vide ? ' ml-vide' : ''}`} role="img"
          aria-label={etat === 'repos' && qty !== undefined ? `${dec(qty)} ${motUnite(unite, qty)} sur une échelle de 0 à ${max}` : etat === 'libre' ? 'aucun repère en sachets' : `aucune dose écrite, échelle de 0 à ${max} ${unitePl}`}>
          {etat === 'repos' && qty !== undefined && <i className="ml-rempli" style={{ width: pc(qty, max) }} />}
          {etat !== 'libre' && crans.map(i => <i key={i} className="ml-cran" style={{ left: pc(i, max) }} />)}
          {etat !== 'libre' && repere && <i className="ml-conseilmark" style={{ left: pc(repere.pos, max) }} />}
          {etat === 'repos' && qty !== undefined && <i className="ml-poignee" style={{ left: pc(qty, max) }} />}
        </span>
        <span className="ml-bornes" aria-hidden="true">
          {etat === 'libre'
            ? <><span className="d">grammes, à saisir</span><span className="f">pas de repère</span></>
            : <><span className="d ml-m">0</span>
              {repere && <span className="c" style={{ left: `${borne(repere.pos / max * 100, 30, 70)}%` }}>{repere.txt}</span>}
              <span className="f ml-m">{max} ›</span></>}
        </span>
      </span>
      {plus}
    </div>
  </div>;
}

/** La conduite en une ligne (r3 v05) : un mini graphe en marches (chaud orange, froid bleu), « 19 °C · 7 j → 4 °C · 8 j », « fin J15 ». */
export function LigneConduite({ paliers, mot, onToucher }: { paliers: ReadonlyArray<{ tempC: number; days: number }>; mot: boolean; onToucher: () => void }) {
  const ok = paliers.filter(p => Number.isFinite(p.tempC) && Number.isFinite(p.days) && p.days > 0);
  if (!ok.length) return null;
  const total = ok.reduce((s, p) => s + p.days, 0);
  const tMin = Math.min(0, ...ok.map(p => p.tempC)), tMax = Math.max(24, ...ok.map(p => p.tempC));
  const y = (t: number) => 2 + (1 - (t - tMin) / (tMax - tMin)) * 15;
  let x = 1;
  const marches = ok.map(p => { const w = Math.max(3, p.days / total * 52); const r = { x, w, y: y(p.tempC), chaud: p.tempC >= 10 }; x += w; return r; });
  const trait = marches.map((m, i) => `${i ? 'L' : 'M'}${m.x.toFixed(1)} ${m.y.toFixed(1)} L${(m.x + m.w).toFixed(1)} ${m.y.toFixed(1)}`).join(' ');
  const texte = ok.map(p => `${dec(p.tempC, entier(p.tempC) ? 0 : 1)} °C · ${dec(p.days, entier(p.days) ? 0 : 1)} j`);
  return <button type="button" className="ml-conduite" data-lv="ligne-conduite" onClick={onToucher}
    aria-label={`Conduite : ${texte.join(', puis ')} ; fin au jour ${dec(total)}. Toucher pour régler la conduite`}>
    {mot && <span className="ml-cmot">conduite</span>}
    <svg width="54" height="22" viewBox="0 0 54 22" aria-hidden="true">
      {marches.map((m, i) => <rect key={i} x={m.x} y={m.y} width={m.w} height={4} fill={m.chaud ? '#E7A070' : '#86B9E6'} />)}
      <path d={trait} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
    <span className="ml-m ml-ctx">{texte.map((t, i) => <span key={i}>{i > 0 && <span className="ml-g"> → </span>}{t}</span>)}</span>
    <span className="ml-esp" /><span className="ml-g">fin J{dec(total)}</span>
  </button>;
}
