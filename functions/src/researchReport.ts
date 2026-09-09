import { readFile } from 'node:fs/promises';
import { onCall } from 'firebase-functions/v2/https';
import { requireBrewer } from './brewSession.js';

/** The report is a server asset, never a Hosting file or a client import. */
export const getFermentationResearch = onCall(
  { region: 'europe-west6', maxInstances: 1, timeoutSeconds: 20 },
  async request => {
    requireBrewer(request);
    // Fixed path: request data cannot select any other server file.
    const reports = await Promise.all(['nolo-2026.md','fermentation-2026.md'].map(file =>
      readFile(new URL('../reports/'+file, import.meta.url), 'utf8')));
    const markdown = reports.join('\n\n');
    return { markdown };
  }
);
