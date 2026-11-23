OK — 23 tickets houblons face à l'état réel : 4 à fermer, 15 à compléter, 4 à jour, 6 tickets à créer ; rien publié

## Fichiers écrits
- `work/refonte-frontend/tickets-2026-10-24.md` : tableau, pages en vigueur, une section par ticket (titre, dernière mise à jour, verdict, ce qui a changé avec commit/D, brouillon de commentaire à publier tel quel), six tickets à créer avec titre et corps, alertes.
- ce fichier.
GitHub lu seulement (`gh issue view`, `gh issue list`, `check-issue-closure.mjs` en lecture) : aucun commentaire, aucune fermeture, aucune création, aucune modification. Rien publié.

## Table

| Ticket | Verdict | Une ligne |
|---|---|---|
| #119 | a-completer | état du 23.10 soir ; manquent D107 à D125, version 5345f6ad, les choix ouverts |
| #122 | a-completer | épopée : liste sans #143 à #146 ; critère « quantité » en tension avec « stock discret » |
| #123 | a-completer | étape Houblons choisie (base v4.10) ; critère « quantité » à revoir avec lui |
| #124 | a-completer | dit « r6n2 base » : il a choisi r6a, étapes de x3b (D107) |
| #125 | a-completer | Dryhopper provisoire (#146), D111 à D113, rail D123/D124, mesures t2 |
| #126 | a-completer | Substituer ouvert (#145) ; ses mots « u4 » du 19.10 absents du registre |
| #127 | a-jour | `stout-porter` garde `examples: []` |
| #130 | a-jour | non attaqué, après la refonte |
| #131 | a-completer | sources inchangées ; ajouts : Celeia, Nelson Sauvin (D100), α inconnu |
| #132 | a-jour | dose de levure non touchée ; la vue Levure de la maquette est autre chose |
| #133 | a-completer | méthode : règle n° 1, états joués (D124), mini maquettes en artefact neuf |
| #135 | a-fermer-propose | « à choisir » : m4, h4 choisis, base v4.10 |
| #136 | a-fermer-propose | « Mettre de côté pour le moment » ; Comparer = #124 |
| #137 | a-completer | moteur fait (prototype) ; écran = #145 ; question des grammes sans réponse |
| #138 | a-fermer-propose | Comparer = r6a, Suggestions = q2b, dépassent le lot 6 |
| #139 | a-completer | m4 choisi ; absent de l'inventaire de Ma bière v4.10 ; code d'app à décider |
| #140 | a-fermer-propose | lot 12 rejeté, remplacé par g1 ; D112 et D115 → ticket à créer |
| #141 | a-completer | D75 fait ; cas lager (Citra cryo) non joué |
| #142 | a-completer | table commune dans la maquette ; contrôle D83 ; lien #144 |
| #143 | a-completer | phase 1 faite ; perf mesurée ; B6, B9 à B11, thème, D124 restent |
| #144 | a-completer | voie t1 jamais rendue, app inchangée ; enveloppe en clair toujours |
| #145 | a-jour | à jour ; ajouter ses mots « u4 » (facultatif) |
| #146 | a-completer | + D123 (vocabulaire de Dryhopper entré dans le rail) et D125 |

Décompte : a-jour 4 (#127, #130, #132, #145), a-completer 15 (#119, #122, #123, #124, #125, #126, #131, #133, #137, #139, #141, #142, #143, #144, #146), a-fermer-propose 4 (#135, #136, #138, #140), a-scinder 0. Total 23.

## Gestes à faire sur accord (le pilote demande l'accord du brasseur, puis publie)
1. **Commentaires** (brouillons dans le fichier, 19 à publier tels quels, le 20ᵉ facultatif) : #119, #122, #123, #124, #125, #126, #131, #133, #137, #139, #141, #142, #143, #144, #146 ; plus #135, #136, #138, #140 avant leur fermeture ; #145 facultatif.
2. **Fermetures** : #135, #136, #138, #140 (`check-issue-closure.mjs` : CLOSURE OK, « hors interface », rejoué le 24.10). Aucune fermeture d'un ticket d'app (#123 à #126, #143 à #146 restent ouverts : la maquette n'est pas l'app).
3. **À créer** (corps dans le fichier, section « Tickets à créer ») :
   - [P0] rail de l'étape Houblons, fonctions de sa base (D123, D124) ;
   - [P1] vue Levure, son choix ;
   - [P1] fiche : liste en variantes (D115), effet de l'appui long (D112) ;
   - [P1] entrée de l'analyse (D121) A, B ou C ;
   - [P2] pastille « ~ simulé » (D122) ;
   - [P1] vues dont il n'est pas convaincu en fils de fer, un sort par commentaire (D125).
4. **Registre** : inscrire ses mots du 19.10 « Substitution, ça serait plus du u4 » à l'écran `substituer` de `ecrans.json` avant de lui poser porte ou u4.
5. **Git** : `origin/claude/refonte-houblons-v4` est à `79d34eb8` (23.10 soir) ; 48 commits locaux non poussés. Le push est un geste de l'utilisateur.

## Critères
- G1 : `TICKETS-BIEN`, exit 0, rejoué par le même lanceur que le pilote (`spawnSync` avec `shell: true`, donc cmd.exe sous Windows). Essais : 1 (un premier rejeu sous bash a échoué, voir doutes).
- G2 : voir la ligne « NOTE OK » en bas, rejouée à la fin.

## Doutes et limites
- **G1 sous bash** : dans la commande de GATES.md, `'\\b'` devient `'\b'` (0x08) sous bash, et le critère répond ECHEC même fichier correct ; sous cmd.exe (lanceur de `systeme.mjs`, `shell: true`) il passe. Même piège que M10. Le pilote doit le rejouer par `systeme.mjs voies`, pas à la main sous bash.
- État lu dans le dépôt et dans les commentaires GitHub ; **rien n'a été vérifié sur un rendu** (voie de lecture). Les verdicts de maquette reprennent les RESULTAT de p6 et la MISSION.
- Les voies p19 à p22 (D123 à D125) n'avaient pas de RESULTAT.md à la lecture ; les tickets à créer 1 et 6 décrivent des contrôles « en écriture », non rejoués. La liste des vues à revoir (`vues-a-revoir.md`) de p22 n'existait pas encore : le ticket 6 n'en nomme que quatre.
- #123 : je n'ai pas vérifié si la maquette tient « 5 houblons sans défiler avec leur quantité » ; je signale seulement la tension avec « stock en petit badge » (§ 0 SPEC).
- #139 : l'absence de la grille m4 dans Ma bière v4.10 vient de l'inventaire (`inventaire-ma-biere.json`), pas d'une capture ouverte.
- #121, #120, #128, #129, #115, #116, #118 (houblons aussi, ouverts) n'étaient pas dans la liste demandée : non examinés ; #121 a été mis à jour le 23.10, #120 et #128/#129/#115/#116 le 17.10. À regarder au prochain passage.
- Fichier non suivi `pistes-l5f.png` à la racine (L17), hors de ma voie : signalé, non touché.

## DÉCISION À PRENDRE
Substituer : le registre dit « ouvert » (porte ou u4), alors qu'il avait dit le 19.10 « Substitution, ça serait plus du u4 ». Options : (a) le montrer en mini maquettes avec ses mots du 19.10 cités ; (b) tenir u4 pour son choix et l'écrire au registre. Recommandation : (a), car la carte du conseil du 22.10 a rouvert la question, et la règle n° 1 interdit de trancher à sa place.
Critère « chacun avec sa quantité » (#122, #123) contre « stock en petit badge » : option prudente, badge sur la ligne et quantité à un toucher ; à lui de confirmer.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (le piège `\b` des CHECK sous bash relève de M10, déjà mécanisé : un critère se rejoue par le lanceur du pilote, pas à la main)

Accord requis avant tout geste : rien publié, rien à créer sans lui.
