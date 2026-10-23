# Audit des défauts du brasseur : ce qui est encore gardé (23.10.2026)

**Bilan : 119 défauts D. 39 gardés (le script tourne sur les pages actuelles et garde le défaut), 69 à adapter (le défaut vaut encore, le script ne tourne pas sur le format actuel, ou n'existe pas), 6 caducs, 5 au jury.** Fichier lisible par machine : `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json`.

Pages jouées (23.10) : Comparer `fils22-comparer/r6n2/etat.html`, Dryhopper `fils23-dryhopper/serie-g/passe2/g1/etat.html`, baseline `fils18-baseline/l8g/etat-b.html`. Aucun script modifié. Les scripts qui écrivent dans le dossier (`capture.mjs`, `jouer-boosters.mjs`, `controle-lot.mjs`) n'ont été joués que sur une copie du scratchpad. Harnais : `scratchpad/a1/harnais.mjs` (hors dépôt).

## Ce que l'audit établit

1. **Deux familles de scripts.** Les 39 défauts gardés passent par des scripts au format actuel (`<dossier> <id> --page=<fichier>`, ou un fichier de page). Les 69 à adapter passent par 16 scripts ou règles qui lisent l'ancien format `pNN/index.html` (+ `etat-b.html`, `biere.html`, `comparer-radar.html`…) et des marqueurs d'avant (`data-booster`, `data-role="ligne-houblon"`, `data-partie`, `data-plage`).
2. **Faux vert.** Neuf scripts (coherence, comparer, detail, objets, palette, radar, rail, recette, suggestions) impriment « OK 0/0 » (code 0) quand on leur donne un dossier au format actuel : ils ne lisent aucune page. Une GATE « EXPECT: RAIL OK » les verrait passer. Ils couvrent 51 lignes D. Ils sont corrects sur leur cible d'origine : joués sur la base consolide v4.10 (`ecran-1/base`, id `consolide`), rail, recette, radar, détail, comparer, objets, palette, cohérence donnent tous OK 1/1 (suggestions : 35 problèmes, déjà noté D52 bis ; palette met 143 s, rail 83 s).
3. **Le contrôle de remplissage (D4, seuil 0,80) est trop généreux.** `capture.mjs` compte la part des rangées de pixels touchées par la boîte d'un élément : Dryhopper g1 = 0,85, Comparer 0,91, baseline 0,95. `controle-panel.mjs` (M14) compte les rangées qui portent vraiment du contenu : g1 = 0,57, Comparer 0,70, baseline 0,66 (étalonné sur le lot 21 : médiane 0,62 « dense » ; lot 23 : 0,41 « à moitié vide »). Les deux seuils ne se comparent pas. Un lot à 0,85 en boîtes peut être à moitié vide en pixels. Le plancher utile est celui de `controle-panel` (médiane 0,55, aucune capture sous 0,50 sur plus de 20 % du panel), qui lit des PNG et tourne déjà sur le format actuel.
4. **Quatre défauts gardés (D93 à D96) échouent déjà sur les pages actuelles** (le script tourne, il dit ECHEC) : D94 lisible (Comparer L5, Dryhopper L2, baseline L4), D95 simulation et D96 cumul/levure/biotransformation (ECHEC sur les trois : ni simulation, ni réglage, ni choix de levure balisés), D93 fiche-baseline (Comparer B4, Dryhopper B3 + B4). C'est le contrôle qui parle : pas de bug du harnais.
5. **Seuil de mots incohérent.** `mots-premier-ecran --max=80` (D1, SPEC-BRASSEUR § 0 « 80 mots au plus ») : Comparer 79, Dryhopper 77, baseline 70, tous OK. `controle-commun.mjs` joue le même compte à `--max=70` (D86 : « 70 mots ») : Comparer et Dryhopper y échouent (79, 77). Une voie qui joue controle-commun (le contrôle de tout lot) échoue sur le critère le plus strict ; une autre qui ne joue que D1 passe. À trancher par le pilote.
6. **D2 sur Dryhopper.** `capture.mjs` (via controle-lot, copie) trouve 5 tailles de texte à g1 (12, 13, 14, 17, 20 px) pour 3 permises (DESIGN.md, « Trois tailles de texte au plus par écran »). Comparer et baseline : 3.
7. **`check-spec.mjs` (D8) est rouge** : 260/264 citations retrouvées ; 4 citations de SPEC-BRASSEUR.md (dont « Les bar de ce type sont plus informative donc meilleur ») ne sont plus dans les sources lues. Il garde le défaut mais ne passerait plus une GATE.
8. **La règle 3 du registre (« rien sans LOT OK »)** ne peut plus être appliquée telle quelle : `controle-lot.mjs` exige des dossiers `pNN` avec `index.html`, des `data-booster` (0 sur les trois pages) et des captures écrites dans le dossier. Ce qui en reste utilisable est dans `controle-commun.mjs` (12 contrôles au format actuel), `mots-premier-ecran`, `controle-panel` et la vingtaine de scripts à `--page`.

## À adapter

Ordre : ce qui garde le plus de défauts pour Dryhopper et Comparer d'abord. « Effort » : petit (une option `--page`/id à accepter), moyen (nouveaux marqueurs ou nouvelle règle), grand (contrat à réécrire).

### 1. `controle-lot.mjs`, `capture.mjs`, `jouer-boosters.mjs` : le lanceur de la règle 3 (dryhopper, comparer, tout écran)

- Défauts : D2, D3, D4, D5, D7, « D4, D5, D19 bis », D25 bis ; D10 ; D6
- Pourquoi il ne tourne pas (ou plus) : il lit `pNN/index.html` et `etat-b.html`, exige ≥ 4 `data-booster` (aucune page actuelle n'en pose), et écrit `captures/` dans le dossier de la variante (même quand il échoue : `capture.mjs` crée le dossier avant de refuser). Sur une copie : 0 erreur de page et pas de débordement partout ; Dryhopper g1 échoue D2 (5 tailles) ; baseline D5 (2,6 écrans) ; Comparer échoue seulement D6 (0 booster).
- Pour qu'il tourne : une forme `<dossier> <id> --page=<fichier> [--sortie=<tmp>]` qui n'écrit jamais dans le dossier ; remplacer `data-booster` par les marqueurs d'aujourd'hui (`role="slider"`, `data-reglage`, `data-acquis`) ou les poser sur les pages ; ajouter à D4 la mesure en pixels de `controle-panel` (seuil étalonné 0,55 médiane) à côté de la mesure par boîtes (0,80) ; décider du plafond de mots (70 ou 80, constat 5).
- Effort : moyen

### 2. `controle-rail.mjs` : glisser, loupe, extrêmes (dryhopper ; rail)

- Défauts : D27, D28, D34, D35, D36, D37 révisé, D41, D42, D43, D44, D45, D46, D47, D55, D56, D61, D63, D64, D61 bis, D67, D68, D69
- Pourquoi il ne tourne pas (ou plus) : il joue la base : lignes `ligne-houblon`, poignée `glisser-moment`, `cas-k3.html`, `cas-ebu45.html`, loupe `data-role="loupe"`. Sur les pages actuelles : « RAIL OK 0/0 », et sur copie « aucune ligne de houblon repérable ». Dryhopper a un curseur `role="slider"` à 5′ ; seul `controle-acquis --outil=dryhopper` le joue (geste, frise, valeurs, levure : OK 4/4), mais il ne mesure ni la loupe sous le doigt (D47, D63, D67 : ×3 au moins), ni l'extrême haut et bas sans défiler (D69), ni la fluidité (D46), ni le placement par fraction de temps (D61).
- Pour qu'il tourne : une option `--outil=dryhopper` sur le modèle de `controle-acquis` : curseur large, pas de 5′ (D34), plage d'ébullition variable 45′ à 200′ (D36, D37 révisé), deux lâchers dans le whirlpool et en fermentation (D44), loupe (D47, D63, D67), bouts de l'échelle à 620 et 844 px (D69), 10 pas de 6 px sans à-coups (D46). Les règles propres à la base (cas-k3, ajouts proposés hors rail D41…) restent jouées sur `ecran-1/base consolide`.
- Effort : grand

### 3. Comparer : `controle-comparer.mjs`, `controle-fil6.mjs`, `controle-radar.mjs`, `controle-coherence.mjs`, `controle-objets.mjs`, `controle-palette.mjs` (comparer, radar)

- Défauts : comparer : D51, D53 ; fil6 : D57, D58, D59, D60, D65, D66 ; radar : D18, D19, D24, D48, D62, D48 bis, D24 bis ; cohérence : D39 ; objets : D40, D40 bis ; palette : D33, « D33 ter, D40 ter », D33 bis
- Pourquoi il ne tourne pas (ou plus) : tous cherchent `comparer.html`, `comparer-radar.html`, `biere-radar.html` sous `pNN/`. Sur copie, Comparer r6n2 : `controle-comparer` « 0 houblon comparé » (il lui faut `data-plage`, `data-central`, `data-origine` : r6n2 n'en pose aucun), `controle-radar` « valeurs hors de 0 à 2 » et axes hors de l'ordre de la roue (contrat de citations 0 à 2 de D24 ; r6n2 dessine autre chose, vraisemblablement les intervalles du § 0 de la spec), `controle-fil6` « style 16D non repéré, aucune barre-plage », `controle-palette` 6 teintes saturées (cause non élucidée). `controle-coherence` et `controle-objets` donnent OK sur copie : il suffit de leur apprendre `<dossier> <id> --page`.
- Pour qu'il tourne : coherence et objets : accepter `--page` (petit). palette : élucider les 6 teintes, puis `--page` (petit à moyen). radar, comparer, fil6 : écrire le contrat de Comparer du lot 22 (barres-plage et centre, radar à intervalles, D103 « plus de 8 axes sur 12 au bord » à écrire, inconnu ≠ 0 D65, nom d'échelle D66) ; c'est le travail d'une voie de contrôles de Comparer (grand). Le défaut D77 (radar-series) tourne déjà.
- Effort : petit pour coherence, objets, palette ; grand pour radar, comparer, fil6

### 4. Écrans de la base : `controle-recette.mjs`, `controle-detail.mjs`, `controle-suggestions.mjs` (recette, ma-biere)

- Défauts : recette : D13, D16, D17, D20, D22, D23, D23 ter, D29 ; détail : D31, D32 ; suggestions : D52 et D52 bis, caducs
- Pourquoi il ne tourne pas (ou plus) : ils visent l'étape recette et Ma bière de la base (`index.html`, `biere.html`, `biere-absolu.html`, `cas-k3.html`). Ils tournent et passent sur `ecran-1/base consolide` (recette OK 1/1, détail OK 1/1) ; ils ne sont pas à jouer sur un outil. Ils ne deviennent un souci que si une voie retouche ces écrans.
- Pour qu'il tourne : rien tant qu'aucun lot ne touche la recette ou Ma bière ; alors, jouer `controle-recette.mjs <ecran-1/base> consolide` et `controle-detail.mjs`, et ajouter `--page` pour une variante. Les défauts D22 et D96 (levure, biotransformation) sont déjà repris pour les outils par `controle-cumul-levure` (ECHEC aujourd'hui).
- Effort : petit

### 5. Fiche : `controle-appui.mjs`, `controle-carte-fiche.mjs` (fiche, carte-houblon)

- Défauts : D70 ; D71, D72, D73
- Pourquoi il ne tourne pas (ou plus) : ils attendent `vue.html`, `appui.html`, `fiche-nugget.html`, `fiche-citra.html` par variante (lots 12 et 13). `controle-appui` sur fils12b : OK 6/6 ; `controle-carte-fiche --base` : OK 1/1. Le contrôle de fiche qui tourne sur les pages actuelles est D25, D49, D93 (FICHE OK ×3 ; FICHE-BASELINE échoue sur Comparer et Dryhopper).
- Pour qu'il tourne : pour une variante qui change la carte ou la fiche : l'option `--page` et la fiche ouverte par l'appui long (comme `controle-fiche`) au lieu de pages dédiées ; D70 (l'actuel intact au repos, hauteur à 6 px) se joue sur la carte de la base.
- Effort : moyen

### 6. `fuite-touchers.mjs` (D14 bis), pour tout écran

- Défauts : D14 bis
- Pourquoi il ne tourne pas (ou plus) : il lit `pNN/index.html`. Sur copie il donne FUITE OK (30 touchers baseline, 17 Comparer, 9 Dryhopper).
- Pour qu'il tourne : accepter `<dossier> <id> --page=<fichier>`. C'est la seule garde du texte technique après un toucher (D14 est caduc au profit de D97 au chargement et de D14 bis après le toucher).
- Effort : petit

### 7. Sans script : D50 (méthode), D103 (radar)

- Défauts : D50, D103 (prédit)
- Pourquoi il ne tourne pas (ou plus) : D50 est une règle de méthode : aucun script ne vérifie que tout est montré au brasseur avant intégration ; `systeme.mjs voies` en porte une partie (M12, M13), non jouée ici. D103 est « à écrire » : `controle-radar` n'a aucune règle sur les bandes d'intervalle.
- Pour qu'il tourne : D50 : une ligne de `systeme.mjs voies` ou de GATES qui vérifie « variante rejetée relancée ou écartée, et publiée » (M12) et cite le choix du brasseur. D103 : écrire la règle avec les entrées de r6n2 (haut non borné).
- Effort : moyen

## Caducs

- **D14** (capture.mjs, jouer-boosters.mjs) : remplacé par D97 (controle-valeurs-brutes, joue sur les pages actuelles) et D14 bis (fuite-touchers, après chaque toucher).
- **D21** (controle-recette.mjs) : remplacé par D23 (« D21 révisé » : la liste d'achats n'est plus exigée, le stock est une icône).
- **D26** (controle-baseline.mjs <dossier> <baseline>) : remplacé par L07 et SPEC-BRASSEUR § 0 (« la baseline est un plancher à enrichir, toujours suivi ») ; son suivi se mesure par D93, D88 à D90 et l'exigence M13 « la baseline est dans les contrôles ».
- **D37** (controle-rail.mjs) : remplacé par D37 révisé (« C'est defini ailleur dans l'application » : la durée d'ébullition s'affiche avec un renvoi, sans champ ni −/+).
- **D52** (controle-suggestions.mjs) : remplacé par D52 bis (contrat dépassé : levure, dry hop et biotransformation demandés ; la vue Suggestions se contrôle par FIL6, D76 et D78 à D82, et D25 pour la fiche).
- **D52 bis** (controle-suggestions.mjs (pour mémoire) ; FIL6, D76, D78 à D82) : remplacé par FIL6 (D57 à D60), D76, D78 à D82 et FICHE (D25) selon D52 bis lui-même.

Le jugement le plus discutable est **D26** : « texte identique hors composant » contredit L07 (la baseline est un plancher à enrichir) et SPEC-BRASSEUR § 0. Si le pilote préfère le garder pour les lots de composant, il passe en « à adapter » (le script demande `planche.html` et une page du même nom que la baseline).

Ne sont **pas** caducs, malgré leur âge : D1 à D5 (DESIGN.md et SPEC § 0 les répètent), D6 et D7 (SPEC § 0 : « des UX boosters (curseurs, bascule barres et radar) ; D6, D7, D74 »), D13 à D17, D20, D22, D23, D29 (penser en brasseur, D87).

## Portée par sujet

Pour chaque sujet : les contrôles qui le gardent (**tournent** sur les pages actuelles, à jouer par une voie de ce sujet), puis ceux **à adapter** (défaut valide, script qui ne tourne pas : la voie doit les faire adapter ou noter qu'ils ne sont pas joués), puis le jury. Appel type des scripts à `--page` : `node work/refonte-frontend/v4/tournoi/outils/<script> <dossier> <id> --page=<fichier>` (`--pages=` pour au-style, autres-ajouts, sens-survol, fiche, radar ; un chemin de page pour radar-series et standard ; `controle-commun.mjs <dossier> <id> --page=<fichier>` joue douze contrôles à la fois ; `controle-acquis.mjs … --outil=dryhopper` pour Dryhopper). Chaque ligne donne les D couverts.

### tout-ecran : tout écran

- **Tournent et gardent** : `mots-premier-ecran.mjs` (D1) ; `controle-au-style.mjs` (D75) ; `controle-sens-survol.mjs` (D81) ; `controle-standard.mjs` (D83) ; `controle-contraste.mjs` (D86) ; `controle-pictos-trait.mjs` (D88) ; `controle-legende.mjs` (D89) ; `controle-valeurs-brutes.mjs` (D97)
- **À adapter** : `controle-lot.mjs` (D2, D3, D4, D5, « D4, D5, D19 bis ») ; `jouer-boosters.mjs` (D6) ; `capture.mjs` (D10) ; `fuite-touchers.mjs` (D14 bis) ; `controle-palette.mjs` (D33)
- **Jury** : D11, D30
- Caducs (ne pas jouer) : D14

### rail : rail (moment, loupe, glisser)

- **Tournent et gardent** : aucun
- **À adapter** : `controle-rail.mjs` (D27, D28, D34, D35, D36, D37 révisé, D41, D42, D43, D44, D45, D46, D47, D55, D56, D61, D63, D64, D61 bis, D67, D68, D69)
- **Jury** : aucun
- Caducs (ne pas jouer) : D37

### radar

- **Tournent et gardent** : `controle-radar-series.mjs` (D77)
- **À adapter** : `controle-lot.mjs` (D7) ; `controle-radar.mjs` (D18, D19, D24, D48, D62, D48 bis, D24 bis) ; `controle-coherence.mjs` (D39) ; `controle-objets.mjs` (D40, D40 bis) ; `controle-fil6.mjs` (D60, D65, D66) ; `controle-carte-fiche.mjs` (D72) ; `aucun` (D103 (prédit)) ; `controle-palette.mjs` (« D33 ter, D40 ter »)
- **Jury** : aucun

### comparer

- **Tournent et gardent** : `controle-autres-ajouts.mjs` (D76) ; `controle-radar-series.mjs` (D77) ; `controle-alpha.mjs` (D87) ; `controle-lisible.mjs` (D94) ; `controle-simulation.mjs` (D95) ; `controle-une-question.mjs` (D98) ; `controle-acquis.mjs` (D99) ; `controle-sans-famille.mjs` (D100) ; `controle-reprise.mjs` (D104)
- **À adapter** : `controle-lot.mjs` (D7) ; `controle-radar.mjs` (D18, D19, D24 bis) ; `controle-comparer.mjs` (D51, D53) ; `controle-fil6.mjs` (D57, D58, D59) ; `controle-objets.mjs` (D40 bis) ; `aucun` (D103 (prédit)) ; `controle-palette.mjs` (D33 bis)
- **Jury** : D12

### fiche

- **Tournent et gardent** : `controle-fiche.mjs` (D25, D49) ; `controle-fiche-baseline.mjs` (D93)
- **À adapter** : `controle-coherence.mjs` (D39) ; `controle-objets.mjs` (D40) ; `controle-appui.mjs` (D70) ; `controle-carte-fiche.mjs` (D71, D72, D73) ; `controle-lot.mjs` (D25 bis) ; `controle-palette.mjs` (« D33 ter, D40 ter »)
- **Jury** : D12

### carte-houblon

- **Tournent et gardent** : `controle-fiche.mjs` (D25, D49) ; `controle-usage-intensite.mjs` (D80) ; `controle-alpha.mjs` (D87) ; `controle-usage-parlant.mjs` (D90) ; `controle-sans-famille.mjs` (D100)
- **À adapter** : `controle-recette.mjs` (D29) ; `controle-appui.mjs` (D70) ; `controle-carte-fiche.mjs` (D71)
- **Jury** : aucun

### suggestions

- **Tournent et gardent** : `tolerance.test.ts` (D54) ; `controle-couleurs.mjs` (D74) ; `controle-autres-ajouts.mjs` (D76) ; `controle-moments.mjs` (D78) ; `controle-ma-biere.mjs` (D79) ; `controle-usage-intensite.mjs` (D80) ; `controle-gros-blocs.mjs` (D82) ; `controle-place-voies.mjs` (D84) ; `controle-alpha.mjs` (D87) ; `controle-usage-parlant.mjs` (D90, D91) ; `controle-piste-objectif.mjs` (D92) ; `controle-cumul-levure.mjs` (D96) ; `controle-une-question.mjs` (D98)
- **À adapter** : `controle-radar.mjs` (D19) ; `controle-recette.mjs` (D20, D23) ; `controle-detail.mjs` (D32) ; `controle-objets.mjs` (D40) ; `controle-fil6.mjs` (D59, D60)
- **Jury** : D12, D15
- Caducs (ne pas jouer) : D52, D52 bis

### recette

- **Tournent et gardent** : aucun
- **À adapter** : `controle-recette.mjs` (D13, D16, D17, D20, D22, D23, D23 ter, D29) ; `controle-rail.mjs` (D27)
- **Jury** : aucun
- Caducs (ne pas jouer) : D21

### ma-biere

- **Tournent et gardent** : `tolerance.test.ts` (D54) ; `controle-ma-biere.mjs` (D79)
- **À adapter** : `controle-radar.mjs` (D19) ; `controle-detail.mjs` (D31, D32) ; `controle-objets.mjs` (D40)
- **Jury** : D12

### dryhopper

- **Tournent et gardent** : `controle-moments.mjs` (D78) ; `pouvoir.test.ts` (D85) ; `controle-alpha.mjs` (D87) ; `controle-lisible.mjs` (D94) ; `controle-simulation.mjs` (D95) ; `controle-cumul-levure.mjs` (D96) ; `controle-une-question.mjs` (D98) ; `controle-acquis.mjs` (D99)
- **À adapter** : `controle-recette.mjs` (D22) ; `controle-rail.mjs` (D27, D69)
- **Jury** : aucun

### levure

- **Tournent et gardent** : `controle-lisible.mjs` (D94) ; `controle-simulation.mjs` (D95) ; `controle-cumul-levure.mjs` (D96) ; `controle-une-question.mjs` (D98)
- **À adapter** : `controle-recette.mjs` (D22) ; `controle-rail.mjs` (D28)
- **Jury** : aucun

### picto

- **Tournent et gardent** : `controle-pictos-trait.mjs` (D88) ; `controle-planche-picto.mjs` (D101, D101 bis, D101 ter, D101 quater)
- **À adapter** : aucun
- **Jury** : aucun

### donnees : donnees (moteur, JSON)

- **Tournent et gardent** : `check-spec.mjs` (D8) ; `check:engine` (D9) ; `tolerance.test.ts` (D54) ; `pouvoir.test.ts` (D85) ; `controle-lisible.mjs` (D94) ; `controle-sans-famille.mjs` (D100) ; `controle-entrees-lot22.mjs` (D102)
- **À adapter** : `controle-fil6.mjs` (D65)
- **Jury** : aucun

### page-lot

- **Tournent et gardent** : `controle-reprise.mjs` (D104) ; `controle-entrees-lot22.mjs` (D102)
- **À adapter** : `aucun` (D50) ; `controle-lot.mjs` (D25 bis)
- **Jury** : D38
- Caducs (ne pas jouer) : D26

### Jeu à rejouer par type de voie (réunion des sujets, `tout-ecran` toujours inclus)

Une voie ne joue pas seulement son sujet : tout écran est aussi dans la liste `tout-ecran`.

- **Voie Dryhopper** (tout-ecran + dryhopper + levure + rail + donnees). À jouer : `mots-premier-ecran.mjs`, `check-spec.mjs`, `check:engine`, `tolerance.test.ts`, `controle-au-style.mjs`, `controle-moments.mjs`, `controle-sens-survol.mjs`, `controle-standard.mjs`, `pouvoir.test.ts`, `controle-contraste.mjs`, `controle-alpha.mjs`, `controle-pictos-trait.mjs`, `controle-legende.mjs`, `controle-lisible.mjs`, `controle-simulation.mjs`, `controle-cumul-levure.mjs`, `controle-valeurs-brutes.mjs`, `controle-une-question.mjs`, `controle-acquis.mjs`, `controle-sans-famille.mjs`, `controle-entrees-lot22.mjs`. À adapter d'abord, sinon à déclarer non joués : `controle-lot.mjs`, `jouer-boosters.mjs`, `capture.mjs`, `controle-recette.mjs`, `fuite-touchers.mjs`, `controle-rail.mjs`, `controle-palette.mjs`, `controle-fil6.mjs`.
- **Voie Comparer** (tout-ecran + comparer + radar + fiche + carte-houblon + donnees). À jouer : `mots-premier-ecran.mjs`, `check-spec.mjs`, `check:engine`, `controle-fiche.mjs`, `tolerance.test.ts`, `controle-au-style.mjs`, `controle-autres-ajouts.mjs`, `controle-radar-series.mjs`, `controle-usage-intensite.mjs`, `controle-sens-survol.mjs`, `controle-standard.mjs`, `pouvoir.test.ts`, `controle-contraste.mjs`, `controle-alpha.mjs`, `controle-pictos-trait.mjs`, `controle-legende.mjs`, `controle-usage-parlant.mjs`, `controle-fiche-baseline.mjs`, `controle-lisible.mjs`, `controle-simulation.mjs`, `controle-valeurs-brutes.mjs`, `controle-une-question.mjs`, `controle-acquis.mjs`, `controle-sans-famille.mjs`, `controle-reprise.mjs`, `controle-entrees-lot22.mjs`. À adapter d'abord, sinon à déclarer non joués : `controle-lot.mjs`, `jouer-boosters.mjs`, `capture.mjs`, `controle-radar.mjs`, `fuite-touchers.mjs`, `controle-recette.mjs`, `controle-palette.mjs`, `controle-coherence.mjs`, `controle-objets.mjs`, `controle-comparer.mjs`, `controle-fil6.mjs`, `controle-appui.mjs`, `controle-carte-fiche.mjs`, `aucun`.
- **Voie Suggestions / Ma bière** (tout-ecran + suggestions + ma-biere + carte-houblon + radar + donnees). À jouer : `mots-premier-ecran.mjs`, `check-spec.mjs`, `check:engine`, `controle-fiche.mjs`, `tolerance.test.ts`, `controle-couleurs.mjs`, `controle-au-style.mjs`, `controle-autres-ajouts.mjs`, `controle-radar-series.mjs`, `controle-moments.mjs`, `controle-ma-biere.mjs`, `controle-usage-intensite.mjs`, `controle-sens-survol.mjs`, `controle-gros-blocs.mjs`, `controle-standard.mjs`, `controle-place-voies.mjs`, `pouvoir.test.ts`, `controle-contraste.mjs`, `controle-alpha.mjs`, `controle-pictos-trait.mjs`, `controle-legende.mjs`, `controle-usage-parlant.mjs`, `controle-piste-objectif.mjs`, `controle-lisible.mjs`, `controle-cumul-levure.mjs`, `controle-valeurs-brutes.mjs`, `controle-une-question.mjs`, `controle-sans-famille.mjs`, `controle-entrees-lot22.mjs`. À adapter d'abord, sinon à déclarer non joués : `controle-lot.mjs`, `jouer-boosters.mjs`, `capture.mjs`, `controle-radar.mjs`, `controle-recette.mjs`, `fuite-touchers.mjs`, `controle-detail.mjs`, `controle-palette.mjs`, `controle-coherence.mjs`, `controle-objets.mjs`, `controle-fil6.mjs`, `controle-appui.mjs`, `controle-carte-fiche.mjs`, `aucun`.
- **Voie picto** (tout-ecran + picto). À jouer : `mots-premier-ecran.mjs`, `controle-au-style.mjs`, `controle-sens-survol.mjs`, `controle-standard.mjs`, `controle-contraste.mjs`, `controle-pictos-trait.mjs`, `controle-legende.mjs`, `controle-valeurs-brutes.mjs`, `controle-planche-picto.mjs`. À adapter d'abord, sinon à déclarer non joués : `controle-lot.mjs`, `jouer-boosters.mjs`, `capture.mjs`, `fuite-touchers.mjs`, `controle-palette.mjs`.

Compléments hors liste D, utiles à toute voie d'écran : `controle-commun.mjs` (douze contrôles à la fois : mots à 70, couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) ; `controle-panel.mjs <captures…>` (M14 : remplissage en pixels et diversité d'un panel, à utiliser à côté de D4) ; `capture-page.mjs <page.html> <sortie.png> 844` pour prendre la capture que `controle-panel` lit (à écrire dans `os.tmpdir()`).

Rappel de lecture : « tournent et gardent » ne veut pas dire « verts ». Un contrôle qui tourne peut donner ECHEC sur la page actuelle quand le défaut y est (D93, D94, D95, D96, D98 sur la baseline, hors portée) : la voie doit lire le verdict contre la portée du défaut (D92 piste sur Dryhopper donne ECHEC « aucun objectif » : hors portée, pas une faute).
