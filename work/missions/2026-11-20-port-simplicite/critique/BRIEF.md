# Critique — test d'écran du port « simplicité » (mode « Test d'écran » de `.claude/agents/critique.md`)

Modèle : opus (Fable interdit). Racine : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`, NON commitée, non déployée.
Question unique : « combien et quels problèmes ? » — liste numérotée, chaque problème : choix (pa1…), format (390 clair/cave, 1280 clair/cave), ce qu'on voit, gravité B (bloquant : nombre faux, donnée perdue, geste impossible, maquette choisie non respectée) / G (gênant) / D (détail), capture qui le prouve.

## Ce que le brasseur a choisi (16.11) et qui doit se voir tel quel (règle n° 1)
Maquette : `maquette/index.html`, captures `maquette/captures/<id>-clair.png` et `-sombre.png`. Registre des retouches : pe4 sur un nettoyant, dose au curseur jamais inventée ; pm1 montre 67 °C proposé, à confirmer, et un curseur de pH ; pb1 et pb3 dans la feuille d1b.
Ses mots : « SIMPLEMENT et sans me prendre la tête » (15.11) ; moins de gestes partout sans perte de qualité (20.11) ; « C'est critique que mes choix soient respectés » (23.10).

## Ce qu'il faut juger (lot ${LOT})
LOT A : pa1 (un doute à la fois), pa2 (comme la dernière fois), pl1 (besoin déjà relié) dans Nouvelle dépense ; pe1 (l'onglet du bas « Tes finances, avant → après ») ; pl2 (Réalisés, courbe kh1r).
LOT B : pb1, pb2, pb3 (feuille Brasser d1b, liste des brassins) ; pm1 (le palier appelle la mesure, jour J) ; pe3 (la trace sur place, ligne de stock) et pe4 (la dose une fois).
Pour chaque choix : `voies/<voie>/RESULTAT.md` (inventaire, écarts déjà dits, bancs et scripts de capture) et `voies/<voie>/captures/`. Voies : v-pa1 (pa1, pa2, pl1 branchés), v-pa2pl1, v-pe1, v-pl2 / v-pb, v-pm1, v-pe3, v-pe4.

## Méthode
1. Ouvre la maquette de chaque choix de ton lot, puis les captures des voies, côte à côte. Beaucoup n'ont pas été ouvertes par leurs auteurs : ouvre-les.
2. Rejoue dans l'app RÉELLE ce que les captures ne prouvent pas (au moins un parcours par choix, par les gestes du brasseur) : `npx vite --port ${PORT} --strictPort` puis `http://localhost:${PORT}/?dev-local` (cerveau/agents/verification-locale.md) ; réutilise les scripts de banc des voies. Un banc simulé hors de l'app (v-pb `banc.html`, v-pa2pl1 composant seul) ne prouve pas l'app : rejoue ce parcours dans l'app. 390 tactile et 1280, clair et cave.
3. Écris `critique/RESULTAT-${LOT}.md` : le compte, la liste numérotée, et les captures (dans `critique/captures-${LOT}/`). N'écris rien d'autre, aucun fichier de code. Arrête ton serveur.
Rends une ligne : « N problèmes (b bloquants) — critique/RESULTAT-${LOT}.md ».
