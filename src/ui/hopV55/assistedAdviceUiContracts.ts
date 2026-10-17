import { createContext } from 'react';
import type { BrewerChatInput, BrewerContext, BrewerTurn } from '../../../functions/src/companionTypes';
import type { BrewerHopAdviceRequest } from '../../../functions/src/brewerHopAdviceProposal';
import type { ClientBrewerJob } from '../../services/brewerJobs';
import type { HopV55SemanticAdoptionSessionV3 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticAdoptionSessionForWizardV1 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticJobStoreClientV3 } from '../../services/brewerJobs';
import type { HopV55SemanticWizardJobStoreClientV1 } from '../../services/brewerJobs';
import type { HopV55SemanticJobSnapshotV3 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import type { BrewerScope } from '../../../functions/src/companionTypes';

/** The original operation follows its own launch even if another reading is displayed. */
export interface HopV55AssistedCompanionTurn {
  input: BrewerChatInput;
  job: ClientBrewerJob;
  turn: BrewerTurn;
  envelope: BrewerTurn['hopAdviceProposal'];
  evidence: BrewerTurn['evidence'];
}

/** Page owns the source and callbacks; Host opens this immutable session without deriving its scope. */
export interface HopV55AssistedCompanionSession {
  id: string;
  request: BrewerHopAdviceRequest;
  context: BrewerContext;
  label: string;
  onBeforeSend(input: BrewerChatInput): Promise<void>;
  onAssistedTurn(value: HopV55AssistedCompanionTurn): void | Promise<void>;
}

/**
 * Explicit UI boundary for the additive Request3/V6 lane; it is not a widened V1 session. Page adds only a
 * refresh hook, called after a durable write so its own workspace revision follows the host's CAS.
 */
export type HopV55SemanticCompanionSessionV3 = HopV55SemanticAdoptionSessionV3 & {
  onDurableChange?(): void | Promise<void>;
};

/**
 * Wizard lane session: the host's distinct Wizard session (snapshot, Wizard Request3, Wizard records) with the
 * same refresh hook. It is never cast into the classic session; consumers branch on `format`.
 */
export type HopV55SemanticCompanionSessionWizardV1 = HopV55SemanticAdoptionSessionForWizardV1 & {
  onDurableChange?(): void | Promise<void>;
};

/** Discriminated by `format`; every divergent call is made in an explicit branch. */
export type HopV55SemanticCompanionSessionAnyV1 = HopV55SemanticCompanionSessionV3 | HopV55SemanticCompanionSessionWizardV1;

export interface HopV55SemanticCompanionRuntimeV3 {
  format: 'hop-v55-semantic-companion-runtime-v3';
  protocol: 'hopAdviceRequest3';
  providerKind: 'fixture' | 'authorizedRequest3';
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  /** Exposes only the current server generation, never the legacy conversation turns. */
  readGeneration(scope: BrewerScope): Promise<number>;
  jobs: HopV55SemanticJobStoreClientV3;
  dispose?(): void | Promise<void>;
}

/** Runtime of the Wizard lane: local protocol and store kind are Wizard-only; the serialized wire stays Request3. */
export interface HopV55SemanticCompanionRuntimeWizardV1 {
  format: 'hop-v55-semantic-companion-runtime-wizard-v1';
  protocol: 'hopAdviceWizardRequest3V1';
  providerKind: 'fixture' | 'authorizedRequest3';
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  readGeneration(scope: BrewerScope): Promise<number>;
  jobs: HopV55SemanticWizardJobStoreClientV1;
  dispose?(): void | Promise<void>;
}

export interface HopV55SemanticRuntimeFactoryInputV3 {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  providerKind: HopV55SemanticCompanionRuntimeV3['providerKind'];
}
export type HopV55SemanticRuntimeFactoryV3 = (input: HopV55SemanticRuntimeFactoryInputV3) => HopV55SemanticCompanionRuntimeV3;
/** Same owner/workspace/scope/provider inputs; the scope is the Wizard draft scope derived from the durable origin. */
export type HopV55SemanticRuntimeFactoryInputWizardV1 = HopV55SemanticRuntimeFactoryInputV3;
export type HopV55SemanticRuntimeFactoryWizardV1 = (input: HopV55SemanticRuntimeFactoryInputWizardV1) => HopV55SemanticCompanionRuntimeWizardV1;

/**
 * A provider declares each lane it really supports. Without `createWizardRuntimeForScope` the unsaved-draft lane
 * stays closed even when the classic lane is open.
 */
export type HopV55SemanticAdviceCapabilityV3 =
  | { kind: 'unavailable'; reason: string }
  | { kind: 'fixture'; createRuntimeForScope: HopV55SemanticRuntimeFactoryV3;
      createWizardRuntimeForScope?: HopV55SemanticRuntimeFactoryWizardV1 }
  | { kind: 'authorizedRequest3'; createRuntimeForScope: HopV55SemanticRuntimeFactoryV3;
      createWizardRuntimeForScope?: HopV55SemanticRuntimeFactoryWizardV1 };

export const HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3: HopV55SemanticAdviceCapabilityV3 = {
  kind: 'unavailable', reason: 'Aucun fournisseur qualifié n’est branché pour le compagnon assisté.',
};

/** Shown in the recipe creator when the provider opens the classic lane only. */
export const HOP_V55_SEMANTIC_WIZARD_LANE_UNAVAILABLE_V1 = 'Le fournisseur branché ne relit pas encore un brouillon non enregistré; aucune recette enregistrée ne le remplace. L’atelier local et le compagnon habituel restent disponibles.';

/**
 * Structural check of a capability received from the application entry. It never creates a provider and never
 * probes a model: a malformed declaration becomes unavailable with its reason.
 */
export function qualifyHopV55SemanticAdviceCapabilityV3(capability: HopV55SemanticAdviceCapabilityV3): HopV55SemanticAdviceCapabilityV3 {
  if (!capability || typeof capability !== 'object') return HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3;
  const kind: string = capability.kind;
  if (capability.kind === 'unavailable') {
    return typeof capability.reason === 'string' && capability.reason.trim() ? capability : HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3;
  }
  if (kind !== 'fixture' && kind !== 'authorizedRequest3') {
    return { kind: 'unavailable', reason: 'Le fournisseur assisté déclaré n’est pas reconnu; aucun envoi n’est ouvert.' };
  }
  if (typeof capability.createRuntimeForScope !== 'function') {
    return { kind: 'unavailable', reason: 'Le fournisseur assisté déclaré ne fournit pas de runtime vérifiable; aucun envoi n’est ouvert.' };
  }
  if (capability.createWizardRuntimeForScope !== undefined && typeof capability.createWizardRuntimeForScope !== 'function') {
    return { kind: 'unavailable', reason: 'La voie brouillon déclarée par le fournisseur n’est pas une fabrique vérifiable; aucun envoi n’est ouvert.' };
  }
  return capability;
}

/** True only when the declared provider also builds the distinct Wizard runtime. */
export function hopV55SemanticWizardLaneDeclared(capability: HopV55SemanticAdviceCapabilityV3): boolean {
  return capability.kind !== 'unavailable' && typeof capability.createWizardRuntimeForScope === 'function';
}

/**
 * The one capability read by App, Host and the wizard's hop step. Without an explicit provider (a local QA
 * fixture bench or a qualified Request3 transport) it stays unavailable; no UID, mode, URL or storage flag opens it.
 */
export const HopV55SemanticAdviceCapabilityContext = createContext<HopV55SemanticAdviceCapabilityV3>(HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3);

/** Raw response bytes remain public V1 transport data until the V6 host returns a verified record. */
export interface HopV55SemanticCompanionActivityV3 {
  format: 'hop-v55-semantic-companion-activity-v3';
  jobs: HopV55SemanticJobSnapshotV3[];
  connectionError: string;
}
