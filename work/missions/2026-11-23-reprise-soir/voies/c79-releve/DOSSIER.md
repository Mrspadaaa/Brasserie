# Dossier c79-releve — les VRAIS documents des carnets ZZ des défauts EXA (tour 79)

Défauts : `grep -n "^| EXA-" work/missions/BUGS.md` (11, dont 5 B : EXA-1, 2, 8, 9, 11) ; voies/exemples-a/RESULTAT.md.
Où : https://brasserie-l-affinee.web.app (paquet servi noté, service worker contourné), Chrome de débug 9222, ton onglet ; fin page.close() puis disconnect ; JAMAIS browser.close(), jamais Claude in Chrome. Seul agent dans ce Chrome.
LECTURE SEULE : aucune écriture, aucun appel IA.
Geste : comme c75-releve, lis dans le cache Firestore les documents COMPLETS (carnet, messages, articles, plan, tâches/propositions) de CHAQUE carnet « ZZ TEST — … » cité par un EXA-n (ce sont nos données de test : copiées telles quelles, ids aliasés). Écris tests/fixtures/c79/<nom>.json et, au RESULTAT, pour chaque EXA-n : le carnet, ce que l'écran du tour 79 montre (capture ouverte), et si le défaut tient encore au tour 79.
Commit par CHEMINS (tests/fixtures/c79/ et ton dossier). Ligne rendue : « RELEVE <n carnets> ; EXA encore là n/11 <hash> ».
