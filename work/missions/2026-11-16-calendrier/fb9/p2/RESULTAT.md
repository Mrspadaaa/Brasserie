OK — fb lisible au repos : 1 chiffre, Maintenant, filtres nommés, appui long épingler/filtrer

Fichiers écrits (tous dans `fb9/p2/`) : `src.html`, `app.js`, `build.mjs`, `proto.html`, `capt.mjs` (copie adaptée de p8/capt.mjs), `GESTES.md`,
`cap/` (128 fichiers : 49 états × clair et cave à 390, 8 à 844, 6 à 1280, journaux, `choix-epingle.png`). p1 et fl/fb non touchés.

## Sorties décisives
- `node fb9/p2/build.mjs` → PROTO OK, 88 Ko (refuse `type="number"` et tout picto absent).
- `capt.mjs` 390 (49 états, clair et cave), 844 (8), 1280 (6) → CAPTURES OK, 0 erreur de page.
- Clavier : `clavier:false` et `nombre:0` dans les 49 états. Seul accès : « Autre… » / « Taper ».
- Repos 390 (journal-390) : un seul 166 ; plus petit texte 14 px ; première barre à 40 % (p1 : 63 %) ; en-tête collé 42 px (84 pendant un geste) ;
  44 mots visibles dont 11 dans l'axe des semaines et 6 dans la barre du bas, soit 33 hors axe (p1 : 166). 14 genres de l'app dans le DOM.
- Paysage 844 : une bande de 48 px, Maintenant en colonne gauche, frise de 48 à 390 px (88 % de la hauteur), première barre à 31 % (p1 : 75 %).
- 1280 : courbe dépliée, Maintenant sur 3 colonnes, 9 filtres icône + mot visibles, fiche en panneau latéral.
- Gestes réels (journal) : t2pose « 166 → −374 · Malt groupé 2 posé · S48 → S51 · besoins › » ; t5pose « 166 → 386 » ; t6pose « Blonde · S47 → S49 » ;
  t7annuler « 166 → 706 · Malt groupé retiré » ; t10 « ★ Marché de Noël épinglé » ; conflitok « 166 → 154 · Munich 4 kg commandé » ;
  horsligne « Hors ligne · Blonde reste en S47 » ; direpose « Sols posé · S20 → S40 · 5 j ».
- `controle-panel` (repos, t2, t7menu, t13, cherche, dire, liste à 390) → PANEL ECHEC sur la diversité seule (remplissage médian 0,71 OK ;
  paires presque identiques 10 %) : ce sont des états d'un même écran, le contrôle vise une série v0. Non applicable ici, à juger par le pilote.
- `controle-choix.mjs` : aucun écran Calendrier au registre `ecrans.json` (choix fb non encore enregistré) ; fb tenu par captures côte à côte (p1/fl).

## Corrections des 3 juges
1. Munich : 4 kg pour un Porter de 100 L (exemple), commande −12. Volume posé à 100 L pour toute la fixture (Blonde −148, malt groupé 200 kg −540).
2. Repos : courbe en fil sous le chiffre, rangée collée seulement hors écran, une valeur par semaine (charge rouge seule), aucun « exemple ».
3. Paysage : voir chiffres ci-dessus.
4. Appui long immobile : Épingler, (Favori en B), Seulement ce genre, Dupliquer / Fait, Retirer en dernier ; appui long + glisser : corbeille.
5. Épingle/étoile : A (une ★) par défaut, B (`?ep=b`) montré ; `cap/choix-epingle.png` (menu A, menu B, A épinglé).
6. Filtres : icône + mot, compte sur le filtre actif seul. 7. Tri : libellé = ordre actif, 3 puces. 8. Doublons : « Malt groupé 2 », un seul « au plus serré ».
Ajouts : recherche sans clavier, récurrence (puces, ↻, « Sauter décembre »), rappel par genre, vue liste, hors ligne, carnet (+ Idée, voie Idées,
« Prévoir à la caisse »), veille −8 %, lien partagé (L1), raccourcis d'icône (L2), voix (L3), propositions ✓ (L5), essai 5 tâches et chrono (L7),
étapes du brassin closes d'un toucher et « Démarrer › compagnon », passage en cuve 2 d'un toucher, panne, starter, livraison, TVA, tâche de l'Atelier.

## Captures
`cap/p2-repos-390.png`, `p2-repos-cave-390.png`, `p2-t2-390.png`, `p2-t2pose-390.png`, `p2-t6-390.png`, `p2-t7-390.png`, `p2-t7menu-390.png`,
`p2-t10b-390.png`, `p2-t13-390.png`, `p2-t13b-390.png`, `p2-cherche-390.png`, `p2-liste-390.png`, `p2-dire-390.png`, `p2-essaifin-390.png`,
`p2-icone-390.png`, `p2-repos-844.png`, `p2-t2pose-844.png`, `p2-repos-1280.png`, `p2-t13b-1280.png`, `choix-epingle.png` (toutes ouvertes).

Écarts restants : la voie Idées pose « Idée · achats » sans nom (dictée ou carnet pour le nommer) ; le + volant couvre le bord droit de la dernière colonne ;
une capture `t2geste` montre la pose sans fantôme d'argent (l'effet s'affiche au lâcher) ; l'axe des semaines compte 11 mots.

Prédiction : « Là je vois tout de suite le 166, la facture et le fût à régler en un clic, la frise arrive vite ; l'appui long c'est enfin épingler/filtrer. »

DÉCISION À PRENDRE : (1) épingle A ou B (`cap/choix-epingle.png`) ; (2) fondre Bord dans le Calendrier (ouverture sur Calendrier ; Bord gardé ici) ;
(3) volume de référence d'un brassin (100 L posé en exemple).
CONNAISSANCE : un écouteur tactile posé sur le document ne reçoit plus les touchmove si le rendu remplace la cible ; les poser sur la cible même.
Et un voile (scrim) créé à l'appui long reçoit le clic de fin de toucher : à neutraliser.
LEÇON PROPOSÉE : aucune
