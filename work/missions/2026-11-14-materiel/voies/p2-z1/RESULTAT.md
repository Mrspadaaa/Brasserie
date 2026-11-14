ECHEC — G1 non atteint : zq1 construite et capturée (7 images), zq2 et NOTEs restent ; reprise écrite

- Fichiers écrits : `voies/p2-z1/build.mjs`, `voies/p2-z1/REPRISE.md`, `v1/z/zq1/parts.html`, `v1/z/zq1/etat.html`,
  `v1/z/zq1/zq1-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `v1/z/zq1/zq1-repos-1280.png` ; copies v0 dans `v1/z/zq1`, `v1/z/zq2`.
- G1 : non rejoué (zq2 sans captures neuves, NOTE sans « ## Passe 2 ») → PASSE ECHEC attendu.
- Captures ouvertes : `zq1-repos-390.png` seulement.
- Tests : sans objet (maquettes statiques).
- Prédiction : zq1 repos, « là je vois ce qui presse et quand » ; le reste n'est pas encore jugé.
- REPRISE : `work/missions/2026-11-14-materiel/voies/p2-z1/REPRISE.md` (plan zq2 décidé, défauts et greffes zq1 à reporter dans la NOTE).
- DÉCISION À PRENDRE : aucune.
- CONNAISSANCE : aucune.
- LEÇON PROPOSÉE : une voie de passe 2 à deux variantes et six états chacune dépasse le budget de 200 k d'un seul concepteur ; une variante par voie.

## zq1
OK — zq1 passe 2 finie : 7 captures ouvertes, défauts D1 à D6 corrigés, NOTE « ## Passe 2 »

- Fichiers : `v1/z/zq1/parts.html` (retouches), `v1/z/zq1/etat.html` (reconstruit), `v1/z/zq1/NOTE.md` (§ Passe 2) et 7 PNG
  (`v1/z/zq1/zq1-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `zq1-repos-1280.png`).
- Corrections de finition, toutes vues sur capture :
  1. Frigo et Réfractomètre se touchaient. Les nœuds passent à 26 px et restent à leur date ; les deux textes s'écartent de 3 px
     chacun (390 et 1280).
  2. Traiter : la limite « 30 j » traversait la carte du pH-mètre. La carte est opaque et passe au-dessus.
  3. Ajout : la loupe manquait derrière le voile ; elle est rétablie.
  4. Fiche : le blanc passe de 135 à environ 35 px. Ajouts : « 14.12 prochain, si étalonné · dans 30 j » en tête du fil et un
     étalonnage du 08.07.
- Contrôles :
  - `build.mjs zq1` → « zq1 assemblé » ;
  - `capt.mjs … zq1` → « zq1 : 7 images, CAPTURES OK » ;
  - G1 restreint à zq1 → « PASSE OK (zq1) ». G1 complet dépend de zq2, tenue par l'autre agent.
- Rien n'a été écrit hors de `v1/z/zq1/` et de ce fichier.
- Tests : sans objet (maquettes statiques).
- Prédiction : « Là, je vois ce qui presse et quand, et je coche sans ouvrir. »
- Reste : environ 200 px de blanc sous la fiche à 1280 ; « Cuve fermentation 100L » sur deux lignes dans la grille.
- DÉCISION À PRENDRE : aucune. CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.

## zq2
OK — zq2 passe 2 : D1–D6 corrigés, six états et 1280, sept captures ouvertes

- Fichiers écrits : `voies/p2-z1/zq2-parts.mjs` (générateur), `v1/z/zq2/parts.html`, `v1/z/zq2/etat.html`, `v1/z/zq2/NOTE.md`
  (« ## Passe 2 » ajoutée), captures `v1/z/zq2/zq2-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `v1/z/zq2/zq2-repos-1280.png`.
- Construction : `node voies/p2-z1/zq2-parts.mjs && node voies/p2-z1/build.mjs zq2` → « zq2 assemblé, 76864 car. » ;
  `node socle/capt.mjs v1/z repos,geste,traiter,ajout,vide,repos-1280 zq2` → « CAPTURES OK ».
- G1 (rejoué après zq2) : `PASSE OK`. `type="number"` : 0.
- Captures ouvertes : les sept. Corrigé au vu : texte pâle des étiquettes jaunes (conflit de classe `att` avec la fiche),
  « Cuve d'ébullition » sur le picto, « g » seul de Balance, « jamais étalonné » au bord, jambage de « Frigo » coupé,
  étiquettes passées débordantes de la fiche, mots en mono hors mesure (tolérance, prix connus).
- Tests : sans objet (maquettes statiques).
- Prédiction : « là je vois mon atelier, et les quatre trucs à faire sautent aux yeux » ; risque : la barre « Étalonné » qui masque l'Atelier.
- DÉCISION À PRENDRE : aucune.
- CONNAISSANCE : aucune.
- LEÇON PROPOSÉE : une classe d'état (`att`, `al`) partagée entre un composant de liste et la fiche casse la couleur en silence ;
  préfixer aussi par composant (`tg-att`), comme L26 pour les variantes.
