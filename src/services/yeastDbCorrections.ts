import { BrewerChat } from './brewerChat';
import { FirestoreRepo, type CollectionName } from './firestoreRepo';
import { StorageService } from './storage';
import type { YeastAlternativeContext, YeastDbCorrectionClientReceipt, YeastDbCorrectionProposal,
  YeastDbCorrectionManualCreate, YeastDbCorrectionManualOfferObservation, YeastDbCorrectionReceipt, YeastDbCorrectionTarget } from '../../functions/src/yeastDbCorrectionTypes';
import type { BrewerTurn } from '../../functions/src/companionTypes';
import { readYeastProductDocument, validYeastOffer, validYeastStarterProtocol, type YeastOffer, type YeastProductDocument, type YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';

export type { YeastDbCorrectionChange, YeastDbCorrectionClientReceipt, YeastDbCorrectionIdentity, YeastDbCorrectionProposal, YeastDbCorrectionReceipt,
  YeastDbCorrectionScope, YeastDbCorrectionTarget, YeastAlternativeContext, YeastDbCorrectionManualCreate, YeastDbCorrectionManualOfferObservation } from '../../functions/src/yeastDbCorrectionTypes';
export type { YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';
export type YeastDbCorrectionPanelTarget = YeastDbCorrectionTarget;

function collectionAndId(target: YeastDbCorrectionTarget): { collection: CollectionName; id: string } {
  if (target.scope === 'catalogue') return { collection: 'hopKnowledge', id: target.id };
  if (target.scope === 'stock') return { collection: 'stockItems', id: target.ref };
  return { collection: 'yeastProducts', id: target.id };
}
function assertTargetReady(target: YeastDbCorrectionTarget): { collection: CollectionName; id: string } {
  if (!FirestoreRepo.isReady()) throw new Error('Les données ne sont pas encore chargées. Attends la synchronisation avant de demander une correction.');
  const sync = FirestoreRepo.syncStatus();
  if (sync.fromCache || sync.needsRefresh) throw new Error('Les données serveur sont indisponibles. La fiche locale reste visible; aucune correction ne sera présentée comme confirmée.');
  const path = collectionAndId(target), write = FirestoreRepo.documentWriteState(path.collection, path.id);
  if (write.status === 'queued' || write.status === 'pending') throw new Error('Une saisie de cette fiche attend sa synchronisation. Attends son résultat avant de demander une proposition IA.');
  if (write.status === 'rejected') throw new Error(write.error ?? 'Une saisie locale de cette fiche a été refusée. Recharge-la avant de poursuivre.');
  if (target.scope === 'catalogue' && !StorageService.getHopKnowledge().some(row => row.id === target.id) && !target.fallback)
    throw new Error('Cette référence ne figure pas dans les données locales chargées. Rouvre le catalogue avant de demander une correction.');
  if ((target.scope === 'product' || target.scope === 'offer') && !StorageService.getYeastProducts().some(row => row.id === target.id) && !target.fallback)
    throw new Error('Ce produit ne figure pas dans les données locales chargées. Rouvre la fiche avant de demander une correction.');
  if (target.scope === 'stock' && !StorageService.getStocks().rawMaterials.some(row => row.ref === target.ref && row.category === 'Levure'))
    throw new Error('Cet article n’est pas un stock de levure chargé dans l’inventaire.');
  return path;
}
function callable<TInput, TResult>(name: string) {
  return import('firebase/functions').then(async ({ httpsCallable }) => {
    const { functions } = await import('./firebase');
    return httpsCallable<TInput, TResult>(functions, name, { timeout: name === 'proposeYeastDbCorrection' ? 160000 : 35000 });
  });
}

async function requestProposal(target: YeastDbCorrectionPanelTarget, request: string,
  manual?: YeastDbCorrectionManualOfferObservation | YeastDbCorrectionManualCreate): Promise<YeastDbCorrectionProposal> {
  assertTargetReady(target);
  const { context, ...identity } = target;
  const call = await callable<{ target: YeastDbCorrectionTarget; request: string; context?: YeastAlternativeContext;
    manual?: YeastDbCorrectionManualOfferObservation | YeastDbCorrectionManualCreate }, YeastDbCorrectionProposal>('proposeYeastDbCorrection');
  return (await call({ target: identity, request: request.trim(), ...(context ? { context } : {}), ...(manual ? { manual } : {}) })).data;
}

export const YeastDbCorrections = {
  async propose(target: YeastDbCorrectionPanelTarget, request: string, manual?: YeastDbCorrectionManualOfferObservation): Promise<YeastDbCorrectionProposal> {
    return requestProposal(target, request, manual);
  },

  /** Prepare a signed manual proposal; the server checks absence/revision, but does not verify sources or claims. */
  async proposeProductCreation(document: YeastProductDocument, context?: YeastAlternativeContext): Promise<YeastDbCorrectionProposal> {
    const fallback = readYeastProductDocument(document);
    if (!fallback || fallback.revision !== 0 || fallback.offers.length !== 0)
      throw new Error('La création manuelle attend un document produit valide, neuf et sans offre.');
    return requestProposal({ scope: 'product', id: fallback.id, fallback, ...(context ? { context } : {}) },
      'Création manuelle du produit exact par le brasseur.', { kind: 'product-create' });
  },

  /** Append one explicitly identified offer to the exact product, or to its bootstrap fallback if not yet canonical. */
  async proposeOfferCreation(target: { id: string; fallback?: YeastProductDocument; context?: YeastAlternativeContext }, offer: YeastOffer): Promise<YeastDbCorrectionProposal> {
    if (!validYeastOffer(offer) || offer.productId !== target.id || offer.revision !== undefined && offer.revision !== 0)
      throw new Error('L’offre doit être valide, porter un ID stable et appartenir au produit exact.');
    if (target.fallback) {
      const parent = readYeastProductDocument(target.fallback);
      if (!parent || parent.id !== target.id || parent.offers.some(row => row.id === offer.id))
        throw new Error('Le produit parent ne peut pas fournir cette offre comme ajout manuel.');
    } else {
      const parent = StorageService.getYeastProducts().find(row => row.id === target.id);
      if (parent?.offers.some(row => row.id === offer.id)) throw new Error('Cette offre existe déjà dans le produit.');
    }
    return requestProposal({ scope: 'offer', id: target.id, offerId: offer.id,
      ...(target.fallback ? { fallback: target.fallback } : {}), ...(target.context ? { context: target.context } : {}) },
    'Ajout manuel de cette offre au produit exact.', { kind: 'offer-create', offer });
  },

  /** Prepare a sourced manual starter protocol for the exact liquid product/culture; adoption stays a separate decision. */
  async proposeStarterProtocol(target: { id: string; fallback?: YeastProductDocument; context?: YeastAlternativeContext },
    protocol: YeastStarterProtocol): Promise<YeastDbCorrectionProposal> {
    if (!validYeastStarterProtocol(protocol)) throw new Error('La notice de starter doit suivre le protocole documenté existant.');
    const parent = target.fallback ? readYeastProductDocument(target.fallback)
      : StorageService.getYeastProducts().find(row => row.id === target.id);
    if (!parent || parent.id !== target.id || parent.product.form === 'sèche')
      throw new Error('La notice doit viser un produit liquide/culture exact, avec une fiche chargée ou un fallback valide.');
    return requestProposal({ scope: 'product', id: target.id,
      ...(target.fallback ? { fallback: target.fallback } : {}), ...(target.context ? { context: target.context } : {}) },
    'Compléter ou remplacer manuellement la notice de starter de ce produit exact.', { kind: 'starter-set', protocol });
  },

  async apply(proposal: YeastDbCorrectionProposal, selectedIds: string[]): Promise<YeastDbCorrectionClientReceipt> {
    const target = { ...proposal.target, ...(proposal.fallback ? { fallback: proposal.fallback } : {}) } as YeastDbCorrectionTarget;
    const path = assertTargetReady(target);
    const call = await callable<{ proposal: YeastDbCorrectionProposal; selectedIds: string[] }, YeastDbCorrectionReceipt>('applyYeastDbCorrection');
    const receipt = (await call({ proposal, selectedIds })).data;
    // The transaction receipt confirms server persistence; the exact document readback is separate.
    try {
      await FirestoreRepo.waitForDocument(path.collection, path.id);
      return { ...receipt, readback: 'refreshed' };
    } catch {
      return { ...receipt, readback: 'pending' };
    }
  },

  async searchAlternatives(target: YeastDbCorrectionTarget, request: string, context: YeastAlternativeContext = {}): Promise<BrewerTurn> {
    assertTargetReady(target);
    const identity = target.scope === 'catalogue' ? target.fallback?.catalogue?.productCode ?? target.fallback?.name ?? target.id
      : target.scope === 'stock' ? target.ref
        : target.scope === 'offer' ? `${target.fallback?.product.label ?? target.id} · offre ${target.offerId}`
          : target.fallback?.product.label ?? target.id;
    const recipe = context.recipe;
    const conditions = [
      recipe?.name ? `recette ${recipe.name}` : '', recipe?.style ? `style ${recipe.style}` : '',
      recipe?.volumeL != null ? `${recipe.volumeL} L` : '', recipe?.ogTarget != null ? `DI cible ${recipe.ogTarget}` : '',
      recipe?.fermentation?.length ? `programme ${recipe.fermentation.map(step => `${step.name ?? 'phase'} ${step.tempC ?? '?'} °C/${step.days ?? '?'} j`).join(', ')}` : ''
    ].filter(Boolean).join(' ; ');
    const question = `Rechercher des alternatives fonctionnelles à la levure ${identity}. Demande du brasseur : ${request.trim()}. ${conditions ? `Contexte de recette : ${conditions}.` : 'Aucun contexte de recette supplémentaire n’est fourni.'} Distingue identité et équivalence fonctionnelle; précise conditions, sources, limites et disponibilité uniquement si les pages fournisseur exactes ont été vérifiées. N’adopte aucune alternative et ne modifie aucune recette. Si une alternative commerciale est pertinente, utilise la recherche fournisseur existante et affiche la source exacte.`;
    return BrewerChat.ask({
      scope: { kind: 'app', id: 'production-lab' },
      operationId: crypto.randomUUID().replace(/-/g, ''),
      question,
      phase: 'Levure · alternatives',
      mode: 'auto',
      editableTargets: []
    });
  }
};
