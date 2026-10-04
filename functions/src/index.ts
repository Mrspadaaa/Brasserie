import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Functions and Firestore run in Zurich. Gemini requests use Google's API separately.
setGlobalOptions({ region: 'europe-west6' });

export { aiTask } from './ai.js';
export { getFermentationResearch } from './researchReport.js';
export { syncBrewAlarms, deliverBrewAlarm } from './brewAlarms.js';
export { getBrewSession, saveBrewSession } from './brewSession.js';
export { getBrewAlertConfig, registerBrewDevice, rescheduleBrewAlarms } from './brewPush.js';
export { exportBreweryData, restoreBreweryData } from './dataBackup.js';
export { transferBreweryData, cleanupBreweryTransfers } from './backupTransfer.js';
export { migrateFinanceDocuments } from './financeDocumentMigration.js';
export { driveAuthorization } from './driveAuthorization.js';
export { syncFinancialLedger, recordFinancialTransactionChange, recordFinancialPaymentChange, cleanupFinancialSync } from './financialSync.js';
export { recordDataChange } from './dataHistory.js';
export {
  askBrewer,
  getBrewerConversation,
  resetBrewerConversation,
  applyBrewerProposal
} from './brewerChat.js';

export {
  dispatchBrewerQuestion,
  processBrewerQuestion,
  getBrewerActivity,
  markBrewerRead,
  retryBrewerQuestion
} from './brewerJobs.js';
export { processBrewerHopAdviceV1 } from './brewerJobs.js';
export {
  askBrewerHopAdviceV1,
  dispatchBrewerHopAdviceV1,
  getBrewerHopAdviceActivityV1,
  markBrewerHopAdviceReadV1,
  retryBrewerHopAdviceQuestionV1
} from './brewerHopAdviceJobsV1.js';
export {
  getBrewerHopAdviceConversationV1,
  resetBrewerHopAdviceConversationV1
} from './brewerHopAdviceConversationV1.js';
export { registerBrewerNotifications, notifyBrewerAnswer, notifyBrewerHopAdviceAnswerV1 } from './brewerNotifications.js';
export { getBrewerAiBudget, setBrewerAiBudget } from './brewerBudget.js';
export { proposeYeastDbCorrection, applyYeastDbCorrection } from './yeastDbCorrections.js';
export { readBrewingCatalogue, writeBrewingCatalogue } from './brewerCatalogueApi.js';
export { readBrewingScenario, writeBrewingScenario } from './brewerScenarioApi.js';
