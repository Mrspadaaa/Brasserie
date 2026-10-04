import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ propose: vi.fn(), apply: vi.fn(), alternatives: vi.fn() }));
vi.mock('../../src/services/yeastDbCorrections', () => ({
  YeastDbCorrections: {
    propose: mocks.propose,
    apply: mocks.apply,
    searchAlternatives: mocks.alternatives
  }
}));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer, onClose }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}<button onClick={onClose}>Fermer</button></div> : null
}));

import { YeastDbCorrectionsPanel } from '../../src/ui/YeastDbCorrectionsPanel';
import type { YeastDbCorrectionClientReceipt, YeastDbCorrectionTarget, YeastDbCorrectionProposal } from '../../functions/src/yeastDbCorrectionTypes';
import type { BrewerTurn } from '../../functions/src/companionTypes';

const source = { title: 'Fiche fabricant US-05', url: 'https://fermentis.com/en/product/safale-us-05/', checkedAt: '2026-09-27T10:00:00Z', origin: 'ai' as const };
const target: YeastDbCorrectionTarget = { scope: 'catalogue', id: 'fermentis-us05', fallback: {
  id: 'fermentis-us05', kind: 'yeast', name: 'SafAle US-05', betaLyase: 'unknown',
  source: { title: 'Fermentis', author: 'Fermentis', year: 2026, kind: 'manufacturer', reference: source.url },
  catalogue: { manufacturer: 'Fermentis', productId: 'US-05', productCode: 'US-05', aliases: [], categories: ['ale'], status: 'listed', facts: [],
    documents: [{ title: 'Fiche fabricant', url: source.url }], retrievals: [{ url: source.url, retrievedAt: source.checkedAt, sha256: 'a'.repeat(64), etag: null, lastModified: null }],
    publishedAt: null, pageUpdatedAt: null, parserVersion: 'test', contentSha256: 'b'.repeat(64), gaps: [] }
} };
const proposal: YeastDbCorrectionProposal = {
  id: 'c'.repeat(32), target: { scope: 'catalogue', id: target.id }, proposedByUid: 'qa-user', signature: 'f'.repeat(64), targetExists: false, expectedRevision: 'd'.repeat(64),
  fallback: target.fallback, generatedAt: Date.parse('2026-09-27T10:00:00Z'), model: 'Gemini test', title: 'Corriger la fiche documentaire',
  changes: [{ id: 'C1', field: 'catalogue.technicalFact', label: 'temperature · Beer', before: {
    key: 'temperature', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range', origin: 'manufacturer', source: 'Fermentis', sourceUrl: source.url, context: 'Beer'
  }, value: { key: 'temperature', reported: '17–23 °C', range: { min: 17, max: 23 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche fabricant US-05', sourceUrl: source.url, retrievedAt: source.checkedAt, context: 'Beer' },
  reason: 'La fiche donne une autre plage.', context: 'Beer', source }]
};
const receipt: YeastDbCorrectionClientReceipt = { id: proposal.id, target: { scope: 'catalogue', id: target.id }, selectedIds: ['C1'], auditId: 'LOG-1',
  status: 'server-confirmed', confirmedAt: Date.now(), revisionBefore: 'd'.repeat(64), revisionAfter: 'e'.repeat(64), targetCreated: true, readback: 'refreshed' };
const turn: BrewerTurn = { id: 'turn', operationId: 'operation-123456789', question: 'Alternative', createdAt: Date.now(), model: 'Gemini', reviewed: true,
  contextLabel: 'Levure', evidence: [], advice: { level: 'info', summary: 'WLP001 est une piste fonctionnelle, pas une identité équivalente.', action: 'Vérifier la souche et le conditionnement.', why: 'Le profil est comparable sous certaines conditions.', watch: 'La conduite peut différer.', question: 'Quel format est disponible ?', evidenceIds: [] } };
const offerTarget = { scope: 'offer' as const, id: 'yeast-pack-11g', offerId: 'ch-shop-11g', fallback: {
  id: 'yeast-pack-11g', version: 1 as const, revision: 0,
  product: { id: 'yeast-pack-11g', referenceId: 'yeast-ref', label: 'SafAle US-05 11 g', manufacturer: 'Fermentis', form: 'sèche' as const,
    source: { title: 'Fiche fabricant', url: 'https://fermentis.com/en/product/safale-us-05/', checkedAt: '2026-09-27T10:00:00Z' } },
  offers: [{ id: 'ch-shop-11g', productId: 'yeast-pack-11g', seller: 'Brau- und Rauchshop', url: 'https://www.brauundrauchshop.ch/safale-us-05-115g-4',
    stock: { status: 'unknown' as const, text: 'Stock inconnu', source: { title: 'Fiche vendeur', url: 'https://www.brauundrauchshop.ch/safale-us-05-115g-4', checkedAt: '2026-09-27T10:00:00Z' } } }]
} };
const oldOfferUrl = 'https://old.brewshop.example/safale-us-05-11g';
const correctedOfferUrl = 'https://shop.example/products/safale-us-05-11g';
const offerSource = { title: 'Nouvelle fiche vendeur', url: correctedOfferUrl, checkedAt: '2026-09-27T10:00:00Z', origin: 'merchant' as const,
  linkCorrection: { originalUrl: oldOfferUrl, correctedAt: '2026-09-27T10:00:00Z' } };
const offerProposal: YeastDbCorrectionProposal = { ...proposal,
  target: { scope: 'offer', id: offerTarget.id, offerId: offerTarget.offerId }, fallback: offerTarget.fallback,
  targetExists: true, expectedRevision: 'a'.repeat(64), title: 'Actualiser l’offre', changes: [
    { id: 'PRICE', field: 'offer.price', label: 'Prix · base 1 pack', before: { amount: 4.9, currency: 'CHF', packs: 1,
      source: { title: 'Ancienne fiche vendeur https://old.brewshop.example', url: oldOfferUrl, checkedAt: '2026-09-26T08:30:00Z', origin: 'merchant' } },
      value: { amount: 5.25, currency: 'CHF', packs: 2, source: offerSource }, reason: 'Prix relevé pour deux packs.',
      context: 'Conditionnement 11 g', source: offerSource },
    { id: 'SHIP', field: 'offer.shipping', label: 'Livraison vers la Suisse', before: null,
      value: { destination: 'CH', status: 'yes', conditions: 'Frais CHF 8 · délai annoncé de 2 jours', source: offerSource },
      reason: 'La fiche décrit la livraison vers la Suisse.', context: 'Offre marchand', source: offerSource }
  ]
};
const manualProduct = { id: 'manual-product', referenceId: 'yeast-ref', label: 'Levure exacte 11 g', manufacturer: 'Brasserie Test', form: 'sèche' as const,
  source: { title: 'Produit saisi', url: 'https://example.test/manual/product', checkedAt: '2026-09-27T10:00:00Z', origin: 'manual' as const },
  format: { amount: 11, unit: 'g' as const, label: 'sachet 11 g', source: { title: 'Conditionnement saisi', url: 'https://example.test/manual/format', checkedAt: '2026-09-27T10:00:00Z', origin: 'manual' as const } },
  dose: { range: { min: 50, max: 80 }, qualifier: 'range' as const, unit: 'g/hL' as const, conditions: 'Moût standard', source: { title: 'Dose saisie', url: 'https://example.test/manual/dose', checkedAt: '2026-09-27T10:00:00Z', origin: 'manual' as const } } };
const manualProductProposal: YeastDbCorrectionProposal = { ...proposal,
  target: { scope: 'product', id: manualProduct.id }, fallback: { id: manualProduct.id, version: 1, revision: 0, product: manualProduct, offers: [] },
  targetExists: false, model: 'Saisie manuelle', title: 'Créer une fiche produit exacte', changes: [{ id: 'C1', field: 'product.create', label: 'Créer le produit exact',
    before: null, value: manualProduct, reason: 'Produit exact saisi par le brasseur.', context: 'Saisie manuelle · informations non vérifiées par le serveur.', source: manualProduct.source }] };
const offerCreateProposal: YeastDbCorrectionProposal = { ...proposal,
  target: { scope: 'offer', id: 'manual-product', offerId: 'offer-manual' }, targetExists: true, model: 'Saisie manuelle', title: 'Ajouter une offre au produit exact',
  changes: [{ id: 'C1', field: 'offer.create', label: 'Ajouter l’offre · Marchand test', before: null,
    value: { id: 'offer-manual', productId: 'manual-product', seller: 'Marchand test', url: 'https://example.test/manual/offer',
      stock: { status: 'unknown', text: 'Non vérifié', source: { title: 'Offre saisie', url: 'https://example.test/manual/offer', checkedAt: '2026-09-27T10:00:00Z', origin: 'manual' } } },
    reason: 'Offre saisie par le brasseur.', context: 'Aucune lecture vendeur vérifiée.', source: { title: 'Offre saisie', url: 'https://example.test/manual/offer', checkedAt: '2026-09-27T10:00:00Z', origin: 'manual' } }] };

beforeEach(() => { vi.clearAllMocks(); mocks.propose.mockResolvedValue(proposal); mocks.apply.mockResolvedValue(receipt); mocks.alternatives.mockResolvedValue(turn); });
afterEach(cleanup);

describe('panneau autonome de correction catalogue', () => {
  it('écarte une proposition manuelle précalculée en revenant à son brouillon, sans ouvrir Gemini', () => {
    const onClose = vi.fn();
    render(<YeastDbCorrectionsPanel target={offerCreateProposal.target} initialProposal={offerCreateProposal} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.apply).not.toHaveBeenCalled();
    expect(mocks.propose).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Que vérifier ou corriger?')).not.toBeInTheDocument();
  });

  it('raccorde l’identité serveur stock.id à la cible de l’article stock.ref', async () => {
    const stockTarget = { scope: 'stock' as const, ref: 'LOT-stock-QA' };
    const stockProposal: YeastDbCorrectionProposal = { ...proposal, target: stockTarget,
      targetExists: true, fallback: undefined, changes: proposal.changes.map(change => ({ ...change, field: 'stock.technicalFact' })) };
    mocks.apply.mockResolvedValueOnce({ ...receipt, target: { scope: 'stock', id: stockTarget.ref } });
    render(<YeastDbCorrectionsPanel target={stockTarget} initialProposal={stockProposal} onClose={vi.fn()} />);
    expect(screen.getByText(/17–23 °C/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction dans la base' }));
    expect(await screen.findByRole('heading', { name: 'Reçu serveur confirmé' })).toBeVisible();
    expect(mocks.apply).toHaveBeenCalledWith(stockProposal, ['C1']);
  });

  it('ignore la proposition A reçue après fermeture et ouverture de B', async () => {
    let resolveA!: (value: YeastDbCorrectionProposal) => void;
    mocks.propose.mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; }));
    const onClose = vi.fn();
    const view = render(<YeastDbCorrectionsPanel target={target} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Vérifier A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une correction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledOnce();
    view.rerender(<YeastDbCorrectionsPanel target={null} onClose={onClose} />);
    const other = { scope: 'catalogue' as const, id: 'fixture-reference-B' };
    view.rerender(<YeastDbCorrectionsPanel target={other} onClose={onClose} />);
    await act(async () => { resolveA(proposal); });
    expect(screen.queryByText(/17–23 °C/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enregistrer la fiche personnelle corrigée' })).not.toBeInTheDocument();
    expect(mocks.apply).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/fixture-reference-B/);
  });

  it('refuse avant confirmation une proposition qui ne correspond pas à la cible ouverte', async () => {
    const other = { scope: 'catalogue' as const, id: 'fixture-reference-B' };
    render(<YeastDbCorrectionsPanel target={other} initialProposal={proposal} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Enregistrer la fiche personnelle corrigée' })).not.toBeInTheDocument();
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it('montre avant/après puis attend le geste explicite avant la confirmation serveur', async () => {
    const onUpdated = vi.fn();
    render(<YeastDbCorrectionsPanel target={target} onClose={vi.fn()} onUpdated={onUpdated} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Vérifie la plage de fermentation déjà enregistrée.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une correction' }));
    await screen.findByText(/17–23 °C/);
    expect(screen.getByText(/Source reprise par Gemini/)).toBeVisible();
    expect(screen.getByText(/Cette ligne vient du catalogue bootstrap/)).toBeVisible();
    expect(mocks.apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche personnelle corrigée' }));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith(proposal, ['C1']));
    expect(await screen.findByText(/Correction confirmée par le serveur/)).toBeVisible();
    expect(onUpdated).toHaveBeenCalledWith(receipt);
  });

  it('propose séparément la recherche d’alternatives et ne présente pas son résultat comme un choix adopté', async () => {
    render(<YeastDbCorrectionsPanel target={target} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Cherche une alternative pour une ale américaine à 20 °C.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher des alternatives' }));
    expect(await screen.findByText('Alternatives à examiner · aucun changement adopté')).toBeVisible();
    expect(screen.getByText(/WLP001 est une piste fonctionnelle, pas une identité équivalente/)).toBeVisible();
    expect(mocks.alternatives).toHaveBeenCalledWith(target, 'Cherche une alternative pour une ale américaine à 20 °C.', {});
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it('garde une saisie manuelle d’offre distincte d’une vérification serveur de la page', async () => {
    const manualProposal = { ...proposal, target: { scope: 'offer' as const, id: offerTarget.id, offerId: offerTarget.offerId }, targetExists: false, fallback: offerTarget.fallback,
      model: 'Saisie manuelle', title: 'Observation vendeur saisie par le brasseur', changes: [{ id: 'C1', field: 'offer.stock', label: 'Disponibilité observée manuellement',
        before: offerTarget.fallback.offers[0].stock, value: { status: 'out-of-stock', text: 'Rupture de stock', source: { title: 'Fiche fournisseur', url: offerTarget.fallback.offers[0].url, checkedAt: source.checkedAt, origin: 'manual' } },
        reason: 'La page indiquait une rupture.', source: { title: 'Fiche fournisseur', url: offerTarget.fallback.offers[0].url, checkedAt: source.checkedAt, origin: 'manual' } }] };
    mocks.propose.mockResolvedValueOnce(manualProposal);
    render(<YeastDbCorrectionsPanel target={offerTarget} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Saisir une observation manuelle'));
    fireEvent.change(screen.getByLabelText('Disponibilité observée'), { target: { value: 'out-of-stock' } });
    fireEvent.change(screen.getByLabelText('Texte vu sur la fiche vendeur'), { target: { value: 'Rupture de stock' } });
    fireEvent.change(screen.getByLabelText('Titre de la source'), { target: { value: 'Fiche fournisseur' } });
    fireEvent.change(screen.getByLabelText('URL directe de la page source'), { target: { value: offerTarget.fallback.offers[0].url } });
    fireEvent.change(screen.getByLabelText('Date et heure de l’observation'), { target: { value: '2026-09-27T10:00' } });
    fireEvent.change(screen.getByLabelText('Motif de la correction'), { target: { value: 'La page indiquait une rupture.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer cette observation' }));
    expect(await screen.findAllByText(/Saisie manuelle/)).not.toHaveLength(0);
    expect(mocks.propose).toHaveBeenCalledWith(offerTarget, 'La page indiquait une rupture.', expect.objectContaining({ status: 'out-of-stock', source: expect.objectContaining({ url: offerTarget.fallback.offers[0].url }) }));
    expect(screen.getByText(/il n’a pas vérifié la page ou l’observation saisie/i)).toBeVisible();
  });

  it('formate prix et livraison en champs lisibles, avec les deux sources liées une seule fois', async () => {
    mocks.propose.mockResolvedValueOnce(offerProposal);
    render(<YeastDbCorrectionsPanel target={offerTarget} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Actualise le prix et la livraison.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une correction' }));
    expect(await screen.findByText(/4,90 CHF · base de 1 pack/)).toBeVisible();
    expect(screen.getByText(/5,25 CHF · base de 2 packs/)).toBeVisible();
    expect(screen.getByText(/Frais CHF 8 · délai annoncé de 2 jours/)).toBeVisible();
    expect(screen.getAllByText(/Source vendeur/).length).toBeGreaterThan(1);

    fireEvent.click(screen.getByText('Sources des valeurs · 2'));
    expect(screen.getAllByRole('link', { name: 'Ancienne fiche vendeur' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Nouvelle fiche vendeur' })).toHaveLength(1);
    const rendered = document.body.textContent ?? '';
    expect(rendered).not.toContain(oldOfferUrl);
    expect(rendered).not.toContain(correctedOfferUrl);
    expect(rendered).not.toContain('2026-09-27T10:00:00Z');
    expect(rendered).toContain('26.09.2026');
    expect(rendered).toContain('27.09.2026');
    expect(rendered).toContain('Lien précédent conservé');
  });

  it('distingue confirmation serveur et readback en attente', async () => {
    const pendingReceipt = { ...receipt, readback: 'pending' as const };
    mocks.apply.mockResolvedValueOnce(pendingReceipt);
    const onUpdated = vi.fn();
    render(<YeastDbCorrectionsPanel target={target} onClose={vi.fn()} onUpdated={onUpdated} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Vérifie la plage de fermentation déjà enregistrée.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une correction' }));
    await screen.findByText(/17–23 °C/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche personnelle corrigée' }));
    expect(await screen.findByText(/Correction confirmée par le serveur. La mise à jour de la fiche locale est encore en attente./)).toBeVisible();
    expect(screen.getByText(/Révision [a-f0-9]+ → [a-f0-9]+ · audit LOG-1 · fiche catalogue créée/)).toBeVisible();
    expect(onUpdated).toHaveBeenCalledWith(pendingReceipt);
  });

  it('ouvre une création produit directement en revue, sans appeler Gemini, et affiche chaque source avant confirmation', async () => {
    const productReceipt: YeastDbCorrectionClientReceipt = { ...receipt, target: { scope: 'product', id: manualProduct.id },
      entityCreated: 'product', readback: 'pending' };
    mocks.apply.mockResolvedValueOnce(productReceipt);
    const onClose = vi.fn();
    render(<YeastDbCorrectionsPanel target={manualProductProposal.target} initialProposal={manualProductProposal} onClose={onClose} />);
    expect(screen.getByText('Créer une fiche produit exacte')).toBeVisible();
    expect(screen.getByText(/Le serveur contrôlera l’identité, la forme et la révision, pas les faits ni les sources marchandes/)).toBeVisible();
    expect(screen.queryByLabelText('Que vérifier ou corriger?')).not.toBeInTheDocument();
    expect(mocks.propose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Sources des valeurs · 3'));
    expect(screen.getByRole('link', { name: 'Produit saisi' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Conditionnement saisi' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Dose saisie' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le produit exact' }));
    expect(await screen.findByText(/audit LOG-1 · produit exact créé/)).toBeVisible();
    expect(screen.getByText(/lecture dans le cache local reste en attente/)).toBeVisible();
    expect(mocks.apply).toHaveBeenCalledWith(manualProductProposal, ['C1']);
    expect(screen.queryByRole('button', { name: 'Créer le produit exact' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[0]);
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.apply).toHaveBeenCalledTimes(1);
  });

  it('reçoit une nouvelle offre sans annoncer la création du document parent', async () => {
    const offerReceipt: YeastDbCorrectionClientReceipt = { ...receipt, target: { scope: 'offer', id: 'manual-product', offerId: 'offer-manual' },
      targetCreated: false, entityCreated: 'offer', readback: 'refreshed' };
    mocks.apply.mockResolvedValueOnce(offerReceipt);
    render(<YeastDbCorrectionsPanel target={offerCreateProposal.target} initialProposal={offerCreateProposal} onClose={vi.fn()} />);
    expect(screen.getByText(/Portée : offre offer-manual/)).toBeVisible();
    expect(screen.getByText(/Marchand test/)).toBeVisible();
    const after = screen.getByText('Après · proposition').parentElement!;
    expect(after).toHaveTextContent('Saisie manuelle · source commune');
    expect(after).not.toHaveTextContent('Origine non précisée');
    expect(after.textContent?.match(/Saisie manuelle · source commune/g)).toHaveLength(1);
    fireEvent.click(screen.getByText('Source commune · 1'));
    expect(screen.getByRole('link', { name: 'Offre saisie' })).toHaveAttribute('href', 'https://example.test/manual/offer');
    expect(mocks.propose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter l’offre exacte' }));
    expect(await screen.findByText(/audit LOG-1 · offre ajoutée/)).toBeVisible();
    expect(screen.queryByText(/fiche produit créée/)).not.toBeInTheDocument();
  });

  it('empêche la fermeture pendant une écriture et n’annonce pas son résultat avant le reçu', async () => {
    let resolveApply!: (value: YeastDbCorrectionClientReceipt) => void;
    const pending = new Promise<YeastDbCorrectionClientReceipt>(resolve => { resolveApply = resolve; });
    mocks.apply.mockReturnValueOnce(pending);
    const onClose = vi.fn();
    const productReceipt: YeastDbCorrectionClientReceipt = { ...receipt, target: { scope: 'product', id: manualProduct.id },
      entityCreated: 'product', readback: 'refreshed' };
    render(<YeastDbCorrectionsPanel target={manualProductProposal.target} initialProposal={manualProductProposal} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Créer le produit exact' }));
    expect(await screen.findByRole('button', { name: 'Confirmation serveur…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText(/confirmation serveur est en cours/)).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Reçu serveur confirmé' })).not.toBeInTheDocument();
    await act(async () => { resolveApply(productReceipt); await pending; });
    expect(await screen.findByRole('heading', { name: 'Reçu serveur confirmé' })).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('garde la proposition locale et n’affiche aucun reçu si la révision a changé', async () => {
    mocks.apply.mockRejectedValueOnce(new Error('Conflit de révision. Recharge la fiche avant de confirmer.'));
    const onUpdated = vi.fn();
    render(<YeastDbCorrectionsPanel target={target} onClose={vi.fn()} onUpdated={onUpdated} />);
    fireEvent.change(screen.getByLabelText('Que vérifier ou corriger?'), { target: { value: 'Vérifie la plage de fermentation déjà enregistrée.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une correction' }));
    await screen.findByText(/17–23 °C/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche personnelle corrigée' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Conflit de révision. Recharge la fiche avant de confirmer.');
    expect(screen.getByText(/17–23 °C/)).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Reçu serveur confirmé' })).not.toBeInTheDocument();
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
