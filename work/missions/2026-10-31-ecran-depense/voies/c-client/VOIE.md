# Voie c-client — lenteur D : lire le flux côté client (D308, D310)

Agent : `auteur` (Sonnet). Plafond : 60 tours. Ligne `c-client` de MISSION.md. Aucun déploiement, aucun commit, **aucun appel réel à Gemini**
(le faux `httpsCallable` du plan, jamais un vrai appel). En parallèle de la voie s-serveur et du port r4-port-d : ne touche aucun de leurs fichiers.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d »

## Le contrat
`work/missions/2026-10-31-ecran-depense/voies/l1-plan/PLAN.md`, relu deux fois (RELECTURE OK) : lis §§ 1 à 3, 4 (cas limites), 4 quater et
**§ 5, bloc « C, client »** (le contrat entre voies, tes fichiers, tes témoins rouges), puis § 7 et la CONNAISSANCE de fin de plan
(`stream()` sans délai : le client fixe le sien et traite un flux fermé sans résultat comme une erreur). Ne décide rien que le plan fixe ;
s'il te manque une chose qui change le résultat, arrête-toi et dis-la.

## Possède
`src/services/aiClient.ts`, `src/services/geminiScanner.ts`, `tests/unit/depense/lecture-d/flux.test.ts`,
`work/missions/2026-10-31-ecran-depense/voies/c-client/**`. Interdits : `functions/**`, `src/ui/**`, tout autre fichier.

## Critères (le pilote les rejoue)
1. Les témoins 1, 1b, 1c et 2 à 7 de § 5 C, écrits d'abord dans `flux.test.ts`, rouges sur l'arbre d'avant (sortie gardée), verts après.
2. `geminiScanner.test.ts` et les tests qui importent `aiClient` restent verts sans changer une attente (`grep -rl "aiClient\|geminiScanner" tests src`).
3. Dans la copie isolée : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense/lecture-d/flux.test.ts tests/unit/geminiScanner.test.ts --maxWorkers=2"`
   (plus les fichiers trouvés au critère 2), puis `… copie.mjs "npx tsc --noEmit -p tsconfig.json"`. La copie est partagée avec d'autres
   voies : un échec qui touche un fichier qui n'est pas à toi se rejoue une fois avant d'être dit.
4. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/c-client/RESULTAT.md` (fichiers, témoins avant / après, sorties, écarts au plan, doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`),
puis une ligne `C-CLIENT OK — …` ou `C-CLIENT ECHEC — …`.
