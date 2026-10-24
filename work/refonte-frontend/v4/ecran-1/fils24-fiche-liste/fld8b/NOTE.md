# fld8b — l'iceberg, passe 2 (candidate n° 3)

- **Chaleur : chaude** (forme libre), comme fld8, qui reste intacte.
- Houblon par défaut : Nelson Sauvin (`etat.html`) ; les quatre autres : `h-<houblon>.html`, choisis dans l'étape derrière la feuille.
- Question : « Que sent ce houblon, dit avec ses mots ? » Facteur libre : le houblon, choisi dans l'étape. La bière (Stout export, 20 L) et le style (16D) sont fixés sur la ligne de contexte.
- Générateur `fld8b/gen.mjs` (socle `fld1/socle.mjs`, sans le modifier) ; captures `fld8b/captures.mjs`.

## Retouches du verdict (point 3 et règles communes), mesurées
| Retouche | Fait | Mesure sur la capture |
|---|---|---|
| Eau et coque dans les gris du thème (D106) | eau `#f3f3f6` (surface r6a/q2b), coque `#d4d5db` bordée `#8d8d96`, texte `#16161a` | plus de bleu ni de gris foncé `#3a3d44` |
| Bloc moins sombre (D82) | coque claire, hauteur 54 px + 230 px × (mots hors des 12 / mots de la fiche) | Nelson 218 px, Nugget 73 px, Cascade 80 px ; BLOCS OK |
| « 83 % » → le compte visible | « 5 mots sur 7 hors des 12 familles » | Nelson : agrumes, épicé sur les rayons, 5 sous l'eau = 7 ✓ ; Nugget : 11 sur les rayons + gingembre = « 1 mot sur 12 » ✓ ; Cascade : 8 + fruité = « 1 mot sur 9 » ✓ |
| « 10 familles non décrites » derrière le « ? » | dans la légende, avec leurs noms | rien au repos |
| Greffe flu6 : les mots au bout des rayons | chaque famille citée porte son picto, « n/N » et tous ses mots au bout de son rayon ; le nom de la famille quand la fiche le dit, et les catégories Hopsteiner (« catég. »), en italique gris | tous les mots se recomptent à l'écran |
| Tenir sur Nugget et Cascade | petite coque, et « : presque tout se dessine » écrit en clair ; Cascade : « fruité 1/2 · catégorie » | aucun écran vide (captures -nugget, -cascade) |
| Un seul α, celui de g1 | plage Hopsteiner 2025 (sinon la seule source), avec le lot, en police du thème ; source dans la légende | Nelson « α 12–14 % · lot 9,6 % hors de ses fiches », Nugget « α 11–14 % · lot 13 % », Cascade « α 4,5–7 % · lot 6,5 % » ; la fiche courte reprend la même plage |

Autres changements : le houblon se choisit dans l'étape (onglets à la couleur de chaque houblon), hors de la fiche g1, qui reste entière (nom ⊙, α, usage, stock, radar d'abord, « + Floral / − Résineux », ♡ ⊘ Comparer, croix). La ligne `data-role="contexte"` (Stout export · 20 L ; 16D Foreign Extra Stout) est dans l'étape. La ligne de surface de fld8 est retirée : ses mots sont maintenant sur les rayons. Radar réduit (rayon 80 px) pour loger les mots autour, comme flu6 : seul écart à g1, voulu par la greffe.

Décision du pilote (STANDARD S1 et S4 sur les cinq candidates) : Nelson Sauvin en #a0081f, comme flc8b, au lieu de #0b6e63 ; les icônes dessinées (croix, ♡, ⊘, repère ⊙) à 1,5 px de trait rendu. Contrôle commun des cinq (flb3b flc8b fld8b flu2b fla5b) : STANDARD OK, COMMUN OK.

## Ce qui tient
Nelson Sauvin : deux rayons, chacun marqué « catégorie », puis sous l'eau vin blanc, groseille à maquereau, raisin, fruité, sauvignon blanc, avec leurs fiches : on voit en trois secondes que le radar ne dessine pas ce houblon. Nugget et Cascade : un radar bien rempli et une petite coque qui dit « presque tout se dessine ».

## Ce qui casse
- Le nom de la famille redit en mot (« Agrumes 1/4 · agrumes »), en italique gris : c'est le prix d'un compte qui se vérifie à l'écran.
- Nugget : trois familles voisines à gauche, étiquettes serrées.
- La coque montre une part de vocabulaire, pas une intensité.

## Contrôles (24.10, sur fld8b seule)
- G2 `controle-commun.mjs … fld8b --page=etat.html --sans=mots` : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes).
- G3 `controle-une-question.mjs … fld8b --page=etat.html` : titre « Que sent-il, avec ses mots ? », libre : houblon (5 options), contexte : base, style → **UNE-QUESTION OK**.
- G4 `mots-premier-ecran.mjs … fld8b --max=80 --page=etat.html --sans-donnees` : 63 mots, **MOTS OK**.
- `controle-sans-famille.mjs` : Nelson Sauvin, coque « autres » visible → SANS-FAMILLE OK.

## Captures (ouvertes, recomptées)
`captures/fld8b-nelson.png`, `fld8b-nugget.png`, `fld8b-page.png` (Nelson, page entière), `fld8b-cascade.png`, `fld8b-motueka.png`, `fld8b-fiche.png` (fiche courte à l'appui long).
