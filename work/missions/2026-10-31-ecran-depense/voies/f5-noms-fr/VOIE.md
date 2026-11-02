# Voie f5-noms-fr — la désignation lue en français, mesurée au banc avant tout changement de production (D271, D275)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Pilote : Opus. Suis `.claude/skills/banc-lecture/SKILL.md` (le banc, ses budgets, ses
règles). Aucun commit, aucun déploiement. **Aucune passe payante lancée par toi** : tu prépares, tu simules, tu estimes ; le pilote lance
la passe payante et la journalise. Rien ne change dans `functions/` ni `src/` (le skill : la bascule attend son accord).

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- D271 : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien » ;
  « Italien possible aussi mais beaucoup plus rare ».
- D275 (01.11, nuit, sur sa commande en allemand) : « Il y a plein de problème sur cette vue, déjà pas de traduction. »
- D261a : la désignation imprimée sans doublon ; la lecture du 01.11 a gardé la désignation telle quelle.

## Le geste
Ajouter à chaque article lu un champ facultatif `nameFr` : la désignation en français, la marque et le nom propre gardés tels quels
(« CARABELGE® », « Styrian Goldings », « Wyeast 3787 Belgian High Gravity » ne se traduisent pas ; « Gärtank 30 Liter rund mit Deckel »
→ « Fermenteur 30 L rond avec couvercle » ; « Premium Pilsner Malz » → « Malt Pilsner Premium » ; « Hopfensack fein » → « Sac à houblon
fin ») ; sans options ni unité (l'état et les options sont lus par le code, voie f1). `name` reste la désignation imprimée, inchangée
(rapprochement du stock, preuve). Le champ s'ajoute au schéma de sortie et à la consigne **d'une variante du banc**, pas de la production.

## À faire
1. Lire le banc : `scripts/banc-lecture-facture.ts` (variantes, `--simuler`, `--estimer`, `--reprendre`), `scripts/banc-lecture-facture-juger.ts`,
   `work/missions/2026-11-01-banc-lecture/GESTES.md`, la consigne et le schéma de production (`functions/src/invoiceScanPrompts.ts` et
   voisins, lecture seule) et la variante de production `Csv8+N`.
2. Écrire la variante `Csv8+N+F` (même chaîne que la production, le seul ajout `nameFr`) dans le banc, et un juge du nouveau champ :
   pour chaque article des 14 pièces, `nameFr` est en français, garde la marque, ne contient ni option ni unité ; et la variante ne perd
   rien ailleurs (champs, lignes, faux verts, temps, coût), jugée comme les autres variantes.
3. `--simuler` (aucun réseau) → `BANC SIMULE OK` ; `--estimer` sur les 14 pièces → `BANC ESTIME <x> CHF` ; écrire dans RESULTAT.md la
   commande exacte de la passe payante (avec `--reprendre` si utile, `--budget-chf`), sans la lancer.
4. Mettre une ligne au registre `GESTES.md` (« Désignation en français », variante, état « au banc »).

## Critères (rejoués par le pilote)
- `npx tsx scripts/banc-lecture-facture.ts --simuler …` : `BANC SIMULE OK` ; `--estimer` : `BANC ESTIME` ≤ 3 CHF.
- Tests du banc existants verts (`npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts --maxWorkers=2`).
- `git status --short` : rien hors de « Possède ».

## Possède
`scripts/banc-lecture-facture.ts`, `scripts/banc-lecture-facture-juger.ts` (ajouts de la variante et du juge seulement),
`tests/unit/banc-lecture-noms-fr.test.ts` (neuf), `work/missions/2026-11-01-banc-lecture/GESTES.md` (une ligne),
`work/missions/2026-10-31-ecran-depense/voies/f5-noms-fr/**`.

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`). Ses données personnelles et les valeurs de ses pièces n'y vont pas ; aucun nom d'achat
privé (doc2, doc4, doc13). Réponse au pilote : une ligne.
