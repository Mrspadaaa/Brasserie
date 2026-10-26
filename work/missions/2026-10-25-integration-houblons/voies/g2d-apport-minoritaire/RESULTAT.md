OK — trois options d'apport minoritaire (c, m, w) mesurées, défaut inchangé à l'octet ; recommandation : c au dry hop (2 tests rouges hors voie)

## Fichiers écrits
- `src/domain/hopIndex/v4/minoritaire.ts` (nouveau) : type `ApportMinoritaire` (`'aucun' | 'c' | 'm' | 'w'`), `partDesFiches` (fiches qui citent / fiches lues).
- `src/domain/hopIndex/v4/voies.ts` : option `apportMinoritaire` ; `effectOf` et `additionEffect(…, mode)` (m : seules les familles marquées ; w : effet × part des fiches) ; `Voie.overflowRang` (c) ; `FamilyEffect.minoritaire` (m) ; `compareRankKeys` / `compareVoies` lisent `overflowRang`, la dose gardée par houblon non. Aucune clé de plus sans l'option.
  Le fichier porte aussi une modification non commitée qui n'est pas la mienne (`dryHop: { doseGL }`, de g2b) : je ne l'ai pas touchée.
- `tests/unit/hopIndexV4/apportMinoritaire.test.ts` : 21 tests.
- `scripts/eval-hop/apport-octet.ts` (défaut à l'octet contre HEAD), `scripts/eval-hop/apport-minoritaire.ts` (mesure déterministe, et `--couts=<option>`).
- Dans la voie : `rapport.md` (trois tables, recommandation), `mesure.json`, `couts-{aucun,c,m,w}.json`, `tmp-head/voies-head.ts` (copie de HEAD pour la preuve à l'octet, jetable).

## Critères (VOIE.md ; il n'y a pas de GATES.md)
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : **81 fichiers, 791 verts, 2 rouges** dans `sourcesLignes.test.tsx` (« Lotus : la rangée β… », « α et β de Lotus, Citra et Galaxy… »). Elles lisent des fichiers d'interface et de données que d'autres voies modifient en ce moment (`plagesSources.ts`, `Feuilles.tsx`, `substituer/index.tsx`, `src/data/hopSources/beeranalytics*.json`) ; le fichier d'essai n'importe ni `voies.ts` ni `hops.ts`. **Je ne l'ai pas prouvé sur HEAD** (pas de stash permis) : le pilote doit les rejouer après le commit des autres voies. Empreintes de `moteurInchange.test.ts` inchangées (vertes).
- `npm run build` : sortie 0. `npx tsc --noEmit` : aucune erreur.
- Défaut inchangé à l'octet : `npx vite-node scripts/eval-hop/apport-octet.ts` : 168 appels (120 161 795 octets : deux moteurs, deux recettes, six directions, sept jeux d'options dont k1, k3, leviers, `dryHop` + `palier60`), sha256 **dd1928ac…1989** pour HEAD, pour l'option absente et pour `'aucun'`. Rejoué après la correction de c.
- Déterminisme : deux lancements de `apport-minoritaire.ts`, `cmp` identique, sha256 **abe63fc87e0b29fe66557fa4e86d133ec688c7d1e5d99ea142b7cfa0e0dc82fe**.
- Essais : un par critère ; une correction de fond (voir doutes).

## Ce que la mesure dit (détail et tables dans `rapport.md`)
- **Référence** (21C, « plus d'agrumes », dry hop actif, départage k3, 152 houblons) : aucun → **c** / m / w : Citra 54 → **2** / 1 / 22 ; Nelson Sauvin 107 → 31 / 24 / 13 ; Mosaic 134 → 20 / 9 / 53 ; Hallertau Blanc 138 → 26 / 18 / 83 ; Galaxy 2 → **3** / **absent** / 52 ; Motueka 99 → 56 / 45 / 32.
- **Barres de q2b** (stout 16D, trois cartes ; 21C de m6) : c change 0 barre et 0 voie ; m vide 29 des 44 barres de la liste q2b (44 → 15) et remplace 3 à 6 voies ; w change jusqu'à 14 barres (−7 crans sur « Retirer Cascade ») et remplace 2 à 5 voies.
- **Substituer v2 : ne lit pas `cites`** (il lit `describeFamilies` et `marquee`) : impact nul. **Ma bière : oui** (`additionEffect`) : étiquettes qui changent sur 318 variétés, 21C 10′ 10 g : m 78, w 162 ; Citra « floral +2 » et Nelson Sauvin « végétal vert +2 » deviennent « ≈ inchangé » sous m et w.
- **Coût** : aucun écart mesurable (liste de l'app 27 à 29 ms à chaud, 109 à 112 à froid ; liste complète 946 à 1 082 ms à chaud).

## Doutes et limites
- **Correction en cours de route** : ma première version de c laissait le débordement choisir la dose de chaque houblon ; à 10′ sur la 21C, 65 houblons sur 152 changeaient de dose, donc de barres (contre « les barres ne changent pas »). Corrigé : `compareVoies(v, best, false)` dans la boucle des doses ; `dosesQuiChangent.c` = 0 dans les 24 cas ; un test à 10′ le garde.
- c est neutre à 10′ et à 60′ (le débordement y est nul ou presque, doses de 10 à 20 g) : il agit au dry hop (g2b), pas sur les listes q2b actuelles.
- Rien n'est branché : `Carte.tsx`, `legende-bande.tsx`, `suggerer/voies.ts`, `cases.ts`, l'adaptateur et le worker n'ont pas le paramètre (fichiers modifiés par d'autres voies en ce moment). Les options ne sont donc pas atteintes par un vrai parcours (L11) : mesure seulement.
- Mes jugements de crédibilité (L14) sont les miens ; le brasseur n'a rien vu. Rangs sur le catalogue complet, sans stock. Aucune interface touchée : pas de capture.
- Sous m, le pool « à acheter » et le groupe dry hop ne gardent que les houblons dont la famille visée est marquée : c'est une extension de la consigne (sans elle, le pool aurait gardé des houblons sans effet), à relire.
- Un seul réglage de seuil mesuré (la moitié des fiches, D90). Pas de variante « deux fiches » (niveau marqué de D25).

DÉCISION À PRENDRE : quoi activer, et où.
- Options : (c) seul au dry hop ; (m) partout ; (w) partout ; (c + m2) c au dry hop et, pour Ma bière et les listes à 10′, une variante m dont le seuil est le niveau « marqué » de D25 (deux fiches, ou premier descripteur) au lieu de la moitié.
- Recommandation chiffrée : **(c) maintenant, avec le dry hop de g2b** : Citra 54 → 2, Mosaic 134 → 20, Hallertau Blanc 138 → 26, Nelson Sauvin 107 → 31, Galaxy 2 → 3, 0 barre changée sur 44 à 66, 0 ms. Puis **mesurer m2** (une voie) avant de toucher Ma bière : m à la moitié des fiches retire Galaxy de « plus d'agrumes » (2 fiches sur 5) et Citra, Mosaic, Hallertau Blanc de « plus de floral ». Ne pas activer w (Galaxy 52e, Mosaic 53e, barres rétrécies de 7 crans).
- À trancher à part, hors de cette voie : **Idaho 7 et Strata sont absents de toute liste 21C** (D90 les écarte du pool : herbacé marqué 3/6 et 3/4, indésirable en Hazy). Ce sont des houblons de Hazy courants : le brasseur est à consulter avant de montrer les listes (L14).

CONNAISSANCE : une option de rang qui change la clé de comparaison change aussi la dose gardée par houblon si la boucle des doses lit la même fonction : pour un rang « seul », la dose doit lire l'ancienne clé (`compareVoies(a, b, false)`). Faits de départ : Nelson Sauvin cite végétal vert dans 1 fiche sur 9 et épicé dans 1 sur 9 ; son débordement de rang (5,35 crans) vient de végétal vert (4,4) et épicé (0,95), les deux non marquées ; Motueka garde 0,95 cran de débordement de rang par floral, marquée 4 fiches sur 7.

LEÇON PROPOSÉE : un critère écrit « les barres ne changent pas » se prouve par un test qui compare les effets voie par voie sur chaque moment, pas sur un seul : ma première version passait sur le dry hop (dose unique) et changeait 65 doses sur 152 à 10′ ; seule la mesure par moment l'a montré.
