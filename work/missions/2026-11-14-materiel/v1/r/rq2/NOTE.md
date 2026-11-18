# rq2 — tiède : d'abord ce qui est à faire, puis le reste

Idée : en tête, quatre cartes « À faire » avec leur verbe (Réparée, Étalonné, Détartré) en bouton de 44 px ; dessous, le reste en
lignes d'une ligne avec une jauge d'intervalle et les jours restants. Fiche en feuille (comme l'app) avec une frise des étalonnages.

- Problèmes résolus : P1, P2, P3 (verbe sur la carte), P4, P7 (13 appareils au premier écran), P8, P11, P12, P15 (Achat et Déjà
  possédé dans l'en-tête du reste), P16, P21, P24 (× sans anneau), P28. M1, M2, M3 (panne datée), M4 (étalonner dans la fiche, écart
  en direct), M5, M10 (frise).
- Champs neufs : comme rq1 ; plus la saisie d'étalonnage dans la fiche.
- Frise : chaque zone dite (intervalles tenus en bleu clair, retard hachuré, échéance manquée en losange, 14.11 en trait, « prochain
  si étalonné aujourd'hui » 14.12 en pointillé).
- Acquis écartés : rayons pliables d'Articles (remplacés par le tri par urgence) ; picto de rayon gardé sur chaque ligne.
- Contrôles : COMMUN OK ; MOTS 23.

## Passe 2

Source : `src.mjs` (fragment), assemblé par `voies/p2-r1/build.mjs` (coque de l'app, 390 et 1280). Captures :
`rq2-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `rq2-repos-1280.png`, toutes ouvertes.

- Défauts corrigés
  - D1 : « À faire » en un seul panneau, rangées de 52 px (4 × 52 = 208 px au lieu de 248), séparées par un filet.
  - D2 : jauges du reste d'une seule teinte neutre (écoulé) sur la piste du rythme ; le rayon passe par le picto
    coloré, comme Articles. Légende au-dessus de la colonne : « écoulé · rythme · reste ».
  - D3 : pH-mètre et densimètre portent « Étalonner › » (ouvre la saisie des deux tampons, écart en direct) ;
    « ✓ Réparée » et « ✓ Détartré » restent des gestes en un toucher, annulables.
  - D4 : chiffre en mono, « j » en texte après une espace fine (« 9 j », « 6 j ») ; « en panne 9 j », « retard 6 j ».
  - D5 : feuille du pH-mètre remplie : rythme, état Bon, utilisé dans 8 brassins, dépenses, notes, gestion
    (vendu, réformé, supprimer). Il reste environ 35 px sous Gestion.
  - D6 : coque commune de la série (en-tête 36 px, logo de l'app, soleil en cave).
- Retouches communes : « retard 6 j » et « panne 9 j » écrits ; le densimètre jamais étalonné compte dans « À faire 4 » ;
  aucun mot de développeur ; légende pour la piste et l'écoulé (liste) et pour tenu / retard / échéance manquée /
  prochain (frise) ; gestes de 44 px ; Achat, Déjà possédé et Projets d'équipement visibles au repos.
- États
  - traiter : « Détartré » touché, la carte du refroidisseur s'éteint (barrée, bouton vert), « À faire 3 », le
    refroidisseur réapparaît dans « Le reste 10 » à sa place (rythme neuf, reste 5 br.), teinté ; toast
    « Refroidisseur détartré · prochain dans 5 brassins · Annuler ».
  - ajout : feuille « Acheter du matériel » (Dépense, intent matériel) : Achat / Déjà possédé, Pour quoi ?, Total TTC
    89,00 CHF, payé le 14.11.2026, rayon par pictos (Embouteil-lage coupé, 12 px), état Neuf, rythme d'entretien,
    ticket, fournisseur ; derrière, la liste défilée jusqu'à « Le reste », loupe gardée, Achat enfoncé.
  - vide : « À faire » absent ; lignes fantômes, les cinq pictos de rayon, Enregistrer un achat et Déjà possédé au
    centre ; Projets en haut ; aucune phrase.
  - repos-1280 : « À faire » et le journal du matériel (9 dates : pannes, étalonnages, filtres) en colonne à gauche ;
    « Le reste » en tableau à droite (entretien et rythme, échéance, jauge, reste), recherche et Achat en tête.
- Pied : « parc 1 739 CHF · sur 2 prix connus » (cuve d'ébullition et moulin), jamais un total sans sa base.
- Ce qui reste : en cave, la piste du rythme est faible (ln2 à 60 %) ; le vide laisse un blanc au-dessus des fantômes
  (bloc centré, voulu par la synthèse) ; à 1280, environ 150 px vides sous le tableau ; « Le reste » au-dessus du pli
  à 390 tient 9 lignes, au-delà de 13 appareils la liste défile.
- Contrôles : G1 de la voie (voir RESULTAT.md). Mots non recomptés en passe 2 (premier écran : 4 sous-lignes,
  4 verbes, en-têtes, légende, 4 « sans rythme », pied).
