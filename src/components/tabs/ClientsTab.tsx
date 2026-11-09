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
/** Plans et réduction de l'année, lus du stockage : le même chemin que la feuille p2b (une seule source du total d'impôt). */
const lireImpot = () => ({ plans: FinanceService.snapshot().plans, fiscal: StorageService.getConfig().fiscal });
import { ImpotBiereSheet, ImpotBiereLien, anneeDuBrassin, baseImpot } from '../../ui/production/ImpotBiereSheet';
import { StorageService } from '../../services/storage';
import { BEER_TAX_SOURCE, BAREME_IMPOT_BIERE } from '../../domain/finance/swissBeerTax';
import { ClientStatsService } from '../../services/clientStats';
import { lireTelephone } from '../../services/clientPhone';
import { montantChf } from '../../domain/finance/ledger';
import { EditClientModal } from '../EditClientModal';
import { PrixEcran } from '../../ui/prix/PrixEcran';
import { FinanceService } from '../../services/financeService';
import { nextClientId } from '../../services/refs';
import { useLiveSelection, useStorageValue } from '../../hooks/useLiveData';
import { ViewNavigation } from '../../ui/ViewNavigation';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { inputClass } from '../../ui/FormNav';
import '../../ui/clients.css';
import { nombreFr } from '../../domain/nombreAffiche';
/** La phrase du barème, dérivée de `BAREME_IMPOT_BIERE` (une seule source) : bornes basses à 0,1 °P au-dessus de la borne précédente. */
const PHRASE_BAREME = 'Barème par hectolitre : ' + BAREME_IMPOT_BIERE.map((tranche, i) => {
  const taux = `${montantChf(tranche.chfParHl)} CHF`;
  const debut = i === 0 ? null : nombreFr(BAREME_IMPOT_BIERE[i - 1].jusquaPlato + 0.1, 1);
  return debut === null ? `${taux} jusqu’à ${nombreFr(tranche.jusquaPlato, 1)} °P`
    : Number.isFinite(tranche.jusquaPlato) ? `${taux} de ${debut} à ${nombreFr(tranche.jusquaPlato, 1)} °P` : `${taux} dès ${debut} °P`;
}).join(' ; ') + '.';
const Caisse = React.lazy(() => import('../../ui/vente/Caisse').then(m => ({ default: m.Caisse })));

const amountFormat = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = (value: number) => Number.isFinite(value) ? amountFormat.format(value) : '—';
const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
const clientStatuses: ClientStatus[] = ['Prospect', 'Actif', 'Fidèle'];

interface ClientsTabProps {
  clients: Client[];
  batches: Batch[];
  tarifs: PricingItem[];
  config: AppConfig;
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
  /** Demande de tarif neuf (bouton +) : l'écran Prix ouvre sa feuille. */
  const [nouveauTarif, setNouveauTarif] = useState<number | null>(null);
  // Persistent subtab
  const [subTab, setSubTab] = useState<'crm' | 'ofdf' | 'tarifs'>(() =>
    StorageService.getUiState('clients_subtab', 'crm')
  );

  const [copiedTax, setCopiedTax] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [editingClient, setEditingClient] = useLiveSelection(clients, 'id');
  const [caisseClient, setCaisseClient] = useLiveSelection(clients, 'id');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
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
    if (createRequest.kind === 'newTarif') setNouveauTarif(createRequest.at);
  }, [createRequest?.at]);

  // Le bouton d'action doit savoir où l'on est : il crée ce que l'écran montre.
  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  useEffect(() => {
    StorageService.setUiState('clients_subtab', subTab);
  }, [subTab]);

  // Constat 16 : la réserve annuelle renvoie aux brassins de l'année, chacun avec sa règle des degrés (feuille de la fiche), pour un seul récit de l'impôt.
  const [impotBatch, setImpotBatch] = useState<Batch | null>(null);
  const donneesImpot = useStorageValue(lireImpot);
  const brassinsImpot = useMemo(() => batches.filter(batch => batch.status !== 'planifie' && anneeDuBrassin(batch) === taxYear), [batches, taxYear]);

  const totalImpot = useMemo(() => {
    let cents = 0, inconnus = 0, approx = false;
    for (const batch of brassinsImpot) {
      const b = baseImpot(batch, donneesImpot);
      const plato = b.densite === 'notee' ? b.lu.plato : b.visee;
      const montant = plato != null && b.litres ? b.calcul(plato, b.litres.litres).montant : null;
      if (montant === null) inconnus++; else cents += Math.round(montant * 100);
      if (b.densite !== 'notee') approx = true;
    }
    return { total: cents / 100, inconnus, approx };
  }, [brassinsImpot, donneesImpot]);
  const pctReduction = donneesImpot.fiscal.beerTaxAnnualReductionPct;
  const reductionConfirmee = typeof pctReduction === 'number' && Number.isFinite(pctReduction) && pctReduction >= 0 && pctReduction <= 40 && donneesImpot.fiscal.beerTaxReductionYear === taxYear;
  const totalTexte = brassinsImpot.length === 0 || (totalImpot.inconnus > 0 && totalImpot.total === 0) ? '—' : `${totalImpot.inconnus > 0 ? '≥ ' : totalImpot.approx ? '~ ' : ''}${montantChf(totalImpot.total)} CHF`;

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
  const handleCopyOfdfValues = () => {
    const text = `IMPÔT SUR LA BIÈRE — ${taxYear}
Entreprise : ${config.company.name}
Brassins de l'année : ${brassinsImpot.length}
Impôt estimé : ${totalTexte}${totalImpot.inconnus > 0 ? ` (densité à noter pour ${totalImpot.inconnus} brassin(s))` : ''}
${reductionConfirmee ? `Réduction petit brasseur confirmée : ${nombreFr(pctReduction, 1)} %.` : 'Taux plein : réduction à confirmer dans les réglages.'}
Estimation indicative : l'impôt est dû à la sortie de cave (déclaration via Taxas).`;

    /* TE-8 : le retour est visible dans les deux cas ; une copie refusée par le navigateur le dit au lieu de se taire. */
    void Promise.resolve(navigator.clipboard?.writeText(text)).then(() => setCopiedTax('ok'), () => setCopiedTax('failed'));
    if (!navigator.clipboard) setCopiedTax('failed');
    setTimeout(() => setCopiedTax('idle'), 4000);
  };

  const handleGenerateInvoicePdf = (client: Client) => {
    setCaisseClient(client);
  };

  return (
    <div className="clients-workspace">
      <ViewNavigation<typeof subTab>
        label="Vue des clients" value={subTab} onChange={setSubTab}
        options={[{ value: 'crm', label: 'Carnet' }, { value: 'tarifs', label: 'Prix' }, { value: 'ofdf', label: 'Impôt bière' }]}
      >
        <div className="clients-navigation" role="group" aria-label="Vue des clients">
          {([
            { value: 'crm', label: 'Carnet', icon: Users },
            { value: 'tarifs', label: 'Prix', icon: FileText },
            { value: 'ofdf', label: 'Impôt bière', icon: ShieldCheck }
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
                  options={[{ value: 'all', label: 'Tous' }, { value: 'Pro', label: `Pro ${proCount}` }, { value: 'Privé', label: `Privés ${privateCount}` }]} />
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
                    <span className="font-mono">{stats.orderCount ? `${amount(stats.totalSales)} CHF` : '—'}</span>
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
                    {(() => {
                      /* TE-2 : un lien ne part que d'un numéro lisible ; WhatsApp veut l'indicatif du pays. */
                      const tel = client.phone ? lireTelephone(client.phone) : null;
                      return tel?.ok ? <>
                        <a href={`tel:${tel.tel}`} className="clients-action"><Phone size={14} aria-hidden="true" />Appeler</a>
                        {tel.whatsapp && <a href={`https://wa.me/${tel.whatsapp}`} target="_blank" rel="noreferrer" className="clients-action"><MessageSquare size={14} aria-hidden="true" />WhatsApp</a>}
                      </> : null;
                    })()}
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
        <section className="clients-tax" aria-label="Impôt bière de l’année">
          <div className="clients-tax-header">
            <h3>Impôt bière</h3>
            <label className="clients-tax-year">Année
              <select aria-label="Année de réserve OFDF" value={taxYear} onChange={event => setTaxYear(Number(event.target.value))} className={inputClass}>
                {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map(year => <option key={year}>{year}</option>)}
              </select>
            </label>
          </div>
          <dl className="clients-tax-reading">
            <div>
              <dt>{brassinsImpot.length > 0 ? `${brassinsImpot.length} brassin${brassinsImpot.length > 1 ? 's' : ''} en ${taxYear}` : `Aucun brassin en ${taxYear}`}</dt>
              <dd className="font-mono">{totalTexte}</dd>
            </div>
          </dl>
          {brassinsImpot.length > 0 && <div className="clients-tax-brassins" role="group" aria-label="Impôt par brassin">
            <span className="clients-tax-brassins-titre">Par brassin · règle des degrés</span>
            {brassinsImpot.map(batch => <ImpotBiereLien key={batch.id} batch={batch} titre={batch.name} className="clients-tax-brassin" onOpen={() => setImpotBatch(batch)} />)}
          </div>}
          {impotBatch && <ImpotBiereSheet batch={impotBatch} onClose={() => setImpotBatch(null)} />}
          {totalImpot.inconnus > 0 && <p className="text-attention">Densité à noter pour {totalImpot.inconnus} brassin(s) : le total est un minimum.</p>}
          <p className="text-cave-400">{reductionConfirmee ? `Réduction annuelle confirmée : ${nombreFr(pctReduction, 1)} %.` : 'Taux plein : réduction annuelle à confirmer dans les réglages.'}</p>
          <details className="clients-help">
            <summary>Comprendre le calcul et les démarches<ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="clients-tax-help-body">
              <p>{PHRASE_BAREME}</p>
              <p>Le taux annuel de réduction est communiqué par l’OFDF. Il ne se déduit pas du seul volume de cette période.</p>
              <p>Selon le régime attribué : déclaration sous 20 jours et paiement sous 30 jours après la fin du trimestre ou de l’année, via Taxas.</p>
              <p>TVA de la bière alcoolisée : {config.fiscal.isTvaRegistered ? 'taux normal de 8,1 %.' : 'brasserie non assujettie, aucune TVA facturée.'}</p>
            </div>
          </details>
          <div className="clients-tax-actions">
            <button type="button" onClick={handleCopyOfdfValues} className="clients-action clients-tax-copy">{copiedTax === 'ok' ? 'Estimation copiée' : 'Copier cette estimation'}</button>
            <span role="status" className="text-xs text-cave-400">{copiedTax === 'ok' ? 'Copiée dans le presse-papiers.' : copiedTax === 'failed' ? 'Copie refusée par le navigateur : l’estimation reste à lire ci-dessus.' : ''}</span>
            <a href="https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation" target="_blank" rel="noreferrer" className="clients-tax-link">Ouvrir Taxas</a>
            <a href={BEER_TAX_SOURCE} target="_blank" rel="noreferrer" className="clients-tax-link">Directives OFDF</a>
          </div>
        </section>
      )}
      {subTab === 'tarifs' && <section aria-label="Prix" className="clients-section"><PrixEcran config={config} tarifs={tarifs} batches={batches} nouveau={nouveauTarif} onSuccessMessage={onSuccessMessage} /></section>}

      {/* Edit Client Modal */}
      {caisseClient && <React.Suspense fallback={<p role="status">Ouverture de la caisse…</p>}><Caisse clientIdInitial={caisseClient.id} onClose={() => setCaisseClient(null)} onSaved={message => onSuccessMessage?.(message)} /></React.Suspense>}
      <EditClientModal
        isOpen={Boolean(editingClient)}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={() => setEditingClient(null)}
      />
    </div>
  );
};
