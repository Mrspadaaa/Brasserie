export const meta = {
  name: 'maquettes',
  description:
    'Méthode maquettes (16.11) : N mini maquettes statiques partant de SA base choisie (maquettes.json), contrôlées contre ses choix et les règles dures, jugées par le critique calibré, corrigées une fois, puis une page de choix écrite à la main. Les versions KO ne sont jamais candidates.',
  whenToUse:
    'Toute exploration de maquettes à montrer au brasseur. Args {chantier, demande, versions (nombre, 12 à 16 conseillé), dossier?, sources?}. Avec sources (les versions qu’il a aimées, 17.11 : « prendre les meilleures écran et meilleures idées … répartir de 0 pour chaque vue est pas une bonne idée »), mode greffe : un inventaire des meilleurs écrans et idées, puis N versions qui combinent chacune une recette de greffe sur TOUT le parcours (6 conseillé). chantier : une clé de work/refonte-frontend/v4/choix/maquettes.json (calendrier, carnet, calendriers-section, liens, choix-ouverts, simplicite, ou choix-ouverts:<portee>). Pas de jouable, de scénario ni d’audit ici (L30) : ils viennent après son choix, sur la version choisie, dans une autre étape.',
  phases: [
    { title: 'Base', detail: 'la base, les gardés, les refusés et les idées lus dans maquettes.json' },
    { title: 'Inventaire', detail: 'mode greffe : écrans et idées de ses versions retenues, puis N recettes de greffe' },
    { title: 'Versions', detail: 'N mini maquettes statiques, une par concepteur Opus, sans limite de temps' },
    { title: 'Contrôle', detail: 'controle-base --dures --statique sur chaque version' },
    { title: 'Critique', detail: 'le critique calibré (PORTRAIT.md) sur toutes les versions' },
    { title: 'Correction', detail: 'une passe de correction par version, puis le contrôle rejoué' },
    { title: 'Page', detail: 'la page de choix écrite à la main, candidates OK seulement' },
  ],
}

const A = typeof args === 'string' ? (() => { try { return JSON.parse(args) } catch { return {} } })() : (args || {})
if (!A.chantier || !A.demande) throw new Error('maquettes : args {chantier, demande, versions} requis')
const N = Math.max(1, Math.min(16, Number(A.versions) || 12))
const chantier = String(A.chantier)
const dossier = A.dossier || `work/missions/maquettes-${chantier.replace(/[^a-z0-9-]/gi, '-')}`
const REGISTRE = 'work/refonte-frontend/v4/choix/maquettes.json'
const PORTRAIT = 'work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md'
const CONTROLE = (f) => `node scripts/agents/controle-base.mjs ${chantier} ${f} --dures --statique`
const DURES = `Règles dures, non négociables :
- le + est un bouton volant, à droite, juste au-dessus de la barre d'onglets (4 à 24 px), jamais au milieu du contenu (FAB-GAUCHE, « c'est genre la 200eme fois ») ;
- le thème de l'app tel qu'il s'affiche (DESIGN.md) : ses fonds, ses accents EBC et couleurs de zone ; pas de crème neutre sans couleur (THEME-APP) ;
- aucun texte sous 14 px ; la barre d'onglets Bord, Finances, Calendrier, Brassins, Stocks, Clients ;
- statique : HTML et CSS seuls, aucun <script>, aucun on…= (L30 : pas de jouable avant son choix).`

phase('Base')
const base = await agent(
  `Lis ${REGISTRE} et rends, pour le chantier « ${chantier} » (une clé « a:b » filtre les entrées par portee = b), sans rien inventer :
le chemin de la base (base.proto), sa parole et sa note ; la liste des gardés, des refusés, des idées et des « à préciser » (id, element, parole mot pour mot).
Si le chantier n'existe pas, rends erreur ; sinon laisse erreur vide (une remarque n'est pas une erreur).`,
  {
    agentType: 'executant', label: 'base', phase: 'Base',
    schema: { type: 'object', properties: { erreur: { type: 'string' }, proto: { type: 'string' }, parole: { type: 'string' }, note: { type: 'string' }, gardes: { type: 'array', items: { type: 'string' } }, refuses: { type: 'array', items: { type: 'string' } }, idees: { type: 'array', items: { type: 'string' } }, aPreciser: { type: 'array', items: { type: 'string' } } }, required: ['proto', 'gardes', 'refuses'] },
  },
)
if (!base || !base.proto) throw new Error(`maquettes : base introuvable pour ${chantier} (${base && base.erreur})`)
log(`base ${base.proto} ; ${base.gardes.length} gardés, ${base.refuses.length} refusés`)

const CADRE = `Chantier : ${chantier}. Sa demande, mot pour mot : « ${A.demande} ».
BASE (règle n° 1) : ${base.proto} — sa parole : « ${base.parole || ''} ». ${base.note || ''}
Tu pars de CETTE base, jamais de la dernière itération ni d'une autre version du dossier. Plancher à enrichir (L07), pas à remplacer.
Gardés (doivent rester visibles) :\n- ${base.gardes.join('\n- ')}
Refusés (jamais) :\n- ${base.refuses.join('\n- ') || 'aucun'}
Idées possibles, une seule à la fois et seulement si la demande la vise :\n- ${(base.idees || []).join('\n- ') || 'aucune'}
${DURES}
Pense en brasseur (L04), compact (docs/ui-compacte.md). Données d'exemple marquées « exemple ».`

const SOURCES = Array.isArray(A.sources) ? A.sources.filter(Boolean) : []
let recettes = null
if (SOURCES.length) {
  phase('Inventaire')
  const inv = await agent(
    `${CADRE}
MODE GREFFE. Il a retenu ces versions, ce sont aussi ses choix (règle n° 1) : ${SOURCES.join(' ; ')}.
Ouvre chacune (captures 390 que tu prends et OUVRES, thème clair) et la base. Écris ${dossier}/INVENTAIRE.md : pour chaque écran du parcours (repos, ouvert, ajout, étapes…), la meilleure réalisation parmi les sources et la base, et pourquoi ; puis les meilleures idées isolées (une ligne chacune, sa source).
Puis rends ${N} recettes de greffe différentes : chacune choisit, écran par écran, la source à prendre, et ajoute au plus deux idées d'autres sources. Chaque recette couvre TOUT le parcours ; aucune ne repart de zéro sur un écran.`,
    { agentType: 'concepteur', model: 'opus', label: 'inventaire', phase: 'Inventaire', schema: { type: 'object', properties: { recettes: { type: 'array', items: { type: 'object', properties: { nom: { type: 'string' }, recette: { type: 'string' } }, required: ['nom', 'recette'] } } }, required: ['recettes'] } },
  )
  recettes = (inv && inv.recettes) || []
  log(`inventaire : ${recettes.length} recettes`)
}
phase('Versions')
const fichiers = Array.from({ length: N }, (_, i) => `${dossier}/v${String(i + 1).padStart(2, '0')}.html`)
await parallel(fichiers.map((f, i) => () => agent(
  `${CADRE}

Tu es le concepteur de la version ${i + 1} sur ${N}. Écris UNE mini maquette statique, 390 × 844, dans ${f} (rien d'autre).
${recettes && recettes[i] ? `MODE GREFFE, recette « ${recettes[i].nom} » : ${recettes[i].recette}
Assemble les écrans désignés depuis leurs sources (${SOURCES.join(' ; ')}, et ${dossier}/INVENTAIRE.md), sans les redessiner ; montre TOUT le parcours, écrans côte à côte (chacun 390 de large) dans le même fichier.` : `Prends un parti différent des autres versions : axe n° ${i + 1} — fais varier une seule décision de forme qui répond à la demande, en gardant tout le reste de la base.`}
Prends le temps qu'il faut : aucune limite de temps. Lis la base en entier avant d'écrire. Puis lance « ${CONTROLE(f)} » et corrige jusqu'à BASE OK, DURES OK, STATIQUE OK (trois essais).
Rends une ligne : le parti pris, et la dernière ligne de chaque verdict.`,
  { agentType: 'concepteur', model: 'opus', label: `v${i + 1}`, phase: 'Versions' },
)))

const controler = (f, tour) => agent(
  `Lance depuis la racine du dépôt, tel quel : ${CONTROLE(f)}
Rends ok = vrai seulement si la sortie contient BASE OK, DURES OK et STATIQUE OK ; sortie = les lignes KO et ECHEC, mot pour mot.`,
  { agentType: 'executant', label: `controle:${tour}:${f.split('/').pop()}`, phase: 'Contrôle', schema: { type: 'object', properties: { ok: { type: 'boolean' }, sortie: { type: 'string' } }, required: ['ok', 'sortie'] } },
)

phase('Contrôle')
const c1 = await parallel(fichiers.map((f) => () => controler(f, 1)))

phase('Critique')
const critiques = await parallel(fichiers.map((f, i) => () => agent(
  `${CADRE}

Tu es le critique calibré sur le brasseur : lis d'abord ${PORTRAIT}. Juge la version ${f} contre sa base ${base.proto} (captures 390 que tu prends et OUVRES, thème clair de l'app seul : pas de capture cave pour une mini maquette, sa demande du 16.11).
Contrôle mécanique : ${c1[i] && c1[i].ok ? 'OK' : `KO — ${(c1[i] && c1[i].sortie) || 'sans sortie'}`}.
Question ouverte : combien et quels problèmes ? Liste numérotée, du plus grave au moins grave, chaque point vu sur la capture. Puis une note sur 10 à sa façon.`,
  { agentType: 'critique', model: 'opus', label: `critique:v${i + 1}`, phase: 'Critique', schema: { type: 'object', properties: { problemes: { type: 'array', items: { type: 'string' } }, note: { type: 'number' } }, required: ['problemes'] } },
)))

phase('Correction')
await parallel(fichiers.map((f, i) => () => agent(
  `${CADRE}

Passe de correction de ${f}, une seule. Corrige chaque problème du critique et du contrôle, sans changer le parti pris de la version ni toucher aux autres fichiers.
Problèmes du critique :\n${((critiques[i] && critiques[i].problemes) || []).map((p, k) => `${k + 1}. ${p}`).join('\n') || '(aucun rendu)'}
Contrôle : ${c1[i] && c1[i].ok ? 'OK' : (c1[i] && c1[i].sortie) || 'KO'}
Puis relance « ${CONTROLE(f)} ». Rends une ligne : ce que tu as corrigé, et les verdicts.`,
  { agentType: 'concepteur', model: 'opus', label: `correction:v${i + 1}`, phase: 'Correction' },
)))
const c2 = await parallel(fichiers.map((f) => () => controler(f, 2)))
const candidates = fichiers.filter((_, i) => c2[i] && c2[i].ok)
const ecartees = fichiers.filter((_, i) => !(c2[i] && c2[i].ok))
log(`${candidates.length} candidate(s) OK, ${ecartees.length} écartée(s) au contrôle`)

phase('Page')
let page = null
if (candidates.length) {
  page = await agent(
    `${CADRE}

Écris À LA MAIN (pas de script générateur) la page de choix ${dossier}/page/index.html : une page par choix (L24, D126), la base ${base.proto} en référence à côté,
puis les ${candidates.length} versions candidates. DISPOSITION PAR ÉCRAN (17.11 : « la disposition des artefacts est difficile à comparer et prendre des notes des meilleurs vue ») : une rangée par écran du parcours (liste, ouvert, ajouter, ajouter à, carte, fiche ouverte, comparer, choisi, À venir… selon le chantier), et dans chaque rangée la base puis chaque version, vignettes de même hauteur, défilement horizontal, nom de version sur chaque vignette ; une version sans cet écran : case « — ». Sous chaque vignette, cinq boutons 1 à 5 pour classer la rangée, plusieurs vignettes pouvant avoir le même rang (17.11 : « que je puisse facilement faire un classement top3 par vue », puis « je puisse choisir plusieurs top1,2,3, 4... »), le podium à côté du titre et une note courte ; en bas, un bouton Copier qui rend « écran : 1 v.., v.. · 2 v.. · … (notes) » ligne par ligne ; modèle : work/missions/2026-11-17-carnet-retouches/maquettes/page2/ (localStorage pour garder les notes, dans un try). En tête, une ligne par version : son parti pris et sa note du critique.
Candidates (seules ces versions, contrôle OK) :\n- ${candidates.join('\n- ')}
JAMAIS ces versions écartées au contrôle :\n- ${ecartees.join('\n- ') || 'aucune'}
Contrôle la page avec node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs et node scripts/agents/verifier-page.mjs ${dossier}/page/index.html --page-lot --captures ${dossier}/page/cap, ouvre les captures. Ne publie rien.`,
    { agentType: 'concepteur', model: 'opus', label: 'page', phase: 'Page' },
  )
}

return {
  chantier, base: base.proto, dossier, candidates, ecartees,
  notes: fichiers.map((f, i) => ({ version: f, controle: c2[i] && c2[i].ok ? 'OK' : 'KO', note: critiques[i] && critiques[i].note })),
  page: page ? `${dossier}/page/index.html` : null,
  suite: 'Le pilote publie la page et attend son choix. Jouable, scénario et audit : sur la version choisie seulement, dans une autre étape (L30).',
}
