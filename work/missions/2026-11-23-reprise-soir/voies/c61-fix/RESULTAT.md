OK — c61Regles 51/52 verts (R43 à R46), 1 test faux cité ; PRÊT À METTRE EN LIGNE 6f81c5bc3

## Plan et correctifs (par règle, chaque endroit de c61-tests/RESULTAT.md)
- R43 (C61-1, C61-4, C59-6, bloquant) : un prix dit sa quantité ou son unité, ou reste inconnu.
  - `prixUnitaire.ts` : `quantiteArticle` lit aussi la ligne « Poids » d'une MATIÈRE pesée (houblon : nom ou ligne alpha) ; plusieurs sachets (« 50 g, 250 g et 500 g ») : le plus petit (le prix affiché est un « dès »). Un appareil n'est pas touché (son poids n'est pas la quantité du prix). `articleHonnete` la prend en compte.
  - Tableau et Comparer : déjà branchés sur `quantiteArticle` (comparer.ts), donc « 50 g · 69,20 CHF/kg » apparaît sans autre changement.
  - `PrixPastille.tsx` (feuille Articles, carte) : l'euro et son rendu disent « 50 g · 69,20 CHF/kg » ; la fiche le dit par `detailPrix` (déjà en place).
  - `ListeCarnets.tsx` `prixDe` : prend les articles honnêtes (plus de « dès 0,10 CHF »), seulement ceux que le tableau classe dès 2 articles, avec « les 50 g » ou « CHF/kg » ; rien sinon.
  - `prixPropose.ts` (« Prix estimé ? » vers À venir) et `prixChoisi.ts` (plan, Calendrier) passent par `articleHonnete` : 0,10 CHF n'est plus proposé ni envoyé.
- R44 (C61-2, bloquant) : `CarnetsVue.tsx` suit les jetons des lectures lancées DANS cette session (`vivantes`, rempli par `garder`, vidé par `retirer`) ; l'offre « Lecture de lien interrompue [Reprendre] » les exclut. `rangement.ts` : `lecturesEnAttente` rend aussi le jeton. Une lecture gardée d'une session précédente (app fermée avant la fin) se propose toujours, sans rien écrire (LE-1 vert).
- R45 (C59-8) : `alpha.ts` (nouveau) : `estNomAlpha`, `nomAlpha`, `ditAlpha` (nom « Taux d'acides alpha », « Alpha-Säure », nom de la variété ; valeur en nombre + %, texte + %, ou « 13,6 % » dans la chaîne). `comparer.ts` `valeursLuesDe` l'utilise (fiche, Comparer, tableau, feuille, carte). `CarteArticle.tsx` `valeursLues` : une valeur en « % » garde son nom (« Alpha 13,6 % »).
- R46 :
  - C61-3 : `comparer.ts` `colonnesLues` : à 2 houblons ou plus, Alpha et Arômes deviennent des lignes même si un seul les publie ; `Comparer.tsx` : la cellule inconnue dit « ? » (et non « – »). Pays : `pays.ts` (nouveau, `Intl.DisplayNames` en cinq langues, voir État de l'art ci-dessous) appliqué aux lignes Origine dans `valeursLuesDe`.
  - C61-5 : `Comparer.tsx` `meilleursDe` : un critère à cible met le vert au plus proche de la cible (`ColonneVue.cible`) ; `CarteArticle.tsx` / `FeuilleCartes.tsx` : la jauge garde son sens (c54 R22) et un trait `.cn-reglette-cible` repère la cible (`carnets.css`).
  - C61-6 : `functions/src/stylesFrancais.ts` (nouveau) : « amerikanische Ales und IPA's » donne « ales et IPA américaines » ; vocabulaire fermé, tout ou rien, idempotent. Branché dans `lienLibelles.ts` (lecture serveur) et `valeursLuesDe` (donnée déjà stockée).

## État de l'art (L29)
- Pays : problème d'école = normalisation de noms de pays (ISO 3166-1). Méthode : `Intl.DisplayNames` (CLDR, bibliothèque standard) lu pour les 676 codes en fr/en/de/it/es, index nom → code ; seuls les sigles d'usage (USA, US, UK…) sont écrits. Inconnu : texte inchangé.
- Styles de bière : vocabulaire fermé comme aromesFrancais.ts (la traduction IA libre est écartée : elle invente).
- Quantité d'un sachet : unit pricing, mêmes facteurs que prixUnitaire.ts.

## Critères
- `npx vitest run tests/unit/c61Regles.test.tsx` : 51 passent, 1 échoue (voir « Test faux »). Avant : 32 rouges.
- `npx vitest run tests/unit` (tout, sans stock exclu) : `Tests 2 failed | 13131 passed` ; les deux échecs : c61 (test faux) et `stock/murDonnees.test.ts` n°8 (src/ui/stock, hors de ma voie, autre session ; non rejoué à HEAD).
- c48..c59Regles, carnets*, propriétés, LE-1 (`carnetsLectureEcrit`), prix-houblon2 (`carnetsComparerPrix` et suivants) : verts dans cette passe (tests.log, tests-tous.log).
- tsc racine : 2 erreurs connues seulement (`seedData.ts` GanttTask, `enregistrerPwa.ts` virtual:pwa-register) ; tsc `functions/` : 0.
- BUGS : `node scripts/agents/controle-bugs.mjs` → BUGS OK ; C61-1 à C61-6, C59-6, C59-8 « corrigé en local 6f81c5bc3 ».
- Essais : un à deux par critère ; aucune capture locale (consigne : preuve en ligne).

## Test faux (cité, non modifié)
`c61Regles.test.tsx` > « fiche : une valeur déjà gardée en allemand… se lit en français » : il applique `/\bund\b|amerikanische|englische/` à tout le texte de la fiche, qui contient le nom du vendeur « Brau- und Rauchshop » (donnée réelle de la capture). La valeur de la caractéristique est bien « ales et IPA américaines » (le test voisin, `toContain`, passe). Le vendeur ne peut être caché sans défaut ; à corriger côté test (filtrer la zone « Caractéristiques »).

## Hors de « Possède » (à connaître)
- `functions/src/lienLibelles.ts` et `functions/src/stylesFrancais.ts` : écrits, car le test C61-6 appelle `traduireValeurs` du serveur (mon Possède ne cite que carnetIA.ts). Changement de 3 lignes + un module neuf, sans effet ailleurs. `carnetIA.ts` non touché.

## Doutes et limites
- « Les 50 g » d'un houblon à plusieurs sachets est une inférence (prix affiché = plus petit sachet, le plancher « dès »), pas une valeur lue sur la page. Une page qui dit le sachet de son prix (`conditionnement`) prime. Alternative plus prudente : afficher « ? ». Voir DÉCISION.
- La liste des carnets ne montre plus un prix seul parmi 2 articles dont un seul est chiffré (le test le demande : « aucun prix ne classe : la liste ne chiffre pas »). Le prix reste dans le carnet.
- La liste dit le prix dans la devise de la page (« 3,72 EUR les 50 g »), non le rendu « ≈4 CHF » du carnet (elle n'a pas le taux) ; à voir en ligne.
- Le trait de la cible sur la jauge de la feuille Articles est neuf : à regarder en ligne à 390 px (rien vu en local).
- « ? » remplace « – » pour toute cellule inconnue de Comparer (pas seulement les houblons).
- jsdom ne mesure aucune boîte : le rendu à 390 px reste à voir en ligne.

DÉCISION À PRENDRE : sachet inféré pour un houblon à plusieurs poids ? Options : (a) inférer le plus petit et le dire (fait) ; (b) laisser le prix « ? » tant que la page ne dit pas son sachet. Recommandation : (a) tant que la fiche montre la ligne Poids ; (b) si le brasseur voit un prix faux en ligne (le serveur sait lire `conditionnement` pour fermer le cas).
CONNAISSANCE : l'avis « interrompue » confondait lecture vivante (jeton gardé jusqu'à `fin`) et lecture interrompue : le signe est un jeton gardé SANS lecture en cours dans cette session (déjà dit par c61-tests) ; correctif en place.
LEÇON PROPOSÉE : un test de texte entier avec une liste de mots interdits (« und ») tombe sur un nom propre de vendeur : borner le test à la zone testée.
