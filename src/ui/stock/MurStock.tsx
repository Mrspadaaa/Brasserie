// Le mur du stock : la maquette choisie sy/fA reprise telle quelle (règle n° 1). Trois rayons (Malts, Houblons, Levures) rangés par famille, un bouton « ? »
// unique pour les légendes, un toucher qui ouvre une bulle puis la fiche k2 (celle de l'app), et l'onglet « Autres stocks ».
// Le DOM, les classes et les data-* sont ceux de la maquette ; sa mise en page mesurée (murMiseEnPage.ts) est son propre script, repris.
import React, { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { StockItem, EquipmentItem, KegItem } from '../../types';
import { construireMur, BASE_TEINTE, type GroupeMur, type MarqueMur, type MurDonnees, type RayonMur } from '../../domain/stock/murDonnees';
import { sourcesDeLApp } from '../../domain/stock/murSources';
import { couleurALaClarte, labDeHex } from '../../domain/stock/mur';
import { installerMiseEnPage } from './murMiseEnPage';
import './mur.css';

export type OngletMur = 'ing' | 'autres';
interface Props {
  items: StockItem[];
  equipements?: EquipmentItem[];
  futs?: KegItem[];
  onOpen: (item: StockItem) => void;
  /** Le bouton du nom d'un rayon filtre la liste : le parent reçoit « Malts », « Houblons » ou « Levures » (ou null pour tout). */
  onFiltre?: (rayon: 'Malts' | 'Houblons' | 'Levures' | null) => void;
  filtre?: 'Malts' | 'Houblons' | 'Levures' | null;
  onglet: OngletMur;
  onOnglet: (o: OngletMur) => void;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const signature = (m: MurDonnees) => m.rayons.map((r) => r.groupes.map((g) => g.marques.map((a) => `${a.ref}|${a.titre}|${a.hauteur}|${a.fill}`).join(';')).join('/')).join('#') + '#' + m.autres.map((c) => `${c.nom}${c.total}${c.lignes.map((l) => l.n + l.texte).join()}`).join();

/* ---------- les marques ---------- */
function Marque({ a, ink }: { a: MarqueMur; ink: string }) {
  const attrs = { 'data-art': a.nom, 'data-ref': a.ref, 'data-rayon-mur': a.rayon, 'data-k': a.k } as Record<string, string>;
  if (a.rayon === 'Levures') return <Levure a={a} ink={ink} attrs={attrs} />;
  if (a.etat === 'epuise') return <i {...attrs} className="l1e-b l1e-ep" style={{ height: '8px' }} title={a.titre} />;
  const w = 8; const h = a.hauteur;
  if (a.rayon === 'Malts') {
    const compter = a.etat === 'compter';
    return (
      <svg {...attrs} data-cer={a.cereale} data-forme={a.forme} {...(compter ? { 'data-etat': 'compter' } : {})} className="l1e-b sw-m" width={w} height={h} viewBox={`0 0 ${w} ${h}`} focusable="false">
        <title>{a.titre}</title>
        {compter ? <path d={a.trace} fill="#fff" stroke="#333" strokeWidth="1.5" strokeDasharray="2 1.5" strokeLinejoin="round" transform="translate(0 0)" /> : <path d={a.trace} style={{ fill: a.fill, ...(parseInt(a.fill.slice(1, 3), 16) < 0x70 ? { stroke: 'var(--l1-lisere)', strokeWidth: 1 } : {}) }} />}
      </svg>
    );
  }
  return (
    <svg {...attrs} data-sommet={a.sommet} data-teinte={a.teinte} {...(a.alpha != null ? { 'data-alpha': String(a.alpha) } : {})} className="l1e-b l1e-hs" width={w} height={h} viewBox={`0 0 ${w} ${h}`} focusable="false">
      <title>{a.titre}</title>
      <path d={a.trace} fill={a.fill} {...(a.hachure ? { stroke: a.hachure, strokeWidth: 1 } : {})} />
    </svg>
  );
}
const Fiole = () => (
  <b className="l1e-fv"><svg viewBox="0 0 8 13" width="8" height="13" aria-hidden="true"><path className="gl" d="M1.6 2.6V10.4A2.4 2.4 0 0 0 6.4 10.4V2.6Z" /><path className="lq" d="M2.1 6.6Q4 7.6 5.9 6.6V10.4A1.9 1.9 0 0 1 2.1 10.4Z" /><rect className="cp" x="1.1" y="0" width="5.8" height="2.6" rx=".5" /></svg></b>
);
function Levure({ a, ink, attrs }: { a: MarqueMur; ink: string; attrs: Record<string, string> }) {
  const pale = labDeHex(a.fill)[0] > 78;
  const sty = { ['--fill' as string]: a.fill, height: 'auto' } as React.CSSProperties;
  const d = { ...attrs, 'data-ini': a.ini ?? '', 'data-att': a.att != null ? String(a.att) : '' } as Record<string, string>;
  if (a.etat === 'epuise') return <i {...d} className={`l1e-b sx-p sx-g3 sx-c${a.bord} l1e-ep l1e-sa${pale ? ' l1e-pa' : ''}${a.inconnue ? ' l1e-in' : ''}`} style={sty} title={a.titre}><b className="sx-e0" /><b className="sx-gl">{a.ini}</b></i>;
  const cls = `l1e-b sx-p sx-g3 sx-c${a.bord} ${a.liquide ? 'l1e-lq l1e-lq-a' : 'l1e-sk l1e-sk-a'}${pale ? ' l1e-pa' : ''}${a.inconnue ? ' l1e-in' : ''}${a.ddmDepassee ? ' l1e-dx' : ''}`;
  const n = Math.max(1, a.n ?? 1);
  if (a.liquide) return <i {...d} data-forme="liquide" className={cls} style={sty} title={a.titre}>{Array.from({ length: n }, (_, k) => <Fiole key={k} />)}<b className="sx-gl">{a.ini}</b></i>;
  const bg = { background: a.fill };
  return (
    <i {...d} className={cls} style={sty} title={a.titre}>
      <b className="l1e-s1 sx-g" style={{ ...bg, color: pale || a.inconnue ? 'var(--ink)' : '#fff' }}>{a.ini}</b>
      {Array.from({ length: n - 1 }, (_, k) => <b key={k} className="l1e-s1" style={bg} />)}
    </i>
  );
}
function TotalLevure({ g }: { g: GroupeMur }) {
  const s = g.sachets ?? 0; const f = g.fioles ?? 0;
  const lab = [s ? `${s} sachet${s > 1 ? 's' : ''}` : '', f ? `${f} fiole${f > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ') || '0';
  return (
    <span className="l1e-t"><span className="sx-tk" aria-label={lab} title={lab}><span aria-hidden="true">
      {s ? <>{s}<i className="sx-ks" /></> : null}{s && f ? <i className="sx-kp"> · </i> : null}{f ? <>{f}<i className="sx-kf" /></> : null}
    </span></span></span>
  );
}

function Groupe({ g, r }: { g: GroupeMur; r: RayonMur }) {
  const style = { ['--ink' as string]: g.ink, ['--fill' as string]: g.fill } as React.CSSProperties;
  return (
    <div className={`l1e-g${g.r2 ? ' sw-r2' : ''}${g.r2a ? ' sw-r2a' : ''}`} data-groupe={g.id} style={style}>
      {g.r2a && <i className="sw-rl" aria-hidden="true">1 kg</i>}
      <span className="l1e-w" data-long={g.mot} {...(g.court ? { 'data-court': g.court } : {})} title={g.titre}>{g.mot}</span>
      <span className="l1e-gb">
        {g.marques.map((a) => <Marque key={a.ref} a={a} ink={g.ink} />)}
        <i className="sy-so" data-socle={r.nom} aria-hidden="true" {...(g.socle && Object.keys(g.socle).length ? { 'data-c': JSON.stringify(g.socle) } : {})} />
      </span>
      {r.id === 'f2' ? <TotalLevure g={g} /> : <span className="l1e-t">{g.total}</span>}
    </div>
  );
}

/* ---------- les légendes (un seul bouton « ? ») ---------- */
const Pi = ({ d, fill = '#D9A441', stroke }: { d: string; fill?: string; stroke?: string }) => <svg className="sv-pi" width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d={d} fill={fill} {...(stroke ? { stroke, strokeWidth: 1 } : {})} /></svg>;
const Li = ({ children, t }: { children: React.ReactNode; t: string }) => <span className="sv-li">{children}<span>{t}</span></span>;
const degrade = (base: string) => [92, 70, 50, 36, 22].map((L) => couleurALaClarte(base, L));
function LegendeMalts() {
  return (
    <div className="sv-leg" id="sv-leg-f0" role="note" aria-label="Légende de la rangée Malts" hidden>
      <Li t="droite : orge"><Pi d="M0 14V0H8V14Z" /></Li>
      <Li t="pointe : blé"><Pi d="M0 14V5L4 0L8 5V14Z" /></Li>
      <Li t="biseau : seigle"><Pi d="M0 14V5L8 0V14Z" /></Li>
      <Li t="dôme : avoine"><Pi d="M0 14V4A4 4 0 0 1 8 4V14Z" /></Li>
      <Li t="creux : autres (épeautre, maïs, riz, sucre)"><Pi d="M0 14V0L4 4L8 0V14Z" /></Li>
      <Li t="teinte : la couleur du malt (EBC)">{['#ffd98f', '#d58f36', '#995d2c', '#442517'].map((c) => <i key={c} className="sv-dot sv-sq" style={{ background: c }} />)}</Li>
      <Li t="gris : EBC non connu"><i className="sy-gr" /></Li>
      <Li t="tirets : 5 kg pour Base ; 1 kg pour Caramel, Torréfiés, Spéciaux"><i className="sv-tir" /></Li>
      <Li t="pointillé : à compter"><i className="sv-ac" /></Li>
      <Li t="cadre rouge : épuisé"><i className="sv-ep" /></Li>
      <Li t="au bout : rien en stock dans ce style"><i className="sx-o" /></Li>
    </div>
  );
}
function LegendeHoublons() {
  const teintes: Array<[string, string]> = [['agrumes', 'agrumes'], ['tropical', 'tropical'], ['fruitsrouges', 'fruits rouges'], ['floral', 'floral'], ['resine', 'résine, pin'], ['epice', 'épicé, herbes'], ['nonclasse', 'arôme non classé']];
  return (
    <div className="sv-leg" id="sv-leg-f1" role="note" aria-label="Légende de la rangée Houblons" hidden>
      <Li t="pointe : fruité moderne"><Pi d="M0 14V5L4 0L8 5V14Z" fill="#9AA592" stroke="#858f7e" /></Li>
      <Li t="creux : américain classique"><Pi d="M0 14V0L4 4.5L8 0V14Z" fill="#9AA592" stroke="#858f7e" /></Li>
      <Li t="dôme : noble"><Pi d="M0 14V5A4 5 0 0 1 8 5V14Z" fill="#9AA592" stroke="#858f7e" /></Li>
      <Li t="plat : amérisant"><Pi d="M0 14V0H8V14Z" fill="#9AA592" stroke="#858f7e" /></Li>
      <Li t="α en % : clair → foncé"><span className="sx-pl">{['#f7ea93', '#d0bc5b', '#a68a17', '#795c00', '#4b3300'].map((c, k) => <Fragment key={c}><i style={{ background: c }} /><small>{3 * (k + 1)}</small></Fragment>)}</span></Li>
      <Li t="hachuré : α non connu"><i className="sy-hx" /></Li>
      <Li t="rangés par α : le plus fort à gauche ; le socle aussi"><i className="sy-so0" style={{ background: 'linear-gradient(90deg,#2E5420,#C9D3C3)' }} /></Li>
      {teintes.map(([k, nom]) => { const c = degrade(BASE_TEINTE[k]); return <Li key={k} t={nom}><i className="sy-dg" data-teinte={k} data-c={c.join(' ')} style={{ background: `linear-gradient(90deg,${c.join(',')})` }} /></Li>; })}
      <Li t="tirets : 250 g ; hauteur : la quantité"><i className="sv-tir" /></Li>
      <Li t="cadre rouge : épuisé"><i className="sv-ep" /></Li>
      <Li t="au bout : rien en stock dans ce style"><i className="sx-o" /></Li>
    </div>
  );
}
function LegendeLevures() {
  return (
    <div className="sv-leg" id="sv-leg-f2" role="note" aria-label="Légende de la rangée Levures" hidden>
      <Li t="sachet : sèche, un par sachet"><i className="sv-sk" /></Li>
      <Li t="fiole : liquide, une par fiole"><svg viewBox="0 0 8 13" width="8" height="13" aria-hidden="true"><path d="M1.6 2.6V10.4A2.4 2.4 0 0 0 6.4 10.4V2.6Z" fill="#fff" stroke="#6B5426" /><path d="M2.1 6.6Q4 7.6 5.9 6.6V10.4A1.9 1.9 0 0 1 2.1 10.4Z" fill="#B79A63" /><rect x="1.1" y="0" width="5.8" height="2.6" rx=".5" fill="#6B5426" /></svg></Li>
      <Li t="lettre : la souche (U pour US-05)"><b className="sx-g0">U</b></Li>
      <Li t="bord : un par souche"><i className="sv-sk" /><i className="sv-sk" style={{ boxShadow: 'none', borderRadius: 3 }} /><i className="sv-sk" style={{ boxShadow: 'inset 0 0 0 2.5px #6B5426' }} /></Li>
      <Li t="gris : colonne Autres (type non connu)"><i className="sv-sk" style={{ background: '#BDBDBD' }} /></Li>
      <Li t="rangées par atténuation : la plus forte à gauche ; le socle aussi"><i className="sy-so0" style={{ background: 'linear-gradient(90deg,#5C4515,#E3D6BC)' }} /></Li>
      <Li t="barré : DDM dépassée"><i className="sv-sk sv-dx" /></Li>
      <Li t="cadre rouge : épuisé"><i className="sv-ep" /></Li>
      <Li t="au bout : rien en stock dans ce style"><i className="sx-o" /></Li>
    </div>
  );
}

/* ---------- le mur, avec son comportement mesuré ---------- */
function Mur({ m, parRef, onOpen, onFiltre, filtre, ouvertLegende, onLegende, visible }: { m: MurDonnees; parRef: Map<string, StockItem>; onOpen: (i: StockItem) => void; onFiltre?: Props['onFiltre']; filtre?: Props['filtre']; ouvertLegende: boolean; onLegende: () => void; visible: boolean }) {
  const racine = useRef<HTMLDivElement>(null);
  const bulle = useRef<HTMLDivElement>(null);
  const mep = useRef<ReturnType<typeof installerMiseEnPage> | null>(null);
  const ouvrirRef = useRef(onOpen); ouvrirRef.current = onOpen;
  const refs = useRef(parRef); refs.current = parRef;

  useLayoutEffect(() => { racine.current?.querySelectorAll<HTMLElement>('.sv-leg').forEach((l) => { l.hidden = !ouvertLegende; }); }, [ouvertLegende]);
  useLayoutEffect(() => {
    if (!racine.current) return;
    mep.current = installerMiseEnPage(racine.current);
    return () => { mep.current?.arreter(); mep.current = null; };
  }, []);
  useLayoutEffect(() => { mep.current?.repose(); }, [ouvertLegende, visible]);

  // toucher : bulle (nom, quantité, couleur…) ; second toucher ou glisser relâché : la fiche k2 de l'app
  useEffect(() => {
    const root = racine.current; const bul = bulle.current; if (!root || !bul) return;
    const nettoyeurs: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>('.l1e-r[data-f]').forEach((row) => {
      const pl = row.querySelector<HTMLElement>('.l1e-pl'); if (!pl) return;
      const arts = [...row.querySelectorAll<HTMLElement>('[data-art]')]; if (!arts.length) return;
      let cur: HTMLElement | null = null; let vu: HTMLElement | null = null; let x0 = 0; let gl = false; let on = false;
      const proche = (x: number) => { let b = arts[0]; let d = 1e9; arts.forEach((a) => { const r = a.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - x); if (dd < d) { d = dd; b = a; } }); return b; };
      const titre = (a: HTMLElement) => a.getAttribute('title') || a.querySelector('title')?.textContent || '';
      const cacher = () => { bul.hidden = true; vu = null; cur?.classList.remove('l1e-on'); };
      const montrer = (a: HTMLElement, glisse: boolean) => {
        if (cur && cur !== a) cur.classList.remove('l1e-on');
        cur = a; a.classList.add('l1e-on');
        bul.innerHTML = `<span>${esc(titre(a))}</span><span class="l1x-b2">${glisse ? 'relâcher : la fiche ›' : 'toucher ici : la fiche ›'}</span>`;
        bul.hidden = false;
        const r = a.getBoundingClientRect(); const w = bul.offsetWidth;
        bul.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
        bul.style.top = `${Math.max(8, r.top - bul.offsetHeight - 8)}px`;
      };
      const ouvrir = (a: HTMLElement) => { const it = refs.current.get(a.dataset.ref ?? ''); cacher(); if (it) ouvrirRef.current(it); };
      const down = (e: PointerEvent) => { on = true; gl = false; x0 = e.clientX; try { pl.setPointerCapture(e.pointerId); } catch { /* sans effet */ } const a = proche(e.clientX); if (vu === a) { on = false; ouvrir(a); return; } montrer(a, true); };
      const move = (e: PointerEvent) => { if (!on) return; if (Math.abs(e.clientX - x0) > 6) gl = true; const a = proche(e.clientX); if (a !== cur || gl) montrer(a, gl); };
      const up = () => { if (!on) return; on = false; if (gl) { if (cur) ouvrir(cur); } else if (cur) { montrer(cur, false); vu = cur; } };
      const cancel = () => { on = false; cacher(); };
      const stop = (e: Event) => e.stopPropagation();
      pl.addEventListener('pointerdown', down); pl.addEventListener('pointermove', move); pl.addEventListener('pointerup', up); pl.addEventListener('pointercancel', cancel);
      ['touchstart', 'touchmove', 'touchend'].forEach((t) => pl.addEventListener(t, stop, { passive: true }));
      const clic = () => { if (cur) ouvrir(cur); };
      bul.addEventListener('click', clic);
      const dehors = (e: PointerEvent) => { const t = e.target as Element; if (!t.closest('.l1e-r[data-f] .l1e-pl') && !t.closest('.l1x-bul')) cacher(); };
      document.addEventListener('pointerdown', dehors);
      nettoyeurs.push(() => { pl.removeEventListener('pointerdown', down); pl.removeEventListener('pointermove', move); pl.removeEventListener('pointerup', up); pl.removeEventListener('pointercancel', cancel); ['touchstart', 'touchmove', 'touchend'].forEach((t) => pl.removeEventListener(t, stop)); bul.removeEventListener('click', clic); document.removeEventListener('pointerdown', dehors); });
    });
    return () => { nettoyeurs.forEach((n) => n()); bul.hidden = true; };
  }, []);

  const toutes = m.rayons.flatMap((r) => r.hachures);
  return (
    <div ref={racine}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false"><defs>
        {[...new Set(toutes)].map((hex) => <pattern key={hex} id={`syh-${hex}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.2" height="3.2" fill="#fff" /><rect width="1.5" height="3.2" fill={`#${hex}`} /></pattern>)}
      </defs></svg>
      <div className="l1-mur l1e-mur" data-sv="fA" data-mur data-combo="HA-L6-M1" role="group" aria-label="Le stock d'un coup d'œil : chaque rayon rangé par famille ; toucher une famille donne ses articles">
        {m.rayons.map((r) => (
          <Fragment key={r.id}>
            <div className={`l1-mu l1e-r${r.hc ? '' : ' l1e-sansc'}`} data-f={r.id} data-systeme={r.systeme} style={{ ['--hc' as string]: `${r.hc}px`, ['--hm' as string]: `${r.hm}px` } as React.CSSProperties}>
              <div className="l1e-c1">
                <button type="button" className="l1e-n" data-filtre={r.nom} data-f={r.id} aria-pressed={filtre === r.nom} aria-label={`${r.nom} : ${r.total} article${r.total > 1 ? 's' : ''}, ${r.sousTitre} ; filtrer la liste`} onClick={() => onFiltre?.(filtre === r.nom ? null : r.nom)}><b>{r.nom}</b><span>{r.total}</span></button>
                {r.echelle && <span className="l1e-cl" aria-hidden="true">{r.echelle}</span>}
                {r.id === 'f2' && <button type="button" className="sv-i sx-q" aria-expanded={ouvertLegende} aria-controls="sv-leg-f0 sv-leg-f1 sv-leg-f2" aria-label="Légende" onClick={onLegende}>?</button>}
              </div>
              <div className="l1e-pl">
                {r.groupes.map((g) => <Groupe key={g.id} g={g} r={r} />)}
                {r.vides.length > 0 && <span className="sx-vd" role="note" aria-label={`Aucun en stock : ${r.vides.join(', ')}`}>{r.vides.map((v) => <span key={v} className="sx-v"><i className="sx-o" />{v}</span>)}</span>}
                {r.id === 'f0' && <i className="sw-rln" aria-hidden="true" />}
              </div>
            </div>
            {r.id === 'f0' ? <LegendeMalts /> : r.id === 'f1' ? <LegendeHoublons /> : <LegendeLevures />}
          </Fragment>
        ))}
      </div>
      <div ref={bulle} className="l1x-bul" role="button" aria-live="polite" hidden />
    </div>
  );
}

export function MurStock({ items, equipements = [], futs = [], onOpen, onFiltre, filtre, onglet, onOnglet }: Props) {
  const m = useMemo(() => construireMur(items, sourcesDeLApp, equipements, futs), [items, equipements, futs]);
  const sig = signature(m);
  const parRef = useMemo(() => new Map(items.map((i) => [i.ref, i])), [items]);
  const [legende, setLegende] = useState(false);
  return (
    <div className="stock-mur" data-mur-stock>
      <div className="sw-top"><div className="sv-tabs" role="tablist" aria-label="Le stock">
        {([['ing', 'Ingrédients'], ['autres', 'Autres stocks']] as const).map(([id, nom]) => <button key={id} type="button" role="tab" className="sv-tab" data-tab={id} aria-selected={onglet === id} onClick={() => onOnglet(id)}>{nom}</button>)}
      </div></div>
      <div style={{ display: onglet === 'ing' ? '' : 'none' }}>
        <Mur key={sig} m={m} parRef={parRef} onOpen={onOpen} onFiltre={onFiltre} filtre={filtre} ouvertLegende={legende} onLegende={() => setLegende((v) => !v)} visible={onglet === 'ing'} />
      </div>
      {onglet === 'autres' && (
        <div className="sv-autres">
          {m.autres.length === 0 && <div className="sv-ot"><span>Aucun autre stock enregistré</span></div>}
          {m.autres.map((c) => (
            <div key={c.id} className="sv-ot" data-autre={c.id}>
              <span><em>{c.nom}</em> {c.total}</span>
              <span>{c.lignes.length ? c.lignes.map((l, k) => <Fragment key={k}>{k ? ' · ' : ''}<b className={l.alerte ? 'sv-al' : undefined}>{l.n}</b> {l.texte}</Fragment>) : 'rien à signaler'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

