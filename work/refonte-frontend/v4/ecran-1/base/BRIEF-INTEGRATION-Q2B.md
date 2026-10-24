# Intégrer q2b dans la base (Suggestions), base v4.10 (#138)

Le brasseur a retenu q2b : « cella là », puis « C'est effectivement qb2 reprise le mieux ». Il a ajouté : « Un appui long montre une vrai fiche de houblons... ». Dans la base, l'appui long ouvre la vraie fiche nativement (`generateur/fiche.js`). Une fois q2b dans la base, la fiche s'y ouvrira comme ailleurs.

Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus). Texte avec barres obliques inverses ou accents graves : outil Write ou Edit, jamais Bash. Pas de git. Pas de code de l'app (`src/`) : la base est une maquette hors de l'app.

## Ce que tu possèdes (et rien d'autre)

- `work/refonte-frontend/v4/ecran-1/base/generateur/suggestions.js` et `suggestions.css` : la vue Suggestions.
- `work/refonte-frontend/v4/ecran-1/base/generateur/build.mjs` : l'acheminement des données vers `D`, seulement pour Suggestions.
- `work/refonte-frontend/v4/ecran-1/base/generateur/page.html` ou `commun.js` : seulement pour ajouter le sprite des pictos, si nécessaire.
- `prototypes/houblons-v4/src/pack/buildPack.ts`, si les voies S1 du pack doivent porter de nouveaux champs. Le pack se régénère avec `vite-node scripts/build-pack.ts` (voir le README du prototype) ; vitest reste vert (`npx vitest run` dans `prototypes/houblons-v4`).
- La sortie `base/consolide/`, régénérée par `node build.mjs` dans `base/generateur/`.

D'autres auteurs lisent `consolide/fiche.html` et le générateur, mais n'y écrivent pas. Ne touche ni aux autres vues (Ma bière, Comparer, fiche, substitution, rail), ni à `work/refonte-frontend/v4/ecran-1/fils*`.

## La cible

`fils15-s5-complexe/q2b/etat-b.html` et `comparer.html`, générés par `q2b/generateur-q2b.mjs` à partir de `donnees/c1.json`. Lis aussi `q2b/NOTE.md`.

Dans la base, la vue Suggestions devient q2b, mais sur **le cas de la base** : S1, la stout 16D, plus floral et moins résineux.
- Les mêmes voies, dans le même ordre, sont dans `fils15-s5-complexe/donnees/s1.json`. Ce fichier est produit par `prototypes/houblons-v4/scripts/cas-suggestions.ts` ; tu peux t'en servir de référence.
- Les champs utiles : `tout` avec `crans`, `fiches` avec `role` et `roleSource`, `bio`, `ensemble`.
- Le plus propre : ajouter ces champs aux voies S1 du pack, dans `buildPack.ts`, avec les mêmes fonctions du moteur (`describeFamilies`, `hopRole`, `yeastSignals`, `applyVoie`, `recipeIbu`), puis les lire dans `build.mjs`.

Ce que q2b apporte, tout à garder :
- le tableau « même effet sur tes objectifs », où l'extra départage les voies ;
- une case par famille, pleine si la famille est marquée, pâle si elle est citée, avec sa jauge de crans ;
- l'usage du houblon en mini picto (pâle quand il est déduit par la règle α) ;
- le « + » vers Comparer, qui devient ✓, et la barre « Comparer (n) » ;
- le stock en marque passive près des grammes ;
- la frise des moments écrite en clair ; la biotransformation lisible sans survol ;
- ni gros fonds ni en-tête « ma bière » ;
- le picto épicé en grains de poivre ;
- au style par défaut, et l'absolu à un toucher.

Le « + » ajoute réellement le houblon à `ETAT.comp`, la liste de Comparer de la base. « Comparer (n) » ouvre la vue Comparer de la base.

Les pictos des familles et le jeu commun :
- pictos : `fils15-s5-complexe/pictos-familles.html` ;
- jeu commun v3 duo, retenu par le brasseur : `fils17-standard/v3/planche.html` ;
- tons : `fils17-standard/jetons-familles.json`.

Le langage visuel définitif viendra de la baseline (lot 18) : **intègre le contenu et les gestes**, avec le style de q2b.

## Priorité du projet

Lis `.claude/rules/affinee-frontend.md`, ainsi que les parties utiles de `PRODUCT.md`, de `DESIGN.md` et de `docs/ui-compacte.md`. Priorité : densité utile sur mobile.

## Contrôles (tous à OK), puis regarde les captures

Dans `base/generateur`, lance `node build.mjs`. Ensuite, depuis la racine :

1. `node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/base --mots=80 --fill=0.8 --boosters=4 --recette --rail --detail --palette --radar --fiche --coherence --objets` → `LOT OK 1/1`. C'était vrai avant toi.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs work/refonte-frontend/v4/ecran-1/base consolide --pages=etat-b.html` → `FICHE OK`.
3. Sur `consolide/etat-b.html`, avec `<html data-cas="s1">` si un contrôle lit les données du cas. Les données sont dans `fils15-s5-complexe/donnees/s1.json`.
   - `controle-fil6.mjs work/refonte-frontend/v4/ecran-1/base consolide --objet=suggestions --pages=etat-b.html` ;
   - `mots-premier-ecran.mjs … consolide --max=70 --page=etat-b.html` ;
   - `controle-couleurs.mjs … consolide` ;
   - `controle-au-style.mjs … consolide --pages=etat-b.html` ;
   - `controle-autres-ajouts.mjs … consolide` ;
   - `controle-moments.mjs … consolide` ;
   - `controle-ma-biere.mjs … consolide` ;
   - `controle-usage-intensite.mjs … consolide` ;
   - `controle-sens-survol.mjs … consolide --pages=etat-b.html` ;
   - `controle-gros-blocs.mjs … consolide`.
4. `controle-suggestions.mjs`, s'il s'applique à la base : lis son en-tête.
5. `npx vitest run` dans `prototypes/houblons-v4`.

Captures :
- `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/base/consolide/etat-b.html work/refonte-frontend/v4/ecran-1/base/captures/consolide-b-390.png 1688` ;
- une capture fiche ouverte à l'appui long, en puppeteer, pour vérifier que la vraie fiche s'ouvre depuis un nom de voie.

**Regarde-les.** Mets à jour `base/generateur/README.md` (section v4.10).

## Réponse

Trois lignes : ce qui tient, ce qui casse, les contrôles (avec les résultats exacts).
