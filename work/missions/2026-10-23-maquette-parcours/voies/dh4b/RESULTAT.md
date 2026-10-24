OK — cinq chaudes p4b1 à p4b5 sur a1, p4b5 refaite après le REJET du critique, G1 à G5 verts

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b-commun/socle-p4b.mjs` : reprend tel quel le socle d'a1
  (données du moteur, pictos, fiche, en-tête, contexte, lentille, légende) et en fait un rail réutilisable (géométrie, geste,
  loupe d'a1 ; classes `p4r-`) ; `capturer.mjs` : les trois captures au doigt et `geste.json` par variante.
- `passe4/p4b1..p4b5/{generer.mjs, etat.html, NOTE.md, geste.json}`, classes préfixées par id (L26).
- `passe4/captures/p4b<n>-premier-ecran.png`, `-pendant.png`, `-apres.png` (390 × 844), plus `p4b2-touche-actif`,
  `p4b3-apres-7j`, `p4b4-contre-apres`, `p4b4-contre-apres-actif`, `p4b5-60`.

## Reprise de p4b5 (verdict `passe4/critique/PASSE4.md`, REJET : barres des voisins de 7 px sous un rond de 12 px, D12)
Trois colonnes (voisin · ici · voisin) au lieu de cinq : cellules de 85 px, barres de gain à 12 px sur des pistes de 51 à 55 px,
sans rond « avant » chez les voisins, chiffrées dans chaque colonne ; amertume chiffrée partout (≈129 · ≈119 · ~110 à 20′) ;
aux bouts du rail les deux voisins du même côté (60′ · 55′ · 50′) ; la loupe d'a1 rétablie (×5,6). Idée gardée : les
familles alignées en lignes, le cran d'avant et d'après lisibles d'un trait, les jours comme voisins en dry hop. Les trois
captures refaites et ouvertes, plus `p4b5-60.png`.

## Une ligne par variante (toutes chaudes, toutes sur a1 : rien de son plancher n'est perdu)
- **p4b1 « Gardé · emporté »** — chaleur chaude ; améliorations 2, 4, 6 ; greffes d2, d1, f6, loupe d'a1. Tient : chaque
  barre montre ce que le moment garde et ce que la chaleur (flamme, hachure) ou le CO₂ (bulles, pointillé) emporte, les
  pastilles disent la perte par étape (60′–0′ −21…−9, WP −9, actif −1, après 0). Casse : résineux déjà hors style, sa
  queue ne se voit que dans le chiffre ; la loupe dit la perte et non le gain (retouche demandée par le critique).
- **p4b2 « Le brassin en courbes »** — chaude ; améliorations 1, 3, 4 ; greffes g1, f5/g6, c7, e2. Tient : courbes de gain
  floral / baies / résineux sur les 24 moments, points calculés pleins et crans interpolés pointillés, amertume en colonnes
  orangées puis hachurées à cru, bosse « levure active », rail aligné sous l'axe, loupe ×5,9 ; 1ʳᵉ du classement du critique.
  Casse : floral et baies se confondent à l'actif ; étiquettes sur les valeurs à J+7 ; pastille du pouce masquée.
- **p4b3 « L'agenda du brassin »** — chaude ; améliorations 3, 5, 1 ; greffes f5, g6, e2, g4. Tient : calendrier
  brassage / WP / J+1…J+14 avec la densité de la levure, le houblon posé où il entre, la bande de contact tirée par le pouce
  (plus de boutons de jours), bande pâle « sans gain » ; loupe ×5,6. Casse : agenda serré (88 px, 11 px) ; « levure active »
  sous ★ ; la loupe masque la ligne mesuré / Levure pendant le geste.
- **p4b4 « Le duel contre ★ »** — chaude ; améliorations 6, 2, 4 ; greffes b4, a8, d1/d2, g4. Tient : barres face à face,
  le moment à gauche, ★ ou « après » à droite (lecture seule), l'écart chiffré au centre par famille, hachure chaleur / CO₂
  en « contre après » ; loupe ×5,6. Casse : barres plus courtes qu'a1 ; au repos sur ★ une colonne de « = ».
- **p4b5 « Trois moments sous le pouce »** — chaude ; améliorations 1, 5, 6 ; greffes e3, c7, e2 ; refaite (ci-dessus).
  Tient : trois colonnes alignées, toutes chiffrées, ● / ○ mesuré, « = » sans gain, voisins = jours en dry hop, loupe d'a1.
  Casse : pistes des voisins à 51 px (le label prend 70 px) ; un seul cran de chaque côté.

## Critères (rejoués après la reprise de p4b5)
- G1 : `PASSE-BIEN-5` (page, NOTE avec chaleur, trois captures par variante).
- G2 : `COMMUN OK` sur p4b1 à p4b5 (`--sans=mots`).
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)` sur les cinq (contexte houblon, dose, levure, base).
- G4 : `MOTS OK` : 29, 35, 38, 42, 39 mots hors données (a1 : 77).
- G5 : `NOTE OK` (ce rapport).
- Hors critères : `controle-panel` sur les cinq premiers écrans (avant reprise) donnait PANEL ECHEC (remplissage médian
  0,49, ressemblance 0,92 ; a1 passe 3 : 0,64) ; le critique a mesuré 0,89 de ressemblance sur les 12 de la passe.

## Captures (toutes ouvertes, L12, à côté d'`a1-premier-ecran.png` et `a1-toucher-390.png`)
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/captures/p4b{1..5}-{premier-ecran,pendant,apres}.png`. Geste
joué au doigt dans Chrome (touchStart, six touchMove, touchEnd) d'actif · 2 j à 20′ : loupe ×5,6 / ×5,9 / ×5,6 / ×5,6 / ×5,6,
aucune erreur de page, 390 px sans défilement horizontal, 1,0 écran chacune.

## Retouches du critique restant à faire (hors de ce message, à la demande du pilote)
p4b1 : loupe gain + emporté, queue de Résineux au-delà du style, bascule « contre ★ / contre après » ; p4b2 : étiquettes de
courbe, zone de style sur le graphique, pastille du pouce ; p4b3 : agenda à 120 px, libellés à 12 px, textes hors du pouce ;
p4b4 : ouvrir sur « contre après », zone grise ; retouche commune 1 (Noyau et Baies : zéro ou inconnu, à trancher par le pilote).

## Prédiction
Il dira « p4b2 donne vraiment bien, p4b3 c'est comme ça que je pense » puis « p4b5 maintenant on voit les barres, mais
c'est que trois colonnes » ; il gardera l'agenda de p4b3 et la queue emportée de p4b1 comme greffes.

DÉCISION À PRENDRE : la retouche commune 1 du critique (Noyau et Baies : `AV` vaut 0 ; la série b les lit comme zéro
modélisé et chiffre ~+8 / ~+21, la série a comme inconnu « ? ») ; le pilote tranche la vérité de la donnée (D65) avant que les
deux séries soient montrées côte à côte.

CONNAISSANCE : le moteur (`MOMENTS_SIMULES`) ne simule que 60′, 10′, whirlpool, actif et après ; les crans de 5′ de
l'ébullition sont interpolés par la carte, pas calculés : l'amélioration 1 du brief ne peut être que « l'interpolation dite »
tant que `simulerCas` n'accepte pas une minute libre.

LEÇON PROPOSÉE : aucune.
