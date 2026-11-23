---
name: webapp-testing
description: Tester l'app L'Affinée (ou une page HTML locale) dans un vrai Chrome sans écran avec puppeteer-core : démarrer le serveur, reconnaître la page rendue (capture, DOM, console), puis agir par texte, rôle ou data-*. Pour vérifier un parcours, déboguer un écran, prendre des captures, lire la console. Adapté du skill webapp-testing d'Anthropic (Apache 2.0).
license: Apache-2.0 pour la méthode et le gabarit d'origine ; termes complets dans LICENSE.txt. Origine et adaptations dans SOURCE.md.
---

# Tester une app web locale (puppeteer-core)

Méthode du skill d'Anthropic `webapp-testing`, adaptée à ce poste : Windows, pas de Python, `puppeteer-core` (déjà dans
`node_modules`) et Chrome à `C:/Program Files/Google/Chrome/Application/chrome.exe` (`CHROME_PATH` pour un autre). Tout est
en Node ; Playwright n'est pas installé.

## Règles du dépôt qui priment

- **Une capture non regardée ne prouve rien** (CLAUDE.md, L12) : ouvrir chaque PNG en image avant de dire OK, et dire ce qu'on y voit.
- **Aucune donnée réelle, Gemini jamais.** L'app ouverte en `?dev-local` n'a pas de jeton Firestore : elle s'ouvre vide (voir
  `cerveau/agents/verification-locale.md`). `examples/_lanceur.mjs` coupe en plus toute requête hors localhost
  (`journal.bloquees`) : ni Firebase réel, ni Google Fonts, ni Gemini. Le contournement n'existe que sous `npm run dev` ;
  dans un build de production `?dev-local` est sans effet et on ne voit que la page de connexion.
- **Un test se prouve sur la version qui échoue** : avant de croire un contrôle, le faire échouer exprès (drapeau éteint, sélecteur faux).
- **N'écrire que dans son périmètre** (L17) : captures et journaux dans le dossier de la voie ou `os.tmpdir()`, jamais à la racine ni dans `src/`.
- **Pas de build dans `dist/`** pour un test : `npx vite build --outDir <os.tmpdir()>/… --emptyOutDir`.

## Arbre de décision

```
Tâche → HTML statique (maquette, page publiée) ?
    ├─ Oui → lire le HTML pour trouver les sélecteurs, ouvrir en file:// (examples/html-statique.mjs)
    │         └─ échec ou page qui construit son DOM en JS → la traiter comme dynamique
    └─ Non (app dynamique) → le serveur tourne-t-il déjà ?
        ├─ Non → node scripts/with_server.mjs --help, puis lui confier le serveur et son test
        └─ Oui → reconnaissance puis action :
            1. naviguer et attendre le réseau calme (networkidle0)
            2. capture ET DOM : ouvrir la capture, lister les contrôles
            3. choisir les sélecteurs sur l'état rendu
            4. agir, recapturer, contrôler
```

## Lancer un serveur : `scripts/with_server.mjs`

Équivalent Node de `with_server.py`. **Lancer `--help` d'abord**, le traiter en boîte noire.

```bash
# un serveur
node scripts/with_server.mjs --server "npm run dev" --port 3100 -- node mon-test.mjs
# drapeau de build allumé pour le serveur et le test (Vite lit VITE_*)
node scripts/with_server.mjs --server "npm run dev" --port 3100 --env VITE_HOP_V4=on -- node mon-test.mjs
# build de production servi en local
node scripts/with_server.mjs --server "node work/refonte-frontend/v4/tournoi/outils/servir.mjs <dossier> --port=4173" --port 4173 -- node mon-test.mjs
```

Ce que le script fait de plus que l'original : arrête **tout l'arbre** de processus (`taskkill /T`, sinon `npm run dev` laisse
node et esbuild), refuse un port déjà occupé (sinon on testerait le serveur d'un autre ; `--reuse` pour le permettre),
écrit le journal du serveur dans `os.tmpdir()` au lieu d'un tuyau non lu, attend une réponse HTTP et pas seulement le port,
passe `WITH_SERVER_PORTS` et `WITH_SERVER_LOGS` au test, rend le code de sortie du test. Utiliser un port libre (`3100`) : le 3000 sert souvent au brasseur.

**Premier chargement de Vite à froid : plus de 30 s** (mesuré). Les exemples attendent 120 s ; ne pas conclure à une panne avant.

## Gabarit d'un script de test

```js
import { ouvrir, calme, cliquerTexte } from '<racine>/.claude/skills/webapp-testing/examples/_lanceur.mjs';
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 }); // téléphone, sans écran
try {
  await page.goto('http://localhost:3100/?dev-local', { waitUntil: 'networkidle0' }); // CRITIQUE avant d'inspecter le DOM
  await calme(page);
  await page.screenshot({ path: 'reconnaissance.png' });
  await page.locator('::-p-aria(Actions rapides)').click();
  await cliquerTexte(page, 'Créer une recette');
} finally { await browser.close(); }
```

Piège : `import` d'un script hors du dépôt ne trouve pas `puppeteer-core` ; garder le script dans le dépôt (le dossier de la voie) ou importer le lanceur par URL `file://`.

## Reconnaissance puis action

1. **Inspecter le rendu** : `examples/reconnaissance.mjs <url> <dossier>` écrit capture pleine page, DOM, boutons, champs, console.
2. **Choisir les sélecteurs** sur ce rendu, par ordre de préférence : rôle ou nom accessible (`::-p-aria(Actions rapides)`),
   texte (`::-p-text(Houblons)`), `data-*` du code (`[data-role=pont-biere]`, `[data-ecran]`), CSS en dernier ; jamais une classe Tailwind.
3. **Agir** avec `page.locator(...).click()` (attend l'élément) ; attendre un état, pas une durée : `calme(page)` après chaque geste qui charge.
4. **Contrôler et recapturer** : un état se lit dans le DOM (`data-*`, texte, pile `window.__hopPile` en dev), pas seulement à l'œil.

Pièges vus ici : deux éléments portent la même étiquette (le « Fermer » du wizard et celui de la couche au-dessus) : prendre le
dernier (`(await page.$$('button[aria-label="Fermer"]')).at(-1)`). `useCoarsePointer()` est lu au montage : fixer le viewport
**avant** la navigation (le lanceur le fait). Chrome sans écran se déclare en mouvement réduit : les fondus sont coupés. Voir aussi [[verification-locale]].

## Console, réseau, erreurs

`ouvrir()` remplit `journal` : `console` (type, texte, URL émettrice), `erreurs` (exceptions de page), `echecsReseau`, `bloquees`.
Un test déclare son bruit connu avec sa raison (liste `BRUIT`) ; tout le reste est une erreur. Une erreur « bloquée par le client »
dont l'URL est dans `bloquees` est notre coupure du réseau externe, pas un défaut de l'app.

## Exemples (`examples/`)

- `_lanceur.mjs` — ouvre Chrome (390 × 844 par défaut), journaux, coupure du réseau externe, `calme`, `cliquerTexte`.
- `reconnaissance.mjs` — découvrir boutons, champs, titres ; capture pleine page ; console.
- `journal-console.mjs` — cliquer un texte et rendre le journal ; code de sortie 1 s'il y a une erreur.
- `html-statique.mjs` — page ou maquette en `file://`, capture avant et après un clic.
- Test complet d'un parcours : `work/missions/2026-10-25-integration-houblons/voies/w-webapp-testing/test-etape-houblons.mjs`
  (wizard → étape 3 Houblons, drapeau `hopV4` allumé par `VITE_HOP_V4=on`, outil ouvert puis fermé, brouillon intact ; mode `prod` pour un build servi).

## Limites connues

- Le build de production ne se parcourt pas sans connexion Google : seuls la page de connexion et le bundle se contrôlent. Pour tester
  le code empaqueté (découpage, worker), construire en mode développement (`NODE_ENV=development vite build --mode development`) : ce n'est pas l'artefact de production.
- Les captures sont des PNG à 2×. Pour une mesure précise (rapport sous le doigt / au loin, L12), prendre les scripts de contrôle du dépôt.
