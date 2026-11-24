import fs from 'node:fs';
import { R } from './r.mjs';

/* T30-2 : « Compléter » un lien mort : saisie du nom et du prix ; l'article est retrouvé (par le message, sinon par l'adresse) ou créé */
R('src/domain/carnets/operations.ts', [
  ["/* ---------- veille (R31) ---------- */",
   "/**\n * T30-2 (test en ligne du tour 30 : « Compléter » sur un lien mort ne donnait qu'un toast « Article introuvable. ») : le brasseur écrit lui-même\n * le nom (et le prix, en francs) de l'article dont le lien ne mène plus à rien. L'article est celui du message ; sinon celui du carnet qui porte\n * déjà cette adresse (un lien collé deux fois ne laisse pas d'article au second message) ; sinon il est créé dans `carnetId`. Il reste « lien\n * introuvable » (sa page ne se lit plus) mais prend nom et prix, de provenance « vous » : il se compte et se classe. Le prix est facultatif.\n */\nexport function completerLienMort(etat: Etat, args: { messageId: string; url: string; carnetId?: string | null; nom: string; prixCentimes?: number }): Resultat {\n  const nom = args.nom.trim();\n  if (!nom) return refus('Le nom de l’article est à écrire.');\n  if (args.prixCentimes !== undefined && (!Number.isSafeInteger(args.prixCentimes) || args.prixCentimes <= 0)) return refus('Prix illisible.');\n  const b = new Brouillon(etat);\n  const canon = lienCanonique(args.url);\n  const sansLecture = (x: Article) => x.lecture !== 'lue';\n  let cible: { c: CarnetDoc; a: Article } | null = null;\n  for (const d of etat) {\n    if (d.type !== 'carnet') continue;\n    const c = b.carnet(d.id);\n    const a = c?.carnet.articles.find(x => x.messageId === args.messageId && sansLecture(x)) ?? (canon ? c?.carnet.articles.find(x => x.url && lienCanonique(x.url) === canon && sansLecture(x)) : undefined);\n    if (c && a) { cible = { c, a }; break; }\n  }\n  if (!cible) {\n    const c = args.carnetId ? b.carnet(args.carnetId) : null;\n    if (!c) return refus('Carnet introuvable.');\n    let domaine: string | undefined;\n    try { domaine = new URL(args.url).hostname.replace(/^www\\./, ''); } catch { domaine = undefined; }\n    const a: Article = sansIndefinis({ id: nouvelIdCarnet('ART'), url: args.url, domaine, valeurs: {}, lecture: 'introuvable' as const, messageId: args.messageId });\n    c.carnet.articles.push(a);\n    cible = { c, a };\n  }\n  const { c, a } = cible;\n  a.nom = nom;\n  a.lecture = 'introuvable';\n  a.origine = 'vous';\n  if (args.prixCentimes !== undefined) { a.prixCentimes = args.prixCentimes; a.devise = 'CHF'; delete a.prixDes; delete a.taxe; delete a.prixTTCCentimes; delete a.change; }\n  poser(b, c);\n  return b.resultat('Article gardé');\n}\n\n/* ---------- veille (R31) ---------- */"],
]);

/* T30-5 : la réponse « C'est le bon » est gardée */
fs.appendFileSync('src/ui/carnets/lectureRegles.ts', `
/** T30-5 : les questions de la carte de fin auxquelles le brasseur a répondu « C'est le bon », par message (gardées : la question ne revient pas). */
export type Bons = Readonly<Record<string, readonly string[]>>;
export const CLE_BONS = 'affinee.carnets.lecturesBonnes';
const MAX_MESSAGES_BONS = 60;

export function avecBon(bons: Bons, messageId: string, cle: string): Bons {
  if (bons[messageId]?.includes(cle)) return bons;
  const suite = { ...bons, [messageId]: [...(bons[messageId] ?? []), cle] };
  const ids = Object.keys(suite);
  /* garde les plus récents : un objet garde l'ordre d'insertion */
  return ids.length > MAX_MESSAGES_BONS ? Object.fromEntries(ids.slice(-MAX_MESSAGES_BONS).map(id => [id, suite[id]])) : suite;
}

/** Lu sur l'appareil ; tout ce qui n'est pas une liste de textes par message est ignoré (jamais une erreur). */
export function lireBons(stock: Pick<Storage, 'getItem'> | undefined): Bons {
  try {
    const brut = stock?.getItem(CLE_BONS);
    const v: unknown = brut ? JSON.parse(brut) : null;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const sortie: Record<string, string[]> = {};
    for (const [id, l] of Object.entries(v as Record<string, unknown>)) if (Array.isArray(l)) sortie[id] = l.filter((x): x is string => typeof x === 'string');
    return sortie;
  } catch { return {}; }
}

export function garderBons(stock: Pick<Storage, 'setItem'> | undefined, bons: Bons): void {
  try { stock?.setItem(CLE_BONS, JSON.stringify(bons)); } catch { /* stockage plein ou refusé : la réponse reste valable pour la session */ }
}
`);

R('src/ui/carnets/LectureLien.tsx', [
  ["import { boutonEscalader, type Relecture } from './lectureRegles';", "import { parsePrix } from '../../domain/finance/upgradeRing';\nimport { boutonEscalader, type Relecture } from './lectureRegles';"],
  ["  onCompleter?: () => void;\n", "  /** T30-2 : « Compléter » ouvre une saisie (nom, prix) ; ceci reçoit ce que le brasseur a écrit. */\n  onCompleter?: (saisie: SaisieLienMort) => void;\n  /** T30-5 : les questions déjà réglées d'un « C'est le bon » (gardées par l'écran) et le geste qui en règle une. */\n  bons?: readonly string[];\n  onBon?: (cle: string) => void;\n"],
  ["export interface LectureLienProps {", "/** Ce que le brasseur écrit pour un lien mort : le nom de l'article, et son prix en francs (centimes) s'il le sait. */\nexport interface SaisieLienMort { nom: string; prixCentimes?: number }\n\n/** T30-2 : la saisie d'un article dont le lien ne mène plus à rien (base-echec : « Compléter, ou redonner à l'IA »). */\nfunction SaisieMort({ onGarder, onAnnuler }: { onGarder: (s: SaisieLienMort) => void; onAnnuler: () => void }) {\n  const [nom, setNom] = useState('');\n  const [prix, setPrix] = useState('');\n  const [refus, setRefus] = useState<string | null>(null);\n  const valider = () => {\n    const n = nom.trim();\n    if (!n) { setRefus('Le nom de l’article est à écrire.'); return; }\n    const t = prix.trim();\n    const c = t ? parsePrix(t) : undefined;\n    if (t && c === null) { setRefus(`« ${t} » : ce n’est pas un prix.`); return; }\n    onGarder({ nom: n, ...(c !== undefined && c !== null ? { prixCentimes: c } : {}) });\n  };\n  return (\n    <form className=\"cnl-saisie\" data-lecture-saisie onSubmit={e => { e.preventDefault(); valider(); }}>\n      <input type=\"text\" enterKeyHint=\"next\" autoComplete=\"off\" autoFocus className=\"cnl-champ\" aria-label=\"Nom de l’article\" placeholder=\"Nom de l’article\" aria-invalid={refus && !nom.trim() ? true : undefined} value={nom} onChange={e => { setNom(e.target.value); setRefus(null); }} />\n      <span className=\"cnl-prix-ligne\">\n        <input type=\"text\" inputMode=\"decimal\" enterKeyHint=\"done\" autoComplete=\"off\" className=\"cnl-champ cnl-champ-prix\" aria-label=\"Prix en francs\" placeholder=\"Prix (facultatif)\" value={prix} onChange={e => { setPrix(e.target.value); setRefus(null); }} />\n        <span className=\"cn-mut\">CHF</span>\n      </span>\n      <span className=\"cnl-saisie-gestes\">\n        <button type=\"submit\" className=\"cnl-bouton cnl-garder\"><Check size={16} aria-hidden /> Garder</button>\n        <button type=\"button\" className=\"cnl-bouton\" onClick={onAnnuler}>Annuler</button>\n      </span>\n      {refus && <p role=\"alert\" className=\"cn-rouge\">{refus}</p>}\n    </form>\n  );\n}\n\nexport interface LectureLienProps {"],
  ["  const exemple = p.exemple ? <span className=\"cn-exemple\">exemple</span> : null;\n", "  const exemple = p.exemple ? <span className=\"cn-exemple\">exemple</span> : null;\n  const [saisie, setSaisie] = useState(false);\n"],
  ["        <div className=\"cnl-actions\">\n          {p.onEscalader", "        {saisie && p.onCompleter ? <SaisieMort onGarder={s => { setSaisie(false); p.onCompleter!(s); }} onAnnuler={() => setSaisie(false)} /> : <div className=\"cnl-actions\">\n          {p.onEscalader"],
  ["{p.onCompleter && rel !== 'en-cours' && <button type=\"button\" className=\"cnl-bouton\" onClick={p.onCompleter}><Pencil size={16} aria-hidden /> Compléter</button>}", "{p.onCompleter && rel !== 'en-cours' && <button type=\"button\" className=\"cnl-bouton\" onClick={() => setSaisie(true)}><Pencil size={16} aria-hidden /> Compléter</button>}"],
  ["{p.onRetirer && rel !== 'en-cours' && <button type=\"button\" className=\"cnl-bouton\" onClick={p.onRetirer}><Trash2 size={16} aria-hidden /> Retirer</button>}\n        </div>", "{p.onRetirer && rel !== 'en-cours' && <button type=\"button\" className=\"cnl-bouton\" onClick={p.onRetirer}><Trash2 size={16} aria-hidden /> Retirer</button>}\n        </div>}"],
  ["  const [bons, setBons] = useState<string[]>([]);\n", "  const [bonsLocaux, setBonsLocaux] = useState<string[]>([]);\n  /* T30-5 : réglée une fois, la question ne revient pas (réponse gardée par l'écran, sinon le temps de la carte) */\n  const bons: readonly string[] = p.bons ?? bonsLocaux;\n  const noterBon = (cle: string) => { if (p.onBon) p.onBon(cle); else setBonsLocaux(b => [...b, cle]); };\n"],
  ["onClick={() => setBons(b => [...b, x.cle])}", "onClick={() => noterBon(x.cle)}"],
]);

R('src/ui/carnets/lecture-lien.css', [
  ["/* T28-4 : la relecture", "/* T30-2 : la saisie d'un lien mort (nom, prix), 28 px, dans la carte d'échec */\n.cnl-saisie { display: flex; flex-direction: column; gap: 6px; padding-top: 2px; }\n.cnl-champ { box-sizing: border-box; width: 100%; min-height: 32px; padding: 0 10px; border: 1px solid var(--c-line2) !important; border-radius: 8px; background: var(--c-bg) !important; color: var(--c-ink); font: inherit; }\n.cnl-champ[aria-invalid=true] { border-color: var(--c-rouge) !important; }\n.cnl-prix-ligne { display: flex; align-items: center; gap: 6px; }\n.cnl-champ-prix { width: 9em; font-family: var(--c-mono); }\n.cnl-saisie-gestes { display: flex; gap: 6px; }\n.cnl-garder { border-color: var(--c-zone) !important; }\n\n/* T28-4 : la relecture"],
]);

R('src/ui/carnets/apercuCarnet.tsx', [
  ["  onCompleter: (messageId: string) => void;", "  /** T30-2 : « Compléter » un lien mort : le nom (et le prix) que le brasseur a écrits. */\n  onCompleter: (messageId: string, saisie: SaisieLienMort) => void;\n  /** T30-5 : les questions de la carte de fin déjà réglées d'un « C'est le bon », et le geste qui en règle une. */\n  bons: (messageId: string) => readonly string[];\n  marquerBon: (messageId: string, cle: string) => void;"],
  ["onCompleter={() => lectureUi.onCompleter(id)}", "onCompleter={s => lectureUi.onCompleter(id, s)}"],
  ["{...(a ? { onOuvrirArticle: () => lectureUi.ouvrirArticle(a.carnetId, a.article.id) } : {})} />;", "bons={lectureUi.bons(id)} onBon={cle => lectureUi.marquerBon(id, cle)}\n          {...(a ? { onOuvrirArticle: () => lectureUi.ouvrirArticle(a.carnetId, a.article.id) } : {})} />;"],
  ["import { BarreLecture, LectureLien } from './LectureLien';", "import { BarreLecture, LectureLien, type SaisieLienMort } from './LectureLien';"],
]);

R('src/ui/carnets/CarnetsVue.tsx', [
  ["import { appliquerEcritures, liensDe, marquerIntrouvable, modifierNote,", "import { appliquerEcritures, completerLienMort, liensDe, modifierNote,"],
  ["import { carnetAOuvrirDepuisBarre, carteEnBarre, lectureIci } from './lectureRegles';", "import { avecBon, carnetAOuvrirDepuisBarre, carteEnBarre, garderBons, lectureIci, lireBons, type Bons } from './lectureRegles';"],
  ["  const [lectureFermee, setLectureFermee] = useState<string | null>(null);\n", "  const [lectureFermee, setLectureFermee] = useState<string | null>(null);\n  /** T30-5 : « C'est le bon » gardé sur l'appareil, par message de lien. */\n  const [bonsLectures, setBonsLectures] = useState<Bons>(() => lireBons(typeof localStorage === 'undefined' ? undefined : localStorage));\n"],
  ["    onCompleter: id => {\n      setLectureFermee(id);\n      const inv = inversesLiens.current.get(id);\n      if (!inv) return;\n      inversesLiens.current.delete(id);\n      const avant = magasin.lire();\n      annuler(inv);\n      const apres = appliquerEcritures(avant, inv);\n      appliquer(marquerIntrouvable(apres, { messageId: id }));\n      for (const c of lireCarnets(apres, { archives: true })) {\n        const a = c.carnet.articles.find(x => x.messageId === id);\n        if (a) { setVue({ sorte: 'article', id: c.id, articleId: a.id }); return; }\n      }\n    },",
   "    onCompleter: (id, saisie) => {\n      /* T30-2 : le brasseur écrit le nom (et le prix) ; l'article du lien mort est retrouvé (son message, sinon la même adresse) ou créé dans le carnet du lien */\n      const inv = inversesLiens.current.get(id);\n      const avant = magasin.lire();\n      const base = inv ? appliquerEcritures(avant, inv) : avant;\n      const lien = 'lecture' in etatR ? etatR.lecture : undefined;\n      const carnetId = lien?.carnetId ?? carnetDuMessage(id) ?? idOuvert;\n      const r = completerLienMort(base, { messageId: id, url: lien?.url ?? '', carnetId, nom: saisie.nom, ...(saisie.prixCentimes !== undefined ? { prixCentimes: saisie.prixCentimes } : {}) });\n      if (!r.ok) { p.onMessage?.((r as { raison: string }).raison); return; }\n      if (inv) { inversesLiens.current.delete(id); annuler(inv); }\n      appliquer(r);\n      setLectureFermee(id);\n      if (carnetId && carnetId !== idOuvert) setVue({ sorte: 'carnet', id: carnetId });\n    },\n    bons: id => bonsLectures[id] ?? [],\n    marquerBon: (id, cle) => setBonsLectures(b => { const n = avecBon(b, id, cle); if (n !== b) garderBons(typeof localStorage === 'undefined' ? undefined : localStorage, n); return n; }),"],
]);
