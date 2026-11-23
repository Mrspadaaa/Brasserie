OK — banc complété : lecture lente, écarté, segment Matériel, titre proposé, doublon, paramètres ; corrigés 6/6

Lot L3-banc-fixture-ia-simulee, correction 1 (CRITIQUE-1), 17.11. Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Tout reste simulé et marqué « exemple » : titres « ZZ TEST — », liens `exemple.invalid`, prix d'exemple, aucune relève, aucun appel Gemini.

## Fichiers écrits

- `src/domain/carnets/fixture.ts` : écarté, 2e note, titre proposé, phrase de doublon, `fixtureCarnets({ articles })`.
- `src/domain/carnets/iaSimulee.ts` : `PAGES_BANC` par adresse, pages des articles de la fixture, `cleUrl`, `lireLienSimule` (délai),
  `DELAI_LECTURE_BANC = 1500`, `LIEN_COLLER_BANC`, `LIEN_ILLISIBLE_BANC`. Les domaines `.ch` déjà simulés restent (tests du lot B).
- `src/design/CarnetsPreview.tsx` : segment « À venir · Carnets · Réalisés » avec l'`UpgradeWorkspace` de l'app, `lireParametresBanc`,
  `departBanc`, `appelsBanc`, en-tête documenté.
- `tests/unit/carnetsBanc.test.ts` (neuf, 24 tests).
- Ici : `captures.mjs` (puppeteer-core, Chrome local), `cap/*.png` (22 captures), `cap/journal.txt`.

`src/main.tsx` n'a pas besoin d'être modifié : son commentaire renvoie déjà au banc, et les paramètres sont documentés dans l'en-tête de `CarnetsPreview.tsx`.

## Problème → fait → preuve

- **P4** (lecture instantanée ; carte complète impossible) :
  - Fait : `lireLienSimule` attend 1,5 s par défaut, 4 s en `&ia=lent`, 0 avec `delaiMs: 0`. Le ✕ l'interrompt. La page du banc passe
    `appelsBanc`, qui prend le rangement simulé de l'app et la lecture lente. `BancCarnets` garde ses appels par défaut, donc les tests
    d'intégration ne ralentissent pas.
  - Table : `hotte-140` donne la carte g5:v06-10 dans Ventilation (débit 2000 m³/h, tient 80 °C : oui, 1 980 CHF, en stock). Puis
    `pompe-inox` et `pompe-magnetique`, `evier-riviera`, la puce `plaque-froid/echangeur-30`, et chaque lien des articles de la fixture
    (la page rend ce que l'article porte). Seul `exemple.invalid/v5` reste illisible. Une adresse inconnue reste « illisible » : rien
    n'est inventé. Aucune page ne pose de veille (R31).
  - Preuve : tests P4 (1 499 ms : pas lue ; 1 500 ms : lue ; 4 s en lent ; abandon au ✕ ; couverture ; v5 seul illisible ; aucune
    `veille`). Captures : `p4-lecture-squelette-390.png` (cadre « Arrive ici, dans Articles », `exemple.invalid/hotte-140`, « ✻ lecture
    de la page… », squelette), `p4-carte-apres-390.png`, `p4-carte-apres-article-390.png`, `p4-lecture-liste-390-sombre.png`,
    `p4-illisible-390.png` (« 5 lus, 2 sans aperçu »).
- **P6** (aucun écarté ; 1 et 2 articles injouables) :
  - Fait : Ventilation reçoit la façon écartée « Ventilateur de plafond » (raison : « brasse la buée sans la sortir ») et son article
    `ZZ-V-A6` (180 CHF, tient 80 °C : non). `&articles=1|2` réduit Ventilation à Hotte 120 cm, puis Extracteur mural (deux façons, sans
    écarté).
  - Preuve : tests P6 (écarté dernier, `rang` nul, raison ; 1 article : `tableau` nul ; 2 articles : 2 lignes). Captures
    `p6-articles-1-390.png`, `p6-articles-2-390.png` (« 2 lus », le tableau rang 1), `p7-ventilation-390.png` (carte de la façon écartée
    avec sa raison).
- **P7** (segment absent ; carnet sans note) :
  - Fait : le banc rend le segment de StocksTab, même habit et mêmes comptes (`readSegments`). Sous À venir et Réalisés, il rend
    l'`UpgradeWorkspace` de l'app. Pour que celui-ci lise les plans d'exemple, le banc pose `dev-local` dans l'adresse : c'est le cache
    mémoire de `FirestoreRepo`, et `put` y revient avant toute file d'écriture. Il y range le plan à venir (Frigo) ; avec `&realise=1`,
    aussi le plan payé de l'Embouteillage (dépense et paiement d'exemple). Il y reflète aussi les carnets du magasin mémoire.
  - « Ouvrir le carnet » rouvre le carnet. La pastille « À venir · … » du carnet mène à À venir. Le segment Carnets reste monté : rien
    ne se perd en passant par À venir. Ventilation a maintenant 2 notes, donc 2 boutons « Note : … ».
  - Preuve : `p7-segment-carnets-390.png`, `p7-avenir-390.png` (« du carnet ZZ TEST — Frigo… · Ouvrir le carnet », À venir 1, Carnets 4,
    Réalisés 0), `p7-avenir-ouvrir-carnet-390.png`, `p7-realises-390.png` (Embouteillage, « Payé · facture du 16 nov. 2026 », Ouvrir le
    carnet), `p7-realises-ouvrir-carnet-390.png`, `p7-realises-390-sombre.png`, `p7-segment-carnets-1280.png`, `p7-avenir-1280.png`,
    `p6-comparer-ecarte-390.png` (Notes 2). Test : 2 notes, chacune liée à son message.
- **P8** (G29 jamais vu) :
  - Fait : le message `ZZ-MSG-V3` « surtout la buée de la cuve pendant l'ébullition, pas tant la salle » porte `titrePropose` « ZZ TEST —
    Évacuer la buée de la cuve », non appliqué. Il est aussi la source de la note N2.
  - Preuve : capture `p8-renommer-propose-390.png` (« ✻ proposé d'après « surtout la buée… » · avant : « ZZ TEST — Ventilation… » »,
    champ prérempli). Test : message, titre et préfixe.
- **P15** (« Garder à part » jamais joué) :
  - Fait : `PHRASE_DOUBLON` « attendre l'avis du ferblantier sur la hotte », à taper dans Ventilation. `doublonsDe` y trouve ZZ-V-N1
    (Jaccard 0,75), et l'IA simulée rend `doublonDe: 'ZZ-V-N1'`. Aucune autre paire de notes de la fixture ne fait doublon.
  - Preuve : tests P15.
  - Limite : la capture `p15-doublon-frappe-390.png` ne montre ni « Même chose… » ni « Garder à part ». `CarnetsVue.tsx` ne passe pas
    `doublon` à `CadreArrivee` (ligne 403 : `void garderAPart`). La donnée est prête, mais le câblage revient aux lots L1/L2. Après
    l'envoi, seul « ✻ doublon ? » (G33) paraît (`p15-doublon-apres-390.png`).
- **P17** (pas d'entrée directe) :
  - Fait : `lireParametresBanc`.
    - `&realise=1` : ouvre sur Réalisés.
    - `&lien-retient=a-venir` : ouvre le Frigo.
    - `&lien-retient=realise` : ouvre l'Embouteillage payé.
    - `&adr=1` : ouvre le Frigo, puis « Pourquoi › Choix d'avant · 1 ».
    - `&articles=1|2` : ouvre Ventilation réduite.

    L'en-tête documente aussi chaque lien et chaque phrase du banc.
  - Preuve : 8 cas de test. Captures `p17-lien-retient-a-venir-390.png` (pastille et « Dans À venir depuis le 16 nov. »),
    `p17-lien-voir-avenir-390.png`, `p17-lien-retient-realise-390.png`, `p17-adr-390.png` (« Choix d'avant » vu).

## Critères

- `npx tsc --noEmit` : 0 erreur, sur tout le projet.
- Tests : `npx vitest run tests/unit/carnets tests/integration/carnetsParcours.test.tsx tests/integration/carnetEnvoiIA.test.tsx
  tests/integration/carnetNoteBrute.test.tsx tests/unit/port-q` donne 402 tests verts et 1 rouge. Le rouge, hors de mon périmètre, est
  `carnetsComparer.test.ts:25` : il attend les 5 articles de l'ancienne Ventilation (voir la demande ci-dessous).
  `carnetsBanc.test.ts` : 24/24.
- Serveur : vite lancé sur 5377, capturé, puis arrêté (port libre vérifié). Le port 5291 tenait le serveur d'un autre worktree
  (`ports-nuit`). La première série de captures l'avait visé par erreur : elle a été effacée et refaite.
- Firebase : `port-carnet` n'a pas de `.env`. Le banc échouait donc au démarrage, sur `auth/invalid-api-key`, dès qu'il importait
  `firebase.ts`, avant comme après ce lot. Lancé avec une configuration fictive (`VITE_FIREBASE_PROJECT_ID=demo-banc-carnet`,
  `VITE_FIREBASE_API_KEY=banc-sans-cle`), il ne touche aucun projet réel.
- Essais : P4 en 1, P6 en 2 (champ `articleId`), captures en 3 (port pris, `.env` absent, défilement).

## DEMANDE au pilote (fichier non possédé)

`tests/unit/carnetsComparer.test.ts` ligne 25 (lot A) : l'attendu doit suivre la fixture, l'écarté venant à la fin (D-52) :
`['ZZ-V-A1', 'ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4', 'ZZ-V-A5', 'ZZ-V-A6']`. Le commentaire de la ligne 24 gagne « … puis l'écarté (A6) ».
`carnetsOperations.test.ts` échouait aussi après mon ajout de N2, mais un autre lot l'a depuis mis à jour : il passe.

## Constats hors de mon périmètre (à verser à BUGS.md)

1. **Bloquant pour comparer (lots A et C).** Une valeur lue sur une page est une chaîne, par exemple `'2000'` : c'est le type
   `PageLue.valeurs`, recopié tel quel par `depuisIA` dans `CarnetsVue.tsx`. Or `comparer.ts › ordonnable` ne range en plus ou moins que
   les nombres. Effet : la hotte 140 cm, la meilleure en débit (2000 m³/h) et moins chère que la 120, sort 3e et marquée « moins bien
   partout » (`p4-carte-apres-article-390.png`). Même chose pour tout lien réel. À corriger par `parseDecimal` dans `depuisIA` ou dans
   `ordonnable`.
2. Le Comparer en colonnes affiche une ligne « Écarté » vide alors que le tableau porte un écarté avec sa raison
   (`p6-comparer-ecarte-390.png`). Lot C, `Comparer.tsx`.
3. Le libellé est en double : « écarté : Ventilateur de plafond écartée : brasse la buée… ». `raisonEcarte` (lot A) préfixe le nom de la
   façon, et la vue ajoute « écarté : ».
4. G11 « Même chose que la note du … · Garder à part » n'est pas câblé dans `CarnetsVue.tsx` (L1/L2) ; la puce « Coller : … » non plus
   (aucun `coller` passé à `ChampCarnet`). `LIEN_COLLER_BANC` est prêt pour ce câblage.
5. La carte complète au retour (« ✻ lu sur la page : … · tient 80 °C : oui », `luSurPage` et `verdict` dans `CarnetOuvert`) n'est
   alimentée par personne : `CarnetsVue` ne les calcule pas. Les données de la page sont là (valeurs `tient 80 °C : oui`, débit).
6. « Dans À venir depuis le 16 nov. » n'a pas de « · Voir ». C'est la pastille « À venir · … » au-dessus qui y mène (L1/L2).

## Doutes et limites

- Dans le banc, l'`UpgradeWorkspace` écrit dans le cache mémoire (`dev-local`). Un geste qui passerait par un point d'API serveur
  échouerait sans compte : aucune écriture réelle n'est possible, mais ce geste n'est pas jouable au banc.
- Le segment Parc de l'app n'est pas rendu au banc, qui n'a pas de parc. À 1280, la liste d'À venir n'occupe que la moitié gauche, comme
  l'`UpgradeWorkspace` hors conteneur.
- Les domaines `.ch` des pages simulées du lot B (`pompe-inox.ch`…) restent pour ses tests. Ils ressemblent à des domaines réels ; mes
  pages neuves sont toutes sur `exemple.invalid`.

DÉCISION À PRENDRE : faut-il donner au banc un `.env` de démonstration (projet `demo-…`, aucune clé réelle), pour que `npm run dev` ouvre
`?preview=carnets` sans variables à la main ? Options : (a) `.env.development.local` fictif dans `port-carnet` ; (b) `firebase.ts` qui
n'appelle pas `getAuth` quand la configuration manque, en preview ; (c) rien, et la commande documentée. Recommandation : (c) tout de
suite (la commande est dans ce rapport), puis (b) au lot qui possède `firebase.ts`.

CONNAISSANCE : le banc `?preview=carnets` de `port-carnet` démarre seulement si des `VITE_FIREBASE_*` non vides sont présentes ; une
configuration fictive `demo-…` suffit, et rien ne part sans `startSync`.

LEÇON PROPOSÉE : un serveur de banc se lance sur un port vérifié libre (`netstat`) avec `--strictPort`, et son journal se lit avant de
capturer. Sinon, le script capture le serveur d'un autre worktree (5291 = `ports-nuit`, 17.11).
