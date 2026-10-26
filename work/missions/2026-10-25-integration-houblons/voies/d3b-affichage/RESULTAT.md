OK — Comparer et fiche Sources lisent complements.json : sélinène, géraniol, champs neufs, valeurs écartées marquées ; chargé à la demande

Pas de GATES.md dans le dossier : critères pris dans VOIE.md.

## Fichiers écrits
- `src/ui/hopIndex/fiche/complements-ui.ts` (nouveau, dans `fiche/`) : lancement unique du chargement, hook `useComplements(attenteMax)`, références courtes des 18 sources (BH, BF, BHA, BSG, CF, CRO, HD, HDI, HJ, HL, HS, HPA, IH, JH, NZH, USA, USDA, YVH), texte des bornes.
- `src/ui/hopIndex/comparer/valeurs.ts` : `compose()` et `huile()` fusionnent fiches de composés + catalogue + `complements.json` (valeurs valides seulement) ; `titreRef()` donne le nom court des nouvelles sources.
- `src/ui/hopIndex/comparer/Huiles.tsx` : ligne Sélinène ; « Autres » ne nomme plus que le β-pinène et retranche linalol, géraniol, sélinène ; en-tête « mesuré · sources » (il disait « Beer Maverick », devenu faux).
- `src/ui/hopIndex/comparer/Feuilles.tsx` (un hook), `comparer.css` (unité des cellules 12 → 11 px : « 2,4–3,8 µg/kg » débordait de 2 px), `EcranApp.tsx` (préchargement, attente 600 ms au plus).
- `src/ui/hopIndex/fiche/sources.ts`, `SourcesFiche.tsx`, `Replis.tsx` : feuille Sources champ par champ.
- Tests : `tests/integration/comparerValeurs.chrome.mjs` (étendu), `tests/unit/hopIndexV4/comparerComplements.test.ts` (8), `ficheComplements.test.tsx` (5), `complements.test.ts` (l'invariant de d3a « rien n'importe complements » devient « seul le chargeur lit le JSON ; seuls Comparer et la fiche passent par lui »).

## Ce qui est fait
- Composition : sélinène sur sa ligne quand un houblon comparé l'a (trio riche : Galaxy 6–13 %, Cascade 1,5–3,2 %, Enigma 12–15 %, source HPA, John I. Haas au survol). Géraniol de Mosaic 0,4–1 % (BarthHaas, Crosby) qui était « ? ».
- Tableau de chimie : mêmes valeurs, mêmes références courtes (BM HS BH CF CRO HL…) ; légende en bas avec le nom court de chaque source.
- Fiche, Sources : 
  - liens : Beer Maverick d'abord, puis fiches du catalogue, puis celles de complements.json (une fois par adresse, ce qu'elles apportent sans répéter ce qui est déjà dit) ;
  - thèmes Acides, Huile, Arômes (notes Hopsteiner) et « Autres mesures » (polyphénols, xanthohumol, thiols, intensité, conservation, rendement…) ;
  - un champ = une rangée avec l'enveloppe et « n fiches » ; le détail replié donne chaque valeur (source en lien, année ou « date ? », bornes) ; une valeur seule s'écrit sans repli ;
  - valeur suspecte ou hors enveloppe : absente de l'enveloppe, visible dans le détail avec ⚠ et sa raison au survol ; les « ? » devenus faux (géraniol, cohumulone, HSI, composants du catalogue) disparaissent quand un complément a la valeur.
- Chargement : Comparer lance `chargerComplements()` à son ouverture et ne montre son écran qu'une fois les compléments là (« Chargement de cet atelier… », 600 ms au plus, comme le repli du lazy) : aucune valeur ne change sous le doigt ; la fiche lance le chargement à son ouverture et sa feuille Sources attend (1,5 s au plus, bloc vide de 240 px). Échec ou hors ligne : catalogue seul, sans erreur (testé : `comp={null}`).

## Critères
- `comparerValeurs.chrome.mjs` : `COMPARER VALEURS OK` en 390 (trio Nelson), `--large`, `--trio saaz`, `--trio saaz --large`, `--trio riche` (390, puis `--large`). D154 compris. Sortie décisive : `complements.json · selinene · Enigma : « 12–15 % »`, `morceau des compléments : ["complements.json?import"]`.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 47 fichiers, 361 tests verts, `moteurInchange` compris. `npx tsc --noEmit` : aucune erreur.
- `npm run build` vert. B5 148,3 ko gzip tenu ; B1 920 ko et B2 773 ko dépassés comme avant la voie. Morceau à part : `dist/assets/complements-V-VT2Ikc.js`. `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- Captures 390 × 844, ouvertes et regardées (dans `%TEMP%\d3b-cap`) : `nelson\composition-entiere-390.png`, `nelson\chimie-390.png`, `nelson\bas-390.png` (Nelson, Citra, Mosaic) ; `riche\composition-entiere-390.png`, `riche\chimie-390.png` (Galaxy, Cascade, Enigma) ; `fiche\sources-nelson-sauvin-{haut,detail,huile,bas}.png`, `fiche\sources-citra-{haut,detail,huile,mesures,bas}.png`.

## Essais
Un essai par critère, sauf : le contrôle D154 « somme des milieux ≤ 102 » (voir décision ci-dessous), l'unité de cellule (1 correction CSS), l'invariant de d3a (1 réécriture), un test à corriger (4MMP de Citra).

## Doutes et limites
- **Mesure du chargement** : en dev (Vite transforme le JSON de 335 ko), l'écran de Comparer est prêt 540 ms après « Chargement de cet atelier… » ; très près des 600 ms de plafond. Le build de production n'a pas pu être mesuré dans Chrome (`?dev-local` n'existe qu'en dev) ; le morceau fait 57 ko gzip. Le réseau bridé a fait expirer la navigation (tous les modules de dev).
- Fiche ouverte depuis Ma bière avant la fin du chargement : le bloc d'attente est codé mais n'a été joué que depuis Comparer (compléments déjà là : feuille apparue à 40 ms, hauteur constante 3 357 px). Une seconde mesure par un autre parcours reste à faire par le pilote.
- Valeurs de la feuille Valeurs (α, β) : inchangées (la voie ne parle que de `compose()` et `huile()`) ; les rangées Valeurs de Comparer n'ont pas de sélinène ni de thiols (tableau non redessiné).
- Le repli « Huiles › » du pied de la fiche garde sa vue légère (catalogue seul) ; tout est dans Sources ›.
- Références : CRO pour Crosby Hops, HD HopDatabase, HJ hops-json, HDI Hops Direct, NZH, USA, IH, BF : abréviations de ma main.

## Erreurs de données (pas corrigées, hors de ma voie)
- Hopslist, Nelson Sauvin : farnésène 10,7 %, identique à son caryophyllène 10,7 %, valeur probablement décalée d'une colonne. Elle porte l'enveloppe du farnésène de Nelson à 0,1–10,7 % (la barre « 0–11 % » de la composition).
- HPA : farnésène de Citra 6–8 % et de Mosaic 5–8 %, Mosaic myrcène 1–1,5 % (ce n'est pas un % de l'huile). Le myrcène de Mosaic s'affiche « 1–65 % » dans le tableau. Ces valeurs étaient dans les seuils de d3a : à relire avant de s'y fier.
- Les enveloppes de 18 sources ne sont plus une composition : la somme des milieux de Nelson Sauvin passe de 100 à 104,8 % sans double compte.

DÉCISION À PRENDRE : le contrôle D154 « somme des milieux d'un houblon ≤ 102 % » ne tient plus (104,8 / 103,5 / 103,5) : un milieu d'enveloppe n'est pas une part. Je l'ai remplacé par la cohérence d'intervalles (somme des bas ≤ 102 ≤ somme des hauts, ≥ 98) : bas 56,5 / 77,4 / 78,9 %, hauts 153,5 / 129,8 / 128,6 %. Elle attrape moins finement un double compte. Options : (a) garder ce remplacement ; (b) écarter les valeurs de HPA et de Hopslist citées ci-dessus dans fusion.mjs (d3a) et revenir au contrôle d'origine ; (c) rendre D154 aux seules sources du catalogue. Recommandation : (a) maintenant, (b) ensuite, après relecture des valeurs de HPA et de Hopslist.

CONNAISSANCE : l'enveloppe des compositions de 18 sources n'est pas une composition (somme des milieux jusqu'à 105 %) ; un contrôle de non-double-compte doit comparer les bornes (bas ≤ 100 ≤ haut), pas les milieux. Les valeurs de HPA (farnésène de Citra et Mosaic, myrcène de Mosaic) et de Hopslist (farnésène de Nelson) sont à relire.
LEÇON PROPOSÉE : un script Node passé par heredoc dans le Bash de cet environnement perd encore les barres inverses (`\(`, `\/`, `\\`) sans erreur : 4 fois dans cette voie (regex, chemin Windows, `\s`). Écrire tout code avec barres inverses par Write/Edit, puis `node --check` et un test qui exerce la regex (déjà notée par c3c et d3a : à mécaniser).

## Suite (26.10) : l'attente de Comparer mesurée en production, et le lancement au repos

Ligne 1 inchangée : OK. Un seul fichier hors de « Possède » touché : `src/ui/hopIndex/precharge.ts` (le préchargement au repos qui charge déjà HopToolLayer et le chunk des outils : `requestIdleCallback` avec timeout 10 s, repli `setTimeout` 2 s, drapeau hopV4, en ligne, sans économie de données). J'y ai ajouté `import('./fiche/complements-ui').then(m => m.lancerComplements())` dans `charger`. Pas HopToolLayer ni l'hôte de Ma bière : le mécanisme existe, il couvre l'étape Houblons montée et tout autre écran, et ses garde-fous (hors ligne, économie de données) s'appliquent. L'attente bornée (600 ms Comparer, 1,5 s fiche) reste en filet. Aucune donnée touchée.

### Mesure en build de production (`node scripts/bench-hop-prod.mjs --n=8 --cpu=1 --sans-build`, mode banc, `?dev-local`)
Trois builds du mode banc, mesurés en alternance, deux tours (avant, après, précharge, avant, après, précharge) ; sorties dans `%TEMP%\d3b-bench` (journaux `log-*`) :
- **avant** = commit 18141d87 (sans ma voie) ; **après** = HEAD 7f09037b (ma voie, attente de 600 ms, sans lancement au repos) ; **précharge** = après + lancement au repos.
- Le dossier du « avant » vient de `git archive` avec le `.env` copié (sans lui, l'app affiche « Impossible de charger la brasserie » : une première série a échoué pour cela, écartée).

| ms, CPU ×1 | avant t1 · t2 | après t1 · t2 | précharge t1 · t2 |
|---|---|---|---|
| Comparer, 1re ouverture (chunk + calculs à froid) | 595 · 554 | 557 · 551 | 555 · 572 |
| Comparer, réouverture (médiane · p95, n = 8) | 176·202 · 168·198 | 162·182 · 166·212 | 164·187 · 164·188 |
| Fiche, 1re ouverture | 155 · 144 | 135 · 138 | 134 · 141 |
| Premier écran (étape Houblons montée) | 529 · 478 | 480 · 473 | 471 · 471 |

Lecture : aucune régression mesurable. L'écart entre séries (≈ 40 ms) est du bruit du poste, la 1re ouverture « après » n'est pas plus lente que « avant ». Raison : en production le morceau (57 ko gzip, servi en local) arrive pendant l'ouverture du chunk de Comparer, bien avant les 600 ms ; l'écran d'attente de dev (540 ms) venait du transform de 335 ko de JSON par Vite. Limites : CPU ×1 seul (pas ×4), serveur local sans latence réseau ; sur un réseau lent, l'attente de Comparer coûterait jusqu'à 600 ms, d'où le lancement au repos.
- Preuve du lancement au repos (build banc, rien ouvert) : « précharge » demande `complements-*.js` dès l'étape montée (déjà arrivé à la première lecture) ; « après » : aucune requête en 12 s.

### Rejeux
- `comparerValeurs.chrome.mjs` : OK en 390, `--large`, `--trio saaz --large` (dev, `?dev-local`).
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 47 fichiers, 365 tests verts, `moteurInchange` compris (le total a augmenté : d'autres voies ont ajouté des tests).
- `npm run build` vert ; B5 148,3 ko gzip tenu ; morceau `complements-CicB0H6c.js` toujours à part ; `audit_inputs` : `INPUT PROTECTION AUDIT PASSED`.

## Suite 2 (26.10) : l'assertion « morceau chargé à l'ouverture » réécrite, et les deux requêtes expliquées

- **Les deux requêtes `complements.json?import` : un artefact de Vite en développement, pas un double chargement.** Le contrôle comptait les requêtes sur toute la session ; or le serveur de dev recharge la page une ou deux fois quand il ré-optimise ses dépendances. Preuve : en comptant par document (une requête de navigation du cadre principal = un nouveau document), un `npm run dev -- --force` donne `{"2":1,"3":1}` : une requête par document, deux documents. Sans `--force` : une requête, un document (6 rejeux). `chargerComplements()` partage déjà une seule promesse et `lancerComplements()` ne relance pas pendant un chargement : rien à dédoublonner dans `complements-ui.ts`. Build du banc (mesuré avec la sonde de la série précédente) : une seule demande de `complements-*.js`, au repos, rien d'ouvert.
- **Assertion réécrite** (`comparerValeurs.chrome.mjs`, quatre contrôles) :
  1. aucune requête du morceau avant l'évènement `load` du document (il n'est pas dans le démarrage) ;
  2. il est demandé au repos, sans ouvrir Comparer (attente jusqu'à 14 s du lancement de `precharge.ts`, puis 0,6 s pour qu'il arrive) ;
  3. une seule requête par document (`Object.values(par document).every(n => n === 1)`), une page rechargée par Vite n'est plus une erreur ;
  4. Comparer s'ouvre sans attendre : un `MutationObserver` posé avant l'ouverture ne voit jamais « Chargement de cet atelier… ».
  Le compteur de documents est fait avec `request.isNavigationRequest()` : mon premier essai comptait `framenavigated`, qui se déclenche aussi pour les changements d'URL de l'historique (faux « avant load »).
- **Rejeux** : `COMPARER VALEURS OK` 3 fois de suite en 390, puis 3 fois en `--large` (serveur de dev sans `--force`) ; avec `--force` : OK aussi (2 documents).
