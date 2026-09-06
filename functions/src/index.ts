import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Zurich, comme la base Firestore : les données ne sortent pas de Suisse.
setGlobalOptions({ region: 'europe-west6' });

export { aiTask } from './ai.js';
export { syncBrewAlarms, deliverBrewAlarm } from './brewAlarms.js';
