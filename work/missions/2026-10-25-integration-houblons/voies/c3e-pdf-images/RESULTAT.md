OK — NZ Hops : 20 fiches PDF transcrites et relues ; IHPS : 23 sortes slovènes ; scripts --offline stables, tests, build verts

## Fichiers écrits
- `scripts/collecte-hop/nzhops.mjs` (étendu : fiches `page: "fiche-pdf"`), `scripts/collecte-hop/ihps.mjs` (neuf).
- `src/data/hopSources/nzhops.json` (20 fiches HTML identiques à HEAD + 20 fiches-pdf = 40 ; 114 Ko), `src/data/hopSources/ihps.json` (23 fiches ; 55 Ko).
- `tests/unit/hopIndexV4/collecteNzhops.test.ts` (10 tests), `tests/unit/hopIndexV4/collecteIhps.test.ts` (3 tests).
- Dans la voie : `transcriptions-nzhops.json`, `transcriptions-ihps.json` (versionnés, lus par les scripts), `telecharger-nz.mjs`, `telecharger-ihps.mjs` (téléchargement poli par le cache).
- Cache, en ajout seulement : 21 PDF NZ Hops (base64, reçu `encoding: base64`, ~100 Mo), le PDF gov.si, `robots.txt` de cdn.shopify.com et de www.gov.si.
- `fusion.mjs` et `complements.json` non touchés. `scripts/hop-source-cache.mjs` non touché.

## Hôtes
- cdn.shopify.com : robots.txt 200 (deux scripts interdits seulement) ; PDF 200. www.gov.si : robots.txt 200 (`/admin`, `/resources`, `/pomoc` interdits) ; PDF 200. 1 requête par seconde par hôte. Aucun 401, 403, 429, ni défi. nzhops.co.nz : relu depuis le cache.
- NZ Hops : 21 PDF anglais (les fiches françaises, mêmes chiffres, non téléchargées). Nectaron : deux URL, même PDF (sha256 égal) : une fiche.

## Lecture
- `pdftoppm` absent : l'outil Read ne lit pas les PDF. Lecture par le visionneur PDF de Chrome (puppeteer-core), captures ouvertes en image.
- NZ Hops, première lecture à 110 % puis seconde lecture : 15 anciennes fiches (zone Tech Specs à 200 %, quatre par planche) et 5 fiches Mean/Range (rendu à 150 %) : aucune correction. Chaque valeur porte `transcrit: "lecture visuelle"` et sa page (1 ou 2).
- Radar « Hop Aroma Profile » : graphique sans valeurs imprimées, non chiffré, non transcrit.
- IHPS : texte sélectionnable, mais tableaux 7.1 (p. 20-21) et 7.2 (p. 22) couchés, que pdftotext désordonne et prive des tirets. Lus en image (pages tournées). Seconde lecture : les 92 éléments (69 plages, 23 numéros de registre) retrouvés dans le texte extrait ; 23 lignes de résistance (lues une fois, non recoupables par le texte).

## Critères
- `node scripts/collecte-hop/nzhops.mjs --offline` ×2 : sha256 `2fd3c42d165b06932efa26876dce119e4572369cb2ceaa188ca4cc371a66d056` (40 fiches), identique.
- `node scripts/collecte-hop/ihps.mjs --offline` ×2 : sha256 `527738d56f4cb46543edcc642a816e035498ba10f037727a068c0915fd7c7a83` (23 fiches), identique.
- `npx vitest run tests/unit/hopIndexV4` : 50 fichiers verts sur 51 ; 409 tests verts sur 410. L'échec est `complements.test.ts` (« déterminisme du script de fusion ») : `complements.json` écrit est antérieur à ces deux sources. Attendu : le pilote régénère (`node scripts/collecte-hop/fusion.mjs`).
- `npm run build` : exit 0.
- `git diff --stat -- src/domain src/ui src/data/hopV4` : non vide, mais pas de moi. `src/domain/hopIndex/v4/substitution.ts` (+200 −130) vient d'une autre voie (e2-moteur-substitution). Aucun code de l'app n'importe `src/data/hopSources/*`.

## Ce que ces sources ajoutent (fusion rejouée sans écriture, sur une copie de fusion.mjs dans le dossier temporaire)
Les 20 fiches-pdf ajoutent 355 valeurs (α 41, β 41, huile 39, cohumulone 19, myrcène 40, caryophyllène 27, farnésène 32, linalol 37, humulène 34, polyphénols 10, géraniol 19, β-pinène 16) ; 251 variétés avant et après.
- Nelson Sauvin : géraniol 1-1.8 (absent avant) ; linalol 0.35-0.6 (enveloppe 0.2-0.7 inchangée) ; farnésène 0.1-0.5 (enveloppe 0.1-1 inchangée) ; myrcène 40-60 (enveloppe 21-45 devient 21-60). Pas de β-pinène ni de sélinène sur la fiche.
- Motueka : géraniol 0.8-1.3 (absent avant) ; linalol 0.7-1.0 (inchangé 0.5-1) ; farnésène 6-10 imprimé (enveloppe 10-15 devient 6-15) ; β-pinène 0.7-1.0 présent mais hors enveloppe.
- Riwaka : géraniol 1.5-2.5 (absent avant) ; linalol 0.6-1.2 (enveloppe 0-1.2 devient 0.4-1.2 : effet du tri de la fusion, à vérifier) ; farnésène 0.5-1 (inchangé) ; β-pinène 0.5-1 hors enveloppe.
- Le géraniol passe d'absent à chiffré pour ces trois houblons ; le β-pinène devient chiffré pour 16 valeurs de la voie (c3c n'en avait qu'une).

## Doutes et limites
- Valeurs recopiées telles qu'imprimées, y compris des incohérences : Dr. Rudi linalol « 5.5-8.0 % » (très haut, relu deux fois) ; Taiheke farnésène « 5.8 % » (valeur seule, peut-être 5-8 : non déduit) ; Motueka farnésène 8.0 et humulène 3.5 ; Nectaron linalol moyenne 0.8 hors de la plage 0.4-0.7 ; Nelson Sauvin produits d'oxydation moyenne 3.8 hors de la plage 2.5-3.2 (signalé `incoherence`). La fiche NZ Fuggle porte l'accroche « Mojito » lime, celle de Motueka.
- Fiches Mean/Range : l'huile est imprimée en « % » sous « Trait % » (mL/100 g probable, la fiche Nelson dit « mls/100g ») : `uniteNote`. Fiches anciennes : mL/100g, composés en % de l'huile sans base imprimée (`baseImplicite`).
- IHPS : l'α et l'huile sont en % de la matière sèche (ou à 11 % d'humidité), et l'huile n'est pas en mL/100 g : ne pas mélanger avec les autres sources sans conversion. Résistances (mildiou, oïdium, verticilliose, pourriture grise, CBCVd) gardées en mots slovènes (nizka, srednja, visoka) dans `extra.resistances`.
- Rattachements : NZ Chinook → Chinook (même décision que c3c) ; Superdelic absent du catalogue (null). IHPS : 14 sur 23 rattachées ; Savinjski golding (Styrian Golding), Styrian gold, Hallertauer Taurus, Cerera, Cicero, Buket, Blisk, Ahil, Styrian Eureka restent `null` (noms non résolus sans ambiguïté, rien forcé). Hallertauer Magnum → `beermaverick-magnum-gr` : à confirmer.
- IHPS : le tableau 7.2 écrit « Stryrian Kolibri » (faute de la source), rattaché à « Styrian Kolibri » ; Savinjski golding : début de maturité imprimé « 10. 9. - 20. 8. » (ordre inversé, recopié).
- Le texte `lu` de la source nzhops dans `fusion.mjs` dit encore « Fiches PDF en image, non lues » ; et `ihps` n'est pas dans la liste des sources de `fusion.mjs` : à ajouter par le pilote si les valeurs IHPS doivent entrer dans `complements.json` (base matière sèche, unité différente).
- Cache : ~100 Mo ajoutés (PDF en base64) ; `hop-source-cache.mjs` ne lit que du texte, le chemin binaire reste celui de `c3c-commun.mjs`.

DÉCISION À PRENDRE : faut-il lire aussi les fiches PDF françaises de NZ Hops (mêmes chiffres, traduction des accroches) ? Recommandation : non.
CONNAISSANCE : les fiches variété de NZ Hops (20 houblons) publient β-pinène, myrcène, linalol, caryophyllène, farnésène, humulène et géraniol, et les fiches récentes (Motueka, Nectaron, Nelson Sauvin, Superdelic, NZ Chinook) ajoutent moyenne, plage, produits floraux-estérifiés et agrumes-résineux, cohumulone ; l'outil Read de ce poste ne lit pas les PDF faute de `pdftoppm`, mais le visionneur PDF de Chrome (puppeteer-core, `#page=N&zoom=N`, Ctrl+] pour tourner) les rend, avec un rendu parfois vide qu'il faut reprendre jusqu'à une taille de capture normale.
LEÇON PROPOSÉE : un rendu de visionneur PDF dans Chrome headless est parfois une capture vide (3 Ko) sans erreur : contrôler la taille du PNG et reprendre avant de le lire.
