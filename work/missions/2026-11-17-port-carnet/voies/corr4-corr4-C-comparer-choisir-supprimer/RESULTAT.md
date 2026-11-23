ECHEC — critère (c) 28b : réglettes et ✕ attendent `carnet={ouvert.carnet}` dans CarnetsVue (lot D) ; 12/15 corrigés

Lot corr4-C-comparer-choisir-supprimer, correction 4 du port du carnet (18.11). Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Maquettes ouvertes : p2:g01-8, g05-9, g05-11, h04-7, v03-7, h05-9 ; g4:v02-18 ; g5:v06-11, v08-27.

## Fichiers écrits (seulement ceux possédés)
- `src/domain/carnets/comparer.ts` : `Tableau.aRelire`, `estARelire`, `aRelireDe`, `colonnesLues`, clés de tri (critères puis prix), `rangePar` tiré des clés mêmes, `libelleEcarte` et `raisonEcarte` sans nom répété, `placesDe`, `compromisDe`, `pourquoiDe`, `nombreTexte`, `prixTexte`. `Colonne` gagne `critereTexte` et `lue` (champs optionnels).
- `src/ui/carnets/Comparer.tsx` : colonnes dans l'ordre de g01-8 (critères, prix, valeurs lues), « Ce qui compte » = le critère qui classe, vignette (photo, ou prop `pictos` du lot B), nom sur 2 lignes, compromis IA ou local, « Valeurs annoncées par les vendeurs · exemple », liste `ARelire`, écarté en `libelleEcarte`.
- `src/ui/carnets/Choisir.tsx` : props optionnelles `carnet` et `picto` ; le cadre nomme l'article ; le pourquoi est prérempli (`pourquoiDe`) et reste modifiable ; les places viennent de `placesDe`. Choisi : phrase avec ses valeurs, sa phrase entre guillemets, `Reglette` (le critère chiffré et le prix), un ✕ pour chaque écarté du tableau, photo, prix avec CHF. `Input` et `Textarea` de l'app (audit des saisies).
- `src/ui/carnets/SupprimerCarnet.tsx` : G35 selon v08-27 (« Déplacer » avec sa flèche ; « s'arrête pour les n ») ; le plan qui retient se nomme une fois, sans « À venir · » devant.
- `src/ui/carnets/carnets-decider.css` : Comparer à 760 px dès 900 px (736 de contenu), nom limité à 2 lignes, têtes alignées en haut, compromis, à relire, réglette, tableau « Ses autres valeurs », G35, Supprimer grisé (contour `--c-mut` en tirets).
- `src/ui/finance/UpgradeWorkspace.tsx` : pas de « + Besoin » dans le segment (`onVue`) ; `createRequest` accepte `newBesoin` ; la ligne d'origine d'un suivant tient sur une ligne et s'ouvre d'un toucher (le bouton « Ouvrir le carnet » reste seulement sur la carte du prochain achat et sur les cartes de Réalisés) ; à moins de 640 px, le prix passe sous le nom.
- `src/components/tabs/StocksTab.tsx` : sur Matériel › À venir, le + volant (`newEquipment`) demande « Ajouter un besoin » à l'UpgradeWorkspace ; ailleurs, l'achat de matériel ne change pas.
- Tests : `tests/unit/carnetsCritique4Decider.test.tsx` (nouveau, 25 cas) ; mise à jour de `carnetsComparer.test.ts` (ordre, `aRelire`, `rangePar`, raison d'écart, texte du critère tiré de la fixture) et de `carnetsCorrection3Decider.test.tsx` (raison « écarté : … »).
- Ici : `captures.cjs`, 18 captures `m390-clair-*` et `d1280-sombre-*`.

## Problème → fait → preuve
1. **P6 (calcul et Comparer) : un lien non lu était classé.**
   - Fait : un lien non lu et sans valeur sort des lignes et va dans `aRelire`. Comparer le montre ainsi : « ? Lien sans aperçu · exemple.invalid · à relire · Ouvrir ↗ ». Le tableau naît au 2e article **lu**.
   - Preuve, test : cas P6.
   - Preuve, banc : `aRelire:["? Lien sans aperçu exemple.invalid · à relire Ouvrir"]`, 4 rangs et non plus 5.
   - Capture ouverte : m390-clair-27b.
2. **P10 et P32 : le classement.**
   - Fait : on trie par les critères dans leur ordre, puis par le prix croissant s'il est connu sur au moins 2 articles, dans une seule devise. Une valeur inconnue passe après les connues. Les valeurs lues sur au moins 2 articles deviennent des colonnes : elles sont montrées sans classer, faute d'un critère qui dise leur sens. `rangePar` est écrit à partir des clés mêmes du tri. « Ce qui compte » nomme le critère qui classe (« tient 80 °C »), plus « plus de condensation », qui ne classait rien.
   - Preuve, tests : 245 avant 690, `rangePar` « le prix » ; débit et °C en colonnes ; prix inconnu en dernier ; égalité départagée par le prix.
   - Preuve, banc : « rangé par : tient 80 °C d'abord, puis le débit, puis le prix ».
3. **P14 et P38 : Comparer, g01-8.**
   - Fait : « Compromis : la 2e, 1 450 CHF, soit 1 150 CHF de moins que la 1re ; le débit 1 200 m³/h au lieu de 1 800 m³/h ; tient 80 °C : oui, comme la 1re », avec le picto local. « Valeurs annoncées par les vendeurs · exemple ». Les vignettes viennent de la photo ou de la prop `pictos`. Les noms tiennent sur 2 lignes (`nomsLignes:[2,2,2,2,2]`). À 390, « → 3 de plus » et l'ombre de bord signalent les colonnes cachées.
   - Captures ouvertes : m390-clair-27, d1280-sombre-27.
4. **P46 : largeur de Comparer.** Fait : 760 px dès 900 px de large. Preuve, banc : `largeur:760` à 1280 (736 px de contenu), contre 920 avant.
5. **P41 : l'écarté.** Fait : « Ventilateur de plafond 130 cm » puis « écarté : brasse la buée sans la sortir ». La façon n'est nommée que si le nom de l'article ne la contient pas. Preuve : test P41 et banc.
6. **P16 : Choisir.**
   - Fait : le cadre dit « Hotte inox 120 cm + moteur » puis « Inox Broye · CH · en stock ». Le pourquoi est prérempli, marqué « proposé, à corriger », et reste modifiable. Il n'est jamais vide : sans `carnet`, il se calcule sur les articles reçus.
   - Preuve, test : avec le carnet, « Tient 80 °C : oui ; le débit 1 800 m³/h, 1er sur 4 ; 2 600 CHF, 4e sur 4 au prix ; en stock, Inox Broye (CH). ».
   - Preuve, banc (sans `carnet`, CarnetsVue n'étant pas branché) : « 2 600 CHF, 4e sur 4 au prix ; le débit 1 800 m³/h ; tient 80 °C : oui ; … ».
   - Capture ouverte : m390-clair-28.
7. **P17 et P40 : Pourquoi ce choix, g05-11.** Le composant est fait et testé : phrase avec ses valeurs, réglettes « débit : 1 800 m³/h, 1er sur 4 » et « prix : 2 600 CHF, 4e sur 4 », ✕ « Ventilateur de plafond 130 cm : brasse la buée sans la sortir », photo, « 2 600 CHF ». **Au banc, phrase, réglettes et ✕ manquent** : CarnetsVue ne passe pas `carnet`, voir la demande ci-dessous. La mention CHF (P40), elle, se voit au banc : « 2 600 CHF · en stock ».
8. **P20 : G35.**
   - Fait : « 1 article en veille : les déplacer dans Extracteur pour la salle de fermentation · Déplacer ». CarnetsVue passait déjà la prop `proche`, et la fixture A fournit le carnet proche. La prop existait.
   - Capture ouverte : m390-clair-36b.
9. **P42 et P45 : Supprimer une idée liée.**
   - P42 fait : « ZZ TEST — Frigo de garde pour fûts · plan dans À venir » tient sur 2 lignes, avec son réglage dessous.
   - P45 fait : Supprimer grisé en tirets `--c-mut`. Le test mesure ≥ 3:1 sur le fond de la carte, en clair et en cave. Banc : `rgb(102,102,102)` en clair, `rgb(154,138,126)` en sombre.
   - Capture ouverte : m390-clair-38.
   - Reste, hors de mes fichiers : la puce « À venir · … » qui double la carte, et « votre phrase en titre » sans la phrase (P35). Les deux sont dans `CarnetOuvert.tsx`.
10. **P39 : À venir.**
    - Fait : un seul « + », le + volant (`besoin:0`) ; « Ouvrir le carnet » une seule fois (`ouvrir:1`) ; la ligne d'origine du suivant sur une ligne, en lien ; le titre « ZZ TEST — Ventilation de la salle de brassage » entier sur 2 lignes (`coupe:false`).
    - Captures ouvertes : m390-clair-30b, m390-clair-30c.

## Sorties décisives
- (a) `npx vitest run` sur les 4 fichiers du critère : 4 fichiers, 67 tests verts. `npm test -- …` s'arrête avant vitest, sur `audit_inputs.mjs`. Il y a 45 constats dans tout le dépôt, déjà là avant ce lot. Les miens (Choisir) sont corrigés. Reste `UpgradeWorkspace.tsx:119-120` (champ prix de la frise), ancien et hors de mes problèmes.
- (b) `npx tsc --noEmit -p .` : 0 erreur.
- (b) Tests d'UpgradeWorkspace (equipmentProjects, fixMateriel, fixMateriel2, ouvertureArchiveVolume, projetsPrevisions) : verts.
- (b) `stocksTabBoucle` : **1 rouge, voulu par P39** (ligne 88 : « + Besoin » dans la colonne d'À venir). Voir la demande.
- carnetsEcrans et carnetsParcours : les rouges vus (G8 « plus de condensation », note en vrac « à acheter ▾ ») viennent des lots A et B en cours. Ils ne touchent pas mes fichiers.
- Banc : vite dev sur le port 5397, `VITE_FIREBASE_*` fictifs, Google coupé, aucun `pageerror`. Le serveur est arrêté (0 écoute).

Essais : P10 2 (rangePar, puis test du critère qui dépendait de la fixture) ; « dite » 2 (« le tient 80 °C oui » vu au banc, corrigé) ; le reste en 1. Captures : 2 lancements.

## Doutes et limites
- Les valeurs lues sans critère ne classent pas : leur sens (plus ou moins vaut mieux) n'est dit nulle part. C'est la lecture prudente. Le « puis le débit » de g5:v06-11 suppose que l'IA dise ce sens. C'est au lot B de proposer un critère.
- Le compromis local suit une règle fixe : le moins cher qui tient les mêmes critères oui-non et perd le moins sur le premier critère chiffré. Il ne pèse rien au-delà. L'IA (prop `compromis`) prime.
- Les vignettes de Comparer restent vides tant que le lot B n'a pas de picto par objet. Il n'y a pas de cube générique (P1).
- Captures faites en 390 clair et 1280 sombre seulement. Les deux autres combinaisons et le parcours 19 (deux liens collés) passent par la demande d'exécutant.

## DEMANDE LOT D (CarnetsVue.tsx, que je ne possède pas)
1. Sur les deux `<Choisir …>` (l. ~609 et ~616) : ajouter `carnet={ouvert.carnet}`, et `picto={…}` quand le lot B l'a. Sans cela, P17 (réglettes, ✕, phrase) et les rangs de P16 n'apparaissent pas au banc.
2. Sur `<Comparer …>` : `pictos={…}` (lot B), et `compromis={…}` si l'IA en donne un.
3. `CarnetOuvert.tsx` : P35, « votre phrase en titre » toujours suivi de la phrase citée (l. ~145) ; P42, retirer la puce « À venir · <titre> » (l. 248) quand la carte « dans À venir » est montrée.

DÉCISION À PRENDRE : `tests/integration/stocksTabBoucle.test.tsx`, ligne 88, exige « + Besoin » dans À venir (d1280-4, correction 2). P39 et h05-9 en demandent un seul : le + volant.
- Options : (a) changer l'assertion en « aucun bouton Ajouter un besoin ; le + volant ouvre le besoin » ; (b) garder « + Besoin » et retirer P39.
- Recommandation : (a). h05-9 est figé, et le + volant porte l'action (R28).

## DEMANDE EXECUTANT (après le branchement du lot D)
1. Depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, avec `VITE_FIREBASE_API_KEY=banc-faux`, `VITE_FIREBASE_AUTH_DOMAIN=banc.invalid`, `VITE_FIREBASE_PROJECT_ID=banc-faux`, `VITE_FIREBASE_STORAGE_BUCKET=banc.invalid`, `VITE_FIREBASE_MESSAGING_SENDER_ID=0` et `VITE_FIREBASE_APP_ID=1:0:web:0` : `npx vite --port 5397 --strictPort --host 127.0.0.1` en arrière-plan.
2. `node <ce dossier>/captures.cjs 5397`, qui fait les 4 combinaisons. Attendu :
   - `28b` : `reglettes` non vide (« Débit … 1er sur 4 », « Prix … 4e sur 4 ») et `raisons` contenant « Ventilateur de plafond 130 cm : brasse la buée sans la sortir » ;
   - `27` : `largeur:760` à 1280 ;
   - `30c` : `besoin:0`, `ouvrir:1`.
3. Arrêter vite (`taskkill` du PID qui écoute 5397), puis vérifier qu'aucun processus n'écoute plus sur ce port.
4. Parcours 19 : dans Carnets, coller `https://exemple.invalid/pompe-inox` puis `https://exemple.invalid/pompe-magnetique` (IA simulée), ouvrir Comparer, capturer en m390 et d1280. Attendu : la 1re colonne est à 245 CHF, et les colonnes débit et température max sont présentes.
5. Captures à ouvrir pour mon jugement : `*-28c-pourquoi.png` (4), `*-27-comparer.png` (m390-sombre, d1280-clair), `*-19-*.png`.

CONNAISSANCE : `npm test -- <fichiers>` lance d'abord `audit_inputs.mjs`, qui échoue sur 45 constats anciens du dépôt. Pour un critère par fichier, `npx vitest run <fichiers>` donne le vrai verdict. Un `<textarea>` ou un `<input>` brut dans `src/ui` est signalé : il faut prendre `Input` ou `Textarea` de `src/ui/Input.tsx`.

LEÇON PROPOSÉE : un écran qui reçoit ses données par un conteneur qu'une autre voie possède doit avoir, dans son brief, la ligne de branchement confiée à cette voie. Sinon, le correctif est vert en test et invisible au banc (ici, P17).
