// D273c (01.11, nuit) : aiTask resservait une pièce déjà lue depuis son cache (`invoiceScans/{id}`) même après un changement du moteur
// (règle, consigne, vote, modèle) : l'identifiant ne dépendait que d'« invoice-v5 », du compte et des octets. Son choix : « Cache de lecture :
// le lier au moteur, pour qu'une pièce déjà lue soit relue après un changement. Une relecture coûte quelques centimes. »
// L'identifiant porte l'empreinte des modules que la lecture importe, de proche en proche, lus sur le disque.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as core from '../../functions/src/invoiceScanCore';

const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const source = (module: string) => readFileSync(new URL(`../../functions/src/${module}.ts`, import.meta.url), 'utf8');

describe('D273c — le cache de lecture lié au moteur', () => {
  it('même pièce, même compte, autre moteur : autre identifiant', () => {
    expect(core.invoiceScanIdFor('un', file, 'moteur-a')).not.toBe(core.invoiceScanIdFor('un', file, 'moteur-b'));
    expect(core.invoiceScanIdFor('un', file, 'moteur-a')).toBe(core.invoiceScanIdFor('un', { ...file }, 'moteur-a'));
  });

  it('l’empreinte suit les imports de la lecture, de proche en proche', () => {
    const { modules } = core.engineDigestOf(source);
    expect(modules).toEqual(expect.arrayContaining([
      'ai', 'invoiceScanCore', 'invoiceScanVote', 'invoiceVisionReview', 'invoiceControls', 'invoiceScanPrompts', 'invoiceScanBudget', 'models', 'prompts',
    ]));
  });

  it('une ligne changée dans un module importé change l’empreinte', () => {
    const avant = core.engineDigestOf(source).digest;
    const apres = core.engineDigestOf(module => module === 'invoiceControls' ? `${source(module)}\n// une règle de plus` : source(module)).digest;
    expect(apres).not.toBe(avant);
    expect(core.engineDigestOf(source).digest).toBe(avant);
  });

  it('l’identifiant servi porte l’empreinte lue sur le disque', () => {
    expect(core.invoiceScanId('un', file)).toBe(core.invoiceScanIdFor('un', file, core.engineDigestOf(source).digest));
  });

  it('un module illisible fait échouer l’empreinte (aiTask retombe alors sur une empreinte au hasard : rien servi du cache)', () => {
    expect(() => core.engineDigestOf(module => { if (module === 'models') throw new Error('absent'); return source(module); })).toThrow();
  });
});
