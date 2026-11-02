# Voie m-lenteur — la lenteur de la lecture (D261c) : mesurer les options avant de les lui montrer

Agent : `auteur` (Sonnet). Plafond : 80 tours. Skill `banc-lecture` (`.claude/skills/banc-lecture/SKILL.md`) : lis-le d'abord. Aucun appel
Gemini payant dans cette voie : si une mesure en demande un, tu t'arrêtes et rends le besoin exact (variante, pièces, nombre d'appels, coût
estimé) ; c'est le pilote qui lance une passe payante (3 CHF au plus, budget cumulé 49 CHF, ≈ 8,7 dépensés). Aucun commit, aucun
déploiement, rien dans `functions/` ni `src/`. Possède : `work/missions/2026-10-31-ecran-depense/voies/m-lenteur/**`.
Données réelles (ses pièces, `work/finalisation-tickets-2026-10-08/H13-reels/**`) : lues seulement ; aucune valeur de ses pièces (montant,
fournisseur, nom) dans RESULTAT : des scores agrégés, des temps et des noms de champ.

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 01.11 (D261) : « Ça semble pas être super juste ??? Et ça a pris vraiment beaucoup de temps pour une "facture" relativement simple ??? ».
- 31.10 : « comme c'est de la facturation, c'est super important, ça doit être très fiable ! ».
- 02.11 : « Choix encore ouverts : D273b (…) et D261c. Montre moi ».

## Les faits
- D261c (`work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` l. 284) : deux lectures 3.5 Flash-Lite en parallèle (6,3 et 6,8 s), puis une
  troisième par 3.8 Flash (19,6 s) quand elles divergent : ~27 s côté serveur. Cible écrite : ≤ 12 s côté serveur, sans perte de justesse.
- Le 02.11 en ligne (doc14) : 6,1 s et 6,6 s, puis 3.8 en 14,8 s ; ~22 s, puis `traduireNoms` 3,8 s.
- D266 : au banc k6, la production C★v8 lit 153/165 champs et 217/224 lignes, 17,6 s médian, 0,044 CHF par pièce.
- Le code : `functions/src/invoiceScanCore.ts` (et ce qu'il appelle) décide quand la troisième lecture part et comment les lectures sont
  fusionnées. Les résultats de banc déjà payés sont dans `H13-reels/banc-*` (k5, k6, d272b…) : regarde s'ils gardent chaque lecture
  séparément (les deux Flash-Lite et la 3.8), avec leurs temps.

## Les options à mesurer (une seule chose varie : quand et comment la troisième lecture compte)
- **A — aujourd'hui** : troisième lecture 3.8 sur tout désaccord, l'écran attend la fin.
- **B — troisième lecture seulement sur un désaccord d'argent** (total, HT, TVA, montants de ligne) ; les autres désaccords (nature
  `kind`, unité, nom…) deviennent des drapeaux jaunes (D277 : « Pas sûr mais repris, flag jaune. Je contrôle »).
- **C — jamais de troisième lecture** : la fusion des deux Flash-Lite, chaque désaccord en drapeau jaune ou rouge.
- **D — l'écran tout de suite, la troisième en arrière-plan** : l'écran s'ouvre sur la fusion des deux Flash-Lite (~7 s) avec les désaccords
  en jaune ; la 3.8 arrive ensuite et lève ou confirme les drapeaux (justesse finale de A, temps du premier écran de C).
Pour chaque option, sur ses 14 pièces : temps côté serveur jusqu'au premier écran utilisable et jusqu'à la lecture finale (médiane, pire
pièce), champs justes / 165, lignes justes / 224, nombre de drapeaux jaunes et rouges qu'il aurait à contrôler, coût par pièce, et surtout
**les erreurs muettes** (une valeur fausse SANS drapeau) : c'est ce qui compte pour une facture. Rejoue hors ligne sur les lectures déjà
payées quand elles existent (fusion recalculée par le vrai code, importé, jamais recopié).

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`) : la table des options, d'où vient chaque nombre (fichier, commande), ce qui n'a pas pu être
mesuré sans passe payante (et la passe exacte à lancer, son coût estimé), ta recommandation en une ligne. Puis une ligne au pilote :
`M-LENTEUR OK — <n> options mesurées — <reco>` ou `M-LENTEUR BESOIN — <passe payante>`.
