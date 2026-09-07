import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Functions and Firestore run in Zurich. Gemini requests use Google's API separately.
setGlobalOptions({ region: 'europe-west6' });

export { aiTask } from './ai.js';
export { syncBrewAlarms, deliverBrewAlarm } from './brewAlarms.js';
export { getBrewSession, saveBrewSession } from './brewSession.js';
export { getBrewAlertConfig, registerBrewDevice, rescheduleBrewAlarms } from './brewPush.js';
export { exportBreweryData, restoreBreweryData } from './dataBackup.js';
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
export { registerBrewerNotifications, notifyBrewerAnswer } from './brewerNotifications.js';
