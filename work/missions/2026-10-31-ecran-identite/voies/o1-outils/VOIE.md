# Voie o1-outils — corriger les contrôles de maquette avant les passes 2 (D202)

Agent : auteur (Sonnet). Des outils de contrôle, rien dans `src/`. Écris RESULTAT.md tôt.

## Les défauts relevés par les séries v0 d'Identité
Ils sont dans `v0/g-serie/RESULTAT.md`, `v0/r1/RESULTAT-serie-r.md`, `v0/e-serie/RESULTAT.md` et `v0/i-serie/RESULTAT.md`.
1. `work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs` reconnaît une capture à son nom de fichier : six `capture-haut.png` donnent
   un faux échec de diversité. Il faut la reconnaître au chemin complet, ou à l'id du dossier.
2. `mots-premier-ecran` compte le texte d'un `<details>` fermé, et les valeurs coupées hors d'un conteneur qui défile. Il ne doit compter
   que le texte visible au premier écran.
3. `controle-contraste` ne voit pas une bande de fond posée à côté du texte. Il doit lire le fond réellement peint derrière le texte.
4. **Un profil « sans houblons »** pour `controle-commun` et `controle-standard`, pour les écrans hors de l'outil houblons :
   - les rayons de DESIGN.md (10, 16 et 24 px) à la place de 2, 4 et 8, parce que DESIGN.md prime (décision du pilote) ;
   - le trait de 2 px du + commun, repris de l'app, est permis ;
   - les contrôles au-style, fiche, trait et légende sont sautés, avec leur raison.
   Le profil se choisit par une option (`--profil=sans-houblons`). Le profil houblons ne change pas.

## Critères
- Chaque correction a un témoin. Le cas fautif échoue avant la correction, puis passe. Un vrai défaut (une capture identique, un vrai texte
  de trop, un vrai contraste faible) échoue toujours.
- Rejoue les contrôles corrigés sur les 48 concepts de `v0/`, puis rends un tableau : ce qui passe, ce qui échoue, et pourquoi.
- Les contrôles du lot houblons, rejoués sur une maquette houblons choisie (`prototypes/houblons-v4/maquettes/parcours`, après
  `construire.mjs`), donnent le même résultat qu'avant.

## Possède
- Les outils de `work/refonte-frontend/v4/tournoi/outils/` cités plus haut, et leurs tests s'il y en a.
- `work/missions/2026-10-31-ecran-identite/voies/o1-outils/`.

Rien dans `src/`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
