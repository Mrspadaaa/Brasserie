# Verdict de passe 2 — Stocks › Matériel, variantes v1 (14.11.2026)

Juge : critique, en Opus (Fable interdit). Toutes les captures v1 ont été ouvertes : les 5 planches, puis pour chaque variante
repos, cave et geste côte à côte à l'échelle 1 (390 px CSS), traiter, ajout et vide côte à côte (et `rayon` pour uq2), et la
capture 1280 en plein format. Deux zones ont été agrandies : le vide de rq1 et l'étiquette de zq2 à 1280. Une mesure DOM a été
faite sur les 12 `etat.html` × 5 états à 390 : texte < 12 px, cible < 44 px sur un bouton de geste, débordement.

**La passe a progressé.** Les défauts v0 de la SYNTHESE sont corrigés presque partout :
- plus aucun « −6 j » ni « 9 j » seul ;
- l'instrument jamais étalonné compte dans « À traiter » ;
- plus de « champ neuf » à l'écran ;
- la coque de l'app est reprise : en-tête de 36 px, logo, soleil en cave ;
- Achat, Déjà possédé et Projets sont visibles ;
- les fiches sont remplies.

Toutes les dates ont été recalculées depuis le 14.11.2026 ; aucun chiffre faux. Il y a un seul bloquant, dans rq1.

Problèmes communs, non bloquants (comptés une seule fois ici) :
- **C1.** Dans la barre d'outils, « Achat » ou « Acheter » et « Déjà possédé » font 32 à 36 px de haut dans rq2, zq3, zq4,
  uq1, uq2, uq3 et uq4 (mesure DOM). Ce n'est pas un geste fréquent du §4, mais la synthèse demandait 44 px (zq1 D4).
  Correction : 44 px.
- **Doutes, non comptés.**
  - À 1280, l'en-tête montre un sélecteur « Ce mois » dans les 12 variantes. Je ne sais pas si l'app l'affiche sur Stocks :
    à vérifier contre `M/banc`.
  - Les boutons de l'en-tête font 28 px : c'est la coque de l'app, pas la variante.

### rq1
**A REPRENDRE** (une seule correction) — Articles mot pour mot, avec une jauge sous chaque nom.
- P1. **Bloquant.** État vide, carte « Matériel 0 » : le bouton « Enregistrer un achat » mesure 340 × 22 px (mesure DOM et
  capture agrandie). C'est le geste principal de cet état, et il est écrasé. Correction : 44 px de haut, comme « Déjà
  possédé » juste dessous.
- P2. Ajout, choix du rayon : la tuile dit « Bouteilles ». L'app dit « Embouteillage ». Correction : le nom de l'app.
- P3. Ajout : environ 100 px de blanc sous Notes, au-dessus des boutons. Correction : remonter la feuille ou la raccourcir.
- P4. Repos : la légende « écoulé » montre une barre brune, alors que les barres de Mesure sont bleues (la teinte suit le
  rayon). Correction : légende neutre (« ▬ écoulé, teinte du rayon »).
- P5. Traiter : le toast se coupe en « retirée de « à traiter » / » », avec le guillemet seul à la ligne. Correction :
  « Pompe réparée · Annuler ».
- P6. Le ✓ du pH-mètre et du densimètre enregistre un étalonnage d'un toucher, sans valeurs lues (défaut D3 de rq2 en
  v0). Correction : ce ✓ ouvre la saisie des tampons.
- P7. À 1280 : le pied « Valeur du parc 1 739 CHF » touche la barre du bas. Correction : 12 px de marge.

### rq2
**MONTRABLE** — d'abord à faire, puis le reste.
- P1. C1 : Achat (78 × 36) et Déjà possédé (104 × 36) dans l'en-tête « Le reste ».
- P2. Ajout : « Embouteil-lage » se coupe sur deux lignes dans sa tuile de 12 px. Correction : des tuiles plus larges, ou
  le picto seul avec son nom dessous sur une ligne.
- P3. Vide : environ 150 px de blanc entre « Matériel 0 » et les lignes fantômes. Correction : remonter le bloc.
- P4. Cave : la piste du rythme se voit à peine derrière l'écoulé (l'auteur le note aussi). Correction : une piste plus
  claire.
- P5. À 1280 : environ 150 px de blanc sous le tableau ; le journal à gauche est la bonne idée. Rien à corriger.

### rq3
**MONTRABLE** — frise des 30 jours et tableau par échéance.
- P1. Le ✓ de ligne du pH-mètre et du densimètre valide un étalonnage sans valeurs lues. Correction : il ouvre la saisie
  (« Écart aux tampons »).
- P2. Traiter : « pH-mètre » est barré alors qu'il vient d'être étalonné, et le barré se lit « supprimé ». Correction : le
  nom entier, le vert seul.
- P3. Vide : une phrase d'aide de deux lignes (« Un achat crée la fiche… »). Correction : la retirer ; les deux boutons
  suffisent.
- P4. À 390, les étiquettes de la frise (12 px, serrées sur 5 lignes) sont à la limite de la lecture d'un coup d'œil.
  Correction : garder 3 lignes à 390, le reste à 1280.

### rq4
**MONTRABLE** — l'étagère de tuiles à picto.
- P1. Repos à 390 : « Enregistrer un achat » n'est plus en tête. Il n'existe que dans la case « acheter » de chaque étagère,
  et en lien texte à l'état traiter. Correction : un bouton Achat dans la barre, à côté d'« À traiter ».
- P2. Repos à 390 : seules Brassage et Mesure tiennent au premier écran (9 appareils). Embouteillage, Stockage et Atelier
  passent sous le pli. Correction : des tuiles plus basses pour les appareils sans entretien.
- P3. Picto du réfractomètre : il ressemble encore à un pistolet ou à une seringue. C'est un doute de goût : à faire nommer
  par le brasseur, sans rejet.
- P4. Vide : une phrase d'aide. Correction : la retirer.
- P5. À 1280 : environ 190 px de blanc sous les étagères. Rien de bloquant.

### zq1
**MONTRABLE** — le fil des échéances, à leur vraie distance.
- P1. Le fil est maintenant juste : 17 j au 01.12, 36 j au 20.12, 44 j au 28.12, 108 j au 02.03, vérifiés sur l'échelle.
  Les mois (« déc. », « janv. », « mars ») restent en gris pâle, petits, sur la gauche. Correction : les passer en 12 px
  et en encre secondaire.
- P2. À 390, la date ne se lit pas sous les jours ; seul le 1280 a « dans 17 j · 01.12 ». Correction : la date sous les
  jours à 390 aussi (greffe faite dans uq2).
- P3. Traiter : environ 150 px de blanc au-dessus du toast. Correction : y remonter « 9 à jour · Tout ».
- P4. Fiche à 1280 : environ 200 px de blanc entre État et les boutons. Correction : les notes, ou les étapes repliées.

### zq2
**MONTRABLE** — le panneau à outils, avec ses étiquettes pendues.
- P1. Fiche : les chiffres « 7,00 » et « 4,00 » sur les flacons sont en 8,5 px (mesure DOM), sous le plancher de 12 px.
  Correction : les retirer du flacon (le libellé « tampon pH 7 » est écrit à côté) ou les passer en 12 px.
- P2. À 1280, zone Mesure : « jamais étalonné » dépasse le bord droit de son étiquette jaune (capture agrandie).
  Correction : une étiquette plus large, ou « jamais étal. » sur deux lignes.
- P3. À 390, les noms se coupent par césure (« Cuve d'ébul-lition », « Cuve fermen-tation », « Réfracto-mètre »,
  « Déshumidi-ficateur »). Ils restent lisibles, mais le brasseur lit mal un nom coupé. Correction : des cases plus larges
  pour les noms longs.
- P4. Traiter : la barre « Étalonné · Annuler » couvre la rangée Atelier (voulu, 4 s). Rien à corriger.
- P5. Fiche à 390 : environ 240 px libres sous les dépenses (l'auteur le note aussi). Correction : les notes et
  « utilisé dans N brassins » dépliés.

### zq3
**MONTRABLE** — la ligne d'échéance commune, avec le nom dans la barre.
- P1. C1 : Achat (82 × 32) et Déjà possédé (129 × 36).
- P2. Cave : l'écoulé se lit surtout par la strie basse ; le fond de la barre reste très sombre. C'est lisible, mais moins
  qu'en clair. Correction : un fond d'écoulé un cran plus clair.
- P3. Traiter : environ 250 px de blanc entre « ensuite » et le toast. Correction : montrer les 30 prochains jours en
  entier.
- P4. Vide : une phrase d'aide en « tu » (« Ajoute un appareil… »). Correction : la retirer, ou la mettre dans le ton de
  l'app.
- P5. À 1280 : la fiche n'a pas les dépenses reliées (l'auteur le note aussi). Correction : les ajouter sous la règle.

### zq4
**MONTRABLE** — les bons de travail pendus à la tringle.
- P1. C1 : Achat (82 × 34), Déjà possédé (129 × 34) et la loupe (40 × 34).
- P2. Traiter : le talon « RÉPARÉE 14.11 », penché, colle au bord gauche de l'écran. Il rétrécit la liste « ensuite », et
  « Frigo levures & houblons » passe sur deux lignes. Correction : poser le talon sous la tringle, sur toute la largeur.
- P3. Le « 4 » de « À faire 4 » est rouge alors que trois bons sur quatre ne sont pas des pannes (défaut D3 de uq2 en
  v0). Correction : un chiffre neutre.
- P4. Vide : une phrase d'aide. Correction : la retirer.

### uq1
**MONTRABLE** — rayons d'Articles avec une jauge sous chaque nom.
- P1. C1 : Acheter (99 × 34) et Déjà possédé (113 × 34).
- P2. À 1280, frise « Les quatre prochains mois » : les points sont bleus, bruns ou gris selon le rayon, mais la légende ne
  nomme que le rouge et le gris (D259). Correction : une seule teinte d'échéance, ou les rayons dans la légende.
- P3. Fiche : le titre « Ce qui s'est passé » est flou (rq1 D7 en v0). Correction : « Historique ».
- P4. Vide : le « + » de chaque rayon fait 32 px. Correction : 44 px.

### uq2
**MONTRABLE** — chaque appareil a sa jauge contre un même trait « dû ». C'est la candidate A, et les greffes sont faites.
- P1. C1 : Acheter (99 × 34), Déjà possédé (113 × 34) et la loupe (34 × 34).
- P2. Vide : le parc s'affiche « — » sur une ligne et « aucun prix connu » sur la suivante, décalés à droite. Correction :
  « Parc — · aucun prix connu » sur une ligne.
- P3. Vide, tuiles de rayon : « Embou-teillage » se coupe sur deux lignes. Correction : une tuile plus large, ou
  « Embouteillage » en 12 px sur une ligne.
- P4. Cave : l'écoulé (encre à 42 %) se lit, mais la piste restante se confond avec le fond de la ligne. Correction : un
  bord à la piste.

### uq3
**MONTRABLE** — la chaîne du brassin : « puis-je brasser ? ».
- P1. C1 : Acheter (98 × 36) et Déjà possédé (136 × 36).
- P2. Traiter : le bouton « Payer » de la pompe réparée fait environ 30 px. Correction : 44 px, ou « Payer la réparation »
  en lien.
- P3. Ajout : l'état ne propose que Neuf, Bon et À entretenir ; « À réparer » manque (l'app en a 4). Correction : les 4
  états.
- P4. Les rails sont bruns (brassage), bleus (mesure) et gris (atelier), sans légende. Ils sont nommés par l'étape, donc ce
  n'est qu'un doute ; je le signale parce que je suis connu pour être trop clément devant plusieurs couleurs.

### uq4
**MONTRABLE** — grille de tuiles à anneau ; les appareils sans rappel en tuiles basses.
- P1. C1 : Acheter (99 × 36).
- P2. Ajout : « Catégorie » ne propose que Mesure, Brassage et Atelier ; Embouteillage et Stockage manquent. « À réparer »
  manque aussi. Correction : les 5 catégories et les 4 états de l'app.
- P3. Ajout : la grille « Quel appareil ? » n'a que des pictos, sans nom. Correction : le nom sous chaque picto, en 12 px.
- P4. Traiter : environ 290 px de blanc entre la légende et le toast. Correction : y montrer les prochaines échéances.
- P5. Doute de goût, non compté : la cuve d'ébullition se lit comme une tasse fumante, et le réfractomètre comme un stylo.
  À faire nommer par le brasseur.

## Classement

1. **uq2** : la jauge contre un trait dû commun se lit en trois secondes ; c'est la plus complète, et toutes les greffes sont
   prises.
2. **zq3** : la ligne d'échéance commune et le nom dans la barre ; la fiche (cycles, règle de tolérance) est la plus
   parlante.
3. **zq1** : le temps à sa vraie distance, désormais juste ; l'étalonnage se fait pas à pas avec les flacons.
4. **uq3** : la seule qui répond à « puis-je brasser ? » ; rail ressoudé, dérive de la sonde.
5. **rq3** : frise et tableau, la plus riche en données ; « Écart aux tampons » propre.
6. **uq1** : Articles enrichi d'une jauge ; sûre et propre, mais sans surprise.
7. **rq2** : « À faire » d'abord, le verbe juste sur chaque bouton ; le journal à 1280.
8. **zq4** : les bons de travail, une vraie forme ; l'étalonnage pas à pas.
9. **rq1** : Articles mot pour mot, bonne fiche ; un bloquant dans l'état vide.
10. **uq4** : tout le parc d'un coup ; pictos encore discutables, et ajout incomplet.
11. **rq4** : l'étagère est soignée, mais Achat a quitté la tête et trois rayons passent sous le pli.
12. **zq2** : le panneau est audacieux, mais les noms sont coupés et l'étiquette déborde à 1280.

## Une phrase par variante

- **rq1** : la liste d'Articles, une jauge d'entretien sous chaque appareil.
- **rq2** : ce qui est à faire en tête, le reste dessous.
- **rq3** : la frise du mois qui vient au-dessus du tableau des échéances.
- **rq4** : une étagère par rayon, une tuile à picto par appareil.
- **zq1** : un fil du temps : ce qui est dû remonte au-dessus d'aujourd'hui.
- **zq2** : un panneau à outils, chaque appareil à traiter porte son étiquette.
- **zq3** : chaque appareil court vers une même ligne rouge d'échéance.
- **zq4** : des bons de travail pendus à la tringle, à décrocher une fois faits.
- **uq1** : des rayons pliables, comme Articles, avec l'échéance en clair.
- **uq2** : une jauge par appareil, toutes alignées sur le même trait dû.
- **uq3** : la chaîne du brassin : où ça bloque, et si je peux brasser.
- **uq4** : une grille de tuiles à anneau d'entretien, tout le parc d'un coup.
