# Dossier c75-releve — les VRAIS documents des carnets qui échouent, pour des tests qui les rejouent

Pourquoi : c74b/c74c avaient des fixtures « à la forme » de ses vieux carnets, tests verts, mais reel-75 rejoue ses plaintes à l'identique (R75-1 note devenue article/critère, R75-2 fil ancien non rangé, R73-4/5 conditionnements et Choisir 1 kg, R73-25 Quand sans année). Il faut les documents RÉELS.
Où : https://brasserie-l-affinee.web.app (paquet servi noté, service worker contourné comme reel-75), Chrome de débug 9222, ton onglet, 390 × 844 ; fin page.close() puis disconnect ; JAMAIS browser.close(), jamais Claude in Chrome.
LECTURE SEULE : aucune écriture, aucun appel IA, aucune feuille validée.
Geste : lis dans le cache Firestore de la page (IndexedDB, comme reel-75 a compté ses 3 523 documents) les documents COMPLETS (carnet, ses messages, ses articles, son plan lié) de :
- « ZZ TEST — malt pilsner en rupture chez le fournisseur » et « ZZ TEST — pompe qui chauffe » (nos carnets de test : copiés tels quels) ;
- son carnet « Houblons citra » et l'article Embouteillage / le carnet importé du Planning cité par R73-25 : ANONYMISE (ids remplacés par des alias stables, aucun nom de personne, email ou identifiant ; les noms de boutiques et prix publics restent).
Écris tests/fixtures/c75/<nom>.json (un par carnet : { carnet, messages, articles, plan }) et la liste au RESULTAT avec, pour chacun, ce que l'écran du tour 75 montre de faux (capture ouverte).
Commit par CHEMINS (tests/fixtures/c75/ et ton dossier). Ligne rendue : « RELEVE <n carnets> ; données identiques <oui|non> <hash> ».
