# Dossier — test en ligne du tour 28 (23.11 soir)

## Consignes du brasseur (work/missions/SUIVI.md, mot pour mot, en vigueur)
1. « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! » (07.11).
2. « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle » (07.11) : chaque actionneur, sur des « ZZ TEST — … » que tu crées ; regarder seul = « non couvert ».
4. Gemini dans les tests : « oui Normal, ça fait partie des test » (08.11).
8. « Non c'était des exemples ils doivent TOUT tester... » : chaque actionneur, capture avant/après, effet sur tout ce qui en dépend ; chaque résultat plausible en vrai.
9. Son Chrome sert aux VRAIS tests ; un geste à la fois.
23.11 : « un chrome a été ouver avec pour le test, jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app (connecté) dans le Chrome de débug : puppeteer-core `connect({browserURL:'http://127.0.0.1:9222'})`, ton onglet neuf, fenêtre 390 × 844 (deviceScaleFactor 2, toucher). Fin : `page.close()` de ton onglet, `browser.disconnect()`. JAMAIS `browser.close()`.
- Paquet du tour 28 : assets/index-CoXAhg_q.js (vérifie-le : `curl -s https://brasserie-l-affinee.web.app/ | grep -o "assets/index-[^\"]*.js"`). aiTask mise à jour au tour 28. Si l app propose « mettre à jour », accepte.
- Carnet : Stocks › Matériel › Carnets. Crée « ZZ TEST — tour 28 », travaille dedans, supprime-le à la fin (Carnets revient à son nombre d'avant ; note-le avant).

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

## Calendrier (CALP-5, non vérifié faute de geste)
Crée un événement « ZZ TEST — barre », glisse sa barre de quelques jours : l'étiquette de durée ne doit pas couvrir la barre. Supprime-le ensuite.

## Coût IA
≈ 0,01 CHF par lien, escalade ≈ 0,05 CHF ; plafond 0,30 CHF. Une ligne par appel dans work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl ({date, tache:'lireLien', url, modele, cout_chf estimé}).
