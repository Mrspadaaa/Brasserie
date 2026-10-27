OK — l'IA range les rangées au même effet de Suggérer (callable mode suggérer, puce et phrase m6) ; essais simulé et réel faits, critères tenus

(GATES.md n'existe pas dans le dossier de la voie : critères pris dans VOIE.md.)

## Fichiers écrits
- Serveur : `functions/src/hopReclassCore.ts` (ajout : invite `suggerer-v1`, entrée, lecture, garde des valeurs chiffrées ; l'invite `v1` n'a pas bougé), `functions/src/hopReclasserIA.ts` (mode `suggerer`, même callable, mêmes gardes).
- Client : `src/ui/hopIndex/suggerer/ia.ts` (neuf : transport, demande, hook), `voies.ts` (ordre IA appliqué au groupe), `index.tsx` (puce, phrase, appel au repos), `reprise.css` ; `src/ui/hopIndex/parcours/adaptateur.ts` (`poolSuggerer` seulement : le pool d'un moment).
- Tests : `tests/unit/hopIndexV4/hopReclasserIA.test.ts` (58, dont 29 pour « suggérer »), `tests/unit/hopIndexV4/suggererIA.test.tsx` (16).
- Banc : `scripts/eval-hop/ia3-emulateur.ts`. Captures, rapports, journaux : `voies/ia3-ia-suggerer/img/` (dossier de la voie). Journal : section « ia3 » de `gemini-journal.md`.
- Rien touché hors « Possède » : `git status` ne montre, hors `src/domain/hopIndex/v4/` (a4), que mes fichiers.

## Décisions de conception
- **Où l'IA agit.** Sur le groupe « même effet sur tes objectifs » (le seul que le moteur ne départage pas) : à partir de 3 rangées au même effet, au plus 2 moments par écran (coût d'une ouverture ≤ 2 appels). Le moteur s'affiche d'abord, l'appel part au repos (pool d'un moment calculé après la peinture, hors du premier affichage), hors ligne rien ne part.
- **Pool : 30** (29 vus : une fiche manque, jamais inventée). 20 ne couvrait pas Mandarina 18e ni Pacific Jade 27e. Coût mesuré : 5 400 à 5 600 jetons d'entrée, 850 à 880 de sortie, **≈ 0,005 CHF l'appel** (le double de i2).
- **Phrases pour les 10 premiers seulement** (écart à VOIE.md : « une phrase par candidat »). Mesuré le 27.10 : 29 phrases = 1 150 à 1 260 jetons de sortie et **3,5 à 4,7 s** (4 appels), donc hors de la fenêtre de 3 s : l'ordre ne s'appliquait plus tout seul. À 10 phrases : **2,6 à 3,3 s** (7 appels), l'ordre s'applique seul à 2,6 s (neipa v3). Les rangées montrées sont 3 à 14 et le brasseur ne lit que les premières ; l'ordre, lui, couvre tous les candidats.
- **Jamais de valeur inventée** : le serveur retire la phrase qui cite un nombre absent du message **ou de la ligne de son propre candidat** (ou un identifiant cNN). L'ordre reste ; la rangée n'a alors pas de phrase. 0 phrase retirée sur 7 appels réels.
- **Rangées** : l'ordre IA choisit les rangées parmi les 30, autant qu'en montrait le moteur (3 à 14, souvent 4). Même effet et même dose : le cadre du moteur (une barre, « même effet 40 g ») ; sinon « Ajouter » avec une barre et une dose par rangée. Les effets, doses, stock, barres restent ceux du moteur.
- **Puce de m6, comportement de i2** : pointillée, claire, étoile bleue, 14 px, à droite du moment. Textes de i2 : « classé par l'IA » (appliqué) et « appliquer l'ordre IA » (prêt) ; m6 disait « ordre IA prêt » : j'ai gardé les mots de i2 que VOIE.md cite. **Sa place est tenue dès le premier affichage (invisible)** : son arrivée ne déplace rien. Phrase : « IA » en bleu clair `#56B4E9` (le `#0072B2` de m6 est trop sombre sur le fond sombre de l'app), texte 14 px, au toucher d'une rangée.
- « Tes six » (m9) n'est pas dans l'app.

## Critères (sorties décisives)
1. `npx vitest run tests/unit/hopIndexV4 tests/unit/aiTaskMonthlyBudget.test.ts tests/unit/monthlyAiBudget.test.ts tests/unit/d100AiTaskOutput.test.ts tests/unit/aiClientYeastGuard.test.ts --maxWorkers=2` : **98 fichiers, 969 tests verts**. Test d'identité de l'invite `v1` (78 messages) vert. « suggérer » couvre : invite, schéma, réponse invalide, hors liste, doublon, oublié, JSON coupé, MAX_TOKENS, phrase vide, valeur inventée, budget (mensuel et quotidien), panne, entrée refusée (9), accès. (Un premier passage de `suggererIA.test.tsx` a expiré en bloc pendant qu'a4 modifiait le moteur ; rejoué : vert. Ces tests dépendent du moteur : 4 rangées au dry hop de sa Double IPA.)
2. `functions/` n'a pas de script de test : ses tests vivent dans `tests/unit` (rejoués ci-dessus). `npx tsc --noEmit` et `npx tsc --noEmit -p functions` : sans sortie.
3. Build à part : `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-ia3` : « built in 21.78s ». `check-no-dev-auth.mjs` ne lit que `dist/` du dépôt (pas d'option) : j'ai cherché ses 7 marqueurs dans mon dossier, **0 fichier** pour chacun. `check-hop-budget.mjs --dist … --chunk-outils profil-simule` : **B5 147,5 ko (≤ 164) tenu** ; B1 921 ko et B2 773 ko « dépassé », comme i2 l'a noté avec ces arguments par défaut (non lié à ma voie). `fumee-worker-prod.mjs --dist=…` : **WORKER PROD OK**.
4. **`IA3-EMULATEUR-OK`** (`ia3-emulateur.ts --mode=simule`, aucun appel réel). Constaté sur sa neipa v3, 390 × 844 : le moteur d'abord, sans puce, place tenue ; réponse en 1,4 s, ordre appliqué seul ; **décalage 0 px** (titre, première rangée, « Changer de levure », hauteur du groupe) ; phrase au toucher (14 px) ; puce touchée = ordre du moteur rendu à l'identique ; réponse tardive (2,7 s après la fenêtre) : liste immobile, « appliquer l'ordre IA », puis applique ; hors ligne : aucun appel, aucune puce, aucun message ; budget mensuel réservé et réglé. **Captures toutes ouvertes** : `simule-1` ouverture, `-2` puce, `-3` ordre appliqué, `-4` phrase, `-5` puce touchée, `-6` tardive, `-6b` tardive appliquée, `-7` hors ligne.
5. **Essai réel** (`--mode=reel --confirm-paid-ai`, `IA3-REEL-OK`) : **13 appels, 0,0664 CHF** sur 30 et 0,5 ; section « ia3 » écrite ; `gemini-3.5-flash-lite` partout, par `guardLiveFetch`. Détail : 4 appels à 29 phrases (0,0234 CHF, 3,5 à 4,7 s, invite abandonnée), puis 9 appels à 10 phrases dont 2 perdus (le banc a rechargé la page quand a4 a modifié le moteur). Aucune erreur du fournisseur, budget jamais atteint.

## Rapport : l'ordre IA contre l'ordre du moteur (réel, 10 phrases)
- **Neipa v3, agrumes, dry hop actif.** Moteur : East Kent Goldings, Golding, Spalter Select, Mount Hood, Phoenix, Galaxy… (houblons nobles, peu d'agrumes). IA : Mandarina Bavaria, Cashmere, Calypso, Apollo, Galaxy, Summit, Jarrylo, Southern Cross.
  - Ses six, rang moteur → rang IA (pool de 29, dernier essai en agrumes) : Mandarina 15 → 1 ; Calypso 8 → 3 ; Pacific Jade 21 → 17 (essai précédent) ; **El Dorado, Mosaic, Idaho 7 hors du pool**. En tropicaux : Mandarina 13 → 10, Calypso 6 → 16 (essai précédent), **Idaho 7 29e → 3e**, El Dorado, Mosaic, Pacific Jade hors du pool. Le pool dépend du moteur d'aujourd'hui (a4 le modifie) : à rejouer après a4 (`img/rapport-reel.json`, `parAppel`).
- **Neipa v3, tropicaux** (chauffe). Moteur : Rakau, Fuggle, Super Galena, Galaxy, Huell Melon, Calypso. IA : Galaxy, Citra, Idaho 7, Zappa, Harlequin, Southern Passion.
- **Stout 16D (Nugget 46 g, OG 1,066 : mon stand-in du « stout S1 »), plus floral, whirlpool, 30 candidats.** Moteur : Target, Willamette, Nugget, East Kent Goldings, First Gold… IA : **East Kent Goldings** (« lavande »), Ahtanum, Golding, Crystal, Cascade, Amarillo… 3,3 s : « appliquer l'ordre IA ».
- **21C Hazy du jeudi, plus d'agrumes** : aucun groupe de 3 rangées au même effet (comme dans m6 : 2 rangées, Belma et Galaxy) : **pas d'appel**, comportement voulu par la règle, mais il n'y a pas d'essai IA sur cette recette.
- Phrases : courtes, en français, sans chiffre. Une dit « parfaitement » (adjectif d'appréciation, que l'invite déconseille ; c'est le point C5 de i2) ; 0 retirée.

## Doutes et limites
- **Ses six hors du pool.** Le pool = 30 premiers du moteur ; Mosaic, El Dorado, Idaho 7 n'y sont pas en agrumes avec le moteur d'aujourd'hui. L'IA ne peut pas remonter ce que le moteur exclut du pool : c'est le sujet de a4 (Calypso, Mandarina, typicité).
- **Latence** : 2,6 à 3,3 s en réel sur l'émulateur, donc au bord de la fenêtre de 3 s ; un appel froid en production sera plus lent : la puce « appliquer l'ordre IA » est alors le cas courant (comportement prévu).
- **Hauteur** : le groupe peut changer de 16 px quand une rangée n'a pas de ligne « lui seul » (mesuré 16 px un soir, 0 px le suivant). Le titre et la première rangée ne bougent jamais.
- Les jeux du banc (jsdom) lisent le moteur d'aujourd'hui ; si a4 change l'ordre, `suggererIA.test.tsx` peut demander un autre groupe (il lit un groupe de 4 rangées au dry hop actif).
- Un essai simulé : le chemin app → callable → fournisseur local → budget est prouvé ; pas l'appel froid de production ni App Check (aucun callable du dépôt ne l'exige).
- Non fait : bureau (la puce est dans le groupe, aucune tête de page à régler), `minInstances`.

## Déploiement (pour le pilote, pas fait ici)
```
npm --prefix functions run build && firebase deploy --only functions:hopReclasserIA --non-interactive
```
Le client (hosting) après, sinon il appelle un mode inconnu du callable déployé (le callable de i2 refuserait l'entrée : échec silencieux, ordre du moteur).

DÉCISION À PRENDRE : (1) seuil de l'IA : 3 rangées au même effet (la 21C de m6 n'en a que 2, donc aucune IA). Option : 2 rangées (plus d'appels, jusqu'à 2 par écran, ≈ 0,01 CHF) ; recommandation : garder 3 et laisser a4 départager. (2) Phrases pour les 10 premiers au lieu des 30 (latence) : à confirmer ; recommandation : oui. (3) « parfaitement » : ajouter « sans adjectif d'appréciation » à `suggerer-v1` (pas encore déployée : pas de nouvelle version) ; recommandation : oui, avant le déploiement, avec un essai de ≈ 0,02 CHF. (4) Rejouer la liste de ses six après a4.

CONNAISSANCE : le serveur de dev (Vite) recharge la page quand un autre agent modifie un fichier source : un banc Chrome qui tourne pendant qu'une voie voisine édite le moteur perd son contexte (« Execution context was destroyed »), et un essai réel y perd des appels facturés ; l'app réécrit son brouillon en quittant une page, donc une recette d'essai se pose avec `evaluateOnNewDocument` sur une page neuve. Latence Flash-Lite mesurée : ≈ 0,8 s + 2,5 ms par jeton de sortie (1 232 jetons : 4 s ; 880 : 2,6 s).

LEÇON PROPOSÉE : avant de fixer le format d'une réponse d'IA affichée dans une fenêtre de temps, mesurer la latence au volume de sortie visé (une phrase par candidat avait doublé la sortie et sorti de la fenêtre) ; et un banc lancé sur un arbre partagé se rejoue avec un contrôle de la page (la recette posée est celle qu'on croit : le stout et la 21C du premier essai réel étaient la neipa v3).
