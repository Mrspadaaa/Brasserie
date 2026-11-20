# Voie v3, tour 2 (v3b) : finir la voie

Même contrat et même « Possède » que voies/v3/VOIE.md (lis-le, puis COMMUN.md). Lis voies/v3/RESULTAT.md (ton prédécesseur), section REPRISE.

Interdits stricts : jamais `git show HEAD:<f> > <f>`, checkout, reset ou stash ; un essai à retirer se retire par Edit. src/domain/calendrier.ts et src/ui/calendrier/** sont modifiés par une autre session (CAL-PASSE) : n'y écris pas. N'arrête jamais un processus par son nom ; seulement par le PID d'un serveur que TU as lancé. Port de ton banc : 3135 (3124 est pris).

1. BK3-1 (corrigé cfb0400f2) : rejouer le banc à 390 et 1280, clair et cave, et OUVRIR chaque capture après ; une ligne par capture dans RESULTAT.md.
2. T3-2 (corrigé 4de2bb4e6) : captures du détail d'un brassin en retard, 390 et 1280, clair et cave, ouvertes.
3. BK3-3, partie Vendre : caisse à 390 avec un panier long ; la barre « Mon mois / Encaisser » ne couvre jamais le dernier article au repos (réserve de place égale à la hauteur mesurée de la barre) ; test ou mesure rouge d'abord ; src/ui/vente/** seulement.
4. T3-3 : défaut prudent et réversible : deux choses d'une même rangée au même titre et d'ids différents se distinguent par leur jour (« Emballage · Jhhh · 12 déc. »). Seulement si `preparerChoses` vit hors des fichiers occupés ; sinon « ouvert — fichier occupé : src/domain/calendrier.ts, changement exact ».
5. tests.txt (sans tests/integration/calendrierDetail.test.tsx, rouge par le travail non commité de CAL-PASSE : le dire), verdicts.mjs v3 et --tests OK.

Commit « Bugs relance (v3b) : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Plafond : à 200 k, « REPRISE : voies/v3/RESULTAT.md ». Réponse : une ligne.
