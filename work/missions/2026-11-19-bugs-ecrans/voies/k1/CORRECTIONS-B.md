# k1 — corrections B (points 6, 7, 8, 11, 12, 13, 17)

6 | corrigé | f49f2e3e0 | apres-390-cave-nolo-repli : « Recette actuelle : projection indisponible pour cette souche et ce procédé. » (plus de « à compléter ») ; test rouge puis vert (bugs-k1b-nolo)
7 | corrigé | f49f2e3e0 | apres-390-cave-nolo-repli et apres-1280-clair-nolo-repli : sous Procédé, Consigne, Levure et la plage, un seul pli « Hypothèses du calcul » (fermé) ; « Plage de simulation » et l'encadré « Eau proposée » y sont rangés ; ouvert d'office seulement si une saisie est invalide ou si le plan d'eau est refusé (alerte visible)
8 | corrigé | f49f2e3e0 | apres-390-cave-nolo-repli : chevron à 15 px de la fin du texte (avant : 1 px, `padding: 5px 0` effaçait la réserve de 1,75 rem d'index.css) ; mesure Chrome `avant-390-cave` → `apres-390-cave`
11 | corrigé | cc7db72ec | à capturer (voir DEMANDE EXECUTANT) mv7-miel-390-cave : l'aperçu « + Miel ↵ » n'existe plus quand « Créer » est proposé ; la ligne « Créer « Miel » · 0,50 kg (stock à zéro) — sucre : à l'ébullition » porte seule le geste (Entrée crée le sucre, test)
12 | corrigé | cc7db72ec | à capturer m4-mv8-390-cave : Coriandre « hors du grain », « Grain » sans elle, plus de « 1 couleur à renseigner », alerte au présent (« n'est comptée ni dans le grain ni dans la teinte ») ; moteur : `grainEmpate` et `recipeBeerColor` ignorent une épice ; marge de 76 px à droite des alertes tant que le + flotte (< 1024 px)
13 | corrigé | cc7db72ec | à capturer m4-teinte-390-cave : pastille du « Malt noir » (ligne et carte détail) avec liseré clair `fer-sombre` (≥ 60 EBC)
17 | corrigé | 559b62f5f | à capturer br5-63-390-cave : la poignée ↔ de durée se retire à gauche (xPoigneeDuree) et laisse « ≈18′ » lisible ; test de géométrie rouge puis vert

Tests : bugs-k1b-nolo, bugs-k1b-malts, bugs-k1b-poignee verts ; fermentescibles, a1, a2, noloRecipeSolver, paliers, couleur : verts (233 + 29 + 22). Suite complète lancée par erreur : 3 échecs « IA dans les étapes d'une recette enregistrée » (zone Levure/Conduite, hors voie, non touchée).

Hors voie : point 12, la ligne « Grain X kg » du bandeau (BrewWizard) suit maintenant `grainEmpate` sans changement de BrewWizard : rien d'ouvert.

## DEMANDE EXECUTANT
Les captures APRÈS (390 cave tactile et 1280 clair) restent à prendre et à ouvrir ; les verdicts 11, 12, 13, 17 attendent leur vue.
1. `node --check work/missions/2026-11-19-bugs-ecrans/voies/a1/capturer.mjs`, puis `node scripts/with_server.mjs --server "npm run dev -- --port 3103 --strictPort" --port 3103 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/a1/capturer.mjs > work/missions/2026-11-19-bugs-ecrans/voies/k1/captures-journal-b.txt 2>&1` (sans `timeout`, ~8 min) → `CAPTURES OK` ; renommer/copier vers `voies/k1/captures/` : mv7-miel-*, m4-mv8-*, m4-teinte-* (390 cave, 1280 clair).
2. Poignée (17) : `node scripts/with_server.mjs --server "npm run dev -- --port 3108 --strictPort" --port 3108 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/x1/capturer.mjs` → `br5-63-390-cave.png` : doit montrer « ≈18′ » entier à droite de la poignée ↔ (si le palier n'est pas atteint à 390, toucher la courbe à la main : un palier choisi suivi d'une montée suffit).
3. Ouvrir (Read) : mv7-miel-390-cave (une seule ligne « Créer », pas de pastille « + Miel ↵ »), m4-mv8-390-cave (Coriandre « hors du grain », pas de « couleur à renseigner », alerte sans le + dessus), m4-teinte-390-cave (pastille noire cerclée de clair), br5-63-390-cave (« ≈18′ » libre).
4. Commit par chemins : `git add -f work/missions/2026-11-19-bugs-ecrans/voies/k1/captures*` puis commit « Bugs k1 B : captures » avec la ligne Co-Authored-By.

## Preuves (exécutant)
Exécution (19.11) : port 3104 déjà occupé par un autre serveur (refusé par with_server, non utilisé) ; serveur 3110 à la place, arrêté ensuite. Scripts copiés dans `voies/k1/` (`capturer-a1.mjs`, `capturer-x1.mjs`) pour écrire dans `voies/k1/captures/` et non dans a1/x1. Journaux : `captures-journal-b.txt` (EXIT 0, CAPTURES OK), `captures-journal-x1.txt` (EXIT 0). Relevé : `captures/releves.txt`.
- `captures/mv7-miel-390-cave.png` : une seule ligne « + Créer « Miel » (stock à zéro) / sucre : à l'ébullition », pas de pastille « + Miel ↵ » : défaut 11 non visible.
- `captures/m4-mv8-390-cave.png` : Coriandre « hors du grain », Grain 8 kg, pas de « couleur à renseigner » ; alerte « Coriandre : une épice n'est pas un fermentescible… » en bas à gauche, sans recouvrement par le + : défaut 12 non visible.
- `captures/m4-teinte-390-cave.png` : Malt noir 2,5 kg, alerte « Teinte 169,5 EBC… ». Pastille noire visible, liseré clair à peine discernable à cette échelle : défaut 13 probablement corrigé, à confirmer par zoom.
- `captures/br5-63-390-cave.png` : « ≈18′ » entier et lisible à droite de la poignée ↔ (poignée en bas à gauche de la zone de durée) : défaut 17 non visible.
- `captures/mv7-miel-1280-clair.png` : même ligne unique « Créer « Miel » … sucre : à l'ébullition », pas de pastille : défaut 11 non visible.
- `captures/m4-mv8-1280-clair.png` : Coriandre « hors du grain », pas de « couleur à renseigner » ; l'alerte est hors cadre (sous le pli, non visible sur cette capture) : défaut 12 non visible, alerte à vérifier.
- `captures/m4-teinte-1280-clair.png` : Malt noir 2,5 kg, alerte « Teinte 169,5 EBC… » sous la ligne ; pastille noire, liseré clair non discernable : défaut 13 douteux.
- `captures/br5-63-1280-clair.png` : mode « Sur mesure » (≈100 min), « ≈30′ » lisible à droite de la poignée ↔ : défaut 17 non visible ; ce n'est pas le même tracé qu'en 390 cave (« Corps rond », ≈18′), donc pas de comparaison directe.
Non ouvertes : les versions 390 clair et 1280 cave des captures mv7, m4-mv8, m4-teinte, ainsi que les captures br6, br11, br19, br98, pi1, te17 produites par les scripts copiés. Hors verdicts k1 B, pas de constat.
