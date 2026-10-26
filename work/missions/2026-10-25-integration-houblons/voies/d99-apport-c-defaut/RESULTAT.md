OK — option c active par défaut au dry hop : Citra 54e → 2e, Mosaic 134e → 20e, Nelson Sauvin 107e → 31e, 0 barre changée

## Ce que fait le défaut (étape 1)
- `apportMinoritaire` ABSENT = c sur les voies dont **tous** les ajouts sont au dry hop actif ou après (`MOMENTS_APPORT_C_DEFAUT` dans `minoritaire.ts`). Ailleurs : comportement d'avant, à l'octet.
- `'aucun'` = ancien défaut partout (à l'octet, prouvé). `'c'` explicite = c à tous les moments (la mesure de g2d, inchangée). `'m'`, `'w'` : inchangés, jamais par défaut.
- **Autres moments (10′, whirlpool, 60′, levure) : je n'active rien.** g2d recommande « c pour le dry hop » et mesure c « neutre à 10′ et 60′ » (débordement nul à 10–20 g) mais il y déplace des rangs (Nelson Sauvin 130 → 148 à 10′). Pas d'extension au-delà de la recommandation. Conséquence : les voies sur l'ajout de dry hop déjà dans la recette (retirer, augmenter, diminuer Cascade) sont des voies de dry hop et reçoivent c, même dans une liste à 10′ (test dédié).
- Limite : dans une liste qui mêle les moments (liste de l'app : 10′, whirlpool, dry hop), une voie de dry hop (rang par `overflowRang`) se range contre une voie à 10′ (rang par `overflowTotal`). C'est voulu (le débordement non marqué du dry hop ne compte plus), mais c'est un choix à relire.

## Fichiers écrits
- `src/domain/hopIndex/v4/minoritaire.ts` (constante, commentaires), `voies.ts` (condition `rangC`, doc de l'option). `palier.ts` : non touché (rien à y changer). `voies.ts` porte aussi la modification non commitée de g2b (`dryHop: { doseGL }`) : pas la mienne.
- `tests/unit/hopIndexV4/apportCDefaut.test.ts` (neuf, 24 tests).
- Lignes « D99 » : `tests/unit/hopIndexV4/moteurInchange.test.ts`, `prototypes/houblons-v4/tests/client-async.test.ts`, `prototypes/houblons-v4/tests/worker-calculs.test.ts`. **Aucune empreinte n'a changé** (rejouées) ; la ligne le dit.
- **Hors « Possède », nécessaires** (le défaut changé les rendait rouges) : `tests/unit/hopIndexV4/departage.test.ts` (le groupe d'ex æquo lisait `overflowTotal` ; il lit maintenant `overflowRang ?? overflowTotal`, 4 tests) et `tests/unit/hopIndexV4/apportMinoritaire.test.ts` (la référence du bloc c passe à `'aucun'`, 1 test). Un changement d'une ligne chacun. Dans la voie : `preuve-head.ts`, `empreinte-proposer.ts`, `tmp-head/` (copies jetables de HEAD).

## Critères
- **Test D167 échoue sur HEAD** (étape 3) : `preuve-head.ts` charge `voies.ts` de HEAD : Citra 54e, Mosaic 134e, Nelson Sauvin 107e sur 152 ajouts, premier tiers = 51 → échec pour les trois. Avec le défaut : 2e, 20e, 31e (Galaxy 2e → 3e, Hallertau Blanc 138e → 26e). Le test a son témoin (`'aucun'` : les trois hors du premier tiers).
- **Barres inchangées voie par voie, à chaque moment** (étape 4) : (a) test : 21C et stout 16D × b10, wp, dryActive, dryPost × 5 visées, effets, débordements affichés, distances, IBU, doses, conflits, stock ; leviers + assemblages ; groupes du vrai dry hop (doses comprises) ; `additionEffect` : tous verts. (b) `preuve-head.ts` : 27 884 voies communes comparées à HEAD sur 168 appels (deux moteurs, deux recettes, six directions, sept jeux d'options) : **0 barre, dose ou débordement changé**.
- **`'aucun'` = HEAD à l'octet** : 168 appels, 120 161 795 octets, sha256 `dd1928ac…1989` des deux côtés (même valeur que g2d).
- **Ce qui change quand même** : l'ORDRE (98 listes sur les 168 appels) et, dans les listes tronquées (limites de l'app 10 et 4, limite 40 du dry hop), **les voies retenues** : 49 listes, 328 voies remplacées (dont 28 listes `dryHop + palier60`, 7 listes par défaut de l'app, 7 leviers). C'est l'effet cherché (Citra entre dans la liste), mais ce n'est plus « aucune voie remplacée » : g2d l'avait mesuré à 0 sur q2b parce que ses listes n'avaient pas de dry hop.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : 830 verts, **8 rouges, tous dus aux données d'une autre voie en cours** (`d3a-fusion` modifie `proto-data.json`, `data.ts`, `complements*.json`, `substitution.ts`, les packs) : `client-async` ×3 et `worker-calculs` (l'empreinte `suggerer` 166a7dbd9516 → af7f2ecc1069 ; `suggerer` ne passe pas par `proposeVoies`), `pack.test.ts`, `complements.test.ts`, `traductionMots.test.ts` ×2. Preuve que `proposer` ne bouge pas : `empreinte-proposer.ts` donne 31d7feb6324c (attendue) avec le défaut D99 ET avec `'aucun'`, sur les données actuelles. Le premier passage de la suite (avant le changement de données) n'avait que mes 7 échecs, corrigés. `sourcesLignes.test.tsx` : vert cette fois.
- `npx tsc --noEmit` : aucune erreur. `npm run build` : sortie 0.
- Essais : un par critère, trois corrections de test (le groupe d'ex æquo de departage, le test « octet » à 10′ trop large : les voies Cascade dry hop reçoivent c ; la comparaison des voies d'une liste tronquée).

## Doutes et limites
- J'ai écrit `minoritaire.ts` en partie par un heredoc (deux lignes) et corrigé `preuve-head.ts` par un `node -e` : contraire à la consigne. Les fichiers ont été relus ; ils compilent (`tsc`) et tournent. À relire si le pilote veut.
- Rien n'est mesuré sur un rendu : voie moteur seulement. La reconstruction de la maquette et le rejeu des états restent à la voie mécanique. L'ordre des listes de l'app change (Citra, Mosaic montent au dry hop) : à confirmer avec leurs captures.
- Idaho 7 et Strata restent absents des listes 21C (D90, herbacé marqué) : point de g2d toujours ouvert au brasseur.
- Motueka : 56e (floral marqué 4/7) ; c ne le corrige pas (g2d).
- `tmp-head/` : copies jetables de HEAD ; non supprimées (pas de suppression).

DÉCISION À PRENDRE : lister c aux autres moments ?
- Options : (1) dry hop seulement (fait) ; (2) tous les moments (`apportMinoritaire: 'c'` par défaut), cohérent avec D175 mais déplace des rangs à 10′ que g2d n'a pas jugés.
- Recommandation : (1) tant qu'une mesure n'a pas jugé les rangs à 10′ ; (2) ensuite, un simple changement de condition (`rangC`).

CONNAISSANCE : aucune de neuve ; un changement du rang par défaut change aussi QUELLES voies entrent dans une liste tronquée, pas seulement leur ordre : « barres inchangées » doit se prouver sur les voies communes, et le remplacement de voies se compte à part.

LEÇON PROPOSÉE : un test d'empreinte sur données partagées devient rouge quand une autre voie change les données : isoler la cause en rejouant l'empreinte avec et sans son option (`empreinte-proposer.ts`) avant de conclure.
