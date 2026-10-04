import type { BrewerChatInput, BrewerContext, BrewerTurn } from '../../../functions/src/companionTypes';
import type { BrewerHopAdviceRequest } from '../../../functions/src/brewerHopAdviceProposal';
import type { ClientBrewerJob } from '../../services/brewerJobs';

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
