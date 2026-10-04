import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const candidate = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('configuration d’index de la voie assistée V1', () => {
  it('indexe les requêtes V1 et exclut les champs wire/contexte volumineux sans TTL', () => {
    const indexes = JSON.parse(readFileSync(resolve(candidate, 'firestore.indexes.json'), 'utf8'));
    const signature = (index: any) => `${index.collectionGroup}:${index.fields.map((field: any) => `${field.fieldPath}:${field.order}`).join(',')}`;
    const present = indexes.indexes.map(signature);
    expect(present).toContain('brewerHopAdviceChatsV1:threadId:ASCENDING,createdAt:DESCENDING');
    expect(present).toContain('brewerHopAdviceJobsV1:uid:ASCENDING,createdAt:DESCENDING');
    expect(present).toContain('brewerHopAdviceJobsV1:threadId:ASCENDING,status:ASCENDING');

    const noIndex = new Set(indexes.fieldOverrides.filter((field: any) => field.indexes?.length === 0)
      .map((field: any) => `${field.collectionGroup}.${field.fieldPath}`));
    for (const field of ['brewerHopAdviceJobsV1.input', 'brewerHopAdviceJobsV1.wireInput'])
      expect(noIndex.has(field), field).toBe(true);
    expect(indexes.fieldOverrides.some((field: any) => field.collectionGroup.startsWith('brewerHopAdvice') && field.ttl === true)).toBe(false);
  });
});
