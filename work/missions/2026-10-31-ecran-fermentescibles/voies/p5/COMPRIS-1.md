## Objectif
Faire deux variantes de l'écran fermentescibles, r4e-a et r4e-b, copiées de r4d (v3/r4d/etat.html), où chaque réglage de la ligne (masse, part du grain, moment, couleur, retrait, ajout, nom) se change sur la ligne sans ouvrir le détail ni toucher le plateau. Le plateau reste toujours visible, sans l'état replié.

## Écrit dans
`work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/`
`work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/`
`work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md`

## Fini quand
- r4e-a et r4e-b : chaque réglage de la ligne se fait sur la ligne (contrôle `controle-volee.mjs`, EXPECT VOLEE OK).
- Les gestes de r4d tiennent : masse, retrait avec Annuler, ajout, nom qui ouvre le détail (`controle-gestes-ligne.mjs`, GESTES OK).
- Chaque variante se rend sans erreur (`verifier-page.mjs`, PAGE OK), reste sous 80 mots au premier écran (MOTS OK), garde le cadre commun hors couleurs (COMMUN OK), passe le contraste (CONTRASTE OK) et la hauteur (HAUTEUR OK).
- Chaque `capturer.mjs` imprime CAPTURES OK ; les captures à 390 (repos, part, moment, couleur pendant et après, retrait avec Annuler) et à 1280 (repos) existent et sont ouvertes avant tout OK.
- RESULTAT.md : ligne 1 au format OK ou ECHEC, cite D211, « Toujours visible » et les captures (`systeme.mjs note`, NOTE OK).

## Ne fait pas
- Ne modifie pas v3/ (r4d reste telle quelle), ni ecrans.json, ecrans-app.json, src/, functions/, .codex/, le manifeste, ni les contrôles de tournoi/outils/.
- Pas de serveur dans C:/Users/mrspa/Documents/Brasserie, pas de git stash, pas de commit.
- Pas d'ajout au repos qui ne serve un des gestes ; pas de phrase d'aide au repos ; pas de type="number" (inputmode="decimal").
- Ne modifie pas VOIE.md ni GATES.md.

## Doutes
- Le contrôle `controle-volee.mjs` doit exister au départ (la voie c5 le rend avant) : je n'ai pas vérifié qu'il est présent.
- Le contenu exact des contrôles `controle-gestes-ligne.mjs` et `controle-volee.mjs` (ce qui fait « un geste ») n'est pas lu ici : la consigne demande de les lire avant de construire.
- Le texte de D211 et de D212 n'est pas lu ; je ne sais que ce que la consigne en dit.
- Le menu ancré de r4e-a (contenu et position) et la plage de l'EBC « ? » ne sont pas précisés.
- Le comportement du plateau quand aucune ligne n'est choisie n'est pas précisé.
- Faut-il copier `capturer.mjs` de r4d ou l'écrire neuf « comme celui de r4d » : ambigu.
