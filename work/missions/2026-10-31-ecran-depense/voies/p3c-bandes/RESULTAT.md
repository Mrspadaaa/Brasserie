OK — onze bandes de famille (p3c-3), mots allemand/anglais/français/italien, captures 390 et 1280 ouvertes

## Fichiers écrits
- `src/ui/depense/familles.ts` (neuf) : `familleDe`, ordre et noms des 11 familles, listes de mots du métier (4 langues), `familleDeCategorie` (appelle `canonicalStockCategory` de k7, rien dupliqué).
- `src/ui/depense/groupes.ts` : `GroupeCle` = les 11 familles ; `groupeDe(contexte, kind, nom, stockCategory, categorieArticle)` ; tables `POINT_FAMILLE` et `FILET_FAMILLE` (jetons de l'app).
- `src/ui/depense/Ligne.tsx` (filet de gauche), `p3c.css` (7 teintes de fond d'en-tête), `apercuDev.ts` (état `?dev-local&depense=familles`, lecture SIMULÉE de toutes les familles, désignations en 3 langues).
- `src/ui/finance/ExpenseSheet.tsx` : `groupeDeLigne` seulement (passe `kind`, nom, `stockCategory`, catégorie de l'article rattaché ; la mouture lit toujours son malt).
- **Hors Possède, 2 lignes** : `src/ui/depense/Recap.tsx` (l'import et `TEINTE = POINT_FAMILLE`). Sans cela tsc échoue (`Record<GroupeCle,string>` à 4 clés) et la barre du récap perdrait la couleur des nouvelles familles.
- Tests : `tests/unit/depense/bandes/{aide.ts,familles.test.ts,langues.test.ts}` (neufs) ; `tests/unit/depense/banc-k6/genres-d262c.test.ts` (le `it.todo` des bandes est remplacé par un vrai test, le test « 4 bandes » mis à jour).
- Voie : `capturer-familles.mjs`, `captures/` (22 images + `rapport.txt`).

## Familles et ordre de la source
Malts, Houblons, Levures, Sucres, Additifs, Matériel de brassage, Emballage, Nettoyage, Consommables, Services, Autres. Source : catégorie de l'article rattaché, puis catégorie lue sur la ligne (normalisée en français par `canonicalStockCategory`), puis `kind` (equipment/maintenance → matériel, packaging → emballage, cleaning → nettoyage, service → services ; shipping/discount → Autres), puis les mots (matériel d'abord, puis emballage, nettoyage, contexte Malt/Houblon/Levure de `contexteDe`, puis listes). Une catégorie d'ingrédient ne capture pas une ligne que la lecture dit matériel, emballage, nettoyage ou service. Le port reste hors des bandes (D249), la mouture sur son malt.

## Critères (sorties)
- `npx tsc --noEmit -p .` (copie isolée) : code 0, aucune erreur.
- vitest (liste du VOIE.md) : `Test Files 92 passed (92)`, `Tests 1581 passed | 3 skipped`.
- Rouge d'abord : mêmes tests contre le `groupes.ts` de HEAD copié dans la copie : 3 fichiers en échec, 38 tests rouges (D269, D271, bandes, pièce du 01.11). Copie resynchronisée ensuite.
- `capturer-p3c.mjs --mode=tactile390` : `P3C OK` (sortie envoyée dans le dossier temporaire, captures de p3c-port intactes).
- `capturer-familles.mjs` : `FAMILLES OK` (390 tactile et 1280) : 11 bandes dans l'ordre, « Autres » = la seule ligne inclassable, 11 pastilles distinctes, montants alignés sur le sous-total (0 px), aucun débordement, aucune erreur console, aucune requête hors localhost.
- Captures ouvertes en image : `tactile390-repos` (côte à côte avec p3c-3), `tactile390-long-clair`, `tactile390-long-sombre`, `tactile390-materiel-ouvert` (plateau d'une rangée du matériel), `tactile390-sombre-emballage`, `pc1280-repos`. Même forme que les bandes de p3c-3 (pastille, compte, quantité en gras, sous-total, filet de gauche).
- Essais : un par critère, sauf l'écart de mon propre script (nom normalisé « SafAle »), corrigé au deuxième passage.

## D269 / D271 (tests)
- 19 noms du jeu de D269 sans catégorie ni article : tous justes ; avec une `stockCategory` qui contredit les mots : la catégorie gagne ; l'article rattaché gagne sur la catégorie lue (voir décision).
- Jeux par langue : allemand (17 noms), anglais (13), français (12), italien (un seul cas, 5 mots de base), et la catégorie lue en 4 langues (« Yeast », « Hefe », « Hopfen », « Zusatzstoff », « Verpackung », « Reinigungsmittel », « Lievito »…).
- Jury L20 (3 noms hors liste, non corrigés) : « Chinook T90 Pellets » → Houblons ; « Fermentasaurus 35 L » et « Rahr Pale 2-Row 25 kg » → Autres (aucune marque ni terme connu). C'est le repli voulu : l'inclassable n'est pas rangé de force. La liste se complète à mesure (marques de matériel, malteries).

## Doutes et limites
- DÉCISION À PRENDRE : j'ai mis la catégorie de l'article rattaché AVANT celle que la lecture a écrite (VOIE.md dit l'inverse). Raison : si le brasseur relie la ligne à un autre article, la catégorie lue est périmée. Option : suivre l'ordre du VOIE.md à la lettre (une ligne). Recommandation : garder mon ordre.
- Défaut vu sur capture, hors de ma voie : dans le récap, la ligne de contrôle « Somme = imprimé » chevauche son montant dès que le total a trois chiffres (« Somme = imprimé359,40 », 390 px, `tactile390-repos.png`). Vient de `ExpenseSheet.tsx` l. 688 / `Recap.tsx` (grille des contrôles), pas de mes changements. Une facture de plus de 100 CHF est courante : à confier à une voie du récap.
- Teintes : en thème sombre, Emballage (brun) et Services (cuivre) sont proches, ainsi que Consommables et Autres (gris) ; jamais voisins dans l'ordre. À juger par le critique/le brasseur.
- Listes de mots : italien réduit à ses mots de base (consigne). L'allemand en mots composés repose sur des suffixes (-malz, -sack, -tank, -kuhler…) : faux positif possible sur un nom très inhabituel.
- `controle-choix.mjs` : introuvable à `work/refonte-frontend/v4/choix/` (MODULE_NOT_FOUND) ; non rejoué.
- Aucun commit, aucun déploiement. `git status --short` : mes fichiers sont `src/ui/depense/{Ligne.tsx,Recap.tsx,apercuDev.ts,groupes.ts,p3c.css,familles.ts}`, `src/ui/finance/ExpenseSheet.tsx`, `tests/unit/depense/{banc-k6/genres-d262c.test.ts,bandes/}`, ce dossier. Les autres lignes (k7 : purchaseEntry, purchasePrefill, stockLineMatching, banc-k7 ; reste du dépôt) ne sont pas à moi.

CONNAISSANCE : la famille d'une ligne se décide en `src/ui/depense/familles.ts` (catégorie d'article, catégorie lue, kind, mots dans 4 langues) ; le sous-total par famille reste dans `groupes.ts`.
LEÇON PROPOSÉE : aucune

---

# Suite du 01.11, nuit (D273d, retouches de teinte, bout en bout, récap)

SUITE OK — familleDe + catégorie de l'article d'une seule décision ; autres = 18 sur 232 ; teintes retouchées ; récap sans chevauchement.

## Fichiers écrits (en plus de la première livraison)
- `src/ui/depense/familles.ts` : `hasHopWord` (variété du catalogue à son premier mot), `estNomHoublon` (nom complet du catalogue comme suite de jetons), `categorieDeFamille`, préfixe `malzextrakt` et jetons DME/LME.
- `src/ui/depense/nomsHoublons.ts` (neuf, 4,8 ko) : 114 noms composés + 213 noms simples dérivés des `hopVarieties` de `src/data/hop*.json` (script hors dépôt, dans le dossier temporaire). `HOP_LIST` de `ingredientIdentity.ts` n'a pas « Barbe Rouge » : seul le paquet BeerMaverick (2 Mo) le porte, d'où la liste dérivée.
- `src/services/stockLineMatching.ts` : `categorieArticleNeuf` seulement (appelle `familleDe` puis `categorieDeFamille`).
- `src/ui/depense/{groupes.ts,p3c.css}` : quatre familles ont leur couleur par thème (variables `--dp-fam-*` dans p3c.css ; pas de jeton neuf dans `themes.css`).
- `src/ui/depense/Recap.tsx` (hors Possède) : une classe retirée (`whitespace-nowrap` du libellé de la preuve).
- Tests : `tests/unit/depense/bandes/{familles-d273.test.ts (suite ajoutée), categorie-famille.test.ts (neuf)}`, `tests/unit/depense/fiche/ecriture.test.ts` (une attente : « Sabro® 13.4% » inconnu devient Houblon et non plus Divers).
- `capturer-familles.mjs` : contrôle de la couleur rendue par thème (ΔE) et du chevauchement du récap ; option `--ancien`.

## 1. D273d
- (a) « Nelson Sauvin™ 9.6% » reste un houblon : `familleDe` reconnaît une variété du catalogue (`hasHopWord`, déjà dans le module de rapprochement : aucun poids de plus). Poids mesuré : `ingredientIdentity` est déjà importé par l'écran ; la liste dérivée ajoute 4,8 ko. Témoins verts : « Milchsäure 80 % » et « Phosphorsäure 75 % » additifs, « Produit fictif 12.3% » autres, un nom simple du catalogue sans α reste « autres ».
- (b) Sirop candi lu « other_stock » : article neuf en « Sucre ». Une seule décision (`familleDe`), jamais une catégorie hors `STOCK_CATEGORIES` (test sur 7 kinds × 11 noms × 4 catégories), « Divers » seulement pour « Autres ». Nettoyage : sous-famille lue dans le nom (Désinfectant, CIP alcalin, Détergent, sinon Consommable). Matériel et services n'entrent pas en stock : « Consommable » s'ils arrivaient là.
- Les 21 cas justes du test restent verts ; les 2 rouges sont verts.
- Cas du pilote (6 lignes) : « Barbe Rouge 8.6% / 8.9% », « El Dorado 12.3% / 11.7% » → houblon ; « Malzextraktpulver hell 1 Kg » → malt, aussi sans catégorie lue. Rouge d'abord : listes de noms vidées et préfixe retiré dans la copie, 9 tests rouges ; puis verts. « Sekt für 50 Liter » reste en autres (rien ne dit ce que c'est) ; son nom n'est écrit dans aucun fichier (le test de l'inclassable est « Divers fictif XJ-17 »).
- Rejeu sur les 232 articles de `Csv8+N` (script de rejeu dans le dossier temporaire, aucun nom écrit) : **autres = 18 sur 232** : 7 port (shipping), 10 achats privés (kind other), 1 « Sekt ». Malt 60, houblon 50, services 31, matériel 31, levure 26, sucre 5, additif 5, emballage 4, consommable 2. Les 6 lignes du pilote sont rangées.

## 2. Retouches de teinte (CRITIQUE.md)
- Consommables : rose (clair 168 62 108, sombre 222 128 166), distinct d'Autres en sombre. Nettoyage : sarcelle (14 138 122 / 80 200 170), plus le vert du houblon. Emballage et Services éclaircis en sombre (168 112 72 et 214 110 70), lisibles. Aucune variable ajoutée à `themes.css` : tout est dans p3c.css.
- Défaut 5 : contrôle de la couleur RENDUE, dans les deux thèmes, à 390 et 1280 : pastilles ΔE ≥ 15, fonds ΔE ≥ 3, pastille/fond ≥ 2,2:1 pour les sept bandes nouvelles (3:1 ferait échouer Sucres, l'ambre ne tient pas). Rouge d'abord : avec `--ancien` (anciennes couleurs rétablies), 4 échecs (houblon/nettoyage en clair ΔE 1,8 sur les fonds ; en sombre houblon/nettoyage ΔE 9,5, consommable/autres fonds ΔE 2,1). Version actuelle : `FAMILLES OK`.
- Captures ouvertes : `tactile390-long-clair.png`, `tactile390-long-sombre.png`, `tactile390-sombre-emballage.png`, `tactile390-repos.png` (côte à côte avec p3c-3).

## 3. Bout en bout `final6/D` : les 4 KO
- (b) « pastille Total » : D272b, hors voie, ignoré comme dit.
- (e) bandes, aux deux largeurs : **ne vient pas de l'écran, mais du banc** (`scripts/check-invoice-journey-emulator.mjs` l. 1305 et 1370). Il cherche la rangée par `line-${n}` avec n = position de la ligne dans la lecture ; or les identifiants du DOM sont ceux de la lecture, dans un autre ordre (ex. `line-7` = CARABELGE, `line-6` = Hopfensack). Ses lignes « ambiguës » 6, 15, 16 (Candi, Kronkorken, Karton) tombent donc sur Hopfensack, Flaschenbaum, Hop Spider Bag, d'où « materiel ». Preuve : l'enregistrement `doc14-rangees` du même rapport range chaque ligne dans sa bande (malt ×3, houblon, levure, sucre, matériel ×8, emballage ×2, port à part, aucune en autres), et ses 17 libellés sont tous dans les familles attendues. Correction à faire dans le banc (hors voie) : retrouver la rangée par libellé (`row.label`), pas par `line-${n}`. Je n'ai pas touché ce script.
- Le reste du rapport : 36 OK. Les 4 `Failed to load resource` de la console sont des polices bloquées par le banc, pas de l'écran.

## 4. Récap « Somme = imprimé »
Corrigé (une classe dans `Recap.tsx`, hors Possède) : le libellé n'est plus en `nowrap`, il passe à la ligne (« Somme = / imprimé ») au lieu de recouvrir la valeur ; même coupe que la maquette p3c-3. Contrôle ajouté dans `capturer-familles.mjs` (aucun libellé ne chevauche sa valeur, 390 et 1280) : vert. Je n'ai pas rejoué le contrôle rouge sur l'ancien récap.

## Critères
- `npx tsc --noEmit -p .` (copie) : 0 erreur. vitest (liste du VOIE.md + `bandes`, `banc-k6`, `banc-k7`, `fiche`) : `95 passed`, `1636 passed | 3 skipped`.
- `capturer-p3c.mjs --mode=tactile390` : `P3C OK`. `capturer-familles.mjs` : `FAMILLES OK` (390 tactile et 1280).

## Doutes et limites
- `stockLineMatching.ts` importe `familles.ts` (couche UI), qui importe `stockLineMatching.ts` : cycle d'imports sans effet à l'évaluation (les deux ne s'appellent que dans des fonctions) et jouable dans les deux ordres, mais une couche de domaine commune serait plus propre ; à ranger si le pilote veut.
- La liste `nomsHoublons.ts` est figée à la date du catalogue ; un houblon neuf du catalogue demande de la régénérer. Un nom simple n'est reconnu qu'avec son α.
- Emballage et Services restent des bruns proches en sombre (mesure ΔE ≥ 15 sur les pastilles, jamais voisins).
- Le contrôle du récap n'a pas été vu rouge avant le correctif.

CONNAISSANCE : une ligne de brassage rangée en « Autres » se rattrape par un nom complet de variété (suite de jetons) et un préfixe de mot composé allemand ; l'α imprimé n'est jamais seul un signe de houblon. Le banc de bout en bout retrouve une rangée par `line-<position>` alors que les ids sont ceux de la lecture : retrouver par libellé.
LEÇON PROPOSÉE : un banc qui désigne une ligne par son rang ou son identifiant doit d'abord vérifier que l'identifiant désigne bien la ligne (le 01.11, `line-${n}` a mal désigné 3 lignes de doc14 et fait croire à un défaut d'écran) ; retrouver par libellé, puis comparer à la capture. Rôles : exécutant, auteur. Contrôle : aucun pour l'instant.
