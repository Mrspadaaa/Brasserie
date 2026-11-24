# Dossier — test en ligne du Calendrier, tour 32 (index-C_UsO3yZ.js), 23.11 soir

## Consignes du brasseur (SUIVI.md, mot pour mot)
1. « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! » ; 2. « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle » : chaque actionneur, sur des « ZZ TEST — … » que tu crées ; regarder seul = non couvert.
8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après de chaque geste, effet sur tout ce qui en dépend, résultat plausible en vrai.
23.11 : « les seul vrai tests sont ceux sur la vrai app » ; « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core `connect({browserURL:'http://127.0.0.1:9222'})`, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : `page.close()` de ton onglet, `browser.disconnect()`. JAMAIS `browser.close()`.
- Vérifie le paquet : `curl -s https://brasserie-l-affinee.web.app/ | grep -o "assets/index-[^\"]*.js"` = index-C_UsO3yZ.js ; si l'onglet sert un ancien paquet, force la mise à jour (le test du tour 28 a trouvé l'ancien paquet servi).
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

## Constats à rejouer (corrigés au tour 32 selon la voie fix29)
 CALP-5 | l’étiquette « J0 / 55 · prête 13 févr. » couvre la barre 
 T28-16 | Glisser la barre « ZZ TEST — barre » (S48) de 72 px vers la droite → observé : la frise passe à « 6 sem. » au toucher et l’événement est posé une semaine plus tôt, « 23 nov. → 16 nov. » ; attendu : glisser à d
 T29-1 | Régler la période de l’app du 01.01.2024 au 31.12.2027, puis la poignée de début tirée à gauche → observé : la frise dit « 4 ans », mais son cadre va du 24 nov. 2025 au 25 nov. 2029 ; avec la période 22.11.15–21.11.
 T29-2 | Depuis 01.01.24–31.12.27, toucher › → observé : 22.11.23–21.11.27, la période recule ; ni ‹ ni › ne changent la frise ; attendu : › avance de 4 ans, et la frise suit 
 T29-3 | Tenir la barre « ZZ TEST — barre » à 6 mois, puis glisser 150 px à gauche → observé : la frise passe à 6 sem. au toucher, la barre quitte le doigt, l’événement est posé deux semaines plus tard (2 → 16 août) ; à 3
 T29-4 | Toucher le nom de la fête « vi » → observé : la ligne est un <label>, la fête est cochée « Fait » (vraie donnée, décochée aussitôt : « 12.10.2026 · en retard ») ; aucun renvoi vers sa feuille ; attendu : le nom ouv
 T29-5 | Glisser la barre ZZ à 6 sem. après le zoom au toucher → observé : l’étiquette « S33 · 16 août · lâcher ici » couvre la barre glissée ; attendu : l’étiquette hors de la barre (CALP-5) 
 T29-6 | Tenir la barre ZZ 2,5 s au bord droit, puis la lâcher → observé : la frise passe de 6 sem. à 6 mois, l’événement saute du 16 nov. au 2 août, posé hors du cadre qui finit le 27 juin ; à gauche, 2 août → 24 mai, hors d
 T29-7 | Cadre de 25 à 31 mois → observé : « M M J S 2027 M J S 2028 … », la première année n’a pas de nom ; attendu : l’année sur chaque segment 
 T29-8 | Menu des durées : An → observé : la bande montre « O N D J F M A M J J A S O N D J F », sans année au passage de janvier ; attendu : l’année à janvier, comme à 31 mois 
 T29-9 | Cadre sans chose dans la rangée, mais des choses hors du cadre → observé : pastille de somme vide et « pas confirmé » (Brassins, Fêtes, Travaux, Papiers) ; attendu : « vide » ou un montant 
 T29-10 | Cadre de 4 ans, puis de 31 mois → observé : « prévu S48–S47 », « prévu S48–S25 », sans années ; la plage se lit à l’envers ; attendu : années dès que le cadre passe l’an 
 T29-11 | Toucher « ‹ auj. » (cadre en déc. 2026) → observé : cadre sur S51, la semaine cachée dessous ; attendu : retour à aujourd’hui (S48) 
 T29-12 | Poignées tirées → observé : « 31 mois », « 46 mois », « 63 mois » ; attendu : en années (« 2 ans ½ », « 5 ans ») 

## Aussi
- Mise à jour de l'app (tour 31) : un onglet ouvert doit passer à la nouvelle version en ~1 min, au repos seulement (jamais pendant une saisie). Note le temps observé à l'ouverture.
- T29-4 : le nom d'une ligne de l'Agenda ouvre maintenant l'agenda de l'Atelier (la feuille sur place viendra plus tard) ; la case seule coche.
- Incident du tour 29 : toucher une ligne de l'Agenda a coché une vraie fête. Ne touche QUE des ZZ ; relis les vraies choses après chaque geste.
