import React from 'react';
import { Hexagon } from 'lucide-react';
import type { FinanceLine } from '../../../domain/finance/types';
import { formatCHF } from '../../../domain/finance/ledger';
import { StorageService } from '../../../services/storage';
import { amountOnly } from '../financeFormat';
import { colorerLignes, resumeLignes, segmentsBarre } from './barre';
import { uniteAccordee } from './format';
import './fiche.css';

/** Catégorie de l'article au stock, quand la ligne sait de quel article il s'agit. Une lecture qui échoue ne casse pas la fiche : la ligne retombe sur son libellé. */
function categoriesStock(lines: FinanceLine[]): Map<string, string> {
  const refs = new Set(lines.map(l => l.stockItemRef).filter(Boolean) as string[]);
  const out = new Map<string, string>();
  if (!refs.size) return out;
  try {
    const { rawMaterials, cleaning } = StorageService.getStocks();
    for (const item of [...rawMaterials, ...cleaning]) if (refs.has(item.ref)) out.set(item.ref, String((item as { category?: string }).category ?? ''));
  } catch { /* hors ligne ou stock absent : repli sur le libellé */ }
  return out;
}

/**
 * « Dans la facture » (m5fo-a) : la barre de m2fo-c, un segment par ligne à sa part du total, puis les rangées de m2fo-a à la même couleur
 * (elles servent de légende). Toucher un segment = toucher sa rangée : il ouvre l'article du stock. Sans ligne : rien, pas même la barre.
 */
export function FactureLignes({ lines, onOpenStockItem }: { lines: FinanceLine[]; onOpenStockItem?: (ref: string) => void }) {
  if (!lines.length) return null;
  const categories = categoriesStock(lines);
  const lignes = colorerLignes(lines, l => (l.stockItemRef ? categories.get(l.stockItemRef) : undefined));
  const segments = segmentsBarre(lignes);
  const auStock = onOpenStockItem ? lines.filter(l => l.stockItemRef).length : 0;
  return <section aria-label="Dans la facture">
    <h3 className="fiche-h"><span>Dans la facture</span><small>{resumeLignes(lines, auStock)}</small></h3>
    {segments.length > 0 && <div className="fiche-fbar" data-testid="fiche-barre">{segments.map(s => {
      const style = { left: `${s.leftPct}%`, width: `${s.widthPct}%`, background: s.couleur };
      const nom = `${s.description} ${amountOnly(s.amountCents)}`;
      return s.stockItemRef && onOpenStockItem
        ? <button type="button" key={s.id} className="fiche-fseg" data-ligne={s.id} style={style} aria-label={`${nom}, ouvrir l’article au stock`} onClick={() => onOpenStockItem(s.stockItemRef!)}/>
        : <span key={s.id} className="fiche-fseg" data-ligne={s.id} style={style} role="img" aria-label={nom}/>;
    })}</div>}
    <div className="fiche-lignes">{lignes.map(({ line, couleur }) => {
      const meta = [line.quantity != null ? `${line.quantity} ${uniteAccordee(line.quantity, line.unit)}`.trim() : '', line.kind === 'equipment' ? 'Matériel' : ''].filter(Boolean).join(' · ');
      const ouvre = line.stockItemRef && onOpenStockItem ? () => onOpenStockItem(line.stockItemRef!) : undefined;
      const corps = <>
        <i style={{ background: couleur }} aria-hidden="true"/>
        <span className="fiche-ln-nom"><b>{line.description}</b>{meta && <small> · {meta}</small>}</span>
        <span className="fiche-m">{amountOnly(line.amountCents)}</span>
        <span className="fiche-st">{ouvre && <span><Hexagon size={18} aria-hidden="true"/></span>}</span>
      </>;
      return ouvre
        ? <button type="button" className="fiche-ln" key={line.id} onClick={ouvre} aria-label={`${line.description} · ${formatCHF(line.amountCents)} · voir cet article dans les stocks`}>{corps}</button>
        : <div className="fiche-ln" key={line.id}>{corps}</div>;
    })}</div>
  </section>;
}
