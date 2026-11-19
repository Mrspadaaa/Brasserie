# k1 — corrections A (feuille Mesures, caisse, notes de recette)

1 | corrigé | e236c8abb + (bandeau du haut : voir commit suivant) | la valeur refusée (OG 2,5) ne passe ni dans le résumé « Densité » ni dans la tuile OG du bandeau : capture p1-og-refusee-1280-clair montre « OG 1,060 » et « 1,060 » avec le message rouge au champ
2 | corrigé | e236c8abb | un seul compte, celui du journal : « 0 relevé » sous « Densité » et « OG · FG · 0 relevé » sous « Densité au fil du brassin » (p1-og-refusee-1280-clair, p4-conditionne-390-cave-volumes)
3 | corrigé | e236c8abb | « Densité finale » affiche « 1,012 » (comme la saisie 2,5 → « 2,5 ») : p1-og-refusee-390-cave-champs
4 | corrigé | e236c8abb + (carte Contenants : voir commit suivant) | une seule alerte, « 57,9 L pour 19,8 L brassés » sous « Bouteilles » ; ni « non répartis » ni répétition sous « Conditionné » : p4-conditionne-390-cave-contenants
5 | corrigé | a72967a1d | la rangée « Mon mois · Encaisser » a le fond de la feuille (245,245,245 clair ; 26,22,19 cave), mesuré et vu : c1-rangee-390-clair, c1-rangee-390-cave, c1-rangee-1280-clair
RL-13 (demande exécutant b1) | capturé | — | le bloc de notes à 390 cave lit « OG 1,031 · 11,3 % AA · ensemencement 27,5 °C · Empâtage 22,8 L · enregistré le 05.09.2026 » (date gardée avec ses points) : rl13-notes-390-cave

Captures : work/missions/2026-11-19-bugs-ecrans/voies/k1/captures-a/. Journaux : run1.log (rouge point 5 : bande 255 ≠ feuille 245), run2-4.log (vert).
Tests : tests/unit/bugs-k1-a.test.tsx (4, rouges avant, verts après) + 14 fichiers voisins : 89 passés, 0 échoué. tsc : aucune erreur sur les fichiers touchés.
Tests existants ajustés : bugs-b1-mesures (une alerte, plus deux), batchAm4Am5 et dashboardNavigation (valeur du champ « 1,050 » au lieu de « 1.050 »).
Notes : lecture étroite du point 1 (OG inconnue = « OG » omise du résumé, comme avant) ; le point 2 compte les relevés du journal (releves()), l'OG et la FG sont nommées sans compte. À 390, le champ de densité est un textarea (name inchangé).
Hors voie, vu : tests/integration/yeastPitchingExecution.test.tsx échoue (« Levure · » introuvable) dans la zone Levure/Conduite, sans lien avec ces corrections.
