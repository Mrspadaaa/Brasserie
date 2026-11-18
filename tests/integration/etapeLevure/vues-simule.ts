/**
 * API de levure SIMULÉE pour les tests des vues Chercher, Comparer, Suggérer (voie u2). Neuf fiches inventées pour l'essai : ni
 * le catalogue ni l'API de d1 ; elles ne servent qu'à jouer les gestes des maquettes c6b, s5a et s7a. Aucune donnée réelle.
 */
import type { YeastReference } from '../../../src/domain/yeastReferences';
import type {
  ApiLevure, Axe, ComptesFiltre, DefFiltre, Disponibilite, EtatFiltres, IdAxe, IdFiltre, Niveau, ResultatRecherche, Suggestion, ValeurAxe,
} from '../../../src/domain/levure/contrat';
import type { ApiVue } from '../../../src/ui/etapeLevure/Chercher';

interface Fiche {
  id: string; name: string; fab: string; form: 'sèche' | 'liquide'; rang: 'ici' | 'europe' | 'rare'; pays?: Array<'CH' | 'FR' | 'DE'>;
  temp?: [number, number]; att?: [number, number]; tol?: [number, number]; sucres?: [number, number];
  esters?: Niveau; phenols?: Niveau; thiols?: Niveau; terpenes?: Niveau; floc?: Niveau; famille: string; sta1?: boolean;
}
export const FICHES: Fiche[] = [
  { id: 'us05', name: 'SafAle US-05', fab: 'Fermentis', form: 'sèche', rang: 'ici', pays: ['CH', 'DE'], temp: [18, 26], att: [78, 82], tol: [9, 11], sucres: [11, 11], esters: 'faible', famille: 'ale US' },
  { id: 'w1056', name: 'Wyeast 1056 American Ale', fab: 'Wyeast', form: 'liquide', rang: 'rare', temp: [16, 22], att: [73, 77], esters: 'faible', famille: 'ale US' },
  { id: 'verdant', name: 'Verdant IPA', fab: 'Lallemand', form: 'sèche', rang: 'ici', pays: ['CH'], temp: [18, 25], att: [75, 82], tol: [12, 12], esters: 'eleve', phenols: 'faible', thiols: 'eleve', terpenes: 'moyen', floc: 'moyen', famille: 'ale US' },
  { id: 'pomona', name: 'Pomona', fab: 'Lallemand', form: 'sèche', rang: 'ici', pays: ['FR'], temp: [18, 24], att: [75, 85], tol: [10, 10], esters: 'moyen', thiols: 'moyen', terpenes: 'eleve', floc: 'moyen', famille: 'ale US' },
  { id: 'nova', name: 'NovaLager', fab: 'Lallemand', form: 'sèche', rang: 'ici', pays: ['CH'], temp: [10, 15], att: [78, 84], tol: [13, 13], esters: 'faible', phenols: 'faible', famille: 'lager' },
  { id: 'notti', name: 'Nottingham', fab: 'Lallemand', form: 'sèche', rang: 'europe', temp: [14, 21], att: [78, 84], tol: [14, 14], thiols: 'eleve', floc: 'eleve', esters: 'faible', famille: 'ale anglaise' },
  { id: 'bry97', name: 'BRY-97', fab: 'Lallemand', form: 'sèche', rang: 'europe', temp: [18, 23], att: [78, 82], sta1: true, famille: 'ale US' },
  { id: 'wlp001', name: 'WLP001 California Ale', fab: 'White Labs', form: 'liquide', rang: 'rare', temp: [20, 23], att: [73, 80], tol: [10, 12], sta1: true, famille: 'ale US' },
  { id: 'windsor', name: 'Windsor', fab: 'Lallemand', form: 'sèche', rang: 'europe', temp: [15, 22], att: [65, 72], tol: [12, 12], floc: 'faible', esters: 'moyen', famille: 'ale anglaise' },
];
export const levureDe = (id: string): YeastReference => {
  const f = FICHES.find((x) => x.id === id)!;
  return { id: f.id, kind: 'yeast', name: f.name, betaLyase: 'unknown', source: { title: 'simulé' }, form: f.form, catalogue: { manufacturer: f.fab, productId: f.id, productCode: null, aliases: [], facts: [] } } as unknown as YeastReference;
};
export const TOUTES = FICHES.map((f) => levureDe(f.id));
const fiche = (l: YeastReference) => FICHES.find((f) => f.id === l.id)!;

export const AXES: Axe[] = [
  { id: 'esters', groupe: 'aromes', libelle: 'Esters' }, { id: 'phenols', groupe: 'aromes', libelle: 'Phénols' }, { id: 'thiols', groupe: 'aromes', libelle: 'Thiols' }, { id: 'terpenes', groupe: 'aromes', libelle: 'Terpènes' },
  { id: 'attenuation', groupe: 'corps', libelle: 'Atténuation', unite: '%' }, { id: 'clarte', groupe: 'corps', libelle: 'Clarté' }, { id: 'tolerance', groupe: 'corps', libelle: 'Tolérance', unite: '% vol' }, { id: 'rondeur', groupe: 'corps', libelle: 'Rondeur', unite: 'g/L' },
  { id: 'temperature', groupe: 'conduite', libelle: '°C', unite: '°C' }, { id: 'vitesse', groupe: 'conduite', libelle: 'Vitesse' }, { id: 'soufre', groupe: 'conduite', libelle: 'Soufre' }, { id: 'nutriments', groupe: 'conduite', libelle: 'Nutriments' },
];
export const FILTRES: DefFiltre[] = [
  { id: 'boisson', libelle: 'Boisson', rang: 'premier', genre: 'choix' },
  { id: 'famille', libelle: 'Famille', rang: 'premier', genre: 'choix' },
  { id: 'temperature', libelle: '°C', rang: 'premier', genre: 'plage' },
  { id: 'tolerance', libelle: 'Tolérance', rang: 'premier', genre: 'plage' },
  { id: 'sansSta1', libelle: 'Sans STA1', rang: 'plus', genre: 'bascule' },
];
const mil = (p: [number, number] | undefined) => p && { min: p[0], max: p[1] };
export function valeurAxe(l: YeastReference, axe: IdAxe): ValeurAxe | null {
  const f = fiche(l);
  switch (axe) {
    case 'temperature': return f.temp ? { plage: mil(f.temp)!, source: { libelle: 'fiche' } } : null;
    case 'attenuation': return f.att ? { plage: mil(f.att)! } : null;
    case 'tolerance': return f.tol ? { plage: mil(f.tol)! } : null;
    case 'rondeur': return f.sucres ? { plage: mil(f.sucres)! } : null;
    case 'clarte': return f.floc ? { niveau: f.floc } : null;
    case 'esters': case 'phenols': case 'thiols': case 'terpenes': return f[axe] ? { niveau: f[axe], estime: axe === 'esters' && f.id === 'verdant' } : null;
    default: return null;
  }
}
const disponibilite = (l: YeastReference): Disponibilite => {
  const f = fiche(l);
  return { rang: f.rang, pays: f.pays, offres: f.rang === 'ici' ? 1 : 0 };
};
const milieu = (l: YeastReference, axe: IdAxe) => { const p = valeurAxe(l, axe)?.plage; return p ? (p.min + p.max) / 2 : undefined; };
const nivNum = (l: YeastReference, axe: IdAxe) => { const n = valeurAxe(l, axe)?.niveau; return n === undefined ? undefined : { faible: 0, moyen: 1, eleve: 2 }[n]; };
const mesure = (l: YeastReference, axe: IdAxe) => milieu(l, axe) ?? nivNum(l, axe);

const BINS = [['<8', 0, 8], ['8:10', 8, 10], ['10:12', 10, 12], ['≥12', 12, Infinity]] as const;
function passe(l: YeastReference, f: EtatFiltres, sauf?: IdFiltre): boolean {
  const fi = fiche(l);
  for (const [id, v] of Object.entries(f) as Array<[IdFiltre, EtatFiltres[IdFiltre]]>) {
    if (id === sauf) continue;
    if (id === 'famille' && Array.isArray(v) && v.length && !v.includes(fi.famille)) return false;
    if (id === 'tolerance' && v && typeof v === 'object' && !Array.isArray(v) && !(fi.tol && fi.tol[1] >= v.min && fi.tol[0] <= v.max)) return false; // une fiche muette ne passe pas (comme d1)
    if (id === 'temperature' && v && typeof v === 'object' && !Array.isArray(v) && !(fi.temp && fi.temp[1] >= v.min && fi.temp[0] <= v.max)) return false;
    if (id === 'sansSta1' && v === true && fi.sta1 !== true) return false;
  }
  return true;
}
const rangNum = { ici: 0, europe: 1, rare: 2 } as const;
export function chercher(requete: string, filtres: EtatFiltres): ResultatRecherche & { tapee?: YeastReference } {
  const q = requete.trim().toLowerCase();
  const tapee = q.length >= 2 ? TOUTES.filter((l) => `${l.name} ${fiche(l).fab}`.toLowerCase().includes(q)).filter((_, __, a) => a.length === 1)[0] : undefined;
  const liste = TOUTES.filter((l) => l !== tapee && (!q || `${l.name} ${fiche(l).fab}`.toLowerCase().includes(q)) && passe(l, filtres))
    .map((l, i) => ({ l, i })).sort((a, b) => rangNum[fiche(a.l).rang] - rangNum[fiche(b.l).rang] || a.i - b.i).map((x) => x.l);
  const comptes: Partial<Record<IdFiltre, ComptesFiltre>> = {
    boisson: { options: [{ valeur: 'biere', libelle: 'Bière', n: TOUTES.length }], nonDocumentees: 0 },
    famille: { options: ['ale US', 'lager', 'ale anglaise'].map((v) => ({ valeur: v, libelle: v, n: TOUTES.filter((l) => passe(l, filtres, 'famille') && fiche(l).famille === v).length })), nonDocumentees: 0 },
    tolerance: {
      options: BINS.map(([v, lo, hi]) => ({ valeur: v, libelle: v.replace(':', '–'), n: TOUTES.filter((l) => { const t = fiche(l).tol; return passe(l, filtres, 'tolerance') && !!t && t[1] >= lo && t[0] < hi; }).length })),
      nonDocumentees: TOUTES.filter((l) => !fiche(l).tol).length,
    },
    temperature: { options: [{ valeur: '10:15', libelle: '10–15', n: 2 }, { valeur: '15:20', libelle: '15–20', n: 6 }, { valeur: '20:30', libelle: '20–30', n: 5 }], nonDocumentees: 0 },
    sansSta1: { options: [{ valeur: 'oui', libelle: 'Sans STA1', n: 2 }], nonDocumentees: TOUTES.filter((l) => fiche(l).sta1 === undefined).length },
  };
  const proche = q ? ` · proche de ${requete.trim()}` : '';
  return { liste, total: liste.length + (tapee ? 1 : 0), comptes, resume: `bière · repères 19 °C · 7 %${proche} · ${liste.length}`, ...(tapee ? { tapee } : {}) };
}
function comptesAxes(base: YeastReference) {
  const sortie = {} as Record<IdAxe, { moins: number; plus: number; sansDonnee: number; estime: boolean }>;
  for (const a of AXES) {
    const m0 = mesure(base, a.id);
    const autres = TOUTES.filter((l) => l.id !== base.id);
    const connus = autres.filter((l) => mesure(l, a.id) !== undefined);
    const pas = ['esters', 'phenols', 'thiols', 'terpenes', 'clarte'].includes(a.id) ? 0 : 2;
    const ref = m0 ?? (pas === 0 ? 0 : undefined); // niveau non documenté : « + » = au moins faible, comme d1
    sortie[a.id] = {
      moins: ref === undefined ? 0 : connus.filter((l) => mesure(l, a.id)! < ref - pas / 1000).length,
      plus: ref === undefined ? 0 : connus.filter((l) => mesure(l, a.id)! > ref + pas / 1000).length,
      sansDonnee: autres.length - connus.length, estime: ['esters', 'phenols', 'thiols', 'terpenes'].includes(a.id),
    };
  }
  return sortie;
}
function suggerer(base: YeastReference, choix: Array<{ axe: IdAxe; sens: -1 | 1 }>, limite = 40): Suggestion[] {
  if (!choix.length) return [];
  const sortie: Suggestion[] = [];
  for (const l of TOUTES) {
    if (l.id === base.id) continue;
    const ecarts: Suggestion['ecarts'] = [];
    let ok = true;
    for (const c of choix) {
      const m = mesure(l, c.axe), m0 = mesure(base, c.axe) ?? 0;
      if (m === undefined || (m - m0) * c.sens <= 0) { ok = false; break; }
      ecarts.push({ axe: c.axe, ecart: m - m0, texte: `${m - m0 > 0 ? '+' : '−'}${Math.abs(Math.round((m - m0) * 10) / 10)}` });
    }
    if (ok) sortie.push({ levure: l, disponibilite: disponibilite(l), ecarts, raison: '', levier: choix.length === 1 && choix[0].axe === 'attenuation' ? 'empâtage → Malts/sucres' : undefined });
  }
  return sortie.sort((a, b) => rangNum[a.disponibilite.rang] - rangNum[b.disponibilite.rang] || Math.abs(a.ecarts[0].ecart) - Math.abs(b.ecarts[0].ecart)).slice(0, limite);
}
export const apiSimulee: ApiVue = {
  AXES, FILTRES, valeurAxe, disponibilite, chercher: (q, f) => chercher(q, f), comptesAxes, suggerer,
  proximite: () => 0,
  documente: (l, f) => (f === 'sansSta1' ? fiche(l).sta1 !== undefined : true),
  trouver: (id) => TOUTES.find((l) => l.id === id),
};
export const reperes = { temperatureC: 19, abvVise: 7, ogVisee: 1.066 };
