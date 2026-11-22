# EAU-SELS-UN-ECRAN — écart à son choix, problèmes des critiques et leur sort (22.11)

Sa règle (22.11) : « La seule règle: maximiser la grandeur du spidergraph (radargraph) et avoir sur un seul écran, sel,
radargraph et acides. » ; « il y a eu plein de mini maquettes et là c'est la catastrophe... ».
Et (22.11) : « les deux thèmes, pas besoin, et surtout testé en version téléphone, peu en version desktop ».

## 1. Ses mini maquettes et son choix (retrouvés)

Les mini maquettes existent : mission `2026-11-14-recette` (branche `claude/reverent-roentgen-406505`, non fusionnée dans
`port-carnet` : `git show claude/reverent-roentgen-406505:work/missions/2026-11-14-recette/...`).
- 14.11, sur 12 candidates Eau et sels v0/v1 (z1, z2, u3… page QjjsVk6KHdAfLW1yNWCdKv) : « Je veux le radargraph en grand ,
  et sel et acides sur le même écran sur le téléphone. Donc aucun ne respecte cette condition... Et il y a de la régression
  d'action... »
- 14.11, page Eau v1 : « Pour les sels, la version actuelle reste vraiment beaucoup plus pratique et fonctionnel.... Repart
  de là et fait juste quelques améliorations en mini maquettes ».
- v2/eau/e1 à e4 (« candidat 1 » = e1 : l'onglet Sels d'aujourd'hui, toile pleine largeur 368 × 362, sels + acide 311 px).
- 15.11, page WmmbXXPSmxrs3gRVFxksix : « Pour les sel le candidat 1 est bien mais pas mieux que la version actuelle... ».
- Registre `choix/ecrans-app.json` de cette branche : `eau-sels`, route `aujourdhui`, **choisi** : « l'onglet « 2. Sels »
  d'aujourd'hui, inchangé », capture `inventaire/captures/assistant/eau-390-sels-t1.png` (fichier jamais versé, introuvable).
  Cette entrée n'est PAS dans le registre de `port-carnet` (d'où « aucun choix trouvé » des critiques brasseur et UX).

Son choix = la composition de l'onglet Sels du 14.11 : cible (liste + cible chiffrée + Doser), toile, SO₄ ⇄ Cl, grille
3 × 3 des sels (nom, ⓘ, interrupteur, − dose +), carte d'acide (Lactique ⇄, empâtage et rinçage − dose +, HCO₃ dessous),
puis les lectures. Ses deux exigences, dites le 14.11 et redites le 22.11, s'y ajoutent : toile en grand, sels et acides
sur le même écran du téléphone.

## 2. Ce qui a été porté, ce qui ne l'a pas été, pourquoi c'est différent en ligne (L03, L11)

- Porté : toute la composition (c'est le code d'aujourd'hui, jamais remplacé).
- Pas porté : « la toile en grand » (A2 de e1, pleine largeur) ; le port a gardé `fitToControls` : la hauteur de la toile
  est ce qui reste après les commandes (`useWaterControlsLayout`, plancher 160 px). À 390, les commandes prennent tout :
  le SVG (viewBox 360 × 354, presque carré) tombe à 160 px de haut, donc 149 px de large, centré dans un panneau de 374 px.
  Mesuré (parcours `eau-sels.mjs`, build de l'arbre et tag tour9) : dessin 147 px / 374 (39 %), cercle 120 px, symbole d'ion
  6,3 px, sels 7 à 9 et acides sous le pli à 390 × 660. D'où « radar petit dans un cadre vide ».
- Le contrôle de l'époque (`controle-eau-radar.mjs`, sur les maquettes) mesurait la maquette, jamais l'app (L11) ;
  e1 elle-même faisait 828 px « toile + sels + acide » : elle ne tenait pas non plus dans un écran.

## 3. Contrôle (étape 1)

`node scripts/parcours/eau-sels.mjs <dossier> [--ref en-ligne/2026-11-22-tour9] [--captures]` (port-carnet).
S1 radar, 9 sels, 2 acides dans la fenêtre utile au repos (390 × 660 et 390 × 844) ; S2 dessin ≥ 90 % de la largeur utile ;
S3 dessin ≥ 75 % de la surface de son panneau ; S4 symbole d'ion ≥ 11 px ; S5 aucun `type="number"`.
Tag tour9 : **PARCOURS EAU-SELS ECHEC (9)** (rouge attendu).

## 4. Problèmes des trois critiques et leur sort

Renvois : Br = CRITIQUE-brasseur, Ux = CRITIQUE-ux, Ch = CRITIQUE-chimie. Sort : FAIT, REJETÉ (raison), RESTE.

| # | Problème (critiques) | Sort prévu |
|---|---|---|
| P1 | Radar minuscule, cadre vide (Br1 B, Ux1 B, Ch1 B) | Toile pleine largeur ; étiquettes Cl et Mg à côté de la pointe (la boîte devient plus large que haute) ; plus de `fitToControls` à 390 |
| P2 | Pas tout sur un écran, acides rognés (Br4 B, Ux2 B) | Budget à 660 : toile ≈ 255, SO₄:Cl 32, sels 3 × 40, acides ≈ 56 ; S1 |
| P3 | Textes du radar illisibles (Ux3 B, Br9 m) | Rendu ≥ 11 px partout (S4), anneaux et plages compris, contraste texte-400 → texte-200 |
| P4 | K invisible (Ux4 B, Br10 m, Ch6 m) | Pastille « K⁺ n ppm » dans le coin de la toile dès qu'un sel apporte du K (valeur du moteur) |
| P5 | Notice du bicarbonate fausse, typo (Br5 B, Ux20 d) | Corriger le texte collé |
| P6 | pH et AR hors de l'écran (Ch2 B, Ux7 m) | Une ligne sous les acides : pH estimé ± et consigne (valeurs du moteur, inchangées) |
| P7 | Deux voix contradictoires sur le pH (Ch3 B) | La ligne d'acide dit une seule phrase neutre ; le reste dans « Détails » |
| P8 | Échelle écrasée par l'eau de départ (Br2 B, Ch4 m, Ux5 m) | Échelle commune en racine gardée (son choix du 05.09), bornée sur plages + obtenu ; départ au-delà : coupé au bord avec un repère. Échelle par axe (Ux5) REJETÉE : il a choisi l'échelle commune |
| P9 | Grille des sels trop haute, interrupteurs, ⓘ (Br3 B, Br12 m, Ux8-9 m, Ch7 m) | Grille 3 × 3 gardée (son choix), cellule de 40 px : − [nom / dose g] + ; l'interrupteur passe dans la feuille du sel (toucher le nom), cellule exclue grisée et barrée. Puces + éditeur partagé (Ux9) et puces pour les sels à 0 (Ch7) REJETÉS : sa grille − dose + est « plus pratique et fonctionnel » |
| P10 | Curseur SO₄ ⇄ Cl trop haut, sans repère (Br6 m, Ux11 m, Ch8 m) | Une ligne de 32 px |
| P11 | Couleurs à deux sens, légende loin (Br7 m, Ux15 m) | Légende en pictos dans le coin de la toile |
| P12 | Traits noirs hors du polygone (Br8 m, Ux6 m) | Axe mis en avant sans trait foncé (secteur et étiquette seulement) |
| P13 | Style absent de l'écran de pesée (Br20 m) | Gardé en tête (son choix), compacté |
| P14 | Unités manquantes (Br21 m, Ux10 m) ; Lactique sans % (Ch9 m) | « g » dans la cellule, « Lactique 80 % » |
| P15 | ⓘ agit hors de la vue (Br13 m, Ux13 m) | Le nom ouvre la feuille du sel, sur place |
| P16 | « + » flottant mord la toile (Br14 m, Ux12 m, Ch11 m) | À vérifier au rendu ; sinon hors de la zone de la toile |
| P17 | Mur de texte, quatre retours, tableau en double (Br15-19 m, Ux15-18, Ch10 m, Ch12 m) | Tout sous un seul « Détails » fermé ; rien supprimé |
| P18 | « Tous les sels à l'empâtage » enfoui (Br16 m, Ux16 m) | Dans « Détails » (actif par défaut, « Recommandé ») |
| P19 | HCO₃ moyen sans usage (Ch5 m, Br18 m) | Axe gardé, étiqueté « HCO₃ moy. » |
| P20 | Chrome de 104 px (Ux14 m) | RESTE : en-tête commun de l'assistant, hors de cette voie |
| P21 | KCl plutôt que CaCl₂ (Br11 m, doutes Ch, Ux) | RESTE : moteur inchangé par consigne ; à vérifier si ces doses viennent du solveur |

(Section mise à jour à la fin du port : sort réel et preuves.)
