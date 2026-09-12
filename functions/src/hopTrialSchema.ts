import { hopSourceError, validHopRange, type HopRange, type HopSource, type HopConfidence, type HopProductForm } from './hopIndexSchema.js';
import type { HopTiming, HopParameter } from './hopPredictionSchema.js';

/** A reported brewing programme. It is evidence to explore, never an aroma model. */
export interface HopTrial {
  id: string; kind: 'trial'; name: string; source: HopSource;
  /** Editorial assessment of transferability and local family mapping, not the study's claim. */
  assessmentSource: HopSource;
  yeastId: string; yeastName: string; yeastForm: 'sèche' | 'liquide';
  hops: { varietyId: string; name: string; form: HopProductForm; timing: HopTiming;
    /** Relative event in the published protocol; does not invent a boil duration. */
    boilStart?: { source: HopSource };
    doseGL: HopParameter; temperatureC: HopParameter | null; contactHours: HopParameter | null }[];
  fermentationC: HopParameter | null;
  families: string[]; result: string; matrix: string; limitations: string[];
  confidence: HopConfidence;
  /** A measured panel range, on its published scale, not the personal target scale. */
  sensory: { name: string; range: HopRange; scale: HopRange; source: HopSource }[];
}
const object = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: any): v is string => typeof v === 'string' && !!v.trim();
const id = (v: any) => text(v) && v.length <= 120 && !/[\\/]/.test(v) && !['__proto__', 'constructor', 'prototype', '.', '..'].includes(v);
const check = (ok: unknown, message: string) => { if (!ok) throw Error(message); };
const keys = (v: Record<string, any>, allowed: string[]) => check(Object.keys(v).every(k => allowed.includes(k)), 'Champ d’essai inconnu.');
function source(v: any) { const error = hopSourceError(v, true); if (error) throw Error(error); }
function parameter(v: any, min: number) {
  check(object(v), 'Condition expérimentale absente.'); keys(v, ['range', 'source']);
  check(validHopRange(v.range) && v.range.min >= min, 'Plage expérimentale invalide.'); source(v.source);
}
export function assertHopTrial(v: any): asserts v is HopTrial {
  check(object(v) && v.kind === 'trial' && id(v.id) && text(v.name), 'Essai documentaire invalide.');
  keys(v, ['id','kind','name','source','assessmentSource','yeastId','yeastName','yeastForm','hops','fermentationC','families','result','matrix','limitations','confidence','sensory']);
  source(v.assessmentSource);
  source(v.source); check(['research','manufacturer','observation'].includes(v.source.kind), 'Un essai exige une source expérimentale ou un compte rendu fabricant/personnel.');
  check(id(v.yeastId) && text(v.yeastName) && ['sèche','liquide'].includes(v.yeastForm), 'Levure d’essai absente.');
  check(Array.isArray(v.hops) && v.hops.length > 0 && v.hops.length <= 20, 'Programme de houblonnage absent.');
  for (const hop of v.hops) {
    check(object(hop), 'Ajout expérimental invalide.'); keys(hop, ['varietyId','name','form','timing','doseGL','temperatureC','contactHours','boilStart']);
    check(id(hop.varietyId) && text(hop.name) && ['cone','pelletT90','pelletT45','cryo','extract','unknown'].includes(hop.form)
      && ['firstWort','boil','whirlpool','fermentation','postFermentation'].includes(hop.timing), 'Triplet expérimental incomplet.');
    parameter(hop.doseGL, 0); check(hop.doseGL.range.min > 0, 'Dose expérimentale positive requise.');
    if (hop.boilStart !== undefined) {
      check(hop.timing === 'boil' && object(hop.boilStart), 'Le début d’ébullition exige un ajout à l’ébullition.');
      keys(hop.boilStart, ['source']); source(hop.boilStart.source);
    }
    if (hop.temperatureC !== null) parameter(hop.temperatureC, -273.15);
    if (hop.contactHours !== null) parameter(hop.contactHours, 0);
  }
  if (v.fermentationC !== null) parameter(v.fermentationC, -273.15);
  check(Array.isArray(v.families) && v.families.every(id) && new Set(v.families).size === v.families.length, 'Familles documentées invalides.');
  check(text(v.result) && text(v.matrix) && Array.isArray(v.limitations) && v.limitations.length > 0 && v.limitations.every(text), 'Résultat ou limites absents.');
  check(['low','medium','high'].includes(v.confidence) && Array.isArray(v.sensory), 'Confiance ou observations absentes.');
  for (const observed of v.sensory) {
    check(object(observed), 'Observation sensorielle invalide.'); keys(observed, ['name','range','scale','source']);
    check(text(observed.name) && validHopRange(observed.range) && validHopRange(observed.scale)
      && observed.scale.max > observed.scale.min && observed.range.min >= observed.scale.min && observed.range.max <= observed.scale.max, 'Observation hors échelle.');
    source(observed.source);
  }
}
