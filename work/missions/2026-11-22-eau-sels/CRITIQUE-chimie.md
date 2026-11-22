OK — 14 problèmes, 3 bloquants

# Critique « chimiste de l'eau » : Eau › 2. Sels, en ligne (22.11)

Persona : brasseur qui connaît Palmer, Bru'n Water et Brewfather ([[chimie-eau]]). Captures ouvertes : 01-sels.jpg (10:21),
02-bas.jpg et 03-table.jpg (10:20). Règle du brasseur (SPEC, 22.11) : radar le plus grand possible ; sels, radar et acides
sur un seul écran de 390 px. Code lu sans modification : `port-carnet/src/ui/SaltSolver.tsx`, `ui/water/WaterWorkbench.tsx`,
`WaterFeedback.tsx`, `WaterSummary.tsx`, `WaterRadar.tsx`, `ui/WaterAdditivesTable.tsx`, `domain/water/readiness.ts`, `substances.ts`.

Phrase prédite : « Je vois mes sels, mais le radar est minuscule, et je ne sais pas si mon pH tient sans descendre deux écrans. »

## Ce qui doit rester au premier plan, et ce qui peut se replier

| Information | Rôle pour décider | Aujourd'hui | Où la mettre |
|---|---|---|---|
| Ions contre plages (Ca, Mg, Na, SO₄, Cl, HCO₃) | ce qu'on corrige avec les sels | radar, valeur et plage par axe : bon | premier plan, radar agrandi |
| SO₄:Cl obtenu et réglage | équilibre amer et rond | grand bloc de 210 px | premier plan, une ligne dans le cadre du radar |
| Doses de sels | le geste | 9 cartes, 650 px, 7 à 0 g | premier plan, compact |
| Acide empâtage et rinçage en mL | le geste | visible en bas de 01 : bon | premier plan |
| pH d'empâtage estimé et consigne | justifie l'acide | sous le pli (02) | premier plan, une ligne sous l'acide |
| Alcalinité résiduelle | ce sur quoi l'acide est dosé | absente de l'étape Sels (seulement en 1. Eau, `WaterAcidity`) | premier plan, même ligne que le pH |
| Potassium (KCl) | plafond de goût | invisible (pas sur le radar, ni sur la carte) | sous la carte KCl, dès que KCl > 0 |
| « Ions · plages atteintes », HCO₃ moyen, diagnostics, « Comment les doses… », fiches des produits | explication | sous le pli | un seul repli « Détails » |
| Tableau « Total des additifs » | fiche de pesée | doublon des cartes | Récap ou fiche de pesée, ou repli |
| « Tous les sels à l'empâtage » | réglage rare | grand bloc | ligne courte près des acides ou en 1. Eau |

## Les incohérences signalées : défaut ou lecture normale ?

- **Sels 3,5 g puis 3,2 g, Gypse 1,1 contre 1,40 g, KCl 2,4 contre 1,80 g** : **lecture normale**. Ce sont deux états
  différents : 01 est pris à 10:21, 02 et 03 à 10:20. Chaque capture se tient : 1,1 + 2,4 = 3,5 ; 1,40 + 1,80 = 3,2.
  Ppm du tableau recalculés à la main sur 40 L : gypse 1,40 g, Ca +8,1 et SO₄ +19,5 ; KCl 1,80 g, Cl +21,4 et K +23,6. Tout est juste.
  La confusion vient de l'affichage : une décimale dans les cartes, deux au tableau (`formatSaltDose`, « 0,00 g »). Voir le point 10.
- **« pH estimé 5,68 ; consigne 5,4 hors de la plage » alors que l'acide est calculé** : **le calcul est cohérent, la présentation
  est fautive**. Selon la règle du 05.09, l'acide se dose sur l'alcalinité, jamais sur une estimation de pH à ±0,15
  (`readiness.ts`, limitation : « ces doses ne garantissent pas la consigne de pH »). Les 2,5 mL neutralisent 100 % du HCO₃
  d'empâtage. Il reste 5,68 parce que la facture est pâle (une pilsner reste vers 5,75 à AR 0). Ce sont deux voix sur une même question. Voir le point 3.
- **HCO₃ 0 ppm à l'empâtage** : **normal et vérifié**. Lactique 80 % à 600 mg de HCO₃ par mL : 2,5 mL valent 1 500 mg, soit
  environ 125 ppm × 12,1 L. Au rinçage, 5 mL retirent 87 % (cible pH 5,5) et laissent 17,9 ppm.
  La moyenne pondérée (17,9 × 27,9 + 0 × 12,1) / 40 donne 12,5 ppm, la valeur affichée par le radar. Volumes déduits, non lus à l'écran.
  Lactate : 0,24 g/L, sous l'alerte de 0,3 g/L.
- **SO₄:Cl obtenu 0,74 contre 29/40 = 0,725** : normal, les ppm affichés sont arrondis.

## Problèmes (B bloquant, m moyen, d détail)

1. **B — Radar petit.** Dans 01, il occupe environ un tiers de la largeur, centré dans un cadre de 490 px presque vide. Cela enfreint sa seule règle du 22.11.
   Remède : radar à pleine largeur (environ 360 px de diamètre), étiquettes d'axe dans les coins du cadre, marges internes supprimées.
   L'espace se reprend sur les points 7, 8 et 11, sans rien sortir de l'écran.
2. **B — pH estimé et alcalinité résiduelle hors de l'écran Sels.** Le pH est sous le pli, à la fin de `WaterTargetStatus`.
   L'AR n'existe que dans l'étape 1. Eau. Or c'est la grandeur qui décide l'acide. Bru'n Water et Brewfather la placent à côté de la dose.
   Remède : une ligne sous les acides, « AR −xx → pH ≈ 5,68 ± 0,15 · consigne 5,4 », recalculée en direct quand il touche les mL
   (il veut « modifier les acides pour voir leurs effets »).
3. **B — Deux voix contradictoires, et une consigne impossible à la création.** On lit « Consigne hors de la plage estimée. Mesurer puis
   titrer la maische avant de corriger », alors que l'acide est « calculé » et que le tableau dit qu'il « respecte le HCO₃ ». Il a déjà dit :
   « Je peux pas mesurer à la cuve l'acidité lors de ma création de recette » ([[chimie-eau]], « une seule voix par question »).
   Remède : une seule phrase dans le bloc acide, au ton neutre, sans alarme ambre sur une estimation à ±0,15. Elle renvoie la correction
   au jour de brassage, qui la calcule déjà sur le pH mesuré (`acidCorrectionFromMeasuredPh`). Aucune dose ajoutée de lui-même.
4. **m — Échelle du radar écrasée par l'eau de départ.** L'échelle est commune et en racine, son maximum vient de l'eau de départ
   (HCO₃ ≈ 125 ppm, `WaterRadar.tsx` l. 126). Mg 7, Na 4 et HCO₃ 12,5 se tassent au centre. Deux contours se superposent
   (pointillé bleu et trait noir qui file vers HCO₃ et Na), et la légende est sous le pli (haut de 02).
   Remède : échelle sur max(plage, obtenu), départ en contour fantôme coupé au bord avec une flèche, légende en deux pastilles dans le cadre.
5. **m — Axe HCO₃ du radar sans usage pour décider.** 12,5 ppm est une moyenne de deux eaux préparées à part. L'app écrit elle-même :
   « ce n'est pas le HCO₃ du moût ». Remède : garder l'axe, puisqu'il veut voir l'effet de l'acide sur le radar, mais l'étiqueter
   « HCO₃ moy. ». Le chiffre d'empâtage (0) reste sous la dose.
6. **m — Potassium invisible.** KCl 2,4 g sur 40 L donne 31,5 ppm de K, sous le plafond chiffré mais sans aucun signe à l'écran.
   Remède : sous la carte KCl, « K 32 ppm / max » dès que la dose dépasse 0.
7. **m — Grille de 9 sels trop haute.** Elle prend 650 px, alors que 7 sels sont à 0 g. Les interrupteurs sont tous verts, sans dire qu'ils
   signifient « autorisé au calcul ». Les cartes n'affichent pas d'unité g.
   Remède : une ligne compacte par sel dosé, les sels à 0 réduits à une rangée de puces (« + CaCl₂ », « + Epsom »…), l'unité g dans le champ.
8. **m — Curseur SO₄⇄Cl de 210 px sans graduation.** Ni la plage verte ni le trait du 1:1 ne portent de chiffre.
   Remède : le fondre dans le cadre du radar, en une ligne « SO₄:Cl 0,74 · réglage 0,75 » avec un curseur fin marqué 0,5, 1 et 2.
9. **m — Ligne d'acide incomplète.** La concentration (80 %) ne figure qu'au tableau. Le statut calculé ou manuel ne se lit qu'à la couleur bleue.
   Remède : « Lactique 80 % ⟳ », et « calc. » ou « manuel » en petit sous la dose.
10. **m — Tableau « Total des additifs » en doublon.** Il répète les cartes et l'acide avec deux décimales (« 1,40 g », « 0,00 g »), alors que
    le solveur tronque au dixième. D'où la lecture 1,1 contre 1,40. Remède : le sortir de l'étape Sels (Récap ou fiche de pesée) ou le replier,
    et une seule décimale partout.
11. **m — Bouton « + » flottant.** Il chevauche le sélecteur 1. Eau / 2. Sels et le coin du radar (01, 03), mais manque en 02.
    Remède : le masquer sur l'étape Eau.
12. **m — Bas de page sans hiérarchie.** On y trouve « Ions · plages atteintes » (qui redit le radar), le HCO₃ moyen, les diagnostics,
    « Comment les doses… », la fiche du bicarbonate, la note du lactique, le grand interrupteur « Tous les sels à l'empâtage », un paragraphe,
    « Revoir l'eau » et « Retour à la fiche de brassage ». Cela fait trois retours, sans compter « < » et « Retour ».
    Remède : un seul repli « Détails » ; l'interrupteur d'empâtage en ligne courte près des acides, car il change les ppm de la maische ; un seul retour.
13. **d — Toucher un sel n'affiche rien à l'écran.** Dans 01, Bicarb. est sélectionné, mais son explication s'affiche deux écrans plus bas.
    Remède : la feuille « Minéraux du sel » ou une bulle au toucher.
14. **d — « 2. Sels 3,5 g » n'apporte rien.** C'est la somme de sels différents, aucune décision n'en dépend. Remède : « 2 sels », ou rien.

## Doutes, non comptés

- **KCl dosé au lieu du CaCl₂** : le Ca est à 49, au bas de 40–80, alors que le CaCl₂ est autorisé. Palmer ou Bru'n Water prendraient
  le CaCl₂ (calcium utile aux enzymes et à la floculation). Le solveur se défend (« repère souple du calcium »).
  À vérifier : ces doses sont-elles celles du calcul ou des doses posées à la main ?
- **pH 5,68 à HCO₃ 0** : la valeur dépend de la table `DI_PH_BY_EBC`, incertaine, et de la constante de `phShiftFromRa` (±30 %).
  Le chiffre est plausible pour une facture pâle, il n'est pas prouvé.

LEÇON PROPOSÉE : aucune
