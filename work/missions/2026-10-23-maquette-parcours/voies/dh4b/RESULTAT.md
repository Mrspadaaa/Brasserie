OK — cinq chaudes p4b1 à p4b5 sur a1, trois captures chacune, COMMUN, UNE-QUESTION et MOTS verts

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b-commun/socle-p4b.mjs` : reprend tel quel le socle d'a1
  (données du moteur, pictos, fiche, en-tête, contexte, lentille, légende) et en fait un rail réutilisable (géométrie, geste,
  loupe d'a1 ; classes `p4r-`) ; `capturer.mjs` : les trois captures au doigt et `geste.json` par variante.
- `passe4/p4b1..p4b5/{generer.mjs, etat.html, NOTE.md, geste.json}`, classes préfixées par id (L26).
- `passe4/captures/p4b<n>-premier-ecran.png`, `-pendant.png`, `-apres.png` (390 × 844), plus `p4b2-touche-actif`,
  `p4b3-apres-7j`, `p4b4-contre-apres`, `p4b4-contre-apres-actif`.

## Une ligne par variante (toutes chaudes, toutes sur a1 : rien de son plancher n'est perdu)
- **p4b1 « Gardé · emporté »** — chaleur chaude ; améliorations 2, 4, 6 ; greffes d2, d1, f6, loupe d'a1. Tient : chaque
  barre montre ce que le moment garde et ce que la chaleur (flamme, hachure) ou le CO₂ (bulles, pointillé) emporte, les
  pastilles disent la perte par étape (60′–0′ −21…−9, WP −9, actif −1, après 0). Casse : résineux déjà hors style, sa
  queue ne se voit que dans le chiffre ; cause « chaleur » unique sur les 13 crans d'ébullition.
- **p4b2 « Le brassin en courbes »** — chaude ; améliorations 1, 3, 4 ; greffes g1, f5/g6, c7, e2. Tient : courbes de gain
  floral / baies / résineux sur les 24 moments, points calculés pleins et crans interpolés pointillés, amertume en colonnes
  orangées puis hachurées à cru, bosse « levure active », rail aligné sous l'axe, loupe ×5,9. Casse : floral et baies se
  confondent à l'actif ; pastille du pouce masquée.
- **p4b3 « L'agenda du brassin »** — chaude ; améliorations 3, 5, 1 ; greffes f5, g6, e2, g4. Tient : calendrier
  brassage / WP / J+1…J+14 avec la densité de la levure, le houblon posé où il entre, la bande de contact tirée par le pouce
  (plus de boutons de jours), bande pâle « sans gain » ; loupe ×5,6. Casse : agenda serré (11 px) ; la loupe masque la ligne
  mesuré / Levure pendant le geste.
- **p4b4 « Le duel contre ★ »** — chaude ; améliorations 6, 2, 4 ; greffes b4, a8, d1/d2, g4. Tient : barres face à face,
  le moment à gauche, ★ ou « après » à droite (lecture seule), l'écart chiffré au centre par famille, hachure chaleur / CO₂
  en « contre après » ; loupe ×5,6. Casse : barres plus courtes qu'a1 ; à ★ une colonne de « = ».
- **p4b5 « Cinq moments sous le pouce »** — chaude ; améliorations 1, 5, 6 ; greffes e3, c7, e2. Tient : cinq colonnes
  alignées, le milieu ouvert et chiffré, ● / ○ mesuré, « = » sans gain, voisins = jours en dry hop ; la figure est la
  loupe (×3,7). Casse : barres de voisins à 44 px ; colonnes vides aux bouts du rail.

## Critères
- G1 : `PASSE-BIEN-5` (page, NOTE avec chaleur, trois captures par variante).
- G2 : `COMMUN OK` sur p4b1 à p4b5 (`--sans=mots`) ; trois corrections en route : picto floral hérité du bleu CO₂ et deux
  épaisseurs d'icônes (p4b1, S2/S4 de standard), `data-role="zone"` manquant (p4b4, p4b5, S2 d'au-style), contraste 4,43
  du chiffre ouvert (p4b5).
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)` sur les cinq (contexte houblon, dose, levure, base).
- G4 : `MOTS OK` : 29, 35, 38, 42, 40 mots hors données (a1 : 77).
- G5 : `NOTE OK` (ce rapport).
- Hors critères, pour information : `controle-panel` sur les cinq premiers écrans donne PANEL ECHEC (remplissage médian
  0,49, ressemblance 0,92) ; a1 passe 3 vaut 0,64. Les cinq gardent l'en-tête, le contexte et la lentille d'a1 (règle n° 1)
  et un écran unique sans rubans : la mesure, étalonnée sur des panels v0, lit cela comme un squelette commun.

## Captures (toutes ouvertes, L12, à côté d'`a1-premier-ecran.png` et `a1-toucher-390.png`)
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/captures/p4b{1..5}-{premier-ecran,pendant,apres}.png`. Geste
joué au doigt dans Chrome (touchStart, six touchMove, touchEnd) d'actif · 2 j à 20′ : loupe ×5,6 / ×5,9 / ×5,6 / ×5,6 /
×3,7 (figure), aucune erreur de page, 390 px sans défilement horizontal, 1,0 écran chacune.

## Prédiction
Il dira « p4b3 et p4b1, pas mal, la densité qui chute c'est ça » puis « mais les barres de p4b4 sont trop petites » ; il
gardera l'agenda de p4b3 et la queue emportée de p4b1 comme greffes pour a1.

DÉCISION À PRENDRE : la passe doit-elle être mesurée par `controle-panel` (étalonné sur des v0 au squelette libre) alors
que ses cinq formes partent de l'en-tête d'a1, son choix ? Si oui, le plancher 0,55 demande des rubans ou une seconde
rangée par ligne dans p4b1, p4b3 et p4b4.

CONNAISSANCE : le moteur (`MOMENTS_SIMULES`) ne simule que 60′, 10′, whirlpool, actif et après ; les crans de 5′ de
l'ébullition sont interpolés par la carte, pas calculés : l'amélioration 1 du brief ne peut être que « l'interpolation dite »
tant que `simulerCas` n'accepte pas une minute libre.

LEÇON PROPOSÉE : aucune.
