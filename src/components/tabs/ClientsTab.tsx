import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  Edit3,
  Sparkles
} from 'lucide-react';
import { Client, Batch, PricingItem, AppConfig } from '../../types';
import { StorageService } from '../../services/storage';
import { BrewingMath } from '../../services/brewingMath';
import { SwissQrBillService } from '../../services/swissQrBill';
import { ClientStatsService } from '../../services/clientStats';
import { EditClientModal } from '../EditClientModal';
import { TarifSheet } from '../../ui/TarifSheet';
import { nextClientId } from '../../services/refs';

interface ClientsTabProps {
  clients: Client[];
  batches: Batch[];
  tarifs: PricingItem[];
  config: AppConfig;
  onOpenQuickAction: () => void;
  /** Remonte le sous-onglet courant : le bouton d'action en dépend. */
  onSubTabChange?: (sub: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  onSuccessMessage?: (msg: string) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  batches,
  tarifs,
  config,
  onOpenQuickAction,
  onSubTabChange,
  createRequest,
  onSuccessMessage
}) => {
  // Persistent subtab
  const [subTab, setSubTab] = useState<'crm' | 'ofdf' | 'tarifs'>(() =>
    StorageService.getUiState('clients_subtab', 'crm')
  );

  const [copiedTax, setCopiedTax] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  /** Fiche tarif ouverte. Un tarif sans produit vaut création. */
  const [tarifSheet, setTarifSheet] = useState<PricingItem | null>(null);

  const blankTarif = (): PricingItem => ({
    product: '',
    costIngredients: 0,
    costLabor: 0,
    costFixed: 0,
    costTotal: 0,
    priceHT: 0,
    marginCHF: 0,
    marginPercent: 0
  });

  const blankClient = (): Client => ({
    id: nextClientId(clients.map((c) => c.id)),
    name: '',
    type: 'Pro',
    contact: '',
    phone: '',
    email: ''
  });

  /**
   * Le bouton d'action a demandé une création : c'est l'écran qui sait quoi
   * ouvrir, pas l'App.
   */
  useEffect(() => {
    if (!createRequest) return;
    if (createRequest.kind === 'newClient') setEditingClient(blankClient());
    if (createRequest.kind === 'newTarif') setTarifSheet(blankTarif());
  }, [createRequest?.at]);

  // Le bouton d'action doit savoir où l'on est : il crée ce que l'écran montre.
  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  useEffect(() => {
    StorageService.setUiState('clients_subtab', subTab);
  }, [subTab]);

  // Impôt fédéral sur la bière (OFDF) — assiette = bière réellement conditionnée
  const taxReport = useMemo(
    () =>
      BrewingMath.calculateSwissBeerTax(batches, {
        ratePerHl: config.fiscal.beerTaxFullRatePerHl,
        maxSmallBrewerHl: config.fiscal.beerTaxSmallBrewerMaxHl,
        reliefTiersHl: config.fiscal.beerTaxReliefTiersHl
      }),
    [batches, config.fiscal]
  );

  // Chiffres clients calculés depuis les ventes réelles (jamais stockés).
  const clientStats = useMemo(
    () => ClientStatsService.forAll(clients, StorageService.getTransactions()),
    [clients]
  );

  const handleCopyOfdfValues = () => {
    const text = `DÉCLARATION DROIT BRASSICOLE SUISSE (OFDF - Formulaire 45.60)
Entreprise : ${config.company.name}
Volume conditionné : ${taxReport.totalHectoliters.toFixed(2)} hl (${taxReport.totalVolumeL} L)
Taux plein : ${taxReport.fullRatePerHl.toFixed(2)} CHF/hl
Réduction petit brasseur : ${taxReport.reductionPct}%
Taux appliqué : ${taxReport.ratePerHl.toFixed(2)} CHF/hl
Montant total à payer : ${taxReport.taxDueCHF.toFixed(2)} CHF

⚠️ Taux à vérifier contre le tarif OFDF en vigueur avant envoi.`;

    navigator.clipboard.writeText(text);
    setCopiedTax(true);
    setTimeout(() => setCopiedTax(false), 2500);
  };

  const handleGenerateInvoicePdf = (client: Client) => {
    const sampleItems = [
      { description: "Carton 12x 75cl — Milk Stout Artisanale (5.8% vol)", quantity: 2, unitPriceHT: 68.0, tvaRate: 0.026 },
      { description: "Carton 12x 75cl — NEIPA Tropical Hazy (6.2% vol)", quantity: 2, unitPriceHT: 72.0, tvaRate: 0.026 },
    ];
    SwissQrBillService.generateInvoicePdf(client, sampleItems, config);
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. Sub-navigation */}
      <div className="flex bg-cave-900 p-1 rounded-2xl border border-cave-800 shadow-md">
        <button
          onClick={() => setSubTab('crm')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${
            subTab === 'crm' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          👥 Clients CRM
        </button>
        <button
          onClick={() => setSubTab('ofdf')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${
            subTab === 'ofdf' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🇨🇭 Fiscalité OFDF
        </button>
        <button
          onClick={() => setSubTab('tarifs')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${
            subTab === 'tarifs' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          📊 Prix & Marges
        </button>
      </div>

      {/* 2. SUBTAB: CRM CLIENTS */}
      {subTab === 'crm' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="font-bold text-sm text-cave-50">Carnet Clients & Facturation</h3>
              <p className="text-sm text-cave-400">Modifier coordonnées, mots de passe et générer les QR-Factures</p>
            </div>
            <span className="text-sm text-ebc-straw font-bold">{clients.length} comptes</span>
          </div>

          <div className="space-y-2.5">
            {clients.map((c) => {
              const stats = clientStats.get(c.id) ?? {
                totalSales: 0,
                orderCount: 0,
                lastOrder: null,
                status: 'Prospect' as const
              };
              return (
              <div
                key={c.id}
                className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 hover:border-cave-700 transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-cave-500 font-bold">{c.id}</span>
                      <h4 className="font-bold text-sm text-cave-50">{c.name}</h4>
                      <span className={`text-footnote font-semibold px-2 py-0.5 rounded-full border ${
                        c.type === 'Pro'
                          ? 'bg-ebc-copper/10 text-ebc-copper border-ebc-copper/30'
                          : 'bg-water/10 text-water border-water/30'
                      }`}>
                        {c.type}
                      </span>
                    </div>
                    <div className="text-sm text-cave-400 mt-0.5">
                      Contact : <strong className="text-cave-200">{c.contact}</strong> · {c.phone}
                    </div>
                    {c.notes && (
                      <p className="text-sm text-cave-400 italic mt-0.5 bg-cave-950/50 px-2 py-0.5 rounded-lg inline-block">
                        🔑 {c.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Statut et total : calculés depuis les ventes, pas saisis */}
                    <div className="text-right">
                      <span className={`text-footnote font-bold px-2 py-0.5 rounded-lg ${
                        stats.status === 'Fidèle'
                          ? 'bg-hop/20 text-hop'
                          : stats.status === 'Actif'
                          ? 'bg-water/20 text-water'
                          : 'bg-cave-850 text-cave-400'
                      }`}>
                        {stats.status}
                      </span>
                      <div className="text-sm font-black text-ebc-straw mt-1 font-mono">
                        {stats.totalSales.toLocaleString('fr-CH')} CHF
                      </div>
                      <div className="text-footnote text-cave-500 mt-0.5">
                        {stats.orderCount > 0
                          ? `${stats.orderCount} vente${stats.orderCount > 1 ? 's' : ''} · ${stats.lastOrder}`
                          : 'Aucune vente'}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingClient(c)}
                      className="p-1.5 bg-cave-850 hover:bg-cave-800 text-ebc-straw rounded-xl transition"
                      title="Modifier le client"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center space-x-2 pt-1 border-t border-cave-800/80">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex-1 py-1.5 bg-cave-850 hover:bg-cave-800 text-cave-200 text-sm font-semibold rounded-xl flex items-center justify-center transition"
                    >
                      <Phone className="w-3.5 h-3.5 mr-1 text-hop" /> Appeler
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 bg-cave-850 hover:bg-cave-800 text-cave-200 text-sm font-semibold rounded-xl flex items-center justify-center transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1 text-hop" /> WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => handleGenerateInvoicePdf(c)}
                    className="flex-1 py-1.5 bg-ebc-straw/10 hover:bg-ebc-straw/20 text-ebc-gold border border-ebc-straw/30 text-sm font-bold rounded-xl flex items-center justify-center transition shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-ebc-straw" /> Facture QR
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SUBTAB: OFDF SWISS BEER TAX */}
      {subTab === 'ofdf' && (
        <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-ebc-straw">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-base text-cave-50">Droit Brassicole Suisse (OFDF)</h3>
          </div>
          <p className="text-sm text-cave-400">
            Calculateur mensuel pour la télédéclaration sur ezv.admin.ch (Formulaire officiel 45.60 avant le 15).
          </p>

          <div className="p-4 rounded-2xl bg-cave-950 border border-cave-800 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-cave-900 p-3 rounded-xl border border-cave-800">
                <span className="text-footnote text-cave-400 uppercase">Volume conditionné</span>
                <div className="text-lg font-black text-cave-50 mt-0.5 font-mono">
                  {taxReport.totalHectoliters} <span className="text-sm text-cave-400">hl</span>
                </div>
                <div className="text-footnote text-cave-500">({taxReport.totalVolumeL} litres)</div>
              </div>

              <div className="bg-cave-900 p-3 rounded-xl border border-cave-800">
                <span className="text-footnote text-cave-400 uppercase">Taux appliqué</span>
                <div className="text-lg font-black text-ebc-straw mt-0.5 font-mono">
                  {taxReport.ratePerHl.toFixed(2)} <span className="text-sm text-cave-400">CHF/hl</span>
                </div>
                {/* Le rabais affiché est celui RÉELLEMENT calculé, pas un texte figé */}
                <div className="text-footnote text-hop font-semibold">
                  {taxReport.reductionPct > 0
                    ? `Réduction petit brasseur −${taxReport.reductionPct}%`
                    : `Taux plein (${taxReport.fullRatePerHl.toFixed(2)} CHF/hl)`}
                </div>
              </div>
            </div>

            {taxReport.totalVolumeL === 0 && (
              <div className="p-3 bg-cave-900 border border-cave-800 rounded-xl text-sm text-cave-400 leading-relaxed">
                Aucune bière conditionnée sur la période : rien n'est imposable.
                L'impôt porte sur la bière <strong className="text-cave-200">réellement mise en
                bouteille ou en fût</strong>, pas sur les brassins planifiés ou encore en cuve.
                Le montant apparaîtra dès le premier embouteillage enregistré.
              </div>
            )}

            <div className="p-3 bg-ebc-straw/10 border border-ebc-straw/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-sm text-cave-400">Droit brassicole total à payer :</span>
                <div className="text-xl font-black text-ebc-straw font-mono">
                  {taxReport.taxDueCHF.toFixed(2)} CHF
                </div>
              </div>
              <button
                onClick={handleCopyOfdfValues}
                className="px-3 py-2 bg-ebc-straw hover:bg-ebc-gold text-cave-950 text-sm font-bold rounded-xl transition flex items-center shadow"
              >
                {copiedTax ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedTax ? 'Copié !' : 'Copier pour ezv'}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-cave-400 bg-cave-850/30 p-3 rounded-2xl border border-cave-800">
            <h4 className="font-bold text-cave-200">Barème appliqué (configurable dans Réglages) :</h4>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>
                <strong>Taux plein :</strong> {config.fiscal.beerTaxFullRatePerHl.toFixed(2)} CHF/hl.
              </li>
              <li>
                <strong>Régime petit brasseur :</strong> production annuelle sous{' '}
                {config.fiscal.beerTaxSmallBrewerMaxHl.toLocaleString('fr-CH')} hl (soit{' '}
                {(config.fiscal.beerTaxSmallBrewerMaxHl * 100).toLocaleString('fr-CH')} litres).
              </li>
              <li>
                <strong>Paliers de réduction :</strong>{' '}
                {config.fiscal.beerTaxReliefTiersHl
                  .map((t) => `−${t.reductionPct}% sous ${t.upToHl.toLocaleString('fr-CH')} hl`)
                  .join(' · ')}
              </li>
              <li>
                <strong>TVA bière :</strong>{' '}
                {config.fiscal.isTvaRegistered
                  ? `${(config.fiscal.tvaReducedRate * 100).toFixed(1)}% (brasserie assujettie)`
                  : 'non assujettie — aucune TVA facturée'}
              </li>
            </ul>
            <p className="text-footnote text-ebc-gold/90 pt-1">
              ⚠️ Vérifie ces taux contre le tarif OFDF en vigueur avant toute télédéclaration.
            </p>
          </div>
        </div>
      )}

      {/* 4. SUBTAB: PRICING & MARGINS */}
      {subTab === 'tarifs' && (
        <div className="space-y-3">
          <div className="px-1">
            <h3 className="font-bold text-sm text-cave-50">Prix de Revient & Marges Brutes</h3>
            <p className="text-sm text-cave-400">Répartition matières, main d'œuvre et charges fixes</p>
          </div>

          {tarifs.map((t, idx) => (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => setTarifSheet(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setTarifSheet(t);
                }
              }}
              className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 shadow-sm
                         cursor-pointer hover:border-cave-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-cave-50">{t.product}</h4>
                  <span className="text-sm text-cave-400">Conditionnement bouteilles / fûts</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-hop bg-hop/10 px-2 py-0.5 rounded-lg border border-hop/20 font-mono">
                    {t.marginPercent.toFixed(1)} % de marge
                  </span>
                  <div className="text-sm font-bold text-cave-200 mt-1 font-mono">
                    Prix HT : {t.priceHT} CHF
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 bg-cave-950/70 p-2.5 rounded-xl text-center text-sm">
                <div>
                  <div className="text-footnote text-cave-500">Matières</div>
                  <div className="font-semibold text-cave-200 font-mono">{t.costIngredients} CHF</div>
                </div>
                <div>
                  <div className="text-footnote text-cave-500">Main d'œuvre</div>
                  <div className="font-semibold text-cave-200 font-mono">{t.costLabor} CHF</div>
                </div>
                <div>
                  <div className="text-footnote text-cave-500">Fixes</div>
                  <div className="font-semibold text-cave-200 font-mono">{t.costFixed} CHF</div>
                </div>
                <div>
                  <div className="text-footnote text-cave-500">Coût total</div>
                  <div className="font-bold text-alert font-mono">{t.costTotal} CHF</div>
                </div>
              </div>

              <div className="text-right text-sm font-bold text-hop">
                Marge brute : +{t.marginCHF.toFixed(2)} CHF / lot
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Client Modal */}
      <TarifSheet
        item={tarifSheet}
        config={config}
        onClose={() => setTarifSheet(null)}
        onSave={(t) => {
          StorageService.updateTarif(t);
          onSuccessMessage?.(`Tarif « ${t.product} » enregistré.`);
        }}
        onDelete={(t) => {
          StorageService.deleteTarif(t.product);
          onSuccessMessage?.(`Tarif « ${t.product} » supprimé.`);
        }}
      />

      <EditClientModal
        isOpen={Boolean(editingClient)}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={() => setEditingClient(null)}
      />
    </div>
  );
};
