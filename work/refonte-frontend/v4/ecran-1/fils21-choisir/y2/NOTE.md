y2 · « La cuve, jour par jour » : on maintient le doigt, les jours de contact passent (K2, K3, K5).

- **Ce qui tient** :
  - **Le geste est la simulation.** Tant que le doigt reste sur « Maintiens », un jour passe toutes les 0,35 s ; un toucher ajoute un jour ; glisser sur le calendrier de la cuve remonte ou avance le temps. Le profil du jour se dessine face à la fin du plan (pointillé), et « depuis hier » dit ce que ce jour a changé.
  - **Preuve, jouée au doigt** (`jouer-y2.mjs`, `geste-y2.json`) : Citra 4 g/L après fermentation, tropical 0,1 cran à J0, 3,9 crans à J+1 (doigt gardé), 3,9 à J+5. La barre passe de 1 à 98 puis 99 px, et la page écrit « ~ Plus rien ne bouge. Le moteur arrête l'extraction à 3 j (H73) ». « Citra 3 j puis Galaxy 7 j » : Galaxy entre à J+4, « ensemble ≈ 69 % de la somme en tropical » (saturation partagée du moteur), puis plus rien jusqu'à J+10.
  - **Ce qui est vraiment faisable se voit** : sept jours de Galaxy n'ajoutent rien après le troisième ; la suite finit au niveau des deux ensemble pendant 3 j (tropical 3,9 crans contre 3,8, à 0,1 cran près).
  - **Vraies valeurs, qui changent avec le jour lu** sous la cuve : 24 h, l'essentiel est extrait (H73, OSU) ; 1 h = 96 h au panel, Cascade 1,43 g/L (E10) ; 2 j pour le 4MMP et le linalol (Eureka!, E08) ; au-delà de 3 j, aucun gain mesuré (H73). Plus bas : agitation, linalol extrait en 6 h de 43 à 89 % (E05). α et huile des houblons du plan dans l'en-tête et les voies.
  - **Ajout cumulé, levure, biotransformation** : six plans en grille sans trou (trois seuls, deux suites, « Citra + Galaxy ensemble » sur toute la largeur), actif ou après, quatre levures. La suite Citra → Idaho 7 lit les cas K4 du moteur pour les quatre levures ; l'ensemble, les cas K5 ; un plan hors des cas se calcule avec la courbe du moteur et le dit.
  - **Écart à la baseline** : la frise des moments devient un calendrier de cuve (fermentation active, après, blocs nommés par houblon et jours) ; le reste comme y1.
- **Ce qui casse** :
  - 154 mots au premier écran (70 indicatifs).
  - Le moteur extrait 97 % en 24 h (τ = 7 h) : tout se joue le premier jour, et le geste « maintenir » perd son intérêt après J+2. C'est ce que disent les mesures (E10, E08), mais le moteur va plus vite que E08.
  - Diamond n'existe que dans K4 : pour les autres plans, « inconnu ».
  - Le calendrier se lit en jours de cuve (J0 à J17) et le compteur en jours de contact (J+n) : deux échelles.
- **Contrôles** (indicatifs, joués une fois) :
  - COMMUN ECHEC 1 contrôle(s) : MOTS ECHEC (154 mots) ; les dix autres OK ;
  - LISIBLE OK (12 pictos, 2 mesurées, 9 simulées, 0 faute) ; SIMULATION OK (14 réglages) ; CUMUL OK ; ALPHA OK (3 voies sur 3) ; FICHE-BASELINE OK (Citra, 0 faute).
- **Pire contraste** : 5,18:1, « hors style » (#c2410c sur #fff).
- Généré par `generateur-y2.mjs` (socle de `../y1/socle/socle.mjs`). Captures : `captures/y2-390.png`, `y2-premier-ecran.png`, `y2-avant.png`, `y2-pendant.png`, `y2-apres.png`, `y2-suite-j4.png`, `y2-suite-fin.png`, `y2-ensemble-pomona.png`.
