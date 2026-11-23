OK — 20 problèmes, 4 bloquants (persona UX/UI mobile et dataviz ; Eau › 2. Sels en ligne, 22.11)

Captures lues : 01-sels.jpg, 02-bas.jpg, 03-table.jpg (1280 × 2772 px, téléphone 390 CSS ; 1 px CSS = 3,28 px réels,
soit 3,05 px de l'image affichée). Zone utile visible du navigateur sur ce téléphone : environ 692 px CSS de haut.
Règle (SPEC, 22.11) : « maximiser la grandeur du spidergraph (radargraph) et avoir sur un seul écran, sel, radargraph et
acides. » Elle est reprise dans docs/ui-compacte.md : à 390 × 844, radar, curseur SO₄/Cl, sels et acides visibles et
utilisables sans défiler ni ouvrir de panneau.

Phrase prédite du brasseur : « Le radar est minuscule au milieu d'un grand vide, et les acides sont coupés en bas. C'est
exactement ce que j'ai dit de ne pas faire. »

## Mesures actuelles (01-sels, en px CSS)

| Bloc | Hauteur | Remarque |
|---|---|---|
| En-tête « Eau 6/7 » + Abandonner | 33 | |
| Onglets d'étape | 31 | |
| Segment 1. Eau / 2. Sels (+ bouton flottant) | 40 | le « + » noir de 40 px chevauche le segment et le coin du radar |
| Carte radar | 159 | **cercle de 119 px de diamètre** dans une carte de 367 px |
| SO₄ ⇄ Cl | 67 | |
| 9 sels (3 × 3 cartes) | 215 | 31 % de l'écran visible |
| Acides | ~90, dont 77 visibles | coupé par le pied |
| Pied Retour / Suivant | 51 | |
| **Total** | **≈ 686 + marges** | dépasse 660 ; à 692, les acides sont déjà rognés |

Place perdue dans la carte radar : 118 px à gauche et 113 px à droite du cercle, soit 63 % de la largeur. Le cercle
occupe environ 4 % de la surface visible ; la grille des sels en occupe 31 %.

## Problèmes

1. **B — Radar trop petit.** 119 px de diamètre alors que 300 px tiennent dans 366 px de large (voir la disposition).
   C'est sa seule règle : « maximiser la grandeur du spidergraph ».
2. **B — Pas tout sur un écran.** Sur son téléphone (692 px), la carte des acides est coupée par le pied : les lignes
   HCO₃ passent sous le fondu et le bas de la carte est invisible. À 390 × 660, il manque environ 26 px et le bloc des
   acides passe entièrement sous le pied.
3. **B — Textes du radar illisibles.** Nom d'ion ≈ 10 px ; valeur ≈ 11 px ; plage (« 30–70 ») ≈ 9 px en gris clair,
   contraste estimé à 2,5:1 ; graduations 50, 100, 150 ≈ 6 px. Les secteurs cibles vert pâle sur fond gris restent
   presque invisibles (≈ 1,3:1).
4. **B — Une donnée ajoutée n'apparaît nulle part.** Le KCl ajoute K +23,6 ppm (03-table), mais le radar n'a pas d'axe
   K⁺ et aucune ligne du premier écran n'en parle.
5. **m — Échelle commune de 0 à 150 ppm : le centre est écrasé.** Mg 7, Na 4 et HCO₃ 12,5 tombent à 10 à 20 px du
   centre, collés les uns aux autres, et on ne lit aucun écart. Remède : une échelle par axe, avec la plage cible tracée en
   anneau régulier (par exemple de 50 à 75 % du rayon), un point hors plage sortant de l'anneau. C'est son choix cmc2g pour
   les houblons, « Chaque axe à son échelle » (« C'est quasiment parfait »), avec « utiliser ce radar graph comme Baseline
   et l'utiliser partout ». Les graduations 50/100/150 disparaissent.
6. **m — Deux traits sombres sortent du cercle** vers les étiquettes HCO₃ et Na, sans explication. Ils se lisent comme
   des pics et rejouent « l'affichage des pic du radar sont toujours pas bon ». Le pointillé bleu de l'eau de départ, de
   1 px, se voit à peine (D181 : « Les points bleu sont difficile à voir »).
7. **m — Aucun pH au premier écran.** Sous les acides, on lit « HCO₃ 0 ppm » et « 17,9 ppm », mais pas le pH, qui est la
   raison de l'acide. « pH estimé 5,68 ; consigne 5,4 » n'apparaît qu'en texte, plus bas (02-bas). Remède : « pH 5,68 →
   5,4 » dans la ligne des acides, à la place des HCO₃.
8. **m — Un interrupteur par sel, tous allumés, valeurs à 0.** Le sens n'est pas lisible (le solveur peut-il l'utiliser ?
   est-il versé ?). La rangée nom + interrupteur coûte 25 px × 3 = 75 px. Remède : retirer l'interrupteur et faire exclure
   un sel par l'éditeur partagé (état « exclu », la puce barrée).
9. **m — Grille des sels : 215 px pour 2 valeurs non nulles.** Sept sels à 0 prennent autant de place que Gypse et KCl.
   Remède : des puces de 32 à 40 px, avec nom et dose, et un seul éditeur − valeur + pour le sel choisi (voir la
   disposition).
10. **m — Unité absente sur les sels.** « 1,1 », « 0 », « 2,4 » sans « g », alors que les acides portent « mL » et que le
    segment affiche « 3,5 g ».
11. **m — Curseur SO₄ ⇄ Cl : 67 px pour une seule commande.** « Réglage 0,75:1 » et « Obtenu 0,74:1 » répètent presque la
    même valeur. Les trois traits (aux deux bouts et un au milieu) n'ont aucun chiffre, et la bande verte n'a pas de
    bornes : on ne sait pas où se trouve 1:1. Remède : une ligne de 32 à 36 px (« SO₄:Cl », la piste, « 0,74 »), le
    réglage montré par la poignée seule et « 1 » marqué sous le trait du milieu.
12. **m — Bouton flottant « + ».** Il fait 40 px, chevauche le segment Sels et le coin de la carte radar, et son rôle à
    l'étape Sels est inconnu. Remède : le retirer de cette étape ou le placer dans l'en-tête.
13. **m — Explication d'un sel loin du geste.** La carte Bicarb. est sélectionnée (01-sels), mais son texte n'apparaît que
    sous « Comment les doses sont choisies », environ 330 px plus bas (02-bas), hors écran : après un toucher sur ⓘ,
    rien ne change à l'écran. Remède : afficher une ligne sous l'éditeur partagé, à la place. (À confirmer par une
    capture du geste.)
14. **m — Le chrome prend 104 px avant le radar** (en-tête 33, onglets 31, segment 40), soit 15 % de l'écran. Remède :
    segment de 32 px, ou segment fusionné dans la ligne d'en-tête (+32 px pour le radar).
15. **m — Texte sous le premier écran** (02-bas, 03-table) : « HCO₃ · moyenne du graphique », « Ions · plages
    atteintes » en titre vert, deux phrases de pH, trois accordéons, le paragraphe du bicarbonate, le paragraphe après la
    table. Cela rejoue D1 (« trop de text ouvert de base. ça pollue »). Remède : tout replier sous un seul « Détails ».
    La légende du radar (« la plage verte est la cible… ») se trouve sous les acides, loin du radar : la remplacer par
    une légende en pictos de 16 px collée au radar.
16. **m — « Tous les sels à l'empâtage » est un vrai réglage, mais caché sous le premier écran.** Remède : une petite
    bascule dans la ligne des acides, ou dans « Détails » puisqu'elle est « Recommandée » et active par défaut.
17. **d — La table « Total des additifs » double les puces.** Sa colonne Rinçage vaut 0,00 g pour tous les sels quand
    tout va à l'empâtage. Les précisions diffèrent (1,40 g dans la table, 1,1 sur la carte). La ligne « Tous les sels à
    l'empâtage · Acide de rinçage à part » répète la bascule. Remède : sous « Détails », masquer une colonne vide et
    utiliser une seule précision (0,1 g).
18. **d — Quatre retours possibles** : ‹ de l'en-tête, « Revoir l'eau et les volumes », « Retour à la fiche de
    brassage », « Retour ». Remède : garder ‹ et Retour.
19. **d — Cibles tactiles.** Interrupteur ≈ 28 × 15 px, ⓘ ≈ 8 px visibles : sous les 24 px de DESIGN.md (WCAG 2.5.8)
    si la zone n'est pas élargie. Les boutons − et + font 28 × 34 px : c'est correct.
20. **d — Rédaction.** « CUMULÉS » en capitales, « cher. son » en minuscule après un point, « Le plus courant, et le
    moins cher » attribué au bicarbonate de soude.

### Doutes (non comptés)
- **Clavier** : aucune capture avec le clavier ouvert. Le risque est fort : à 390 × 660, un clavier de 260 à 290 px ne
  laisse qu'environ 370 px, et la saisie d'un sel de la 3ᵉ rangée fait défiler la page, si bien que le radar sort de
  l'écran pendant qu'on règle. Captures à faire : focus sur la valeur de KCl, puis sur l'acide de rinçage, à 390 × 660
  et 390 × 844.
- **Choix du KCl plutôt que du CaCl₂** alors que le pH estimé (5,68) dépasse la consigne (5,4). Le CaCl₂ ajouterait du
  calcium, ce qui fait baisser le pH ; le KCl n'agit pas sur le pH. Le brasseur dira « pourquoi du KCl ? » : à faire
  vérifier par le solveur, ce n'est pas un défaut d'UX.
- **L'acide d'empâtage vise le HCO₃ du profil, pas la consigne de pH** (texte de 03-table) : à rapprocher de sa parole
  du 15.11 (« Ça dépend du style et ça doit être dit spécifiquement »).
- **Police des valeurs** : elle a l'air d'une police à chasse fixe de repli (genre Courier), pas d'IBM Plex Mono
  (jeton `reading` de DESIGN.md) ; police peut-être non chargée.
- **Rapport SO₄/Cl** : 29/40 = 0,725, mais l'écran affiche 0,74 (ions non arrondis ?).

## Disposition proposée (px CSS, largeur utile 366 = 390 − 2 × 12)

Radar à 6 axes, Cl en haut, Mg en bas, les quatre autres à ±30° de l'horizontale. Les étiquettes latérales commencent à
0,866 R, d'où la largeur nécessaire : 0,866 D + 2 × 50 ≤ 366, soit **D ≤ 300**. Étiquettes : ion 12 px demi-gras, valeur
15 px Plex Mono gras, plage 11 px, contraste ≥ 4,5:1. Anneau cible vert à 30 % d'opacité au moins, eau actuelle en trait
de 2 px avec points de 7 px, eau de départ en trait plein gris-bleu de 1,5 px à 60 % d'opacité, axe K⁺ ajouté s'il y a du
K (sinon K figure dans la ligne de l'éditeur).

Les sels deviennent 9 puces (« Gypse 1,1 g », « KCl 2,4 g », les sels à 0 en gris), sur 3 colonnes. Toucher une puce la
choisit, et l'éditeur partagé situé dessous montre « nom · − valeur g + · ⓘ · exclure ». L'explication ⓘ s'affiche sur une
ligne, à la place.

| Bloc | 390 × 660 | 390 × 844 |
|---|---|---|
| En-tête | 34 | 36 |
| Onglets d'étape | 28 | 30 |
| Segment Eau / Sels (sans bouton flottant) | 32 | 34 |
| **Radar (étiquettes haut et bas 2 × 24)** | **284 (D 236)** | **348 (D 300)** + légende en pictos 16 |
| SO₄:Cl, une ligne | 32 | 36 |
| Puces des sels, 3 × 3 | 104 (3 × 32 + 8) | 128 (3 × 40 + 8) |
| Éditeur partagé | 40 | 44 |
| Acides : Lactique 80 % ⟳ · emp. − 2,5 + mL · rinç. − 5 + mL · pH 5,68 → 5,4 | 44 | 56 (avec HCO₃ en 2ᵉ ligne) |
| Pied Retour / Suivant | 44 | 48 |
| Marges entre blocs | 18 | 32 |
| **Total** | **660** | **808** (36 de réserve pour la taille de police système) |

À 660, la marge est nulle. Fusionner le segment dans la ligne d'en-tête rend 32 px, soit **D 268**. Autre possibilité :
les deux acides deviennent des puces dans la même grille (4 colonnes, la 12ᵉ case portant « Lactique ⟳ »), ce qui rend
44 px au radar.

Diamètre du radar : 119 px aujourd'hui, 236 à 268 px à 660 (×2 à ×2,3 en longueur, ×4 à ×5 en surface), 300 px à 844
(×2,5 et ×6,4). Les détails (diagnostics, pH détaillé, table, bascule « Tous les sels à l'empâtage », sources) passent
sous un seul « Détails ▾ » sous le pied, ou dans une feuille.

Mode saisie (clavier ouvert, `inputmode="decimal"`, jamais `type="number"`) : masquer les onglets et le segment (−60 px),
garder le radar à D ≥ 200, et coller la ligne éditée au-dessus du clavier (`visualViewport`), pour voir l'effet de la dose
pendant la saisie.
