OK — skill webapp-testing adapté (puppeteer-core, with_server.mjs) ; parcours étape Houblons v4 : 11/11 en dev, 4/4 en prod (le wizard n'y est pas atteignable)

## Téléchargé (2026-10-25, branche main, raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/)
`SKILL.md`, `LICENSE.txt` (Apache 2.0, Anthropic PBC), `scripts/with_server.py`, `examples/element_discovery.py`, `examples/static_html_automation.py`, `examples/console_logging.py` : 6 fichiers, tous lus en entier, aucun exécuté (Python absent de toute façon). URL dans `.claude/skills/webapp-testing/SOURCE.md`. Les `.py` ne sont pas gardés dans le dépôt (URL suffisantes).

## Écrit
- `.claude/skills/webapp-testing/` : `SKILL.md` (réécrit en français pour ce dépôt), `LICENSE.txt` (tel quel), `SOURCE.md`, `examples/_lanceur.mjs`, `reconnaissance.mjs`, `journal-console.mjs`, `html-statique.mjs`.
- `scripts/with_server.mjs`.
- `work/missions/2026-10-25-integration-houblons/voies/w-webapp-testing/` : `test-etape-houblons.mjs`, `captures/` (PNG + JSON), ce fichier. Rien dans `src/`. Builds de test dans `os.tmpdir()`, supprimés ; ports 3100, 4173, 4174, 4600 libres à la fin (netstat).

## Adapté et pourquoi
- Python → Node/puppeteer-core, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe` (`CHROME_PATH` pour changer).
- `with_server.mjs` : mêmes options que l'original (`--server`, `--port`, `--`), plus `--env K=V` (le drapeau `VITE_HOP_V4=on` se pose à Vite par l'environnement), `--timeout`, `--reuse`, `--no-http`. Raisons : sous Windows `terminate()` laisserait node et esbuild vivants, donc `taskkill /T` ; l'original lit un tuyau jamais vidé (blocage possible), donc journal en fichier dans `os.tmpdir()` ; un port déjà ouvert est refusé (sinon on teste le serveur d'un autre) ; attente d'une réponse HTTP, pas seulement du port ; code de sortie du test propagé. Vérifié : serveur factice (code 7 propagé, port libéré), port occupé (code 3), serveur Vite arrêté à chaque fin.
- `_lanceur.mjs` coupe toute requête hors localhost (`journal.bloquees`) : aucune donnée réelle, ni Firebase, ni Gemini, ni polices Google ; délai de navigation de 120 s (premier chargement de Vite à froid : plus de 30 s, un premier essai a expiré à 30 s).
- `SKILL.md` : arbre de décision, reconnaissance avant action, réseau calme, sélecteurs par texte/rôle/data-* conservés ; ajoutés les règles du dépôt (captures regardées, `?dev-local` via `cerveau/agents/verification-locale.md`, aucune donnée réelle, contrôle qui doit échouer sur la version rejetée, périmètre d'écriture), les pièges vus ici, les limites.

## Commandes du test
```
# dev (Vite, ?dev-local, fixture, 390 × 844, drapeau hopV4 allumé)
node scripts/with_server.mjs --server "npm run dev" --port 3100 --env VITE_HOP_V4=on -- \
  node work/missions/2026-10-25-integration-houblons/voies/w-webapp-testing/test-etape-houblons.mjs --base http://localhost:3100 --mode dev
# prod (npx vite build --outDir <tmp>/prod --emptyOutDir, avec VITE_HOP_V4=on ; servi par servir.mjs)
node scripts/with_server.mjs --server "node work/refonte-frontend/v4/tournoi/outils/servir.mjs <tmp>/prod --port=4173" --port 4173 -- \
  node …/test-etape-houblons.mjs --base http://127.0.0.1:4173 --mode prod
```
Écart avec la consigne : `npm run build` écrit dans `dist/` (hors de mon périmètre) et lance `tsc` ; j'ai fait `vite build` seul vers `os.tmpdir()` (17 s). Le typage n'est donc pas rejoué ici. `npx vite preview` non utilisé ; `servir.mjs` du tournoi, comme proposé.

## Résultats
**Dev : 11/11.** Wizard ouvert (Actions rapides → Créer une recette) ; onglet Houblons → `data-ecran=ma-biere` (écran v4) ; Citra ajouté depuis le catalogue (fixture embarquée) par la porte du wizard ; « Ouvrir l'analyse de ma bière » → couche `hopBeer`, pile `["tabs","wizard"]` → `["tabs","wizard","hopBeer"]` ; fermeture par le bouton « Fermer » du dessus → pile revenue à `["tabs","wizard"]` ; même onglet « Houblons », même carte Citra, même IBU et même rail, et un marqueur posé sur le DOM de l'étape est toujours là (l'étape n'a pas été remontée) ; 0 erreur de page ; 0 erreur de console ; 7 messages console (vite, DevTools, meta apple dépréciée, émulateurs connectés, App Check désactivé : tous bénins). Le même script sur un serveur au drapeau éteint échoue (`data-ecran=null`) : le contrôle discrimine.
**Build empaqueté (mode développement, hors production) : 11/11**, mêmes résultats (`NODE_ENV=development vite build --mode development`, servi par `servir.mjs`) : il prouve que le code empaqueté et découpé (chunk `EtapeHoublons`) fait le même parcours.
**Prod : 4/4, mais ce n'est pas le parcours.** `?dev-local` y est éliminé : seule la page de connexion Google existe, le wizard n'est donc pas atteignable sans session (les émulateurs ne se branchent qu'en `DEV`). Contrôlé : page de connexion affichée ; 0 marque du contournement (`dev-local`, `devLocalUser`, `__hopQa`…) dans les 160 fichiers JS servis (15 363 Kio) ; 0 erreur de page ; chunk `EtapeHoublons-*.js` présent (drapeau allumé dans le build).

## Captures (toutes ouvertes en image)
- `captures/dev-01-reconnaissance.png` : tableau de bord vide (Brassins 0 en cuve, Stocks suffisants, Finances 0,00 CHF, Agenda « Marché d'Automne » du 10.10.2026, Échéances), barre Bord/Finances/Brassins/Stocks/Clients et « + ». Pas de bandeau d'erreur.
- `captures/dev-02-etape-houblons-vide.png` : « Houblons 3/7 », onglets, bandeau IBU 0 / OG **NaN** / EBC ?, rail Ébullition 60′ avec « + » pointillé, 0′, whirlpool, pastille levure, champ « Ajouter — houblon… », « 0 au style · 12 non situées », 12 familles en hachures, « Ouvrir l'analyse de ma bière », Retour / Suivant — Levure.
- `captures/dev-03-etape-houblons-citra.png` : « Brouillon conservé sur cet appareil » + Abandonner ; carte Citra à 10′ (ébullition, 15 g, α 10–15 %, aromatique, agrumes 1/1, « ? IBU » hachuré, « Sans Citra › ») ; proposition Adeena (3,5–5 %) ; familles agrumes, tropicaux, noyau, melon et floral remplies, le reste hachuré.
- `captures/dev-04-outil-ouvert.png` : couche « Ma bière · Outil houblons · niveau 1 », « Écran provisoire : l'outil v4 viendra ici. Moteur v4 chargé (157 fonctions et tables ; données du prototype, non réelles). » avec l'identifiant de recette ; écran vide dessous (couche provisoire, attendue avant T13/T15).
- `captures/dev-05-retour-etape.png` : identique à dev-03 à l'œil (même carte Citra, mêmes familles) ; le contrôle DOM le confirme.
- `captures/empaquete/dev-0{1..5}-*.png` : mêmes écrans sur le build empaqueté ; `dev-05` ouverte : identique à `dev-03`.
- `captures/prod-01-reconnaissance.png` : page de connexion « L'Affinée · Villars-sur-Glâne · Fribourg », « Continuer avec Google », deux autorisations listées, **bandeau rouge « La connexion Google ne peut pas être préparée »**. Ce bandeau est l'effet de ma coupure du réseau (appel bloqué de `driveAuthorization`), pas un défaut de l'app.

## Erreurs de console
Dev et empaqueté : aucune. Prod : 3 « Failed to load resource » = les 3 requêtes que j'ai coupées (`fonts.googleapis.com`, `accounts.google.com/gsi/client`, `europe-west6-brasserie-l-affinee.cloudfunctions.net/driveAuthorization`), filtrées comme coupures du lanceur. En dev, seule `fonts.googleapis.com` est coupée : les captures se rendent donc avec les polices de repli, pas les vraies (Source Sans 3, IBM Plex Mono).

## Ce qui a échoué ou reste ouvert
- Premier essai de reconnaissance : délai de 30 s dépassé au premier chargement de Vite à froid → 120 s dans le lanceur.
- Deux erreurs de ma part, corrigées : chemin de la racine dans le test (4 niveaux au lieu de 5) ; mes propres coupures comptées comme erreurs de console (filtre sur `journal.bloquees`).
- Non fait : le wizard sur le vrai build de production (impossible sans connexion Google ni émulateur Auth) ; `npm run build` complet avec `tsc` ; l'exemple `html-statique.mjs` n'a eu qu'un essai de fumée (sa capture n'a pas été ouverte).

## Constats sur l'écran (hors de ma voie, à router vers T12 et son critique)
1. Bandeau de l'étape v4 sur un brouillon sans fermentescibles : « OG **NaN** » visible et « IBU **0** » alors que la carte du houblon dit « ? IBU » (dev-02, dev-03). L'inconnu n'est jamais 0 ni « NaN » (règle d'honnêteté des données) : à vérifier si la maquette choisie montre « ? » à cet état.
2. Le bandeau « Brouillon conservé sur cet appareil · Abandonner » apparaît dès le premier houblon (dev-03) ; il décale le rail d'environ 32 px CSS (64 px sur la capture 2×) par rapport à l'état vide.

DÉCISION À PRENDRE : tester le wizard v4 sur un build de production sans connexion. Options : (a) en rester au build empaqueté en mode développement (fait, 11/11) ; (b) ajouter un drapeau de build de test qui garde `?dev-local` hors production (touche `src/App.tsx` et la garde de `check-no-dev-auth.mjs`, risque pour la sécurité) ; (c) tester en ligne plus tard, en lecture seule, avec une session du brasseur. Recommandation : (a) pour T18, (c) à la mise en ligne ; refuser (b).

CONNAISSANCE : `?dev-local` + `VITE_HOP_V4=on` (variable d'environnement posée au lancement de `npm run dev`) suffisent à atteindre l'étape v4 du wizard ; le crochet `window.__hopPile` ne sert qu'à lire la pile, pas à allumer le drapeau (`flags.ts` : allumé seulement au build/au démarrage par `VITE_HOP_V4=on`). Le premier chargement de Vite à froid dépasse 30 s. Le build de production ne sert que la page de connexion ; la page de connexion appelle la fonction `driveAuthorization` du projet réel dès son affichage.

LEÇON PROPOSÉE : tout test navigateur coupe les requêtes hors localhost par défaut (`_lanceur.mjs`) et sépare ses propres coupures des erreurs de l'app ; sans cela, l'étape de connexion ou des polices touche le projet réel.
