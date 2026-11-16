# Voie n1 — enrichissement des fiches : α vide, malt muet, atténuation vide (mission 2026-11-10-parcours-complet)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Accord (10.11) : « Oui et oui et tous sauf 4 ».
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L14, L17, L20, L29) ; `work/missions/2026-11-10-enrichissement-en-ligne/VERDICT.md`
  (attendu / lu par article) ; `work/missions/BUGS.md` EN-1 à EN-3 ; `work/missions/2026-11-08-enrichissement/` (mission d'origine).
- Code : `src/services/enrichissement.ts`, `enrichissementTravail.ts`, `enrichissementStore.ts`, `enrichissementCatalogues.ts`,
  `src/services/aiClient.ts` ; côté serveur seulement lu : `functions/src/ai.ts`, `prompts.ts` (`lookupIngredient`).
- Base : tag `en-ligne/2026-11-10-mesures`. `git worktree add <os.tmpdir()>/n1-wt -b n1/enrichissement en-ligne/2026-11-10-mesures`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Un test qui échoue sur le tag avant chaque correction (L13), sur fixtures (Gemini toujours simulé), à la cause :
1. **EN-1, bloquant** : un houblon neuf lié au catalogue (« Nelson Sauvin ZZ » → « Nelson Sauvin NZ », travail fini) garde α (%) vide :
   l'α du catalogue (plage ou valeur) doit remplir le champ vide de la fiche, sans écraser une valeur saisie, avec sa source.
2. **EN-2** : un malt non reconnu (`nonIdentifiable`) : la fiche le dit (un mot, pas un paragraphe) et rien n'est inventé ; vérifier aussi
   pourquoi « Maris Otter ZZ » n'est pas reconnu quand « Nelson Sauvin ZZ » l'est (même normalisation des noms pour toutes les familles).
3. **EN-3** : levure complétée par l'IA mais atténuation vide : si la réponse (simulée) ou le catalogue la donne, elle est reprise ;
   sinon la fiche le dit. Inconnu ≠ 0, aucun chiffre inventé.
Aucun changement de `functions/` sans nécessité ; s'il en faut un, écris-le dans RESULTAT.md (le pilote déploie).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-parcours-complet/voies/n1/tests.txt`
  (les 11 rouges déjà sur le tag listés en c1 ; zéro nouveau) ; `VITE_HOP_V4=on npx vite build` vert.
- Pas d'interface neuve ; si la fiche change d'apparence (EN-2), capture Chrome 390 avant/après, ouverte.

## Possède
Le worktree `n1-wt`, branche `n1/enrichissement` ; `src/services/enrichissement*`, leurs tests ; `work/missions/2026-11-10-parcours-complet/voies/n1/**`.
Pas de `src/pages/BrewDayPage.tsx` ni `Combobox` (voie c1). Aucun déploiement, aucune donnée réelle, aucun appel Gemini réel. Ni `functions/.env`.

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha de `n1/enrichissement`.
