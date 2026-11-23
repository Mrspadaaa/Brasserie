OK — aiTask lit les liens en cascade (plateforme, schema.org, HTML, IA) ; étapes en flux et dans Firestore ; 4 tests rouges corrigés

Copie `lecture-liens`, branche `claude/lecture-liens`, à partir de 820f7d708. Aucun déploiement, aucune nouvelle fonction Firebase, aucun appel Gemini réel.

## Fichiers écrits
- `functions/src/lecturesLiens.ts` (nouveau) : la tâche `lireLien` avec ses étapes (flux, document, reprise, jeton).
- `functions/src/ai.ts` : branche `lireLien` : `appelIA` lié à `callGemini` (Flash-Lite `minimal`, Hydrogen `low`, sortie 1 500 jetons, 45 s par appel, temps restant de la tâche), clé absente = pas d'IA.
- `functions/src/lireLien.ts` : marche plateforme réseau (Shopify `.js`, WooCommerce Store API), robots jugé par adresse, signal neuf pour le cours du jour (l'IA pouvait épuiser les 12 s de la page), page « titre seul » = illisible.
- `functions/src/lienProduit.ts` : AggregateOffer à plafond supérieur au plancher = « dès » (le code l'excluait, le test le voulait).
- `tests/unit/carnetsLireLien.test.ts` (4 rouges corrigés), `tests/unit/carnetsLecturesLiens.test.ts` (nouveau, 13 tests).

## La voie des étapes (item 2)
Les deux voies existantes de `aiTask` pour les tâches longues sont le flux `response.sendChunk` (facture, D308) et un document Firestore écrit par l'admin SDK (`invoiceScans/{id}`). J'ai pris les deux, chacune pour son rôle, sans nouvelle fonction ni règle Firestore :
1. **Flux** : `{ etape: 'lecture', jeton, etapes: [...cumul], enCours?: 'ia' }` à chaque étape, dont un premier envoi `etapes: []` qui donne le jeton. `enCours: 'ia'` part avant la réponse du modèle et disparaît quand l'étape `ia` arrive. Une étape redite (la plateforme corrige `caract` ou `photos`) remplace l'ancienne, même nom.
2. **Document `lecturesLiens/{jeton}`** (`uid`, `url`, `statut` en-cours|fini|echec, `etapes`, `enCours`, `page`, `erreur`, `creeLe`, `majLe`), réécrit à chaque étape, page entière à la fin. La requête reste ouverte côté serveur si l'app se ferme, donc la lecture finit et s'écrit. Réouverture : `{ task: 'lireLien', context: { jeton, reprise: true } }` rend `{ statut, jeton, etapes, enCours?, page?, erreur? }`, sans rien lancer ni facturer. Une lecture « en cours » sans écriture depuis 330 s devient `echec` (« Lecture interrompue. »).

**Contrat pour l'agent app** : le jeton vient de l'app, `context.jeton` (16 à 64 caractères `[A-Za-z0-9_-]`, un UUID convient), pour qu'elle le connaisse avant toute réponse ; sans jeton, le serveur en tire un et le dit dans le premier envoi. Même jeton rappelé : `fini` rend la page gardée (aucun coût), `en-cours` rend l'état (jamais deux lectures). Un jeton d'un autre compte n'est jamais repris. Réponse normale inchangée : `data` = la page lue, avec `etapes` (noms : page, donnees, prix, devise-frais, photos, caract, controle, ia). Le client ignore déjà ce qui n'est pas `etape: 'provisoire'`.

## Critères
- `tsc` des fonctions : `npx tsc -p functions --noEmit` → exit 0 ; `npm run build` dans `functions/` → exit 0 (le build réécrit `source4-portable-bundle-manifest-01.json` : remis à HEAD, hors commit).
- Tests : `npx vitest run carnetsLecturesLiens carnetsLireLien carnetsBancLiens aiTaskMonthlyBudget banc-enrichissement` → 5 fichiers, 107 tests verts ; `check-test-boundary` vert. Le flux : premier envoi avec le jeton, étapes cumulées dans l'ordre, `enCours: 'ia'` avant la réponse, document « en cours » avec étapes avant « fini », reprise à mi-lecture (app fermée simulée), reprise d'un autre compte, lecture plantée, jeton fini sans relecture, panne Firestore ou flux sans effet sur la lecture. La marche plateforme et l'IA simulée (Flash-Lite, escalade Hydrogen sur prix inventé, panne de budget sans escalade, clé absente) y sont aussi.
- Banc rejoué hors IA, sans réseau (`npx tsx scripts/banc-liens.ts`) : prix 52/56 (93 %), prix sans JSON-LD 17/21, photo 56/59 (95 %), caractéristiques 35/48 (73 %), HT 9/9, port CH 15/23, **0 invention**, identique à « sans IA aujourd'hui » de REPRISE-SERVEUR (avant mes changements). Aucune ligne ne bouge avec la marche plateforme (le rejeu répond 404 aux adresses non enregistrées), l'AggregateOffer et la page « titre seul ». Les chiffres avec IA (96 %, 90,5 %, 92 %) viennent du cache de réponses déjà payées : non rejoués (aucun appel permis).

## Essais
Un essai par critère, sauf les tests : 3 tours sur ma propre suite (fiche Shopify trop pauvre dans mon cas de test).

## Doutes et limites
- La lecture de l'IA réelle dans `aiTask` n'est testée qu'au type (`tsc`) : `callGemini` n'est pas exporté et passe par `runWithMonthlyAiBudget` (coût réservé avant envoi, pas de test sans réseau/Firestore). Le brancher est une affaire de 12 lignes ; la preuve réelle est une lecture « ZZ TEST » en ligne après déploiement (accord attendu).
- La marche plateforme n'est testée que sur une fiche inventée ; aucune réponse réelle Shopify/Woo n'est capturée (REPRISE-SERVEUR, item 3) : elle ne s'appelle que si la page laisse moins de 4 mesures ou pas de photo.
- Document `lecturesLiens` : pas de TTL Firestore configuré ; à purger plus tard (un document par lecture, quelques ko).
- Le `ia-journal.jsonl` de cette copie a toujours 46 lignes de plus que Brasserie (item 7), non touché : hors de mon périmètre.

DÉCISION À PRENDRE : aucune bloquante. Règle posée par moi, réversible : une page dont le seul contenu est un titre (<h1>/<title>) sans données produit, sans prix, photo ni mesure est « illisible » (ex. « Bienvenue »). Mesuré : 0 ligne du banc change. Si le pilote préfère la montrer comme « lue » avec ce titre, retirer 3 lignes dans `lirePage`.

CONNAISSANCE : aiTask a déjà deux voies pour les tâches longues : le flux (`sendChunk`) pour l'écran ouvert, un document admin SDK (`invoiceScans`, `lecturesLiens`) pour retrouver le résultat app fermée ; aucune règle Firestore requise.
LEÇON PROPOSÉE : aucune
