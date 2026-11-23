# Voie tickets-soir — les issues GitHub à jour, le 24.10 au soir

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (écrire), puis publier sur GitHub
- Plafond : 80 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante

## Sa demande, mot pour mot (24.10, soir)
« Met bien à jour les issues git ». C'est son accord pour publier sur `Mrspadaaa/Brasserie` : commentaires, fermetures
justifiées, issues nouvelles. Rien d'autre (pas de push, pas de PR, pas de libellé supprimé, pas d'issue d'un autre sujet).

## Ce que tu fais
1. Pars du brouillon du matin, `work/refonte-frontend/tickets-2026-10-24.md` (verdicts et commentaires préparés, jamais
   publiés), et de l'état du soir, qui le dépasse : SPEC § 1 (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, les entrées du 24.10,
   soir), `work/refonte-frontend/decisions.md` (D39 à D58), `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D126 à D139),
   `work/missions/2026-10-23-maquette-parcours/MISSION.md` (« ## Pages », « ## Signature »), `git log --oneline -40`,
   `work/refonte-frontend/v4/choix/ecrans.json` (ses choix), et chaque issue (`gh issue view <n> --repo Mrspadaaa/Brasserie
   --comments`). Les pages en vigueur du soir : la maquette https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN, les pictos hors
   16D https://claude.ai/artifact/Y7jV3JyYZw3VdPmDittgwW, toutes les mini maquettes https://claude.ai/artifact/HEiJX4ipJhYUXwnrgizkSd,
   Dryhopper tout https://claude.ai/artifact/VXa3fDxdzm9eWxPBsD8Pvf, les planches du 24.10 (lien dans « ## Pages »).
2. Écris `work/refonte-frontend/tickets-2026-10-24-soir.md` : pour chaque issue houblons ouverte (#119, #122 à #146), un verdict
   (`a-jour`, `a-completer`, `a-fermer`) et son commentaire ; puis les issues à créer. Une issue n'est fermée que si son sujet
   est fait ou remplacé par un choix du brasseur (ses mots cités), et que `node scripts/check-issue-closure.mjs <n>` le permet ;
   **la maquette n'est pas l'app** : aucun ticket d'app n'est fermé parce qu'une maquette existe (porte B fermée, `src/` inchangé
   pour les houblons). Les issues à créer, au moins : la réactivité (D138, « c'est pas ultra réactif, ça lag un peu certaines
   actions ont du délais... ») ; un choix non reporté partout (D139) ; le radar r2 de Comparer (« À revoir, on va en parler ») ;
   la recherche avancée de houblons (lot en cours) ; les légendes sous les pastilles (lot en cours) ; le moment proposé d'un ajout
   pour la vraie app (« Ajout à 10' mais pas toujours idéal, pour la vrai app. Utiliser une meilleure prédictions ») ; le choix
   des pictos hors 16D (D131) ; « Ses mots » de Comparer à reprendre ; et celles du brouillon du matin encore vraies (vérifie
   chacune ; D121 est tranché : B). Pas de doublon : cherche d'abord (`gh issue list --search`).
3. Publie : chaque commentaire (`gh issue comment`), chaque fermeture (`gh issue close --comment`), chaque issue nouvelle
   (`gh issue create`, avec les libellés existants du dépôt, `type:task`, une priorité, `status:backlog`, `interface` si c'est ce
   qu'il voit ; le parent #119 dans le titre comme les autres). Écris en français clair, ses mots entre guillemets, des liens,
   pas de jargon d'agent. Note sous chaque entrée du fichier la ligne `- Publié : <url>` (l'URL que `gh` rend).

## Possède
`work/refonte-frontend/tickets-2026-10-24-soir.md`, `work/missions/2026-10-23-maquette-parcours/voies/tickets-soir/RESULTAT.md`.
Sur GitHub : les commentaires, fermetures et issues de ce fichier, rien d'autre.

## Critères
Dans `GATES.md`. Réponse finale : une ligne (combien de commentaires, fermetures, issues créées).
