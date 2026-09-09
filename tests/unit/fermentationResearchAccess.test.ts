import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile, access } from 'node:fs/promises';
import { getFermentationResearch } from '../../functions/src/researchReport';

const request = (email = 'brewer@example.test', verified = true) => ({
  data: {}, auth: { uid: 'brewer-test', token: { email, email_verified: verified } }
});
const run = (r: unknown) => (getFermentationResearch as any).run(r);
beforeEach(() => vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test'));
afterEach(() => vi.unstubAllEnvs());

describe('private fermentation research', () => {
  it('rejects anonymous callers before returning any report', async () => {
    await expect(run({ data: {} })).rejects.toMatchObject({ code: 'unauthenticated' });
  });
  it.each([
    ['outsider@example.test', true],
    ['brewer@example.test', false]
  ])('rejects an unauthorized or unverified account (%s)', async (email, verified) => {
    await expect(run(request(email as string, verified as boolean))).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('fails closed when the allowed-account configuration is missing', async () => {
    vi.stubEnv('AUTHORIZED_ACCOUNTS', '');
    await expect(run(request())).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('serves the complete fixed report to the authorized account only', async () => {
    const result = await run({ ...request(), data: { path: '../../.env' } });
    const canonical = await readFile(new URL('../../docs/research/fermentation/report-source.md', import.meta.url), 'utf8');
    const nolo = await readFile(new URL('../../functions/reports/nolo-2026.md', import.meta.url), 'utf8');
    expect(result).toEqual({ markdown: nolo + '\n\n' + canonical });
    expect(result.markdown.match(/\]\(https:\/\//g)?.length).toBeGreaterThan(20);
  });
  it('keeps the report out of the public directory', async () => {
    await expect(access(new URL('../../public/research/fermentation-2026.html', import.meta.url))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
