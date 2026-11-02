# Voie e-ecran — lenteur D : l'écran dès les deux lectures rapides, la fusion « sa saisie l'emporte », ses choix 1 B et 2 D (D308, D310, D313 à D315)

Agent : `auteur` (Sonnet). Plafond : 120 tours. Ligne `e-ecran` de MISSION.md. Aucun déploiement, aucun commit, **aucun appel réel à Gemini**
(lectures fictives, rejouées dans `apercuDev` et les tests). Part après r4-port-d (mêmes fichiers, versé) ; s-serveur et c-client sont versés
(dc98458d) : leur contrat est le tien. Critique Fable de tes captures après la voie.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d » ; « 2 d, en un clic je peux Tout validé les changements. Mais aussi un à 1 » ; « B » (la ligne ajoutée) ;
« ?? J'ai déjà donné mon avis » (les cas rares prennent leur défaut A, D315).

## Ses maquettes (règle n° 1 : la base, reprise telle quelle ; inventaire de chacune avant le code, L03)
- Le provisoire et l'attente : `choix-lenteur/maquettes/d-06.html`, `d-15.html` (fil de 22 px, « Lectures ●●◌ », Confirmer gris avec sa roue).
- L'arrivée : `choix-lenteur/maquettes/d-lue.html` (le fil part, Confirmer noir, puce « ↻ N corrigées » au geste de filtre des autres puces,
  valeur corrigée sur fond bleu, l'ancienne barrée sous le nom).
- La ligne ajoutée : `choix-lignes-38/maquettes/q1-b.html` (son choix 1 B, D314).
- La ligne pas retrouvée : `choix-lignes-38/maquettes/q2-d-arrivee.html`, `q2-d-garder.html`, `q2-d-retirer.html` (son choix 2 D, D313), avec
  « Tout valider » : la logique ici (toutes les lignes pas retrouvées partent d'un toucher ; chacune garde Garder / Retirer). La forme à plusieurs
  lignes attend son choix sur `choix-valider/` : code la forme à une ligne, et pour plusieurs le bandeau qui défile « 1/2 » avec « Tout valider »
  à côté (forme provisoire du pilote, isolée dans un composant, pour être remplacée sans toucher la logique).
- Le total corrigé : `choix-cas-38/maquettes/q1-a.html` (défaut A, D315). La 3.8 qui n'arrive jamais : `choix-cas-38/maquettes/q2-a.html` (défaut A,
  la forme d'aujourd'hui), par `ajouterCoupure(provisoire, 'delai-saute', phraseCoupure('delai-saute'))` (plan § 7, R1).

## Le contrat
`voies/l1-plan/PLAN.md` (relu deux fois, OK) : §§ 4, 4 bis (fusion : base B1, cellules B2, table B3, lignes, ce qu'elle ne fait jamais,
puce m2, traduction M6), 4 ter (états de l'écran M1), 4 quater, **§ 5 bloc « E, écran »** (tes fichiers, tes 14 témoins rouges) et § 7 (R1 à R5).
Ne décide rien que le plan ou ses choix fixent ; s'il te manque une chose qui change le résultat, arrête-toi et dis-la.

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/finale.ts` (neuf), `Recap.tsx`, `Ligne.tsx`, `Liste.tsx`, `Pages.tsx`, `Pied.tsx`, `p3c.css`,
`Verdict.tsx`, `etat.ts`, `types.ts`, `apercuDev.ts` (tous dans `src/ui/depense/`), `tests/unit/depense/lecture-d/finale.test.ts`,
`tests/unit/depense/lecture-d/ecran.test.tsx`, `work/missions/2026-10-31-ecran-depense/voies/e-ecran/**`.
Interdits : `confiance.ts` (M5), `functions/**`, `src/services/**`, `groupes.ts` et `Entete.tsx` (sauf un export si tsc l'exige, et le dire), tout autre fichier.

## Critères (le pilote les rejoue)
1. Les 14 témoins de § 5 E, plus : une ligne ajoutée en 1 B (fond bleu, « ↻ », comptée) ; une ligne pas retrouvée en 2 D (barrée, hors des sommes,
   bandeau, Confirmer sans trancher : elle part) ; « Tout valider » à deux lignes ; Garder puis Retirer un à un ; un total corrigé en A ;
   la 3.8 qui n'arrive jamais en A (point `lecture-coupee`). Écrits d'abord, rouges sur l'arbre d'avant (sortie gardée), verts après.
2. Les suites existantes restent vertes sans changer une attente : `tests/unit/depense/**`, `tests/unit/purchasePrefill.test.ts`,
   `tests/unit/geminiScanner.test.ts`, `tests/unit/depense/lecture-d/**` (sinon : arrête-toi et dis pourquoi).
3. Dans la copie isolée (`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"`) : vitest des fichiers ci-dessus
   (`--maxWorkers=2`), `npx tsc --noEmit -p tsconfig.json`, `npm run build` : 0 erreur.
4. Captures (modèle : `voies/r4-port-d/capturer-d.mjs`) des états d'aperçu `lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`,
   `lenteur-touchee`, `lenteur-sans-38`, plus `lenteur-ajoutee`, `lenteur-perdue`, `lenteur-perdues-2`, `lenteur-total` : 390 tactile et 1280,
   clair, sombre pour `lenteur-lue` ; chacune **côte à côte avec la vue de sa maquette** ; mesures : hauteur du fil, place de la puce, aucune
   erreur de console, aucune requête hors localhost. Sortie `ECRAN-D OK` ou `ECRAN-D ECHEC n`. Ouvre chaque capture (L12), décris-la dans RESULTAT.
5. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/e-ecran/RESULTAT.md` (inventaire de ses maquettes, fichiers, témoins avant / après, sorties, captures décrites, écarts à ses maquettes
(aucun sans le dire), doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`), puis une ligne `E-ECRAN OK — …` ou `E-ECRAN ECHEC — …`.
