OK PARTIEL — « autres » expliqué, Sources avec liens puis tout le catalogue, bandeau masqué au glisser, visée vers Suggérer ; saut non reproduit.

## Fichiers écrits (tous dans Possède)
- Nouveaux : `fiche/autres.ts` (calcul), `fiche/traduction.ts` (table de traduction, extraite de donnees-matrice), `fiche/SourcesFiche.tsx` (feuille Sources), `tests/unit/hopIndexV4/ficheSourcesAutres.test.tsx` (10 tests), `tests/unit/hopIndexV4/suggererViseePosee.test.tsx` (3 tests), `banc-t12e.mjs`, `captures/`.
- Modifiés : `maBiere/briques.tsx` (Autres devient un bouton, `ExplicationAutres`), `fiche/Matrice.tsx`, `fiche/sources.ts` (url par plage, `liensDe`, champs du catalogue), `fiche/Replis.tsx`, `fiche/donnees-matrice.ts`, `fiche/fiche.css`, `fiche/FicheApp.tsx`, `maBiere/rail.ts`, `maBiere/rail.css`, `parcours/visee.ts`, `suggerer/EcranApp.tsx`, `suggerer/index.tsx`.
- Non touchés : `HopToolLayer.tsx`, `substituer/`, `dryhopper/`, `levure/` (t15c). `git status` après la voie : seuls mes fichiers et ceux déjà modifiés avant.

## 1. « autres 42 % » — fait
- Au toucher de la mention (carte de Ma bière, matrice de la fiche) : « 5 de ses 12 mots n’entrent dans aucune des 12 familles » puis la liste traduite avec ◇ : vanille ×2, crème, fruité, doux. Un mot dit par deux fiches compte deux fois dans le calcul de l'adaptateur ; la liste le montre (×2) au lieu de le cacher.
- Même calcul que le chiffre : `autresDe` reprend celui de `houblon()`. Test : sur les 318 houblons, `part` = `partSansFamille`, somme des fiches listées = numérateur.
- Captures ouvertes : `captures/844-1-autres-carte.png`, `844-3-autres-fiche.png`.

## 2. Sources — fait
- La feuille « Sources › » s'ouvre sur les liens : Beer Maverick (champ `url`), puis chaque fiche fournisseur avec adresse (une fois par adresse), puis les sources sans adresse (nom + date, sans lien). Tous `target="_blank" rel="noopener"`.
- Ensuite par thème : Houblon (nom, alias, origine, usage, forme, identifiants, faits cités), Acides (α, β par fiche avec plage, lot, cohumulone ?), Huile (totale, myrcène, humulène, caryophyllène, farnésène, linalol, géraniol ?, thiols), Arômes (mots traduits avec famille ou ◇, auteurs par famille, descripteurs BM, textes repliés), Styles et usages (avec leurs liens), Ma recette et mon stock, « Pas dans les fiches » (?), notes de chaque fiche repliées. Chaque valeur d'α, β, huile et composant porte sa source en lien. Inconnu = « ? ».
- Correctif au passage : « tropical fruits » (Hopsteiner) est maintenant traduit « fruits tropicaux » : il doublait la ligne dans la matrice.
- Test : sur Lotus, Nugget, Citra, Nelson Sauvin, chaque champ du catalogue présent est affiché, le lien BM pointe sur `url` ; sur les 318 la page BM est en tête.
- Captures ouvertes : `844-4-sources-haut.png`, `844-5b-sources-milieu.png`, `844-5-sources-bas.png`.

## 3. Bandeau masqué pendant tout le glisser — fait
- `rail.ts` : la condition « seulement s'il monte jusqu'à lui » est retirée (classe posée à chaque mouvement), retirée au relâcher. Mesure (390 × 844, 700, 640) : opacité du bandeau 1 au repos, 0 à 12 px, 90 px et 170 px de glisser, 1 au relâcher.
- Captures ouvertes : `844-6-rail-glisser-petit.png`, `640-6b-rail-glisser-moyen.png`.

## 4. Visée vers Suggérer — fait (tuyauterie), avec une limite
- `parcours/visee.ts` : `poserVisee`, `lireVisee`, `abonnerVisee` (magasin sans React). `suggerer/EcranApp.tsx` et `fiche/FicheApp.tsx` la lisent ; la prop `visee` de Suggérer reste prioritaire.
- Sans visée ni demande : Suggérer écrit « Aucune visée. Rien n'est visé dans Ma bière, et aucune dégustation ne porte de demande : Suggérer n'a rien à proposer. », sans voie houblon ni levure (avant : « Changer de levure » s'affichait sans but).
- Captures ouvertes : `844-7-suggerer-sans-visee.png`, `844-8-suggerer-avec-visee.png` (visée {floral 2,5 ; résineux 0,5} posée par import du module dans la page : « Plus floral », « Plus résineux »).

## 5. « modifier les ibu fait sauter l'app » — non reproduit
- Recette longue (Galaxy 30 g à 60′, Citra 25 g à 10′, ébullition 90′, levure, liste des ajouts rapides), 390 × 640 et 390 × 700 : 4 touchers + / −, ⟳ type d'ajout, + d'un ajout rapide. Saut max 0 px (carte, défilement), aucune erreur de page, l'écran reste monté. Rien à corriger sans reproduction. À rejouer sur l'app déployée (stock réel, α de lot).

## Critères rejoués
- `npx vitest run tests/unit/hopIndexV4` : 17 fichiers, 184 tests verts (13 nouveaux).
- `npx vitest run tests/unit/designTokens.test.ts` : 2 verts.
- `npm run build` : exit 0. `npx tsc --noEmit` : propre.
- `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 647 protected usages in 335 files`.
- Banc Chrome `banc-t12e.mjs` : autres, sources, rail, suggerer, sauter : tous OK, aucune erreur de page.
- Essais : aucun critère au-delà de 3 essais.

## Doutes et limites
- DÉCISION À PRENDRE : l'app n'a aucun endroit où poser une visée (la pastille « + floral › » de Ma bière est un libellé fixe qui ouvre seulement Suggérer). Tant que rien n'appelle `poserVisee`, Suggérer affichera « Aucune visée » dans l'app. Options : (a) ajouter dans Ma bière le geste qui pose la visée (+/− sur une famille, comme la maquette `biere/`) : écran à montrer au brasseur en mini maquettes (règle n° 1) ; (b) faire poser par « + floral › » une visée au palier du dessus, réversible, mais c'est une demande déduite d'un libellé ; (c) laisser tel quel. Recommandation : (a), en maquettes d'abord.
- DÉCISION À PRENDRE : le « 42 % » compte un mot dit par deux fiches deux fois (vanille BM + vanilla Hopsteiner) et mélange mots par fiche et mots distincts au dénominateur (adaptateur.ts, hors de ma voie). L'explication le dit honnêtement, mais le chiffre le plus juste serait en mots distincts traduits (Lotus : 4 sur 11, 36 %). Recommandation : corriger `partSansFamille` dans `parcours/adaptateur.ts` (une ligne) ; mon test des 318 houblons suivra en changeant `autresDe`.
- La visée passe par un magasin de module (`parcours/visee.ts`), pas par `comparer/porte.ts` (hors Possède). Si le pilote veut la porte elle-même, ajouter `visee` à `PorteEtape`.
- `poserVisee` n'est jamais appelé dans l'app : seul le banc le fait (import dynamique du module dans Chrome).
- Les tests jsdom ne voient pas le rendu ; les captures ci-dessus sont celles de Chrome 390 × 844, plus 640 pour le rail.
- Non joué : desktop (1280), `controle-etats.mjs` et `controle-fonctions-rail.mjs` sur la maquette (le rail de la maquette n'a pas été touché ; `rail.ts` de l'app porte le changement).
- Avertissements LF→CRLF de git sur les fichiers modifiés, contenu inchangé hors de mes lignes.

CONNAISSANCE : le « autres N % » de la carte est mots sans famille ÷ (mots rattachés distincts + mots sans famille), comptés par fiche pour le numérateur ; il double un mot que deux fiches disent (Lotus : 5 sur 12 = 42 %, 4 mots distincts).
LEÇON PROPOSÉE : aucune
