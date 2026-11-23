OK — I6 corrigé (année sous « ‹ auj. » et initiale sur année) ; « An ≠ 21,9 sem. » = build périmé du banc ; 2 séries de 200 vertes

## Diagnostic
- Le contre-exemple de la voie (graine 4444, 4e suite) ne se reproduit PAS sur un build neuf de dbd454199 : `ETAT_RUNS=4 ETAT_SEED=4444` passe (rejeu1.log). Il passe aussi sur le build de 38ea8418f (`lotcal-modele`, rejeu-lotcal-modele.log).
- Il se reproduit à l'identique (même suite, même message I1 « An » ≠ cadre 21.9 sem.) sur le build `lotcal` de 12:14 (rejeu-lotcal.log) : c'est le `LOTCAL_BUILD` par défaut de playwright.lotcal.config.ts. Le banc de fix38c (modele-200.log) a tourné sans `LOTCAL_BUILD` : il a testé un build de la mi-journée, pas HEAD. fix38c n'a pas introduit ce rouge ; le défaut vu était d'avant ce soir.
- Piège (3 essais perdus) : le port 4392 était tenu par le serveur d'une autre voie (autre build) ; `reuseExistingServer: true` fait tester ce qui écoute. Avant tout banc : `curl http://127.0.0.1:<port>/ | grep -o 'assets/index-[^"]*'` et comparer au dossier du build.
- Côté réducteur (tests/unit/calendrierModele2.test.ts, 2 tests) : la suite rejouée avec l'horizon que la période de l'app déplace ; « An » jamais dit d'un cadre < 52 sem., cadre toujours dans l'horizon, propriété 400 suites × 10 gestes. Vert : le réducteur n'est pas en cause (pas de rouge à produire).

## Vrai défaut trouvé par le build neuf : I6 (invariant ajouté par fix38c, jamais rejoué en e2e)
- Séries de 200 sur le build de HEAD (serie1/) : graine 4444 rouge à la 12e suite `[app plage 3 mois, 10 mois]` (« l'année 2027 (277 px dans le cadre) n'est nommée nulle part (2028) ») ; graine 7 rouge à la 8e `[poignée debut tenue au bord 2268 ms, cadre tenu au bord 1 500 ms]` (2027, 171 px). Même cause.
- Cause : cadre loin d'aujourd'hui → « ‹ auj. » couvre les 56 px de gauche et `tue` n'y rend aucun nom. Le janvier de l'axe d'avant le cadre posait son année (« 2027 ») dans cette marge : posée par `periodesBande`, effacée au rendu ; le brasseur voyait « F M A M … 2028 », 2027 nulle part (sa plainte T29-7 / C38-1 « une année sans nom »).
- Correctif (src/ui/calendrier/entete/BandeSemaines.tsx) : `periodesBande` et `etiquettesPosees` reçoivent le côté du masque ; les noms se posent dans la part visible (bords `gv`/`lv` au lieu de `g`/`larg`), l'année se décale au bord visible tant que son centre reste sur elle. Traits (limites) inchangés. Sans masque : comportement identique.
- Test : tests/unit/calendrierModele2.test.ts (3 tests ajoutés : cadre du 1er févr. 2027 et du 28 juin 2027 ; propriété 300 cas « aucun nom sous le masque »). Rouge avec BandeSemaines.tsx de HEAD (tests-rouge.log : 2 échecs, « 2026 à 18 : expected 17.5 >= 56 »), vert avec le correctif (tests-modele2.log : 5 passés).

## Critères
- tsc : 2 erreurs, toutes deux déjà là (seedData.ts GanttTask ; enregistrerPwa.ts virtual:pwa-register) — tsc.log.
- Tests calendrier + propriétés : 30 fichiers, 392 passés (tests.log).

## Deuxième défaut I6 (même cause, trouvé à la série 2 sur le build df5a8a167)
- Graine 4444, 31e suite  : « 2029 » (61 px) nommée nulle part, cadre de 2 ans ½. Avec le bord visible déplacé, « 2029 » posée au bord était chassée par l'initiale suivante (règle « la période entamée cède la place » : pop de la seule année). Correctif : une initiale ne chasse jamais une année (BandeSemaines.tsx, une condition). Test ajouté (cadre du 18 juin 2029, 130 sem.) : rouge sans la condition (« J O 2030 … »), vert avec.

## Séries (build neuf lotcal-modele4 à aadbb914f, serveur vérifié : index-Bp68TbGF.js, ETAT_RUNS=200, ETAT_SHRINK=1, android-390)
- graine 4444 :  (modele-200-graine4444.log) ; graine 7 :  (modele-200-graine7.log).
- Essais : séries rouges avant (serie1/ : build de HEAD, 2 rouges I6 ; serie2/ : 1 rouge I6 à la 31e suite, graine 7 interrompue pour reconstruire) ; 3 builds, 3 correctifs-tests, une seule voie de code (periodesBande).
- Tests : 30 fichiers, 393 passés (tests.log) ; tests-modele2.log : 6 passés ; tsc : 2 erreurs déjà là, aucune neuve.
- Captures : aucune (consigne « pas de captures locales ») ; sonde-an.png (An fraîche, build étranger sur 4392) non probante, ignorée.

## Doutes et limites
- Le banc (e2e/calendrier/etat-coherent.spec.ts) n'est pas modifié. Il ne prouve pas l'aspect : la place du nom d'année à côté de l'initiale (« 2029 » tenu au bord à 72 px, sous le bord du cadre) n'a pas été regardée sur capture ; à voir au prochain tour en ligne.
- Le correctif ne touche que les noms (pas les traits) ; sans masque (« auj. » dans le cadre), comportement identique (tests de bande existants verts).

DÉCISION À PRENDRE : fixer  sans défaut dans playwright.lotcal.config.ts (échec si absent) pour qu'un banc ne tourne plus sur un build périmé ; recommandation : oui (config non commitée, hors de ma voie).
CONNAISSANCE : le défaut du banc Playwright de lot-cal (dossier  de 12:14) et  font tester le build de quelqu'un d'autre ; contrôle : curl du port et comparer le nom de index-*.js au dossier construit.
LEÇON PROPOSÉE : un rouge de banc se rejoue d'abord sur un build neuf de HEAD, serveur vérifié, avant toute recherche dans le code (3 essais perdus ici, et le « contre-exemple » n'existait que sur un build du matin).

PRÊT À METTRE EN LIGNE aadbb914f
