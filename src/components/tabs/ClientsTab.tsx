import { Input } from '../../ui/Input';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Edit3,
  Search,
  ChevronDown
} from 'lucide-react';
import { Client, ClientStatus, Batch, PricingItem, AppConfig } from '../../types';
import { StorageService } from '../../services/storage';
import { BrewingMath } from '../../services/brewingMath';
import { BEER_TAX_SOURCE } from '../../domain/finance/swissBeerTax';
import { ClientStatsService } from '../../services/clientStats';
import { EditClientModal } from '../EditClientModal';
import { TarifSheet } from '../../ui/TarifSheet';
import { nextClientId } from '../../services/refs';
import { useLiveSelection, useStorageValue } from '../../hooks/useLiveData';
import { ViewNavigation } from '../../ui/ViewNavigation';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { inputClass } from '../../ui/FormNav';
import '../../ui/clients.css';
const InvoiceSheet = React.lazy(() => import('../../ui/finance/InvoiceSheet').then(m => ({ default: m.InvoiceSheet })));

const amountFormat = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const amount = (value: number) => Number.isFinite(value) ? amountFormat.format(value) : '—';
const percent = (value: number) => Number.isFinite(value) ? percentFormat.format(value) : '—';
const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
const clientStatuses: ClientStatus[] = ['Prospect', 'Actif', 'Fidèle'];

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
  onSubTabChange,
  createRequest,
  onSuccessMessage
}) => {
  const [clientQuery, setClientQuery] = useState('');
  const [clientType, setClientType] = useState<'all' | Client['type']>('all');
  const [clientStatus, setClientStatus] = useState<'all' | ClientStatus>('all');
  const [tarifQuery, setTarifQuery] = useState('');
  const [tarifFilter, setTarifFilter] = useState<'all' | 'noMargin'>('all');
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

  const visibleClients = useMemo(() => {
    const query = searchable(clientQuery);
    return clients.filter(client =>
      (clientType === 'all' || client.type === clientType) &&
      (clientStatus === 'all' || clientStats.get(client.id)?.status === clientStatus) &&
      (!query || [client.name, client.contact, client.id, client.phone, client.email]
        .some(value => value && searchable(value).includes(query)))
    );
  }, [clients, clientQuery, clientType, clientStatus, clientStats]);
  const proCount = clients.filter(client => client.type === 'Pro').length;
  const privateCount = clients.length - proCount;
  const statusCounts = clientStatuses.map(status => ({
    status, count: clients.filter(client => clientStats.get(client.id)?.status === status).length
  }));
  const hasClientFilters = clientType !== 'all' || clientStatus !== 'all';
  const resetClients = () => { setClientQuery(''); setClientType('all'); setClientStatus('all'); };
  const noMarginCount = displayedTarifs.filter(tarif => tarif.marginCHF <= 0).length;
  const visibleTarifs = displayedTarifs.filter(tarif =>
    (tarifFilter === 'all' || tarif.marginCHF <= 0) && searchable(tarif.product).includes(searchable(tarifQuery))
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
    <div className="clients-workspace">
      <ViewNavigation<typeof subTab>
        label="Vue des clients" value={subTab} onChange={setSubTab}
        options={[{ value: 'crm', label: 'Clients' }, { value: 'ofdf', label: 'Impôt sur la bière', shortLabel: 'Impôt bière' }, { value: 'tarifs', label: 'Prix et marges' }]}
      >
        <div className="clients-navigation" role="group" aria-label="Vue des clients">
          {([
            { value: 'crm', label: 'Clients', icon: Users },
            { value: 'ofdf', label: 'Impôt sur la bière', icon: ShieldCheck },
            { value: 'tarifs', label: 'Prix et marges', icon: FileText }
          ] as const).map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={subTab === value}
              onClick={() => setSubTab(value)} className="clients-nav-item">
              <Icon size={15} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </ViewNavigation>

      {subTab === 'crm' && (
        <section aria-label="Carnet clients" className="clients-section">
          <div className="clients-toolbar">
            <div className="clients-search">
              <Search size={15} aria-hidden="true" />
              <Input type="search" aria-label="Rechercher un client" placeholder="Nom, contact, téléphone…"
                value={clientQuery} onChange={event => setClientQuery(event.target.value)} className={inputClass} />
            </div>
            <span className="clients-result-count" role="status">
              {visibleClients.length === clients.length ? clients.length : `${visibleClients.length} / ${clients.length}`} {clients.length > 1 ? 'clients' : 'client'}
            </span>
          </div>
          {((proCount > 0 && privateCount > 0) || hasClientFilters || statusCounts.filter(entry => entry.count > 0).length > 1) && (
            <div className="clients-filters">
              {((proCount > 0 && privateCount > 0) || clientType !== 'all') && (
                <SegmentedControl label="Type de client" value={clientType} onChange={setClientType} className="clients-segments"
                  options={[{ value: 'all', label: `Tous ${clients.length}` }, { value: 'Pro', label: `Pro ${proCount}` }, { value: 'Privé', label: `Privés ${privateCount}` }]} />
              )}
              {(statusCounts.filter(entry => entry.count > 0).length > 1 || clientStatus !== 'all') && (
                <label className="clients-status-filter">
                  <span className="sr-only">Statut du client</span>
                  <select value={clientStatus} onChange={event => setClientStatus(event.target.value as typeof clientStatus)} className={inputClass}>
                    <option value="all">Tous les statuts</option>
                    {statusCounts.map(({ status, count }) => <option key={status} value={status}>{status} · {count}</option>)}
                  </select>
                </label>
              )}
              {(clientQuery || hasClientFilters) && <button type="button" className="clients-action" onClick={resetClients}>Tout effacer</button>}
            </div>
          )}
          {!visibleClients.length && (
            <div className="clients-empty">
              <p>{clientQuery ? 'Aucun client ne correspond à ta recherche.' : hasClientFilters ? 'Aucun client avec ces filtres.' : 'Ajoute ton premier client pour préparer ses factures.'}</p>
              {(clientQuery || hasClientFilters) && <button type="button" onClick={resetClients} className="clients-action">{hasClientFilters ? 'Retirer les filtres' : 'Effacer la recherche'}</button>}
            </div>
          )}
          {visibleClients.length > 0 && <div className="clients-list">
            {visibleClients.map(client => {
              const stats = clientStats.get(client.id)!;
              return <details key={client.id} className="client-row">
                <summary className="client-summary">
                  <span className="client-identity">
                    <strong>{client.name}</strong>
                    <span className="client-metadata"><span>{client.type}</span><span className="client-status" data-status={stats.status}>{stats.status}</span></span>
                  </span>
                  <span className="client-sales">
                    <span className="font-mono">{amount(stats.totalSales)} CHF</span>
                    <span className="client-metadata">{stats.orderCount ? `${stats.orderCount} vente${stats.orderCount > 1 ? 's' : ''}` : 'Aucune vente'}</span>
                  </span>
                  <ChevronDown size={15} className="client-chevron" aria-hidden="true" />
                </summary>
                <div className="client-detail">
                  <dl className="client-coordinates">
                    <dt>Référence</dt><dd>{client.id}</dd>
                    {client.contact && <><dt>Contact</dt><dd>{client.contact}</dd></>}
                    {client.phone && <><dt>Téléphone</dt><dd>{client.phone}</dd></>}
                    {client.email && <><dt>Email</dt><dd><a href={`mailto:${client.email}`}>{client.email}</a></dd></>}
                    {stats.lastOrder && <><dt>Dernière vente</dt><dd>{stats.lastOrder}</dd></>}
                    {client.notes && <><dt>Notes</dt><dd className="client-notes">{client.notes}</dd></>}
                  </dl>
                  <div className="client-actions">
                    <button type="button" className="clients-action" aria-label={`Modifier ${client.name}`} onClick={() => setEditingClient(client)}><Edit3 size={14} aria-hidden="true" />Modifier</button>
                    {client.phone && <>
                      <a href={`tel:${client.phone}`} className="clients-action"><Phone size={14} aria-hidden="true" />Appeler</a>
                      <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="clients-action"><MessageSquare size={14} aria-hidden="true" />WhatsApp</a>
                    </>}
                    <button type="button" onClick={() => handleGenerateInvoicePdf(client)} className="clients-action clients-action-emphasis"><FileText size={14} aria-hidden="true" />Facturer</button>
                  </div>
                </div>
              </details>;
            })}
          </div>}
        </section>
      )}

      {/* Les réserves restent visibles ; le détail fiscal se déplie. */}
      {subTab === 'ofdf' && (
        <section className="clients-tax" aria-label="Réserve pour l’impôt sur la bière">
          <div className="clients-tax-header">
            <h3>Réserve pour l’impôt sur la bière</h3>
            <label className="clients-tax-year">Année
              <select aria-label="Année de réserve OFDF" value={taxYear} onChange={event => setTaxYear(Number(event.target.value))} className={inputClass}>
                {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map(year => <option key={year}>{year}</option>)}
              </select>
            </label>
          </div>
          <p>{taxReport.warning}</p>
          <dl className="clients-tax-reading">
            <div>
              <dt>Pour {taxReport.totalVolumeL} litres conditionnés</dt>
              <dd className="font-mono">{taxReport.estimateLowCHF === taxReport.estimateHighCHF ? taxReport.estimateHighCHF.toFixed(2) : `${taxReport.estimateLowCHF.toFixed(2)} – ${taxReport.estimateHighCHF.toFixed(2)}`} CHF</dd>
            </div>
          </dl>
          <p className="text-cave-400">{taxReport.reductionConfirmed ? `Réduction annuelle confirmée : ${taxReport.reductionPct} %.` : 'Réduction annuelle à confirmer dans les réglages : réserve calculée au taux plein.'}</p>
          {taxReport.missingPlatoCount > 0 && <p className="text-attention">Densité initiale manquante pour {taxReport.missingPlatoCount} brassin(s) : fourchette entre les catégories légère et forte.</p>}
          <details className="clients-help">
            <summary>Comprendre le calcul et les démarches<ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="clients-tax-help-body">
              <p>Barème par hectolitre : 16,88 CHF jusqu’à 10 °P ; 25,32 CHF de 10,1 à 14 °P ; 33,76 CHF dès 14,1 °P.</p>
              <p>Le taux annuel de réduction est communiqué par l’OFDF. Il ne se déduit pas du seul volume de cette période.</p>
              <p>Selon le régime attribué : déclaration sous 20 jours et paiement sous 30 jours après la fin du trimestre ou de l’année, via Taxas.</p>
              <p>TVA de la bière alcoolisée : {config.fiscal.isTvaRegistered ? 'taux normal de 8,1 %.' : 'brasserie non assujettie, aucune TVA facturée.'}</p>
            </div>
          </details>
          <div className="clients-tax-actions">
            <button type="button" onClick={handleCopyOfdfValues} className="clients-action clients-tax-copy">{copiedTax ? 'Estimation copiée' : 'Copier cette estimation'}</button>
            <a href="https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation" target="_blank" rel="noreferrer" className="clients-tax-link">Ouvrir Taxas</a>
            <a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer" className="clients-tax-link">Directives OFDF</a>
          </div>
        </section>
      )}
      {subTab === 'tarifs' && (
        <section aria-label="Prix et marges" className="clients-section">
          <div className="clients-toolbar">
            <div className="clients-search">
              <Search size={15} aria-hidden="true" />
              <Input type="search" aria-label="Rechercher un tarif" placeholder="Rechercher un produit…"
                value={tarifQuery} onChange={event => setTarifQuery(event.target.value)} className={inputClass} />
            </div>
            <span className="clients-result-count" role="status">{visibleTarifs.length} {visibleTarifs.length > 1 ? 'tarifs' : 'tarif'}</span>
          </div>
          {(noMarginCount > 0 || tarifFilter !== 'all') && (
            <SegmentedControl label="Marge des tarifs" value={tarifFilter} onChange={setTarifFilter} className="clients-segments tarif-segments"
              options={[{ value: 'all', label: `Tous ${tarifs.length}` }, { value: 'noMargin', label: `Sans marge ${noMarginCount}` }]} />
          )}
          {!visibleTarifs.length ? <div className="clients-empty">
            <p>{!tarifs.length ? 'Ajoute un tarif pour préparer les prix de vente et les factures.' : 'Aucun tarif avec cette recherche ou ce filtre.'}</p>
            {(tarifQuery || tarifFilter !== 'all') && <button type="button" className="clients-action" onClick={() => { setTarifQuery(''); setTarifFilter('all'); }}>Tout effacer</button>}
          </div> : <div className="tarif-table-scroll" role="region" aria-label="Comparaison des tarifs" tabIndex={0}>
            <table className="tarif-table">
              <caption>Montants en CHF par produit · marge brute hors temps personnel</caption>
              <thead><tr><th scope="col">Produit</th><th scope="col">Prix HT</th><th scope="col">Coût</th><th scope="col">Marge</th></tr></thead>
              <tbody>{visibleTarifs.map(tarif => <tr key={tarif.product}>
                <th scope="row"><button type="button" className="tarif-product" onClick={() => setTarifSheet(tarif)} aria-label={`Modifier le tarif ${tarif.product}`}>{tarif.product}<Edit3 size={13} aria-hidden="true" /></button></th>
                <td className="font-mono">{amount(tarif.priceHT)}</td>
                <td className="font-mono">{amount(tarif.costTotal)}</td>
                <td className={`tarif-margin font-mono ${tarif.marginCHF <= 0 ? 'text-alert-strong' : 'text-cave-50'}`}>
                  <span>{tarif.marginCHF > 0 ? '+' : ''}{amount(tarif.marginCHF)}</span>
                  <span className="tarif-percent">{percent(tarif.marginPercent)} %</span>
                </td>
              </tr>)}</tbody>
            </table>
          </div>}
          <details className="clients-help">
            <summary>Comprendre les marges<ChevronDown size={14} aria-hidden="true" /></summary>
            <p>Le coût additionne les ingrédients et les charges fixes. La marge brute est le prix HT moins ce coût. Le temps personnel est exclu. « Sans marge » regroupe les prix inférieurs ou égaux au coût.</p>
          </details>
        </section>
      )}

      {/* Edit Client Modal */}
      {invoiceClient && <React.Suspense fallback={<p role="status">Ouverture de la facture…</p>}><InvoiceSheet client={invoiceClient} tarifs={tarifs} config={config} onClose={() => setInvoiceClient(null)} onSaved={() => onSuccessMessage?.('Facture enregistrée à encaisser et PDF téléchargé.')} /></React.Suspense>}
      <TarifSheet
        item={tarifSheet}
        config={config}
        existingProducts={tarifs.map(tarif => tarif.product)}
        onClose={() => setTarifSheet(null)}
        onSave={(t) => {
          if (tarifSheet?.product && tarifSheet.product !== t.product) {
            // Le libellé est la clé de stockage : un renommage remplace la
            // ligne éditée, sans créer un second tarif ni toucher aux voisins.
            StorageService.saveTarifs(StorageService.getTarifs().map(current => current.product === tarifSheet.product ? t : current));
            StorageService.logAction('Modification', 'Clients', t.product, `Tarif renommé : ${tarifSheet.product} → ${t.product}`);
          } else StorageService.updateTarif(t);
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
