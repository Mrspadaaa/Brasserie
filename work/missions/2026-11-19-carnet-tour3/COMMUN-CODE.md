# Règles communes des voies de correction (f1, f2, r)

- Code : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche `claude/port-carnet-1711`). D'autres sessions
  y ont des fichiers modifiés non commités (calendrier, finances/operations, TransactionDetails/Journal, stocks, vente,
  QuickActionModal, BatchDetailSheet…) : ne JAMAIS les toucher, les ajouter, les remettre à HEAD ; ni stash, ni checkout, ni reset.
- Brasseur (19.11) : « Corrige tout alors tu attendais quoi ??? Tout tout tout ». Chaque ligne de ta LIGNES.md finit
  `corrige` (commit) ou, seulement si impossible sans lui, `ouvert` avec la raison exacte (choix de goût non tranché, Gemini réel).
- Règle n° 1 : sa maquette choisie est la base de l'écran. Avant de changer un écran, retrouver la maquette retenue
  (dépôt Brasserie : `work/refonte-frontend/v4/choix/ecrans.json`, `maquettes.json`, `work/missions/2026-11-17-port-carnet/MISSION.md`,
  CRITIQUE-7/8.md) et s'y conformer ; ne rien ajouter qu'elle n'a pas. Si le défaut contredit sa maquette, la maquette gagne :
  verdict `ecarte` avec la référence.
- L13 : pour chaque correction, un test vitest qui ÉCHOUE sur le code actuel (le lancer, noter la sortie rouge), puis le
  correctif, puis vert. `npx vitest run <fichiers>` (jamais tout `npm test`), `npx tsc --noEmit -p tsconfig.json` (une erreur
  dans un fichier d'une autre session : la signaler, ne pas la corriger).
- Gemini jamais réel : réponses simulées ou enregistrées seulement. Pas de serveur de dev, pas de navigateur, pas de déploiement,
  pas de push. `functions/.env` jamais lu.
- Commit par chemins à la fin, avec seulement tes fichiers : `git -C <port-carnet> add <chemins>` puis
  `git -C <port-carnet> commit -m "Carnet tour 3 (<voie>) : <ids> — <résumé>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- <chemins>`.
  Vérifier après : `git -C <port-carnet> show --stat HEAD` ne contient que tes chemins.
- Livrable : `voies/<voie>/RESULTAT.md` = une ligne par id : `id | verdict (corrige/ecarte/ouvert) | commit | test (fichier) | rouge→vert | écran touché (oui/non)`,
  puis la liste des écrans touchés et l'état à montrer pour la vision (ce que le pilote doit capturer en `?dev-local`).
  Réponse finale : une ligne. Plafond 100 tours ; à 200 k de contexte, rendre `REPRISE : <fichier>`.
