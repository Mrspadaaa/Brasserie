// Le mur d'Autres stocks, version A (D423, D424 ; liste du port : Brasserie/work/missions/2026-11-21-stock-maquettes/A-PORT-LISTE.md, blocs 1 à 5).
// Même vocabulaire que le mur des ingrédients (.l1e-r, .l1e-n, .l1e-w, .l1e-gb, .l1e-t, .sw-rl, .sv-leg) ; CSS propre : murAutres.css (préfixe sa-).
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { StockItem } from '../../types';
import { construireMurAutres, etatEtSeuil, type ColonneAutre, type PotAutre } from '../../domain/stock/murAutres';
import './murAutres.css';

/** n° 15 : une seule largeur de pot pour tout le mur, celle qui fait tenir la rangée la plus large (écart de 8 px gardé, 2 px entre pots, 30 px pour « seuil »). */
export function largeurPot(rangees: ReturnType<typeof construireMurAutres>, dispo: number, max = 8): number {
  let w = max;
  for (const r of rangees) {
    const pots = r.colonnes.reduce((n, c) => n + c.pots.length, 0); if (!pots) continue;
    const fixe = 8 * Math.max(0, r.colonnes.length - 1) + 2 * (pots - r.colonnes.length) + 30 + (r.vides.length ? 70 : 0);
    w = Math.min(w, Math.floor((dispo - fixe) / pots));
  }
  return Math.max(4, w);
}
const FORMES: Record<string, string> = {
  bouteille: 'polygon(30% 0,70% 0,70% 28%,100% 42%,100% 100%,0 100%,0 42%,30% 28%)',
  canette: 'polygon(8% 0,92% 0,100% 8%,100% 100%,0 100%,0 8%)',
  flacon: 'polygon(25% 0,75% 0,75% 22%,100% 34%,100% 100%,0 100%,0 34%,25% 22%)',
  bidon: 'polygon(0 22%,38% 22%,38% 0,100% 0,100% 100%,0 100%)',
};
function Pot({ p, c, tiretPot }: { p: PotAutre; c: ColonneAutre; tiretPot: boolean }) {
  const cls = `l1e-b sa-p${p.etat === 'epuise' ? ' sa-ep' : ''}${p.etat === 'compter' ? ' sv-ac' : ''}${p.ddmDepassee ? ' l1e-dx' : ''}`;
  const style = { ['--fill' as string]: c.fill, ['--h' as string]: p.hauteur, clipPath: c.forme && p.etat !== 'epuise' ? FORMES[c.forme] : undefined } as React.CSSProperties;
  return <i className={cls} data-art={p.nom} data-ref={p.ref} data-k={c.id} data-forme={c.forme ?? undefined} data-etat={p.etat ?? undefined} style={style} title={p.nom}>{tiretPot && p.seuil != null && <u className="sa-td" aria-hidden="true" />}</i>;
}

interface Props { items: StockItem[]; onOpen: (i: StockItem) => void; onFiltre?: (id: string) => void; carteActive?: string | null; ddm?: (i: StockItem) => boolean; retenus?: ReadonlySet<string> | null }
export function MurAutres({ items, onOpen, onFiltre, carteActive = null, ddm, retenus = null }: Props) {
  const rangees = useMemo(() => construireMurAutres(items, ddm), [items, ddm]);
  const parRef = useMemo(() => new Map(items.map((i) => [i.ref, i])), [items]);
  const racine = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(8); const [legende, setLegende] = useState(false); const [court, setCourt] = useState(true);
  useLayoutEffect(() => {
    const mur = racine.current; if (!mur) return;
    const mesurer = () => { const l = mur.getBoundingClientRect().width; setCourt(l < 700); const dispo = Math.min(l, 760) - 16 - 10 - 72 - 6 - 6; setW(largeurPot(rangees, dispo, l >= 700 ? 12 : 8)); };
    mesurer(); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null; ro?.observe(mur);
    return () => ro?.disconnect();
  }, [rangees]);
  // Le geste de l'app : un toucher sur la rangée vise le pot le plus proche de la colonne, une bulle le nomme, un second toucher ouvre la fiche.
  const [bulle, setBulle] = useState<{ a: string; ref: string; x: number; y: number } | null>(null);
  const viser = (e: React.PointerEvent<HTMLElement>) => {
    const arts = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-ref]')]; if (!arts.length) return;
    let b = arts[0]; let d = 1e9;
    arts.forEach((a) => { const r = a.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - e.clientX); if (dd < d) { d = dd; b = a; } });
    const ref = b.dataset.ref ?? ''; const it = parRef.get(ref);
    if (bulle?.ref === ref && it) { setBulle(null); onOpen(it); return; }
    const r = b.getBoundingClientRect(); const mur = racine.current?.getBoundingClientRect();
    setBulle({ a: b.getAttribute('title') ?? '', ref, x: Math.max(8, Math.min(window.innerWidth - 168, r.left + r.width / 2 - 80)), y: Math.max(8, (mur?.top ?? r.top) - 50) });
  };
  const derniere = rangees[rangees.length - 1]?.id;
  return (
    <div ref={racine} className="sa-mur" data-mur-autres style={{ ['--sa-w' as string]: `${w}px` } as React.CSSProperties}>
      {rangees.map((r) => {
        const premier = r.colonnes.find((c) => c.tiret);
        const total = retenus ? r.colonnes.reduce((n, c) => n + c.pots.filter((p) => retenus.has(p.ref)).length, 0) : r.total;
        return (
          <div key={r.id} className="l1e-r sa-r" data-f={r.id} data-rangee-autre={r.id} style={{ ['--l1-k' as string]: r.k, ['--ink' as string]: r.k } as React.CSSProperties}>
            <div className="l1e-c1">
              <button type="button" className="l1e-n" data-filtre={r.id} aria-pressed={carteActive === r.id} aria-label={`${r.nom} : ${r.total} article${r.total > 1 ? 's' : ''} ; ${carteActive === r.id ? 'retirer le filtre' : 'filtrer la liste'}`} onClick={() => onFiltre?.(r.id)}><b>{r.nom}</b><span>{total}</span></button>
              {r.id === derniere && <button type="button" className="sv-i sx-q" aria-expanded={legende} aria-label="Légende" onClick={() => setLegende((v) => !v)}>?</button>}
            </div>
            <div className="l1e-pl" onPointerDown={viser}>
              {r.colonnes.map((c) => (
                <div key={c.id} className={`l1e-g sa-g${c === premier ? ' sa-lab' : ''}${c.tiret === 'continu' ? '' : ' sa-nt'}`} data-groupe={c.id} style={{ ['--ink' as string]: c.fill, ['--fill' as string]: c.fill } as React.CSSProperties}>
                  <span className="l1e-w" data-long={c.mot} {...(c.court ? { 'data-court': c.court } : {})} title={c.mot}>{court && c.court ? c.court : c.mot}</span>
                  <span className="l1e-gb">
                    {c === premier && <i className="sw-rl" aria-hidden="true">seuil</i>}
                    {c.pots.map((p) => <Pot key={p.ref} p={p} c={c} tiretPot={c.tiret === 'pots'} />)}
                  </span>
                  <span className="l1e-t" data-total>{c.total}</span>
                </div>
              ))}
              {r.vides.length > 0 && <span className="sx-vd" role="note" aria-label={`Aucun en stock : ${r.vides.join(', ')}`}>{r.vides.map((v) => <span key={v} className="sx-v"><i className="sx-o" />{v}</span>)}</span>}
            </div>
          </div>
        );
      })}
      {legende && (
        <div className="sv-leg sa-leg" role="note" aria-label="Légende du mur">
          <span className="sv-li"><i className="sa-lg-t" aria-hidden="true" />tirets : le seuil de l'article</span>
          <span className="sv-li">sans seuil : contre le plus gros de la famille</span>
          <span className="sv-li"><i className="sv-ep" />cadre rouge : épuisé</span>
          <span className="sv-li"><i className="sv-ac" />pointillé : à compter</span>
          <span className="sv-li"><i className="sa-lg-x" aria-hidden="true" />barré : DDM dépassée</span>
          {rangees.flatMap((r) => r.colonnes.map((c) => <span key={r.id + c.id} className="sv-li"><i className="sa-lg-p" data-forme={c.forme ?? undefined} style={{ background: c.fill, clipPath: c.forme ? FORMES[c.forme] : undefined }} aria-hidden="true" />{c.mot}</span>))}
          <span className="sv-li"><i className="sx-o" />rien en stock</span>
        </div>
      )}
      {bulle && <div className="l1x-bul sa-bul" role="button" style={{ left: bulle.x, top: bulle.y }} onClick={() => { const it = parRef.get(bulle.ref); setBulle(null); if (it) onOpen(it); }}>
        <span>{bulle.a}{(() => { const it = parRef.get(bulle.ref); return it ? ` · ${etatEtSeuil(it).seuil}` : ''; })()}</span><span className="l1x-b2">toucher ici : la fiche ›</span></div>}
    </div>
  );
}
