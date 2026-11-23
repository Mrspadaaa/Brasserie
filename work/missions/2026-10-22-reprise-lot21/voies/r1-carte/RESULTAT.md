OK — carte houblons en fil de fer, passe 2 : radar 12 axes, α ≠ fiches, écrans pleins

Relance 1 sur 2, après le rejet du critique (`voies/r5-critique-carte/RESULTAT.md`). La structure est gardée : titres-questions, « varie » / « fixé », deux façons côte à côte. Ce qu'il approuvait est conservé : « aucun houblon ne baisse le résineux », « IBU 60 → ~162 », « +2 : ? », « après fermentation, rien ne change », le tableau a2b.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-carte/generer.mjs`, réécrit. Il génère les huit `etat.html` et `carte.html` à partir de `comparer-stout.json` et de `base/consolide/substitution.html`. Avec `--captures`, il produit les captures et `captures/mesures.json` (part du premier écran remplie, loupe).
- `fils22-carte/{ma-biere,suggerer,comparer,substituer-porte,substituer-outil,dryhopper,levure-etape,levure-outil}/etat.html`, `carte.html`
- `fils22-carte/NOTE.md` : carte en table, section « Passe 2 », ce qui tient, ce qui casse, fiche et légende laissées aux lots d'outil.
- `fils22-carte/captures/` :
  - `carte-390.png`, `ma-biere-390.png`, `suggerer-390.png`, `comparer-390.png`, `comparer-legende-390.png` ;
  - `substituer-porte-390.png`, `substituer-outil-390.png` ;
  - `dryhopper-390.png`, `dryhopper-60-390.png`, `dryhopper-toucher-390.png` ;
  - `levure-etape-390.png`, `levure-outil-390.png`, `mesures.json`.

## Corrections, point par point du critique
- **Radar de Comparer** (D48, D57, D39, D77) : 12 axes dans l'ordre de la roue de la base (lot 16 r2, agrumes en haut), contrat `data-radar` / `data-axes` / `data-serie`.
  - La seule surface pleine est la zone du style.
  - Un trait de 2,5 px par houblon, sans tiret.
  - Plus de série noire sans nom.
  - Les secteurs non situés sont hachurés. Au-delà de ×2 la zone, un trait sort du cercle.
  - `controle-radar-series` : `RADAR-SERIES OK`.
- **Écrans à moitié vides** (D4) : chaque écran remplit désormais 0,80 à 0,82 de son premier écran (`mesures.json` : ma-biere 0,82 ; suggerer 0,81 ; comparer 0,80 ; substituer-porte 0,82 ; substituer-outil 0,83 ; dryhopper 0,81 ; levure-etape 0,81 ; levure-outil 0,81). Le contenu vient de la base, en 70 mots au plus :
  - 12 familles dans Ma bière et Dryhopper ;
  - perd / gagne, huile totale et proximité par composante dans Substituer ;
  - familles qui bougent puis « sans effet » dans Levure.
- **α** (D87, L14) : l'α du lot, puis la plage des fiches, et « ≠ » en orangé quand le lot sort des fiches :
  - Galaxy 17,2 % ≠ 11–16 ; Nelson Sauvin 9,6 % ≠ 10–14 ;
  - Magnat, sans lot : la plage seule.
  - L'α figure aussi dans le jeton « Idaho 7 » de Dryhopper et des deux Levure.
  - `controle-alpha` : `ALPHA OK`.
- **Suggérer, extras** (D76) : sous chaque candidat, toutes les familles hors objectif qui apportent au moins 0,5 point, avec picto et barre à la couleur de la famille. Elles sont soulignées en orangé si elles sortent du style (Galaxy : tropicaux et résineux). La plus forte est chiffrée.
- **Autres points du rapport** :
  - Ma bière : « hors style » au lieu de ×2,8 ; profil en couleur.
  - Substituer : familles citées seulement, plus de cases vides. La bande grise marque les familles du 16D. Plus de « proche 99 » qui ne sépare rien : perd / gagne à la place. Aucun mot de stock, une icône seule.
  - Rôle en mot « mixte ».
  - Comparer : « Chimie, panel OSU, vraies valeurs : lot 22 » en gris, plus de tiroirs vides.
  - Légendes derrière « ? », fermées au repos, Échap les ferme : `controle-legende` : `LEGENDE OK`.
  - Levure étape : deux barres à la couleur de chaque levure.
  - Dryhopper : rail collé au contenu, aucune graduation au repos. Doigt posé : les 13 graduations du segment et une loupe à 64 px contre 10,8 px sur le rail, soit ×5,9 (D47, L12).
  - Carte : six étapes numérotées, vignettes rognées à la hauteur de leur page.

## Critères (rejoués depuis la racine après la passe 2)
- G1 : `EXISTENT OK 12`
- G2, Suggérer : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G3, Comparer : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4, Substituer porte : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G5, Substituer outil : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G6, Dryhopper : `UNE-QUESTION OK (1 groupe libre : moment)`
- G7, Levure étape : `UNE-QUESTION OK (1 groupe libre : levure)`
- G8, Levure outil : `UNE-QUESTION OK (1 groupe libre : levure)`
- G9 : `COMMUN OK`. Mots au premier écran : 63 à 70.
- G10 : `NOTE OK`
- G11 : ce fichier.

Essais de cette passe :
- G2 à G8 : du premier coup.
- G9 : trois passes.
  - Passe 1 : mots à 75 / 73 / 76, couleurs de Ma bière et de Substituer outil.
  - Passe 2 : OK.
  - Passe 3 : OK, rejouée après la mise au contrat du radar.
- Hors gates : `RADAR-SERIES` deux essais (séries en `g` / `path`), `LEGENDE` deux essais (Échap).

Parcours joués dans Chrome (puppeteer, console sans erreur) :
- Suggérer : décocher Galaxy affiche « Comparer les 2 ».
- Comparer : toucher Galaxy affiche « Placer Galaxy ».
- Dryhopper, sur la frise :
  - après 1 j : IBU à cru non modélisé ;
  - 35′ : « ? » ;
  - 30′ : IBU 60 → ~138.
- Levure : US-05 devient la « réf. ».
- Ma bière : la vue Radar et la lecture Absolu basculent.

## Captures ouvertes et jugées (passe 2)
`carte-390.png`, `ma-biere-390.png`, `suggerer-390.png`, `comparer-390.png`, `comparer-legende-390.png`, `substituer-porte-390.png`, `substituer-outil-390.png`, `dryhopper-390.png`, `dryhopper-60-390.png`, `dryhopper-toucher-390.png`, `levure-etape-390.png`, `levure-outil-390.png`.

Prédiction : « Là c'est plein et ça parle brasseur : je vois que Galaxy est hors fiche à 17,2 et met du tropical partout. Le radar, ok, mais tout le monde sort au résineux, on le savait. »

## Doutes et limites
- Au résineux, les trois houblons sortent du cercle du radar (×2 la zone). C'est vrai, mais leur écart s'y perd. Les lignes chiffrées dessous le donnent. Le choix entre r2 et r3 reste au lot 22.
- À 25′, 35′, etc., la grille n'a pas l'arôme : barres hachurées et « ? ». L'app calculera en direct.
- Le rôle « mixte » traduit le « double » de la règle rôle-α v1 (prototype). Les α hors fiches sont repris tels quels (ENTREES.md, « Douteux »), mais marqués « ≠ ».
- Dans Substituer, les familles « perd » viennent des fiches. Elles pèsent peu pour un amérisant à 60′.
- D4 a été mesuré par mon propre calcul (bas du dernier bloc / 844), pas par un contrôle du dépôt. Je n'en ai pas trouvé pour cet écran.
- `controle-rail.mjs` n'a pas été joué : il vise les graduations d'une autre base (45′, 85 °C…).
- `git status` : `loupe.html` et `loupe.png` à la racine ne viennent pas de r1, déjà signalés. Rien supprimé.

DÉCISION À PRENDRE : aucune nouvelle. Les deux façons de Substituer et de Levure restent côte à côte pour le brasseur. Le radar r2 ou r3 reste au lot 22.

CONNAISSANCE : pour la stout 16D (grille de `comparer-stout.json`, 4 g/L) :
- Un dry hop ajoute ~+19 à ~+20 de résineux (Cascade, Idaho 7, Galaxy) et ~+8 avec Nelson Sauvin. Aucun houblon ne le baisse.
- Galaxy sort les tropicaux du style (~+39).
- Pomona ne diffère d'US-05 qu'en dry hop actif (agrumes ~+13, confiance faible).
- Idaho 7 à 60′ porterait l'IBU à ~162.
- Dans u4, les cinq remplaçants « 99 » de Nugget ne se séparent que par perd / gagne et par l'α.

LEÇON PROPOSÉE :
- Reprise de celle du critique : un fil de fer de parcours qui dessine un composant déjà jugé (radar, rail) reprend la version validée de la base et son contrat (`data-axes`, 12 axes, séries en `g`/`path`, α balisé), ou laisse un emplacement « lot N ». Erreur : 22.10, r1 passe 1, radar à 6 axes et rail linéaire. Faire : jouer `controle-radar-series`, `controle-alpha` et `controle-legende` dans la boucle de l'auteur, même hors GATES.
- Seconde : une capture pleine page d'une planche d'iframes se prend avec une fenêtre aussi haute que la page. Sinon, les iframes hors fenêtre ne sont pas peintes.
- Rôles : concepteur, pilote.
