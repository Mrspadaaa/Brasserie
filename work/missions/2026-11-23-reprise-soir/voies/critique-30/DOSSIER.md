# Dossier — test en ligne du tour 30 (23.11 soir)

## Consignes du brasseur (work/missions/SUIVI.md, mot pour mot, en vigueur)
1. « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! » (07.11).
2. « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle » (07.11) : chaque actionneur, sur des « ZZ TEST — … » que tu crées ; regarder seul = « non couvert ».
4. Gemini dans les tests : « oui Normal, ça fait partie des test » (08.11).
8. « Non c'était des exemples ils doivent TOUT tester... » : chaque actionneur, capture avant/après, effet sur tout ce qui en dépend ; chaque résultat plausible en vrai.
9. Son Chrome sert aux VRAIS tests ; un geste à la fois.
23.11 : « un chrome a été ouver avec pour le test, jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app (connecté) dans le Chrome de débug : puppeteer-core `connect({browserURL:'http://127.0.0.1:9222'})`, ton onglet neuf, fenêtre 390 × 844 (deviceScaleFactor 2, toucher). Fin : `page.close()` de ton onglet, `browser.disconnect()`. JAMAIS `browser.close()`.
- Paquet du tour 30 : assets/index-KxF0Bcaa.js (vérifie-le : `curl -s https://brasserie-l-affinee.web.app/ | grep -o "assets/index-[^\"]*.js"`). aiTask mise à jour au tour 30. Si l app propose « mettre à jour », accepte.
- Carnet : Stocks › Matériel › Carnets. Crée « ZZ TEST — tour 30 », travaille dedans, supprime-le à la fin (Carnets revient à son nombre d'avant ; note-le avant).

## Ce qui a changé (à jouer)
- Étapes de lecture d'un lien (D448, son choix : work/missions/maquettes-carnet/CHOIX.md ; images de référence dans work/missions/maquettes-carnet/page/img/) :
  Début (v05-2.png + v06-1.png) ; Milieu, 3 étapes faites dont une douteuse (v03-2.png) ; Barre repliée quand on quitte pendant la lecture (v01-repliee.png, mais PLUS COMPACTE) ;
  Fin retrouvée à la réouverture (recharger la page pendant une lecture, puis revenir : v01-fin.png, v03-4.png, v05-6.png) ; Échec + bouton « Escalader » (base-echec.png, v03-5.png).
  Ses remarques : « pas assez dense » ; pas de « Garder HT / Prendre TTC » ; étape bloquée dite « page bloquée, lue par Google ».
- Fiche d'un article : libellés de caractéristiques en français (plus de « Kühlschranktyp », « Höhe »), Volume 242 l repris pour Galaxus ; pas de « Non publié par le vendeur : Volume » pour un houblon ; « photo non lue » quand la photo manque.
- Lien mort (brewtools 7712213) : « introuvable » dit, aucun article gardé dans la liste ni dans le compte, pas de « Déplacer ».

## Liens à coller (un par un, chacun dans le carnet ZZ)
1. https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562 (T25-8, T26-1)
2. https://www.sios.ch/Citra-USA-1-kg-Hopfenpellets-Typ-90 (T26-2)
3. https://hopfenmarkt.ch/produkt/hopfen/mosaic (T26-2)
4. https://brouwland.com/en/fermentation-vessels/660-brew-monk-stainless-steel-fermenter-30-l.html (page bloquée lue par Google, T26-3)
5. https://www.brewtools.com/brewing-system-accessories/7712213/steam-hat-b40pro-with-silicone-plug-and-seal (lien mort, T26-4 ; puis « Escalader » une fois)
6. https://www.landi.ch/shop/lagergestelle_170307/schwerlastregal-180-160-60-cm_105447 (BL-7)
7. https://www.gastro-held.ch/fr/products/armoire-refrigeree-professionnelle-eco-400-gn-11-snackh400tn (photo, prix net)
8. Le lien 1 collé une seconde fois (doublon : rien ajouté ; noter si la page est relue).


## Coût IA
≈ 0,01 CHF par lien, escalade ≈ 0,05 CHF ; plafond 0,30 CHF. Une ligne par appel dans work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl ({date, tache:'lireLien', url, modele, cout_chf estimé}).

## Constats du tour 28 à rejouer (corrigés au tour 30 ; T28-16 est au test du Calendrier)
 T28-1 | Coller le lien landi Schwerlastregal, recharger la page pendant la lecture, revenir au carnet → observé : carte « Lu pendant que l’app était fermée » juste, mais l’article est rangé dans le vrai carnet « Armoire de rangement malte » (pas
 T28-2 | Lire brouwland dans ZZ, quitter, ouvrir un autre carnet, toucher la barre repliée « Lu · Brew Monk… » → observé : la carte de fin (Photos absent, Contrôle absent, Compléter) s’ouvre dans le carnet Sol, sans nom de carnet ni d’article ; 
 T28-3 | Lien mort brewtools, toucher « Compléter » sur la carte d’échec → observé : aucun formulaire ; le lien mort devient l’article « ? brewtools.com · lecture… » compté (5 articles à comparer, avec Déplacer) et bandeau persistant « L’
 T28-4 | Lien mort brewtools, toucher « Escalader IA plus forte » → observé : rien de visible pendant 30 s, seul « arrêté à 1 sur 6 » devient « 1 sur 7 » et « 5 étapes » devient « 6 » ; ni attente, ni résultat, bouton toujours là ; attendu :
 T28-5 | Lien mort brewtools → observé : « adresse introuvable : le site n’existe plus » ; le site brewtools.com répond (HTTP 200), seule la page manque ; attendu : « la page n’existe plus (erreur 404) » comme base-echec 
 T28-6 | Coller sios Citra 1 kg et hopfenmarkt Mosaic → observé : Mosaic 7,25 CHF (100 g affichés) classé 1er devant Citra 72,50 CHF (1 kg), le même prix au kilo ; aucune quantité à côté du prix dans la liste ni la fiche ; attendu : prix ramené à l
 T28-7 | Fiche gastro-held ECO 400 → observé : « Non publié par le vendeur : Poids » sous « Poids net en kg 82 » ; colonne Poids « – » dans la comparaison ; attendu : poids 82 kg repris, aucune mention 
 T28-8 | Article landi Schwerlastregal 180 × 160 × 60 cm → observé : « Largeur 61 cm · Longueur 162 cm · Hauteur 6 cm », « Matériau Stahl, MDF » ; attendu : hauteur 180 cm, largeur 160, profondeur 60, libellés et valeurs en français 
 T28-9 | Étapes de lecture (sios, hopfenmarkt, landi, gastro-held) → observé : « 72.5 CHF (schema.org) », « microdata », « JSON-LD », « 3 · dont 2 du HTML, 0 de données embarquées », « port 4.9 CHF », « 913.9 CHF » ; attendu : valeurs dites 
 T28-10 | brouwland et doublon galaxus → observé : barre « 6 s » pendant la lecture puis « Lu · 3 s » ; doublon : « Lecture · 6 sur 6 » pendant 5 s puis « lu en 1 s » ; attendu : durée affichée égale au temps vécu 
 T28-11 | Coller un lien (brewtools mort, landi, gastro-held) → observé : « 5 articles à comparer », « Articles 5 » dès le collage, avant toute lecture ; pour le lien mort le compte retombe à 4 ; attendu : compte inchangé tant que l’article n’es
 T28-12 | Fiches brouwland et hopfenmarkt Mosaic → observé : libellés anglais « Full volume », « Height with extension legs », « Top opening », « Dump valve size », « Fermentable volume », « Size of valve », « Diameter at the top », « Total 
 T28-13 | Fiches galaxus, hopfenmarkt, gastro-held → observé : valeurs « Kühlschrank ohne Gefrierfach », « Fresh Zone Fach », « Mehrzweckhopfen », « +2 °C bis +8 °C » ; « 143.50 cm », « 11.4 % », « 68.5 cm » ; attendu : valeurs en français
 T28-14 | Fiche hopfenmarkt Mosaic → observé : Alpha 11.4 % au milieu de la grille, après Farnesene et Caryophyllene ; « Total oil 0.8ml » sans « /100 g » ; attendu : α, récolte, huiles totales en tête (penser-brasseur, L04) 
 T28-15 | Quitter le carnet ZZ pendant la lecture brouwland → observé : à la fin, bandeau « Rangé ici, à l’instant · Annuler » sur la liste des Carnets ; attendu : nom du carnet où l’article est rangé 
 T28-17 | Recoller le lien galaxus déjà rangé → observé : la page est relue en entier (6 étapes, environ 5 s, appel serveur) avant « Déjà dans ce carnet : rien de plus rangé » ; attendu : doublon reconnu au collage, sans relecture 

## Attention (leçon du tour 28)
- Après chaque rechargement ou geste qui écrit, relire la liste des VRAIS carnets : rien ne doit y atterrir (T28-1 a rangé un article dans « Armoire de rangement malte »).
- Points signalés par les voies : T28-3 « Compléter » ouvre la fiche d'un article introuvable (la saisie du nom doit y être possible) ; T28-6 le rang « 1er pour le prix » et Choisir lisent peut-être encore le prix affiché ; articles déjà rangés gardent leurs libellés étrangers (relire le lien les rend en français).
