# Reprise 2 — lenteurs (23.11), arrêt à ~150 k

Fait : cause 1 (commit eb90d630b : Frise.tsx + calendrierJalonsLies.test.tsx), MESURES.md § 4. Banc : `scripts/parcours/lenteur.mjs` modifié (NON commité, non rejoué) : `menuDuree('3 mois')`
avant « evenement-ouvrir » + défilement vers « Marché de Noël ». Outils neufs dans `outils/` : construire-arbre.mjs (HEAD + mes fichiers, NM=1 non minifié), ab2.mjs (A/B CAL-LENT),
ab-pas.mjs (A/B d'un fichier de pas pas2). Builds : %TEMP%/lenteurs-22-11-b/build-{tour9,c1,c2,c3,c1-nm}. Commit : script `scratchpad/commit.sh` (index temporaire) ; HEAD de port-carnet bouge :
relancer si « cannot lock ref ».

Reste à faire, dans l'ordre :
0. Contrôles de comportement de la cause 1 : lancés en tâche de fond sur build-c2 (calendrier.mjs et geste.mjs --endroits calendrier) ; sorties dans
   %TEMP%/claude/…/scratchpad/cal.log et geste.log (fini.txt = terminé) : lire la fin, sinon relancer. tsc : aucune erreur dans frise ; vitest : 275 + 148 verts hors les 4 échecs de HEAD.
1. Cause 1 suite : la mise en page de la frise reste ~300 ms ×4 au toucher d'une semaine. Profil non minifié (construire-arbre.mjs <nom> <fichiers> avec NM=1, puis lenteur.mjs --build) : chercher
   `placerNoms`/`largeurTexte` (Courbe.tsx, 484 ms de temps propre au glisser de la frise : les noms se replacent à chaque mouvement ; remède probable : replacer seulement au relâchement ou à l'image),
   et `setSousFab` qui rend la frise entière. Le cache de largeurTexte seul n'a rien donné.
2. PageShell `pageVisibilityCheck` / `focusPage` : non touché. Profiler d'abord avec `ab-pas.mjs` sur `pas/calendrier.txt` (Poser un brassin, Ajouter en, Noter), un build non minifié, avant de coder :
   le coût est peut-être la recalcul de style qui aurait lieu de toute façon (même leçon que la cause 1 : ne gagner que ce qui est en double).
3. Recette ×3,7 : non commencé (profil d'un seul geste). 4. BrewDayPage : `BrewPiste.mesurer` ne lit qu'au montage ; la cause est ailleurs (profil du geste).
5. Banc : rejouer lenteur.mjs corrigé (5 tours) et vérifier que ouvrir/Modifier/Enregistrer valent 5/5 ; sinon lire pourquoi « Marché de Noël, » manque. Le commiter ensuite.
6. BUGS.md (Brasserie work/missions/BUGS.md) : mettre à jour les lignes CAL-LENT (cause 1 partielle : 464/416/304 ms, toujours rouge) puis `node scripts/agents/controle-bugs.mjs`. Non fait.
