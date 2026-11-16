OK — 53 images nouvelles montrées sur page2 et page3, rhabillage en tête des deux pages.

Fichiers écrits :
- work/missions/2026-11-14-brassins/page2/index.html (13 vignettes ajoutées, ligne de date)
- work/missions/2026-11-14-brassins/page3/index.html (40 vignettes ajoutées, ligne de date)
- work/missions/2026-11-14-brassins/page2/img/ (13 PNG copiés, `cp -n`, même nom)
- work/missions/2026-11-14-brassins/page3/img/ (40 PNG copiés, même nom)
- work/missions/2026-11-14-brassins/voies/pg4/ : RESULTAT.md, tests.txt, tests-g2-avant.txt, tests-g3-avant.txt, verif2-*.png, verif3-*.png

Critères (rejoués depuis la racine) :
- G1 : `PAGES OK` (avant la voie : `PAGES KO 53`).
- G2 : `PAGE OK (52 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- G3 : `PAGE OK (206 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Captures ouvertes : verif2-haut.png (mention de rhabillage en tête, lisible) et verif3-haut.png (idem).

Essais :
- G1 : 1 essai après vignettes et copie des images (vert à la 2e passe).
- G2 : 3 passes. Passe 1 `PAGE ECHEC` : images non chargées, cause `loading="lazy"` (le contrôle ne défile pas). Retiré des 53 nouvelles vignettes, passe 2 `PAGE ECHEC` (copie des PNG non faite à ce stade), passe 3 `PAGE OK`.
- G3 : même cause et même retrait, `PAGE OK` à la passe suivante.

Écart avec VOIE.md : `loading="lazy"` demandé, retiré. Le verifier ne défile pas, donc les images sous la ligne de flottaison ne se chargent pas et G2/G3 échouent. Les vignettes voisines n'ont pas cet attribut.

Douteux, à trancher par le pilote :
- Sur page3, 166 vignettes existantes ont `alt="…"<span>` (le `>` manque après alt). Le libellé et son `<span>` tombent dans la balise img. Le verifier passe quand même. Non vérifié à l'écran.
- Mes 40 nouvelles vignettes page3 reprennent ce même balisage pour rester identiques aux voisines. Correction globale possible : `"<span>` → `"><span>` sur page3 (206 lignes). Hors périmètre, non fait.
- Le rhabillage visuel (identité de l'app) n'est pas jugé ici, seulement la mention et le chargement.

Tests : aucune suite Vitest. Sortie des CHECK dans voies/pg4/tests.txt.

CONNAISSANCE : `verifier-page.mjs` ne défile pas ; une image `loading="lazy"` hors écran compte comme non chargée, donc ECHEC sur G2 et G3.

LEÇON PROPOSÉE : Recopier le balisage voisin a propagé un défaut (`alt="…"<span>`, 166 lignes page3). Règle : avant de copier un balisage voisin, le relire (ici `grep -c '"<span>'`) et le signaler au pilote ; et ne pas ajouter d'attribut que le contrôle de la voie ne peut pas charger (ici `loading="lazy"`).
