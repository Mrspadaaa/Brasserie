module.exports = [
[`import type { ContexteRangerCarnet, EtapeLien } from '../../../functions/src/carnetIA';`,
`import type { ContexteRangerCarnet, EtapeLien } from '../../../functions/src/carnetIA';
import { lireReponseLecture, nouveauJeton, type SuiviLectures } from '../../domain/carnets/lecture';
import { estLienSeul } from '../../domain/carnets/modele';
import { estFluxLecture, type AiFluxLecture } from '../../services/aiClient';`],

[` * La lecture d'un lien en cours. \`etapes\` (IA-ETAPES-VISIBLES, D446) : les étapes de la lecture, du serveur (\`PageLue.etapes\`, de
 * \`functions/src/carnetIA.ts\` : page, donnees, prix, devise-frais, photos, caract, controle, ia), chacune trouvée, absente ou douteuse.
 * Lues ici, jamais dessinées : leur affichage passe par des mini maquettes (règle n° 1).
 * TODO(IA-ETAPES-VISIBLES) : le flux au fil de l'eau (\`response.sendChunk\` de la tâche \`lireLien\`, \`AiClient.runFlux\`) n'existe pas
 * encore dans \`functions/src/ai.ts\` ; tant que c'est le cas, \`etapes\` arrive avec la page lue, d'un bloc.
 */
export interface LectureEnCours { url: string; statut?: PageLue['statut']; etapes?: readonly EtapeLien[] }`,
` * La lecture d'un lien (IA-ETAPES-VISIBLES, D448). \`etapes\` : les étapes de la lecture, du serveur (\`functions/src/carnetIA.ts\` : page,
 * donnees, prix, devise-frais, photos, caract, controle, ia, bloquee), chacune trouvée, absente ou douteuse, reçues au fil de l'eau par le
 * flux de \`lireLien\` (\`AiClient.runFlux\`), puis celles de la page lue. \`enCours\` : la sous-tâche lente annoncée (l'IA, Google). \`jeton\` :
 * tiré par l'app, gardé sur l'appareil tant que la lecture n'est pas finie (\`SuiviLectures\`) ; \`reouverture\` : retrouvée à la réouverture ;
 * \`escalade\` : relue avec l'IA forte. \`debut\`, \`fin\` : horodatages (ms) de la lecture.
 */
export interface LectureEnCours {
  url: string; statut?: PageLue['statut']; etapes?: readonly EtapeLien[]; enCours?: 'ia' | 'bloquee';
  jeton?: string; debut?: number; fin?: number; reouverture?: true; escalade?: true;
}`],

[`  | { etape: 'range'; messageId: string; texte: string; rangement: 'ia' | 'simulee' | 'locale'; lignes: LigneCarnet[] | null }
  | { etape: 'echec'; messageId: string; texte: string; avis: string }`,
`  | { etape: 'range'; messageId: string; texte: string; rangement: 'ia' | 'simulee' | 'locale'; lignes: LigneCarnet[] | null; lecture?: LectureEnCours }
  | { etape: 'echec'; messageId: string; texte: string; avis: string; lecture?: LectureEnCours }`],

[`export interface AppelsIA {
  ranger(contexte: ContexteRangerCarnet, signal: AbortSignal): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  lire(url: string, signal: AbortSignal): Promise<PageLue>;
}`,
`export interface AppelsIA {
  ranger(contexte: ContexteRangerCarnet, signal: AbortSignal): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  /** \`suivi\` (le premier lien d'un message) : le jeton de la lecture, l'IA forte (\`escalade\`), les étapes reçues au fil de l'eau. */
  lire(url: string, signal: AbortSignal, suivi?: SuiviLecture): Promise<PageLue>;
}
export interface SuiviLecture {
  jeton?: string; escalade?: boolean;
  surEtapes?: (e: { etapes: readonly EtapeLien[]; enCours?: 'ia' | 'bloquee' }) => void;
}`],

[`  horsLigne: "Hors ligne : rangé sur l'appareil, tel quel."
} as const;`,
`  horsLigne: "Hors ligne : rangé sur l'appareil, tel quel.",
  /* T26-4 : un lien mort ne laisse rien derrière lui */
  introuvable: 'Lien introuvable : rien n’a été gardé.'
} as const;`],

[`/** Appels réels, par la passerelle \`aiTask\` (jamais en \`npm test\` : le mode n'y vaut jamais \`production\`). */
export const appelsReels: AppelsIA = {
  async ranger(contexte) {
    const r = await AiClient.run({ task: 'rangerCarnet', tier: 'fast', context: contexte });
    return { ok: r.ok, data: r.data, error: r.error };
  },
  async lire(url) {
    const r = await AiClient.run<PageLue>({ task: 'lireLien', context: { url } });
    if (r.ok && r.data && typeof r.data === 'object' && typeof r.data.statut === 'string') return r.data;
    let domaine = '';
    try { domaine = new URL(url).hostname.replace(/^www\\./, ''); } catch { /* adresse illisible */ }
    return { url, domaine, statut: 'indisponible', luLe: Date.now() };
  }
};`,
`/** Pause entre deux rappels d'une lecture suivie (réouverture pendant la lecture), et leur limite (la fonction s'arrête à 300 s). */
const SUIVI_PAS_MS = 2500;
const SUIVI_MAX_MS = 330_000;

/**
 * Appels réels, par la passerelle \`aiTask\` (jamais en \`npm test\` : le mode n'y vaut jamais \`production\`). La lecture passe par le flux
 * (\`runFlux\`) : chaque étape arrive dès que le serveur la dit. Rappelée avec un jeton dont la lecture tourne encore (l'app rouverte), la
 * tâche rend son état, jamais une seconde lecture : l'app la suit alors par \`{ jeton, reprise: true }\` jusqu'à sa fin.
 */
export const appelsReels: AppelsIA = {
  async ranger(contexte) {
    const r = await AiClient.run({ task: 'rangerCarnet', tier: 'fast', context: contexte });
    return { ok: r.ok, data: r.data, error: r.error };
  },
  async lire(url, signal, suivi) {
    const dire = (e: { etapes: readonly EtapeLien[]; enCours?: 'ia' | 'bloquee' }) => { try { suivi?.surEtapes?.(e); } catch { /* l'écran ne fait jamais échouer la lecture */ } };
    const context = { url, ...(suivi?.jeton ? { jeton: suivi.jeton } : {}), ...(suivi?.escalade ? { escalade: true } : {}) };
    const r = await AiClient.runFlux<unknown, AiFluxLecture>({ task: 'lireLien', context },
      (m) => dire({ etapes: m.etapes as EtapeLien[], ...(m.enCours ? { enCours: m.enCours } : {}) }), signal, estFluxLecture);
    let lu = r.ok ? lireReponseLecture(r.data) : null;
    const debut = Date.now();
    while (lu && 'suivi' in lu && lu.suivi.statut === 'en-cours' && suivi?.jeton && !signal.aborted && Date.now() - debut < SUIVI_MAX_MS) {
      dire({ etapes: lu.suivi.etapes, ...(lu.suivi.enCours ? { enCours: lu.suivi.enCours } : {}) });
      try { await attendre(SUIVI_PAS_MS, signal); } catch { break; }
      const v = await AiClient.run({ task: 'lireLien', context: { jeton: suivi.jeton, reprise: true } });
      lu = v.ok ? lireReponseLecture(v.data) : null;
    }
    if (lu && 'page' in lu) return lu.page;
    let domaine = '';
    try { domaine = new URL(url).hostname.replace(/^www\\./, ''); } catch { /* adresse illisible */ }
    const etapes = lu && 'suivi' in lu ? lu.suivi.etapes : [];
    return { url, domaine, statut: 'indisponible', ...(etapes.length ? { etapes } : {}), luLe: Date.now() };
  }
};`],

[`  /** Délai côté client, au-delà duquel l'envoi passe en échec (par défaut 45 s). */
  delaiMs?: number;`,
`  /** Délai côté client, au-delà duquel l'envoi passe en échec (par défaut 45 s ; 120 s quand un lien est lu, la lecture dure 20 à 35 s). */
  delaiMs?: number;
  /** IA-ETAPES-VISIBLES : la lecture lancée est gardée sur l'appareil jusqu'à sa fin, pour être retrouvée à la réouverture. Absent : rien de gardé. */
  suivi?: SuiviLectures;
  /** T26-4 : un lien seul dont la page est introuvable ne laisse aucun article (ni dans la liste, ni dans le compte). */
  retirerLien?: (messageId: string) => void;
  /** Le message existe encore (une lecture gardée d'un message supprimé ne se reprend pas). */
  messageExiste?: (messageId: string) => boolean;`],

[`  /** ✕ pendant \`en-cours\` : coupe l'attente ; rien de plus n'est écrit. Sans effet à un autre moment. */
  annuler(): void;
}`,
`  /** ✕ pendant \`en-cours\` : coupe l'attente ; rien de plus n'est écrit. Sans effet à un autre moment. */
  annuler(): void;
  /** D448, échec : « Escalader » relit le lien avec l'IA forte (\`escalade: true\`, lecture neuve), puis range comme un envoi. */
  escalader(messageId: string, texte: string): Promise<EtatRangement<L>>;
  /** IA-ETAPES-VISIBLES : à la réouverture, chaque lecture gardée sur l'appareil est reprise par son jeton (finie : sa page ; en cours : suivie). */
  reprendreLectures(): Promise<void>;
}`],

[`  async function passerIA(messageId: string, texte: string, carnets: readonly CarnetPourIA[]): Promise<EtatRangement<L>> {
    const ctrl = new AbortController();
    controleur = ctrl;
    const delai = setTimeout(() => ctrl.abort(new DOMException('délai', 'TimeoutError')), deps.delaiMs ?? 45_000);
    const coupe = () => ctrl.signal.aborted;
    const fin = (e: EtatRangement<L>) => { clearTimeout(delai); if (controleur === ctrl) controleur = null; return poser(e); };
    const urls = liensDuTexte(texte).slice(0, 3);`,
`  async function passerIA(messageId: string, texte: string, carnets: readonly CarnetPourIA[],
    o: { jeton?: string; debut?: number; reouverture?: boolean; escalade?: boolean } = {}): Promise<EtatRangement<L>> {
    const ctrl = new AbortController();
    controleur = ctrl;
    const urls = liensDuTexte(texte).slice(0, 3);
    const delai = setTimeout(() => ctrl.abort(new DOMException('délai', 'TimeoutError')), deps.delaiMs ?? (urls.length ? 120_000 : 45_000));
    const coupe = () => ctrl.signal.aborted;
    /* La lecture du premier lien : son jeton, tiré ici (connu avant la première réponse), gardé sur l'appareil jusqu'à la fin de l'envoi. */
    const debut = o.debut ?? Date.now();
    const jeton = urls.length ? o.jeton ?? nouveauJeton() : undefined;
    const drapeaux = { ...(o.reouverture ? { reouverture: true as const } : {}), ...(o.escalade ? { escalade: true as const } : {}) };
    let lecture: LectureEnCours | undefined = urls.length ? { url: urls[0], jeton, debut, ...drapeaux } : undefined;
    if (jeton) deps.suivi?.garder({ jeton, url: urls[0], messageId, texte, debut, ...(o.escalade ? { escalade: true as const } : {}) });
    const fin = (e: EtatRangement<L>) => {
      clearTimeout(delai);
      if (controleur === ctrl) controleur = null;
      if (jeton) deps.suivi?.retirer(jeton);
      return poser(e);
    };`],

[`    poser({ etape: 'en-cours', messageId, texte });
    try {
      /* Les pages (3 au plus) sont lues ensemble, pas l'une après l'autre (d1280-18) : la lecture dure celle de la plus lente. Le cadre
         montre le premier lien. */
      if (urls.length) {
        poser({ etape: 'en-cours', messageId, texte, lecture: { url: urls[0] } });
        pages = pagesDesLiens(urls, await course(Promise.all(urls.map(url => appels.lire(url, ctrl.signal)))));
        poser({ etape: 'en-cours', messageId, texte, lecture: { url: urls[0], statut: pages[0].statut, ...(pages[0].etapes?.length ? { etapes: pages[0].etapes } : {}) } });
      }`,
`    poser({ etape: 'en-cours', messageId, texte });
    try {
      /* Les pages (3 au plus) sont lues ensemble, pas l'une après l'autre (d1280-18) : la lecture dure celle de la plus lente. Le cadre
         montre le premier lien, ses étapes au fil de l'eau (IA-ETAPES-VISIBLES). */
      if (urls.length && lecture) {
        poser({ etape: 'en-cours', messageId, texte, lecture });
        const suivi: SuiviLecture = {
          jeton, ...(o.escalade ? { escalade: true } : {}),
          surEtapes: (x) => {
            if (coupe() || !lecture) return;
            const { enCours: _ancien, ...reste } = lecture;
            lecture = { ...reste, etapes: x.etapes, ...(x.enCours ? { enCours: x.enCours } : {}) };
            poser({ etape: 'en-cours', messageId, texte, lecture });
          }
        };
        pages = pagesDesLiens(urls, await course(Promise.all(urls.map((url, i) => (i === 0 ? appels.lire(url, ctrl.signal, suivi) : appels.lire(url, ctrl.signal))))));
        const { enCours: _fini, ...reste } = lecture;
        lecture = { ...reste, statut: pages[0].statut, fin: Date.now(), ...(pages[0].etapes?.length ? { etapes: pages[0].etapes } : {}) };
        poser({ etape: 'en-cours', messageId, texte, lecture });
        /* T26-4 : un lien seul, mort (adresse introuvable) : rien n'est gardé, ni article, ni compte, ni suggestion ; l'échec le dit. */
        if (urls.length === 1 && pages[0].statut === 'introuvable' && estLienSeul(texte)) {
          try { deps.retirerLien?.(messageId); } catch { /* l'avis le dit quand même */ }
          return fin({ etape: 'echec', messageId, texte, avis: AVIS.introuvable, lecture });
        }
      }`],

[`      return fin({ etape: 'echec', messageId, texte, avis });
    };`,
`      return fin({ etape: 'echec', messageId, texte, avis, ...(lecture ? { lecture } : {}) });
    };`],

[`      await deps.ecrireIA(messageId, lignes, rangement);
      return fin({ etape: 'range', messageId, texte, rangement, lignes });`,
`      await deps.ecrireIA(messageId, lignes, rangement);
      return fin({ etape: 'range', messageId, texte, rangement, lignes, ...(lecture ? { lecture } : {}) });`],

[`    annuler() { controleur?.abort(new DOMException('annulé', 'AbortError')); }
  };`,
`    annuler() { controleur?.abort(new DOMException('annulé', 'AbortError')); },
    async escalader(messageId, brut) {
      const texte = brut.trim();
      if (!texte || occupe || deps.mode === 'eteint' || !deps.enLigne() || !liensDuTexte(texte).length) return etat;
      occupe = true;
      try { return await passerIA(messageId, texte, deps.carnets(), { escalade: true }); } finally { occupe = false; }
    },
    async reprendreLectures() {
      if (!deps.suivi || deps.mode === 'eteint' || !deps.enLigne()) return;
      for (const l of deps.suivi.lister()) {
        if (occupe) return;
        if (deps.messageExiste && !deps.messageExiste(l.messageId)) { deps.suivi.retirer(l.jeton); continue; }
        occupe = true;
        try { await passerIA(l.messageId, l.texte, deps.carnets(), { jeton: l.jeton, debut: l.debut, reouverture: true, ...(l.escalade ? { escalade: true } : {}) }); }
        finally { occupe = false; }
      }
    }
  };`]
];
