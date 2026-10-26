# dgb4 — « Trois verres »

**Chaleur : chaude.** **Greffe libre : `data-greffe="trois-verres"`** (les trois plans de w2 servis comme trois verres de
sa stout).

L'idée, une seule : sous la figure, trois verres de stout côte à côte, Sage, Franc, Osé. De chaque verre monte son nez :
trois volutes, floral, baies, résineux, dans la couleur de leur barre, aussi hautes que le gain du plan (0 à +25, l'échelle
des courbes), chiffre et picto au bout ; en pointillé quand le moteur interpole (≈, Sage à 0′). L'IBU est écrit sur la bière
(« ~60 », « 60+? » à cru). Toucher un verre pose le rail sur son moment ; le verre tenu est cerclé.

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
- D'un coup d'œil : le verre de Sage sent deux fois moins, celui d'Osé pousse sa volute verte (résineux ~+20) ; tout tient
  au premier écran, au-dessus du pied.
- Forme neuve, et pourtant chaque chiffre est celui du moteur.

## Ce qui casse
- Les barres des 12 familles passent sous le pied (défilement de 225 px).
- Les volutes sont des courbes : leur hauteur se compare moins finement qu'une barre (le chiffre au bout compense).
- Le verre, nouveau dessin hors baseline : à nommer à voix haute (« un verre de stout »), pas une famille d'arôme.

## Captures
`captures/dgb4.png` (repos) ; `captures/dgb4-geste.png` (verre d'Osé touché : rail à après · 3 j, verre cerclé).

## Contrôles (sorties recopiées, 24.10 soir)
| critère | sortie |
|---|---|
| G1 `variantes.mjs dgb1 dgb2 dgb3 dgb4` | VARIANTES-BIEN-4 |
| G2 `controle-pictos-trait … --page=etat.html` | TRAIT OK (26 pictos de famille, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (1 groupe libre : moment) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (dgb1 à dgb4) | PANEL OK (remplissage médian 0,74 ; ressemblance 0,90 ; 0/6 paires presque identiques) |
| `controle-choix --ecran=dryhopper` (copie de la page en route `dryhopper`) | ECHEC sur un seul état : `etat-dryh-repos` 114 mots au premier écran (au plus 96) ; les 20 autres états de sa base OK. La base seule fait exactement 96 (CHOIX OK) : tout chiffre ajouté au premier écran dépasse. Écart assumé en v0 (`--sans=mots`), décision au pilote. |
