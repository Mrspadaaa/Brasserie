# Compréhension de la voie p5

## Objectif
Construire deux variantes de l'écran des fermentescibles, `r4e-a` et `r4e-b`, copiées de r4d. Sur chaque ligne de grain, le brasseur règle la masse, la part, le moment et la couleur en un toucher puis une saisie ou un choix, sans ouvrir le détail ni toucher le plateau, qui reste toujours visible.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/`
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md`

## Fini quand
- Dans les deux variantes, chaque réglage de la ligne se change sur la ligne (contrôle `controle-volee.mjs` : VOLEE OK).
- Les gestes de r4d tiennent : masse, retrait avec « Annuler », ajout, nom qui ouvre le détail (`controle-gestes-ligne.mjs` : GESTES OK).
- Chaque page se rend sans erreur (`verifier-page.mjs` : PAGE OK).
- Au premier écran, 80 mots au plus, profil sans houblons (`mots-premier-ecran.mjs` : MOTS OK).
- Le cadre commun tient, couleurs mises à part (`controle-commun.mjs` : COMMUN OK), avec le contraste (CONTRASTE OK) et la hauteur (HAUTEUR OK).
- `RESULTAT.md` cite D211, « Toujours visible » et les captures (`systeme.mjs note` : NOTE OK).
- Les `capturer.mjs` de r4e-a et r4e-b se refont et impriment CAPTURES OK.
- Précisément, la part se règle ainsi : r4e-a, le pourcentage se tape sur la ligne ; r4e-b, la barre de la ligne se tire au doigt. Dans les deux cas, la masse de la ligne suit la part, et le total du grain change sans toucher aux autres masses.
- Le moment se change ainsi : r4e-a, un petit menu ancré à la ligne (empâtage, ébullition, fermentation, avec le jour « J+n » en fermentation) ; r4e-b, un toucher passe au moment suivant, avec « Annuler ».
- La couleur « ? » se tape en EBC sur la ligne (1 à 1500, virgule acceptée) ; hors plage, la valeur d'avant revient sans message bloquant.

## Ne fait pas
- Ne modifie ni `v3/` (r4d reste telle quelle), ni `ecrans.json`, ni `ecrans-app.json`, ni `src/`, ni `functions/`, ni `.codex/`, ni le manifeste, ni les contrôles de `tournoi/outils/`.
- Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, pas de commit.
- Ne supprime pas le plateau et ne le replie pas (`#replie` disparaît).
- Ne rajoute rien au repos qui ne serve un des gestes ; pas de cockpit, pas de phrase d'aide au repos, pas de `type="number"`, pas de texte sous 12 px.
- N'écrit pas `GATES.md` ni `VOIE.md`.

## Doutes
- Le contrôle `controle-volee.mjs` doit être rendu par c5 avant mon départ ; je ne sais pas s'il existe. S'il manque, je m'arrête en ECHEC sans rien construire.
- Le menu ancré de r4e-a : je ne sais pas comment il se place exactement sous la ligne, ni à quelle hauteur de l'écran (cas du bas de liste).
- Le plateau se place sur la ligne dont on touche le nom, et au repos sur la ligne choisie de r4d : je ne sais pas comment réconcilier les deux si r4d n'a pas de ligne choisie.
- Le chemin de travail : le dépôt où je travaille est `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie`, pas `C:/Users/mrspa/Documents/Brasserie` cité dans la consigne. Je pense que la consigne veut seulement dire « ne pas lancer de serveur dans le dépôt principal ».
- Les mots « D211 » et « D212 » sont résumés ici ; leur texte est dans `work/refonte-frontend/decisions.md`, que je n'ai pas lu (hors consigne du test).
- Je ne sais pas ce qu'est `controle-gestes-ligne.mjs` au-delà de son nom ; le contrôle G2 le dira.
