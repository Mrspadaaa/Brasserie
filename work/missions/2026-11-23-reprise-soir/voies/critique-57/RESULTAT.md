OK — 2 problèmes, 0 bloquants

RESULTAT critique-57 : 2 problèmes (B 0, m 2, D 0) — soldes identiques oui — BUGS OK

Version : index-JrS2YtfY.js. Le curl avec ?nocache donne JrS2YtfY ; le service worker de mon onglet servait encore 2b8uLKQZ, et `maj.mjs` l'a amené sur JrS2YtfY. Chaque rechargement (`remettre.mjs`) a relu le paquet.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2256 bugs, 517 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (événements tactiles CDP). Chrome de débug 9222, mon onglet seulement ; `clore.mjs` fait page.close() puis disconnect, le navigateur reste ouvert. Aucun appel IA. Non couvert : 1280 et le thème sombre (consigne du DOSSIER).

## Avant = après (`avant.json`, `apres.json`, 12 champs sur 12 identiques)
- À dépenser : −463 (S53). En caisse : 1 145,00 (libre 1 145,00). Synthèse : 0,00 / 265,40. Opérations : 265,40 / 0,00 / 265,40. Solde de départ : 1 145,00.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027 ; le localStorage est identique (`remettre.mjs` l'a remis après chaque geste qui agrandit la fenêtre).
- Ses 16 choses de la frise : les aria (dates, courses, coût) sont identiques une par une. Aucun ZZ restant.

## Incidents de ma part (pas de l'app), réparés et vérifiés
1. Mon script a touché « Calendrier » dans la barre du bas alors que la feuille d'ajout la recouvrait. Le toucher est tombé sur « Ajouter » : deux choses, « Travaux · S48 » et « Travaux · S48 · 2 », ont été créées. Je les ai supprimées au toucher (fiche › Plus d'actions › Supprimer) et Travaux est revenu à « vide ».
2. `saut.mjs` posait un doigt sur Fruty, sa vraie barre, à 20 px du bord, avec 8 px vers l'intérieur et sans relâcher. Il a planté en plein geste. Le toucher suivant a fini le geste : avis « Fruty · S50 : −383 → −380 · Annuler », aussitôt Annulé. Contrôle : ses 16 choses sont identiques à l'avant, et « −463 CHF à dépenser (S53) » aussi. Ensuite, plus aucun geste sur ses barres : tout a été joué sur la barre ZZ, qui a la même géométrie que Fruty (fin à 389 px).
- Barre de test : « Travaux · S48ZZ TEST — barre D ». Le nom garde le préfixe de la feuille parce que mon select() n'a pas vidé le champ. Elle allait du 23 nov. au 10 janv., donc finissait au bord droit (50–389 px). Elle a été supprimée au toucher à la fin.

## Joué (journal.txt)
- Bord droit (`poi.mjs`, doigt à x = 390 − d, puis −49 px) : à d = 5, 15, 30 et 60, c'est la FIN qui bouge et le début reste au 23 nov. ; à d = 90, c'est le CORPS. Un toucher bref à 30 px ouvre la fiche (R30b-bref). Annuler remet la barre.
- Bord gauche (barre amenée au 16 nov., x = 1) : à 15, 30 et 60 px, c'est le DÉBUT qui bouge et la fin reste au 3 janv. ; à 90 px, c'est le CORPS.
- Sous 5 px de mouvement, rien ne bouge (J15, J30, J55 : inchangé).
- Boutons (`btn.mjs`) :
  - Plein écran pris à 12 et 30 px du bord ; rien à 4 px (dans la bande du geste retour, voulu).
  - « + » de Fêtes : la feuille Fêtes s'ouvre à x = 3 et à x = 40.
  - Chariot de « consomable » : sa carte s'ouvre à x = 3 et à x = 42.
- Vitesse (`vit.mjs`, barre ZZ tenue au bord droit, 2 s) :
  - à 30 px : de S51 à S12, soit 13 sem. (≈ 6 col./s) ;
  - à 4 px : de S51 à S17, soit 19 sem. (≈ 9 col./s) ;
  - la montée suit la profondeur, la frise s'agrandit (6 → 27 à 33 sem.), rien de cassé. Avant, c'était ~3 col./s : le ×2,5 est tenu.
- Fenêtre de l'en-tête : à 30 px, 9 → 27 sem. en 2,1 s ; à 4 px, voir le n° 1.
- Rejeu, regardé :
  - frise bord à bord et traits continus (Z-droite, Z-gauche ×3) ;
  - menu + complet (M-menu-plus) ;
  - centimes « Achats −2,40 » (C46-5) ;
  - marches nommées « Achats −2,40 », « Extincteur −80 » sur la courbe (C54-1).

## Corrigés rejoués
- **POI-1 vérifié** — en ligne index-JrS2YtfY.js (voir Joué ; reste le n° 2).
- **Q4-1 vérifié** — en ligne index-JrS2YtfY.js (barres ×2,5 avec plafond ; la fenêtre de l'en-tête, à fond, est le n° 1).

## Combien et quels problèmes ? 2
1. m — **K57-1** — Calendrier › en-tête, poignée de fin de la fenêtre tenue à 4 px du bord droit : la fenêtre s'emballe.
   - Elle passe de 8 à 19 sem. en 0,3 s, à 44 en 0,9 s, à 144 à 2 s. Lâchée, elle dit « 23 nov. 2026 – 9 févr. 2031 » (305 sem.). VC4-fin montre déjà « 23 nov. 2026 – 2 sept. 2029 ».
   - À 30 px, c'est raisonnable : 9 → 27 sem. en 2,1 s. Les barres plafonnent à 8 col./s, la fenêtre n'a pas de plafond.
   - Le brasseur : « Je tiens une seconde et je suis en 2029. »
   - Attendu : une montée bornée, qui permette de s'arrêter à 3 ou 6 mois.
2. m — **K57-2** — Frise, fin (ou début) d'une barre prise dans la part rentrée : au premier mouvement de 6 à 8 px, la fin saute sous le doigt.
   - Au bord droit, le 10 janv. devient le 7 janv. (doigt à 15 px), puis le 6 janv. (à 30 et 60 px). Au bord gauche, le 16 nov. devient le 19 ou le 20 nov.
   - La voie poignees annonçait « ne fait pas sauter la fin ». Sur une fenêtre de 6 mois, 60 px valent ~4 sem.
   - Le brasseur : « Je l'ai juste prise, pourquoi elle recule de 4 jours ? »
   - Attendu : la fin suit le mouvement du doigt depuis sa place.

Bloquants : 0. Pas de geste sans effet, de valeur fausse ni de texte illisible ; rien de sa maquette ne manque.

### Doutes (non comptés)
- Date dite et date posée, barre tenue à 4 px (≈ 9 col./s) : l'étiquette lue juste avant de lâcher disait S10, la barre a été posée en S11 (VB4c). Sur VB4e, l'étiquette disait S13 et la barre a été posée en S13 ; sur VB30 aussi, elles concordent. Course possible à grande vitesse (déjà vu en T11-3).
- Après Annuler d'une barre tirée au bord, la barre revient mais la frise reste agrandie (6 → 9 sem.).
- Pendant le geste sur la fenêtre, le bouton dit encore « 6 sem. » alors que le cadre dit 2029 (VC4-fin). Sur cette même capture (zoom de 3 ans), une barre de brassin montre « −5,44 + à venir pas brassée » sans son nom (Hefe).
- Le bouton plein écran est à 350–374 px au chargement, et à 344–368 px après un aller-retour en plein écran.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-S3-calendrier, C1-frise | clair | 390 | frise au repos, barre ZZ créée | 0 | 0 |
| R30-pendant, R30-1pas, R30b-bref | clair | 390 | fin prise au bord droit, toucher bref | 1 (n° 2) | 0 |
| VB4-fin | clair | 390 | barre tenue au bord, frise agrandie | 0 | 0 |
| VC4-fin | clair | 390 | fenêtre tenue au bord | 1 (n° 1) | 0 |
| PE12 | clair | 390 | plein écran | 0 | 0 |
| Z-droite, Z-gauche (×3) | clair | 390 | bords de la frise et de l'en-tête | 0 | 0 |
| M-menu-plus | clair | 390 | menu + | 0 | 0 |
| G0-feuille, G1-feuille-duree | clair | 390 | feuille d'ajout Travaux | 0 | 0 |

LEÇON PROPOSÉE : un script de geste qui touche la barre du bas doit d'abord vérifier qu'aucune feuille ne la recouvre (le toucher tombe sur « Ajouter »), et un geste en cours sur une vraie barre doit se finir par touchCancel dans un finally : un plantage laisse le doigt posé, et le script suivant écrit le changement.
