OK — correctifs du port : IDENTITE OK (176 contrôles, 390 et 1280), 11 écarts traités, 2 retouches du second critique faites

## 1. TEMOIN AVANT
TEMOIN AVANT : IDENTITE ECHEC 34
(série `capturer-identite.mjs` de cette voie, jouée AVANT toute correction, à 390 et à 1280 ; sortie et captures dans `captures/avant/`.
Un premier passage donnait 33 : trois défauts de mon script — barre d'étapes cherchée dans l'en-tête mobile caché, mesure du focus avant la
fin de la transition de bordure — corrigés avant ce passage ; seul `src/ui/identite/Regle.tsx` avait reçu un attribut `data-max`, sans effet
visuel, pour lire la longueur des règles.)
Les 34 échecs, par écart : n° 1 : 8 (alertes entre les tuiles : repères ouverts, cuve déborde, profil rendu, clavier après, ×2 largeurs) ;
n° 2 : 4 ; n° 3 : 4 ; n° 4 : 2 (1280 seulement : bandeau 60 px de haut, écart de 21 px entre ses lignes) ; n° 5 : 4 (fond blanc au focus du
volume et de l'ébullition) ; n° 7, n° 8, n° 9 : 2 chacun ; n° 10 : 4 (règle 0–75 « 70 › », chiffres tous les 30 à 240 min) ; n° 11 : 2
(1280 : « Abandonner » à 34 px sous le titre, barre d'étapes qui descend). Le n° 6 passe avant correction (voir § 3).
Contrôles ajoutés, tous à 390 et 1280 : une ligne d'alerte au plus entre Volume et Ébullition dans 7 états ; repères (une source, pas de
bouton large, pas de phrase) ; fermenteur ouvert (champ, « ↺ profil » visible, résumé replié, liens sans cadre) ; bandeau sur une ligne ;
« Abandonner » sur la ligne du titre et haut de page fixe ; focus (bordure, fond, trait de 2 px, contour ; le champ Fermenteur garde son
cadre) ; règles 0–65 « 60 › » et chiffres tous les 60′ ; « à adopter », code avant le chevron, « cuve 35 L », colonne.

## 2. Critères
- G1 `npm run build` : `✓ built in 23.74s`.
- G2 `npx vitest run tests/unit/identite --maxWorkers=2` : `Test Files 7 passed (7)`, `Tests 93 passed (93)` (64 avant la voie), puis `TESTS IDENTITE OK`.
- G3 série Chrome (commande de GATES.md, sortie `captures/r3/`, journal `captures/r3/serie-sortie.txt`) : `IDENTITE OK` ; 168 lignes OK avant les retouches du second
  critique, 176 après (§ 2 bis, qui donne les sorties à jour de G1, G2 et G3).
  Passages après correction : 2, tous deux `IDENTITE OK` (le 2e après trois retouches de rendu décidées en regardant les captures du 1er :
  points de séparation des liens, alignement du bandeau, repères défilés avant la capture).
- G4 : ce fichier (« TEMOIN AVANT : IDENTITE ECHEC », « baseline », « Rien ne se perd »).
- G5 `controle-choix.mjs --registre --registre=…/ecrans-app.json` : `REGISTRE OK (1 écrans)`.
- Aussi : `npx tsc --noEmit` sans sortie ; `npm run lint:design` : `LINT DESIGN OK` ; `systeme.mjs cablage` : `CABLAGE OK`.

## 2 bis. Retouches du second critique (`critique/VERDICT-port-2.md`, PRÊT À MONTRER)
Seules R1 et R2, dans mon OWNS. `tests/integration/waterVolumeExplanation.test.tsx` : non touché (déjà corrigé par le pilote).
- **Contrôles ajoutés d'abord, échec avant, passage après** (390 et 1280) :
  - TEMOIN AVANT R1/R2 : `IDENTITE ECHEC 4` (`captures/avant-r1r2/serie-sortie.txt`) :
    `ECHEC 390 repères ouverts : R2, la cible « Lire la source » fait 24 px au moins (69.5 × 16)` ;
    `ECHEC 390 cuve déborde : R1, aucun bleu au-delà de la cuve… ({"largeur":31,"droiteEvap":369,"gaucheCuve":208.4})` ;
    mêmes deux échecs à 1280 (`"largeur":64.1,"droiteEvap":999,"gaucheCuve":667.6` ; cible 69.5 × 16).
    (Un premier passage avait buté sur un nom de variable de mon script, `lire` ; corrigé avant le témoin ci-dessus. Après la retouche, le contrôle R1
    a été précisé : « part bleue absente » compte comme bon, et le moût or s'arrête aussi à la cuve ; la mesure bleue d'avant n'a pas changé.)
  - APRÈS : `IDENTITE OK`, 176 lignes OK ; `OK 390 repères ouverts : R2 … (69.5 × 24)` ; `OK 390 cuve déborde : R1, aucun bleu au-delà de la cuve …
    ({"absente":true,"gaucheCuve":208.4})` ; `OK 390 cuve déborde : R1, le moût (or) s'arrête à la cuve … (or jusqu'à 208.4, cuve à 208.4)` ; idem 1280 (667.6).
    Garde-fou : `OK 390 repos : R1, la part évaporée se voit encore dans la cuve (30 px)` (62 px à 1280).
- **R1, bout violet** : `partEvapDansCuve` (fonction pure, `regles.ts`, 4 tests) coupe la part évaporée à la cuve ; `CarteVolume.tsx` ne la peint plus au-delà,
  et coupe aussi le moût or à la cuve (sinon l'or sous les hachures faisait une bande plus claire à partir de 59,2 L : vu en ouvrant la capture, pas dans le verdict).
  Au-delà de la cuve : hachures rouges seules ; « ~12 L évaporés » reste dans la bulle de l'ébullition. Ouvert : `app-cuve-deborde-390`, `app-cuve-deborde-1280`
  (bout de barre en rouge uni), `app-reperes-ouverts-390`, `app-profil-rendu-390`.
- **R2, cible « Lire la source »** : `.idn-src a` en `inline-flex`, `min-height: 24px`, `margin-block: -4px` (la ligne garde sa hauteur de texte). Mesuré 69,5 × 24 px.
  Ouvert : `app-reperes-ouverts-390` : la ligne « 16D · BJCP 2021 · Lire la source » n'a pas bougé.
- **G1** `npm run build` : `✓ built in 21.38s`. **G2** : `Test Files 7 passed (7)`, `Tests 97 passed (97)` (93 avant). `npx tsc --noEmit` : aucune sortie.
  **G3** (commande de GATES.md, `captures/r3/`, journal `serie-sortie.txt`) : `IDENTITE OK`. Je ne me suis pas occupé d'un autre rejeu de la mission.
- **Les 6 notes, mon avis** (je n'y touche pas) : 1 (« Abandonner » à droite du thème à 1280, à gauche à 390) : réel, vient de l'ordre dans `PageShell`
  (le thème avant `actions`) ; hors de mon OWNS ; à décider avec l'en-tête commun, faible gêne. 2 (+ au bord de la fenêtre) : lanceur commun, laisser. 3 (« Milk Stout #2, NI » coupé
  au milieu) : cosmétique, un exemple plus court ou `text-overflow: ellipsis` sur le placeholder ; une ligne dans `identite.css`, que je ferais volontiers. 4 (NOTE de r4-a « 560 px ») :
  juste, à corriger par le pilote (mesuré 744 partout). 5 (cadre noir au repos) : je confirme le mécanisme probable (focus programmatique du conteneur par le script) ; à regarder sur téléphone après
  le déploiement avant d'y toucher. 6 (30 L dans 30 L à la recette neuve) : défaut de données, pas du port ; le conseil (~24) serait le bon défaut, c'est une autre voie.

## 3. Les 11 écarts (captures de `captures/r3/`, toutes ouvertes en image)
- **n° 1, alertes redites** : `src/ui/identite/alertes.ts` (fonctions pures, testées) trie les phrases du moteur. Le fermenteur plein et la cuve
  qui déborde ne sont plus des phrases : le dessin les dit (« +25 L de trop » sous le volume, « +36,2 L de trop » sur la barre). Une seule ligne
  `role=status` reste, le rinçage : « Rinçage : 45,5 L pour 24 L à chaud » (les deux chiffres viennent de `equipmentCheck`, jamais inventés ; si l'un
  manque, « Rinçage au-delà des 24 L à chaud »). Une phrase du dessin revient au premier plan si le dessin se tait (cas testé). Ouvert :
  `app-clavier-apres-390`, `app-cuve-deborde-390`/`-1280`, `app-profil-rendu-390`, `app-vide-390` : une seule ligne ambre, ou aucune.
- **n° 2, repères** : une ligne « 16D · BJCP 2021 · Lire la source » ; les deux propositions sont des liens (« Empâtage « Corps rond » »,
  « Conduite « Ale » »), le nom accessible reste « Proposer l'empâtage … » ; la phrase « Points de départ… » est l'info-bulle (`title`) de la
  ligne de liens. Ouvert : `app-reperes-ouverts-390` : trois pastilles FG, Alcool, EBC « sous ↓ », puis la source, puis les liens, comme `reperes-ouverts.png`.
- **n° 3, fermenteur ouvert** : « Fermenteur [60] L » et « ↺ profil » ; « Matériel du plan : … » retiré (le nom est le sous-titre de la tuile) ; les
  deux adaptations sont deux liens sur une ligne ; « Volumes · 34,7 / 35 L avant ébullition ⌄ » replié, le résumé et ses alertes dedans
  (`VolumesReplies.tsx`). Ouvert : `app-fermenteur-60-390`, `app-profil-rendu-390`, `app-cuve-deborde-1280`.
- **n° 4, bandeau** : dans `BrewWizard.tsx`, les quatre cellules restent en ligne à 1280 comme à 390 (jauge IBU comprise, centrées) : hauteur
  36 px, écart de lignes 2 px (60 px et 21 px avant). Même bandeau pour les sept étapes. Ouvert : `app-repos-1280`, `app-ebullition-240-1280`.
- **n° 5, focus** : fond transparent, ni bordure ni contour, trait plein de 2 px, caret seul (volume et ébullition) ; « Fermenteur [N] L » garde son
  cadre. Mesuré : bordures 0 px, fond `rgba(0,0,0,0)`, bas 2 px solid. Ouvert : `app-clavier-saisie-en-cours-1280` (« 180 » souligné, plus de boîte blanche).
- **n° 6, colonne** : mesurée dans la série (INFO) : Identité 744 px et Fermentescibles 744 px à 1280 (cadre 768 − 24) ; à 390, 374 contre 374. Toutes
  les étapes sont à 744 : **rien changé**. La NOTE de r4-a dit « 560 px, comme l'assistant » : l'assistant n'est pas à 560.
- **n° 7** : la phrase « Adopte ton installation… Ouvrir Matériel » est retirée ; la tuile dit « Système 30L · à adopter » (`TuilesMateriel`, prop
  `aAdopter`). Ouvert : `cote-a-cote-390`, `app-repos-1280`.
- **n° 8** : « Foreign Extra Stout 16D ⌄ », code posé à gauche du chevron (CSS). Ouvert : `cote-a-cote-390`.
- **n° 9** : « cuve 35 L » ; le nom du profil reste « Système 30L », tel que saisi (le verdict écrivait « 30 L » : je n'ai rien corrigé dans un nom saisi).
- **n° 10** : règle du volume = max(cuve, fermenteur + 5 L, volume + 3 L), arrondie par 5 L : 0–65 et « 60 › » pour 60 L, même avec 71,2 L de moût
  (`etendreVolume`, `echelleBarre`, tests). La barre de la cuve s'arrête au bout de la règle ; ses zones se lisent à l'échelle de la règle,
  la zone rouge court jusqu'au bout et le « +36,2 L de trop » dit le reste. Ébullition : un chiffre tous les 60′ dès que la règle dépasse 180 min
  (0, 60, 120, 180, « 240 › » pour 240 min ; `etiquetteEbullition`). Ouvert : `app-cuve-deborde-390`.
- **n° 11** : la barre de titre de la coquille est une grille à 3 colonnes ; « Abandonner » en était le 4e enfant et tombait sur une rangée à
  part. Dans `recipe-wizard.css`, la barre est en flex : « Abandonner » à droite du titre (écart vertical 0 px), la barre d'étapes reste à 36 px
  avant et après modification. Ouvert : `app-ebullition-240-1280`.

Aussi ouvert : `app-vide-390` (import dans le corps, pas de plages, une ligne d'alerte au plus), `cote-a-cote-390` (r4-a à gauche, l'app à droite :
mêmes blocs, pointillés, règles, tuiles fermées côte à côte).

## 4. Rien ne se perd
| Ce qui quitte le premier plan | Où c'est dit |
|---|---|
| « Le volume prévu atteint ou dépasse la capacité physique du fermenteur » | « +N L de trop » sous le volume, zone rouge de la piste ; le résumé Volumes de Matériel (« Le volume atteint la capacité totale… ») |
| « Le volume avant ébullition dépasse la limite utile de la cuve » | « +N L de trop » sur la barre de la cuve ; résumé Volumes de Matériel (« La collecte avant ébullition dépasse… ») |
| « Le rinçage dépasse les 24 L exceptionnels… » | une ligne courte au premier plan (« Rinçage : 45,5 L pour 24 L à chaud ») ; « Rinçage impossible : … » dans le résumé de Matériel |
| « Adopte ton installation… Ouvrir Matériel » | sous-titre « · à adopter » de la tuile Matériel (toucher = ouvrir) ; « Adapter à mon matériel actuel · … » dans la tuile |
| autres phrases du moteur (rinçage saisi sans rinçage, total d'eau…) | la première reste au premier plan avec « · +N dans Matériel » ; toutes dans le résumé replié (`alertesDeMateriel`) |
| source écrite deux fois, « Points de départ… » | une ligne de source ; la phrase dans l'info-bulle des deux liens |
| « Matériel du plan : … » | le nom est le sous-titre de la tuile Matériel |

## 5. La baseline des autres étapes
Commande de la voie, sans `--prendre` ; sorties dans `captures/baseline-1-sous-charge.txt`, `baseline-2-seule.txt`, `baseline-3-ma-biere.txt`.
- **Écarts anciens (4, mêmes pourcentages qu'avant la voie)** : `suggerer/bannie-tropicaux` 2,4590 %, `fiche/repos` 2,7491 %, `fiche/bas` 10,2958 %,
  `substituer/dry-hop` 0,3163 %.
- **Écarts nouveaux, par essai** :
  - 1er passage (joué pendant que des tests d'intégration tournaient) : 6 écarts, dont `etape-houblons/repos` et `ma-biere/repos`. Diffs ouverts :
    page entièrement décalée et « Chargement de la brasserie… » visible : cause = machine surchargée, la page n'avait pas fini de charger. Rejoués seuls :
    0 px, OK.
  - 2e passage (machine libre) : 5 écarts, les 4 anciens et `ma-biere/visee-posee` (« Waiting for selector `[data-ecran='ma-biere']` failed »).
  - Rejeu de `ma-biere` et `etape-houblons` seuls : 11 états à 0 px, `ma-biere/visee-posee` à 39,3 % : la capture montre l'étape Houblons de l'assistant
    (« Grain 0 kg ») au lieu de la page Ma bière. Le même état passait au 1er passage, même code : c'est un aléa du geste (`pont-biere` puis un
    « + » enchaînés sur un état qui persiste), pas un effet du bandeau ni d'« Abandonner » : à 390 ces deux éléments sont inchangés (bandeau 31 px,
    « Abandonner » dans la rangée mobile). Non prouvé par un rejeu sur le commit d'avant (pas de copie à jour) ; à regarder par le pilote.
- Le bandeau (n° 4) ne change que le haut à 1280 ; la baseline est à 390 : aucune référence ne bouge à cause de lui. `--prendre` : non utilisé.
- Hors de mon périmètre, écrits par l'outil de baseline : `work/refonte-frontend/v4/choix/baselines/_ecarts/` (diffs des états en écart).

## 6. Fichiers écrits
`src/pages/BrewWizard.tsx` (alertes, tuile Matériel, bandeau), `src/pages/recipe-wizard.css` (barre de titre), `src/ui/identite/` : `alertes.ts` (nouveau),
`VolumesReplies.tsx` (nouveau), `CarteVolume.tsx`, `CarteEbullition.tsx`, `PlagesStyle.tsx`, `TuilesMateriel.tsx`, `Regle.tsx` (data-max), `regles.ts`,
`identite.css` ; `tests/unit/identite/` : `alertes.test.ts` (nouveau), `correctifs.test.tsx` (nouveau), `regles.test.ts`, `cartes.test.tsx` ; dans la
voie : `capturer-identite.mjs`, `captures/avant/`, `captures/r3/`, ce fichier. Le bandeau de l'assistant vit dans `BrewWizard.tsx` : aucun autre
fichier de composant touché ; `PageShell.tsx` (hors Possède) n'a pas eu à l'être : le n° 11 se règle en CSS de `recipe-wizard.css`.

## 7. Doutes et limites
- Le moût de 71,2 L ne tient plus dans la règle (0–65) : la barre de la cuve est coupée au bout de la règle (décision du pilote : fermenteur + 5 L).
  L'honnêteté tient au « +36,2 L de trop » ; la zone rouge ne dit pas « jusqu'où ». À dire si le brasseur la préfère étirée (alors le n° 10 revient).
- Un test d'intégration hors Possède échoue : `tests/integration/waterVolumeExplanation.test.tsx` l. 90 attend le texte « Matériel du plan : Royal Catering ·
  cuve 45 L », ligne que le n° 3 retire (le nom est le sous-titre de la tuile). Autres tests lus : `brewEquipment`, `brewLegacyInstallation*`,
  `noloWizardApply`, `batchScheduling` verts. À adapter par le pilote (attendre « Royal Catering · cuve 45 L » dans la tuile Matériel).
- Le rinçage de la fixture (45,5 L pour 24 L) vient du moteur sur 240 min d'ébullition ; dans la phrase du pilote (28 L pour 24 L) les chiffres étaient un exemple.
- Les captures du côté clair seulement pour le repos 1280 et les gestes ; le thème « cave » est joué au repos (`app-repos-cave-*`), non rouvert après ces correctifs.

DÉCISION À PRENDRE : (1) adapter `tests/integration/waterVolumeExplanation.test.tsx` l. 90 (hors de ma voie) ; (2) `ma-biere/visee-posee` : rejeu sur le commit d'avant pour confirmer l'aléa, puis `--prendre` des 4 références anciennes si le pilote le décide ; (3) la règle du volume coupe la barre de la cuve quand le moût dépasse fermenteur + 5 L : garder (recommandé, c'est r4-a) ou étirer.

CONNAISSANCE : la barre de titre de `PageShell` est une grille à 3 colonnes (`page-shell.css`) : tout 4e enfant (ici « Abandonner » avec le thème) tombe sur une rangée à part ; une page qui passe `actions` doit mettre la barre en flex.
LEÇON PROPOSÉE : une exigence de rendu mesurée sur un seul état (« Abandonner » absent au repos) ne se voit pas ; le contrôle doit se jouer dans l'état modifié et comparer la position de la barre d'étapes avant et après (le contrôle « le haut ne bouge pas » l'a fait ici).
