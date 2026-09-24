import type { HopRange, HopSource } from './hopIndexSchema.js';

export interface DirectPitchProtocol {
  id: string;
  yeastId: string;
  form: 'sèche';
  method: 'direct';
  temperatureC: HopRange;
  source: HopSource;
  conditions: string;
}

/** Only numeric, product-specific addition protocols. No fermentation or rehydration range is promoted here. */
const PROTOCOLS: readonly DirectPitchProtocol[] = [{
  id: 'fermentis-w68-direct-2026-09',
  yeastId: 'fermentis-w68', form: 'sèche', method: 'direct', temperatureC: { min: 20, max: 32 },
  source: { kind: 'manufacturer', author: 'Fermentis', title: 'SafAle W-68 — usage et conservation',
    reference: 'https://fermentis.com/en/product/safale-w-68/', year: null,
    locator: 'Usage · Direct pitching · fiche vérifiée le 20 septembre 2026' },
  conditions: 'La notice indique 20–32 °C pour l’ajout direct en fermenteur. Cette plage d’ajout est distincte des 18–26 °C de fermentation conseillés.',
}];

export function documentedDirectPitchProtocol(yeastId: unknown, form: unknown): DirectPitchProtocol | undefined {
  const protocol = PROTOCOLS.find(p => p.yeastId === yeastId && p.form === form);
  return protocol ? { ...protocol, temperatureC: { ...protocol.temperatureC }, source: { ...protocol.source } } : undefined;
}
