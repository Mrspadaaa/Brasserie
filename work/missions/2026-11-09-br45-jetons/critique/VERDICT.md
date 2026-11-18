OK — 5 problèmes, 0 bloquant : la cave est sombre et lisible partout, le clair est inchangé ; retouches mineures (états natifs, hiérarchie des gris, pastille d'étape, bordures des sous-cartes).

Version : f04e2119 + arbre de travail (jetons.css, jetons/porter.mjs non commités au moment du verdict).
Mode : test d'écran (D343/D344), 79 captures ouvertes une à une ; 3 zooms Chrome (×4) pour trancher les doutes de lecture.

## Captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| hote-cave-1280 | cave | 1280 | Ma bière, sans recette, coque réelle | 2 (textes blancs) | 0 |
| hote-cave-390 | cave | 390 | idem | 2 | 0 |
| hote-clair-1280, hote-clair-390 | clair | 1280 / 390 | idem, référence | 0 (hors mission a, c) | 0 |
| cave-1280-planning-0-0..3 | cave | 1280 | Ma bière : programme, doses, contexte, définitions, hypothèse, observation, disabled | 1, 2 | 0 |
| cave-1280-planning-1-0..5 | cave | 1280 | Décider : réglage, branche, paliers, cibles, 13 axes, hypothèse, observation | 1, 2, 3, 4 | 0 |
| cave-1280-planning-2-0..5 | cave | 1280 | Explorer : confrontation, carte 12 familles, catalogue 141, fiches | 5 | 0 |
| cave-1280-planning-3-0..2 | cave | 1280 | Historique vide, référence, hypothèse, observation | 1, 2 | 0 |
| cave-390-planning-0-0..4 | cave | 390 | Ma bière | 1, 2 | 0 |
| cave-390-planning-1-0..8 | cave | 390 | Décider | 1, 2, 3, 4 | 0 |
| cave-390-planning-2-0..8 | cave | 390 | Explorer | 5 | 0 |
| cave-390-planning-3-0..4 | cave | 390 | Historique | 1, 2 | 0 |
| cave-390-fermenting-1-0..8 | cave | 390 | Décider en fermentation : alertes ambre, fieldsets, cases à cocher | 1, 3 | 0 |
| cave-390-unknown-2-0..8 | cave | 390 | Explorer sans recette : carte 139, « ? » 11 | 5 | 0 |
| clair-390-planning-1-0..8 | clair | 390 | Décider avant / après | 0 : identiques à l'œil | 0 |
| diff-clair-1280-planning-0 | clair | 1280 | pixels différents | 0 : l'horloge seule (16:28 / 16:35) | 0 |

## Problèmes (cave, dans la mission)

1. **Radios et cases à cocher non cochées paraissent pleines.** « Composition déclarée » (Inconnue / Une souche / Mixte) et « Couverture déclarée » (Je peux attester…) : en cave les cercles et carrés vides sont des disques gris pleins (rendu natif sous `color-scheme: dark`, jetons.css l. 912), alors qu'en clair ce sont des anneaux. En brasseur : « lesquels sont cochés ? on dirait tout grisé ». Gravité moyenne : état ambigu, pas de valeur fausse. À vérifier avec un état coché (accent vert) ; si la différence coché / vide reste faible, styliser l'anneau. Captures : cave-390-planning-1-6, cave-390-fermenting-1-7, cave-1280-planning-0-2.
2. **Hiérarchie des gris aplatie par endroits.** Des textes secondaires gris en clair deviennent blanc plein en cave quand d'autres, voisins, restent gris : « Aucun espace de travail de référence n'est encore créé… », « À l'enregistrement : date d'observation… », « Identité fictive A · 40 g ÷ 20 L = 2 g/L », « Recette synthétique avant brassage · Avant brassage » (Contexte réel), « Aucun dossier conservé… » ; dans le même écran « Recette et journal du scénario » et « Le programme réel, les hypothèses… » restent gris. Lisibilité gagnée, mais le secondaire n'a plus l'air secondaire. Gravité mineure. Cause probable : des neutres proches (#333 / #444 / #555) tombent de part et d'autre d'une frontière entre `cave-texte-50` et `cave-texte-200`. Captures : cave-390-planning-0-0, 1-4, 1-8, 3-0 ; cave-1280-planning-0-0, 3-0.
3. **Pastille d'étape « Avant brassage » / « Fermentation » perd son vert.** Fond vert pâle + texte vert sombre en clair ; en cave fond charbon et liseré vert très sombre (48 63 43) visible seulement au zoom : la pastille devient une étiquette neutre. Le bandeau dessous garde sa barre verte, le sens survit à moitié. Gravité mineure. Captures : cave-390-planning-1-0, cave-390-fermenting-1-0, cave-1280-planning-1-0.
4. **Sous-cartes « … · sans cible » sans bordure lisible.** Les 13 blocs des « Cibles d'axes aromatiques » ont une boîte bordée en clair ; en cave seule une ligne gauche faible subsiste, les blocs se fondent dans la page. « Bordures visibles mais discrètes » n'est pas tenu ici. Gravité mineure. Captures : cave-390-planning-1-2, 1-3 ; cave-1280-planning-1-1, 1-2.
5. **Bouton principal « Préparer l'essai » (Explorer) ressort peu.** Vert très sombre sur panneau charbon ; il pèse moins que « Comparer ce réglage » ou « Transmettre cette branche », plus clairs. Le bouton principal de l'onglet devrait être le plus visible. Gravité mineure (décision « bandeau vert sombre gardé » du pilote : réversible). Captures : cave-390-planning-2-1, cave-1280-planning-2-1.

## Doutes (non comptés)

- « Source » / « Alternative » : à l'échelle réduite, « Alternative » semblait remplie (état actif) ; zoom ×4 : les deux pastilles sont identiques, fond transparent, même classe (`explorer.css` l. 673). Pas de problème.
- Boutons désactivés (« Lire ma question », « Adopter cette hypothèse… », « Enregistrer cette observation », « Ajouter à l'essai ») : vert sombre + texte vert pâle ; lisibles, reconnaissables comme inactifs, distincts des actifs (vert franc + blanc). Accepté.
- Repères numérotés 01–12 (vert sombre, chiffres blancs), badge « ? » brun, « Tout le catalogue » sélectionné, alertes ambre et liserés rouges : couleurs porteuses de sens gardées et reconnaissables.
- Contrôles natifs (select, date, radio, case) : gris neutre froid sur charbon chaud ; nuance de cohérence, non une faute.
- Ensemble : aucune surface claire, aucun bleu ; en-tête vert sombre, page et panneaux dans les tons de `themes.css` ; les panneaux imbriqués d'Explorer se distinguent par paliers.

## Hors mission (déjà en clair, reproduit ou corrigé par accident)

- a. Bandeau d'en-tête, sous-titre « 20 L · Avant brassage » / « Volume inconnu · Exploration · stade inconnu » : gris très clair sur blanc en clair, quasi illisible (hote-clair-390/1280, toutes les tranches 0-0 à gauche). En cave il est lisible.
- b. Libellés « Lentille de confrontation », « Source », « Alternative » (Confronter hors recette) : gris très clair sur blanc en clair (cave-390-planning-2-0 et unknown-2-0, gauche). Lisibles en cave.
- c. Coque 390 : le bouton flottant « + » recouvre la fin du « Journal de référence » (hote-cave-390, hote-clair-390). Mise en page.
- d. Définitions sensorielles et sources de fiche : corps de texte très petit dans les deux thèmes. Taille, hors mission.

LEÇON PROPOSÉE : une capture côte à côte 1280 est rendue réduite de moitié ; un état (pastille remplie, bordure) lu à cette échelle se confirme au zoom (Chrome `--screenshot` sur un HTML qui agrandit la zone) avant d'être écrit en problème : ici une fausse alerte « Alternative sélectionnée » a été évitée.
