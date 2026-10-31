# Compris : voie l1-lecture

## Objectif
Faire contrôler par le code ce que Gemini lit sur une facture : quantité × prix, somme des lignes au centime, TVA par taux, HT + TVA = TTC.
Chaque contrôle qui échoue rend un point typé (quoi, où, attendu, lu, écart en centimes), en plus des phrases actuelles. Le schéma lit ce qui manque pour ces contrôles, et sur la facture 372765 le bloc TVA incohérent (110,40 ≠ 86,50) devient un point sans correction silencieuse.

## Écrit dans
`functions/src/invoiceScanCore.ts`
`functions/src/prompts.ts`
`tests/unit/invoiceScanCore.test.ts`
`tests/unit/depense/lecture/`
`work/missions/2026-10-31-ecran-depense/voies/l1-lecture/`

## Fini quand
- G1 : le code des fonctions compile (`npx tsc -p functions/tsconfig.json --noEmit` affiche « FONCTIONS TYPEES OK »).
- G2 : les tests de la lecture passent (`tests/unit/invoiceScanCore.test.ts`, `tests/unit/depense/lecture`, `invoiceVisionReview.test.ts`, `purchasePrefill.test.ts`) et affichent « TESTS LECTURE OK ».
- G3 : le plan (`PLAN.md`) a été relu par deux regards neufs, et le fichier `REVUE-PLAN.md` passe `systeme.mjs revue` sans bloquant laissé.
- G4 : `RESULTAT.md` contient « TEMOIN AVANT », « contrat », « Rien ne se perd » et « 372765 ».
- Défauts : C1 (quantité × prix = montant de ligne, au centime, remise et ligne sans prix compris) ; C2 (somme des lignes = total au centime, sans tolérance de 5 centimes, cas b du diagnostic compris) ; C3 et A10 (taux ou code N/R par ligne, bases par taux lues, TVA contrôlée par taux) ; C4 (rien à changer, un HT calculé n'est jamais montré comme lu) ; A6 (pro-forma payée = type à part) ; A9 (α du houblon = champ de ligne) ; P1 (PDF 1.5 d'une page avec `/ObjStm` accepté si ses pages se comptent, refus seulement au-delà de 4 pages ou si non comptable) ; P2 (lignes perdues au-delà de la limite dites en nombre, total jamais déclaré vérifié) ; A3 (le prompt n'avertit que d'un doute réel).
- Chaque défaut a son test qui échoue sur le code actuel, lancé avant la correction, avec sa sortie sous « TEMOIN AVANT ».
- Le contrat du point typé est écrit dans `PLAN.md`. `issues` reste rempli comme aujourd'hui.
- Si le format du résultat change, la version du registre (`invoice-v4`) change aussi, et le plan le dit.

## Ne fait pas
- Pas de rapprochement des lectures, pas de troisième lecture, pas de journaux par lecture, pas de statut « à confirmer » (voie suivante, `invoiceVisionReview.ts`, `ai.ts`).
- Pas d'écran (pas de changement d'interface ici). Les données que l'écran aura besoin sont rendues, mais l'écran n'est pas refait.
- Pas de réduction d'image, pas d'autre modèle, pas de réflexion plus faible (refusés par d2).
- Pas d'appel réel à Gemini, pas de Drive réel, pas de déploiement, pas de données réelles. Lectures simulées seulement.
- Pas de modification de `VOIE.md` ni de `GATES.md`. Pas d'écriture hors des chemins « Écrit dans ».
- Pas de suppression d'un champ d'un document Firestore (ajouts facultatifs seulement).
- Pas de lecture de `functions/.env`, de `.codex/`, de `source4-portable-bundle-manifest-01.json`, de `work/refonte-frontend/v4/choix/`, ni de `work/missions/2026-10-31-ecran-depense/brasseur/`. Pas de `git stash`, pas de commit, pas de code écrit par heredoc ni par `node -e`, pas d'installation.
- Les autres prompts de `prompts.ts` ne bougent pas.

## Doutes
- Le format exact du point typé (noms de champs, forme, codes) n'est fixé que dans `PLAN.md`, qui n'existe pas encore : je ne le connais pas.
- Ce que « remise et ligne sans prix » donne exactement dans le calcul C1 (quelle valeur est comparée, et quand la ligne est ignorée) n'est pas écrit.
- La règle qui distingue un doute réel d'une valeur juste dans le prompt (A3) n'est pas écrite en détail.
- Le texte de la voie cite le diagnostic d2 (« refusés par d2 ») sans que je sache où il est ; je n'ai pas lu d2, qui n'est pas dans mes entrées.
- Qui écrit `REVUE-PLAN.md` et lance les deux relecteurs n'est pas dit : je suppose que c'est le pilote, après mon `PLAN.md`.
- G2 fait tourner `invoiceVisionReview.test.ts` et `purchasePrefill.test.ts`, qui sont hors de « Écrit dans » : je dois les laisser verts sans les modifier, ce qui suppose qu'un changement de format ne les casse pas.
- Le seuil de tolérance à supprimer (« 5 centimes ») est donné, mais je ne sais pas si d'autres tolérances existent dans le code.
- Je m'arrête après `PLAN PRÊT — <n> défauts`, sans coder, et j'attends la revue triée du pilote ; je ne sais pas combien de tours cela prend dans mon plafond de 110.
