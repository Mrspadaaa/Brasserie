// La feuille « Filtrer les brassins » d'e6c : des filtres qui comptent. Chaque puce porte le nombre de brassins qu'elle rendrait,
// les autres critères posés (facettes) ; un critère qui vide la liste se retire d'un toucher, avec ce que la liste devient.
import React, { useEffect, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { CatalogEntry, CatalogFilters } from '../../../domain/productionCatalog';
import type { KegItem } from '../../../types';
import { CATALOG_FOLDER_LABELS, inCatalogFolder, type CatalogFolder } from '../../../domain/catalogOrganization';
import { Sheet } from '../../Sheet';
import { bornes as bornesPeriode, depuisJours, enPeriode, moisDe, serialiser, type Periode } from '../../../components/periode/periode';
import {
  AVANCEMENTS,
  appliquer,
  bornesAlcool,
  comptesAvancement,
  comptesChamp,
  comptesSiRetire,
  criteresPoses,
  dansLeDossier,
  carteModel,
  retirerCritere,
  styleCourt,
  titreExclusion,
  type Avancement,
  type Contexte,
  type Criteres,
  type TonCarte
} from './listeModel';
import './liste.css';
import { refCurseurNatif } from '../../geste';

export const OPTIONS_TRI: { value: CatalogFilters['sort']; label: string }[] = [
  { value: 'work', label: 'À suivre d’abord' },
  { value: 'recent', label: 'Date ↓' },
  { value: 'oldest', label: 'Date ↑' },
  { value: 'name', label: 'Nom A–Z' },
  { value: 'volume', label: 'Volume ↓' },
  { value: 'abv', label: 'Alcool ↓' },
  { value: 'ibu', label: 'IBU cible ↓' },
  { value: 'color', label: 'Couleur EBC ↓' },
  { value: 'activity', label: 'Avancement' }
];
export const libelleTri = (s: CatalogFilters['sort']) => (OPTIONS_TRI.find((o) => o.value === s)?.label ?? 'Trier').replace('À suivre d’abord', 'À suivre d’abord');

export function SelectTri({ value, onChange, court, classe }: { value: CatalogFilters['sort']; onChange: (s: CatalogFilters['sort']) => void; court?: boolean; classe: string }) {
  return (
    <label className={classe}>
      <ArrowUpDown aria-hidden />
      {court ? 'À suivre' : libelleTri(value)}
      <select aria-label="Trier les brassins" value={value} onChange={(e) => onChange(e.target.value as CatalogFilters['sort'])}>
        {OPTIONS_TRI.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export const COULEUR_TON: Record<TonCarte, string> = {
  cuve: '--hop', garde: '--water', brasser: '--attention', retard: '--alert', cond: '--lst-cuivre', fin: '--lst-fin', annule: '--lst-fin'
};
const ETIQ: Record<TonCarte, string> = { cuve: 'en cuve', garde: 'garde', brasser: 'à brasser', retard: 'en retard', cond: 'cond.', fin: 'terminé', annule: 'annulé' };
const POINT_AVANCEMENT: Record<Avancement, string> = {
  cuve: 'rgb(var(--hop))', brasser: 'rgb(var(--attention))', conditionnes: 'rgb(var(--lst-cuivre))', termines: 'rgb(var(--lst-fin))',
  mesures: 'rgb(var(--hop))', favoris: 'rgb(var(--lst-or))', notes: 'rgb(var(--lst-cuivre))'
};
/** Le nom du brassin dans la bande : entier s'il est court, sinon son style abrégé (« NEIPA ») ; jamais coupé par « … ». */
const nomCourt = (nom: string, style: string) => (nom.length <= 9 || !style.trim() ? nom : styleCourt(style));
const bascule = (liste: string[], v: string) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
const fr = (n: number) => n.toFixed(1).replace('.', ',');

// Le × du Sheet reçoit le focus à l'ouverture : l'anneau (focus-visible) ne doit se voir qu'au clavier. On retient la dernière modalité d'entrée.
let dernierClavier = false;
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => { dernierClavier = true; }, true);
  window.addEventListener('pointerdown', () => { dernierClavier = false; }, true);
}

export interface FeuilleProps {
  open: boolean;
  onClose: () => void;
  ctx: Contexte;
  resultats: CatalogEntry[];
  onCriteres: (c: Criteres) => void;
  onFiltres: (f: CatalogFilters) => void;
  onToutEffacer: () => void;
  onOuvrir: (e: CatalogEntry) => void;
  /** Stock de fûts (tailles) pour la ligne de la carte. */
  kegs?: KegItem[];
  /** Ouvre les analyses des brassins (le bouton à barres a quitté la ligne tri / période). */
  onBilan?: () => void;
  /** Couleurs de familles d'arômes par houblon (source : radar du catalogue) ; absent = aucune bande. */
  couleursHoublon: Record<string, string[]>;
  /** La feuille écrit la période de l'application (celle de l'en-tête) : il n'y en a qu'une. Absent : la section se lit seulement. */
  onPeriode?: (p: Periode) => void;
}

function Puce({ texte, n, on, mauvaise, bandes, onClick, plus }: { texte: string; n?: number; on?: boolean; mauvaise?: boolean; bandes?: string[]; onClick: () => void; plus?: boolean }) {
  return (
    <button
      type="button"
      className={`lst-puce${n === 0 && !on ? ' lst-zero' : ''}${mauvaise ? ' lst-bad' : ''}${plus ? ' lst-plus' : ''}`}
      aria-pressed={plus ? undefined : !!on}
      onClick={onClick}
    >
      {bandes && bandes.length > 0 && <span className="lst-fam" aria-hidden>{bandes.map((c, i) => <i key={i} style={{ background: c }} />)}</span>}
      {texte}
      {n !== undefined && <small>{n}</small>}
    </button>
  );
}

export function FeuilleFiltres(p: FeuilleProps) {
  const { ctx, resultats, onCriteres, onFiltres } = p;
  const c = ctx.criteres;
  const [plusHoublons, setPlusHoublons] = useState(false);
  const [maltLevure, setMaltLevure] = useState(false);
  const [autres, setAutres] = useState(() => ctx.criteres.avancement.includes('notes'));
  const total = dansLeDossier(ctx).length;
  // Sans clavier, pas d'anneau sur le × focalisé à l'ouverture ; la première touche le rend.
  useEffect(() => {
    if (!p.open || dernierClavier) return;
    let cadre: HTMLElement | null = null;
    const poser = () => { cadre = document.querySelector<HTMLElement>('.lst-sheet'); cadre?.classList.add('lst-ptr'); return !!cadre; };
    // Le Sheet se monte dans un portail, un instant après l'ouverture : on réessaie un court moment.
    let essais = 0;
    const timer = window.setInterval(() => { if (poser() || ++essais > 20) window.clearInterval(timer); }, 30);
    const quitter = () => { cadre?.classList.remove('lst-ptr'); };
    window.addEventListener('keydown', quitter, { once: true, capture: true });
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', quitter, true); cadre?.classList.remove('lst-ptr'); };
  }, [p.open]);
  const poses = criteresPoses(c, ctx.filtres.search);
  const n = resultats.length;
  const vide = n === 0 && poses.length > 0;
  const compAv = comptesAvancement(ctx);
  const styles = comptesChamp(ctx, 'style');
  const houblons = comptesChamp(ctx, 'houblon');
  const malts = comptesChamp(ctx, 'malt');
  const levures = comptesChamp(ctx, 'levure');
  const alcool = bornesAlcool(ctx);
  const f = ctx.filtres;
  const set = (patch: Partial<Criteres>) => onCriteres({ ...c, ...patch });
  // Le filtre posé se nomme : « 2 en cuve, sur 5 » ; sans filtre, « 5 brassins sur 5 ».
  const nomFiltre = poses.length === 0 ? (n > 1 ? 'brassins' : 'brassin')
    : [...poses].sort((a, b) => Number(a.groupe === 'avancement') - Number(b.groupe === 'avancement'))
        .map((x) => (x.groupe === 'avancement' ? x.label.charAt(0).toLocaleLowerCase('fr') + x.label.slice(1) : x.groupe === 'style' ? styleCourt(x.label) : x.label)).join(' ');
  const lead = poses.length === 0 ? ['' + total, `${total > 1 ? 'brassins' : 'brassin'} sur ${total}`] : vide ? ['0', `pour ${nomFiltre}`] : ['' + n, `${nomFiltre}, sur ${total}`];
  // La bande montre tous les brassins du dossier, dans l'ordre choisi ; ceux hors des critères s'éteignent.
  const ordre = appliquer({
    ...ctx,
    criteres: { ...c, avancement: [], styles: [], houblons: [], malts: [], levures: [], alcool: undefined },
    periode: { genre: 'tout' },
    filtres: { ...f, search: '', volumeMin: '', volumeMax: '', ibuMin: '', ibuMax: '', colorMin: '', colorMax: '' }
  });
  const ids = new Set(resultats.map((e) => e.id));
  const bande = ordre.slice(0, 8);
  const pourquoi = vide ? comptesSiRetire(ctx) : [];
  const nHoublonsVus = plusHoublons ? houblons.length : 6;
  type ModePeriode = 'mois' | 'annee' | 'toutes' | 'dates';
  const periodeSeg: { id: ModePeriode; label: string }[] = [
    { id: 'mois', label: 'Ce mois' }, { id: 'annee', label: 'Cette année' }, { id: 'toutes', label: 'Toutes' }, { id: 'dates', label: 'Dates…' }
  ];
  const maintenant = new Date(ctx.now ?? Date.now());
  const periodeApp = enPeriode(ctx.periode, maintenant);
  const modePeriode: ModePeriode = periodeApp.genre === 'tout' ? 'toutes'
    : periodeApp.genre === 'mois' && serialiser(periodeApp) === serialiser(moisDe(maintenant)) ? 'mois'
    : periodeApp.genre === 'annee' && periodeApp.annee === maintenant.getFullYear() ? 'annee' : 'dates';
  const [datesVoulues, setDatesVoulues] = useState(false);
  const bornesApp = bornesPeriode(periodeApp);
  const [du, setDu] = useState(bornesApp.du ?? ''), [au, setAu] = useState(bornesApp.au ?? '');
  const cle = serialiser(periodeApp);
  useEffect(() => { setDu(bornesApp.du ?? ''); setAu(bornesApp.au ?? ''); }, [cle]); // eslint-disable-line react-hooks/exhaustive-deps
  const segmentDates = modePeriode === 'dates' || datesVoulues;
  const poserPeriode = (mode: ModePeriode) => {
    setDatesVoulues(mode === 'dates');
    if (mode === 'mois') p.onPeriode?.(moisDe(maintenant));
    else if (mode === 'annee') p.onPeriode?.({ genre: 'annee', annee: maintenant.getFullYear() });
    else if (mode === 'toutes') p.onPeriode?.({ genre: 'tout' });
  };
  const poserDates = (nouveauDu: string, nouvelAu: string) => {
    setDu(nouveauDu); setAu(nouvelAu);
    if (nouveauDu && nouvelAu && nouveauDu <= nouvelAu) p.onPeriode?.(depuisJours(nouveauDu, nouvelAu));
  };
  const [lo, hi] = c.alcool ?? (alcool ? [alcool.min, alcool.max] : [0, 0]);
  // L'étiquette du milieu dit l'étendue des brassins (« 5,8 – 6,1 ») tant que rien n'est posé, puis la plage posée.
  const [eLo, eHi] = c.alcool ?? alcool?.etendue ?? [0, 0];
  const pct = (v: number) => (alcool ? ((v - alcool.min) / (alcool.max - alcool.min)) * 100 : 0);
  const posAlcool = (a: number, b: number) => {
    if (!alcool) return;
    const nlo = Math.max(alcool.min, Math.min(a, b)), nhi = Math.min(alcool.max, Math.max(a, b));
    set({ alcool: nlo <= alcool.min + 1e-9 && nhi >= alcool.max - 1e-9 ? undefined : [Math.round(nlo * 10) / 10, Math.round(nhi * 10) / 10] });
  };
  const dossiers = Object.keys(CATALOG_FOLDER_LABELS) as CatalogFolder[];
  const bornes: { k: 'volume' | 'ibu' | 'color'; label: string; unite: string }[] = [
    { k: 'volume', label: 'Volume', unite: 'L' }, { k: 'ibu', label: 'IBU cible', unite: '' }, { k: 'color', label: 'Couleur', unite: 'EBC' }
  ];
  const champBorne = (k: string, bout: 'Min' | 'Max') => `${k}${bout}` as keyof CatalogFilters;

  return (
    <Sheet
      open={p.open}
      onClose={p.onClose}
      title="Filtrer les brassins"
      className="lst-sheet lg:max-w-xl lg:mx-auto"
      footer={
        <div className="lst-pied">
          <SelectTri classe="lst-sel" value={f.sort} onChange={(sort) => onFiltres({ ...f, sort })} court />
          {vide ? (
            <button type="button" className="lst-btn lst-btn-primaire" onClick={p.onToutEffacer}>Tout effacer · {total}</button>
          ) : (
            <button type="button" className="lst-btn lst-btn-primaire" onClick={p.onClose}>Voir les {n}</button>
          )}
        </div>
      }
    >
      <div className="lst-feuille">
        <div className="lst-hd">
          <div className="lst-big"><span className="lst-reading">{lead[0]}</span><span className="lst-title">{lead[1]}</span></div>
          {!vide && (
            <button type="button" className="lst-lien" disabled={!poses.length} style={poses.length ? undefined : { color: 'rgb(var(--cave-texte-400))' }} onClick={p.onToutEffacer}>
              Tout effacer
            </button>
          )}
        </div>

        <div className="lst-strip" aria-label="Les brassins du dossier">
          {bande.map((e) => {
            const m = carteModel(e, ctx.now, p.kegs);
            const v = COULEUR_TON[m.ton];
            return (
              <div key={e.id} className={`lst-tok${ids.has(e.id) ? '' : ' lst-off'}`} style={{ background: `rgb(var(${v}) / .18)`, borderColor: `rgb(var(${v}) / .6)` }}>
                <b title={m.nom}>{nomCourt(m.nom, m.style)}</b>
                <span>{ETIQ[m.ton]}</span>
              </div>
            );
          })}
        </div>

        {!vide && poses.length > 0 && (
          <div className="lst-panneau lst-res" aria-label="Brassins retenus">
            {resultats.slice(0, 6).map((e) => {
              const m = carteModel(e, ctx.now, p.kegs);
              return (
                <button key={e.id} type="button" onClick={() => p.onOuvrir(e)}>
                  <i style={{ background: `rgb(var(${COULEUR_TON[m.ton]}))` }} />
                  <b>{m.nom}</b>
                  <span className="lst-ref">{m.lot}</span>
                  <span className="lst-reading">{m.cle}</span>
                </button>
              );
            })}
          </div>
        )}

        {vide && (
          <div className="lst-panneau lst-why">
            <h2 className="lst-title">{titreExclusion(ctx)}</h2>
            {pourquoi.map(({ critere, n: k }) => (
              <button key={critere.id} type="button" onClick={() => {
                const r = retirerCritere(c, f.search, critere.id);
                onCriteres(r.criteres);
                if (r.recherche !== f.search) onFiltres({ ...f, search: r.recherche });
              }}>
                Retirer « {critere.label} »<span className="lst-reading">{k}</span>
              </button>
            ))}
          </div>
        )}

        <div className="lst-f">
          <h3 className="lst-section">Avancement</h3>
          <div className="lst-tiles">
            {AVANCEMENTS.filter((a) => a.id !== 'notes').map((a) => {
              const on = c.avancement.includes(a.id);
              return (
                <button key={a.id} type="button" className={`lst-tile${compAv[a.id] === 0 && !on ? ' lst-zero' : ''}`} aria-pressed={on} onClick={() => set({ avancement: bascule(c.avancement, a.id) as Avancement[] })}>
                  <b>{a.label}</b>
                  <span>{compAv[a.id]}</span>
                  <i style={{ background: POINT_AVANCEMENT[a.id] }} aria-hidden />
                </button>
              );
            })}
          </div>
        </div>

        <div className="lst-f">
          <h3 className="lst-section">Style</h3>
          <div className="lst-chips">
            {styles.map((s) => (
              <Puce key={s.valeur} texte={styleCourt(s.valeur)} n={s.n} on={c.styles.includes(s.valeur)} mauvaise={c.styles.includes(s.valeur) && s.n === 0} onClick={() => set({ styles: bascule(c.styles, s.valeur) })} />
            ))}
            {!styles.length && <p className="lst-note">Aucun style renseigné sur ces brassins.</p>}
          </div>
        </div>

        <div className="lst-f">
          <h3 className="lst-section">Houblon<button type="button" aria-expanded={maltLevure} onClick={() => setMaltLevure(!maltLevure)}>malt · levure {maltLevure ? '‹' : '›'}</button></h3>
          <div className="lst-chips">
            {houblons.slice(0, nHoublonsVus).map((h) => (
              <Puce key={h.valeur} texte={h.valeur} n={h.n} bandes={p.couleursHoublon[h.valeur]} on={c.houblons.includes(h.valeur)} mauvaise={c.houblons.includes(h.valeur) && h.n === 0} onClick={() => set({ houblons: bascule(c.houblons, h.valeur) })} />
            ))}
            {houblons.length > 6 && <Puce plus texte={plusHoublons ? 'moins' : '+ autres'} onClick={() => setPlusHoublons(!plusHoublons)} />}
            {!houblons.length && <p className="lst-note">Aucun houblon renseigné sur ces brassins.</p>}
          </div>
        </div>

        {maltLevure && (
          <>
            <div className="lst-f">
              <h3 className="lst-section">Malt</h3>
              <div className="lst-chips">
                {malts.map((m) => <Puce key={m.valeur} texte={m.valeur} n={m.n} on={c.malts.includes(m.valeur)} mauvaise={c.malts.includes(m.valeur) && m.n === 0} onClick={() => set({ malts: bascule(c.malts, m.valeur) })} />)}
                {!malts.length && <p className="lst-note">Aucun malt renseigné.</p>}
              </div>
            </div>
            <div className="lst-f">
              <h3 className="lst-section">Levure</h3>
              <div className="lst-chips">
                {levures.map((m) => <Puce key={m.valeur} texte={m.valeur} n={m.n} on={c.levures.includes(m.valeur)} mauvaise={c.levures.includes(m.valeur) && m.n === 0} onClick={() => set({ levures: bascule(c.levures, m.valeur) })} />)}
                {!levures.length && <p className="lst-note">Aucune levure renseignée.</p>}
              </div>
            </div>
          </>
        )}

        <div className="lst-f">
          <h3 className="lst-section">Alcool{alcool && alcool.sansValeur > 0 && <small>{alcool.sansValeur} sans valeur</small>}</h3>
          {alcool ? (
            <div className="lst-panneau lst-range">
              <div className="lst-track">
                <div className="lst-selzone" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
                {alcool.points.map((pt) => {
                  const e = ctx.entries.find((x) => x.id === pt.id)!;
                  const m = carteModel(e, ctx.now);
                  const prov = pt.provisoire;
                  return <div key={pt.id} className={`lst-dot${prov ? ' lst-prov' : ''}`} style={{ left: `${pct(pt.abv)}%`, background: `rgb(var(${COULEUR_TON[m.ton]}))` }} title={`${m.nom} · ${fr(pt.abv)} %${prov ? ' (provisoire)' : ''}`} />;
                })}
              </div>
              <div className="lst-rin">
                <input ref={refCurseurNatif} type="range" aria-label="Alcool minimum" min={alcool.min} max={alcool.max} step={0.1} value={lo} onChange={(e) => posAlcool(Number(e.target.value), hi)} />
                <input ref={refCurseurNatif} type="range" aria-label="Alcool maximum" min={alcool.min} max={alcool.max} step={0.1} value={hi} onChange={(e) => posAlcool(lo, Number(e.target.value))} />
              </div>
              <span className="lst-lab" style={{ left: 22 }}>{fr(alcool.min)} %</span>
              <span className="lst-lab" style={{ left: `calc(22px + ${(pct(eLo) + pct(eHi)) / 200} * (100% - 44px))`, transform: 'translateX(-50%)' }}>{fr(eLo)} – {fr(eHi)}</span>
              <span className="lst-lab" style={{ right: 22 }}>{fr(alcool.max)} %</span>
            </div>
          ) : (
            <p className="lst-note">Aucun alcool mesuré sur ces brassins : la plage apparaît dès qu’un brassin en a un.</p>
          )}
        </div>

        <div className="lst-f">
          <h3 className="lst-section">Période</h3>
          <div className="lst-segments" role="group" aria-label="Période">
            {periodeSeg.map((s) => (
              <button key={s.id} type="button" aria-pressed={s.id === 'dates' ? segmentDates : !datesVoulues && modePeriode === s.id} onClick={() => poserPeriode(s.id)}>{s.label}</button>
            ))}
          </div>
          {segmentDates && (
            <div className="lst-dates">
              <label>Du<input type="date" value={du} onChange={(e) => poserDates(e.target.value, au)} /></label>
              <label>Au<input type="date" value={au} onChange={(e) => poserDates(du, e.target.value)} /></label>
            </div>
          )}
          <button type="button" role="switch" aria-checked={c.periode.enCours} className="lst-panneau lst-tg" onClick={() => set({ periode: { ...c.periode, enCours: !c.periode.enCours } })}>
            <span className="lst-pt" aria-hidden />Les en cours, toujours<span className="lst-sw" aria-hidden />
          </button>
          <p className="lst-note">Même période que l’en-tête : la régler ici la règle partout dans l’app.</p>
        </div>

        <div className="lst-f">
          <h3 className="lst-section">Dossier</h3>
          <div className="lst-segments" role="group" aria-label="Dossier">
            {dossiers.map((d) => (
              <button key={d} type="button" aria-pressed={f.folder === d} onClick={() => onFiltres({ ...f, folder: d })}>
                {CATALOG_FOLDER_LABELS[d]} · {ctx.entries.filter((e) => inCatalogFolder(e, d)).length}
              </button>
            ))}
          </div>
        </div>

        {p.onBilan && (
          <div className="lst-f">
            <button type="button" className="lst-lien lst-analyses" onClick={() => { p.onClose(); p.onBilan?.(); }}>Voir les analyses des brassins ›</button>
          </div>
        )}

        <div className="lst-f">
          <h3 className="lst-section"><button type="button" style={{ marginLeft: 0, color: 'rgb(var(--cave-texte-50))', fontWeight: 600, fontSize: 16 }} aria-expanded={autres} onClick={() => setAutres(!autres)}>{autres ? '– autres critères' : '+ autres critères'}</button></h3>
          {autres && (
            <div className="lst-chips" style={{ marginBottom: 10 }}>
              <Puce texte="Notes à compléter" n={compAv.notes} on={c.avancement.includes('notes')} onClick={() => set({ avancement: bascule(c.avancement, 'notes') as Avancement[] })} />
            </div>
          )}
          {autres && (
            <div className="lst-bornes">
              {bornes.map((b) => (
                <React.Fragment key={b.k}>
                  <label>{b.label} min{b.unite && ` (${b.unite})`}
                    <input type="text" inputMode="decimal" value={String(f[champBorne(b.k, 'Min')] ?? '')} onChange={(e) => onFiltres({ ...f, [champBorne(b.k, 'Min')]: e.target.value })} />
                  </label>
                  <label>{b.label} max{b.unite && ` (${b.unite})`}
                    <input type="text" inputMode="decimal" value={String(f[champBorne(b.k, 'Max')] ?? '')} onChange={(e) => onFiltres({ ...f, [champBorne(b.k, 'Max')]: e.target.value })} />
                  </label>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
