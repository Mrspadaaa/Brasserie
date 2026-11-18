// Harnais de rendu de la voie b-dep : une feuille réelle de l'app, seule, sans compte ni donnée réelle.
// ?s=depense|upgrade|facture|piece[&etat=3]&theme=cave ; « piece » = la pièce simulée 372765 (apercuDepense), lue.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../../../../src/index.css';
import { ExpenseSheet } from '../../../../../../src/ui/finance/ExpenseSheet';
import { UpgradeSheet } from '../../../../../../src/ui/finance/UpgradeSheet';
import { InvoiceSheet } from '../../../../../../src/ui/finance/InvoiceSheet';
import { apercuDepense } from '../../../../../../src/ui/depense/apercuDev';
import { EditTransactionModal } from '../../../../../../src/components/EditTransactionModal';

const q = new URLSearchParams(location.search);
if (q.get('theme') === 'cave') document.documentElement.dataset.theme = 'cave';
const config: any = { fiscal: { isTvaRegistered: true, tvaNormalRate: 0.081 }, brewhouses: [] };
const client: any = { id: 'c', name: 'Restaurant Fictif' };
const quel = q.get('s');
const apercu = quel === 'piece' ? apercuDepense(q.get('etat') === 'weizeng' ? '3' : q.get('etat') ?? '3') : undefined;
// B2-NOTE-8 : la ligne « Weizenmalz hell » imprimée en grammes (2 000 g) avec sa mouture proposée : la pastille « 2 000 g → 2 Kg » (SIMULÉ : même pièce, une seule ligne changée).
if (apercu && q.get('etat') === 'weizeng') for (const i of (apercu as any).outcome.result.items) if (/Weizenmalz/i.test(i.name)) { i.unit = 'g'; i.quantity = 2000; i.price = 0.00155; }
const tx: any = { id: 'T-iso', date: '2026-11-05', description: 'Vente 2 fûts Hazy IPA — Restaurant Pizzeria', category: 'recettes', subcategory: 'Vente', amountHT: 23.8, tvaRate: 0, tvaAmount: 0, amountTTC: 23.8 };
const feuille = quel === 'upgrade' ? <UpgradeSheet onClose={() => {}} />
  : quel === 'facture' ? <InvoiceSheet client={client} config={config} tarifs={[{ product: 'Pale Ale 33 cl', priceHT: 2.5 } as any]} onClose={() => {}} />
  : quel === 'edit' ? <EditTransactionModal isOpen transaction={tx} onClose={() => {}} onSave={() => {}} />
  : quel === 'piece' ? <ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercu} />
  : <ExpenseSheet initialIntent="equipment" onClose={() => {}} onSaved={() => {}} />;
ReactDOM.createRoot(document.getElementById('root')!).render(feuille);
