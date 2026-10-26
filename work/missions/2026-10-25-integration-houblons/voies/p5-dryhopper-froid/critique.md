OK — accepté : le port est D, trait pour trait (repos et trois feuilles, écarts ≤ 0,1 px, mêmes valeurs), la bulle « 3 j » ne touche plus « 7 j » ; une retouche d'une ligne avant de déployer : retirer « 2/6 » de la feuille Hop creep (contredit la jauge à 3 crans)

Critique calibrée sur le portrait v2 (`fils21-choisir/critique/PORTRAIT.md`), 26.10. Regardé en image : `m5/img/d-mini-graphes.png`,
`d-ouvert-amer.png`, `d-ouvert-creep.png`, `d-ouvert-limite.png` ; `fidelite/app-repos.png`, `app-amer.png`, `app-creep.png`,
`app-limite.png`, les quatre `cote-a-cote-zone-*.png`, `bulle-apres-3j.png` et `bulle-apres-3j-zoom.png`, `maquette-dryhopper-repos.png`
(Idaho 7, stout 16D), `maquette-dryhopper-1280.png` ; `%TEMP%/controle-froid-dryhopper/ebullition.png` et `bilan.json` ; sa capture
`fils23-dryhopper/passe4/captures/brasseur-bulle-3j-sur-7j.jpg` ; p4b2f (`p4b2f-premier-ecran.png`). Lu : VOIE.md, RESULTAT.md,
`FroidDryhopper.tsx`, `froid.css`, `froid.ts` (règle des points du creep), `m5/critique.md`.

- **p5 · port de D dans Dryhopper** (trois mini graphes) — ACCEPTÉ. Sa phrase : « C'est bien D, très bien, les intervalles et la
  source sont là. Mais le 2/6 là c'est quoi ??? il y a 3 cases ». Correction attendue (une ligne, `FroidDryhopper.tsx` l. 123) :
  `Niveau 2/6 : une convention, pas une mesure` → `une convention, pas une mesure` (garder la convention, retirer le score).

## 1. Fidèle à D ? Oui, règle n° 1 tenue
- **Repos** (`cote-a-cote-zone-repos.png`, m5 à gauche, app à droite) : les trois cellules (72 / 44 / 56 px, 56 px de haut), la
  plage hachurée avec le plein des essais Cascade, le trait noir à 28, les nombres 22 · 28 · 34, la jauge 2 crans sur 3 et « moyen »
  en noir, les quatre colonnes sous la ligne pointillée (végétal, herbacé en orange, résineux, floral), les pictos dessous :
  identiques à l'œil, et `bilan.json` donne les mêmes boîtes (x 19 / 95 / 143, y 195,7). Le rail est 1 px sous les cellules, la
  légende « levure active » à x 204, hors des cellules (r = 199). Rien d'autre de l'écran n'a bougé (bande IBU, courbes, barres, pied).
- **Amertume** (`cote-a-cote-zone-amer.png`) : même feuille, même plage légendée (22,3 · 26,3 · 27,9 · 34,0), « Signe non établi :
  Cascade seul −5,6 à −1,6 ; avec Centennial jusqu'à +6,1. », Maye 2016 · 5 essais, 16 °C, 1 à 5 j. 43 mots (D73 : 45). Rien à dire.
- **Limites** (`cote-a-cote-zone-limite.png`) : mêmes quatre barres, mêmes bornes et nombres (20,6 / 5 en orange, 13,5 / 5 en orange,
  27,5 / 30, 24,4 / 30). La note de bas change de mots (« neutres (0–30) », « simulé, pas une mesure » en plus), même hauteur, 33 mots :
  plus honnête, il ne le verrait pas comme un écart.
- **Hop creep** (`cote-a-cote-zone-creep.png`) : même titre avec sa petite jauge, mêmes trois lignes (H68, effets, publié +0,6 à
  +1,3 % vol. à 10 g/L · ce brassin : ?). Une ligne de plus : « Niveau 2/6 : une convention, pas une mesure ». Voir § 2.
- **Autre recette** (`maquette-dryhopper-repos.png`, Idaho 7, stout 16D, actif · 1 j) : « amer ? » en hachuré seul (Idaho 7 n'est pas dans
  les essais : l'enveloppe, jamais la plage d'un autre houblon), 40 · 60 avec le trait à 60 (IBU 60+?), « moyen », quatre colonnes
  (résineux dépasse, en orange avec sa flèche). Le dessin tient hors de la scène de m5. À 1280 px : cellules petites dans la zone, rien ne
  se chevauche.
- **Les gestes** : le toucher ouvre la feuille sous la zone et repousse le rail (vu sur les trois captures ouvertes : rail à 1 230 →
  1 270 px), second toucher referme (contrôle `FROID OK`, pas de capture : je le dis plutôt que de le deviner, portrait § 3.5).

## 2. Un défaut avant de déployer ? Un seul, une ligne
- **« Niveau 2/6 »** (feuille Hop creep, ligne de source à 12 px). La jauge, au repos et dans le titre de la feuille, a 3 crans (faible,
  moyen, fort) ; la feuille annonce « 2/6 ». Ce 6 est le total des points de la règle de x1 (`froid.ts` l. 100–105 : moment 2 + dose 1 +
  contact 1 + température 1 + variété 1), que l'écran ne montre nulle part. C'est un chiffre de méthode posé seul (portrait § 1.3) qui
  « sort de nulle part » (portrait § 4, « On a un 10' qui sort de null part »), et il contredit ce que montre la jauge. Il l'a demandé ?
  Non : « convention » n'est dans aucune de ses paroles (SPEC) ; la consigne vient de VOIE.md (« la feuille le dit »), et elle est tenue
  par les mots « une convention, pas une mesure » seuls. Ce n'est pas un REJET : feuille à un toucher, D73 tenu (45 mots pile, contre 38
  dans m5 : la ligne ajoutée en est la cause), et le défaut descend le verdict d'un cran au plus (portrait § 1.1). Correction : retirer
  « Niveau 2/6 : », garder « une convention, pas une mesure · Inconnus : … · H68, H84 » (39 mots). Rejouer `froidDryhopper.test.ts`.
- **La bulle « ● 3 j »** (sa plainte D164, « Pas super la superposition ici, à corriger », `brasseur-bulle-3j-sur-7j.jpg`) : sur
  `app-repos.png` (avant la passe 2) la bulle mord le haut de « 7 j », comme sur sa capture. Sur `bulle-apres-3j-zoom.png` (passe 2) elle
  tient entre le rail et la rangée, à 2 ou 3 px au-dessus de « 7 j », sans le couper (contrôle § 5, 26 cas). Corrigé. Elle reste au-dessus
  de la colonne « 7 j » en disant « 3 j » : c'est le rail de p4b2f, son choix (sur `p4b2f-premier-ecran.png`, « ● 2 j » est au-dessus du
  bouton « 3 j ») ; sa plainte ne visait que la superposition (lecture étroite, L01). Je le signale sans rejeter : l'écart de 2 px est
  juste, il pourrait dire « c'est collé » ; 4 px seraient plus sûrs si la rangée le permet.
- **Chevauchements** : aucun à 390 ni à 1280 (cellules entre elles, légende « levure active », rail, bulle, boutons de jour) ; vu et
  mesuré (`bilan.json`).
- **Tailles** : étiquettes « amer ? / creep / limite » à 13 px au gris des légendes (la correction demandée par la critique m5, faite) ;
  pictos à 13 px (plancher 12) ; nombres mono à 12 px gras et sources à 12 px, comme dans D. Rien sous 12 px.
- **Chiffres** : aucun inventé ; 22 / 28 / 34 = 22,3 / 27,9 / 34,0 ; limites = x1 ; « ? » sur le signe de l'amertume, sur l'ampleur du creep
  pour ce brassin, et sur la plage de la variété quand les essais ne l'ont pas (Idaho 7). L'amertume non calculée dit sa raison (dose > 7,73
  g/L, α ou densité inconnus, science désactivée) : honnête (D65, D94).
- Hors de ma critique d'interface : B1 et B2 du budget dépassés sans preuve que HEAD l'était déjà (RESULTAT § Critères) ; le pilote tranche
  sur un HEAD propre.

## 3. Les 18 px vides aux moments chauds
- `ebullition.png` : sous la bande IBU, côté ébullition, la zone est vide (rien de dessiné), le rail à la même hauteur qu'au dry hop
  (252,7 px depuis le haut du dessin, contrôle § 4). Le blanc à gauche de « levure active » fait ≈ 125 px de haut sur ≈ 180 px de large,
  dont 18 px viennent de la réserve.
- Le gêneront-ils ? Peu, et pas pour ces 18 px : ce blanc est celui de sa base p4b2f, celui qu'il a barré en rouge au dry hop (« Amertume,
  hop creep ? Résineux ? »). Il est maintenant d'un cinquième plus haut ; à l'œil, on ne le distingue pas de l'ancien. L'autre option (le
  rail qui saute de 18 px entre ébullition et dry hop, sous le doigt qui glisse de 60′ à J+14 d'un seul geste) serait un vrai défaut de
  geste (D63 : « Ça fait pas zoom focus sur l'emplacement »). Option (b) défendable.
- Ce qu'il dira plutôt, si on lui montre l'ébullition : « et là c'est vide ? » (D149 : « Trop de blanc inutil, d'espace pour rien »). Le
  pilote prévoit de lui montrer ce cas : y joindre une mini maquette de ce que la zone pourrait dire à chaud (la cellule « limite » seule :
  `famillesProchesDeLaLimite` vaut à tout moment ; « amer » avec le seul trait à chaud), en variantes à choisir (L24), jamais dessinées
  dans l'app avant son choix (VOIE.md : « Ne dessine aucun état qu'il n'a pas vu »).

## Ce que je ne sais pas
- Le toucher qui referme et le rail repoussé ne sont vus qu'en captures fixes et par le contrôle.
- Sa tolérance au gris 12 px des sources au téléphone (déjà dit pour m5) : à voir sur l'appareil déployé.

LEÇON PROPOSÉE : aucune
