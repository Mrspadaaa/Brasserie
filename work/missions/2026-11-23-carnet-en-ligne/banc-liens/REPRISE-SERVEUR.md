# REPRISE SERVEUR — lecture des liens (voie lecture-liens, 23.11, soir)

Copie `lecture-liens`, branche `claude/lecture-liens`. Précédent : f558a6e28. `tsc` des fonctions : vert. Pas mis en ligne. PAS « PRÊT SERVEUR » : `aiTask` n'est pas encore branché (voir « Reste »).

## Chiffres du banc (63 liens, IA réelle Flash-Lite + Hydrogen en escalade, réponses rejouées du cache `banc-liens/ia-reponses/`)
Mesure `mesures/ia-9.json`, rejouable gratuitement : `npx tsx scripts/banc-liens.ts --ia reel --confirm-paid-ai --budget 0.001 --lot 1 --secret <functions/.secret.local> --etiquette x`
(le cache sert les réponses déjà payées ; un texte nouveau demande un nouvel appel).

| | avant (f558a6e28, sans IA) | sans IA aujourd'hui | avec IA |
|---|---|---|---|
| prix affiché juste, 63 liens | 51/56 (91 %) | 52/56 (93 %) | **54/56 (96 %)** |
| prix, liens sans JSON-LD | 17/21 (81 %) | 17/21 | **19/21 (90,5 %)** |
| photo, 63 | 52/58 (90 %) | **56/59 (95 %)** | idem |
| photo, sans JSON-LD | — | 21/24 (88 %) | 21/24 (88 %) : plafond |
| caractéristiques, 63 | 19/48 (40 %) | 35/48 (73 %) | **44/48 (92 %)** |
| caractéristiques, sans JSON-LD | — | 10/16 | 13/16 (81 %) |
| HT dit | 8/9 | 9/9 | 9/9 |
| port CH juste | 13/23 | 15/23 | 15/23 |
| inventions | 4 | 0 | **0** |

Objectif non tenu : photo et caractéristiques sur les liens sans JSON-LD (88 % et 81 %). Cause : 5 pages bloquées au robot (403 ou
défi Cloudflare : 6, 14, 24, 25, brouwland) et 1 lien mort (9) sont dans ce sous-ensemble ; le défi n'est jamais contourné. Plafond
photo 21/24. Caractéristiques : restent 25 (bloquée), 26 (description dans un `<nav class="tab-navigation">`, retiré par le nettoyage ; un
essai de garder ces `<nav>` à texte long n'a pas pu être mesuré faute de budget IA, retiré du code), 39 (vérité 52 l / 13,5 kg, page 50 l).
Tableau par marche (mesuré sans IA, une marche à la fois) : HTML seul 19/48 → + données embarquées, « Nom : valeur » des descriptions, mesures du
nom du produit 35/48 → + IA 44/48.

## CHF dépensés (journal `ia-journal.jsonl`, méthode `banc-liens-ia`) : **0,2401 CHF** sur 0,25 permis. Reste 0,0099 : plus de nouvel appel sans accord.

## Fait (code)
- 4 inventions corrigées : port de l'offre retenue (33, 34 : 4,90) ; libellé « (ohne MwSt.) » avant le prix (36 : HT) ; 35 « dès 4 » juste ;
  29 : vérité révisée (photo de marque que le site donne comme photo du produit ; `photoRevisee` dans `verite-ajout.json`, **à valider par le pilote**).
  Vérité 35 : variante 50 g = 4,00 (bas de la fourchette affichée, champ `revise`).
- `lienIA.ts` : `iaUtile` (IA si prix absent ou douteux, ou moins de 4 mesures techniques), `completerParIA` (Flash-Lite, escalade Hydrogen seulement si le
  prix manque, est retiré par la garde ou contredit le prix publié ; une panne ne s'escalade pas ; ne remplace jamais un champ ; désaccord = étape
  `controle` douteuse), `markdownProduit` (le `form` n'est plus retiré), `caracteristiquesTechniques`.
- `lienPlateforme.ts` (nouveau) : données embarquées (`__NEXT_DATA__`, `__NUXT__`, `__INITIAL_STATE__`, `application/json`), « Nom : valeur » des
  descriptions, mesures du nom du produit, détection Shopify/WooCommerce (`plateformeDe`) et lecture de leur JSON (`lireJsonPlateforme`). Les 3 premières marches
  sont branchées dans `extraireProduit` (synchrone). **La lecture réseau Shopify/Woo n'est pas appelée** (voir Reste).
- `lienProduit.ts` : photos de la galerie HTML en repli, en-têtes de tableau écartés, même nom à valeur différente gardé, puces de description sans deux-points.
- `lireLien.ts` : étape `page` dite dès la page reçue, `onDebut('ia')`, option `ia`.
- `scripts/banc-liens.ts` : `--ia seche|reel`, `--budget`, `--lot`, `--secret`, cache des réponses, journal, taux « sans JSON-LD » pour caractéristiques et photo.
  Outils : `banc-liens/texte-ia.ts` (le texte envoyé contient-il la valeur attendue ?), `banc-liens/diag-caract.ts`.

## Reste (prochain geste d'abord)
1. **Brancher dans `functions/src/ai.ts` (tâche `lireLien`)** : `appel` = `callGemini(GEMINI_LITE_MODEL | INVOICE_STRONG_MODEL, apiKey, consigne, texte, LIEN_IA_SCHEMA,
   { temperature: 0, thinkingLevel: 'minimal' | 'low' }, undefined, false, 1500, signal, liteUnusable)` (budget réservé par `runWithMonthlyAiBudget`) ; clé lue dans la
   branche (`GEMINI_API_KEY.value()`), absente = pas d'IA ; passer `ia`, `onEtape`, `onDebut` à `lireLien`.
2. **Étapes au fil de l'eau** (IA-ETAPES-VISIBLES) : si `request.acceptsStreaming && response`, `response.sendChunk({ etape: 'lecture', jeton, etapes: [...cumul] })` à chaque `onEtape`
   (le client ignore déjà tout ce qui n'est pas `etape: 'provisoire'`). Persistance pour l'app fermée : document Firestore `lecturesLiens/{jeton}`
   (champs `uid`, `url`, `statut` `en-cours|fini|echec`, **`etapes`**, `page`, `majLe`) écrit par l'admin SDK, relu par `aiTask` `{ task: 'lireLien', context: { jeton, reprise: true } }` ;
   aucune règle Firestore à changer (lecture par la fonction). Champ des étapes pour l'agent app : **`etapes`** (liste de `{ nom, statut: trouve|absent|douteux, detail }`),
   noms : page, donnees, prix, devise-frais, photos, caract, controle, ia ; `enCours: 'ia'` dans le chunk avant la réponse de l'IA.
3. Marche réseau plateforme : appeler `plateformeDe` + `lireJsonPlateforme` dans `lireLien` (robots de l'adresse `.js`/`wp-json` vérifié, même agent) ; capturer 2 ou 3 réponses
   réelles (Shopify liens 1, 2, 10, 11, 40, 61, 63 ; Woo 35, 38, 39) dans `banc-liens/plateforme/` pour les mesurer au banc. Aucun lien du banc n'en dépend aujourd'hui.
4. **DÉCISION À PRENDRE** (pilote) : PDF de fiche technique (pdfjs-dist est à la racine, absent de `functions/package.json`, hors de mon périmètre) et onglets rendus par
   Chrome sans écran (Puppeteer dans la fonction : mémoire, temps, nouvelle dépendance). Sur le banc, après les marches ci-dessus il reste 4 liens à caractéristiques en échec :
   25 (bloqué, rien à lire), 26 (nettoyage à corriger, voir plus haut), 39 (vérité), 46 (le prix au kilo est écrit, pas la quantité) : ni PDF ni Chrome n'y changent rien.
   Recommandation : ne pas les faire maintenant.
5. Tests Vitest : `tests/unit/carnetsLireLien.test.ts` 4 rouges sur 51, cause : le champ `etapes` ajouté aux pages lues (3) et un cas AggregateOffer (1) ; à mettre à jour
   (attendus avec `etapes`), puis écrire des tests de `lienPlateforme.ts` et de `completerParIA` avec un `AppelIA` simulé (jamais de vrai appel dans `npm test`).
6. Budget IA : refaire un nettoyage `<nav>` (26) et mesurer demande ~0,03 CHF : à autoriser (reste 0,0099).
7. Le journal `ia-journal.jsonl` de cette copie a 46 lignes de plus que celui du dépôt Brasserie : à fusionner (fichier en ajout seul).
