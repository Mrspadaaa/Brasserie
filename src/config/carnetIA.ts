/**
 * Drapeau du carnet d'idées (port du 17.11, lot B), sur le patron de `rangerNoteIA.ts`.
 *  - banc (`?dev-local` ou `?preview=carnets`, serveur de développement seulement) : TOUJOURS `simule` (réponse simulée, marquée
 *    « exemple »), même si la valeur dit `production` ; `&ia=eteint` y rejoue le repli local ;
 *  - `production` : posée au seul build de mise en ligne du lot G (`VITE_CARNET_IA=production`, accord du 17.11 au soir, D-144) ;
 *  - aucune valeur (dev hors banc, Vitest, build sans la variable) : `eteint`. Jamais un appel Gemini par accident.
 */
export type ModeCarnetIA = 'eteint' | 'simule' | 'production';

export function modeDe(valeur: unknown, dev: unknown, banc: boolean, force?: unknown): ModeCarnetIA {
  if (dev === true && banc) return force === 'eteint' ? 'eteint' : 'simule';
  if (valeur === 'production') return 'production';
  return 'eteint';
}

const param = (nom: string): string | null => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get(nom));
const auBanc = (): boolean => param('dev-local') !== null || param('preview') === 'carnets';

/** La clé reste lisible dans le paquet quand elle est posée (`VITE_CARNET_IA:"production"`), pour le contrôle des drapeaux. */
const DRAPEAU = { VITE_CARNET_IA: import.meta.env.VITE_CARNET_IA as unknown };

/** Lu à l'appel, jamais au chargement. Hors serveur de développement, aucun paramètre d'adresse n'est lu. */
export const modeCarnet = (): ModeCarnetIA =>
  modeDe(DRAPEAU.VITE_CARNET_IA, import.meta.env.DEV, import.meta.env.DEV && auBanc(), import.meta.env.DEV ? param('ia') : null);

/** Banc seulement : `&ia=echec` (l'IA simulée tombe en panne) et `&ia=lent` (elle met 4 s) ; partout ailleurs, `normal`. */
export type ComportementSimule = 'normal' | 'echec' | 'lent';
export const comportementSimule = (): ComportementSimule => {
  if (!import.meta.env.DEV) return 'normal';
  const v = param('ia');
  return v === 'echec' || v === 'lent' ? v : 'normal';
};

/**
 * Les aides de l'IA non classées (R40, § Points ouverts 5 et 17) : construites, visibles au banc, éteintes en production tant qu'il ne
 * les a pas vues (page de la voie E, section 4). G30, G32, G35, G36, G37 ne passent pas par ici (Annuler dans la page, Suppression v2).
 */
export interface AidesCarnet {
  /** G11 (« Même chose que la note du … · Garder à part ») et G33 (« doublon ? »). */
  doublon: boolean;
  /** G25, « ✻ Ressemble à un critère · Passer en Ce qui compte ». */
  noteEnCritere: boolean;
  /** G26, la conséquence pour la comparaison après une modification. */
  consequence: boolean;
  /** G27, « ✻ Même visite : … · Regrouper ». */
  regrouper: boolean;
  /** G29, le titre proposé au renommage. */
  renommerPropose: boolean;
}
export const NOMS_AIDES = ['doublon', 'noteEnCritere', 'consequence', 'regrouper', 'renommerPropose'] as const satisfies ReadonlyArray<keyof AidesCarnet>;

/**
 * `simule` (banc) : toutes vraies, sauf `&aides=0` (le banc rejoue la production). `production` et `eteint` : toutes fausses, sauf la
 * liste `VITE_CARNET_AIDES=doublon,regrouper` posée au build après qu'il les a vues.
 */
export function aidesCarnet(mode: ModeCarnetIA, env: { VITE_CARNET_AIDES?: unknown }, parametreBanc?: string | null): AidesCarnet {
  const toutes = (v: boolean) => Object.fromEntries(NOMS_AIDES.map((n) => [n, v])) as unknown as AidesCarnet;
  if (mode === 'simule') return toutes(parametreBanc !== '0');
  const liste = typeof env.VITE_CARNET_AIDES === 'string' ? env.VITE_CARNET_AIDES.split(/[,\s]+/).filter(Boolean) : [];
  const aides = toutes(false);
  for (const n of NOMS_AIDES) if (liste.includes(n)) aides[n] = true;
  return aides;
}

/**
 * Les aides du moment, pour `CarnetsVue.tsx`. La clé est lue par un nom composé : quand la variable n'est pas posée au build, son nom
 * n'entre pas dans le paquet (D7 : `grep -c "VITE_CARNET_AIDES" dist/assets/*.js` vaut 0) ; posée, Vite la place dans `import.meta.env`.
 */
export const aidesCourantes = (): AidesCarnet => {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const cle = ['VITE', 'CARNET', 'AIDES'].join('_');
  return aidesCarnet(modeCarnet(), { VITE_CARNET_AIDES: env[cle] }, import.meta.env.DEV ? param('aides') : null);
};
