OK — descripteurs de 12 sources en forme E (D83), D157 vert, B5 157,6 ko sous 160 ; 22 tests du prototype laissés à e2

## Fichiers écrits
- `prototypes/houblons-v4/scripts/build-data.mjs` : lit `src/data/hopSources/*.json` ; sort `descSources` (table), `descMots` (dictionnaire) et, par variété, `fiches` (forme E).
- `src/data/hopV4/proto-data.json` : régénéré. Deux passes identiques : sha256 `d04b77e7…cc72`. 556 ko brut (537 avant). 199 variétés gagnent 652 fiches.
- `src/domain/hopIndex/v4/data.ts` (chargeur seul, accordé par D83) : `descriptionsDe` et `depliee` rendent aux lecteurs les objets `{ text, context, source }` d'une description complète. DONNEES_FIXTURE les lit.
- `scripts/check-hop-budget.mjs` (valeur seule, D83) : B5 150 → 160 ko, avec le commentaire demandé.
- `tests/unit/hopIndexV4/descripteursSources.test.ts` (neuf : D157 + forme E), `moteurInchange.test.ts`, `ficheSourcesAutres.test.tsx`, `legendeBandeAutres.test.tsx`.
- Dans la voie : `rapport.md`, `rapport.ts`, `empreintes.ts`, `diff-donnees.mjs`, `mesurer-compact.mjs`, `analyse-sources.mjs`, `mots-etranges.mjs`, `faits-nugget.ts`, `explorer*.mjs`.
- Pas touché : `substitution.ts`, `hops.ts`, la formule, les tests du prototype.

## Ce que fait le build
- 11 sources primaires (BarthHaas, Charles Faram « frotté », Crosby, HPA, John I. Haas, NZ Hops, Freestyle, British Hop Association, BSG, Yakima Valley Hops, USA Hops) plus une fiche communautaire (HopDatabase et hops-json réunis). Hopsteiner et Beer Maverick étaient déjà lus.
- Une source = une fiche : mots réunis ; année = année publiée par la fiche, sinon null (0 dans la forme E) ; kind `manufacturer`, `review` (BSG, Yakima Valley Hops) ou `community`.
- Forme E : `reference` = le site de la source (`https://barthhaas.com`…) ; `title` = « <auteur> · fiche variété » ; `locator` dit que l'adresse de la fiche est dans `complements.json`. Le contexte « bière » de Charles Faram n'est pas repris (le moteur l'ignore).
- Les fiches « écartées à la fusion » restent écartées.
- Charles Faram : un texte d'icône est parfois un nom de fichier (`CharlesFaram-icon-citrus-04-lemon`, 36 fiches) ou une légende de publicité (83 fiches). On prend l'identifiant de la même place dans l'autre liste (`lemon`), sinon on omet.
- Agrégats : au plus une fiche communautaire par houblon, écartée si au moins la moitié de ses mots se retrouvent chez les sources primaires. Mesure : HopDatabase, 73 % recopiés (706/965 mots), 39 fiches entièrement recopiées ; hops-json, 43 % (111/256), 30 fiches sans aucun mot recopié. Une entrée de plus de 4 mots est une phrase de texte libre, pas un descripteur : écartée (constante du build).
- Les mots restent en anglais d'origine ; la traduction suit le chemin de l'app. La règle GENERIQUE (fruité, doux…) est celle de l'app, au rendu.

## Preuves
- **D157** : rouge sur HEAD (9 échecs sur 15). Après : `descripteursSources.test.ts` 16 sur 16, dont « forme compacte : dépliée, elle donne octet pour octet les descriptions complètes, et ré-encodée elle redonne la forme compacte » (Galaxy chez BarthHaas écrit à la main, puis toutes les variétés).
- **Deux passes de build-data identiques** : `d04b77e7…cc72` deux fois.
- **`npx vitest run tests/unit/hopIndexV4`** : 429 verts sur 430. Seul échec, déjà rouge sur HEAD : `comparerComplements.test.ts` (géraniol de Nelson Sauvin, lié à `complements.json`). `tsc` : propre.
- **`npm run build`** vert. **B5 = 157,6 ko** (149,5 avant), budget 160 : tenu. Dernières mesures : 170,7 ko en forme complète, 157,6 en forme E.
- **Empreintes** de `moteurInchange.test.ts` (les changements d'e2 sont conservés : sa ligne `substituts`, son commentaire, la v1) :
  - `donneesMoteur` `2266af7e…`, `profils` `12ada130…` ;
  - `substituts` `4db3b8f4…` : le moteur v2 d'e2 (non commité, dans l'arbre) sur les données d4 ; si e2 change encore `substitution.ts`, la recalculer avec `empreintes.ts` ;
  - preuve « seules les descriptions changent » : `sansDescriptions` `35969e33…` et `descriptionsHorsD4` `bfa3b563…`, identiques à HEAD avant et après, et un test qui les vérifie.
- **Avant/après** (`rapport.md`, sept houblons, 10 premiers de Substituer, part sans famille) :
  - fiches lues : Galaxy 1 → 5 ; Nelson Sauvin 2 → 9 ; Citra 1 → 7 ; Motueka 2 → 7 ; Mosaic 1 → 7 ; Saaz 2 → 4 ; Cascade 2 → 9 ;
  - mots sans famille, tout le catalogue : 22,8 % → 22,9 % (458/2011 → 807/3517) : le lexique est inchangé, donc les nouveaux mots ne se rattachent pas mieux ;
  - houblons à deux fiches ou plus : 85 → 210 sur 318.

## Prototype : 24 échecs sur 157, à reprendre par e2 (consigne D83 : je n'y ai pas touché)
Deux étaient déjà rouges sur HEAD (liés à e2) : `pack.test.ts:17` (chiffres du pack) et `substitution.test.ts:228` (remplaçants du pack, « pack sous 500 ko »). Les 22 autres changent par les fiches ajoutées. Ancienne valeur → nouvelle :
- `client-async.test.ts` :32, :41 ×2, :49 et `worker-calculs.test.ts` :40 : empreinte `proposer` `b42c299e6ebf` → `3584e2c7dabd` (les empreintes `substitutes` et `remplacants` sont celles d'e2 ; à recalculer avec elle).
- `donnees.test.ts` :
  - :46 résine de Nugget `{level 2, sources 2, of 4}` → marqué, 3 sources sur 10 ;
  - :143 S4, IBU d'un aromatique `< 10` → 10,1 ;
  - :181 échelle continue (valeur de l'assertion à relire) ;
  - :204 Akoya, `[['S1',46],['S5',42.5]]` → `[['S1',46],['S5',41]]` ;
  - :276 « Golding : floral de 0 à 1 cran » (Golding a maintenant 5 fiches : floral marqué 2/5) ;
  - :412 S1 « 1 non situées » → « 1 non située » (accord singulier : le compte tombe à 1) ;
  - :436 Nugget, résine `sources 2, of 4` → 3 sur 10 ;
  - :447 voie « diminuer ou remplacer Nugget » `conflits []` → un conflit ;
  - :481 `premier.spice` de Nugget `['Hopsteiner']` → Hopsteiner, Charles Faram + 1 ;
  - :487 pierre à noyau de Nugget « non décrit, of 4 » → marqué 2/10 ;
  - :512 pierre à noyau de S1 `situated` `false` → `true` ;
  - :524 `situated.stoneFruit.basis` `'non situé'` → `'modèle'`.
- `engine.test.ts`:87 « stock libre » : valeur indéfinie (à relire).
- `profil-simule.test.ts` :26 tropical de Citra au-dessus de Cascade `4 > 4` ; :65 écart à 60′ `'≈'` → 1.
- `substitution.test.ts` :81 nobles Saaz/Spalt (faux) ; :116 Golding perd les agrumes `{citrus, de 1, a 0}` → `{citrus, de 2, a 1}` (Golding gagne des fiches).
Pour rejouer : `npx vitest run --root prototypes/houblons-v4`.
Point de départ de la preuve : `sansDescriptions` identique à HEAD. Il reste à justifier chaque assertion de scénario (la valeur est-elle plus juste avec 5 à 10 fiches ?).

## DÉCISION À PRENDRE : ce qui n'est pas devenu un descripteur
- **Intensités** (BarthHaas : rose à 12 axes, 85 variétés ; Charles Faram `intensite_arome`, 157 ; British Hop Association, 34 ; Hopsteiner `arome_*`, 102) : non converties en niveaux (convention du moteur). Recommandation : les montrer à part, comme le radar Beer Maverick.
- **Catégories** (BSG et USA Hops `categoriesArome`, John I. Haas `famillesSite`) : non reprises. Elles feraient entrer USA Hops (66 variétés, catégories seules), 13 variétés de BSG et 10 de John I. Haas. Recommandation : ne pas les reprendre.
- **Prose** (`profilCourt` de Crosby 37 variétés, NZ Hops 17, Hops Direct 15) : non reprise ; 30 variétés n'ont que ça. Recommandation : plus tard, avec une découpe contrôlée.
- **Lexique** (hors voie) : gooseberry, grape, white wine, fruity, sweet restent sans famille. Option A de [[descripteurs-hors-familles]] : gooseberry → Petits fruits.
- **Freestyle Hops** : la source dit « pas de republication du texte » ; seuls des mots courts sont repris. À confirmer.
- **Adresse de chaque fiche** : la forme E ne garde que le site. Si l'interface veut un lien par fiche, il faut lire `complements.json` (`f` : source, URL, année).

## Doutes et limites
- Écarts à la consigne D83 : la forme E sans adresses ni bière ne peut pas être « octet pour octet » la forme complète que j'avais d'abord mesurée (URL de fiche et contexte bière en moins). Le test compare donc la forme dépliée à la description complète telle que la forme E la définit (`reference` = site).
- Conflit avec e2 : aucun. J'ai lu `moteurInchange.test.ts` avant d'y toucher et gardé ses lignes.
- Essais : build-data 5 (bruit Charles Faram, phrases hops-json, forme E). D157, moteurInchange et B5 au 1er essai de la forme finale.
- Aucune donnée réelle, pas de réseau, pas de Gemini.

CONNAISSANCE : Charles Faram publie deux listes d'icônes (« bière » : catégories ; « frotté » : mots), dont le texte d'icône est parfois un nom de fichier ou une légende de publicité ; HopDatabase recopie à 73 % les sources primaires, hops-json à 43 %. À verser dans `cerveau/metier/`.
LEÇON PROPOSÉE : aucune.
