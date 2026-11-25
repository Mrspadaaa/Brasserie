# Dossier c68-tests — règles de critique-68 jugées sur de VRAIES réponses de l'IA

Pourquoi : c67Regles était vert, 9 C67 rouverts en ligne : les tests jugeaient l'IA simulée (L11, L28). Ici, chaque test de rangement MONTE le composant (CarnetsVue, envoi depuis le champ de la liste) avec l'appel aiTask simulé qui RENVOIE la vraie réponse relevée : tests/fixtures/c68/rangement-1.json à -6.json ({ phrase, requete, reponse }) ; jamais iaSimulee pour ces tests.
Lignes : `grep -n "^| C68-" work/missions/BUGS.md` ; écarts du relevé : voies/c68-releve/RESULTAT.md.
- R70 : la carte « rangé pour toi » SUIT la réponse : titre court proposé par l'IA (jamais la phrase entière), carnet cible existant quand l'IA en désigne un (proposé : « Rattacher à … ? »), chemin catégorie › sous-catégorie, genre, tâche proposée. Les 6 fixtures, une assertion par champ.
- R71 (C68-2, C67-4) : le coût en tête d'un problème = la retenue, ou une fourchette min–max des pistes ouvertes ; jamais la somme ; une option écartée sort du calcul.
- R72 (C68-3, C67-5) : le Résolu dit le vrai chemin du carnet (pas « À ranger »), la retenue et les options fermées avec leur raison.
- R73 (C68-4) : la ligne d'un résolu dans la liste dit la retenue (200 CHF) et l'état, jamais « à comparer · 540 ».
- R74..R76 : les autres C68-n (m) et les C67 rouverts restants (C67-7, 8, 9, 10, 11, 12), chacun par le composant.
Code : src/ui/carnets/, src/domain/carnets/, src/ui/carnets/rangementCarnets.ts, FeuilleRangement.tsx, functions/src/carnetIA.ts (lecture de la réponse).
