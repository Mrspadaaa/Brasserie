import { readFile } from 'node:fs/promises';
import { onCall } from 'firebase-functions/v2/https';
import { requireBrewer } from './brewSession.js';

/** The report is a server asset, never a Hosting file or a client import. */
export const getFermentationResearch = onCall(
  { region: 'europe-west6', maxInstances: 1, timeoutSeconds: 20 },
  async request => {
    requireBrewer(request);
    // Fixed path: request data cannot select any other server file.
    const markdown = await readFile(new URL('../reports/fermentation-2026.md', import.meta.url), 'utf8');
    return { markdown };
  }
);
