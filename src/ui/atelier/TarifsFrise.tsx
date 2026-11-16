import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp, Plus, Store, Tag, TriangleAlert, X } from 'lucide-react';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { Sheet } from '../Sheet';
import { NumberInput } from '../NumberInput';
import { montantChf } from '../../domain/finance/ledger';
import { bandForEbc } from '../../domain/beerColor';
import { decoderLigneVente } from '../vente/ligneVente';
import { tarifsDuFormat, type FormatId } from '../prix/calculPrix';
import { biereDuBrassin, brassinDuCout, lireDonneesPrix } from '../prix/donneesPrix';
import { estDemo } from './demo';
import { domaineKxc, echelleLog } from '../../domain/tarifs/echellePrix';
import { bieresDesVentes, groupesParFormat, hors, nomFormat, PLAGE_LITRE_PLAUSIBLE, separerAVerifier, ventesAuLitre, type GenreClient, type VenteAuLitre } from '../../domain/tarifs/ventesAuLitre';
import { disposerFrise, marqueProche, type Marque } from '../../domain/tarifs/friseDisposition';
import './tarifs-frise.css';

/**
 * Atelier › Tarifs : la frise kxc (choisie le 15.11, « kxc peut être logarithmique un peu tuné… SI non oui » ; mesure : kxc telle quelle).
 * Un couloir par format, picto du format, trait min–max, référence (tarif fixé dans Clients) en pointillé, revient en rouge, une icône par
 * prix pratiqué (le genre de client), « ×n » sur prix égaux, liste repliée par format ; un toucher ouvre la vente dans la feuille de l'app.
 * Axe commun en CHF le litre, échelle log 4,5 – 23 (élargie si un prix réel en sort). Source : les ventes de la caisse, rien d'inventé.
 */

const X0 = 46, DROITE = 16;
const chf = (n: number) => montantChf(n);
const fr2 = (n: number) => n.toFixed(2).replace('.', ',');
const plage = (a: number, b: number) => (a === b ? chf(a) : `${chf(a)} – ${chf(b)}`);

/** Silhouettes des formats, reprises de la maquette kxc (symboles kxc-s-fut, growler, carton, bout, verre) : le fût a ses cerclages, le growler son anse. */
const SIL: Record<string, string[]> = {
  fut: ['M7 3h10c1.6 3 1.6 15 0 18H7C5.4 18 5.4 6 7 3z', 'M5.9 8h12.2M5.9 16h12.2'],
  growler: ['M8 3h5v3.5l2 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9.5l2-3z', 'M15 11h1.5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H15'],
  carton: ['M4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9A1.5 1.5 0 0 1 4.5 9z', 'M3 13h18'],
  '33cl': ['M10 2h4v4l1.6 3.2V21a1 1 0 0 1-1 1H9.4a1 1 0 0 1-1-1V9.2L10 6z', 'M8.4 13h7.2'],
  '75cl': ['M10 2h4v5l2 3V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z', 'M8 14h8'],
  verre: ['M6 3h12l-1.6 17.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9z', 'M6.5 8h11']
};
function Picto({ formatId, taille = 20 }: { formatId: string; taille?: number }) {
  const traits = SIL[formatId];
  if (!traits) return <CircleHelp size={taille} aria-hidden="true" />;
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    {traits.map((d) => <path key={d} d={d} />)}{formatId === 'carton' && <><circle cx="7" cy="5.5" r="1.8" /><circle cx="12" cy="5.5" r="1.8" /><circle cx="17" cy="5.5" r="1.8" /></>}
  </svg>;
}
const GENRE_NOM: Record<GenreClient, string> = { pro: 'Pro', prive: 'Privé', inconnu: 'Inconnu' };
function Genre({ genre, taille = 16 }: { genre: GenreClient; taille?: number }) {
  if (genre === 'pro') return <Store size={taille} strokeWidth={2} aria-hidden="true" />;
  if (genre === 'inconnu') return <CircleHelp size={taille} strokeWidth={2} aria-hidden="true" />;
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="7.8" r="3.8" /><path d="M4.5 21c0-4.3 3.3-7.2 7.5-7.2s7.5 2.9 7.5 7.2" /></svg>;
}
const COURT: Record<string, string> = { '33cl': '33 cl', '75cl': '75 cl', fut: 'fût' };
const pasDe = (p: number) => (p < 10 ? 0.05 : p < 100 ? 0.5 : 1);

export interface TarifsFriseProps {
  /** « + Noter » : une idée de tarif (la note de l'Atelier). */
  onNoter: () => void;
  /** Sous la liste, colonne de droite : les idées de tarif gardées et l'assistant. */
  apres?: React.ReactNode;
}

export function TarifsFrise({ onNoter, apres }: TarifsFriseProps) {
  const d = useStorageValue(lireDonneesPrix);
  const clients = useStorageValue(StorageService.getClients);
  const recettes = useStorageValue(StorageService.getRecipes);
  const assujetti = Boolean(d.fiscal?.isTvaRegistered);
  const ventes = useMemo(() => {
    const lots = new Map(d.batches.map((b) => [b.id, biereDuBrassin(b)]));
    return ventesAuLitre({ transactions: d.transactions, clients, decoder: decoderLigneVente, biereDuLot: (id) => (id ? lots.get(id) ?? null : null), estDemo });
  }, [d.transactions, d.batches, clients]);
  /** Constat 12 : un point hors de la plage plausible (> 100 CHF le litre…) ne tire pas l'échelle ; il est montré à part, « à vérifier ». */
  const { sures, aVerifier } = useMemo(() => separerAVerifier(ventes), [ventes]);
  const bieres = useMemo(() => bieresDesVentes(ventes), [ventes]);
  const [choix, setChoix] = useState<string | null | undefined>(undefined);
  const biere = choix === undefined ? bieres[0] ?? null : choix;
  const groupes = useMemo(() => groupesParFormat(sures, biere), [sures, biere]);
  const aVoir = useMemo(() => aVerifier.filter((v) => biere === null || v.biere === biere), [aVerifier, biere]);
  const demo = ventes.some((v) => v.demo);

  /** Référence : le tarif fixé dans Clients (33 cl d'abord) ; revient : le coût du litre liquide du dernier brassin chiffré. */
  const reference = useMemo(() => {
    if (!biere) return null;
    for (const [id, vol] of [['33cl', 0.33], ['75cl', 0.75], ['fut', null]] as const) {
      const t = tarifsDuFormat(d.tarifs, id as FormatId, biere);
      if (t.kind !== 'un') continue;
      const v = vol ?? t.tarif.format?.volumeL;
      if (v) return { litre: t.tarif.priceHT / v, nom: `${biere} ${id === 'fut' ? `fût ${String(v).replace('.', ',')} L` : COURT[id]}` };
    }
    return null;
  }, [d.tarifs, biere]);
  const revient = useMemo(() => (biere ? brassinDuCout(d.batches, d.plans, d.fiscal, biere)?.litre?.liquide ?? null : null), [d.batches, d.plans, d.fiscal, biere]);

  const scene = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  useLayoutEffect(() => {
    const el = scene.current; if (!el) return;
    const lire = () => setW(Math.max(280, Math.round(el.clientWidth)));
    lire(); const ro = new ResizeObserver(lire); ro.observe(el); return () => ro.disconnect();
  }, [groupes.length > 0]);
  const echelle = useMemo(() => echelleLog(...domaineKxc([...sures.map((v) => v.litre), reference?.litre, revient]), X0, W - DROITE), [sures, reference, revient, W]);
  const dispo = useMemo(() => disposerFrise(groupes, echelle.x, W, X0), [groupes, echelle, W]);

  const [sel, setSel] = useState<{ marque: Marque; vente: VenteAuLitre | null } | null>(null);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const ouvrir = (m: Marque) => setSel({ marque: m, vente: m.ventes.length === 1 ? m.ventes[0] : null });
  const ouvrirVente = (v: VenteAuLitre) => {
    const m = dispo.marques.find((q) => q.ventes.includes(v));
    setSel({ marque: m ?? { cle: v.cle, ventes: [v], cx: 0, py: 0, largeur: 24, couloir: -1 }, vente: v });
  };
  /** La feuille monte du bas : la marque touchée doit rester au-dessus, pour voir où tombe la vente sur la règle (maquette kxc-geste). */
  useEffect(() => {
    if (!sel) return;
    const t = window.setTimeout(() => {
      const m = scene.current?.querySelector<HTMLElement>('.tf-m.on'), f = document.querySelector<HTMLElement>('[role="dialog"]:has(.tf-sheet)');
      if (!m || !f) return;
      const r = m.getBoundingClientRect(), haut = f.getBoundingClientRect().top;
      if (r.bottom > haut - 16 || r.top < 80) window.scrollBy({ top: r.top + r.height / 2 - Math.max(130, haut * 0.4), behavior: 'smooth' });
    }, 500);
    return () => window.clearTimeout(t);
  }, [sel?.marque.cle]);
  const touche = (i: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    const r = scene.current?.getBoundingClientRect(); if (!r) return;
    const m = marqueProche(dispo.marques, i, e.clientX - r.left, e.clientY - r.top);
    if (m) ouvrir(m);
  };
  const genres = [...new Set(ventes.map((v) => v.genre))] as GenreClient[];
  const AX = dispo.axe, rx = revient ? echelle.x(revient) : null, bx = reference ? echelle.x(reference.litre) : null;
  const refTexte = reference ? `${reference.nom} · fixé dans Clients` : '';
  const refX = bx === null ? 0 : Math.min(bx - 4, W - 4 - refTexte.length * 7.2);

  return (
    <section className="tf" aria-label="Règle au litre">
      <div className="tf-tete">
        <h3>Règle au litre</h3><span className="tf-base">CHF HT</span>{demo && <span className="tf-pill">exemples</span>}
        <span className="tf-sp" />
        <button type="button" className="tf-noter" onClick={onNoter}><Plus size={20} aria-hidden="true" />Noter</button>
      </div>
      {bieres.length > 0 && (
        <div className="tf-bieres" role="group" aria-label="Bière">
          {[null, ...bieres].map((b) => {
            const ebc = b ? recettes.find((r) => r.name === b)?.colorEbc : undefined;
            return <button key={b ?? 'toutes'} type="button" aria-pressed={biere === b} onClick={() => { setChoix(b); setSel(null); }}>
              {b && <i className={`tf-dot ${typeof ebc === 'number' ? `tf-dot-${bandForEbc(ebc).band}` : 'tf-dot-vide'}`} aria-hidden="true" />}{b ?? 'Toutes'}
            </button>;
          })}
        </div>
      )}
      <div className="tf-cols">
        <div>
          {assujetti ? <p className="tf-vide">Assujetti à la TVA : la base des ventes (HT ou TTC) n’est pas sûre, la frise attend.</p>
            : !groupes.length ? <p className="tf-vide">{aVoir.length > 0 ? 'Aucun prix sûr à tracer : les prix à vérifier sont plus bas.' : 'Aucune vente avec un prix : la frise se remplit avec les ventes de la caisse.'}</p>
            : <div className="tf-fig">
              <div className="tf-leg">{genres.map((g) => <span key={g}><i><Genre genre={g} /></i>{GENRE_NOM[g]}</span>)}</div>
              <p className="tf-ech">Échelle log</p>
              <div className="tf-scene" ref={scene} style={{ height: dispo.hauteur }}>
                <svg width={W} height={dispo.hauteur} aria-hidden="true">
                  {rx !== null && <>
                    <rect x={X0} y={20} width={Math.max(0, rx - X0)} height={AX - 15} className="tf-rev-zone" />
                    <path d={`M${rx} 20V${AX + 46}`} className="tf-rev" />
                  </>}
                  {bx !== null && <>
                    <path d={`M${bx} 20V${AX}`} className="tf-ref-tir" />
                    <path d={`M${bx} ${AX - 7}l7 7-7 7-7-7z`} className="tf-ref-los" />
                    <path d={`M${bx} ${AX + 8}V${AX + 26}`} className="tf-ref-tir tf-ref-plein" />
                  </>}
                  {dispo.couloirs.map((c) => <g key={c.cle}>
                    <path d={`M0 ${c.y0 + c.h}H${W}`} className="tf-sep" />
                    <foreignObject x={5} y={c.cy - 11} width={22} height={22}><div className="tf-fmt"><Picto formatId={c.formatId} taille={22} /></div></foreignObject>
                    <path d={`M${c.xmin} ${c.cy}H${c.xmax}`} className="tf-piste" />
                  </g>)}
                  {dispo.noms.map((n) => <text key={n.texte + n.x} x={n.x} y={n.y} className="tf-nom">{n.texte}</text>)}
                  <path d={`M${X0 - 6} ${AX}H${W - DROITE + 6}`} className="tf-axe" />
                  {echelle.graduations.map((g) => <g key={g}><path d={`M${echelle.x(g)} ${AX}v6`} className="tf-grad" /><text x={echelle.x(g)} y={AX + 21} className="tf-gt">{String(g).replace('.', ',')}</text></g>)}
                  {bx !== null && <text x={refX} y={AX + 40} className="tf-ref-t">{refTexte}</text>}
                  {rx !== null && <text x={Math.max(2, rx - 4)} y={AX + 60} className="tf-rev-t">Revient {biere}<tspan className="tf-leger"> · hors contenant</tspan></text>}
                </svg>
                {dispo.couloirs.map((c, i) => <div key={c.cle} className="tf-couloir" style={{ top: c.y0, height: c.h }} onClick={touche(i)} aria-hidden="true" />)}
                {dispo.marques.map((m) => {
                  const on = sel?.marque.cle === m.cle, flou = sel !== null && !on;
                  const gs = [...new Set(m.ventes.map((v) => v.genre))].slice(0, 2);
                  const nom = m.ventes.length > 1 ? `${m.ventes.length} ventes à ${chf(m.ventes[0].prix)}, ${dispo.couloirs[m.couloir].nom}` : `${m.ventes[0].qui}, ${dispo.couloirs[m.couloir].nom}, ${chf(m.ventes[0].prix)}`;
                  return <button key={m.cle} type="button" className={`tf-m${m.ventes.length > 1 ? ' tf-amas' : ''}${on ? ' on' : ''}${flou ? ' flou' : ''}`} aria-label={nom}
                    style={{ left: m.cx - m.largeur / 2, top: m.py - 12, width: m.largeur }} onClick={() => ouvrir(m)}>
                    {gs.map((g) => <Genre key={g} genre={g} taille={on && m.ventes.length === 1 ? 20 : 16} />)}{m.ventes.length > 1 && <b>×{m.ventes.length}</b>}
                  </button>;
                })}
              </div>
            </div>}
          {aVoir.length > 0 && <div className="tf-verif" role="group" aria-label="Prix à vérifier">
            <h4><TriangleAlert size={16} aria-hidden="true" />À vérifier</h4>
            <p className="tf-verif-n">Hors de {PLAGE_LITRE_PLAUSIBLE[0]} à {PLAGE_LITRE_PLAUSIBLE[1]} CHF le litre : pas tracé sur l’axe.</p>
            <ul className="tf-gl">{aVoir.map((v) => <li key={v.cle}>
              <button type="button" className="tf-gr" onClick={() => ouvrirVente(v)}>
                <span className="tf-gi"><Genre genre={v.genre} /></span>
                <span className="tf-gn"><span className="tf-gq">{v.qui}<span className="tf-pill tf-pill-verif">à vérifier</span></span>
                  <small><span className="tf-nw">{nomFormat(v.formatId, v.litresUnite)}</span> · <span className="tf-nw">{chf(v.prix)} l’unité</span> · <span className="tf-nw">{fr2(v.litre)} CHF le litre</span></small></span>
              </button>
            </li>)}</ul>
          </div>}
        </div>
        <div>
          <ul className="tf-liste">
            {groupes.map((g) => {
              const ouvert = ouverts.has(g.cle);
              return <li key={g.cle}>
                <button type="button" className="tf-r" aria-expanded={ouvert} onClick={() => setOuverts((s) => { const n = new Set(s); if (n.has(g.cle)) n.delete(g.cle); else n.add(g.cle); return n; })}>
                  <span className="tf-ti"><Picto formatId={g.formatId} /></span><span className="tf-rn">{g.nom}</span><b className="tf-n">{plage(g.pmin, g.pmax)}</b><ChevronDown size={18} className="tf-chv" aria-hidden="true" />
                </button>
                {ouvert && <ul className="tf-gl">{[...g.ventes].sort((a, b) => a.prix - b.prix).map((v) => <li key={v.cle}>
                  <button type="button" className="tf-gr" onClick={() => ouvrirVente(v)}><span className="tf-gi"><Genre genre={v.genre} /></span><span className="tf-gn">{v.qui}{biere === null && v.biere && <small>{v.biere}</small>}</span><b className="tf-n">{chf(v.prix)}</b></button>
                </li>)}</ul>}
              </li>;
            })}
          </ul>
          {apres}
        </div>
      </div>
      <VenteFeuille sel={sel} onClose={() => setSel(null)} onVente={(v) => sel && setSel({ ...sel, vente: v })} revient={revient} />
    </section>
  );
}

function VenteFeuille({ sel, onClose, onVente, revient }: { sel: { marque: Marque; vente: VenteAuLitre | null } | null; onClose: () => void; onVente: (v: VenteAuLitre) => void; revient: number | null }) {
  const v = sel?.vente ?? null;
  const [essai, setEssai] = useState<number | undefined>(undefined);
  const [pour, setPour] = useState<string | null>(null);
  if (v && pour !== v.cle) { setPour(v.cle); setEssai(v.prix); }
  const fmt = v ? nomFormat(v.formatId, v.litresUnite) : '';
  const titre = v ? v.qui : sel ? `${sel.marque.ventes.length} ventes à ${chf(sel.marque.ventes[0].prix)}` : '';
  const prix = essai ?? v?.prix;
  const pas = pasDe(v?.prix ?? 1);
  const versPrix = () => {
    StorageService.setUiState('clients_subtab', 'tarifs');
    window.dispatchEvent(new CustomEvent('affinee:ouvrir-clients', { cancelable: true }));
    onClose();
  };
  return (
    <Sheet open={sel !== null} onClose={onClose} title={titre} subtitle={v ? `${GENRE_NOM[v.genre]} · ${fmt}` : undefined} bare>
      {sel && <div className="tf-sheet">
        <div className="tf-sh">
          <span className="tf-gd">{v ? <Genre genre={v.genre} taille={20} /> : <b>×{sel.marque.ventes.length}</b>}</span>
          <b>{titre}<small>{v ? [GENRE_NOM[v.genre], fmt, v.biere, v.date].filter(Boolean).join(' · ') : nomFormat(sel.marque.ventes[0].formatId, sel.marque.ventes[0].litresUnite)}</small></b>
          <button type="button" className="tf-x" aria-label="Fermer" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        </div>
        {!v ? <ul className="tf-gl">{sel.marque.ventes.map((w) => <li key={w.cle}>
          <button type="button" className="tf-gr" onClick={() => onVente(w)}><span className="tf-gi"><Genre genre={w.genre} /></span><span className="tf-gn">{w.qui}{w.biere && <small>{w.biere}</small>}</span><ChevronRight size={18} aria-hidden="true" /></button>
        </li>)}</ul> : <>
          <div className="tf-bigp">
            <button type="button" className="tf-stp" aria-label={`Moins ${fr2(pas)}`} onClick={() => setEssai(Math.max(pas, Math.round(((prix ?? 0) - pas) * 100) / 100))}>−</button>
            <NumberInput className="tf-pv" value={essai} onValue={(n: number | undefined) => setEssai(n)} fractionDigits={2} min={0} emptyValue={undefined} aria-label="Prix à essayer, rien n’est enregistré" />
            <button type="button" className="tf-stp" aria-label={`Plus ${fr2(pas)}`} onClick={() => setEssai(Math.round(((prix ?? 0) + pas) * 100) / 100)}>+</button>
          </div>
          {hors(v.litre) && <p className="tf-warn" role="note"><TriangleAlert size={16} aria-hidden="true" />À vérifier : {fr2(v.litre)} CHF le litre sort de la plage de {PLAGE_LITRE_PLAUSIBLE[0]} à {PLAGE_LITRE_PLAUSIBLE[1]}. Le montant de la vente est peut-être faux ; rien n’est corrigé ici.</p>}
          <div className="tf-kv">
            <div><small>Au litre</small><b className="tf-n">{prix ? fr2(prix / v.litresUnite) : '?'}</b></div>
            <div><small>Coût · revient {v.biere ?? ''}<span className="tf-leger">hors contenant</span></small><b className="tf-n">{revient !== null && v.biere ? fr2(revient * v.litresUnite) : '?'}</b></div>
          </div>
          <button type="button" className="tf-fix" onClick={versPrix}><Tag size={20} aria-hidden="true" /><span>Fixer dans Clients › Prix</span><ChevronRight size={18} aria-hidden="true" /></button>
        </>}
      </div>}
    </Sheet>
  );
}
