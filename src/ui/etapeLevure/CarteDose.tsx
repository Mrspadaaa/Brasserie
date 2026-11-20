// La bande de dose de la carte Ma levure, telle que le brasseur l'a choisie (20.11) : au repos et au cas limite, r3 v05
// (forme r3 v05 : quantité et son mot, piste en sachets, trait du besoin de la recette, stock à droite ; le fabricant en second, sous la barre) ; juste après − / +, r4 v02 (« 151 % du besoin »,
// le besoin de la recette en trait noir au-dessus de la piste, l'excédent en vert, le manque hachuré en rouge, le remède « → N sachets »).
// Le besoin vient du moteur (`besoinDeLaLevure` : taux × volume × °P) ; rien n'est inventé : sans sachet connu, la piste reste en pointillé.
import { useEffect, useRef, useState } from 'react';
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
/** Le repère du fabricant sous la barre. Au-dessus de son haut, la carte dit lequel compte (critique du 20.11, n° 6) : le besoin de la recette quand
 * l'OG en demande plus (« au-dessus du fabricant 15–24 g : l'OG 1,066 en demande plus »), sinon la dose dépasse les deux. */
export function ligneFabricant(fab: NonNullable<BesoinLevure['fabricant']>, grammes?: number, besoinG?: number, sg?: number) {
  if (fab.borne || fab.max === undefined || grammes === undefined || grammes <= fab.max + 1e-9) return `fabricant ${conseilTexte(fab)}`;
  return besoinG !== undefined && besoinG > fab.max + 1e-9 && sg !== undefined
    ? `au-dessus du fabricant ${conseilTexte(fab)} : l’OG ${dec(sg, 3)} en demande plus` : `au-dessus du fabricant ${conseilTexte(fab)} et du besoin`;
}
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

export function BandeDose({ etat, qty, unite, besoin, stock, onPas, onEcrire, onOffre }: {
  etat: EtatDose;
  /** La quantité écrite dans la recette (dans `unite`), absente : « à choisir ». */
  qty?: number; unite: string;
  besoin?: BesoinLevure;
  stock: StockDose;
  /** − / + : la quantité suivante (jamais sous 1). */
  onPas: (next: number) => void;
  /** « Mettre N sachets », « → N sachets » : écrit N. */
  onEcrire: (n: number) => void;
  /** Le volet « Dose, ensemencement et starter » ; sans conseil (état libre), − / + ouvrent le champ grammes dans la carte (critique du 20.11, n° 3). */
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
  // Sans conseil (fiche absente, sachet inconnu), − / + ouvrent le champ de la dose dans la carte, prérempli ; ouvert, ils le montent ou le descendent
  // d'une unité. Jamais un geste sans effet (critique du 20.11, n° 3).
  const [champ, setChamp] = useState<string>();
  const champRef = useRef<HTMLInputElement>(null);
  const ouvert = libreGeste && champ !== undefined;
  useEffect(() => { if (ouvert) champRef.current?.focus(); }, [ouvert]);
  const lu = (t: string) => { const v = Number.parseFloat(t.replace(',', '.').trim()); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const pasLibre = (sens: 1 | -1) => {
    if (champ === undefined) { setChamp(qty !== undefined ? souple(qty) : ''); return; }
    const v = lu(champ);
    setChamp(souple(v === undefined ? (fab ? fab.min : 1) : Math.max(1, Math.round(v) + sens)));
  };
  const valider = () => { const v = lu(champ ?? ''); if (v === undefined) return; onEcrire(v); setChamp(undefined); };
  const motLibre = unite === 'g' ? 'grammes' : unite;
  const pasMot = unite === 'g' ? 'gramme' : unite;
  const moins = <button type="button" className="ml-pas" data-lv="moins" onClick={() => libreGeste ? pasLibre(-1) : qty !== undefined && qty > 1 && onPas(qty - 1)}
    disabled={!libreGeste && (qty === undefined || qty <= 1)}
    aria-label={libreGeste ? (ouvert ? `Descendre d’un ${pasMot}` : `Saisir la dose en ${motLibre}`) : qty !== undefined && qty > 1 ? `Descendre à ${dec(qty - 1)} ${motUnite(unite, qty - 1)}` : 'Dose au plus bas'}><Minus size={22} strokeWidth={2.4} aria-hidden="true" /></button>;
  const suivant = qty !== undefined ? Math.floor(qty + 1e-9) + 1 : 1;
  const plus = <button type="button" className="ml-pas" data-lv="plus" onClick={() => libreGeste ? pasLibre(1) : onPas(suivant)}
    aria-label={libreGeste ? (ouvert ? `Monter d’un ${pasMot}` : `Saisir la dose en ${motLibre}`) : `Monter à ${dec(suivant)} ${motUnite(unite, suivant)}`}><Plus size={22} strokeWidth={2.4} aria-hidden="true" /></button>;
  const grammes = qty !== undefined ? (unite === 'g' ? qty : sachet?.grammes !== undefined ? qty * sachet.grammes : undefined) : undefined;
  const grammesTexte = grammes !== undefined ? `${dec(grammes, entier(grammes) ? 0 : 1)} g` : undefined;
  const crans = Array.from({ length: max - 1 }, (_, i) => i + 1);
  const besoinG = besoin?.sachets !== undefined && sachet?.grammes !== undefined ? besoin.sachets * sachet.grammes : undefined;
  const fabTexte = fab && ligneFabricant(fab, grammes, besoinG, besoin?.sg);

  if (etat === 'apres' && qty !== undefined && besoin?.sachets !== undefined) {
    const part = Math.round(qty / besoin.sachets * 100);
    const mot = part < 100 ? 'sous' : part > 200 ? 'sur-dosé' : 'couvre';
    const b = besoin.sachets;
    const reperes = [fabTexte, `taux ${besoin.regime} ${souple(besoin.taux)} M/mL/°P`, `${dec(besoin.volumeL, entier(besoin.volumeL) ? 0 : 1)} L`,
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

  // Repos, à choisir, libre : la forme de r3 v05. Le repère dit le besoin de la recette (ML-DOSE, D-n du 20.11 : « combien j'ai besoin pour ma
  // recette ») ; le conseil du fabricant passe en second, dans le petit texte sous la barre (comme r4 v02). Sans besoin calculable, le repère
  // retombe sur le fabricant, dit comme tel.
  const b = besoin?.sachets;
  const repere = b !== undefined && unite !== 'g' ? { pos: b, txt: `besoin ${dec(b, 1)} ${motUnite(unite, b)}` }
    : fab && conseilSachets !== undefined ? { pos: conseilSachets, txt: `fabricant ${conseilTexte(fab)}` } : undefined;
  let mot: { txt: string; ok: boolean } | undefined;
  if (qty !== undefined && unite !== 'g' && b !== undefined) {
    const ecart = b - qty;
    mot = ecart <= 1e-9 ? { txt: 'couvre le besoin', ok: true } : { txt: `sous le besoin, +${dec(ecart, 1)} ${motUnite(unite, ecart)}`, ok: false };
  } else if (grammes !== undefined && besoinG !== undefined) {
    const ecart = besoinG - grammes;
    mot = ecart <= 1e-9 ? { txt: 'couvre le besoin', ok: true } : { txt: `sous le besoin, +${dec(ecart, entier(ecart) ? 0 : 1)} g`, ok: false };
  } else if (grammes !== undefined && fab) mot = grammes + 1e-9 >= fab.min ? { txt: 'couvre le fabricant', ok: true } : { txt: 'sous le fabricant', ok: false };
  const reperes = b !== undefined && besoin ? [fabTexte, `taux ${besoin.regime} ${souple(besoin.taux)} M/mL/°P`,
    `${dec(besoin.volumeL, entier(besoin.volumeL) ? 0 : 1)} L`, sachet?.poidsAConfirmer && sachet.grammes !== undefined && `sachet ${dec(sachet.grammes, 1)} g à confirmer`]
    .filter(Boolean).join(' · ') : undefined;
  const vide = etat !== 'repos';

  return <div className="ml-dose" data-lv="bande-dose" data-etat={etat}>
    <div className="ml-part">
      {etat === 'repos' && <>{grammesTexte && <><span className="ml-g ml-m">{grammesTexte}</span>{mot && <span className="ml-g">·</span>}</>}
        {mot && <span className="ml-partmot" data-ok={mot.ok}>{mot.txt}</span>}</>}
      {etat === 'a-choisir' && <span className="ml-g">aucune dose écrite</span>}
      {etat === 'libre' && (qty !== undefined && grammesTexte
        ? <><span className="ml-g ml-m">{grammesTexte}</span>{mot && <><span className="ml-g">·</span><span className="ml-partmot" data-ok={mot.ok}>{mot.txt}</span></>}</>
        : <span className="ml-g">{fab ? `fabricant ${conseilTexte(fab)} · sachet inconnu` : 'pas de conseil · fiche absente'}</span>)}
      <span className="ml-esp" />
      {etat === 'a-choisir' && auChoix !== undefined && <button type="button" className="ml-mettre" data-lv="mettre" onClick={() => onEcrire(auChoix)}>Mettre {dec(auChoix)} {motUnite(unite, auChoix)}</button>}
      <PuceStock qty={etat === 'repos' ? qty : undefined} stock={stock} apres={false} onOffre={onOffre} />
    </div>
    <div className="ml-regle">
      {moins}
      {ouvert ? <form className="ml-champg" data-lv="champ-grammes" onSubmit={e => { e.preventDefault(); valider(); }}>
        <input ref={champRef} type="text" data-lv="grammes" inputMode="decimal" enterKeyHint="done" autoComplete="off" className="ml-m" value={champ}
          aria-label={`Dose en ${motLibre}`} aria-invalid={(champ !== '' && lu(champ!) === undefined) || undefined} placeholder={fab ? `≥ ${dec(fab.min)}` : motLibre}
          onChange={e => setChamp(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setChamp(undefined); }} />
        <span className="ml-g">{unite}</span>
        <button type="submit" className="ml-ok" disabled={lu(champ!) === undefined}>OK</button>
      </form> : <span className="ml-pistebloc">
        <span className={`ml-piste${vide ? ' ml-vide' : ''}`} role="img"
          aria-label={etat === 'repos' && qty !== undefined ? `${dec(qty)} ${motUnite(unite, qty)} sur une échelle de 0 à ${max}` : etat === 'libre' ? 'aucun repère en sachets' : `aucune dose écrite, échelle de 0 à ${max} ${unitePl}`}>
          {etat === 'repos' && qty !== undefined && <i className="ml-rempli" style={{ width: pc(qty, max) }} />}
          {etat !== 'libre' && crans.map(i => <i key={i} className="ml-cran" style={{ left: pc(i, max) }} />)}
          {etat !== 'libre' && repere && <i className="ml-conseilmark" style={{ left: pc(repere.pos, max) }} />}
          {etat === 'repos' && qty !== undefined && <i className="ml-poignee" style={{ left: pc(qty, max) }} />}
        </span>
        <span className="ml-bornes" aria-hidden="true">
          {etat === 'libre'
            ? <><span className="d">{qty !== undefined ? `${motLibre}, saisis` : `${motLibre}, à saisir`}</span><span className="f">pas de repère</span></>
            : <><span className="d ml-m">0</span>
              {repere && <span className="c" style={{ left: `${borne(repere.pos / max * 100, 30, 70)}%` }}>{repere.txt}</span>}
              <span className="f ml-m">{max} ›</span></>}
        </span>
      </span>}
      {plus}
    </div>
    {etat !== 'libre' && reperes && <div className="ml-reperes" data-lv="reperes">{reperes}</div>}
  </div>;
}

/** La conduite en une ligne (r3 v05) : un mini graphe en marches (chaud orange, froid bleu), « 19 °C · 7 j → 4 °C · 8 j », « fin J15 ». */
export function LigneConduite({ paliers, mot, onToucher }: { paliers: ReadonlyArray<{ tempC: number; days: number }>; mot: boolean; onToucher: () => void }) {
  // Deux paliers de suite à la même température se lisent en un (r3 v05 : « 19 °C · 7 j → 4 °C · 8 j ») : la ligne tient à 390.
  const ok = paliers.filter(p => Number.isFinite(p.tempC) && Number.isFinite(p.days) && p.days > 0)
    .reduce<{ tempC: number; days: number }[]>((acc, p) => { const d = acc[acc.length - 1]; if (d && d.tempC === p.tempC) d.days += p.days; else acc.push({ tempC: p.tempC, days: p.days }); return acc; }, []);
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
