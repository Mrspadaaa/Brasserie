// La ligne d'Autres stocks, version A (D423, D424 ; liste du port : Brasserie/work/missions/2026-11-21-stock-maquettes/A-PORT-LISTE.md, bloc 6).
// Même ligne que l'étagère (LigneStock) ; ajoute : la 2e ligne « état · seuil », la pastille utile, la ligne qui s'ouvre sur place
// avec le seuil réglable (champ texte inputMode="decimal", jamais type="number"). Rien n'est inventé : sans besoin ni dose connus, pas de pastille.
import React, { useState } from 'react';
import { LigneStock } from './LigneStock';
import { COLONNES_AUTRES, colonneAutre, etatEtSeuil, pastilleAutre, quantitePiece, type BesoinBrassin } from '../../domain/stock/murAutres';
import { familleRecompter } from '../../domain/stock/liste';
import { estFamilleAutre } from '../../domain/stock/murDonnees';
import { StorageService } from '../../services/storage';
import type { StockItem } from '../../types';
import './ligneAutre.css';

type Props = React.ComponentProps<typeof LigneStock>;
/** La barre de table : pleine à 1,6 × le seuil (l'en-tête dit « 0 · seuil · 1,6× »). */
export const ECHELLE_SEUIL = 1.6;
const nf = (n: number) => (Math.round(n * 1000) / 1000).toLocaleString('fr-FR');
const jourMois = (d: string | null) => { const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null; return m ? `${m[3]}.${m[2]}` : null; };

/** Le pas de − / + : 10 % du seuil, arrondi à un chiffre significatif (1 sans seuil). */
export function pasSeuil(seuil: number): number {
  if (!(seuil > 0)) return 1;
  const p = seuil * 0.1; const m = Math.pow(10, Math.floor(Math.log10(p)));
  return Math.max(m, Math.round(p / m) * m);
}
const lireNombre = (t: string): number | null => { const v = parseFloat(t.replace(/\s/g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };

function enregistrerSeuil(item: StockItem, v: number) {
  const type = StorageService.getStocks().cleaning.some((c) => c.ref === item.ref) ? 'cleaning' : 'rawMaterials';
  StorageService.saveStockItemFiche(type, item, { ...item, minStock: Math.max(0, v) });
}

function ReglageSeuil({ item }: { item: StockItem }) {
  const s = item.minStock != null && item.minStock > 0 ? item.minStock : 0;
  const [t, setT] = useState(s > 0 ? nf(s) : '');
  const valider = () => { const v = t.trim() === '' ? 0 : lireNombre(t); if (v != null && v !== s) enregistrerSeuil(item, v); };
  const pas = (d: number) => { const v = Math.max(0, Math.round((s + d * pasSeuil(s)) * 1000) / 1000); setT(v > 0 ? nf(v) : ''); enregistrerSeuil(item, v); };
  return (
    <div className="la-seuil" data-seuil-reglage>
      <span className="la-lib">seuil</span>
      <button type="button" className="la-pm" aria-label={`Baisser le seuil de ${item.name}`} onClick={() => pas(-1)}>−</button>
      <input type="text" inputMode="decimal" autoComplete="off" className="la-in" aria-label={`Seuil de ${item.name}`} placeholder="aucun" value={t}
        onChange={(e) => setT(e.target.value)} onBlur={valider} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
      <span className="la-un">{item.unit}</span>
      <button type="button" className="la-pm" aria-label={`Monter le seuil de ${item.name}`} onClick={() => pas(1)}>+</button>
    </div>
  );
}

export const LigneAutre: React.FC<Props> = (p) => {
  const { item, cmd, onOpen } = p;
  const [ouvert, setOuvert] = useState(false);
  const famille = familleRecompter(item);
  const def = estFamilleAutre(famille) ? COLONNES_AUTRES[famille].find((c) => c.id === colonneAutre(item, famille)) : undefined;
  const k = def?.fill ?? '#9a958b';
  // Le besoin vient des brassins prévus (sources de « À commander ») ; la dose par brassin n'existe pas dans les données : jamais devinée.
  const src = cmd && cmd.missing > 0 ? cmd.sources.find((s) => s.genre === 'brassin' && s.quantite != null) : undefined;
  const besoin: BesoinBrassin | null = cmd && src ? { manque: cmd.missing, unite: item.unit, brassin: `${src.nom}${jourMois(src.date) ? ` ${jourMois(src.date)}` : ''}` } : null;
  const pastille = pastilleAutre({ besoin });
  const e = etatEtSeuil(item);
  const seuilN = item.minStock != null && item.minStock > 0 ? item.minStock : null;
  // La barre de la table : le stock contre 1,6 × le seuil (le seuil à 62,5 %) ; sans seuil ou sans quantité, pas de barre (jamais un 0 inventé).
  const barre = seuilN != null && Number.isFinite(item.currentStock) && item.currentStock > 0 ? { x: Math.min(1, item.currentStock / (ECHELLE_SEUIL * seuilN)), coupe: null } : null;
  const sousNom = (
    <>
      <span className="la-n2">{e.mot && <b className={`la-mot la-m-${e.mot === 'à compter' ? 'compter' : e.mot === 'épuisé' ? 'epuise' : e.mot === 'bas' ? 'bas' : 'assez'}`}>{e.mot}</b>}<span className="la-sl">{e.mot ? ' · ' : ''}{e.seuil}</span></span>
      {pastille && <span className="la-pastille"><i style={{ background: k }} aria-hidden="true" />{pastille}</span>}
    </>
  );
  const fournisseur = [item.supplier?.trim(), item.pricePerUnit != null && item.pricePerUnit > 0 ? `${nf(item.pricePerUnit)} CHF le ${item.unit}` : ''].filter(Boolean).join(' · ');
  return (
    <div className="la-l" data-ouvert={ouvert || undefined} data-ligne-autre style={{ ['--l1-k' as string]: k } as React.CSSProperties}>
      <LigneStock {...p} onOpen={() => setOuvert((v) => !v)} sousNom={sousNom} barreAutre={barre} repereAutre={seuilN != null ? e.seuil.replace(/^seuil /, '') : '—'} quantiteAutre={quantitePiece(item)} />
      {ouvert && (
        <div className="stock-liste la-ouv" data-ligne-ouverte>
          {pastille && <p className="la-besoin">{pastille}</p>}
          <ReglageSeuil key={String(item.minStock ?? '')} item={item} />
          {fournisseur && <p className="la-four">{fournisseur}</p>}
          <div className="la-acts"><button type="button" className="la-fiche" onClick={() => onOpen(item)}>Fiche ›</button></div>
        </div>
      )}
    </div>
  );
};
