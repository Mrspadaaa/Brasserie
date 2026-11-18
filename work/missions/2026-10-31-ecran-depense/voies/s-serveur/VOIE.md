# Voie s-serveur — lenteur D : le provisoire en flux côté serveur (D308, D310)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Ligne `s-serveur` de MISSION.md. Aucun déploiement, aucun commit, **aucun appel réel à Gemini**
(toujours simulé, lectures fictives de la forme des tests existants, aucune valeur de ses pièces). En parallèle de la voie c-client et du
port r4-port-d : ne touche aucun de leurs fichiers.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d »

## Le contrat
`work/missions/2026-10-31-ecran-depense/voies/l1-plan/PLAN.md`, relu deux fois (RELECTURE OK) : lis §§ 1 à 3, 4 (cas limites), 4 quater et
**§ 5, bloc « S, serveur »** (le contrat entre voies, tes fichiers, tes dix témoins rouges, les tests qui restent verts), puis § 7. Ne décide
rien que le plan fixe ; s'il te manque une chose qui change le résultat, arrête-toi et dis-la.

## Possède
`functions/src/invoiceScanVote.ts`, `functions/src/invoiceVisionReview.ts` (un export seul), `functions/src/ai.ts`,
`tests/unit/depense/lecture-d/serveur.test.ts`, `work/missions/2026-10-31-ecran-depense/voies/s-serveur/**`.
Interdits : `src/**`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`, `functions/.env`, `functions/.secret.local` (ne les lis pas),
tout autre fichier.

## Critères (le pilote les rejoue)
1. Les dix témoins de § 5 S, écrits d'abord dans `serveur.test.ts`, rouges sur l'arbre d'avant (sortie gardée), verts après.
2. Restent verts sans changer une attente : `invoiceScanCsv8`, `invoiceScanVote`, `invoiceScanTransport`, `invoiceScanBudget`,
   `invoiceScanCache-d273c` (l'empreinte change : le test le dit, ne fige pas une valeur).
3. Tests et tsc de l'app dans la copie isolée : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense/lecture-d/serveur.test.ts tests/unit/invoiceScan --maxWorkers=2"`
   puis `… copie.mjs "npx tsc --noEmit -p tsconfig.json"`. La copie est partagée avec d'autres voies : un échec qui touche un fichier
   qui n'est pas à toi se rejoue une fois avant d'être dit. tsc des fonctions : celui que `functions/package.json` prévoit ; s'il ne tourne
   pas dans la copie, dis-le et le pilote le rejoue.
4. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/s-serveur/RESULTAT.md` (fichiers, témoins avant / après, sorties, écarts au plan, doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`),
puis une ligne `S-SERVEUR OK — …` ou `S-SERVEUR ECHEC — …`.
