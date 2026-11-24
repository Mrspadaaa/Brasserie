# Dossier — test en ligne du Calendrier, tour 29 (index-BWLOL1xf.js), 23.11 soir

## Consignes du brasseur (SUIVI.md, mot pour mot)
1. « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! » ; 2. « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle » : chaque actionneur, sur des « ZZ TEST — … » que tu crées ; regarder seul = non couvert.
8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après de chaque geste, effet sur tout ce qui en dépend, résultat plausible en vrai.
23.11 : « les seul vrai tests sont ceux sur la vrai app » ; « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core `connect({browserURL:'http://127.0.0.1:9222'})`, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : `page.close()` de ton onglet, `browser.disconnect()`. JAMAIS `browser.close()`.
- Vérifie le paquet : `curl -s https://brasserie-l-affinee.web.app/ | grep -o "assets/index-[^\"]*.js"` = index-BWLOL1xf.js ; si l'onglet sert un ancien paquet, force la mise à jour (le test du tour 28 a trouvé l'ancien paquet servi).
- Ne touche AUCUNE vraie donnée : tes gestes qui écrivent portent sur des événements « ZZ TEST — … » que tu crées ; tout ZZ retiré à la fin. Après chaque geste qui écrit, vérifie qu'aucune vraie donnée n'a bougé (leçon du tour 28 : un rechargement a rangé un article dans un vrai carnet).

## Ce qui a changé (cœur de la frise reconstruit, D444)
Un seul état (période, vue, échelle), échelle d3. Écran inchangé (ses choix). À jouer :
- CAL-ETAT-COHERENT (« Toujours quelque problème avec la gestion des date, timing du graph.... ») : plage de l'app sur 4 ans, puis poignées tenues, ‹ ›, Tout, menu des durées : le bouton de durée, l'étiquette du cadre et l'axe disent toujours la même chose ; « ‹ auj. » seulement si aujourd'hui est hors du cadre ; rangées non vides quand des brassins sont dans le cadre.
- CAL-TOUCHER-GRADUATION (« que du je clique sur une semaine ou mois, ça fasse un focus dessus ») : toucher une semaine, un mois → cadre dessus ; Annuler → vue d'avant.
- CAL-ETIQUETTE-GRAIN-AU-DESSUS : en jours, étiquette « S52 2026 – S1 2027 » ; en semaines, des dates.
- CAL-GRADUATION-ROGNEE : aucune étiquette rognée ou chevauchée au bord. À 3 ans : années sur la bande (pas « J A J O » seuls).
- T28-16 (BUGS.md) : glisser la barre « ZZ TEST — barre » de 72 px à droite → la frise ne change pas d'échelle au toucher, l'événement avance (jamais posé une semaine plus tôt).
- CALP-5 : l'étiquette de durée pendant le glisser ne couvre pas la barre.
- Aussi : vues 3 sem., 6 sem., 3 mois, An, 3 ans, 4 ans ; défilement au bord ; sections (Finances, Brassins, Bord › Agenda) ; renvois (fête, événement → feuille sur place).

## Images de ses choix (référence visuelle de l'écran)
Le registre de ses choix : work/refonte-frontend/v4/choix/ecrans.json (clé calendrier) ; ouvre l'image qu'il cite pour la frise.
