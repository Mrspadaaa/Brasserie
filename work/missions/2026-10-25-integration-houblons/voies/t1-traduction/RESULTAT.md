OK — 235 mots traduits, phrases non-arôme écartées, une table pour cinq écrans ; empreinte prototype à mettre à jour

(Réserve : critère « prototype vert » non tenu, 4 tests d'empreinte rouges par un changement voulu et hors de mon périmètre : voir DÉCISION.)

## Ce qui a changé
- `src/ui/hopIndex/fiche/traduction.ts` : la table de traduction (COMPLEMENT, même forme qu'avant : clé anglaise repliée par `bas`, valeur française
  en minuscules) passe de 40 à environ 400 entrées. Nouveaux exports : `motAffiche(mot)` (le français, ou `null` si ce n'est pas un arôme),
  `estNonArome`, `estGenerique`, `GENERIQUES`. C'est la seule table : Beer Maverick garde ses étiquettes françaises (tagsFr), lues en dessous.
- Le filtre d'affichage est à l'endroit où les mots se forment, dans les cinq écrans qui les formaient chacun à leur façon :
  `fiche/donnees-matrice.ts` (matrice « lui seul » + feuille Sources, via `motsFiche`), `comparer/calcul.ts` (« Ses mots », sa table locale de 40 mots supprimée),
  `substituer/donnees.ts` (`motsHors` : « lui seul » ; `mesures().mots` : les descripteurs de la carte ; sa table `FR` de 13 mots supprimée),
  `suggerer/hors16d.ts` (« lui seul » de Suggérer ; table `FR` supprimée), `fiche/autres.ts` (« autres n % » et sa liste).
  Lignes touchées dans les fichiers de s1 : `substituer/donnees.ts` seulement (trois lignes de `mesures`/`motsHors`, l'import et la constante `FR`) ; `substituer/index.tsx` non touché.
- Le moteur (`src/domain/hopIndex/v4`) n'est pas touché : il lit le texte anglais d'origine. `moteurInchange.test.ts` vert sans modification.
- `tests/unit/hopIndexV4/traductionMots.test.ts` (6 tests).
- Voie : `inventaire.ts`, `inventaire-versfr.ts`, `paires-bm.ts` (scripts), `mots.json` (les 473 mots distincts montrés), `capturer.mjs`, `img/`.

## 1. Inventaire
- Les 318 houblons montrent 473 mots distincts (3 517 occurrences houblon × mot). Avant : `versFr` en laissait 375 tels quels, dont environ 140 sont du
  français déjà (étiquettes Beer Maverick : « agrumes », « poivre noir »…) et environ 235 de l'anglais (source : BarthHaas, Crosby, HPA, John I. Haas…).
  Après : 140 restent tels quels, tous du français, des noms propres ou des mots écrits pareil (liste du test), plus les 18 entrées non-arôme écartées.
- Les plus fréquents restés en anglais avant (occurrences) : tropical 43, green tea 19, passionfruit 17, lemon grass 10, bergamot 8, green pepper 8, marjoram 8,
  citrusy 8, net/clean 8 (non-arôme), liquorice 7, piney 7, pleasant 7, red currant 7, sweet fruit 7, yoghurt 7, camomile blossom 6, lemon balm 6, slightly spicy 6,
  apple blossom 5, bubble gum 5, gingerbread 5, herbs 5, honeydew melon 5, incense 5, pine resin 5, aniseed 4, dried fruits 4, green fruit 4, hoppy 4, jammy 4,
  mate tea 4, myrrh 4, nettle 4, orange zest 4, oregano 4, pink grapefruit 4, redberry 4, tarragon 4, artichoke 3, basil 3, citrus fruit 3, delicate 3, leek 3…
  (liste complète des 473 : `mots.json`).

## 2. Règle de tri
1. Un mot qui nomme une odeur, une saveur ou une matière (fruit, fleur, épice, herbe, bois, bonbon) est un arôme : traduit.
2. Une qualité sans objet (« agréable », « délicat », « rond », « frais », « vif », « léger », « doux », « aromatique », « houblonné ») est générique :
   traduite, affichée, mais elle ne signe aucun « lui seul » (`GENERIQUES`, la règle GENERIQUE de l'app étendue).
3. Une phrase qui dit l'amertume, l'intensité, l'absence d'arôme ou ne nomme pas l'arôme n'est pas un arôme : `NON_AROMES` (18 entrées : clean/net, bitter, neutral/neutre,
   hop, very strong, very mild, medium intensity (et sa variante tronquée), clean bitterness, coarse bittering, smooth bitterness, no distinct aroma characteristics,
   delicate hop aroma, pleasant hoppy aroma, pleasant saaz like aroma) et le motif `bitter|intensity|characteristics|good for|hop(py) aroma|saaz like`. Elle reste dans la
   donnée et sa source, mais ne se montre dans aucune liste de mots.
4. Les noms propres et mots écrits pareil restent : orange, rose, caramel, cannabis, curry, cognac, kiwi, mojito, gazpacho, sauvignon blanc… ; « dank » (terme de brasseur,
   18 houblons, aucune décision écrite trouvée : voir DÉCISION) ; une marque garde son nom (« bonbon jolly rancher »).

Cas douteux : « currant » (Hopsteiner) → groseille ; « loganberry » → mûre-framboise ; « savory » → savoureux (générique ; sarriette possible) ; « wintergreen » → gaulthérie ;
« medium intensity with evergeen » écartée (phrase tronquée, un conifère peut-être) ; « strong zesty aroma » → zesté (l'intensité est perdue) ; « noble » (27 houblons) laissé
(classe du houblon, pas un arôme, mais pas dans la règle GENERIQUE) ; « classic noble aromas. floral » → floral ; « tangy » et « crisp » → vif (même mot, deux sources).
Deux étiquettes Beer Maverick fautives sont traduites sous leur lecture probable : « citus » → agrumes, « troical fruit » → fruits tropicaux.

## Effets visibles
- Magnum (GR) : « lui seul : net, clean bitterness » devient « hors familles : aucun mot dans ses fiches » (ses deux seuls mots hors familles n'étaient pas des arômes ; vrai).
- Magnum (US) : « muscade, no distinct aroma characteristics » devient « muscade ».
- Hallertau Taurus : « chocolat, banane, curry, currant +3 » devient « …, groseille +1 » (les mots traduits se comparent entre houblons : « nutmeg » et « muscade » sont un mot).
- « autres n % » (fiche, carte de Ma bière) change pour des houblons dont des phrases non-arôme étaient comptées ou dont deux traductions se fusionnent.

## Critères
- Test : `npx vitest run tests/unit/hopIndexV4/traductionMots.test.ts` : sur la table et les écrans d'avant, 4 tests sur 6 rouges (323 mots non traduits, 111 mots anglais, 74 phrases
  non-arôme montrées, Magnum) ; après : 6/6 verts. (Rouge sur le HEAD réel non rejoué dans un arbre propre : pas de `git stash` permis ; rouge mesuré sur les écrans non encore branchés.)
- `npx vitest run tests/unit/hopIndexV4` : 508 verts sur 509. Le rouge : `complements.test.ts` « aucun fichier de src n'importe src/data/hopSources » refuse
  `src/ui/hopIndex/commun/sourcesMesures.ts`, fichier non suivi de la voie s1 ; pas le mien.
- `npx vitest run --root prototypes/houblons-v4` : 153 verts, 4 rouges (client-async.test.ts ×3, worker-calculs.test.ts ×1) : l'empreinte `remplacants` passe de 6561a4d6240b à 32e2ef725fec.
  Cause : `houblon().motsSansFamille` et `partSansFamille` (« autres n % ») sont dans l'empreinte ; ils changent parce que les mots sont maintenant traduits et triés. Aucun score ni rang :
  ces deux champs ne sont lus que par des écrans (grep : adaptateur.ts, fiche, carte). Même cas que 883e1c9b. Les trois autres empreintes (substitutes, suggerer, proposer) tiennent.
- `npm run build` : vert (B5, la taille des données, non touchée : aucun fichier de données modifié).
- `moteurInchange.test.ts` : vert, sans modification (le moteur lit l'anglais d'origine, les familles ne bougent pas).
- `tsc --noEmit` : aucune erreur dans les fichiers touchés.
- Capture : `img/magnum-us-60-avant.png` (copie de m4) montre « no distinct aroma characteristics » et « net, clean bitterness » ; `img/magnum-us-60-apres.png` (ouverte) : plus aucun mot anglais,
  téléphone 390 px ; vue longue `img/magnum-us-60-apres-long.png` ; textes lus dans la page : `img/lui-seul-apres.json`. Parcours réel dans Chrome (ajout de Magnum (US), poignée à 60′,
  Substituer). Non regardé : Comparer, Suggérer et la feuille Sources en capture (couverts par le test sur les mêmes fonctions, pas par une image).

## Essais : 1 par critère. Rouge du test d'abord, puis corrections (traduction « red currant », comparaison sans tirets) en un passage.

DÉCISION À PRENDRE : mettre à jour les empreintes `remplacants` du prototype (prototypes/houblons-v4/tests/client-async.test.ts, ligne `EMPREINTES`, et worker-calculs.test.ts) : 6561a4d6240b → 32e2ef725fec.
Options : (a) les mettre à jour comme au commit 883e1c9b (preuve : seuls les champs d'affichage « autres » changent) ; (b) garder l'ancien tri dans `autresDe` (garde des mots anglais dans « autres »). Recommandation : (a). Hors de mon « Possède », donc non faite.
DÉCISION À PRENDRE : « dank » reste tel quel (aucune décision écrite trouvée dans decisions.md, seulement la note descripteurs-hors-familles). Recommandation : l'écrire comme décision (terme de brasseur sans équivalent court), ou le traduire (« cannabique » ?).

CONNAISSANCE : les 12 sources de d4 mêlent des descripteurs d'arôme et des phrases de style (« clean bitterness », « medium intensity », « delicate hop aroma », « no distinct aroma characteristics ») : un descripteur n'est pas forcément un arôme. Les mots montrés passent tous par `motAffiche` (fiche/traduction.ts) ; tout nouvel écran qui forme des mots doit l'appeler.
LEÇON PROPOSÉE : un contrôle de langue doit porter sur tous les écrans qui forment des mots : ils étaient cinq, chacun avec sa propre table de traduction (40, 13 et 13 mots), d'où l'anglais affiché. Une table, un tri, un test sur les fonctions réelles des écrans.
