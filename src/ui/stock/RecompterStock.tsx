// Recompter, repris de la maquette choisie sy/fA (q-a3s) : six tuiles de famille, ligne de tri, un rayon par famille avec « 6/15 comptés · 02.11 »,
// bouton « Compter » (mode saisie : « il en reste »). F2 (D396) : on ne tape que ce qui a bougé (chiffre, Entrée : ligne suivante),
// « ✓ le reste du rayon » confirme d'un toucher tout le rayon comme prévu ; « Annuler » sort sans rien écrire ; l'inconnu reste non compté. Les règles sont dans domain/stock/listeFiltres.ts et liste.ts.
import React, { useMemo, useState } from 'react';
import { Wheat, Hop, FlaskConical, Droplets, Package, SprayCan, Check, ArrowUpDown, X } from 'lucide-react';
import type { StockItem } from '../../types';
import type { ArticleACommander } from '../../domain/stockLevel';
import { Units } from '../../services/units';
import { FAMILLES_RECOMPTER, familleRecompter as familleDe, derniersComptages, jourCourt, type FamilleRecompter, type InfoLigne, type MouvementComptage } from '../../domain/stock/liste';
// Les tuiles et titres de la maquette q-a3s disent « Additifs » et « Nettoyage » (la liste de l'Étagère garde le titre long).
const COURT: Record<string, string> = { Malts: 'Malts', Houblons: 'Houblons', Levures: 'Levures', Additifs: 'Additifs', Emballage: 'Emballage', Nettoyage: 'Nettoyage' };
import { LIBELLE_FAMILLE, bilanRayon, comptesRecompter, lireQuantite, trierRecompter, type FiltreListe, type LigneComptee } from '../../domain/stock/listeFiltres';
import './jetons-outils.css';
import './recompter.css';

const ICONES: Record<FamilleRecompter, React.ReactNode> = {
  Malts: <Wheat size={16} aria-hidden="true" />, Houblons: <Hop size={16} aria-hidden="true" />, Levures: <FlaskConical size={16} aria-hidden="true" />,
  Additifs: <Droplets size={16} aria-hidden="true" />, Emballage: <Package size={16} aria-hidden="true" />, Nettoyage: <SprayCan size={16} aria-hidden="true" />,
};

/** La teinte d'un malt par sa couleur, dans les six jetons EBC de la maquette ; inconnue : pastille vide (jamais une couleur inventée). */
const teinteEbc = (ebc: number | undefined): string | null =>
  typeof ebc !== 'number' || !Number.isFinite(ebc) ? null : `var(--l1-ebc-${ebc <= 7 ? 'straw' : ebc <= 15 ? 'gold' : ebc <= 30 ? 'amber' : ebc <= 60 ? 'copper' : ebc <= 200 ? 'brown' : 'stout'})`;

const nb = (n: number) => String(n).replace('.', ',');
const quantiteConnue = (i: StockItem, info: InfoLigne | undefined) => Number.isFinite(i.currentStock) && info?.classe !== 'compter';
/** « 1,2 kg » en deux morceaux : le nombre en gras, l'unité à côté. */
const separe = (i: StockItem): [string, string] => { const m = /^(\S+)\s(.+)$/.exec(Units.format(i.currentStock, i.unit)); return m ? [m[1], m[2]] : [Units.format(i.currentStock, i.unit), '']; };

function Niveau({ info }: { info: InfoLigne | undefined }) {
  if (!info) return null;
  if (info.classe === 'compter') return <span className="sz-r-lv sz-r-lvd" aria-hidden="true"><i /><i /><i /></span>;
  if (info.classe === 'epuise') return <span className="sz-r-lv sz-r-lvx" aria-hidden="true"><i /><i /><i /></span>;
  const n = !info.pot ? 0 : info.pot.rempli < 0.34 ? 1 : info.pot.rempli < 0.67 ? 2 : 3;
  return <span className="sz-r-lv" aria-hidden="true">{[1, 2, 3].map((k) => <i key={k} className={k <= n ? 'sz-r-f' : ''} />)}</span>;
}

function Detail({ item, compte }: { item: StockItem; compte: string | null }) {
  const cpt = compte ? <span className="sz-r-s sz-r-cpt"> · compté {jourCourt(compte)}</span> : null;
  const fam = familleDe(item);
  if (fam === 'Malts') {
    const c = teinteEbc(item.colorEbc);
    return <i className="sz-r-inc">{c ? <span className="sz-r-ebc" style={{ background: c }} /> : <span className="sz-r-ebc sz-r-u" />}<span className="sz-r-m">{c ? `${nb(item.colorEbc!)} EBC` : 'EBC non connu'}</span>{cpt}</i>;
  }
  if (fam === 'Houblons') return <i className="sz-r-inc"><span className="sz-r-m">{typeof item.alphaPct === 'number' ? `α ${nb(item.alphaPct)} %` : 'α non connu'}</span>{cpt}</i>;
  if (fam === 'Levures') return <i className="sz-r-inc"><span className="sz-r-m">{item.yeastLot?.expiresOn ? `DDM ${item.yeastLot.expiresOn.slice(8, 10)}.${item.yeastLot.expiresOn.slice(5, 7)}.${item.yeastLot.expiresOn.slice(0, 4)}` : 'DDM non connue'}</span>{cpt}</i>;
  return <i className="sz-r-inc"><span className="sz-r-s">{item.category}</span>{cpt}</i>;
}

interface Props {
  /** Tout le stock : les comptes des tuiles et des rayons ne bougent ni avec la recherche ni avec le filtre. */
  items: ReadonlyArray<StockItem>;
  /** Les articles que le filtre et la recherche laissent passer (les mêmes que l'étagère). */
  retenus: ReadonlyArray<StockItem>;
  infos: ReadonlyMap<string, InfoLigne>;
  aCommander: ReadonlyMap<string, ArticleACommander>;
  mouvements: ReadonlyArray<MouvementComptage>;
  filtre: FiltreListe | null;
  onFiltre: (f: FiltreListe | null) => void;
  filtreActif: boolean;
  onOuvrir: (item: StockItem) => void;
  /** Écrit les comptages d'un rayon (un mouvement daté chacun) ; rend le nombre écrit. */
  onCompterRayon: (rayon: string, lignes: ReadonlyArray<LigneComptee<StockItem>>) => number;
}

export function RecompterStock({ items, retenus, infos, aCommander, mouvements, filtre, onFiltre, filtreActif, onOuvrir, onCompterRayon }: Props) {
  const comptes = useMemo(() => comptesRecompter(items, mouvements), [items, mouvements]);
  const jours = useMemo(() => derniersComptages(mouvements), [mouvements]);
  // Sens du tri par nom (bouton ⇅ de la maquette q-a3s) : A → Z, ou Z → A ; les épuisés restent en fin de rayon dans les deux sens.
  const [zVersA, setZVersA] = useState(false);
  const parFamille = useMemo(() => {
    const m = new Map<FamilleRecompter, StockItem[]>();
    for (const f of FAMILLES_RECOMPTER) m.set(f, []);
    const ep = (i: StockItem) => infos.get(i.ref)?.etats.includes('epuise') === true;
    const tries = trierRecompter(retenus, infos);
    const ordre = zVersA ? [...tries.filter((i) => !ep(i)).reverse(), ...tries.filter(ep).reverse()] : tries;
    for (const i of ordre) m.get(familleDe(i))!.push(i);
    return m;
  }, [retenus, infos, zVersA]);
  const [saisie, setSaisie] = useState<FamilleRecompter | null>(null);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  // Le bilan du rayon en saisie : tapées (écarts), comme prévu (champ vide, quantité connue), non comptées (inconnue ou illisible).
  const bilan = (f: FamilleRecompter) => bilanRayon(parFamille.get(f) ?? [], valeurs, (i) => quantiteConnue(i, infos.get(i.ref)));
  const sortir = () => { setSaisie(null); setValeurs({}); };
  const confirmer = (f: FamilleRecompter) => {
    const b = bilan(f);
    onCompterRayon(COURT[f], [...b.tapes, ...b.prevus]);
    sortir();
  };
  // Entrée passe à la ligne suivante du rayon ; à la dernière, le clavier se ferme (jamais pendant une composition IME).
  const entree = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const champs = [...(e.currentTarget.closest('section')?.querySelectorAll<HTMLInputElement>('input[data-compte]') ?? [])];
    const suivant = champs[champs.indexOf(e.currentTarget) + 1];
    if (suivant) suivant.focus(); else e.currentTarget.blur();
  };

  return (
    <div className="stock-recompter sz-r-sc" data-testid="recompter">
      <div className="sz-r-som" role="group" aria-label="Familles">
        {FAMILLES_RECOMPTER.map((f, k) => {
          const c = comptes[f];
          return (
            <button key={f} type="button" data-fam-btn={k} className={filtre === f ? 'sz-r-on' : ''} aria-pressed={filtre === f} aria-label={`${LIBELLE_FAMILLE[f]} : ${c.total} article${c.total > 1 ? 's' : ''}, ${c.compte} compté${c.compte > 1 ? 's' : ''}`}
              onClick={() => onFiltre(filtre === f ? null : f)}>
              <span>{ICONES[f]}<em>{COURT[f]}</em><b className="sz-r-m">{c.total}</b></span>
              <small><i><i style={{ width: `${c.total ? Math.round((100 * c.compte) / c.total) : 0}%` }} /></i><span className="sz-r-m">{c.compte}/{c.total}</span> comptés</small>
            </button>
          );
        })}
      </div>
      <div className="sz-r-so"><p>Trié par <b>nom, {zVersA ? 'Z → A' : 'A → Z'}</b> · épuisés en fin de rayon</p>
        <button type="button" aria-label={zVersA ? "Inverser l'ordre : nom A → Z" : "Inverser l'ordre : nom Z → A"} aria-pressed={zVersA} onClick={() => setZVersA((v) => !v)}><ArrowUpDown size={16} aria-hidden="true" /></button></div>
      <div className="sz-r-ls">
        {FAMILLES_RECOMPTER.map((f, k) => {
          const lignes = parFamille.get(f) ?? [];
          if (lignes.length === 0) return null;
          const c = comptes[f];
          const enSaisie = saisie === f;
          const epuises = lignes.filter((i) => infos.get(i.ref)?.etats.includes('epuise')).length;
          const premierEpuise = lignes.findIndex((i) => infos.get(i.ref)?.etats.includes('epuise'));
          return (
            <section key={f} className="sz-r-ray" data-sec={k} aria-label={LIBELLE_FAMILLE[f]}>
              <header className="sz-r-rh">
                <span className="sz-r-ti">{ICONES[f]}</span>
                <div>
                  <h2>{COURT[f]} <small>{filtreActif ? `${lignes.length} sur ${c.total}` : c.total}</small></h2>
                  <p className="sz-r-mt">
                    {!enSaisie && <span className="sz-r-tk" aria-hidden="true">{items.filter((i) => familleDe(i) === f).slice(0, 40).map((i) => <i key={i.ref} className={jours.has(i.ref) ? 'sz-r-f' : ''} />)}</span>}
                    <span><b className="sz-r-m">{c.compte}</b>/<span className="sz-r-m">{c.total}</span> comptés{c.dernier && !enSaisie ? <> · <span className="sz-r-m">{jourCourt(c.dernier)}</span></> : ''}</span>
                  </p>
                </div>
                {enSaisie
                  ? <button type="button" className="sz-r-cb sz-r-an" onClick={sortir}><X size={16} aria-hidden="true" />Annuler</button>
                  : <button type="button" className="sz-r-cb" onClick={() => { setSaisie(f); setValeurs({}); }}><Check size={16} aria-hidden="true" />Compter</button>}
              </header>
              {!enSaisie && <div className="sz-r-th" aria-hidden="true"><span>Article</span><span>En stock</span><span>Fournisseur</span><span>Seuil</span><span>Compté</span></div>}
              {lignes.map((item, idx) => {
                const info = infos.get(item.ref);
                const connue = quantiteConnue(item, info);
                const cmd = aCommander.get(item.ref);
                const [n, u] = connue ? separe(item) : ['', ''];
                const compte = jours.get(item.ref) ?? null;
                const epl = idx === premierEpuise && epuises > 0 ? <p className="sz-r-epl">épuisés · {epuises}</p> : null;
                if (enSaisie) {
                  const v = valeurs[item.ref] ?? '';
                  const lu = lireQuantite(v);
                  const ecart = lu !== null && connue ? Math.round((lu - item.currentStock) * 1000) / 1000 : 0;
                  const dernier = idx === lignes.length - 1;
                  return (
                    <React.Fragment key={item.ref}>
                      {epl}
                      <div className={`sz-r-row sz-r-cr${lu !== null ? ' sz-r-fait' : ''}`}>
                        <span className={`sz-r-ck${lu !== null ? ' sz-r-ok' : ''}`} aria-hidden="true">{lu !== null && <Check size={12} />}</span>
                        <span className="sz-r-nm"><b>{item.name}</b><i>{connue ? <>prévu <span className="sz-r-m">{n} {u}</span>{ecart !== 0 && <b className="sz-r-ec sz-r-m"> {ecart > 0 ? '+' : '−'}{nb(Math.abs(ecart))}</b>}</> : 'quantité inconnue · reste non compté'}</i></span>
                        <label className="sz-r-in"><span>il en reste</span>
                          <input type="text" inputMode="decimal" autoComplete="off" data-compte enterKeyHint={dernier ? 'done' : 'next'} placeholder={connue ? nb(item.currentStock) : '?'} aria-label={`Il en reste, ${item.name}`} value={v} onKeyDown={entree} onChange={(e) => setValeurs((p) => ({ ...p, [item.ref]: e.target.value }))} />
                          <small>{item.unit}</small></label>
                        <button type="button" className={`sz-r-ju${connue && v === nb(item.currentStock) ? ' sz-r-on' : ''}`} disabled={!connue} aria-label={`${item.name} : la quantité en stock est juste`}
                          onClick={() => setValeurs((p) => ({ ...p, [item.ref]: nb(item.currentStock) }))}><Check size={18} aria-hidden="true" /></button>
                      </div>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={item.ref}>
                    {epl}
                    <button type="button" className="sz-r-row" data-ligne data-et={info?.classe} onClick={() => onOuvrir(item)}>
                      <span className="sz-r-nm"><b>{item.name}</b>{connue ? <Detail item={item} compte={compte} /> : <i className="sz-r-inc"><span className="sz-r-m">à compter</span> · quantité inconnue</i>}</span>
                      <span className="sz-r-q">
                        {connue && <span><b className="sz-r-m">{n}</b><small className="sz-r-m">{u}</small></span>}
                        <i>
                          {info?.etats.includes('manque') && cmd && <b>manque {cmd.missing > 0 ? <><span className="sz-r-m">{cmd.auMoins ? 'au moins ' : ''}{Units.format(cmd.missing, item.unit)}</span></> : '?'}</b>}
                          <Niveau info={info} />
                        </i>
                      </span>
                      <span className="sz-r-xl">{item.supplier || '—'}</span>
                      <span className="sz-r-xl sz-r-m">{typeof item.minStock === 'number' && item.minStock > 0 ? Units.format(item.minStock, item.unit) : '—'}</span>
                      <span className="sz-r-xl sz-r-m">{compte ? jourCourt(compte) : '—'}</span>
                    </button>
                  </React.Fragment>
                );
              })}
              {enSaisie && (() => {
                const b = bilan(f);
                const n = b.tapes.length + b.prevus.length;
                const morceaux = [
                  b.ecarts > 0 && `${b.ecarts} écart${b.ecarts > 1 ? 's' : ''}`,
                  b.prevus.length > 0 && `${b.prevus.length} comme prévu`,
                  b.nonComptes.length > 0 && `${b.nonComptes.length} non compté${b.nonComptes.length > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' · ');
                return (
                  <div className="sz-r-pied">
                    <p className="sz-r-bil" aria-live="polite">{morceaux || 'Rien à compter dans ce rayon'}</p>
                    <button type="button" className="sz-r-fin sz-r-tout" disabled={n === 0} onClick={() => confirmer(f)}
                      aria-label={b.prevus.length > 0 ? `Compter le reste du rayon comme prévu : ${n} article${n > 1 ? 's' : ''}` : undefined}>
                      <Check size={18} aria-hidden="true" />{b.prevus.length > 0 ? <>Le reste du rayon comme prévu <span className="sz-r-m">· {n}</span></> : <>Enregistrer <span className="sz-r-m">{n}</span> comptage{n > 1 ? 's' : ''}</>}
                    </button>
                  </div>
                );
              })()}
            </section>
          );
        })}
        {retenus.length === 0 && <p className="py-6 text-center text-sm" role="status">Aucun article ne correspond.</p>}
      </div>
    </div>
  );
}
