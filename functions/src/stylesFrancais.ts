/**
 * C61-6 (R46, c61-fix 24.11) : « Particulièrement adapté pour : amerikanische Ales und IPA's » (page allemande) se lit « ales et IPA américaines », comme les arômes
 * (aromesFrancais.ts). Problème d'école : un petit vocabulaire fermé (styles de bière et nationalités), jamais de traduction automatique ni d'appel IA ; tout ou rien :
 * si un mot du texte n'est pas connu, le texte reste tel quel (jamais deviné, jamais à moitié traduit). Idempotent : du français repasse inchangé. Sans dépendance :
 * partagé par le serveur (lecture) et l'écran (donnée déjà stockée).
 */
const cle = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();

/** Un style : son écriture française et son genre (le féminin pluriel ne se garde que si tous les styles le sont). */
const STYLES: Record<string, { fr: string; f: boolean }> = {
  ale: { fr: 'ale', f: true }, ales: { fr: 'ales', f: true }, 'pale ale': { fr: 'pale ale', f: true }, 'pale ales': { fr: 'pale ales', f: true },
  ipa: { fr: 'IPA', f: true }, ipas: { fr: 'IPA', f: true }, 'ipa s': { fr: 'IPA', f: true }, 'india pale ale': { fr: 'IPA', f: true },
  'india pale ales': { fr: 'IPA', f: true }, lager: { fr: 'lagers', f: true }, lagers: { fr: 'lagers', f: true }, 'lager s': { fr: 'lagers', f: true },
  stout: { fr: 'stouts', f: false }, stouts: { fr: 'stouts', f: false }, pils: { fr: 'pils', f: false }, pilsner: { fr: 'pils', f: false },
  weizen: { fr: 'weizen', f: false }, weissbier: { fr: 'bières de blé', f: true }, weizenbier: { fr: 'bières de blé', f: true }, saison: { fr: 'saisons', f: false },
  kolsch: { fr: 'kölsch', f: false }, helles: { fr: 'helles', f: false }, bock: { fr: 'bocks', f: false }, bockbier: { fr: 'bocks', f: false }, dunkel: { fr: 'dunkel', f: false },
  'belgian ale': { fr: 'ales belges', f: true }, 'wheat beer': { fr: 'bières de blé', f: true }, 'wheat beers': { fr: 'bières de blé', f: true }
};
/* « porter » reste au singulier dans le métier (« ales et porter anglais ») */
STYLES.porter = { fr: 'porter', f: false };
STYLES.porters = { fr: 'porter', f: false };

/** Une nationalité : masculin pluriel, féminin pluriel (ou invariable). */
const ADJECTIFS: Record<string, { m: string; f: string }> = {
  amerikanische: { m: 'américains', f: 'américaines' }, amerikanisches: { m: 'américains', f: 'américaines' }, amerikanischer: { m: 'américains', f: 'américaines' }, american: { m: 'américains', f: 'américaines' },
  englische: { m: 'anglais', f: 'anglaises' }, englisches: { m: 'anglais', f: 'anglaises' }, english: { m: 'anglais', f: 'anglaises' },
  deutsche: { m: 'allemands', f: 'allemandes' }, german: { m: 'allemands', f: 'allemandes' },
  belgische: { m: 'belges', f: 'belges' }, belgian: { m: 'belges', f: 'belges' },
  britische: { m: 'britanniques', f: 'britanniques' }, british: { m: 'britanniques', f: 'britanniques' },
  tschechische: { m: 'tchèques', f: 'tchèques' }, czech: { m: 'tchèques', f: 'tchèques' },
  klassische: { m: 'classiques', f: 'classiques' }, classic: { m: 'classiques', f: 'classiques' }
};

interface Morceau { adj?: { m: string; f: string }; style: { fr: string; f: boolean } }

/** « amerikanische Ales » → {adjectif, style} ; `null` si un mot n'est pas connu. */
function morceau(texte: string): Morceau | null {
  const k = cle(texte);
  const direct = STYLES[k];
  if (direct) return { style: direct };
  const i = k.indexOf(' ');
  if (i < 0) return null;
  const adj = ADJECTIFS[k.slice(0, i)];
  const style = STYLES[k.slice(i + 1)];
  return adj && style ? { adj, style } : null;
}

/** Le nom d'une ligne qui dit pour quoi le houblon convient (« Besonders geeignet für », « Particulièrement adapté pour »). */
export const estLigneStyles = (nom: string): boolean =>
  /^(?:particulierement adapte pour|adapte pour|besonders geeignet fur|geeignet fur|empfohlen fur|ideal fur|bestens geeignet fur|passend zu|suitable for|especially suitable for|best for|recommended for|beer styles?|biersorten?|bierstile?)$/.test(cle(nom.replace(/[‎‏]/g, '').replace(/\s*:\s*$/, '')));

/** « amerikanische Ales und IPA's » → « ales et IPA américaines » ; un texte qui n'est pas une suite de styles connus reste tel quel. */
export function stylesEnFrancais(texte: string): string {
  const parts = texte.split(/\s*(?:,|;|\/|\bund\b|\band\b|\bet\b|&)\s*/i).map(p => p.trim()).filter(Boolean);
  if (!parts.length) return texte;
  const lus = parts.map(morceau);
  if (lus.some(l => l === null)) return texte;
  const m = lus as Morceau[];
  /* un adjectif porté par le premier seul vaut pour tous (« amerikanische Ales und IPA's ») ; sinon chacun garde le sien */
  const commun = m[0].adj && m.slice(1).every(x => !x.adj) ? m[0].adj : undefined;
  const dits = m.map(x => (commun ? x.style.fr : x.adj ? `${x.style.fr} ${x.style.f ? x.adj.f : x.adj.m}` : x.style.fr));
  const liste = dits.length > 1 ? `${dits.slice(0, -1).join(', ')} et ${dits[dits.length - 1]}` : dits[0];
  return commun ? `${liste} ${m.every(x => x.style.f) ? commun.f : commun.m}` : liste;
}
