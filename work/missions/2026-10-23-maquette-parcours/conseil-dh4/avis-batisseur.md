(Sonnet)

Le socle compte déjà a1 en React (`src/ecrans/dryhopper/NOTE.md`) : frise de 28 crans en direct, 40 ms à froid, 0,9 ms par cran neuf.

**Coût de portage, du plus léger au plus lourd.**
1. **p4a4** : le moins cher ; reprend `BarreStyle`, ajoute quatre cartes (les quatre étapes que `frise.ts` calcule déjà) ; « −21 / −9 / −1 » sont des écarts à ★, dérivés ; ni SVG ni calcul neuf. Reste à combler 73 px de vide.
2. **p4b2** : moyen ; les courbes lisent `points` ; un SVG et une loupe alignée sur le rail (risque : retard du doigt déjà vu sur a1, ×2,7) ; floral et baies se confondent à J+7.
3. **p4b1** : un second calcul par cran (~56 appels à `simulerCas`), acceptable en Web Worker.
4. **p4a6** : Pomona à chaque cran, ce qui recoupe l'écran Levure ; le rail y a perdu ses étapes.
5. **p4b3** : agenda de 88 px, petit ; courbe de densité « une forme type, pas sa mesure », que le moteur ne fournit pas (`frise.ts` n'utilise pas `parJour`) : la hachurer ou la lier à la levure choisie.

**Hors ligne** : tout se calcule dans le navigateur. Seul risque, le téléphone (« 4 à 6 fois plus lent », non mesuré) : mesurer la frise sur un vrai téléphone avant de choisir une forme.

**Le critique a manqué** : le classement mêle utilité et faisabilité ; il greffe un graphique de p4b2 dans p4a4 (le SVG que p4a4 évite) et propose un intervalle de confiance sans donnée moteur.

**À montrer** : p4a4, p4b2, p4b1, p4a6, p4b3 corrigée. Le choix revient au brasseur ; rien dans la maquette avant son choix ; les greffes lourdes se montrent séparément.

Position : autre voie : montrer 4 à 5 candidates dans l'ordre p4a4, p4b2, p4b1, p4a6, p4b3 ; ne greffer que ce qui n'ajoute ni SVG ni donnée inventée ; mesurer d'abord la frise sur un vrai téléphone.
