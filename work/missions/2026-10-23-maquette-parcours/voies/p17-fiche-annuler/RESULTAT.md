ECHEC — G4 : controle-annuler ne reconnaît pas « Puis la levure » comme action ; 7/8 OK

## Fichiers écrits (dans « Possède » et dans le besoin socle accordé)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/FicheHoublon.tsx` : le radar et sa demande (« + Floral 2/4 − Résineux
  2/4 ») passent avant le bloc des familles. Rien d'autre ne change. `fiche/NOTE.md`.
- `…/src/commun/PiedAnnuler.tsx` et `…/src/commun/pied-annuler.css` (classes `pq-annuler-`, L26) : le pied commun, exporté
  depuis `…/src/commun/index.ts` (une ligne). Le pilote a accordé ce déplacement ; le pied vivait d'abord dans
  `ecrans/substituer/`.
- `…/ecrans/substituer/index.tsx` (pied), `jeu.mjs` (gestes « Annuler »), `NOTE.md`.
- `…/ecrans/levure/index.tsx` (pied seulement), `jeu.mjs`, `NOTE.md`.
- `…/ecrans/dryhopper/index.tsx` : le dock, plus le retrait du pont du corps (décision du pilote). Aussi `jeu.mjs` et
  `NOTE.md`, dont l'écart.
- La construction `prototypes/houblons-v4/maquettes/parcours-p17/`, ignorée par git, avec ses dossiers `captures/` et
  `captures-jeu/`.

## D115 : le radar avant la liste
Dans la fiche g1, l'ordre devient : α et usage, le grand radar légendé, la demande, puis le bloc gris (bande des 12,
familles, « nommé en premier », sans famille, non décrites), puis le pied ♡ ⊘ et Comparer. À 390 × 844, le radar va de 169
à 510 px et la liste commence à 597 px. La liste elle-même n'est pas touchée : elle est à revoir plus tard, en variantes.

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
- Le pont est de nouveau visible au repos : 784 à 832 px à 390 × 844, dans le dock, sous le pouce. Avant cette décision,
  il était caché à 669 px.
- Le corps d'a1 ne change pas, sauf le retrait du pont : la ligne « mesuré linalol 38 µg/L (McCabe 2023) » reste seule.
  L'écart est écrit dans `dryhopper/NOTE.md`.
- Capture du pied à 390, ouverte : `prototypes/houblons-v4/maquettes/parcours-p17/captures/dryhopper-390.png`.
  - On y voit le rail, puis « Annuler » (contour) et « Puis la levure Pomona ⊛ ~+13 › » (fond clair, contour), côte à côte,
    à 48 px.
  - Le pont garde l'habillage d'a1 (fond cave-900) : c'est ce qui le distingue d'Annuler, qui est transparent.
- **Conséquence sur G4** : `controle-annuler.mjs` cherche une action par les rôles `pont-(remplacer|ajouter|placer|
  inscrire|valider|appliquer)` ou par son texte (« Remplacer », « Ajouter à ma bière », « Placer »…). « Puis la levure »
  (`pont-levure`) n'y est pas, d'où ses deux lignes Dryhopper en échec.
  - Ces lignes sont « aucune action du pied qui change la recette trouvée ».
  - Tout le reste passe sur Dryhopper : Annuler mesure 96,8 × 48 px, il est dans l'écran, rien ne le recouvre. Après un
    toucher, la recette est identique, le brouillon est abandonné et l'adresse passe de `#/dryhopper/idaho-7-1` à
    `#/ma-biere`.
  - Je ne possède pas le contrôle. Le corriger revient au pilote ou à p15 : ajouter `levure` à `roleAction`, ou le texte
    « Puis la levure » à `texteAction`. p15 l'avait prévu dans son RESULTAT.

## Critères (rejoués après la décision, depuis la racine)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-p17/`
- G2 : `TYPES OK`
- G3 : `fiche fiche/etat.html à 390 × 844 · radar 169–510 px · liste des familles dès 597 px` et `FICHE-RADAR OK`. Avant
  la reprise, la fiche échouait : radar à 603–944 px, liste dès 208 px.
- G4 : `ANNULER ECHEC (4/6 conformes)`.
  - Substituer et Levure sont conformes à 390 et à 1280. Annuler y mesure 96,8 × 48 px, à côté de l'action (269 × 48 à
    390, 311 × 48 à 1280), avec « recette identique, brouillon abandonné, → #/ma-biere ».
  - Dryhopper donne « action introuvable » (voir ci-dessus).
  - Avant la décision du pilote, le résultat était `ANNULER OK (3 routes × 2 largeurs)` avec `pont-inscrire`.
- G5 : `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`
- G6 : `PARCOURS OK (29 gestes à 390, 29 à 1280, recalcul médian 0,3 ms)`. Les gestes d'abandon passent ; aucun échec ne
  vient de la croix D118.
- G7 : `APP INTACTE OK`
- G8 : NOTE OK (rejoué sur ce fichier).
- En plus :
  - `jouer-parcours.mjs --etape=` fiche, substituer, levure et dryhopper : `ETAPE OK` pour chacun, avec les gestes
    « Annuler » ;
  - Substituer : un choix, puis Annuler ;
  - Levure : Verdant essayée, puis Annuler ; la recette reste en Pomona ;
  - Dryhopper : Galaxy posé à 7 j, puis Annuler ; Galaxy n'est pas inscrit ;
  - `controle-acquis --outil=dryhopper` : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`.
- Non lancés : controle-commun, teinte, rail et retour. C'est la batterie du pilote, sur la construction commune.

## Captures (ouvertes en image)
Dans `prototypes/houblons-v4/maquettes/parcours-p17/captures/` :
- `fiche-cote-a-cote-g1.png` : `consolide-fiche-390.png` (sa base g1) à gauche, la fiche p17 à 390 à droite. Les éléments
  sont les mêmes ; le radar est monté sous l'α, et le début de la liste reste visible en bas du premier écran.
- `fiche-390.png`, `fiche-1280.png` (feuille dans le cadre de 768 px).
- `substituer-390.png`, `substituer-1280.png`, `levure-390.png`, `levure-1280.png`, `dryhopper-390.png`,
  `dryhopper-1280.png` : le pied au repos.

## Prédiction
« Ok, le radar d'abord, c'est mieux », puis, devant le pied : « Annuler, enfin ».

DÉCISION À PRENDRE : étendre `controle-annuler.mjs` à `pont-levure`, l'action de Dryhopper selon la décision du pilote.
Sans cela, G4 reste à 4/6.

CONNAISSANCE : `controle-annuler.mjs` lit comme un bouton tout conteneur qui porte un `data-role` (sélecteur
`button, a, [role="button"], [data-role]`). Une enveloppe dont le texte commence par « Annuler » ne doit pas porter de
`data-role` : le pied porte donc `data-pied`.
LEÇON PROPOSÉE : aucune
