# Reprise p2-z1 (14.11, contexte du premier agent épuisé)

## Fait
- `voies/p2-z1/build.mjs` : coque commune (en-tête 37 px dont bordure, lune en clair / soleil en cave, sous-nav, barre du bas
  42 px, pastille 24, coque large `?l=1280` : « Ce mois », onglets à icônes, barre centrée, + à droite). Assemble
  `v1/z/<id>/parts.html` (sections `<!--@CSS-->`, `<!--@VUES-->`, jetons `{{TETE}}`, `{{BAS}}`, `{{FBAR}}`), préfixe `ZZ-` → id par
  split/join. Vues : `data-vue="repos|geste|traiter|ajout|vide|repos-1280"`. Lancer : `node voies/p2-z1/build.mjs zq1 zq2`.
- v0 copiés dans `v1/z/zq1`, `v1/z/zq2`. zq1 : `parts.html` écrit, construit, 7 captures faites (CAPTURES OK).
  Seule `zq1-repos-390.png` ouverte : bonne (13 appareils, À traiter 4 avec densimètre, échelle 3,5 px/j depuis aujourd'hui,
  bande « 30 j », coupure avant mars, nœuds-silhouettes posés sur le rail, aucune courbe, pied Déjà possédé / Projets / parc).
  Défaut mineur vu : Frigo et Réfractomètre se touchent (8 j × 3,5 = 28 px) ; acceptable, ou passer la ligne à 26 px.

## Reste
1. zq1 : ouvrir geste, traiter, ajout, vide, repos-cave, repos-1280 ; corriger débordements ; NOTE.md « ## Passe 2 » :
   D1 soleil en cave ; D2 échelle y = 3,5 j − 14 depuis le point aujourd'hui (17 j → 45,5 px, 36 j → 112, 44 j → 140,
   coupure après 50 j) ; D3 densimètre « jamais étalonné » au-dessus d'aujourd'hui, À traiter 4 ; D4 Achat 44 px, Déjà possédé
   et Projets en tuiles 44 px au pied ; D5 plus de courbes : le nœud est sur le rail, la ligne à sa hauteur ; D6 fiche :
   dépenses dépliées (3 lignes, 37,40 CHF sur 2 prix connus), « utilisé dans 7 brassins » (champ neuf). Greffes : étapes
   rincer / pH 7 / pH 4 / ranger (zq4), flacons teintés (zq2), bande 30 j sur le fil (forme de la frise rq3), silhouettes
   à ombre sur les nœuds (zq2), tuiles toujours visibles (uq4). Valeur comptable : pH-mètre non immobilisé, donc rien
   (seule la cuve d'ébullition le serait ; non dessinée). Données nouvelles : Solution KCl 22.05 12,50 CHF Démo ;
   prochain 14.12 (+30 j) ; Pompe de transfert 01.11 + 3 mois = 01.02, dans 79 j.
2. zq2 (non candidate : défauts D1 à D6 + états) : écrire `v1/z/zq2/parts.html` au format ci-dessus (reprendre le CSS et la
   fiche du v0 `parts.html`, préfixe `zq2-` → `ZZ-`). Décisions prises :
   - grille de 4 colonnes, zones à libellé horizontal ; un appareil à traiter (pompe, refroidisseur, pH-mètre, densimètre)
     occupe 2 colonnes, son étiquette pendue À CÔTÉ du picto (D1) ; texte des étiquettes #141210 imposé sur fond fixe
     dans les deux thèmes (D2) ; zones : Brassage [pompe×2][cuve éb.][cuve ferm.] / [refroid.×2][moulin][Ajouter] ;
     Mesure [pH×2][réfr.][balance] / [dens.×2][Ajouter×2] ; une rangée Embouteillage | Stockage | Atelier (cinq
     catégories, D4) ; « dans 17 j » en ligne sous le nom (jamais « 17 j » seul) ; noms à 8 px des bords (D6).
   - barre : Chercher, À traiter 4, Achat 44 px (D5) ; pied : Déjà possédé, Projets ↗, parc 1 739 CHF · 2 prix connus.
   - fiche : grande étiquette 170 px « retard 3 j » insécable (D3), flacons, étiquettes passées, rythme et état, dépenses
     dépliées, « utilisé dans 7 brassins ».
   - traiter : seules les étiquettes allumées, silhouettes à 35 % ; pH-mètre devenu étiquette blanche « ✓ étalonné ·
     dans 30 j », barre « Étalonné · prochain 14.12 · Annuler ». ajout : Ajouter de Mesure touché → feuille « Ajouter en
     Mesure » : Enregistrer un achat / Déjà possédé (catégorie Mesure préremplie), Projets ↗. vide : panneau nu, cinq cases
     Ajouter. 1280 : panneau large (5 zones, 8 colonnes) à gauche, fiche pH-mètre à droite.
3. `node voies/p2-z1/build.mjs zq1 zq2` puis `node socle/capt.mjs v1/z repos,geste,traiter,ajout,vide,repos-1280 zq1 zq2` ;
   ouvrir chaque image ; NOTE « ## Passe 2 » pour zq2 ; GATES G1 (PASSE OK) ; RESULTAT.md.
