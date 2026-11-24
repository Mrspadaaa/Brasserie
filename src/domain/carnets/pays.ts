/**
 * R46 (C61-3, c61-fix 24.11) : un même pays ne s'écrit pas de deux façons dans le Comparer (« USA » d'un côté, « États-Unis » de l'autre).
 *
 * État de l'art : problème d'école = normalisation de noms de pays (entity resolution, vocabulaire fermé : ISO 3166-1). Méthode standard : le code
 * ISO et les noms localisés de la bibliothèque standard `Intl.DisplayNames` (CLDR, déjà dans tout navigateur et dans Node : aucune dépendance, aucune
 * table écrite à la main sauf les sigles d'usage que le CLDR ne porte pas). Un index nom → code est construit une fois en lisant les 676 codes
 * possibles dans cinq langues (fr, en, de, it, es), sans accent ni casse ; le nom rendu est celui du français. Un nom inconnu reste tel quel (jamais deviné).
 */
const LANGUES = ['fr', 'en', 'de', 'it', 'es'] as const;
/** Sigles et usages courants que le CLDR ne donne pas comme nom de région. */
const SIGLES: Record<string, string> = { usa: 'US', 'u s a': 'US', us: 'US', 'u s': 'US', uk: 'GB', 'u k': 'GB', 'great britain': 'GB', holland: 'NL', czechia: 'CZ', 'czech republic': 'CZ', tchequie: 'CZ' };

const cle = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();

let index: Map<string, string> | null = null;
let noms: Intl.DisplayNames | null = null;

function construire(): boolean {
  if (index) return noms !== null;
  index = new Map();
  try {
    noms = new Intl.DisplayNames(['fr'], { type: 'region' });
    const parLangue = LANGUES.map(l => new Intl.DisplayNames([l], { type: 'region' }));
    for (let i = 65; i <= 90; i += 1) for (let j = 65; j <= 90; j += 1) {
      const code = String.fromCharCode(i) + String.fromCharCode(j);
      for (const d of parLangue) {
        const n = d.of(code);
        if (n && n !== code) { const k = cle(n); if (k && !index.has(k)) index.set(k, code); }
      }
    }
  } catch { noms = null; }
  return noms !== null;
}

/** Le pays en français (« USA », « United States », « États-Unis » → « États-Unis » ; « Deutschland » → « Allemagne ») ; le texte tel quel s'il n'est pas un pays connu. */
export function paysEnFrancais(texte: string): string {
  const brut = texte.trim();
  if (!brut || !construire()) return texte;
  const k = cle(brut);
  const code = SIGLES[k] ?? index!.get(k);
  const nom = code ? noms!.of(code) : undefined;
  return nom && nom !== code ? nom : texte;
}

/** Le nom d'une ligne d'origine, sous ses écritures française, allemande et anglaise. */
export const estLigneOrigine = (nom: string): boolean => /^(?:origine|pays d origine|pays|provenance|herkunft|herkunftsland|ursprung|origin|country of origin|country)$/.test(cle(nom));
