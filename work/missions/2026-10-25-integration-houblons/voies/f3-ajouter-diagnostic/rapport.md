# f3 — Pourquoi « Ajouter » montre Citra cryo, Galaxy, Pacific Sunrise (D179)

Mesure : `scripts/eval-hop/f3-ajouter.ts` (déterministe, empreinte `06cffb7d9a27e451`, deux passes identiques).
Sorties : `ajouter.json` (tout le détail), `durees.json` (ms, hors empreinte). Rien dans `src/`.
Commande : `npx vite-node scripts/eval-hop/f3-ajouter.ts`. Catalogue plein de 505 variétés, stock des fixtures
(Citra cryo 65 g, Galaxy 60 g, Nelson Sauvin 100 g…), comme la capture.

## 0. Première trouvaille : la capture n'est pas une Hazy

Ce n'est ni la 21C ni la stout 16D. J'ai rejoué la liste sur les 31 styles documentés (Nugget seul, 24 L, une recette à un houblon
donne 3 propositions) : seuls **21A American IPA et 22A Double IPA** donnent « Citra cryo, Galaxy, Pacific Sunrise (à acheter),
12 g, 10′ » (18B donne Hydra au lieu de Pacific Sunrise). Sur la 21C, la liste est Galaxy, Nelson Sauvin, Belma ; sur la 16D,
Motueka, Target, Wild Wolf. Les IBU sont proches, pas égaux (+9,1 / +6,3 / +4,9 contre +8 / +5 / +4 à l'écran : son OG et son
volume réels ne sont pas connus). Les mesures portent donc sur quatre recettes : 21C, 21C à un seul houblon (24 L), **21A (la capture)** et 16D.

## 1. Les 10 premiers d'Ajouter (21A, la capture ; rang · clés `quickAddKey` · stock · α)

Clés = `[usage, conflit dégustation, poids des familles hors style, −familles attendues citées, −stock libre]`.

| # | Houblon | Clés | Stock libre | α | Ce qui le départage du suivant |
|---|---|---|---|---|---|
| 1 | Citra cryo | 0,0,0,−7,−65 | 65 g | 24,8 | familles attendues citées : 7 contre 4 |
| 2 | Galaxy | 0,0,0,−4,−60 | 60 g | 17,2 | familles hors style : 0 contre 1 |
| 3 | Nelson Sauvin | 0,0,1,−5,−100 | 100 g | 9,6 | attendues : 5 contre 3 |
| 4 | Motueka | 0,0,1,−3,−20 | 20 g | 8,1 | hors style : 1 contre 3 |
| 5 | Cascade | 0,0,3,−7,−60 | 60 g | 6,5 | attendues : 7 contre 6 |
| 6 | Idaho 7 | 0,0,3,−6,−20 | 20 g | 12,7 | attendues : 6 contre 5 |
| 7 | Hallertau Blanc | 0,0,3,−5,−30 | 30 g | 9,5 | usage : « attesté » contre « cohérent » |
| 8 | Sabro | 1,0,1,−4,−30 | 30 g | 13,4 | familles hors style : 1 contre 2 |
| 9 | Target | 1,0,2,−5,−5 | 5 g | 11,3 | dernier du stock |
| 10 | Pacific Sunrise (à acheter) | 0,0,0,−6,0 | 0 | 13,5 | 1er des 489 « à acheter » ; Belma et Krush à −5 |

Dans ces 10 premiers, **aucun départage ne tombe sur le stock** (5e clé) : tous se jouent sur les quatre clés de style.

Le détail des 10 premiers pour les 8 cas (4 recettes, avec et sans dégustation) est dans `ajouter.json` (`cas[].dix`, `cas[].dixAchats`).

## 2. Pourquoi Citra cryo est 1er : ni le stock, ni l'α, mais le nombre de familles attendues citées

Preuves par ablation (21A) :
- α du lot de Citra cryo ramené de 24,8 à 5 % : **rang 1 inchangé**. L'α n'est dans aucune des 5 clés (`quickAdd.ts` l. 124).
- Tous les stocks à 50 g : **Citra cryo reste 1er**.
- Aucun stock : **Citra (pellets) est 1er**, Pacific Sunrise 2e.
- Cause : la 4e clé, `-supports.length` (l. 124), compte les familles « attendues » du style citées par les fiches. Citra en cite 7
  en IPA, le maximum du stock, avec 0 famille hors style. Un compte, sans niveau : une famille citée par une seule fiche pèse autant qu'une marquée.
- Le stock (5e clé) ne départage que les ex æquo de toutes les autres clés : aucun dans les 10 premiers de la 21A.
- Citra cryo n'est pas 1er partout : 3e sur la 21C (hors style 3), 4e sur la 16D. Sa place de la capture tient au style IPA.

**D174** n'est pas violée par le tri : les clés de style de Citra cryo et de Citra (pellets) sont identiques dans les trois recettes
(`clesDeStyleIdentiques: true`). Elle est contournée par omission : `quickAdd.ts` l. 79 écarte du catalogue toute variété dont une
forme est en stock (`!inStock.has(c.id)`). Citra (pellets) n'est donc **jamais candidate** tant que Citra cryo est au stock. C'est
le seul cas des 505 (`varietesCacheesParLeStock: ["beermaverick-citra"]`).

## 3. D'où viennent 12 g et 10′

- **10′** : `Ajouter.tsx` l. 44 passe `aromatique: true` ; `quickAdd.ts` l. 77 (`bitter = !options.aromatique && …`) et l. 88
  (`moment = bitter ? 'b60' : 'b10'`) en font 10′ pour **tous** les houblons, quel que soit leur rôle ou le style. Origine : D40
  (pilote, 24.10, réversible : « propositions aromatiques, 10 g à 10′, jamais de compensation à 60′ »). `Ajouter.tsx` l. 49
  (`momentDe`) et l. 88 (`Math.min(ebu, minutes)`) le recopient.
- **12 g** : `quickAdd.ts` l. 94 à 96 : `searchDoses('b10')[0] × volume` = **0,5 g/L × 24 L**. Le 0,5 vient de
  `src/data/hopSolverBootstrap.json` l. 157 à 163 (`searchDosesGL`, ébullition) : « Points de départ et contraintes du solver
  aromatique », auteur « L'Affinée — hypothèses de formulation assistées par IA », genre « judgment ». C'est la plus petite dose de
  recherche du solveur, **pas une dose de style** (même constat pour le dry hop dans `palier.ts` l. 2 : aucune source de dose par style dans le dépôt ; non cherché pour le 10′).
  Sur 20 L : 10 g. Plafonnée au stock libre : seul Target (5 g) y échappe.
- Doses distinctes dans toute la liste : `[12, 5]`. Un seul moment : `10′`. Même masse pour un Citra cryo à 24,8 % (+9,1 IBU) et un
  Motueka à 8,1 % (+3,2 IBU) : l'α ne règle pas la dose, il ne fait que changer l'IBU affiché. Le facteur de forme du cryo
  (concentré) est inconnu des données (`data.ts` : « marge de forme inconnue ») ; 12 g vaut donc pour pellets et cryo.
- Le plafond de la bande d'IBU (rien dans la règle) n'aurait rien changé : l'ajout ne dépasse la bande dans aucun des 10 premiers
  des 4 recettes.

## 4. Les coupes avant le rang

Le moteur ne coupe presque rien ; c'est l'écran qui coupe.

| Où | Ce qui est coupé | Nombre (21A) |
|---|---|---|
| `quickAdd.ts` l. 79 | variété dont une forme est en stock (Citra) | 1 sur 505 |
| `quickAdd.ts` l. 80 | variétés exclues par les goûts | 0 ici (le brasseur n'en exclut aucune) |
| `quickAdd.ts` l. 120 à 121 | rien : `catalogueLimit: 10000` | 0 |
| `Ajouter.tsx` l. 85 | houblons déjà dans la recette, goûts « exclure » (après le rang) | 1 (Nugget) |
| `Ajouter.tsx` l. 108 à 112 | n = 4 − ajouts : 3 lignes, dont **un seul** « à acheter » | **502 sur 505 non montrés** |
| `Ajouter.tsx` l. 94 | la recherche tape 4 résultats | — |
| épuisés | jamais proposés sans recherche (7 à 8 : Nectaron, Lotus, East Kent Goldings…) | 7 |

Les 489 « à acheter » ne se disputent qu'une place, derrière les houblons du stock : un houblon du stock « cohérent » ou même
« hors style » passe devant le meilleur achat (`Ajouter.tsx` l. 111). Dans ce même ordre, `quickAdd.ts` l. 114 (c7) ne départage que
les ex æquo par `peuDeDonnees`, puis par le nom : Pacific Sunrise n'en dépend pas (rang 1 seul). Groupes de clés identiques parmi les
« à acheter » : 67 (21A), 112 (21C), 48 (16D) ; sur la 16D, Wild Wolf et Yakima Cluster sont ex æquo et le nom départage.

## 5. Le rang de huit houblons phares (rang dans sa liste ; « stock » : 8 ou 9, « achat » : 489)

| Houblon | 21C | 21C, dégustation simulée | **21A (capture)** | 16D | 16D, dégustation du 18.10 |
|---|---|---|---|---|---|
| Citra (cryo) | stock 3 | stock 5 | **stock 1** | stock 4 | stock 5 |
| Nelson Sauvin | stock 2 | stock 2 | stock 3 | stock 9 | stock 9 |
| Motueka | stock 5 | stock 3 | stock 4 | stock 1 | stock 1 |
| Mosaic | achat 25 | achat 25 | **achat 23** | achat 231 | achat 233 |
| Galaxy | stock 1 | stock 1 | stock 2 | stock 8 | stock 8 |
| Strata | achat 377 (hors style) | achat 377 | achat 30 | achat 204 | achat 123 |
| Krush | achat 12 | achat 14 | achat 2 | achat 328 | achat 329 |
| Nectaron | épuisé 1 | épuisé 1 | épuisé 2 | épuisé 7 | épuisé 7 |

(La 21C à 20 L donne les mêmes rangs que la 21C à 24 L. La dégustation de la 21C est **simulée** (résine marquée) ; celle de la 16D est la
phrase réelle du 18.10. Sur la 21A elle ne change rien : la résine n'y est pas « trop ».)

Ce que ça dit (L14) : Mosaic, phare d'une IPA, est 23e des achats de la 21A et 25e de la 21C, derrière Pacific Sunrise, Belma,
Dolcita, HBC 692… Cause : la 3e clé (`offStyleWeight`, l. 86) compte les familles **neutres** comme les indésirables : Mosaic cite
2 familles neutres en 21A (poids 2), Galaxy 0. Une famille neutre du style n'est pas un défaut, et ce poids passe **devant** les familles attendues.
Strata, hors style en Hazy (herbacé), était déjà signalé (D93) : à montrer au brasseur, pas à corriger ici.
Sur la stout, la tête des achats (Wild Wolf, Yakima Cluster, Marco Polo, Sun, Teamaker) est celle que D105 point 1 a déjà rejetée ;
les Goldings, Hersbrucker et Saaz n'arrivent au rang 1 des achats que sous K2 et K3 (variantes ci-dessous).

## 6. Durées (Node, `vite-node`, un seul fil ; Chrome sera plus lent : D134 avait mesuré 66 ms dans le navigateur)

| Mesure | 317 variétés | 505 variétés |
|---|---|---|
| `quickAdds`, recette nouvelle (médiane de 9) | 9,8 ms | 13,1 ms |
| premier calcul, contexte neuf | 14 à 20 ms | 14 à 34 ms |
| dont `ibuByMoment` sur toutes les lignes (l. 106) | 2,4 ms | 3,5 ms |
| trier 505 lignes avec une variante de clé | 0,16 ms | 0,21 ms |

La mémoire de `Ajouter.tsx` l. 39 à 47 (24 recettes) garde le coût d'un seul calcul par recette.

## Les variantes de tri testées (ordre seulement ; 21A, 21C, 16D, sans dégustation)

K0 actuelle. K1 : seules les familles indésirables pèsent (poids niveau). K2 : K1 et les attendues comptées par niveau
(marqué 2, cité 1) au lieu de leur nombre. K3 : K2 et les neutres en léger frein **après** les attendues.

| Écran (stock, stock, achat) | 21C (écran) | 21A (capture) | 16D |
|---|---|---|---|
| K0 | Galaxy · Nelson Sauvin · Belma | Citra cryo · Galaxy · Pacific Sunrise | Motueka · Target · Wild Wolf |
| K1 | Citra cryo · Galaxy · Belma | Citra cryo · Cascade · Amarillo | Idaho 7 · Cascade · Ahtanum |
| K2 | Citra cryo · Galaxy · Belma | Cascade · Citra cryo · Chinook | Cascade · Idaho 7 · Golding |
| K3 | Galaxy · Citra cryo · Belma | Cascade · Citra cryo · Chinook | Target · Idaho 7 · Whitbread Golding Variety |

Mosaic (achat, 21A) : K0 23, K1 1, K2 2, K3 2. Mosaic (21C) : 25, 19, 18, 19. Citra cryo (21A) : 1, 1, 2, 2.
Le détail (stock et achats, 8 premiers, les 8 phares) est dans `ajouter.json` (`cas[].alternatives`).
**Pas de vérité de référence** pour l'ordre d'Ajouter : ces trois recettes ont servi à choisir, et à juger. À éprouver sur les 28 autres
styles (D77) avant d'adopter, avec le rang des phares comme témoin.

---

## DÉCISION À PRENDRE

Ce qui ne change que l'ordre (**sans lui**, D102) : P1, P2, P3. Ce que l'écran montre (**mini maquettes**, règle n° 1) : P4, P5.

**P1 — Un tri qui ne confond plus « neutre » et « hors style » (ordre seul).** Remplacer la clé 3 (`offStyleWeight`) par les
seules familles indésirables, compter les attendues par niveau, et garder les neutres en frein après (K3).
- Écran : l'ordre des lignes change (Mosaic de 23e à 2e des achats en IPA ; Citra cryo de 3e à 2e du stock en Hazy ; Whitbread Golding,
  Hersbrucker, Golding en tête des achats de la stout, à la place de Wild Wolf et Yakima Cluster). Aucune ligne, aucun mot, aucune dose ne change.
- Coût : +0,2 ms (tri de 505 lignes), pas de nouvelle donnée. Fichier : `quickAdd.ts` l. 86 et 124, `QUICK_ADD_RULE` l. 24 et son test.
- Recommandation : K3 (K1 est le minimum : il ne touche pas aux attendues et garde Citra cryo en tête de l'IPA ; K2 met Cascade devant).
  À rejouer sur les 28 autres styles et à confronter aux phares avant de porter (L14, D77).

**P2 — Citra (pellets) redevient candidate (ordre seul sur le moteur ; l'écran le montre, voir P4).** `quickAdd.ts` l. 79 : comparer
par clé et non par variété (`!stockKeys.has(c.id)`). Les clés de style de la forme et de sa variété sont identiques : la forme n'est
jamais placée devant sa variété par l'α ni par le stock, qui ne départage que des ex æquo (D174).
- Écran : en IPA, « Citra » (à acheter) apparaîtrait comme premier achat, à côté de Citra cryo. C'est le sujet F de D102 (sélecteur
  « Citra · pellets / cryo ») : **mini maquettes**, pas avant. En attendant, ne rien changer, ou écrire la règle actuelle dans `QUICK_ADD_RULE`.
- Coût : +1 ligne sur 505, 0 ms mesurable.

**P3 — Calculer `ibuParMoment` seulement pour les lignes qui l'affichent (ordre et écran inchangés).** `quickAdd.ts` l. 106 le
construit pour 505 lignes puis le supprime l. 119 pour les épuisés et le catalogue.
- Écran : aucun. Coût : −2,4 ms (317) à −3,5 ms (505) sur 10 à 13 ms, soit un quart de `quickAdds`. À faire avec P1 : la fluidité est bloquante (D105).

**P4 — Ce que montre la liste : places et formes (écran → mini maquettes).** Aujourd'hui : 3 lignes (n = 4 − ajouts), un seul achat,
un houblon du stock « hors style » avant le meilleur achat, aucun épuisé hors recherche. Options à montrer : A actuelle ; B deux
achats quand le stock a un « hors style » en tête ; C les formes d'une variété sur une ligne (lié à P2).
- Coût : nul sur le moteur ; l'écran ne calcule déjà que ce qu'il montre.

**P5 — La dose et le moment par défaut (écran → mini maquettes).** Aujourd'hui : 10′ et 0,5 g/L pour tous (12 g à 24 L), même pour
un houblon d'abord amérisant (East Kent Goldings, rôle « amérisant »), même masse pour α 24,8 % et α 8,1 % (+9,1 contre +3,2 IBU).
Ce n'est pas une règle de style : c'est la plus petite dose de recherche du solveur (hypothèse de l'Affinée).
- A : garder 10′ et 0,5 g/L, l'écrire comme « dose de départ, pas une dose de style » dans la règle et au toucher (coût 0 ms).
- B : plafonner la dose pour que l'ajout reste dans la bande d'IBU du style (jamais atteint dans les 4 recettes mesurées ; coût
  quasi nul, une `additionIbu` par ligne affichée).
- C : un moment par rôle (amérisant à 60′, aromatique à 10′, double à 10′) : va contre l'esprit de D40 (« jamais des doses de compensation à 60′ ») ; à lui de dire.
- Recommandation : A tout de suite (honnêteté de la valeur), B et C en mini maquettes 3 variantes avec 3 houblons (Citra cryo,
  Motueka, East Kent Goldings). La dose de 12 g des formes cryo reste une hypothèse tant que leur facteur est inconnu.

**P6 — Un test à écrire avant de porter.** Un témoin « aucun houblon d'une même variété devant sa forme », et un témoin des phares
en tête de liste par style (Mosaic parmi les 5 premiers achats de la 21A), sur 31 styles : coût 31 × 13 ms = 0,4 s en test.
