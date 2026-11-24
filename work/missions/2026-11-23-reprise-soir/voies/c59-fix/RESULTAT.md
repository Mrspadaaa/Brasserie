EN COURS (tenu au fil) — R35, C59-2 verts ; R36 7/8 (1 test cité) ; R37, R38 (reste) à faire

# RESULTAT c59-fix

## Plan par règle
- R35 (C59-1) : `rangerMaintenant()` reprenait tout `aReprendre` ; le bouton « Relire » du bandeau ne passe plus que les ids annoncés (`aReprendreVus`, messages du carnet ouvert). bandeauxCarnet.tsx, CarnetsVue.tsx. 4/4 verts (tests-r35.log). LE-1 intact (ouvrir ne relance rien).
- C59-2 : rangement.ts `ERREUR_PLAFOND` (/plafond de dépenses/) : ni reprise après répit ni boucle, avis `AVIS.pause` « IA en pause : plafond de dépenses atteint… » ; porté par le bandeau de reprise (`AReprendre.pause`), le retour (`poserAvis` texte), `EtatIA`. 2/2 verts (tests-c592.log).
- R36 (C59-4) : `Colonne.cible` (comparer.ts) : un critère qui dit une mesure sans borne (« 50 L ») classe par proximité (tri, domine, places) ; les critères à borne (au moins, plus de, max…) gardent plus/moins. 7/8 verts (tests-r36.log).
  - TEST CITÉ, jugé non satisfaisable sans vocabulaire par objet : « hors genre : un frigo de 50 L pile et une marmite de 45 L ». Même nombre, même caractéristique, même unité ; seul le NOM diffère (« Frigo vitrine » / « Marmite de brassage inox »). Le test 1 exige au contraire que « Maischekessel ZZ 50 L » (nom sans le mot « marmite ») batte « Marmite de brassage inox ZZ 60 L » : seul un dictionnaire d'objets (marmite = Maischekessel ≠ frigo) satisfait les deux, et src/domain/carnets l'interdit (B6, aucun gabarit par objet). Un seuil de tolérance (±10 %) les satisfait aussi mais fait battre un 50 L exact par un 45 L au nom proche : refusé.
- R37, R38 (reste) : voir plus bas.
