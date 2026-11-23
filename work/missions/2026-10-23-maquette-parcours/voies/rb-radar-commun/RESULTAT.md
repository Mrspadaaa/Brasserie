ECHEC — G2 à G4 : les registres de Comparer décrivent encore r6a ; cmc2h seul échoue pareil (G1 OK)

Le livrable est fait : RadarBase, porté de cmc2h, est posé dans Comparer (cmc2h entier), la fiche, Suggérer et Substituer. G1 est vert.
Les rouges de G2 à G4 ne viennent pas du radar. Ils tombent tous de la même façon sur la construction de cmc2h au miroir
(`cmb-R/…/maquettes/cmc2h`), sans mon code. Ils lisent la forme r6a et des textes que cmc2h a retirés à sa demande.

## Fichiers écrits (tous dans Possède ; `git status --short` vérifié)
- `prototypes/houblons-v4/parcours/src/commun/RadarBase.tsx` et `radar-base.css` (classes `rb-`), puis l'export dans `commun/index.ts`.
- `src/ecrans/comparer/` : cmc2h/source repris tel quel (Ensemble, Huiles, Etapes, Feuilles, calcul, valeurs, index, comparer.css, jeu).
  - `Radar.tsx` ne fait plus que lui passer les valeurs.
  - Les règles `cmc-` mortes du radar sont retirées de comparer.css.
  - `RadarOutils.ts`, jamais importé par cmc2h, n'est pas repris.
  - NOTE.md mis à jour.
- `src/ecrans/fiche/RadarFiche.tsx` ; `src/ecrans/suggerer/radar.tsx`, `vue-radar.tsx` (le moment), suggerer.css et reprise.css ;
  `src/ecrans/substituer/Radar.tsx`, `index.tsx` (cle et retenu), substituer.css (hauteur). NOTE.md de chaque écran complétée.
- `work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs`.
  - Il vérifie B1 à B4 : data-radar="base" et 12 axes ; aucun point sur un inconnu ni au centre ; aucun remplissage au centre
    (`isPointInFill`) ; anneaux chiffrés en Absolu, maximum de chaque axe au style.
  - Il joue 8 vues.
- Rien dans `src/` (app) ni dans les registres.

## Le radar dans chaque vue
- **Comparer** :
  - balisage du radar identique à cmc2h dans 5 états (style et absolu, au dry hop après et à 60′, style à 10′) ;
  - diff normalisé : `IDENTIQUE (289 lignes)`. Seuls diffèrent les attributs de contrôle, `fill="none"` des anneaux et l'id du motif.
  - Le libellé ajoute « : <retenu> plein », pour le repère d'état « Radar au style : Cascade plein ».
- **Fiche** :
  - valeurs gardées (nombre de fiches), échelle fixe de 0 à toutes ses fiches, anneaux 0 à 4 ;
  - les familles non décrites vont dans « sans donnée » ;
  - la flèche de la demande est près du picto ; bulle, survol et data-etat Melon gardés.
- **Suggérer** :
  - ma bière en trait noir et la voie en plein, en crans du style ;
  - au style, échelle par axe et zone ; en Absolu, 0 à 12,5 (D68) ; moment de la voie dans `data-moment`.
  - Une clé d'une ligne reste, faute de têtes de colonnes.
- **Substituer** :
  - niveaux u4 (0, cité, marqué), échelle fixe dans les deux lectures : des niveaux de fiches n'ont pas d'échelle au style ;
  - Nugget en contour seul, le choisi en avant, les attendues cerclées.
- Les points ne portent plus `data-famille` mais `data-point`. La règle S2 de controle-standard prenait les points à la couleur
  du houblon pour des éléments de famille. cmc2h seul échouait COMMUN (18 S2), qui est vert maintenant.

## Critères (sur HEAD, puis après)
- **G1** `controle-radar-base.mjs` :
  - HEAD : `RADAR-BASE ECHEC (8)`. B1 sur les 8 vues ; B3 sur Substituer, où Magnat et Nelson touchent le centre.
  - Après : `RADAR-BASE OK (8 vues)`.
- **G2** `batterie.mjs` :
  - HEAD : `BATTERIE ECHEC 45/46`. Seul controle-choix échoue : le complément 4 du registre a des mots composés, introuvables
    dans SPEC.
  - Après : `BATTERIE ECHEC 42/46`.
    - RATÉ : controle-choix, controle-teinte (comparer teinte 36 contre 16), controle-comparer-etapes (5 manques D107 : Nugget sans
      10′ ni dry hop, dry hop rogné à 390), controle-comparer-familles (0 rangée au premier écran).
    - Ces trois derniers échouent à l'identique sur la construction de cmc2h au miroir.
    - Le reste est tenu : COMMUN 7/7, FICHE-RADAR, PICS, HORS-16D ×4, ROUTES, PONTS, PARCOURS (voir `g2.log`).
- **G3** `controle-etats.mjs` :
  - HEAD : `ETATS OK (141/141)`.
  - Après : `ETATS ECHEC (4/141)`. Trois de ces états échouent aussi sur cmc2h seul :
    - `etat-comp-etat-moment` (« dans la cuve », « de contact ») ;
    - `etat-comp-reference` (« Résineux déjà au-delà ») ;
    - `etat-sugg-comparer-n` (« IBU » sur Comparer).
  - Le quatrième, `etat-acquis-r6a-elements-notes` (« Face à ta stout, par »), est un texte de r6a absent de cmc2h.
  - Ces textes, cmc2h les a retirés à sa demande (« encore pas mal de légende et texte inutile »). Le seul échec qui venait du
    radar (`etat-comp-retenir`) est réparé par le libellé.
  - Fiche 16/16 et Substituer 14/14 sur la construction d'essai.
- **G4** `controle-choix.mjs` :
  - HEAD : `CHOIX ECHEC` (complément 4 de Comparer, mots introuvables dans SPEC).
  - Après : `CHOIX ECHEC (5 écran(s) conforme(s)…)`. Comparer ne reprend pas l'inventaire r6a ; Suggérer tombe par son controle-etats
    (etat-sugg-comparer-n, « IBU » sur Comparer).
- **G5** `controle-quand-comparer.mjs` :
  - HEAD : `QUAND ECHEC (1)` (pas de `[data-role="quand-comparer"]`).
  - Après : `QUAND OK`, 4 moments.
- En plus, sur cmc2h intégré : `NORMALISE OK`, `CENTRE OK`, `FICHE-RADAR OK`, `PICS OK`, `TYPES OK`.

Les journaux sont dans `os.tmpdir()/claude/…/scratchpad/rb/` (`g1.log` à `g5.log`, `g*-head.log`, `etats-essai-*.log`). Toutes
les sorties ci-dessus sont rejouées sur `maquettes/parcours`, sauf Fiche 16/16 et Substituer 14/14 (construction d'essai, même code).

## Captures (390 × 844, ×2, ouvertes)
`work/missions/2026-10-23-maquette-parcours/voies/rb-radar-commun/captures/` :
- `rb-comparer-{style,absolu}-{dryhop,60}.png`, `rb-comparer-style-10.png`, à côté de `cmc2h-comparer-style-dryhop.png` et
  `cmc2h-comparer-absolu-60.png` ;
- `rb-fiche.png`, `rb-fiche-bulle-melon.png` ;
- `rb-suggerer-radar-{style,absolu,style-plustard}.png` ;
- `rb-substituer{,-absolu}.png`.

Prédiction : « Enfin le même radar partout », avec une réserve possible sur le grand secteur « sans donnée » de la fiche et de
Suggérer, qui ont cinq familles inconnues.

DÉCISION À PRENDRE :
- (1) Mettre à jour pour cmc2h (son choix) les registres de Comparer, que je ne possède pas :
  - dans `choix/ecrans.json` : choix et inventaire encore r6a ; les mots du complément 4 sont un collage introuvable tel quel dans SPEC ;
  - dans `choix/etats/comparer.json` : etat-moment et reference ; dans `choix/etats/acquis.json` : r6a-elements-notes ;
  - dans `choix/etats/suggerer.json` : comparer-n, « IBU » ;
  - les contrats de controle-teinte, controle-comparer-etapes et controle-comparer-familles.
  - Sinon, rendre à cmc2h les textes retirés, contre ses mots.
- (2) Ma bière (`src/ui/hopIndex/maBiere/RadarBiere.tsx`), après t12b : RadarBase est prêt (`@app` n'en dépend pas ; à déplacer
  dans `src/ui/hopIndex/` à l'intégration).

CONNAISSANCE : cmc2h, construit seul au miroir, échoue COMMUN S2 (points à la couleur du houblon marqués data-famille),
controle-teinte, comparer-etapes, comparer-familles et 3 états. Les registres de Comparer décrivent r6a.

LEÇON PROPOSÉE : avant de dire « l'écran devient sa maquette X », jouer la batterie sur la construction de X seule. Les rouges
qu'elle porte sont des décisions de registre à prendre avant la voie, pas des fautes de la voie (L13).
