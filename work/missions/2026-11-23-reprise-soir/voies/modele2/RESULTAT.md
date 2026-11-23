EN COURS — contre-exemple « An ≠ 21,9 sem. » : cause = build périmé du banc (pas le code) ; séries de 200 en cours

## Diagnostic (fait)
- Le contre-exemple (graine 4444, 4e suite) ne se reproduit PAS sur un build neuf de dbd454199 : `ETAT_RUNS=4 ETAT_SEED=4444` passe (rejeu1.log : `1 passed`). Il passe aussi sur le build de 38ea8418f (`lotcal-modele`).
- Il se reproduit à l'identique (même suite, même message I1 « An » ≠ cadre 21.9 sem.) sur le build `lotcal` de 12:14 (rejeu-lotcal.log) : c'est le `LOTCAL_BUILD` par défaut de playwright.lotcal.config.ts. Le banc de la voie fix38c (modele-200.log) a tourné sans `LOTCAL_BUILD` : il a testé un build de la mi-journée, pas HEAD. fix38c n'a donc ni introduit ni révélé de défaut ; le défaut vu était d'avant ce soir et déjà corrigé dans le code (la frise de 12:14 ne portait pas encore l'état unique ni la pose bornée).
- Piège secondaire (perdu 3 essais) : le port 4392 était tenu par le serveur d'une autre voie (build `index-CRZOQvHP.js`, pas le mien) ; `reuseExistingServer: true` fait tester ce qui écoute. Avant tout banc : `curl http://127.0.0.1:<port>/ | grep -o 'assets/index-[^"]*'` et comparer au dossier du build. Les rouges « I6 … n'est nommée nulle part » vus en route venaient de ce build étranger, pas du code.
- Côté réducteur : tests/unit/calendrierModele2.test.ts rejoue la suite avec l'horizon que la période de l'app déplace (`semainesPassees/Avenir`) : « An » ne se dit jamais d'un cadre < 52 sem., cadre toujours dans l'horizon, propriété 400 suites × 10 gestes. Vert (le réducteur n'est pas en cause ; pas de rouge à produire).

## Critères
- tsc : 2 erreurs, toutes deux déjà là (seedData.ts GanttTask ; enregistrerPwa.ts virtual:pwa-register) — tsc.log.
- Tests calendrier : 22 fichiers, 313 passés (tests.log) ; tests-modele2.log : 2 passés.
- Séries de 200 : voir « Séries » plus bas.
