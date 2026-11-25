# Dossier c69-tests — règles de critique-69 (voies/critique-69/RESULTAT.md)

Lignes : `grep -n "^| C69-" work/missions/BUGS.md`. Comme c68 : les tests de rangement montent CarnetsVue et renvoient de VRAIES réponses de l'IA (tests/fixtures/c68/rangement-*.json ; la phrase « vapeur » = rangement-1). Si une réponse réelle manque pour un cas, écris-le au RESULTAT (DEMANDE RELEVE) au lieu d'inventer une réponse.
- R77 (C69-1, B) : une phrase de problème matériel tapée dans la liste, dont l'IA propose un carnet existant proche (Rattacher), ne crée PAS d'abord un carnet « idée » au titre-phrase : soit la carte propose le rattachement et RIEN n'est écrit avant le geste, soit un problème neuf au titre court et au chemin complet. Jamais les deux. Valable pour toute phrase (vapeur, Citra, et 2 phrases neuves).
- R78 (C69-2, B) : Supprimer une note (bulle du fil) d'un carnet la retire VRAIMENT (magasin et Firestore simulé), y compris après rechargement ; « Note supprimée » n'apparaît que si elle l'est ; Annuler la rend.
- R79..R80 : les m C69-3..13 et les « en partie » de critique-69 (liste au RESULTAT), chacun par le composant.
