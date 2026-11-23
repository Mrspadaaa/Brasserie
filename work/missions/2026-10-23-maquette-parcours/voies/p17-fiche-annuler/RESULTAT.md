OK — fiche g1 radar d'abord, une croix 44 px (D115, D109) ; « Annuler » 48 px (D120) ; G1–G10 verts

## Fichiers écrits (dans « Possède » et dans le besoin socle accordé)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/FicheHoublon.tsx` : le radar et sa demande (« + Floral 2/4 − Résineux
  2/4 ») passent avant le bloc des familles. Rien d'autre ne change. `fiche/NOTE.md`.
- `…/src/commun/PiedAnnuler.tsx` et `…/src/commun/pied-annuler.css` (classes `pq-annuler-`, L26) : le pied commun, exporté
  depuis `…/src/commun/index.ts` (une ligne). Le pilote a accordé ce déplacement ; le pied vivait d'abord dans
  `ecrans/substituer/`.
- `…/src/commun/Cadres.tsx` (`Feuille` seulement) et `…/src/commun/feuille.css` (neuf) : la tête de g1 et une seule croix (accordé par le pilote).
- `…/ecrans/substituer/index.tsx` (pied), `jeu.mjs` (gestes « Annuler »), `NOTE.md`.
- `…/ecrans/levure/index.tsx` (pied seulement), `jeu.mjs`, `NOTE.md`.
- `…/ecrans/dryhopper/index.tsx` : le dock, plus le retrait du pont du corps (décision du pilote). Aussi `jeu.mjs` et
  `NOTE.md`, dont l'écart.
- La construction `prototypes/houblons-v4/maquettes/parcours-p17/`, ignorée par git, avec ses dossiers `captures/` et
  `captures-jeu/`.

## D115 : le radar avant la liste
Dans la fiche g1, l'ordre devient : α et usage, le grand radar légendé, la demande, puis le bloc gris (bande des 12,
familles, « nommé en premier », sans famille, non décrites), puis le pied ♡ ⊘ et Comparer. À 390 × 844, avec la tête de g1, le radar va de
189 à 530 px et la liste commence à 617 px. La liste elle-même n'est pas touchée : elle est à revoir plus tard, en variantes.

## La fermeture de la fiche (rejet de p6, D109)
- p6 relevait deux fermetures : le « × » gris de 16 px du Sheet et un « ‹ ». g1, elle, a une seule croix ronde en haut à
  droite.
- Il n'y a plus qu'une croix ronde de 44 × 44 px, icône de 20 px à l'encre (#222), en haut à droite de la feuille,
  `data-role="retour"`. Le nom est en titre, en gras, et la tête n'a plus de filet, comme dans g1. Le « ‹ » est retiré :
  il fermait la fiche comme la croix. Comment garder un retour de fiche en fiche sans second bouton : voir `fiche/NOTE.md`.
- C'est une surcharge du Sheet de l'app, sans y toucher (porte B) : `Feuille` dans `src/commun/Cadres.tsx` et
  `src/commun/feuille.css`, décrits dans « Pour l'app » de la NOTE de la fiche.
- L'icône de la croix porte `data-role="fermer-fiche"`, le contrat de `parcours-complet` et de controle-fiche (D25) : un
  seul bouton, deux marques.
- G10 : `RETOUR OK (fiche × 2 largeurs)`. À 390 comme à 1280 : « 1 commande « Fermer » 44×44 · icône 20 px #222222 ·
  forme croix · dans <header> de la feuille : oui · ferme la feuille : oui ».
- `fiche/jeu.mjs` : un geste « une seule croix » (une croix de 44 px au coin haut droit, aucun autre bouton de fermeture)
  et la fermeture par `fermer-fiche`, dans `ETAPE OK (fiche)`.
- Capture ouverte : `prototypes/houblons-v4/maquettes/parcours-p17/captures/fiche-cote-a-cote-g1.png`, avec
  `consolide-fiche-390.png` à gauche et la fiche à 390 à droite. On y voit « Nugget ⊙ » en gras et la croix ronde à
  droite, puis l'α, le radar et la liste.

## D120 : la forme d'Annuler, et pourquoi
- Même forme sur les trois outils : une rangée sous le pouce. « Annuler » est à gauche, en pilule à contour de 97 × 48 px.
  L'action est à droite et prend le reste de la largeur, à 48 px de haut.
- C'est l'ordre usuel au téléphone : on renonce à gauche, on confirme à droite.
- Annuler a la même hauteur que l'action : plus petit, il se lirait comme secondaire, voire caché, et c'était justement
  la plainte.
- Substituer : une ligne au-dessus dit ce que fera le geste, « 46 g de Nugget → **62,5 g de Nelson Sauvin** ». C'est le
  `choix-dock`, qui garde le nom choisi pour le parcours.
- À 1280, le pied se range à droite, sur 26 rem.
- Effet : `abandonner()` puis `revenirMaBiere()`. La recette ne bouge pas, le brouillon est jeté et l'on revient à l'étape
  Houblons (`#/ma-biere`, D118).

## Dryhopper, décision du pilote
- L'action de Dryhopper est « Puis la levure ». Son pied porte donc « Annuler » et « Puis la levure · Pomona ~+13 › ».
  C'est le pont d'a1, déplacé du corps dans le dock, avec le même `data-role="pont-levure"` et le même
  `data-acquis="levure"`.
- L'« Ajouter à ma bière › » (`pont-inscrire`) que j'avais ajouté est retiré : l'inscription vit dans Levure.
- Le pont est de nouveau visible au repos : 666 à 714 px à 390 × 844, en tête du dock, juste au-dessus des étapes, là où
  a1 le posait. Avant cette décision, il était caché à 669 px.
- Le corps d'a1 ne change pas, sauf le retrait du pont : la ligne « mesuré linalol 38 µg/L (McCabe 2023) » reste seule.
  L'écart est écrit dans `dryhopper/NOTE.md`.
- Capture du pied à 390, ouverte : `prototypes/houblons-v4/maquettes/parcours-p17/captures/dryhopper-390.png`.
  - On y voit « Annuler » (contour) et « Puis la levure Pomona ⊛ ~+13 › » (fond clair, contour), côte à côte, à 48 px.
    Dessous viennent les étapes, les jours et le rail.
  - Le pont garde l'habillage d'a1 (fond cave-900) : c'est ce qui le distingue d'Annuler, qui est transparent.
- G4 : le pilote a étendu `controle-annuler.mjs` à « Puis la levure ». Dryhopper passe à 390 et à 1280.

## Rail (G9, D35)
- La régression : avec le pied sous le rail, `controle-rail --parcours` donnait RAIL ECHEC 3. C'étaient trois
  chevauchements D35 pendant le geste, par exemple « jamais mesuré » sur « ≈+5 » à 35′, « 38 µg/L » sur « 1 j » et
  « Idaho 7 » sur « ~+22 ».
- La cause : la frise ne se serre pas, sa hauteur est inchangée. C'est le corps d'a1 qui dépasse de 40 px sous le dock
  (642 px de contenu pour 602 px de place, mesurés).
  - Sa dernière ligne, « mesuré linalol 38 µg/L (McCabe 2023) », de 669 à 697 px, est coupée par le défilement.
  - Elle reste pourtant dans l'écran, derrière le haut du dock, qui commence à 658 px.
  - Avec un pied de 54 px de plus, la loupe (en haut de la zone du geste, de 666 à 700 px) se posait exactement sur elle.
  - Le contrôle mesure les boîtes de texte sans tenir compte de la coupe du défilement. À l'œil, on ne voit rien ; à la
    mesure, deux textes sont l'un sur l'autre.
- Premier essai : le pied seul en tête du dock. La loupe repasse sous le bas du corps, mais Annuler et « Puis la levure »
  se retrouvent sur la ligne cachée (« jamais mesuré » sur « Annuler »).
- La correction retenue, sans changer la décision de pied ni le corps d'a1 :
  - le pied « Annuler · Puis la levure » passe en tête du dock (`.pq-dry-pied`) ;
  - la zone du geste (étapes, loupe, rail) vient dessous, dans `.pq-dry-geste-zone`, qui sert de repère à la loupe ;
  - la loupe et les étapes restent au bas de l'écran, sous le bas du corps ;
  - pendant le geste, le pied s'efface (`visibility: hidden`, sa place reste), comme a1 le fait déjà pour les étapes :
    le doigt est sur le rail, la loupe parle, rien ne saute.
- Résultat : `RAIL OK 1/1` (17 règles jouées ; non jouées comme avant : D44, et D45, D56, D61 bis, D64, faute d'un état à
  plusieurs houblons).
- Capture du geste tenu à 35′, ouverte : `prototypes/houblons-v4/maquettes/parcours-p17/captures/dryhopper-geste-35-390.png`.
  - La loupe montre 45′ ≈+5, 40′ ≈+7, **35′ ≈+8**, 30′ ≈+9 et 25′ ≈+10, nettes, et les crans du seul segment de
    l'ébullition.
  - La place du pied est vide pendant le geste ; aucun texte ne se superpose.
- `jouer-parcours.mjs --ponts` (batterie du pilote) : PONTS ECHEC, « cible introuvable : [data-ecran="levure"] ».
  - Mesure : juste après le lâcher, le pied est `visible`, mais ses enfants (« Puis la levure » compris) restent `hidden`.
    Ils redeviennent visibles 300 ms plus tard.
  - Cause : une transition globale (`transition: all 1e-05s`) porte aussi sur la visibilité qu'ils héritent du pied.
    Le clic immédiat tombait donc sur `.pq-annuler-pied`.
  - Ce n'était ni un `pointerup` manqué ni un doublon : il n'y a qu'un seul `pont-levure`.
  - Correction : `.pq-dry-pied, .pq-dry-pied * { transition: none !important; }` dans `dryhopper.css`.
  - Résultat : `PONTS OK (17 gestes, recalcul médian 0,3 ms)`, trois fois de suite sur `maquettes/parcours` (sortie par
    défaut, reconstruite) et une fois sur `parcours-p17`. G1 à G9 sont rejoués et tous verts : G6 `PARCOURS OK (29 + 29)`,
    G9 `RAIL OK 1/1`.

## Critères (rejoués après la croix de la fiche, depuis la racine)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-p17/`
- G2 : `TYPES OK`
- G3 : `fiche fiche/etat.html à 390 × 844 · radar 189–530 px · liste des familles dès 617 px` et `FICHE-RADAR OK`. Avant
  la reprise, la fiche échouait : radar à 603–944 px, liste dès 208 px.
- G4 : `ANNULER OK (3 routes × 2 largeurs)`. Sur chaque route, Annuler mesure 96,8 × 48 px, à côté de l'action, avec
  « recette identique, brouillon abandonné, → #/ma-biere ».
  - Substituer : à côté de « Remplacer › ».
  - Levure : à côté de « Ajouter à ma bière › ».
  - Dryhopper : à côté de « Puis la levure Pomona ~+13 », 269 × 48 à 390.
- G5 : `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`
- G6 : `PARCOURS OK (29 gestes à 390, 29 à 1280, recalcul médian 0,3 ms)`. Les gestes d'abandon passent ; aucun échec ne
  vient de la croix D118.
- G7 : `APP INTACTE OK`
- G8 : `NOTE OK` (rejoué sur ce fichier).
- G9 : `RAIL OK 1/1`.
- G10 : `RETOUR OK (fiche × 2 largeurs)`.
- La sortie par défaut est reconstruite (`maquettes/parcours`) : `PONTS OK (17 gestes)`.
- En plus :
  - `jouer-parcours.mjs --etape=` fiche, substituer, levure et dryhopper : `ETAPE OK` pour chacun, avec les gestes
    « Annuler » ;
  - Substituer : un choix, puis Annuler ;
  - Levure : Verdant essayée, puis Annuler ; la recette reste en Pomona ;
  - Dryhopper : Galaxy posé à 7 j, puis Annuler ; Galaxy n'est pas inscrit ;
  - `controle-acquis --outil=dryhopper` : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`.
- Non lancés : controle-commun, teinte et retour. C'est la batterie du pilote, sur la construction commune.

## Captures (ouvertes en image)
Dans `prototypes/houblons-v4/maquettes/parcours-p17/captures/` :
- `fiche-cote-a-cote-g1.png` : `consolide-fiche-390.png` (sa base g1) à gauche, la fiche p17 à 390 à droite. Les éléments
  sont les mêmes ; le radar est monté sous l'α, et le début de la liste reste visible en bas du premier écran.
- `fiche-390.png`, `fiche-1280.png` (feuille dans le cadre de 768 px).
- `substituer-390.png`, `substituer-1280.png`, `levure-390.png`, `levure-1280.png`, `dryhopper-390.png`,
  `dryhopper-1280.png` : le pied au repos ; `dryhopper-geste-35-390.png` : le geste tenu à 35′.

## Prédiction
« Ok, le radar d'abord, c'est mieux », puis, devant le pied : « Annuler, enfin ».

DÉCISION À PRENDRE : aucune

CONNAISSANCE : `controle-annuler.mjs` lit comme un bouton tout conteneur qui porte un `data-role` (sélecteur
`button, a, [role="button"], [data-role]`). Une enveloppe dont le texte commence par « Annuler » ne doit pas porter de
`data-role` : le pied porte donc `data-pied`.
LEÇON PROPOSÉE : un contrôle qui mesure des boîtes de texte sans tenir compte de la coupe par défilement accuse ce qui
est caché sous un pied fixe. Le 24.10, Dryhopper a fait RAIL ECHEC D35 par la ligne coupée d'a1 sous le dock. Quand on
agrandit un pied fixe, mesurer le dépassement du corps sous lui (scrollHeight contre clientHeight) et rejouer le rail.
