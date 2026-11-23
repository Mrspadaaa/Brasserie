OK — url_context de Flash-Lite recommandé ; prix 57/57 et 0 invention sur les 63 liens

Voie 23.11, copie `lecture-liens`, branche `claude/lecture-liens`. Pas de déploiement, aucun compte neuf, aucun contournement de défi.

## Fichiers écrits
- `functions/src/lienNavigateur.ts` (nouveau) : `lireAvecNavigateur(url, delaiMs, opts)` rend `{ ok, html, urlFinale, statut, ms }` ou `{ ok: false, echec: bloquee | introuvable | delai | indisponible, detail, ms }`, ne lève jamais ; aussi `nomDeAdresse`, `estDefi`, `domaineRacine`, `lanceurSparticuz`, `CONSIGNE_CAPTURE` (voie 3). `tsc` des fonctions : vert.
- `tests/unit/lienNavigateur.test.ts` : 13 tests, navigateur simulé, aucun réseau, aucun Gemini : **13/13 verts**.
- `banc-liens/bloquees/` : `gemini-bloquees.mjs` (voie 1), `navigateur-bloquees.ts` (voie 2), `bilan.ts` (les 63), `reponses/` (réponses Gemini brutes), `chrome/` (3 pages rendues), `mesure-*.json`, `bilan.json`, `depense.json`, `ia-reponses/` (1 réponse de cache).
- `ia-journal.jsonl` : 16 lignes ajoutées (15 `banc-liens-bloquees`, 1 `banc-liens-ia`). Fichier en ajout seul, déjà modifié dans cette copie avant moi : à fusionner (REPRISE-SERVEUR, point 7).

## Les 6 pages (5 bloquées + 1 lien mort), page par page
Vérité : 6 = 159,99 EUR (relevé sur la fiche rendue par le Chrome du poste ; le banc le notait « non relevé ») ; 24 = 429 CHF ; 25 = 31,95 CHF ; 7 et 14 = aucune fiche derrière (catégorie) ; 9 = lien mort.

| n | site | fetch du serveur | voie 1 url_context Flash-Lite | Hydrogen | google_search | voie 2 Chrome sans écran |
|---|---|---|---|---|---|---|
| 6 | brouwland (Cloudflare) | bloquée | **LUE** : nom juste, 159,99 EUR (ttc), 8 caract., photo non rendue ; 1,95 s ; 0,0042 CHF | non lancé | non lancé | bloquée (« Un instant… », 403) ; 4,7 s |
| 7 | brouwland FR | bloquée | « introuvable » (la page renvoie à la catégorie : juste) ; 2,3 s ; 0,0120 CHF | non lancé | non lancé | bloquée ; 8,3 s |
| 9 | brewtools (lien mort) | introuvable | « illisible » (outil en erreur) ; 2,6 s ; 0,0010 CHF | illisible ; 8,7 s ; 0,0073 | non lancé | page de recherche lue ; le test du lien mort (`lienMort`) la dit introuvable ; 8,9 s |
| 14 | braumarkt (Cloudflare) | bloquée | illisible (outil en erreur) ; 1,5 s ; 0,0008 | illisible ; 6,4 s ; 0,0069 | « introuvable » ; 0,0003 | bloquée (403) ; 4,7 s |
| 24 | jumbo (403) | bloquée | **LUE** : nom juste, 429 CHF, 2 caract., photo non rendue ; 1,7 s ; 0,0026 | non lancé | non lancé | renvoyé vers `login.supercard.ch` (403) ; 5,8 s. Le module l'appelait `introuvable` : corrigé en `bloquee` (test) |
| 25 | bauhaus (défi) | bloquée | illisible (outil en erreur) ; 1,5 s ; 0,0009 | illisible ; 8,6 s ; 0,0068 | **INVENTION** (voir plus bas) | **LUE** : nom, 31,95 CHF, photo (image vérifiée) ; 8,5 s ; page 466 Ko. Caract. : 0 par la page, 0 par l'IA sur son texte (1 appel Flash-Lite, 0,0014 CHF) |

Témoin : le lien 1 (gastro-held, lisible au fetch) passe aussi par Chrome : 9,8 s, 1,6 Mo, prix 1820,90 CHF HT juste, 18 caract. : le navigateur ne dégrade rien.

Photo : url_context rend le texte de la page, pas son HTML : jamais d'adresse de photo (6 et 24 sans photo). Seul Chrome ramène la photo (25).

### google_search : ne fonctionne pas ici, et il invente
5 essais sur le lien 25 (Flash-Lite avec schéma, Flash-Lite `low`, sans schéma, Hydrogen, outil seul) : **0 requête de recherche exécutée**, aucun `groundingMetadata`. Le modèle répond de mémoire : prix 24,55, 29,95, 24,55, 29,95 (EUR), 29,95 contre 31,95 en vrai ; Hydrogen cite même une adresse `vertexaisearch…` fabriquée. La photo, elle, était juste (vue à l'entraînement). **Règle à coder si cette voie revient : une réponse « de recherche » ne vaut que si `groundingMetadata.webSearchQueries` est non vide et si la source citée en fait partie ; sinon rejetée.** Sans cette garde, 5 essais sur 5 donnaient une invention. Arrêté après 5 essais (2 corrections de méthode, puis plafond).

## Nouveaux % sur les 63 liens (pages bloquées et lien mort comprises)
Mesure `bilan.json` : la mesure `ia-9.json` rejouée, vérité du lien 6 corrigée, 6 lignes remplacées par les lectures réelles ci-dessus.

| | avant (ia-9) | après |
|---|---|---|
| prix affiché juste | 54/57 (95 %) | **57/57 (100 %)** |
| prix, sans JSON-LD | 19/22 (86 %) | **22/22 (100 %)** |
| photo | 56/59 (95 %) | 57/59 (97 %) |
| photo, sans JSON-LD | 21/24 (88 %) | 22/24 (92 %) |
| caractéristiques | 44/48 (92 %) | 44/48 (92 %) |
| caract., sans JSON-LD | 13/16 (81 %) | 13/16 (81 %) |
| nom | 56/63 (89 %) | **61/63 (97 %)** |
| HT dit | 9/9 | 9/9 |
| inventions | 0 | **0** |
| liens sans aucun manque ni faux (nom, prix, photo, caract., HT) | 53/63 (84 %) | **55/63 (87 %)** |

Honnêtetés : le nom des pages 7 et 14 vient de l'adresse (`nomDeAdresse`, « easybrew cuve de fermentation 30 l en inox tc »), à marquer « tiré de l'adresse » dans l'écran ; elles restent `bloquee`, sans prix ni photo. Le lien mort (9) reste « introuvable », compté juste (rien inventé). Les 2 manques de photo viennent de 6 et 24 (url_context ne rend pas de photo). Les caractéristiques ne bougent pas : 25 (aucune mesure lisible hors tableau) reste en échec, comme 26, 39, 46 (REPRISE-SERVEUR).

## CHF dépensés : **0,0593 CHF** sur 0,10 (16 appels, `depense.json`, `ia-journal.jsonl`)
Tarif conservateur du dépôt (1,25 CHF/USD ; 0,0175 CHF par requête de recherche, aucune n'a été exécutée). Flash-Lite url_context, 6 pages : 0,0215 ; Hydrogen, 3 pages : 0,0210 (aucun gain) ; recherche, 6 appels : 0,0155 ; lecture IA du texte de 25 : 0,0014. La page 7 a coûté 0,012 (30 000 jetons : la catégorie lue en entier) : une page de catégorie coûte 10 fois une fiche.

## Chrome sans écran : mesures et estimation Cloud
- Paquet : `@sparticuz/chromium` 153.0.0 = **67 Mo** de Chromium compressé (70 Mo décompactés dans `node_modules`) + `puppeteer-core` 7,8 Mo (25.10.0 ; déjà dans le dépôt racine, absent de `functions/package.json`). Node 22.17 ou plus exigé : `functions` est en `node: 22`, à vérifier au déploiement.
- Local (mesuré, Chrome du poste, arguments de `@sparticuz`, profil neuf, sans écran) : lancement 0,18 à 0,48 s ; page 4,7 à 9,8 s ; mémoire de travail de tout l'arbre Chrome **297 à 694 Mo** (pic 694 Mo sur la page de 1,6 Mo).
- Le binaire Linux de `@sparticuz` ne tourne pas sur ce poste Windows (pas de WSL, pas de Docker) : la mémoire et le froid de Cloud ne sont **pas mesurés**. Estimé : décompression brotli dans `/tmp` au premier appel de chaque instance, +2 à 4 s à froid ; `/tmp` est en mémoire sur Cloud Functions (+ ~200 Mo, estimé) ; Chrome ~400 à 700 Mo ; Node et `aiTask` ~150 Mo : **1 Gio au minimum, 2 Gio à prévoir**. `aiTask` est aujourd'hui à 512 MiB, 300 s.
- Les pages bloquées se lisent-elles ? 1 sur 5 depuis l'IP du poste (25). Brouwland (6, 7) et braumarkt (14) répondent « Un instant… » à Chrome sans écran, comme au fetch : le défi n'est pas franchi, jamais. Depuis une adresse de centre de données, le résultat sera au mieux le même : la mesure du poste est un plafond.

## Voie 3 : la capture d'écran envoyée par le brasseur (écrit, non branché)
Seulement la consigne `CONSIGNE_CAPTURE` (dans `lienNavigateur.ts`). `LIEN_IA_SCHEMA` sert tel quel. À brancher : une action « Joindre une capture » sur la ligne en `bloquee`, l'image part en `file` du corps Gemini (`geminiBody` l'accepte, comme les factures), Flash-Lite puis Hydrogen, réservation conservatrice de 1 Mio de jetons par image (`quoteGeminiCost`). Pas de garde par le texte (il n'y en a pas) : tout champ lu est marqué « lu sur une capture », et le prix attend la confirmation du brasseur. Non mesuré (hors du budget et du contrat de test).

## Recommandation d'intégration
1. **Voie : url_context de Flash-Lite**, une seule marche de plus, à la place de l'échec final : dans `lireLien`, au point `echec('bloquee', url)` (403, 401, 429, défi), jamais pour `robots` (le brasseur a voulu respecter robots.txt) ni pour `introuvable`. Un seul appel `generateContent` HTTPS avec l'outil `url_context` : **aucune mémoire de plus, `aiTask` reste à 512 MiB**. Garde obligatoire, vue au banc : l'état `URL_RETRIEVAL_STATUS_SUCCESS` pour l'adresse demandée et `type === 'fiche'` ; sinon `bloquee` comme aujourd'hui. Pas d'Hydrogen (0 gain sur 3 pages, 5 fois le prix). Pas de `google_search`. Coût moyen 0,0036 CHF par page bloquée (maximum observé 0,012 sur une catégorie : plafonner la sortie et refuser la réponse si `type !== 'fiche'`).
2. **Chrome sans écran : ne pas l'intégrer maintenant.** Il ne lit que 1 page de plus (25) sur 63 (1,6 %), pour 67 Mo de paquet, 1 à 2 Gio, un froid de plusieurs secondes et un résultat incertain depuis une IP de centre de données. Si le brasseur le veut quand même : une fonction à part (`lireNavigateur`, 2 GiB, 120 s) appelée par `aiTask` en dernière marche, jamais `aiTask` à 2 GiB. Le module est prêt et testé ; `puppeteer-core` et `@sparticuz/chromium` sont à ajouter à `functions/package.json` par le pilote.
3. Statut final d'une page qu'aucune voie ne lit : `bloquee`, avec `nomDeAdresse` marqué comme tel. Le lien mort reste « introuvable ».
4. Voie 3 (capture) : à proposer au brasseur sur la ligne `bloquee` de l'écran, pour 14 et 25 (url_context a échoué).

## Essais, doutes
- Essais : voie 1 : lite en 1 passe, Hydrogen 3 pages, recherche 5 essais (arrêt). Voie 2 : 1 passe sur 7 pages + 1 essai de diagnostic (jumbo), module corrigé une fois (renvoi hors du site). Tests : 13/13 au premier passage.
- url_context est non déterministe sur une page qui échoue (25, 14, 9 : erreur de lecture du côté de Google) : 1 essai par page ici, pas de répétition. Un second appel pourrait en lire une de plus.
- La lecture d'url_context passe par Google : l'adresse du produit part chez Google (déjà vrai de tout appel Gemini sur le texte).
- Le bilan ne couvre pas Chrome sur les 63 pages avec un Chrome serveur : seul le Chrome du poste a lu les 63 (mesure précédente).
- 0 inventions mesurées sur les 6 pages avec les gardes ; l'invention de `google_search` a été attrapée par la garde « aucune requête exécutée ».

DÉCISION À PRENDRE : brancher Chrome sans écran (fonction à part à 2 GiB) pour 1 page sur 63 ? Options : non / oui en fonction séparée. Recommandation : non ; url_context suffit pour 2 des 3 fiches lisibles, et la capture du brasseur (voie 3) couvre le reste.

CONNAISSANCE : `url_context` lit des pages que le fetch du serveur ne passe pas (brouwland sous Cloudflare, jumbo en 403), mais pas toutes (bauhaus, braumarkt en erreur) ; il ne rend ni photo ni HTML. `google_search` avec Flash-Lite ou Hydrogen n'exécute pas de recherche sans demande explicite de l'outil et répond de mémoire, avec de faux prix : toute réponse sans `groundingMetadata` est une invention.
LEÇON PROPOSÉE : une réponse d'IA « outillée » se juge à la trace de l'outil (requêtes exécutées, sources citées), pas à sa vraisemblance : 5 prix faux sur 5 étaient plausibles et la photo, juste, donnait confiance.
