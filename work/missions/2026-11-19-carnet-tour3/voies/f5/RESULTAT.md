REPRISE — n° 1 et n° 2 corrigés (1f243127a) ; n° 3 à 13 à faire, plafond de contexte atteint

| n° | verdict | commit | test | rouge→vert | état à capturer |
|---|---|---|---|---|---|
| 1 | corrige : « autre projet, sans rapport : … » envoyé ailleurs = note sans la tête de renvoi, puce Note, cadre sans « Ce qui compte » (`sansAutreSujet`, CarnetsVue) | 1f243127a | tests/unit/carnetsTour3F5.test.tsx | 2 rouges → verts | Ventilation, taper la phrase sans envoyer, puis après envoi le Frigo (note), 390/1280, clair/sombre |
| 2 | corrige : bulle G8 sans line-clamp (carnets-fil.css), les deux façons entières | 1f243127a | idem (règle CSS) | 1 rouge → vert | `&ouvrir=ventilation&g8=1`, champ touché, 390 et 1280, clair/sombre |
| 3 à 13 | à faire | — | — | — | — |

Preuves : `tests-rouge.txt` (3 failed sur HEAD, copie vérifiée puis restaurée, `cmp` OK), `tests-vert.txt` (9 passed : F5 + F4c), `npx tsc --noEmit` sans erreur.
Captures : non faites (aucun serveur lancé ; port 5188 libre). `tests-final.txt` : non fait.

## REPRISE (agent neuf, Opus)
Code : port-carnet, HEAD 1f243127a. Ne toucher que : src/ui/carnets/*, src/domain/carnets/*, src/ui/finance/UpgradeWorkspace.tsx, CSS, tests.
Fichiers en CRLF : éditer avec Edit (pas `sed` avec des barres inverses). Tests nouveaux : ajouter à `tests/unit/carnetsTour3F5.test.tsx`.
Plan déjà établi, par numéro (captures citées dans v4/RESULTAT.md, déjà ouvertes) :
- n° 2 suite : la bulle peut passer à 3 lignes à 390 ; regarder si elle masque davantage (lié au n° 4).
- n° 3 : CadreArrivee.tsx l. 104 « Y ajouter en façon » ; quand les mots tapés sont tous dans le titre du carnet proche (`jetons` ⊆), libellé « Ouvrir ce carnet », et `onAjouter` vide aussi le champ (CarnetsVue, cadre `creer`, `proche`). n° 12 (lien collé depuis la liste : titre « exemple.invalid » + « Y ajouter en façon ») relève du même bouton : pour un lien, pas « en façon ».
- n° 4 : g8-390-clair : titre sous la barre collante et carte « Le critère sépare… » mangée par la zone du champ ; la banc fait `scrollIntoView` center (artefact possible) ; vérifier au navigateur que le défileur garde son bas quand la bulle grandit.
- n° 5 : citation « « … » · votre phrase en titre » = maquette greffe5/v04 fig. 03 et a44245e81 → ecarte ; « Façons · 1 façon » au-dessus d'une seule carte (CarnetOuvert l. 421) : retirer le compte à 1.
- n° 6 : Comparer.tsx l. 259 : « · proposé par l'IA » une seule fois si tous les critères ont la même source ; l. 273 « classées par … » redit les critères : ne garder que ce qui s'ajoute (« puis le prix »).
- n° 7 : Comparer : `cn-hors-seuil` sur 3 lignes : forme courte une ligne (« min. 1 500 », phrase entière en title/aria-label) ; 4e colonne coupée : défilement voulu (Correction 3, g01-8 : 3 colonnes à 390, fondu, « → n de plus »), vérifier que le fondu couvre la colonne partielle.
- n° 8 : Choisir.tsx `Retenus` l. 84 : lister tous les critères qui classent (`criteresQuiClassent`, Comparer.tsx l. 160) : « tient 80 °C, puis le débit, proposé par l'IA ».
- n° 9 : UpgradeWorkspace.tsx l. 511 : payé = prévu → « Payé le montant prévu » (sans 2e et 3e « 11 700 CHF ») ; différents : garder les deux montants. Noms coupés de l'Embouteillage : `.cn-deux-lignes` (carnets.css l. 331) sur `.cn-tab-nom` → nom entier (le vendeur distingue deux articles de même nom).
- n° 10 : `texteMoinsBien` / `moinsBienQueDe` (comparer.ts, domine) : « moins bien que la 1re sur tout » alors que la 2e pompe a le meilleur débit (40 contre 25 L/min) : vérifier le sens de la colonne débit (plus = mieux) dans `domine`.
- n° 11 : un lien collé appelé « votre phrase » (chercher « votre phrase » dans Bandeau/CarnetOuvert : un lien se dit « votre lien »).
- n° 13 : puce « Coller : exemple.in » coupée net à 390 (carnets-fil.css l. 20 `.cnf-aides-ligne > .cn-coller` max-width 55 %, ellipsis) : domaine entier ou ellipsis visible.
Banc : copier v4/outil.mjs, v4/banc.mjs (g8), v4/neuf.mjs (p61, p126, moulin, choisir), f2/captures.mjs (comparer, realises, realise) dans f5 avec PORT 5188 et CAP f5/captures ; serveur Vite de port-carnet sur 5188, arrêté à la fin.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : une voie de 13 corrections avec captures ne tient pas dans 170 k ; la découper (code par lots de 4, captures par un exécutant Haiku).
