import { Input } from '../../ui/Input';
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
  Sparkles,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Client, Batch, PricingItem, AppConfig } from '../../types';
import { StorageService } from '../../services/storage';
import { BrewingMath } from '../../services/brewingMath';
import { BEER_TAX_SOURCE } from '../../domain/finance/swissBeerTax';
import { ClientStatsService } from '../../services/clientStats';
import { EditClientModal } from '../EditClientModal';
import { TarifSheet } from '../../ui/TarifSheet';
import { nextClientId } from '../../services/refs';
import { useLiveSelection, useStorageValue } from '../../hooks/useLiveData';
import { ViewNavigation, MobileDetails } from '../../ui/ViewNavigation';
import { useMobileLayout } from '../../ui/useViewport';
const InvoiceSheet = React.lazy(() => import('../../ui/finance/InvoiceSheet').then(m => ({ default: m.InvoiceSheet })));

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
  const mobile = useMobileLayout();
  const [clientQuery, setClientQuery] = useState('');
  const visibleClients = useMemo(() => clients.filter(client => !clientQuery.trim() || [client.name,client.contact,client.id,client.phone,client.email].some(value=>value?.toLocaleLowerCase('fr').includes(clientQuery.toLocaleLowerCase('fr').trim()))), [clients,clientQuery]);
  // Persistent subtab
  const [subTab, setSubTab] = useState<'crm' | 'ofdf' | 'tarifs'>(() =>
    StorageService.getUiState('clients_subtab', 'crm')
  );

  const [copiedTax, setCopiedTax] = useState(false);
  const [editingClient, setEditingClient] = useLiveSelection(clients, 'id');
  const [invoiceClient, setInvoiceClient] = useLiveSelection(clients, 'id');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const displayedTarifs = useMemo(() => tarifs.map(t => { const costTotal = Math.round((t.costIngredients + t.costFixed) * 100) / 100; const marginCHF = Math.round((t.priceHT - costTotal) * 100) / 100; return { ...t, costLabor: 0, costTotal, marginCHF, marginPercent: t.priceHT > 0 ? marginCHF / t.priceHT * 100 : 0 }; }), [tarifs]);
  /** Fiche tarif ouverte. Un tarif sans produit vaut création. */
  const [tarifSheet, setTarifSheet] = useLiveSelection(tarifs, 'product');

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
        year: taxYear,
        annualReductionPct: config.fiscal.beerTaxAnnualReductionPct,
        reductionYear: config.fiscal.beerTaxReductionYear
      }),
    [batches, config.fiscal, taxYear]
  );

  // Chiffres clients calculés depuis les ventes réelles (jamais stockés).
  const transactions = useStorageValue(StorageService.getTransactions);
  const clientStats = useMemo(
    () => ClientStatsService.forAll(clients, transactions),
    [clients, transactions]
  );

  const handleCopyOfdfValues = () => {
    const text = `RÉSERVE INDICATIVE IMPÔT SUR LA BIÈRE — ${taxYear}
Entreprise : ${config.company.name}
Volume conditionné : ${taxReport.totalHectoliters.toFixed(2)} hl (${taxReport.totalVolumeL} L)
Taux plein : ${taxReport.fullRatePerHl.toFixed(2)} CHF/hl
Réduction petit brasseur : ${taxReport.reductionPct}%
Taux appliqué : ${taxReport.ratePerHl.toFixed(2)} CHF/hl
Réserve : ${taxReport.estimateLowCHF.toFixed(2)} à ${taxReport.estimateHighCHF.toFixed(2)} CHF

${taxReport.warning}
Réduction annuelle ${taxReport.reductionConfirmed ? 'confirmée' : 'non confirmée : calcul au taux plein'}.`;

    navigator.clipboard.writeText(text);
    setCopiedTax(true);
    setTimeout(() => setCopiedTax(false), 2500);
  };

  const handleGenerateInvoicePdf = (client: Client) => {
    setInvoiceClient(client);
  };

  return (
    <div className="space-y-2 sm:space-y-4 pb-24 pt-2">
      {/* 1. Sub-navigation */}
      <ViewNavigation<typeof subTab> label="Vue des clients" value={subTab} onChange={setSubTab} options={[{value:'crm',label:'Clients'},{value:'ofdf',label:'Impôt sur la bière',shortLabel:'Impôt bière'},{value:'tarifs',label:'Prix et marges'}]}>
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
      </ViewNavigation>

      {/* 2. SUBTAB: CRM CLIENTS */}
      {subTab === 'crm' && (
        <div className="space-y-3">
          {mobile ? <div className="flex items-center gap-2">
            <Input type="search" aria-label="Rechercher un client" placeholder={`${clients.length} clients · Rechercher…`} value={clientQuery} onChange={e=>setClientQuery(e.target.value)} className="min-w-0 flex-1 min-h-touch rounded-control border border-cave-800 bg-cave-950 px-3 text-base"/>
          </div> : <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="font-bold text-sm text-cave-50">Carnet Clients & Facturation</h3>
              <p className="text-sm text-cave-400">Coordonnées, ventes et factures à encaisser</p>
            </div>
            <span className="text-sm text-ebc-straw font-bold">{clients.length} comptes</span>
          </div>}
          {!mobile&&clientQuery&&<Input type="search" aria-label="Rechercher un client" value={clientQuery} onChange={e=>setClientQuery(e.target.value)} className="min-h-touch w-full rounded-control bg-cave-900 border border-cave-800 px-3"/>}
          {!visibleClients.length&&<div className="py-6 text-center text-cave-400"><p>{clientQuery?'Aucun client ne correspond à ta recherche.':'Ajoute ton premier client pour préparer ses factures.'}</p>{clientQuery&&<button type="button" onClick={()=>setClientQuery('')} className="min-h-touch text-ebc-straw">Effacer la recherche</button>}</div>}

          <div className="space-y-2.5">
            {visibleClients.map((c) => {
              const stats = clientStats.get(c.id) ?? {
                totalSales: 0,
                orderCount: 0,
                lastOrder: null,
                status: 'Prospect' as const
              };
              if(mobile) return <details key={c.id} className="group/client rounded-panel border border-cave-800 bg-cave-900">
                <summary className="list-none flex min-h-touch items-center gap-3 p-3 cursor-pointer">
                  <span className="min-w-0 flex-1"><strong className="block text-base text-cave-50 break-words">{c.name}</strong><span className="block text-sm text-cave-400 mt-0.5">{c.type} · {c.contact || stats.status}</span></span>
                  <ChevronDown size={18} className="shrink-0 text-cave-400 group-open/client:rotate-180"/>
                </summary>
                <div className="px-3 pb-3 space-y-3 border-t border-cave-800 pt-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="text-cave-400">{c.id} · {stats.status}</span><button type="button" aria-label={`Modifier ${c.name}`} onClick={()=>setEditingClient(c)} className="min-h-touch px-3 rounded-control bg-cave-850 text-ebc-straw">Modifier</button></div>
                  {c.email&&<a className="block min-h-touch py-3 break-all text-cave-200" href={`mailto:${c.email}`}>{c.email}</a>}
                  {c.phone&&<p className="text-cave-200">{c.phone}</p>}
                  {c.notes&&<p className="text-cave-400 break-words">{c.notes}</p>}
                  <p className="text-cave-200">{stats.totalSales.toLocaleString('fr-CH')} CHF de ventes depuis le début · {stats.orderCount} vente(s){stats.lastOrder?` · dernière le ${stats.lastOrder}`:''}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.phone&&<><a href={`tel:${c.phone}`} className="min-h-touch flex-1 px-3 rounded-control bg-cave-850 flex items-center justify-center gap-1"><Phone size={16}/>Appeler</a><a href={`https://wa.me/${c.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="min-h-touch flex-1 px-3 rounded-control bg-cave-850 flex items-center justify-center">WhatsApp</a></>}
                    <button type="button" onClick={()=>handleGenerateInvoicePdf(c)} className="min-h-touch flex-1 px-3 rounded-control bg-ebc-straw/10 text-ebc-straw font-semibold">Facturer</button>
                  </div>
                </div>
              </details>;
              return (
              <div
                key={c.id}
                className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 hover:border-cave-700 transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-cave-400 font-bold">{c.id}</span>
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
                      <div className="text-footnote text-cave-400">Ventes depuis le début</div>
                      <div className="text-footnote text-cave-400 mt-0.5">
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
                    <FileText className="w-3.5 h-3.5 mr-1 text-ebc-straw" /> Facturer
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
        <div className="space-y-4 rounded-3xl border border-cave-800 bg-cave-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Réserve pour l’impôt sur la bière</h3><label className="text-sm">Année <select aria-label="Année de réserve OFDF" value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} className="rounded-xl bg-cave-950 p-2">{Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year}>{year}</option>)}</select></label></div>
          <p className="text-sm text-cave-200 leading-relaxed">{taxReport.warning}</p>
          <div className="rounded-2xl bg-cave-950 p-4"><div className="text-sm text-cave-400">Pour {taxReport.totalVolumeL} litres conditionnés</div><div className="mt-2 text-2xl font-black text-ebc-straw">{taxReport.estimateLowCHF === taxReport.estimateHighCHF ? taxReport.estimateHighCHF.toFixed(2) : `${taxReport.estimateLowCHF.toFixed(2)} – ${taxReport.estimateHighCHF.toFixed(2)}`} CHF</div><p className="mt-2 text-sm text-cave-400">{taxReport.reductionConfirmed ? `Réduction annuelle confirmée : ${taxReport.reductionPct} %.` : 'Réduction annuelle à confirmer dans les réglages : réserve calculée au taux plein.'}</p>{taxReport.missingPlatoCount > 0 && <p className="mt-2 text-sm text-ebc-gold">Densité initiale manquante pour {taxReport.missingPlatoCount} brassin(s) : fourchette entre les catégories légère et forte.</p>}</div>
          <MobileDetails title="Comprendre le calcul et les démarches"><div className="space-y-2 text-sm text-cave-200"><p>Barème par hectolitre : 16,88 CHF jusqu’à 10 °P ; 25,32 CHF de 10,1 à 14 °P ; 33,76 CHF dès 14,1 °P.</p><p>Le taux annuel de réduction est communiqué par l’OFDF. Il ne se déduit pas du seul volume de cette période.</p><p>Selon le régime attribué : déclaration sous 20 jours et paiement sous 30 jours après la fin du trimestre ou de l’année, via Taxas.</p><p>TVA de la bière alcoolisée : {config.fiscal.isTvaRegistered ? 'taux normal de 8,1 %.' : 'brasserie non assujettie, aucune TVA facturée.'}</p></div></MobileDetails>
          <div className="flex flex-wrap gap-3"><button onClick={handleCopyOfdfValues} className="min-h-[44px] rounded-xl bg-ebc-straw px-4 py-2 font-bold text-cave-950">{copiedTax ? 'Estimation copiée' : 'Copier cette estimation'}</button><a href="https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation" target="_blank" rel="noreferrer" className="min-h-[44px] px-3 py-2 text-ebc-straw underline">Ouvrir Taxas</a><a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer" className="min-h-[44px] px-3 py-2 text-cave-200 underline">Directives OFDF</a></div>
        </div>
      )}
      {/* 4. SUBTAB: PRICING & MARGINS */}
      {subTab === 'tarifs' && (
        <div className="space-y-3">
          <div className="px-1">
            <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-sm text-cave-50">Prix et marges</h3>{mobile&&<button type="button" aria-label="Ajouter un tarif" onClick={()=>setTarifSheet(blankTarif())} className="touch-target rounded-control bg-ebc-straw text-cave-950"><Plus size={21}/></button>}</div>
            <p className="text-sm text-cave-400">Matières et charges fixes · temps personnel exclu</p>
          </div>

          {displayedTarifs.map((t, idx) => (
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

              {!mobile&&<div className="grid grid-cols-3 gap-1.5 bg-cave-950/70 p-2.5 rounded-xl text-center text-sm">
                <div>
                  <div className="text-footnote text-cave-400">Matières</div>
                  <div className="font-semibold text-cave-200 font-mono">{t.costIngredients} CHF</div>
                </div>
                <div>
                  <div className="text-footnote text-cave-400">Fixes</div>
                  <div className="font-semibold text-cave-200 font-mono">{t.costFixed} CHF</div>
                </div>
                <div>
                  <div className="text-footnote text-cave-400">Coût total</div>
                  <div className="font-bold text-alert font-mono">{t.costTotal} CHF</div>
                </div>
              </div>}

              <div className="text-right text-sm font-bold text-hop">
                Marge brute : +{t.marginCHF.toFixed(2)} CHF / lot
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Client Modal */}
      {invoiceClient && <React.Suspense fallback={<p role="status">Ouverture de la facture…</p>}><InvoiceSheet client={invoiceClient} tarifs={tarifs} config={config} onClose={() => setInvoiceClient(null)} onSaved={() => onSuccessMessage?.('Facture enregistrée à encaisser et PDF téléchargé.')} /></React.Suspense>}
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
