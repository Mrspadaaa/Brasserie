OK — socle jouable : coquille, 7 routes, état partagé, moteur en direct, parcours joué

## Fait
Le dossier `prototypes/houblons-v4/parcours/` (carte complète dans `ARCHITECTURE.md`) :
- **Construction** :
  - `vite.config.ts` reprend le modèle de `ecran/` : alias `@app` et `@functions`, un seul React, et
    `ecran/tailwind.config.js` et `ecran/src/themes.css` importés ;
  - la sortie compte 8 pages, IIFE et une feuille commune, ouvrables en file:// ;
  - `--sortie=` construit dans un autre dossier, qui n'est pas vidé ; `NOTE.md` est copiée.
- **Coquille** :
  - `PageShell` et `Sheet` de l'app, importés ;
  - Ma bière au fond, l'outil par-dessus, avec « ‹ » et sa question ;
  - le toucher thème (clair, cave) et Recommencer ;
  - les routes passent par le hash, avec une historique à la manière de `useFullScreenRoute`.
- **État** :
  - un seul état et un réducteur, avec des opérations pures ;
  - un brouillon par outil, qui suit la route : `‹` l'abandonne, `Ajouter` et `Remplacer` l'inscrivent ;
  - le remplacement se fait à IBU égal à chaud et à masse égale à froid.
- **Moteur en direct** :
  - l'adaptateur est typé, mémoïsé et chronométré ;
  - la bière part de la dégustation du 18.10 ;
  - l'inconnu vaut `null` avec sa raison ; le simulé est marqué « ~ ».
- **Données du cas** : `s1Recipe` et `S1_TASTING` du moteur, importés et non recopiés.
- **Communs** :
  - les pictos, importés de la planche (f1 pour l'épicé) ;
  - les couleurs, une seule table (#142) ;
  - barre l5b, jeton de houblon, ligne de contexte, légende « ? », pont, dock, cadres, `~` et `?` hachuré, appui
    long.
- **Écrans** : 7 ébauches, chacune avec ses ponts branchés, `data-ecran`, `NOTE.md` (avec `## Base`) et `jeu.mjs`.
- **Outils** : `verifier-types.mjs`, `construire.mjs`, `app-intacte.mjs` et `jouer-parcours.mjs` (`--routes`,
  `--ponts`, `--etape=` répétable, `--captures`, `--dossier`, geste `maintenir`).
- **`package.json`** : les scripts `parcours:dev`, `parcours:build`, `parcours:types` et `parcours:jouer` ; le
  typecheck inclut aussi `parcours/`.

## Critères (rejoués depuis la racine)
- G1 : `TYPES OK`.
- G2 : `CONSTRUIT OK (8 pages) → prototypes/houblons-v4/maquettes/parcours/`.
- G3 : `ROUTES OK (7/7)`. Il passe aussi avec `--dossier=…/parcours-essai`, après `--sortie`.
- G4 : `PONTS OK (19 gestes, recalcul médian 1,1 ms)`. Le script affiche aussi : « recalculs : 48 ; gestes qui
  recalculent : 11, médiane 3,7 ms, max 24,0 ms par geste ». Un recalcul est un `lireBiere` dont le cache a
  manqué.
- G5 : `APP INTACTE OK`.
- G6 : `NOTE OK`.
- G7 : ce fichier.
- En plus : `--etape=` sur les 7 écrans renvoie `ETAPE OK (substituer)`.
- Essais : G3 en a pris 2 (un hash vide ramenait Ma bière). Les autres sont passés au premier essai.

## Captures --ponts ouvertes (os.tmpdir()/pq-ponts)
J'ai ouvert ces captures :
- `02-fiche-appui-long` : la feuille de Nugget, avec α 13 %, 9,5–16, le rôle mixte, les familles et
  « autres : 14 % » ;
- `07-dryhopper-glisser-ebullition` : 35′, IBU +84, l'arôme en « ? », non simulé à 35′ ;
- `11-ajouter-a-ma-biere` : la ligne Idaho 7 (80 g, actif, 4 j) et le floral qui monte ;
- `12-substituer` : 6 remplaçants, avec la dose à IBU égal ;
- `13-remplacer` : Nelson Sauvin 62 g à 60′, IBU 59.

J'ai aussi ouvert `--routes` : `03-route-suggerer` et `05-route-dryhopper`. Les écarts d'Idaho 7 y sont ceux de la
carte : floral ~+22, résineux ~+14, agrumes ~+13 et tropicaux ~+16.

## Écarts, doutes et limites
- **Corrigé.** À 35′, l'écart s'affichait « ~+0 » alors que l'arôme n'y est pas simulé. Il s'affiche maintenant
  « ? » (capture 07 reprise). Le simulateur ne connaît que 60′, 10′, le whirlpool et le dry hop.
- **Pour p2.** Suggérer en direct classe Target (rôle « aromatique » selon le fournisseur, 5 g en stock) devant
  Cascade et Galaxy : ~+16,5, ~+16,4 et ~+15,6. Le pré-cochage de l'ébauche donne donc Idaho 7, Target et Cascade,
  et non les 3 de la carte. `comparer/etat.html` garde Cascade, Idaho 7 et Galaxy.
- **Pour p1.** Substituer, « en stock d'abord », propose d'abord Nelson Sauvin. La carte montrait Magnat et Galaxy.
- **Stock.** Idaho 7 n'a que 20 g en stock pour un besoin de 80 g (4 g/L). L'ébauche ne le signale pas.
- **Arrondi.** Le remplacement arrondit au gramme : l'IBU passe de 59,7 à 59,2.
- **Approximation.** Le retrait d'un ajout dégusté retranche l'écart sans dégustation, centre par centre. La
  saturation n'est pas recombinée.
- **Thème cave.** Les jetons des familles ne sont calculés que pour le clair.
- **Capture.** La première capture montre le contour de focus jaune de `PageShell` sur `main`. C'est le
  comportement de l'app.
- **verifier-page.mjs** n'a pas été lancé : il n'est pas dans mes GATES, et il vise une page de lot. Le texte de
  l'app y passerait sous 14 px.

DÉCISION À PRENDRE : faut-il exclure de Suggérer un houblon dont le stock libre est sous la dose (Target 5 g,
Idaho 7 20 g pour 80 g) ?
- Option A : les montrer avec l'icône de stock seule.
- Option B : les écarter.
- Option C : les classer derrière.
Recommandation : A, avec une icône « stock insuffisant ». Idaho 7 est le gagnant de la carte. La voie p2 tranche
avec le brasseur.

CONNAISSANCE : le profil simulé en direct (`simulerCas`, complet:false) coûte 1,1 ms médian par recalcul de Ma
bière dans Chrome. Un geste qui recalcule prend 3,7 ms en médiane, 24 ms au plus pour Suggérer et ses 9
candidats. L'arôme n'est simulé qu'à 60′, 10′, au whirlpool et en dry hop : à toute autre minute, il est inconnu.
Proposé pour [[cout-calcul-moteur]].

LEÇON PROPOSÉE : un script Bash qui écrit du code par `node -e "…"` ou par un heredoc perd les backticks et les
`${…}`, que le shell substitue. Deux corruptions silencieuses ici : un commentaire vidé, un console.log devenu
vide. Il faut écrire le fichier de travail avec Write, ou passer par un heredoc `<<'EOF'` vers un fichier .cjs,
puis l'exécuter.
