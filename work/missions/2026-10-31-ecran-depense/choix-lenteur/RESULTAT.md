OK — page de choix D261c : 5 options (A référence, B à E), 15 mini maquettes, frise du temps

C-LENTEUR OK — 5 options — choix-lenteur/index.html

Voie c-lenteur, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun appel Gemini, aucun
commit, aucun serveur Vite. J'ai chargé le skill `boosters-ux`, pas `impeccable` : la forme est celle de `choix-nom` et de `choix-captures`,
déjà acceptées. J'ai lu leurs deux verdicts (`VERDICT-c-nom.md` et `VERDICT-c-captures.md`, ce dernier présent pendant la voie) et je
n'ai pas refait leurs défauts. Mon avis porte sa raison et sa limite (c-captures, majeur 2). Les vignettes identiques sont grisées
« = X » (c-nom, majeur 1). La dépense lue porte ses puces, TVA et Règlement (c-captures, mineur). Le fournisseur est fictif, aucun nom
n'est tiré de ses pièces. Aucune légende n'est posée dans un écran.

## Fichiers écrits (tous sous `choix-lenteur/`)
- `index.html` : la page. Titre daté du 02.11, `#a-choisir`, `[data-choix="lenteur-lecture"]`. A porte `data-reference`, B à E
  `data-variante`. Visionneuse `dialog`. Les rangées sont alignées par `subgrid` (tête, 6 s, 15 s, lue).
- `maquettes/{a..e}-{06,15,lue}.html` : 15 pages statiques à 390 × 700 px, en thème clair.
- `img/*.png` : les 15 captures (×2), plus `img/md5.json`. Deux maquettes au même HTML partagent la même capture : « = X » veut donc
  dire identique au pixel.
- `outils/gen.mjs` écrit les maquettes et les capture. `outils/page.cjs` et `outils/page.css` écrivent la page (feuille de
  `choix-captures`, avec 5 colonnes, la frise du temps et le subgrid).
- `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png` : les captures du contrôle 2.

## Les options (seuls varient le moment où la 3.8 compte et ce que l'écran montre en l'attendant)
Chaque option a trois vues : ≈ 6 s, ≈ 15 s et lue. Sous chaque vue, le repère (« ≈ 6 s », « lue · 18,5 s ») et la même frise, de 0 à
40 s pour toutes les options : hachuré pour l'attente, bleu pour le provisoire, vert pour la dépense lue, avec un curseur au moment de la
vue. Le nom de la vue suit l'état montré : « Pendant la lecture », « Provisoire » ou « Déjà lue ».
- **A, aujourd'hui** : l'état « lecture » actuel (frise « envoi ✓ · lecture · vérification », figée sur « lecture » comme dans
  `ExpenseSheet.tsx`) à 6 s et à 15 s. La vue de 15 s est la même : c'est la plainte. Puis la dépense lue, avec « Lectures 3/3 ».
- **B, la 3.8 seulement quand l'argent diffère** (B2 du banc) : rien de neuf à l'écran. Il attend encore à 6 s ; à 15 s, la dépense est
  déjà lue (11,0 s médian). Vignettes « = A ».
- **C, jamais de 3.8** : l'attente à 6 s, puis une dépense avec « Lectures 2/2 » et trois rouges « à remplir » au lieu d'un, proportion
  tirée de 34 contre 10. La valeur fausse sans drapeau (Malt Pilsner « 10 Kg × 1,45 ») n'est volontairement pas marquée : C ne la voit pas.
- **D, écran tout de suite, 3.8 ensuite (mon avis)** : dès 6 s, la dépense provisoire, celle de C. Trois marques compactes, aucune
  phrase. (1) Un fil de 22 px sous l'en-tête : la frise d'aujourd'hui réduite, avec ses trois traits et « vérification » en cours.
  (2) Dans la preuve, « Lectures ●●◌ » : la troisième lecture est attendue. (3) « Confirmer » est gris, avec une roue. À l'arrivée de
  la 3.8, le fil disparaît et « Confirmer » redevient noir. Une puce bleue « ↻ 3 corrigées » s'ajoute aux puces existantes (même geste
  de filtre). Chaque valeur corrigée est sur fond bleu, l'ancienne barrée sous le nom (« 10 Kg × 1,45 », « 30 ? », « 50 ? »), et les
  rouges passent de 3 à 1.
- **E, B + D (ajoutée, je le dis)** : l'écran de D, la 3.8 de B. Il est final à 11,0 s, donc déjà lu à 15 s. Ses vignettes sont toutes
  « = D » : seule la frise diffère. C'est la vérité, puisque seul le temps change.

Valeurs fictives : Brauhaus Ouest, 21.10.2026, 46,40 CHF, 7 lignes (Malts 24,10, Houblons 6,60, Levures 9,80, Sucres 5,90).

## Contrôles et sorties
1. `controle-page-choix.mjs … --min=3` → `lenteur-lecture : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, puis `PAGE-CHOIX OK
   (1 choix)`. Le premier passage échouait : `C2 1 par rangée à 390 px`, parce que les têtes étaient de hauteurs inégales. Corrigé par
   le subgrid.
2. `verifier-page.mjs … --page-lot --captures …/choix-lenteur/controle` → `PAGE OK (15 images chargées, lisible à 390 et 1280 px, sans
   erreur)`. J'ai ouvert les trois captures, plus une capture de la grille entière à 1280 px.
3. `controle-choix` est sans objet : l'écran Dépense n'est pas dans `work/refonte-frontend/v4/choix/ecrans.json` (`grep -ci
   "depense\|dépense"` → 0). La base est l'écran actuel : `p3c-port/captures/tactile390-lecture.png` et
   `f3-rangees/captures/tactile390-clair-repos.png`.
4. Chaque nombre mesuré de la page se retrouve dans `voies/m-lenteur/RESULTAT.md`. Les lignes citées sont celles de ce fichier.
   - En-tête : « 14 pièces, 1 tirage » (l. 8). « ≈ 4 s » pour le transfert : `traduireNoms` à 3,8 s (l. 13) et VOIE.md (≈ 4 s).
   - A (l. 22) : 12/14 · 18,5 s · 37,7 s · 154 · 10 muettes · 0,0445 CHF.
   - B = B2 (l. 24) : 8/14 · 11,0 s · 34,3 s · 156 · 7 muettes · 0,0306 CHF. « à confirmer par 2 tirages de plus » (l. 59 et VOIE.md).
   - C (l. 26) : 6,3 s · 9,9 s · 149 · 34 rouges · 22 muettes · 0,0205 CHF. Les « 10 » rouges d'aujourd'hui (l. 22).
   - D (l. 27) : 6,3 s · 9,9 s au 1er écran ; final 18,5 s, comme A (37,7 s au pire) · 154 · 0,0445 CHF. « Au 1er écran : 22 fausses
     sans drapeau » (l. 27, « 22 (8) au 1er écran »).
   - E (l. 30 et l. 24) : écran de C (6,3 s, 9,9 s) et final de B. Ce dernier est **B2** (11,0 s, 34,3 s, 156, 0,0306 CHF), parce
     que le B de VOIE.md est B2. Le bonus de la l. 30 porte sur le B large (13,0 s) : mon E est la même idée, appliquée à B2.
   - Le 0 → 40 s de la frise est une échelle, pas une mesure ; elle couvre le pire, 37,7 s.
   - Écarts d'arrondi : aucun. J'ai repris les coûts exacts du tableau (0,0445, 0,0306, 0,0205) et non les arrondis de VOIE.md
     (0,045, 0,031, 0,021).

## Boosters UX (boosters-ux)
- La frise du temps sous chaque vue (besoin : comparer ; représentation : une barre 0 → 40 s en trois états avec un curseur). Il lit
  l'attente de A et le provisoire de D sans lire un chiffre.
- « Lectures ●●◌ » (besoin : suivre). Point plein pour une lecture faite, pointillé pour celle qu'on attend.
- La puce « ↻ 3 corrigées » et les cellules bleues (besoin : lire ce qui a changé), même famille que les puces « à contrôler » et
  « à remplir ».
- « Confirmer » en attente (besoin : déclencher, bloqué tant que la 3.8 n'est pas arrivée). Gris avec une roue, et non un texte.
- B2 une action primaire par écran (Confirmer) · B3 aucune phrase ajoutée dans un écran · B6 chiffres en IBM Plex Mono · B8 honnête :
  une valeur fausse sans drapeau reste non marquée, et la page dit combien il y en a.

## Captures ouvertes
`img/d-06.png` (le fil, Lectures ●●◌, Confirmer gris), `img/d-lue.png` (3 corrigées, valeurs bleues, anciennes barrées), `img/a-06.png`
(l'attente d'aujourd'hui), `img/c-lue.png` (2/2, 3 rouges), puis `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`
et la grille entière à 1280 px.

## Prédiction
« D, évidemment : je vois ma facture tout de suite et je vérifie pendant que ça finit. Mais pourquoi Confirmer attend s'il n'y a rien à
corriger ? E si c'est pareil en plus rapide. »

DÉCISION À PRENDRE : dans D et E, une valeur que le brasseur modifie pendant que la 3.8 tourne. Je propose que sa saisie l'emporte et que
la 3.8 ne réécrive pas une cellule qu'il a touchée. Ce n'est pas dessiné, c'est hors du facteur de la page. La direction technique (un
appel qui rend deux fois, ou un second appel) va au conseil, comme le dit m-lenteur.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Reprise e-t11 (critique `critique/VERDICT-c-lenteur.md`, ACCEPTÉ, trois majeurs ; message du pilote)
Modifiés : `outils/page.cjs`, `outils/page.css`, `index.html`, `controle-*.png`. Les maquettes et `img/` n'ont pas changé.
1. **Majeur 1, les têtes** : une ligne forte pour le temps, puis une ligne discrète.
   - La ligne forte donne le temps avant l'écran et le temps avant Confirmer, chacun avec son pire cas. A : « **18,5 s** avant l'écran
     (37,7 au pire) ». D : « **6,3 s** avant l'écran (9,9 au pire) · **18,5 s** avant Confirmer (37,7 au pire) ». E : « … **11,0 s**
     avant Confirmer (34,3 au pire) ». B : 11,0 (34,3). C : 6,3 (9,9).
   - La ligne discrète donne les champs justes, les fausses sans drapeau et le coût en centimes.
   - Sources : m-lenteur l. 22 (A), l. 24 (B2, et la lecture finale de E), l. 26 (C), l. 27 (D, écran et lecture finale).
   - Centimes à une décimale, tirés des coûts exacts des mêmes lignes : 0,0445 CHF → 4,5 ct (A, D) ; 0,0306 → 3,1 ct (B, E) ;
     0,0205 → 2,1 ct (C). Les valeurs exactes restent dans la section « Contrôles » plus haut.
2. **Majeur 2** : la tête de B dit maintenant « 8 pièces sur 14 : total, HT, TVA, montant de ligne, ligne sans vis-à-vis ». C'est B2,
   m-lenteur l. 23 et 24 : les déclencheurs de B moins la quantité et le prix unitaire.
3. **Majeur 3**, dans la version corrigée par le pilote : une ligne sous « 14 pièces, 1 tirage ». Elle dit : « « 2 lents puis 1 lent » :
   mesuré le 01.11, ni plus juste, plus lent (23,7 s médian contre 17,6), plus cher (7,0 ct contre 4,4). » Ses nombres viennent de
   D266, `work/refonte-frontend/decisions.md` l. 1266 : 23,7 contre 17,6 s médian ; 0,070 contre 0,044 CHF, soit 7,0 et 4,4 ct.
   Cette ligne n'ajoute pas de colonne.
4. **Mineurs** :
   - « fausses sans drapeau » partout (6 occurrences, aucune « sans drapeau » seule).
   - Légende : « cadre bleu : ce qui est neuf », reprise aussi dans le `title` des vignettes.
   - Badges « = X » sous la barre de titre de la vignette (`margin-top: calc(10.3% + 4px)`) : ils ne couvrent plus l'icône du document.
   - Titre de la vue lue de D et de E : « Lue · à l'arrivée de la 3.8 ». E porte la même image (= D).
   - Je n'ai pas touché aux mineurs facultatifs (« la puce filtre », l'échelle 0 → 40 s).

Contrôles rejoués :
- `controle-page-choix.mjs … --min=3` → `lenteur-lecture : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
- `verifier-page.mjs … --page-lot` → `PAGE OK (15 images chargées, lisible à 390 et 1280 px, sans erreur)`.

J'ai rouvert `controle-haut.png`, `controle-ordinateur.png` et `img/d-lue.png`. Le temps est maintenant le plus gros nombre de chaque
tête, la ligne « 2 lents puis 1 lent » et la légende du cadre bleu sont lisibles à 390 px, et les badges « = A » / « = D » sont sous
la barre de titre.

C-LENTEUR OK — 5 options — choix-lenteur/index.html
