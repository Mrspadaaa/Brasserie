# Voie c2 — toute mesure a son curseur ; le champ ne se coupe ni ne disparaît (VB-3) (mission 2026-11-10-brassin-mesures)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L03, L11, L12, L13, L17, L29), `.claude/rules/affinee-frontend.md`, `DESIGN.md`,
  `cerveau/produit/saisie-mobile.md` ; SPEC (fin, 10.11 : « utilise des slider plutot que de chiffre des input… », « C'est toujours assez
  mauvaise… ») et VB-3 de DEFAUTS-RECURRENTS ; ses captures `../../captures/brasseur-ebullition-temp-*.jpg` (ouvre-les) ; `../p1/RESULTAT.md`
  (comment le curseur a été porté : `MeasureScaleView`, `BrewDayMeasurements.tsx`, `BrewCapturePanel.tsx`).
- Base : tag `en-ligne/2026-11-10-fiches` (en ligne). `git worktree add <os.tmpdir()>/c2-wt -b c2/curseur en-ligne/2026-11-10-fiches`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Un test qui échoue sur le tag avant (L13), à la cause :
1. Toute mesure de la feuille (pH, Temp., Densité, Volume), à toute étape (Préparer, Empâter, Ébullition, Refroidir, ensemencement), a son
   curseur au téléphone. Sans cible de recette, l'échelle vient de bornes plausibles de la grandeur au moment (ébullition : ~90–102 °C ;
   refroidi : 10–30 °C ; pH 4,8–6,0 ; densité 1,000–1,120 ; volume autour du volume prévu) ; pas de bande cible inventée (bande seulement
   si une cible existe), pouce en pointillé tant qu'aucune valeur, toucher le pouce pose le milieu ou le dernier relevé, jamais d'envoi sans geste.
2. Le champ tapé (crayon) ne se coupe jamais au bord ni ne disparaît clavier fermé ; Enregistrer suit la valeur posée.
Rien d'autre ne change (m2 et z1 tels quels).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-brassin-mesures/voies/c2/tests.txt`
  (11 rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale ; zéro nouveau ; si trop
  long, lance en arrière-plan et attends) ; `VITE_HOP_V4=on npx vite build` vert.
- Captures Chrome réel (banc local) 390 tactile clair et cave : Mesurer › Temp. à l'ébullition (sans cible), › Densité au refroidi, › Volume,
  clavier ouvert et fermé ; toutes ouvertes, dans `voies/c2/captures/`.

## Possède
Worktree `c2-wt`, branche `c2/curseur` ; `work/missions/2026-11-10-brassin-mesures/voies/c2/**`. Aucun déploiement, aucune donnée réelle,
aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha de `c2/curseur`.
