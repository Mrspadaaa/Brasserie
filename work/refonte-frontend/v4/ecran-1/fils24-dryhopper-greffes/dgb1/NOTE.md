# dgb1 — « Trois plans en bandeau »

**Chaleur : froide.** **Greffe : `data-greffe="trois-plans-w2"`** (les « Trois plans » de w2 : « Ça c'est vraiment très
intéressant »), sur le bandeau de cartes et sur les pastilles de la figure.

L'idée, une seule : les trois cartes de w2, Sage, Franc, Osé, en bandeau au-dessus de la figure. Chaque carte : sa lettre,
ses crans d'audace (▮▯▯ à ▮▮▮, comme w2), son moment, et les quatre chiffres du bandeau de l'écran pour ce moment (floral,
baies, résineux, IBU ; orangé hors du style). Sur la figure, une pastille S, F, O sous l'axe à chaque moment, reliée par un
pointillé au point de floral calculé : chaque plan se lit sur les courbes. Toucher une carte pose le rail sur son moment ;
la carte du moment tenu est cerclée de noir (au repos : Franc, ★).

## Base et données
- Base : l'écran Dryhopper de la maquette jouable, tel qu'il se joue (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
  sa p4b2f rendue sur le moteur ; « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut
  quelques améliorations »). La page charge le même bundle et la même route ; rien n'y est retiré ni restylé, la greffe
  s'ajoute (script après le bundle, classes préfixées, remise en place si un rendu React la détache).
- Un seul facteur libre, le moment (D98) : les trois plans de w2 sont trois moments du même Idaho 7, même 4 g/L, même US-05.
  Sage = 0′ (rien à froid), Franc = actif · 2 j (★ du moteur), Osé = après · 3 j (le plus d'arôme, le résineux monte).
  w2 faisait varier dose, jours, moment et levure : ici, seulement le moment.
- Chiffres : aucun n'est recopié. Au chargement, la greffe pose le rail de l'écran sur chaque plan (ses propres touches),
  lit ce que le moteur affiche (bandeau, 12 barres, couleurs), puis revient sur ★. « ≈ » interpolé, « ? » inconnu gardés.
- Régénérer : `node <id>/generer.mjs` (socle `dgb1/socle-dgb.mjs`).

## Ce qui tient
- En trois secondes : Sage ≈+14 floral, Franc ~+22, Osé ~+23 mais résineux ~+20 ; le choix se lit avant la figure.
- Tout l'écran de la maquette reste, et l'écran tient encore sa figure entière au premier écran (cartes 88 px).

## Ce qui casse
- Les cartes répètent le bandeau quand le doigt est sur un plan (la carte tenue = le bandeau).
- Les barres passent sous le pied : le premier écran en montre six au lieu de douze (défilement de 101 px).
- Pas de pointillé pour Sage : à 0′, le moteur interpole (pas de point calculé où l'attacher).

## Captures
`captures/dgb1.png` (repos, Franc tenu) ; `captures/dgb1-geste.png` (carte Sage touchée : rail à 0′, carte cerclée,
« contre ★ : floral ≈−9 · résineux ≈−6 »).

## Contrôles (sorties recopiées, 24.10 soir)
| critère | sortie |
|---|---|
| G1 `variantes.mjs dgb1 dgb2 dgb3 dgb4` | VARIANTES-BIEN-4 |
| G2 `controle-pictos-trait … --page=etat.html` | TRAIT OK (26 pictos de famille, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (1 groupe libre : moment) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (dgb1 à dgb4) | PANEL OK (remplissage médian 0,74 ; ressemblance 0,90 ; 0/6 paires presque identiques) |
| `controle-choix --ecran=dryhopper` (copie de la page en route `dryhopper`) | ECHEC sur un seul état : `etat-dryh-repos` 127 mots au premier écran (au plus 96) ; les 20 autres états de sa base OK. La base seule fait exactement 96 (CHOIX OK) : tout chiffre ajouté au premier écran dépasse. Écart assumé en v0 (`--sans=mots`), décision au pilote. |
