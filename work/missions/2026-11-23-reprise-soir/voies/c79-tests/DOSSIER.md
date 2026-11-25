# Dossier c79-tests — défauts EXA sur les VRAIS documents (tests/fixtures/c79/, 12 carnets ZZ)

Défauts : `grep -n "^| EXA-" work/missions/BUGS.md` ; état au tour 79 et lecture de la donnée : voies/c79-releve/RESULTAT.md (9 encore là : EXA-1, 2, 4, 5, 6, 7, 9, 10, 11). Pour chacun, le test MONTE l'écran avec le document réel et échoue sur ce que l'écran montre (capture du releve) ; un faux vert est expliqué.
- R110 (EXA-11, EXA-9, B, 3e retour après C71-1 et C73-1) : une tâche dont la phrase dit une date (« le 6 déc. », « avant le 31 décembre », « semaine du 14 ») garde CETTE date (la donnée stockée à 30.11/23.11 « mois/semaine » est fausse : la proposition de l'IA ou l'acceptation « À faire » l'a écrasée) ; À faire la range par sa vraie date et la dit. Teste le chemin complet : proposition (réponse de la forme réelle) → « À faire » → donnée → écran ; et l'affichage d'une donnée déjà fausse : la date de la phrase prime, ou « date à revoir ».
- R111 : EXA-1, EXA-2 (B) et les m EXA-4, 5, 6 (bulle mêlée sans ⋯ : toujours modifiable/supprimable), 7, 10 (« Pourquoi … ? » quand le fil donne la raison).
- R112 : EXA-3 et EXA-8 si un test peut les rejouer sans écriture réelle (écritures simulées) ; sinon sans objet, dit pourquoi.
SEULEMENT des tests rouges ; aucun fichier de src/ ni functions/ modifié.
