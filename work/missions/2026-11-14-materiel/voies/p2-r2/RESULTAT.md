REPRISE — passe 2 de rq3 et rq4 à moitié faite : rq3 dessinée, rq4 générée mais jamais capturée (contexte de l'agent au-delà de 200 k)

Tests : sans objet (maquettes statiques)

## Fait
- Copie v0 → `M/v1/r/rq3/` et `M/v1/r/rq4/` (la v0 n'a pas changé).
- **rq3** (`v1/r/rq3/etat.html`, écrit à la main) : les 6 états et le 1280 sont dessinés ; les captures ont été faites une fois, avant les dernières retouches.
  - Défauts corrigés :
    - D1 : « retard 6 j » et « panne 9 j » écrits en toutes lettres.
    - D2 : la date est toujours à gauche, l'état et le compteur à droite (« dû · 5 brassins sur 5 », « jamais étalonné » sur 2 lignes).
    - D3 : le picto du rayon remplace le carré ; le mot « passé » est posé sous les hachures ; les teintes ne servent plus qu'à l'alerte, chacune avec son mot.
    - D4 : les cadrans sont remplacés par « Écart aux tampons », une règle de tolérance par tampon (dérive en 4 points, avec légende et verdict).
    - D5 : historique complet, badges « date inconnue » et « prix inconnu ».
    - D6 : coque à 36 px, logo 🍺, soleil en cave.
  - Ajouts :
    - Un geste « fait » de 44 px.
    - Une puce « À traiter 4 », où le densimètre jamais étalonné est compté.
    - Une ligne de pied « Parc 1 739 CHF · sur 2 prix connus · Déjà possédé · Projets ».
    - Les « sans entretien prévu » sont regroupés en puces.
    - Dans la fiche, la ligne « Utilisé dans 6 brassins ».
  - Les états :
    - traiter : ligne pH-mètre éteinte en vert, puce « À traiter 3 », bandeau « Annuler ».
    - ajout : feuille « Nouveau matériel » ; Achat, Déjà possédé (déplié, avec formulaire) et Projets.
    - vide : frise réduite au trait 14.11, deux boutons et des puces d'ajout rapide.
    - 1280 : frise de 60 jours, tableau « Par rayon » à côté de la fiche.
  - Retouches faites après la dernière capture, jamais vues depuis :
    - nowrap sur les valeurs de l'historique ;
    - verdict ajouté sous la règle de tolérance ;
    - ligne « Parc » ajoutée dans l'état traiter ;
    - classe `rq3-sel` renommée `rq3-mois` (elle cassait la feuille d'ajout).
- **rq4** : générateur `voies/p2-r2/gen-rq4.mjs`, avec `rq4.css` et `rq4-symboles.svg` (pictos balance et réfractomètre redessinés).
  - Étagères à 3 colonnes, étiquette en haut de chaque tuile (« panne 9 j », « retard 6 j », « dû · 5 brassins », « jamais étalonné », « dans N j »).
  - Bande « fait » de 44 px ; cases « acheter / déjà possédé » de 44 px.
  - Ligne Parc avec la légende de la jauge.
  - Les 5 rayons séparés.
  - États :
    - traiter : tuile éteinte et bandeau.
    - ajout : feuille préremplie sur Mesure.
    - vide : 5 étagères avec leur case.
  - Fiche en carnet : légende de la grille des 12 mois, « dernier 4,02 · ±0,10 », boutons « Payer un entretien » et « Étalonné », plis.
  - 1280 : 6 tuiles par étagère, carnet à droite.
  - Rien de tout cela n'a encore été capturé ni regardé.

## Reste à faire (agent neuf, Opus)
1. `cd M && node voies/p2-r2/gen-rq4.mjs && node socle/capt.mjs v1/r repos,geste,traiter,ajout,vide,repos-1280 rq3 rq4` → CAPTURES OK, puis 14 images.
2. Ouvrir chaque image ; pour en voir plusieurs à la fois : `node voies/p2-r2/cote.mjs <sortie.png> <img…>`. Corriger débordements, chevauchements, noms tronqués, texte sous 12 px.
   - rq4 : à vérifier en premier : hauteur des tuiles ; noms sur 2 lignes au plus ; feuille d'ajout qui tient dans 844 px ; disposition de `.rq4-wrow` à 1280.
   - Toute retouche de rq4 se fait dans le générateur, puis se régénère.
3. Ajouter « ## Passe 2 » aux deux NOTE.md, avec les défauts corrigés D1 à D6, les greffes, les champs neufs et ce qui reste ; puis rejouer G1 (`PASSE OK`).
4. Remplacer ce fichier par la ligne 1 « OK — … », puis les preuves.

## rq4 (finition, agent Opus du 14.11)
OK — rq4 passe 2 : sept captures regardées, débordements corrigés, NOTE « ## Passe 2 »
- Fichiers : `voies/p2-r2/gen-rq4.mjs`, `voies/p2-r2/rq4.css`, `v1/r/rq4/etat.html`, `v1/r/rq4/NOTE.md`, 7 PNG.
- Captures (toutes ouvertes) : `v1/r/rq4/rq4-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `v1/r/rq4/rq4-repos-1280.png`.
- Corrigé au regard : ligne Parc coupée sur deux lignes (légende raccourcie, nowrap) ; espaces élargis des nombres en chasse fixe
  (« 1  739  CHF », « 6  j ») ; noms collés à la bande « fait » (marge 7 px) ; étiquette tronquée de la tuile éteinte
  (« prochain 14.12 ») ; « Mesure 1 sur 2 » → « Mesure 1 · 1 fait » ; vide : « 0 » d'Embouteillage sur la case et colonnes
  désalignées (colonne fixe 138 px, cases 80 px) ; 1280 : recherche sur 3 lignes, Projets sur 2 lignes, « À traiter » coupé ;
  fiche : 250 px de blanc réduits par la ligne Rythme.
- Capture : `node socle/capt.mjs v1/r repos,geste,traiter,ajout,vide,repos-1280 rq4` → CAPTURES OK (7 images).
- Prédiction : « Les étagères, je comprends tout de suite ce qui est à faire ; mais je dois défiler pour voir l'atelier. »

## rq3 — finition (agent neuf, Opus, 14.11)
OK — rq3 passe 2 : 7 captures refaites et ouvertes, NOTE « ## Passe 2 », PASSE OK (rq3)

- Fichiers : `M/v1/r/rq3/etat.html` (retouches), `M/v1/r/rq3/NOTE.md` (« ## Passe 2 »), 7 PNG recapturés.
- Corrigé à la relecture des captures :
  - 1280 : fiche coupée par la barre du bas (boutons invisibles), historique sans le 07.07, verdict de tolérance absent → actions « Payer un entretien » et « Étalonné » (44 px) en tête de fiche, colonne fiche 464 px, ligne 07.07 et verdict ajoutés, Notes et Gestion sur une ligne. Nom « pH-mètre » coupé en deux → nowrap.
  - « 9  j », « 1  739 » : blanc de chasse fixe → unité hors police mono, parc en chiffres tabulaires (« 1 739 CHF »).
  - « · Démo » (fournisseur de jeu d'essai) retiré de l'historique : il faisait passer la ligne sur deux rangs.
- Contrôle : `capt.mjs v1/r repos,geste,traiter,ajout,vide,repos-1280 rq3` → `rq3 : 7 images` / `CAPTURES OK` ; G1 limité à rq3 → `PASSE OK (rq3)`.
- Captures : `M/v1/r/rq3/rq3-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `M/v1/r/rq3/rq3-repos-1280.png` (toutes ouvertes).
- Prédiction : « Là je vois tout de suite ce qui est en retard et quand, et la règle du pH-mètre je la comprends. »
- DÉCISION À PRENDRE : aucune. CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.
- G1 (rejoué depuis la racine) : PASSE OK (rq3 et rq4).
