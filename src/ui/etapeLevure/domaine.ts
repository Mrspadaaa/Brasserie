// Le point d'entrée du domaine de l'étape Levure pour la coque (voie u1). L'API est celle de `src/domain/levure/index.ts` (voie d1,
// contrat `contrat.ts`) : `valeurAxe` donne le niveau, la plage ou les mots d'un axe, avec sa source. Tant que d1 n'a pas livré, une
// lecture provisoire, courte, des faits du catalogue tient la place ; elle disparaît dès que `index.ts` existe (la découverte est faite
// à la compilation par `import.meta.glob`, sans importer un fichier absent). Aucune règle de classement ici : seulement la lecture
// d'une fiche pour les jauges de « Ma levure ».
import type { ApiLevure, IdAxe, ValeurAxe } from '../../domain/levure/contrat';
import { effectiveYeastTechnicalFacts, type YeastReference } from '../../domain/yeastReferences';

const modules = import.meta.glob('../../domain/levure/index.ts', { eager: true }) as Record<string, Record<string, unknown>>;
const estApi = (valeur: unknown): valeur is ApiLevure =>
  !!valeur && typeof valeur === 'object' && typeof (valeur as ApiLevure).valeurAxe === 'function';
/** L'API de d1 quand elle est livrée (un export nommé ou `default` qui porte `valeurAxe`). */
export const apiLevure: ApiLevure | undefined = Object.values(modules).flatMap(m => Object.values(m)).find(estApi);

const MOTS: Array<[RegExp, string, IdAxe[]]> = [
  [/banana|banane|isoamyl/i, 'banane', ['esters']], [/tropical/i, 'tropical', ['esters']], [/apricot|abricot/i, 'abricot', ['esters']],
  [/citrus|agrume/i, 'agrumes', ['esters']], [/peach|p[êe]che/i, 'pêche', ['esters']], [/fruit/i, 'fruité', ['esters']],
  [/clove|girofle|spic|[ée]pic|pepper|poivr|phenol/i, 'épicé', ['phenols']],
];
const niveauDe = (texte: string): ValeurAxe['niveau'] | undefined => {
  const t = texte.toLowerCase();
  if (/medium.*(to|-).*high|medium.*(to|-).*low|moyen.*(à|-)/.test(t)) return undefined;
  if (/very high|high|élev|eleve|haut/.test(t)) return 'eleve';
  if (/medium|moyen/.test(t)) return 'moyen';
  if (/low|faible|bas/.test(t)) return 'faible';
  return undefined;
};

/** Lecture provisoire (d1 absente) : ce que les faits du catalogue disent, rien de plus. L'inconnu reste `null`. */
function valeurProvisoire(levure: YeastReference, axe: IdAxe): ValeurAxe | null {
  const faits = effectiveYeastTechnicalFacts(levure);
  const fait = (cle: string) => faits.find(f => f.key === cle);
  const source = (cle: string) => { const f = fait(cle); return f?.source ? { libelle: f.source.replace(/™|®/g, '').trim(), url: f.sourceUrl } : undefined; };
  const aroma = fait('aroma')?.reported ?? '';
  if (axe === 'esters') {
    const f = fait('esters'), niveau = f ? niveauDe(f.reported) : undefined;
    if (niveau) return { niveau, source: source('esters') };
    const mots = MOTS.filter(([re, , axes]) => axes.includes('esters') && re.test(aroma)).map(([, mot]) => mot);
    return mots.length ? { mots, estime: true, source: source('aroma') } : null;
  }
  if (axe === 'phenols') {
    const pof = fait('pof')?.reported ?? '';
    if (/\+|positive|yes|pof\s*\+/i.test(pof)) return { mots: ['présent'], source: source('pof') };
    if (/-|−|negative|no\b|non/i.test(pof) && pof) return { mots: ['aucun'], source: source('pof') };
    const mots = MOTS.filter(([re, , axes]) => axes.includes('phenols') && re.test(aroma)).map(([, mot]) => mot);
    return mots.length ? { mots, estime: true, source: source('aroma') } : null;
  }
  if (axe === 'clarte') {
    const f = fait('flocculation');
    if (!f) return null;
    const niveau = niveauDe(f.reported);
    return niveau ? { niveau, source: source('flocculation') } : { mots: [f.reported.toLowerCase()], source: source('flocculation') };
  }
  if (axe === 'rondeur') {
    const f = fait('residualSugar');
    return f?.range ? { plage: f.range, source: source('residualSugar') } : null;
  }
  return null;
}

export const valeurAxe = (levure: YeastReference, axe: IdAxe): ValeurAxe | null =>
  apiLevure ? apiLevure.valeurAxe(levure, axe) : valeurProvisoire(levure, axe);
