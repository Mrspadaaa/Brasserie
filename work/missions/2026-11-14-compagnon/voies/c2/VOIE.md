# Voie c2 — verdict de la passe 2 (p2a, p2b, p2c)

- Mission : 2026-11-14-compagnon
- Agent : critique
- Modèle : opus (Fable interdit jusqu'à nouvel ordre)
- Niveau : conception
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : p2a, p2b, p2c
- Décideur en cas de doute : pilote

## Objectif
Un verdict par candidate de passe 2 (ACCEPT ou REJET), avec ses défauts numérotés, dans `critique/VERDICT-P2.md`, avant de les montrer au brasseur.

## Entrées
- `work/missions/2026-11-14-compagnon/voies/p2a/VOIE.md` — le contrat commun (cadres, données de la passe 2, exigences) ; les trois voies ont le même.
- `work/refonte-frontend/v4/outils/pages/2026-11-14-compagnon/img/` — un fichier par cadre : `p2a-<cadre>.png`, `p2a-<cadre>-cave.png` (de même p2b, p2c). Cadres : accueil, attente, reponse, erreur, finances, conversations, plafond, urgent, fournisseurs, limites, zero, bureau. Ouvrir chaque clair en plein format ; les cave de reponse, urgent, erreur et bureau.
- `work/missions/2026-11-14-compagnon/critique/SYNTHESE.md` — tes défauts de la v0 (sections p2 : « ### s3b », « ### s2a », « ### s2d » et « Défauts communs ») : vérifier qu'ils sont corrigés.
- `work/missions/2026-11-14-compagnon/voies/p2c/RESULTAT.md` — décisions de données de p2c (J+1, Brassin 30), acceptées par le pilote.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-compagnon/critique/VERDICT-P2.md`, `work/missions/2026-11-14-compagnon/critique/RESULTAT-C2.md`

## Consignes
Charger `boosters-ux` et `impeccable`. Pour chaque candidate, question ouverte : « combien et quels problèmes ? » (liste numérotée, D344), cadre par cadre. Puis ACCEPT (montrable au brasseur, défauts mineurs listés) ou REJET (défaut qui fausse la lecture : nombre faux, nom de modèle, état manquant, texte coupé, contraste illisible, cadre vide). Vérifier les nombres contre les données de la passe 2 (Mosaic 43 → 35 g, 3 → 2 j, 19 → 17 °C, 9,0 → 8,6 g/L, 9,50 et 11,20 CHF, 2,10 sur 15 CHF, 4 sur 120). Aucun sous-agent.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun nom de modèle ni de fournisseur d'IA ; virgule décimale ; deux thèmes ; peu de texte ; verdict et geste d'abord.
- Rien appliqué sans cases cochées puis validation ; hors ligne : question gardée ; trois modes ; remise à zéro confirmée ; « Mes conversations ».
- Ton avis est indicatif (L27).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `critique/VERDICT-P2.md` : une ligne `p2a : ACCEPT` ou `p2a : REJET` (idem p2b, p2c), puis les défauts numérotés par candidate, et pour un REJET la correction précise.
- `critique/RESULTAT-C2.md` tenu au fil (mis à jour après chaque candidate : une limite de tours ne perd rien) : images ouvertes. Il tient lieu de RESULTAT.md de la voie.
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-compagnon/outils/controle-verdict.mjs > work/missions/2026-11-14-compagnon/critique/tests-c2.txt`.
Réponse finale au pilote : une ligne (trois verdicts).
