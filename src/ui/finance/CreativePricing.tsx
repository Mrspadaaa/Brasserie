import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { formatCHF } from '../../domain/finance/ledger';
import { MoneyInput } from './FinanceForms';

/** A price trial uses the brewer's own amounts and configured VAT status. */
export function CreativePricing() {
  const config = useStorageValue(StorageService.getConfig);
  const [price, setPrice] = useState<number>(), [cost, setCost] = useState<number>();
  const rate = config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0;
  const net = price != null ? Math.round(price / (1 + rate)) : undefined;
  const margin = net != null && net > 0 && cost != null ? net - cost : undefined;
  return <div className="finance upgrade-workspace"><h3>Essayer un prix de vente</h3><p className="finance-muted mt-2">Compare le prix et le coût complet d’un même format : bouteille, carton ou fût.</p>
    <div className="finance-form mt-4"><MoneyInput label="Prix de vente TTC (CHF)" value={price} onChange={setPrice}/><MoneyInput label="Coût de revient de ce format (CHF)" value={cost} onChange={setCost}/></div>
    <div className="finance-summary"><span className="finance-label">Marge unitaire estimée</span><strong className="reading">{margin == null ? 'À renseigner' : formatCHF(margin)}</strong><p className="finance-muted">{config.fiscal.isTvaRegistered ? 'TVA retirée selon tes réglages. Utilise un coût hors TVA récupérable.' : 'Calcul TTC selon ton statut sans assujettissement TVA.'}</p></div>
    <p className="finance-muted mt-3">Inclue la bière, le conditionnement et les charges attribuées. Une simulation de prix n’ajoute aucune vente prévue.</p>
  </div>;
}
