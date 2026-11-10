import React from 'react';
import { Sparkles } from 'lucide-react';
import { Piste } from './Tete';
import { escalierMateriel, inventairesParNature, LIBELLE_NATURE, justificatifs, moisNotes, natureDuStock, perteAvantStock, plansManquants, plateaux, pontCaisse, propositionsInventaire, valeurEstimee, type Escalier } from './calculs';
import { montant } from '../previsions/format';
import { nombreFr } from '../../../domain/nombreAffiche';
import type { StockItem } from '../../../types';
import { versInventaireCloture, type Ctx } from './ctx';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Tête commune des neuf étapes : retour, titre, piste, question, terme au second plan, action noire en bas. */
export function Cadre({ n, c, question, terme, children, bas }: { n: number; c: Ctx; question: string; terme: string; children: React.ReactNode; bas: React.ReactNode }) {
  return <div className="ann-etape" data-etape={n}>
    <div className="ann-sh"><button type="button" className="ann-back" onClick={() => c.act.aller(0)}>Annuel</button><b>Clôture {c.year}</b><span className="ann-m">{n} / 9</span></div>
    <Piste etapes={c.etapes} ici={n} onGo={c.act.aller}/>
    {c.gele && <p className="ann-gele">Version figée : lecture seule. Pour corriger, crée une nouvelle version depuis l’étape 9.</p>}
    {c.perimees && n === 7 && <p className="ann-gele" role="status">Les comptes ont changé depuis ta dernière relecture : les vérifications sont à refaire.</p>}
    <h3 className="ann-q">{question}</h3>
    <p className="ann-terme">terme : {terme}</p>
    {children}
    <div className="ann-fin">{bas}</div>
  </div>;
}
export const Etoile = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => <button type="button" className="ann-ia" onClick={onClick}><Sparkles size={15} aria-hidden="true"/>{children}</button>;

/* ---------- 1 · Opérations ---------- */
export function Etape1({ c }: { c: Ctx }) {
  const cases = moisNotes(c.report.documents ?? [], c.year, c.today), j = justificatifs(c.report.documents ?? []);
  const vides = cases.filter(m => m.etat === 'vide'), plans = plansManquants(c.plans, c.transactions, c.year, c.today);
  const plage = vides.length ? (vides.length === 1 ? MOIS[vides[0].mois - 1] : `${MOIS[vides[0].mois - 1]} à ${MOIS[vides[vides.length - 1].mois - 1]}`) : '';
  return <Cadre n={1} c={c} question="Tout est noté ?" terme="opérations et justificatifs"
    bas={<><Etoile onClick={() => c.act.assistant('Cherche les oublis dans mes opérations de ' + c.year + ' : mois sans écriture, charges récurrentes manquantes, justificatifs absents. Cite les opérations concernées, sans rien modifier.')}>Chercher les oublis</Etoile>
      <button type="button" className="ann-pri" disabled={c.gele} onClick={() => { c.act.ecrire(t => { t.reviews = { ...t.reviews, journal: true }; }); c.act.aller(2); }}>Tout est noté</button></>}>
    <div className="ann-mois" aria-label="Opérations notées par mois">{cases.map(m => m.etat === 'vide'
      ? <button type="button" key={m.mois} className="ann-mo q ann-hachA" aria-label={`${MOIS[m.mois - 1]} : rien noté, ouvrir ce mois dans les opérations`} onClick={() => c.act.onOperations({ scope: 'current', month: `${c.year}-${String(m.mois).padStart(2, '0')}`, allDates: false })}><small>{MOIS[m.mois - 1]}</small><span className="ann-m">?</span></button>
      : <div key={m.mois} className={`ann-mo${m.etat === 'avenir' ? ' av' : ''}`}><small>{MOIS[m.mois - 1]}</small>{m.etat === 'avenir' ? <span className="ann-avenir">à venir</span> : <span className="ann-m">{m.n}</span>}</div>)}</div>
    <p className="ann-terme">opérations notées par mois</p>
    <div className="ann-lst">
      {vides.length > 0 && <div className="ann-it"><span className="ann-dot att"/><span className="ann-t">{plage} : rien noté<small>vraiment rien acheté ni vendu ? Si c’est vraiment vide, coche « Tout est noté ».</small></span></div>}
      {plans.map(p => <div key={p.planId} className="ann-it"><span className="ann-dot att"/><span className="ann-t">{p.titre} : {p.notes} mois noté{p.notes > 1 ? 's' : ''} sur {p.attendus}<small><span className="ann-m">{montant(p.amountCents)}</span> chaque mois, prévu</small></span><button type="button" onClick={() => c.act.onOperations({ scope: 'all', year: String(c.year), allDates: true, filter: 'review' })}>Ajouter</button></div>)}
      <div className="ann-it"><span className={`ann-dot ${j.avec < j.requis ? 'att' : 'ok'}`}/><span className="ann-t">Justificatifs<small><span className="ann-m">{j.avec} / {j.requis}</span> joints</small></span>{j.avec < j.requis && <button type="button" onClick={() => c.act.onOperations({ scope: 'all', year: String(c.year), allDates: true, filter: 'proof' })}>Joindre</button>}</div>
    </div>
  </Cadre>;
}

/* ---------- 2 · Solde d'ouverture ---------- */
function PontSvg({ p, year }: { p: NonNullable<ReturnType<typeof pontCaisse>>; year: number }) {
  const sommet = p.ouvertureCents + p.recuCents, plancher = Math.max(0, Math.floor(Math.min(p.ouvertureCents, p.finCents) * 0.85 / 10000) * 10000), etendue = Math.max(1, sommet - plancher), px = (cents: number) => 200 * (cents - plancher) / etendue;
  const y = (cents: number) => 226 - px(cents);
  const barre = (x: number, w: number, haut: number, bas: number, fill: string) => <rect x={x} y={y(haut)} width={w} height={Math.max(1, px(haut) - px(bas))} rx={6} fill={fill}/>;
  return <svg className="ann-svg" role="img" viewBox="0 0 370 250" aria-label={`${montant(p.ouvertureCents)} au 1er janvier, plus ${montant(p.recuCents)} entrés, moins ${montant(p.payeCents)} payés, égale ${montant(p.finCents)}`}>
    <line x1="0" y1="226" x2="370" y2="226" stroke="currentColor"/><path d="M0,232 l6,-6 l6,6 l6,-6" stroke="#999" fill="none"/>
    <text x="24" y="242" fontSize="12" fill="currentColor" opacity=".7">axe coupé à {nombreFr(plancher / 100, 0)}</text>
    {barre(8, 72, p.ouvertureCents, plancher, '#86B9E6')}<text x="44" y={y(p.ouvertureCents) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" className="ann-m">{montant(p.ouvertureCents)}</text>
    <text x="44" y="216" textAnchor="middle" fontSize="12" fill="#0E2A5E">{p.ouvertureLe1er ? '1er janv.' : 'ouverture'}</text>
    {barre(100, 72, sommet, p.ouvertureCents, '#56D27B')}<text x="136" y={y(sommet) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="#2F6B22" className="ann-m">+{montant(p.recuCents)}</text><text x="136" y={y(sommet) + 40} textAnchor="middle" fontSize="12" fill="#123d1f">entré</text>
    {barre(192, 72, sommet, p.finCents, '#A7A7A7')}<text x="228" y={y(p.finCents) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" className="ann-m">−{montant(p.payeCents)}</text><text x="228" y={y(sommet) + 28} textAnchor="middle" fontSize="12" fill="#1b1b1b">payé</text>
    {barre(284, 80, p.finCents, plancher, '#1F64A3')}<text x="324" y={y(p.finCents) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" className="ann-m">{montant(p.finCents)}</text><text x="324" y="216" textAnchor="middle" fontSize="12" fill="#fff">{c0(year)}</text>
  </svg>;
}
const c0 = (year: number) => (year === new Date().getFullYear() ? 'aujourd’hui' : '31 déc.');
export function Etape2({ c }: { c: Ctx }) {
  const o = c.profile.openingCash, p = pontCaisse(c.profile, c.report, c.year), [reponse, setReponse] = React.useState<'oui' | 'non'>('oui');
  return <Cadre n={2} c={c} question="Avec combien as-tu commencé l’année ?" terme="solde d’ouverture"
    bas={<button type="button" className="ann-pri" onClick={() => c.act.aller(3)}>C’est juste</button>}>
    {o ? <div className={`ann-ok${o.confirmed ? '' : ' att'}`}><span className="ann-t">En caisse au {p?.ouvertureLe1er === false ? o.date : `1er janv. ${c.year}`}<span className="ann-m ann-big">{montant(o.amountCents)} CHF</span></span>{o.confirmed ? <span className="ann-pa ok">confirmé</span> : <button type="button" className="ann-pa at" aria-label="Confirmer le solde d’ouverture : sans confirmation, il n’entre pas dans la caisse" onClick={c.act.onProfile}>à confirmer</button>}</div>
      : <div className="ann-ok att"><span className="ann-t">Solde d’ouverture<button type="button" className="ann-q-btn ann-m ann-big" aria-label="Renseigner le solde d’ouverture" onClick={c.act.onProfile}>?</button><small>sans lui, pas de pont de caisse</small></span><button type="button" className="ann-btn" onClick={c.act.onProfile}>Renseigner le solde</button></div>}
    {p && p.coherent && <PontSvg p={p} year={c.year}/>}
    {p && !p.coherent && <p className="ann-terme">Le calcul de la caisse ne part pas d’un solde du 1er janvier : pas de pont dessiné ({montant(p.finCents)} au {c.anneeCourante ? 'jour' : '31 déc.'}).</p>}
    {o && <><p className="ann-qq">Ta banque dit la même chose{c.anneeCourante ? ' aujourd’hui' : ' au 31 déc.'} ?</p>
      <div className="ann-choix" role="group" aria-label="Ta banque dit la même chose ?">
        <button type="button" className={`ann-ch${reponse === 'oui' ? ' on' : ''}`} aria-pressed={reponse === 'oui'} onClick={() => setReponse('oui')}><b>Oui</b>{p && <span className="ann-m">{montant(p.finCents)}</span>}</button>
        <button type="button" className={`ann-ch${reponse === 'non' ? ' on' : ''}`} aria-pressed={reponse === 'non'} onClick={() => { setReponse('non'); c.act.onProfile(); }}><b>Non, corriger</b><span>relevé du jour</span></button>
      </div></>}
    {!c.anneeCourante && <button type="button" className="ann-btn" onClick={() => c.act.feuille('balance')}>Saisir le solde du 31 déc.</button>}
  </Cadre>;
}

/* ---------- 3 · Inventaires ---------- */
type NatureCase = 'malt' | 'houblons' | 'emballages' | 'biere';
const ICONES: Record<NatureCase, { couleur: string; d: string[] }> = {
  malt: { couleur: '#B08A2E', d: ['M12 3v18M12 7c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zm0 5c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zm0 5c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z'] },
  houblons: { couleur: '#4C6B2A', d: ['M12 3c4 3 5 7 3 11-1 2-2 3-3 3s-2-1-3-3c-2-4-1-8 3-11z', 'M12 7v10'] },
  emballages: { couleur: '#1F64A3', d: ['M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z'] },
  biere: { couleur: '#9A4F1E', d: ['M6 7h10v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', 'M16 10h2a2 2 0 0 1 0 4h-2'] },
};
const IcNature = ({ nature }: { nature: string }) => { const i = ICONES[nature as NatureCase]; return i ? <svg className="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={i.couleur} strokeWidth="1.8" aria-hidden="true">{i.d.map(d => <path key={d} d={d}/>)}</svg> : <span className="ic" aria-hidden="true"/>; };
export function Etape3({ c }: { c: Ctx }) {
  const lignes = inventairesParNature(c.closing, c.stockItems);
  const natureStock = (s: StockItem) => natureDuStock(s, c.stockItems);
  /** Les articles de cette nature réellement en stock, les plus gros d'abord : un article à 0 n'est ni listé ni estimé. */
  const enStock = (nature: string) => c.stockItems.filter(s => natureStock(s) === nature && s.currentStock > 0).sort((a, b) => b.currentStock - a.currentStock);
  const quantite = (s: StockItem) => `${nombreFr(s.currentStock, 1)} ${s.unit}`;
  const estimeParNature = (nature: string) => {
    const items = enStock(nature), e = items.map(i => valeurEstimee(i, c.transactions, c.year, c.today));
    return items.length > 0 && e.every(x => x) ? { cents: e.reduce((n, x) => n + x!.cents, 0), n: items.length, quantite: items.length === 1 ? quantite(items[0]) : '', detail: items.map((i, k) => `${quantite(i)} de ${i.name} (${e[k]!.source})`).join(' ; ') } : null;
  };
  const estimes = (['malt', 'houblons', 'emballages'] as const).flatMap(n => { const e = estimeParNature(n); return e ? [{ nature: n, ...e }] : []; });
  const propositionsDe = (nature?: string) => propositionsInventaire(c.stockItems, c.transactions, c.year, c.today, nature as NatureCase | undefined);
  const lotCave = c.batches.find(b => b.status === 'conditionne' && (b.volumePackagedL ?? 0) > 0);
  /** UNE petite ligne par nature (g6) : les deux plus gros, puis « +N » ; « aujourd’hui » une seule fois, jamais coupé. */
  const petite = (nature: string) => {
    if (nature === 'biere') return lotCave ? { texte: `${lotCave.name}, ${nombreFr(lotCave.volumePackagedL ?? 0, 0)} L nets`, fin: '' } : null;
    const items = enStock(nature);
    if (!items.length) return null;
    const reste = items.length - 2, deux = items.slice(0, 2);
    return { texte: (nature === 'emballages' ? deux.map(s => s.name) : deux.map(s => `${s.name} ${quantite(s)}`)).join(', '), fin: [reste > 0 ? `+${reste}` : '', nature === 'emballages' ? '' : 'aujourd’hui'].filter(Boolean).join(' ') };
  };
  const ouvrir = (nature: string, cote: 'openingInventory' | 'closingInventory') => {
    const visee = nature === 'autres' ? undefined : nature as NatureCase;
    /* Le stock d'aujourd'hui n'est ni celui du 1er janvier ni celui d'une année passée : on ne le propose que pour la clôture de l'exercice en cours. */
    c.act.onInventories({ cote, nature: visee, ...(cote === 'closingInventory' && c.anneeCourante && visee && visee !== 'biere' ? { proposer: true, propositions: propositionsDe(visee) } : {}) });
  };
  return <Cadre n={3} c={c} question="Qu’avais-tu en stock, au début et à la fin ?" terme="inventaires d’ouverture et de clôture"
    bas={<><Etoile onClick={() => c.act.onInventories({ cote: 'closingInventory', proposer: true, propositions: propositionsDe() })}>Proposer depuis le stock</Etoile>
      <button type="button" className="ann-pri" disabled={c.gele} onClick={() => c.act.onInventories({ cote: 'closingInventory', propositions: propositionsDe() })}>Noter l’inventaire</button></>}>
    <div className="ann-inv"><span className="h">CHF</span><span className="h">1er janv.</span><span className="h">31 déc.</span>
      {lignes.map(l => {
        const est = estimes.find(e => e.nature === l.nature), p = petite(l.nature);
        const cell = (x: typeof l.ouverture, cote: 'openingInventory' | 'closingInventory') => {
          if (x.cents != null) return <span className={`c p${x.aucuneLigne ? ' zero' : ''}`}>{montant(x.cents)}{x.aucuneLigne && <small>aucune ligne</small>}</span>;
          const nom = `Noter ${l.libelle} au ${cote === 'openingInventory' ? '1er janv.' : '31 déc.'}`;
          return est && cote === 'closingInventory'
            ? <button type="button" className="c p est" aria-label={nom} aria-describedby={`ann-est-${est.nature}`} disabled={c.gele} onClick={() => ouvrir(l.nature, cote)}>≈ {montant(est.cents)}</button>
            : <button type="button" className="c ann-hachA" aria-label={nom} disabled={c.gele} onClick={() => ouvrir(l.nature, cote)}>?</button>;
        };
        return <React.Fragment key={l.nature}><span className="n"><IcNature nature={l.nature}/><span className="nt">{l.libelle}{p && <small className="l"><span className="e">{p.texte}</span>{p.fin && <>{' '}<span className="s">{p.fin}</span></>}</small>}</span></span>{cell(l.ouverture, 'openingInventory')}{cell(l.cloture, 'closingInventory')}</React.Fragment>;
      })}
    </div>
    <div className="ann-var"><span className="ann-t">Ce que le stock a changé corrige la perte de <span className="ann-m">{montant(perteAvantStock(c.report))}</span></span>{c.report.inventoryChangeCents == null ? <button type="button" className="ann-pa at" disabled={c.gele} aria-label="Compter le stock au 31 déc. : sans lui, la perte reste avant stock" onClick={() => versInventaireCloture(c)}>à compter</button> : <span className="ann-pa ok">{`compté ${c.report.inventoryChangeCents > 0 ? '+' : ''}${montant(c.report.inventoryChangeCents)}`}</span>}</div>
    {estimes.map(e => <p key={e.nature} id={`ann-est-${e.nature}`} className="ann-terme" title={e.detail}>{`${estimes.length > 1 ? `${LIBELLE_NATURE[e.nature]} ` : ''}≈ ${montant(e.cents)} : ${e.n === 1 ? `${e.quantite} au prix de la dernière facture` : `${e.n} articles au prix de leur dernière facture`}, estimé`}</p>)}
  </Cadre>;
}

/* ---------- 4 · Matériel et usure ---------- */
function EscalierSvg({ e, year }: { e: Escalier; year: number }) {
  const px = (cents: number) => 170 * cents / Math.max(1, e.achatCents), y = (cents: number) => 200 - px(cents), usureH = px(e.usureCents);
  return <svg className="ann-svg" role="img" viewBox="0 0 370 236" aria-label={`${e.nom} : ${montant(e.achatCents)} à l’achat, ${montant(e.ouvertureCents)} au 1er janvier ${year}, ${montant(e.clotureCents)} au 31 décembre, usure ${montant(e.usureCents)}`}>
    <defs><pattern id="ann-hb" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="#DCE6FA"/><rect width="3.5" height="8" fill="#567BD2"/></pattern></defs>
    <line x1="0" y1="200" x2="370" y2="200" stroke="currentColor"/>
    <rect x="6" y={y(e.achatCents)} width="78" height={px(e.achatCents)} rx="6" fill="#C9D7F4"/><text x="45" y={y(e.achatCents) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" className="ann-m">{montant(e.achatCents)}</text><text x="45" y="218" textAnchor="middle" fontSize="12" fill="currentColor" opacity=".7">achat{e.acquisition ? `, ${e.acquisition.slice(0, 7)}` : ''}</text>
    <rect x="100" y={y(e.ouvertureCents)} width="78" height={px(e.ouvertureCents)} rx="6" fill="#567BD2"/><text x="139" y={y(e.ouvertureCents) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" className="ann-m">{montant(e.ouvertureCents)}</text><text x="139" y="218" textAnchor="middle" fontSize="12" fill="currentColor" opacity=".7">1er janv. {year}</text>
    <rect x="194" y={y(e.ouvertureCents)} width="86" height={Math.max(2, usureH)} fill="url(#ann-hb)" stroke="#567BD2"/>
    <rect x="194" y={y(e.clotureCents)} width="86" height={px(e.clotureCents)} rx="6" fill="#1F64A3"/>
    <rect x="200" y={y(e.ouvertureCents) + 4} width="74" height="19" rx="9" fill="#fff"/><text x="237" y={y(e.ouvertureCents) + 18} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0E2A5E" className="ann-m">−{montant(e.usureCents)}</text>
    <text x="237" y={y(e.clotureCents) + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill="#fff" className="ann-m">{montant(e.clotureCents)}</text><text x="237" y="218" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">31 déc. {year}</text>
    <rect x="296" y={y(e.prevuCents)} width="68" height={px(e.prevuCents)} rx="6" fill="none" stroke="#567BD2" strokeDasharray="4 3"/><text x="330" y={y(e.prevuCents) - 8} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".8" className="ann-m">{montant(e.prevuCents)}</text><text x="330" y="218" textAnchor="middle" fontSize="12" fill="currentColor" opacity=".7">{year + 1}, prévu</text>
  </svg>;
}
export function Etape4({ c }: { c: Ctx }) {
  const lignes = c.assets.map(a => ({ a, row: c.report.depreciation.find(r => r.assetId === a.id) })), complets = lignes.filter(l => l.row && !l.row.missing.length);
  const principal = [...complets].sort((x, y) => y.row!.depreciationCents - x.row!.depreciationCents)[0];
  const e = principal ? escalierMateriel(principal.row!, principal.a, c.year) : null;
  const petitsAchats = c.transactions.filter(t => !t.finance?.voidedAt && t.category === 'materiel' && t.date.slice(0, 4) === String(c.year) && !c.assets.some(a => a.transactionId === t.id) && !(t.finance?.lines ?? []).some(l => l.kind === 'equipment'));
  const futurs = c.plans.filter(p => p.source === 'equipment' && p.status === 'active' && p.date && Number(p.date.slice(0, 4)) > c.year);
  return <Cadre n={4} c={c} question={e ? `Ce que ${e.nom} a perdu en ${c.year}` : `Ton matériel a-t-il perdu de la valeur en ${c.year} ?`} terme={e ? `amortissement · ${nombreFr(principal!.a.ratePct, 1)} % par an, ${principal!.a.method === 'linear' ? 'linéaire' : 'dégressif'}` : 'amortissement'}
    bas={e ? <button type="button" className="ann-pri" onClick={() => c.act.aller(5)}>Garder l’usure <span className="ann-m">{montant(c.report.depreciationCents)}</span></button> : <><button type="button" className="ann-btn" disabled={c.gele} onClick={() => c.act.onAsset(null)}>Ajouter un matériel</button><button type="button" className="ann-pri" onClick={() => c.act.aller(5)}>Suite</button></>}>
    {e && <><EscalierSvg e={e} year={c.year}/>{e.partPro < 100 && <p className="ann-terme">Part professionnelle retenue : {nombreFr(e.partPro, 0)} %</p>}</>}
    <div className="ann-lst">
      {lignes.filter(l => l !== principal).map(({ a, row }) => <button type="button" key={a.id} className="ann-it ann-btn-it" onClick={() => c.act.onAsset(a)}><span className="ann-dot att"/><span className="ann-t">{a.name}<small>{row && !row.missing.length ? `usure ${montant(row.depreciationCents)}` : 'valeurs à compléter'}</small></span><span className="ann-m">{row && !row.missing.length ? montant(row.closingCents) : 'À compléter'}</span></button>)}
      {principal && <button type="button" className="ann-it ann-btn-it" onClick={() => c.act.onAsset(principal.a)}><span className="ann-dot ok"/><span className="ann-t">Modifier {principal.a.name}<small>valeurs, taux, cession</small></span></button>}
      {petitsAchats.map(t => <div key={t.id} className="ann-it"><span className="ann-dot att"/><span className="ann-t">{t.description} <span className="ann-m">{montant(Math.round((t.finance?.amountCents ?? 0) * (t.finance?.businessUsePct ?? 100) / 100))}</span><small>compté en charge de {c.year} ; le matériel passe au registre</small></span>
        <span className="ann-seg" role="group" aria-label={`${t.description} : matériel ou petit achat`}><button type="button" onClick={() => c.act.onAsset(null, { name: t.description, transactionId: t.id, acquisitionCents: t.finance?.amountCents ?? 0, acquisitionDate: t.date, inServiceDate: t.date })} disabled={c.gele}>Matériel</button><button type="button" aria-pressed="true" className="on">Petit achat</button></span></div>)}
      {futurs.map(p => <div key={p.id} className="ann-it ann-fut"><span className="ann-dot"/><span className="ann-t">{p.title} <span className="ann-m">{montant(p.amountCents)}</span><small>prévu {p.date.slice(0, 7)} : pas cette année</small></span></div>)}
    </div>
  </Cadre>;
}

/* ---------- 5 · Dettes et créances ---------- */
export function Etape5({ c }: { c: Ctx }) {
  const pl = plateaux(c.report, c.plans, c.year, c.today);
  const somme = (l: Array<{ amountCents: number }>) => l.reduce((n, x) => n + x.amountCents, 0);
  const incertain = (c.report.missing ?? []).some(m => m.includes('sans paiement vérifiable') || m.includes('Trésorerie incomplète'));
  return <Cadre n={5} c={c} question={`Au 31 déc., qui doit quoi ?`} terme="dettes et créances"
    bas={<button type="button" className="ann-pri" disabled={c.gele} onClick={() => { c.act.ecrire(t => { t.reviews = { ...t.reviews, balance: true }; }); c.act.aller(6); }}>C’est complet</button>}>
    <div className="ann-bal">
      <div className="ann-pan d"><h4>Tu dois</h4><span className="tot ann-m">{montant(somme(pl.tuDois))}</span>
        {pl.tuDois.map(r => <button type="button" key={r.id} className="ann-li" onClick={() => c.act.feuille('balance')}><span>{r.description}<small>{r.counterparty || 'tiers à nommer'}{r.date ? ` · depuis ${r.date.slice(8, 10)}.${r.date.slice(5, 7)}.${r.date.slice(0, 4)}` : ''}</small></span><span className="ann-m">{montant(r.amountCents)}</span></button>)}
        {/* data-renvoi="aucun" sur chaque charge prévue : ici « ? » dit « prévu, pas encore dû » (légende sous les panneaux), pas une donnée absente. */}
        {pl.prevues.map(p => <div key={p.id} className="ann-li f" data-renvoi="aucun"><span>{p.titre}<small>prévu {p.date.slice(8, 10)}.{p.date.slice(5, 7)}</small></span><span className="ann-m">{montant(p.amountCents)} ?</span></div>)}
      </div>
      <div className="ann-pan cr"><h4>On te doit</h4>{incertain ? <button type="button" className="ann-li ann-li-q" aria-label="Confirmer les paiements : sans eux, ce qu’on te doit reste inconnu" onClick={() => c.act.onOperations({ scope: 'all', year: String(c.year), allDates: true, filter: 'unknown' })}><span className="tot ann-m">?</span><small>paiements à confirmer ›</small></button> : <span className="tot ann-m">{montant(somme(pl.onTeDoit))}</span>}
        {pl.onTeDoit.map(r => <button type="button" key={r.id} className="ann-li" onClick={() => c.act.feuille('balance')}><span>{r.description}<small>{r.counterparty || 'tiers à nommer'}</small></span><span className="ann-m">{montant(r.amountCents)}</span></button>)}
        {!pl.onTeDoit.length && !incertain && <div className="ann-li"><span>Ventes {c.year}<small>toutes payées</small></span><span className="ann-pa ok">payé</span></div>}
      </div>
    </div>
    <div className="ann-lst"><div className="ann-it"><span className="ann-dot att"/><span className="ann-t">Un prêt, une avance ?<small>avec le nom de la personne</small></span><button type="button" disabled={c.gele} onClick={() => c.act.feuille('balance')}>Ajouter</button></div></div>
    {/* data-renvoi="aucun" : légende du « ? » des charges prévues. */}<p className="ann-terme" data-renvoi="aucun">« ? » : prévu, pas encore dû ; il n’entre pas dans le total.</p>
  </Cadre>;
}
