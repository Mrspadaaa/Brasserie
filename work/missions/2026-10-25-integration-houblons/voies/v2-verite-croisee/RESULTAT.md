OK — inventaire des sources uniques, couverture croisée chiffrée, trois options de panel pour le conseil

# V2 RAPPORT — où une seule source décide encore (31.10)

Audit en lecture seule. Rien n'est écrit dans `src/` ni `src/data/`. Les scripts de mesure sont dans la voie (`mesure.mjs`, `mesure2.mjs`,
`mesure3.mjs`, résultats `mesures*.json`). Rejeu : `node work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesure.mjs`
depuis la racine (puis `mesure2.mjs`, `mesure3.mjs`).

**Version mesurée.** HEAD 4ba72962 à 4c4a81e6 plus l'arbre de travail. Les 20 sources suivies par git donnent les mêmes chiffres sur HEAD
(vérifié : `git archive HEAD` extrait dans un dossier temporaire, rejeu identique pour α, β, cohumulone, huile, myrcène, linalol et les
distributions de sources). **Beer Analytics (435 fiches) n'est pas suivi par git** (`?? src/data/hopSources/beeranalytics-*.json`) : tout
chiffre « avec Beer Analytics » vient de l'arbre de travail. La voie c9 modifiait en parallèle `alias-noms.json` (45 alias à HEAD, 51 dans
l'arbre), `rattachement.mjs`, `build-data.mjs` et les ajouts (188 à HEAD, 180 dans l'arbre à ma dernière lecture) : les numéros de ligne de
ces fichiers peuvent bouger de quelques lignes.

## Ce qu'il faut retenir (cinq faits)

1. **Beer Maverick (BM) est le pivot de l'identité, pas seulement une source de valeurs.** 1 444 des 2 832 fiches (51 %) sont rattachées
   par un `varietyId` `beermaverick-*` posé à la collecte ; 931 autres par un nom ou un alias cherché dans le catalogue BM ; 273 fiches forment
   les 188 « ajouts » définis comme *absents de BM* ; 105 fiches (18 noms : Perle, Saaz, Magnum, Northern Brewer, Brewer's Gold, Goldings,
   Hallertauer…) restent « à confirmer » parce que BM sépare ces variétés par pays (`perle-gr`, `perle-us`…).
2. **Les valeurs de 317 variétés viennent de BM, et 71 d'entre elles (α) n'ont aucune autre source.** Le moteur lit `alpha`, `beta`, `oil`,
   `oils.*`, `cohumulone`, `purpose` et `bm.arome` de BM ; les autres sources n'arrivent que dans `complements.json` (chargé à la demande,
   lu par Comparer et la feuille Sources, jamais par le moteur).
3. **Une étiquette fausse existe déjà pour les 188 ajouts** : leur plage (enveloppe des sources) est étiquetée « Beer Maverick » et leur
   première URL de source (Hopslist, Yakima…) est montrée comme « Beer Maverick · nom » (voir I18 à I20). À confirmer par une capture.
4. **Le nombre de sources surestime la confiance** : pour l'α, 5,6 sources en moyenne mais 3,6 plages *distinctes* ; 117 variétés sur 140
   (≥ 3 sources) ont au moins deux sources qui recopient la même plage (Citra 11–13 chez BSG, HPA, John I. Haas, Yakima…).
5. **BM n'est pas faux, il est seul.** Contre la médiane des autres sources, l'écart de son milieu d'α est de 2 % (médiane) mais 1,2 point au
   90e centile ; sa plage sort de l'enveloppe des autres dans 21 % des cas (α). Prendre le centre du panel plutôt que le milieu de BM déplace
   l'α de plus de 5 % pour 30 variétés sur 133 (23 %), de plus de 10 % pour 12 (9 %) ; pour l'huile, plus de 10 % pour 27 %.

---

## 1. Inventaire : où une seule source fait foi

Colonnes : fichier:ligne — source unique — ce que voit le brasseur — sources qui croiseraient. Les lignes de `src/` sont celles de l'arbre au
31.10. « BA » = Beer Analytics, « HS » = Hopsteiner.

### 1.1 L'identité des variétés

| # | Fichier:ligne | Source unique | Effet pour le brasseur | Croiser avec |
|---|---|---|---|---|
| I1 | `src/data/hopV4/proto-data.json` (317 variétés), `prototypes/houblons-v4/scripts/build-data.mjs:19-22,48-51,223-237` | Les ids `beermaverick-*` : la variété existe parce que BM la liste. Ils sont dans 58 fichiers de tests (271 occurrences), 55 scripts, 11 fichiers `src/` (30 occurrences), 31 fichiers de prototypes | Une variété que BM ne liste pas n'est pas du catalogue de base | Les 20 sources + BA : 252 noms distincts hors BM (188 + 64 que seule BA ajoute) |
| I2 | `catalogue-ajouts.json` ; `build-data.mjs:284-303` ; `src/domain/hopIndex/v4/data.ts:116-134` | Les « ajouts » = *absents de BM* (c6). 163 des 188 sont marqués `peuDeDonnees` ; 157 ont une seule source, 52 n'ont aucune source hors index Brewer's Friend (donc aucune valeur chimique) | Ils sont chargés à part, rangés après les variétés BM à égalité (voir I12), et étiquetés BM (I18) | Mêmes sources, mais comptées pour *toutes* les variétés |
| I3 | `src/data/hopV4/rattachement.mjs:25` (`SOURCES_NOMS`), `:123` (`indexer`), `:144` (`resoudreNom`), `:185-194` (`analyser`, règle 1 « collecte ») | Le rattachement lit un catalogue de base = les noms et alias BM ; BA n'y est pas | 105 fiches non rattachées (18 noms) : Perle, Saaz, Magnum, Northern Brewer… comptent moins de sources qu'elles n'en ont | Une identité par nom + origine, sans catalogue de référence |
| I4 | `src/data/hopV4/alias-noms.json` (45 alias manuels à HEAD, 5 synonymes, `idsFusionnes`) ; `rattachement.mjs:133` (`verifierTable`) | Chaque cible d'alias doit exister dans le catalogue BM, sinon le build échoue | Un synonyme sûr entre deux sources hors BM ne peut pas être exprimé | Table d'alias indépendante du catalogue |
| I5 | `build-data.mjs:118-120` (`analyser(..., bmBase…)`) | 51 variétés BM n'ont aucune autre source (30 avec BA) : Aloha Blend, Arcadian, Astra, Boomerang, Hartwick, Independence, Marco Polo, Zamba Blend… (plusieurs sont des mélanges, pas des variétés) | Elles s'affichent comme des variétés égales aux autres ; rien ne dit « 1 source » | Aucune (même BA ne les connaît pas) |
| I6 | `scripts/collecte-hop/typicite-styles.mjs:31` (`ALIAS_BA`), `:62` ; `src/domain/hopIndex/v4/typicite.ts:41,76` | Le lien BA ↔ catalogue passe par l'id BM (`varietyId` de la fiche BA, ou un alias écrit à la main : seulement East Kent Golding) | 140 fiches BA avec des données de style n'ont aucune typicité, dont 11 à plus de 1 000 recettes (voir 2.5) | L'analyseur de I3 les rattacherait (6 sur 11), les autres sont des noms « à confirmer » |

### 1.2 Les valeurs

Source de chaque champ du catalogue (`build-data.mjs:223-237`) : α, β, huile, myrcène, humulène, caryophyllène = `analysis` du pack BM
(« agrégat de plages historiques de fournisseurs », lui-même une compilation) ; cohumulone, farnésène, « autres huiles », `purpose`, `bm.*`
= la page BM (`hopBeerMaverickFiches.json`) ; linalol, thiols, `hs.*` = HS ; mots = BM + HS + 11 sources de mots ; `usage` = fournisseurs
(IPA seulement).

| # | Fichier:ligne | Champ et source unique | Effet pour le brasseur | Croiser avec |
|---|---|---|---|---|
| I7 | `data.ts:217`, `ui/hopIndex/parcours/donnees.ts:127` | α retenu = milieu de la plage BM (« plage variétale (Beer Maverick) »), quand il n'y a pas de lot en stock | Le calcul des IBU, la dose et l'α affiché partent de ce seul milieu | `complements.json` : 18 sources ; BA (390 variétés) ; Brewer's Friend (290) |
| I8 | `substitution.ts:119` (`plagesDe`) | α, β, cohumulone, huile, myrcène, humulène, caryophyllène, farnésène : plage BM seule ; linalol : HS seul | Les 13 variables de Substituer ; le linalol est vide pour 363 variétés alors que 142 en ont une valeur dans les sources | `complements.json` (linalol : 142 variétés) |
| I9 | `departage.ts:44` | Myrcène BM = « signal d'huile » du résineux, départage k1/k2 | Ordre des voies à distance égale | 348 variétés ont un myrcène, 108 avec 4 sources ou plus |
| I10 | `departage.ts:49` ; `fiches.ts:33` | Huile totale : HS d'abord, sinon BM | Départage k1 | 392 variétés avec une valeur, 118 avec 4 sources ou plus |
| I11 | `substitution.ts:20-21,48-49` | Poids de Substituer « fixés sur la moitié d'apprentissage des substituts BM, jugés sur l'autre » : le banc *est* BM | Le classement de Substituer imite BM par construction | HS (substituts), Hopslist, Hops Direct, Yakima (listes de substituts) ; le banc D102 D |
| I12 | `hops.ts:249`, `voies.ts:344`, `substitution.ts:456`, `quickAdd.ts:122,133` | `peuDeDonnees` (< 2 sources, ou pas d'α) : départage défavorable à égalité | Une variété d'une seule source passe après une variété documentée *à égalité* (D175). Montrée, mais reculée. Le brasseur (31.10) a dit de ne pas se limiter ; à trancher | — |
| I13 | `data.ts:60-62` (`purpose`), `voies.ts:476-477` (`infoPalierDe`, `rangUsageDe`), `palier.ts:5-9` | L'usage à 60′ (amérisant, double, arôme) = l'étiquette BM `purpose` ; option `palier60` | « Amérisant ou double usage avant arôme » à 60′ ; 317 variétés ont une étiquette BM, 0 ajout | BA `usage-types` (423 variétés), Brewer's Friend `emplois` (290), Hopslist (248), HopDatabase (189), hops-json (115) |
| I14 | `substitution.ts:342,350` (D106) | Même étiquette BM : un `purpose: aroma` est reculé comme amérisant à Substituer | Falconer's Flight, Altus, Akoya… reculés par l'étiquette | Idem I13, en continu ([[role-continu]]) |
| I15 | `palier.ts:12-15` (R4), `voies.ts:42-43,435-438` | R4 d'origine = usage BM ; t3 (en cours) l'a remplacé par la part au frais de BA (97 variétés, toutes BM) | Au whirlpool et au dry hop, l'ordre dépend de BA pour 97 variétés, la médiane pour les 408 autres | BA, Brewer's Friend, `hopStyleUsage` |
| I16 | `departage.ts:7,14-17,29-32,50-54,78` (k3, **défaut de Suggérer**) ; `intensite.ts:1,6` (option, défaut `false` : `voies.ts:31`) ; `substitution.ts:174` (radar à 0,1 de l'arôme) | Le radar d'arôme BM (9 axes, 0 à 5) : 181 variétés BM sur 317, 0 des 188 ajouts | 324 variétés sur 505 (64 %) n'ont pas de radar et passent *après* celles qui en ont dans le défaut k3k1. Le brasseur a pris ce radar comme référence (27.10) : c'est son choix, à croiser sans le supprimer | HS `arome_*` (102), BarthHaas `rose` (97), Charles Faram `intensite_arome` (157) : 169 variétés ont une autre échelle d'arôme, dont 33 sans radar BM ; échelles à normaliser |
| I17 | `hops.ts:186,224-225`, `fiches.ts:57-59`, `substituer/donnees.ts:208` (`motsSource: 'Beer Maverick'`) | Mots : BM d'abord et traduits ; 90 variétés BM n'ont que les mots BM, 140 ajouts sur 188 n'en ont aucun | Les familles du moteur (12) et la fiche partent des mots ; déjà croisés pour 221 variétés (≥ 2 sources) | 11 sources de mots, HS ; voir 2.4 |

### 1.3 Les écrans qui montrent une source comme la vérité

| # | Fichier:ligne | Ce qui s'affiche | Problème |
|---|---|---|---|
| I18 | `ui/hopIndex/fiche/sources.ts:122,140-142,166,176` ; `domain/hopIndex/v4/fiches.ts:21,34` | Pour une variété ajoutée, la ligne d'α, β, huile, composants et cohumulone est étiquetée **« Beer Maverick »**, avec `c.url` (première URL de source : Hopslist, Yakima, Brewer's Friend, HS…) et `c.bmYear` = null | Mauvaise attribution (lu dans le code, à confirmer par une capture de la fiche d'un ajout, p. ex. Ahil → page Hopslist) |
| I19 | `sources.ts:140` (`liensDe`) : `poser('Beer Maverick', …)` est inconditionnel | Une ligne « Beer Maverick · Ahil » dont le lien mène à Hopslist | Idem I18 |
| I20 | `data.ts:217` ; `ui/hopIndex/parcours/donnees.ts:127` | `from: 'plage variétale (Beer Maverick)'` pour *tous* les ajouts, dont l'α est l'enveloppe des sources | Idem I18 (profil-simule.ts:421 recopie ce `from`) |
| I21 | `sources.ts:201-206` ; `SourcesFiche.tsx:137,152-153,202-208,226-229,252-261` | Usage, propriétaire, rapport α/β, stockage, radar, styles, substituts, accords : tous BM, étiquetés *Beer Maverick* (étiquetage honnête pour les 317) ; « cohumulone : Beer Maverick l'indique Unknown » | Honnête pour les 317 variétés BM ; absent ou mal étiqueté pour les ajouts |
| I22 | `ui/hopIndex/commun/sourcesMesures.ts:17,40-46` ; `comparer/valeurs.ts:76-96` ; `comparer/Huiles.tsx:36-47` | Comparer et Substituer : BM + HS + 18 sources, **déjà un panel**, mais en enveloppe min–max sans nombre de sources, sans écart ni poids ; le myrcène, l'humulène et le caryophyllène du catalogue sont étiquetés BM | Le plus proche du principe. Il manque le « 1 source », le nombre et l'écart |
| I23 | `ui/hopIndex/fiche/MarquesVue.tsx:33-52` | « peu de données » (drapeau `peuDeDonnees`) | Le brasseur a demandé « 1 source », pas « peu de données » : le texte est à changer |
| I24 | `src/domain/hopIndex/v4/pouvoir.ts`, `composes-houblon.json` | 8 variétés, plusieurs sources par composé, BM (`bm-*`) n'est qu'un vote | Déjà un panel (aucune action) |

---

## 2. Couverture croisée, mesurée

### 2.1 Les 505 variétés (317 BM + 188 ajouts), valeurs chimiques

Nombre de variétés ayant la valeur dans 0, 1, 2, 3, 4 sources ou plus. « BM compris » : BM compte pour une source quand il publie le champ.
« Sans BM » : seulement les 18 sources de `complements.json`, valeurs valides (ni hors enveloppe `h-*`, ni suspectes `s-*`). Hopsteiner du catalogue
et source `hopsteiner` des compléments ne sont comptés qu'une fois.

| Champ | Variétés avec ≥ 1 valeur | BM compris : 0 / 1 / 2 / 3 / 4+ | Sans BM : 0 / 1 / 2 / 3 / 4+ | Écart entre sources (milieux), médiane · p90 | Relatif, médiane · p90 |
|---|---|---|---|---|---|
| α | 429 | 76 / 166 / 90 / 37 / 136 | 147 / 175 / 44 / 25 / 114 | 0,75 pt · 2,5 pt | 10 % · 30 % |
| β | 418 | 87 / 161 / 90 / 33 / 134 | 155 / 173 / 42 / 32 / 103 | 0,35 pt · 1,5 pt | 7 % · 29 % |
| cohumulone | 381 | 124 / 138 / 90 / 39 / 114 | 180 / 163 / 45 / 35 / 82 | 0,5 pt · 4,5 pt | 2 % · 13 % |
| huile totale | 392 | 113 / 150 / 88 / 36 / 118 | 184 / 160 / 41 / 34 / 86 | 0,25 mL · 1,15 mL | 19 % · 68 % |
| myrcène | 348 | 157 / 133 / 69 / 38 / 108 | 212 / 141 / 40 / 36 / 76 | 5 pts · 20 pts | 10 % · 53 % |
| linalol | 142 | 363 / 71 / 35 / 16 / 20 | idem (BM n'en publie pas) | 0,15 pt · 0,55 pt | 21 % · 86 % |

Valeurs écartées de l'enveloppe (non comptées ci-dessus), toutes variétés : α 354 « hors » (unité ou base absente) et 18 suspectes ; huile
504 « hors » et 94 suspectes ; cohumulone 312 et 10 ; myrcène 20 et 53. Ce sont les écarts que `fusion.mjs` signale déjà (`s-consensus-N`,
`s-ecart`).

**Variétés dont la valeur ne tient qu'à une source** (`mesure2.mjs`) :

| Champ | Variétés BM dont BM est seule | Variétés BM avec BM + 1 autre | Ajouts avec valeur | dont une seule source |
|---|---|---|---|---|
| α | 71 sur 317 | 80 | 112 | 95 |
| β | 68 sur 310 | 80 | 107 | 92 |
| cohumulone | 56 sur 286 | 81 | 94 | 82 |
| huile | 71 sur 300 | 81 | 92 | 79 |
| myrcène | 55 sur 257 | 63 | 77 | 68 |
| linalol | 0 (BM n'en publie pas) | 0 | 15 | 7 |

**Plages distinctes** (variétés à ≥ 3 sources) : α 5,6 sources pour 3,6 plages distinctes (117 variétés sur 140 ont au moins deux plages
identiques) ; β 5,4 pour 2,9 (125 sur 136) ; huile 5,0 pour 3,3 (97 sur 121) ; cohumulone 4,8 pour 2,4 (106 sur 117) ; myrcène 4,5 pour 2,8
(93 sur 112). Les fournisseurs et distributeurs recopient une même fiche : le nombre brut de sources n'est pas la confiance.

**BM contre les autres sources** (au moins 2 autres sources) :

| Champ | n | Écart médian du milieu BM à la médiane des autres | 90e centile | Plage BM hors de l'enveloppe des autres |
|---|---|---|---|---|
| α | 166 | 0,25 pt (2 %) | 1,2 pt | 21 % |
| β | 162 | 0,13 pt (2 %) | 0,55 pt | 14 % |
| cohumulone | 149 | 0 | 3 pts | 14 % |
| huile | 148 | 0,10 mL (7 %) | 0,48 mL | 20 % |
| myrcène | 139 | 1,25 pt (3 %) | 12,5 pts | 22 % |

Cas où BM s'écarte (α) : Triskel BM 3–9, cinq autres sources 2,5–5,5 (milieu 4,0) ; Dana BM 7,2–13, autres 11–15,7 ; Opal BM 5–14, autres
6,5–13,5. Cohumulone : Aramis BM 20–42, autres 21–24,5. Huile : Kohatu BM 1–2, autres 0,6–1,3. En revanche la plage de BM n'est pas plus large
que celle des autres en général : largeur médiane de l'α 3,2 pts pour BM contre 4,5 pts pour l'enveloppe des autres (n = 133).

**Effet d'un centre pris sur le panel** (médiane de toutes les sources, BM compris, variétés à ≥ 3 autres sources) : α, 30 variétés sur 133
changent de plus de 5 % (23 %), 12 de plus de 10 %, 1 de plus de 20 % ; β 33 / 14 / 3 sur 131 ; huile 51 / 31 / 13 sur 115. Exemples de plages :
Triskel BM 3–9 → sources 2,5–5,5 ; Saaz CZ BM 2–5 → 1,4–7,5 ; Mosaic BM 11,5–13,5 → 10–15.

### 2.2 Identité : combien de sources décrivent une variété

Fiches : 2 832 (20 sources) + 435 (BA). Variétés par nombre de sources qui les décrivent (index d'usage de Brewer's Friend et BA compris) :

| | 0 autre | 1 | 2 | 3 | 4+ |
|---|---|---|---|---|---|
| 317 variétés BM, 20 sources | 51 | 35 | 31 | 31 | 169 |
| 317 variétés BM, avec BA | 30 | 24 | 39 | 28 | 196 |
| ajouts (188 puis 252 avec BA), 20 sources | — | 157 | 19 | 4 | 8 |
| 252 variétés hors BM, avec BA | — | 146 | 81 | 15 | 10 |
| les 569 variétés, avec BA | 30 | 170 | 120 | 43 | 206 |

BA seule ajoute 64 variétés hors BM (ADHA-484 et autres codes, Alliance, Aloha…). Les 30 variétés sans autre source que BM (avec BA) et les
170 variétés à une seule source sont celles qui doivent porter la marque « 1 source ».

### 2.3 Les données déclarées par les recettes

- BA publie, par houblon, l'α et le β *déclarés par les recettes* (min < milieu < max) : 390 variétés ; le nombre de recettes (102 variétés à
  plus de 1 000 recettes, 191 à plus de 100) ; les recettes par moment (423 variétés).
- Brewer's Friend publie l'α moyen des recettes d'utilisateurs, par forme et par emploi : 290 variétés.
- L'α déclaré par les recettes est proche de celui des producteurs : BA moins la médiane des sources, n = 167 : −0,22 pt en moyenne, valeur absolue
  médiane 0,32 pt, 90e centile 1,25 pt ; Brewer's Friend : −0,20, 0,48, 1,30. Les recettes disent *ce qu'on brasse* (lots vieillis,
  récoltes), pas la spécification de la variété : une voie à part (« pratique »).

### 2.4 Les mots et l'usage

- **Mots** (sources distinctes par variété, 505 variétés) : 0 : 155 · 1 : 129 · 2 : 68 · 3 : 43 · 4+ : 110. Variétés BM (317) : 15 · 91 · 61 · 41 · 109 ;
  ajouts (188) : 140 · 38 · 7 · 2 · 1. 90 variétés BM n'ont que les mots BM. Auteurs : BM 300 variétés, Charles Faram 138, BarthHaas 90, HS 86,
  Crosby 69, John I. Haas 50, HopDatabase/hops-json 48, Yakima 45.
- **Usage** (569 variétés) : 0 source : 33 · 1 : 162 · 2 : 112 · 3 : 63 · 4+ : 199. Sources : BM `purpose` 317, BA 423, Brewer's Friend 290, Hopslist
  248, HopDatabase 189, hops-json 115, `hopStyleUsage` 25 (IPA), NZ Hops 20. 30 variétés BM n'ont d'usage que chez BM.
- **BM contre BA** sur 263 variétés communes (étiquettes `aroma`, `bittering`, `dual` des deux côtés) : 193 d'accord (73 %), 59 qui diffèrent
  d'un cran, 11 en opposition directe (aroma ↔ bittering). Warrior, Columbus, Nugget : « mixte » chez BM ([[role-continu]]).

### 2.5 La typicité de Beer Analytics (Beer Analytics seul, clé = id BM)

- 435 houblons lus, 393 avec des données de style, **254 dans la table** (tous des ids BM) ; part au frais : 97 (≥ 1 000 recettes).
- 140 fiches BA avec des données de style n'ont aucun `varietyId` et sont absentes : 26 à plus de 100 recettes, **11 à plus de 1 000**.
  Rattachées par l'analyseur de `rattachement.mjs` : 5 à une variété BM (Hallertauer Mittelfrüh 81 290 recettes, Hallertauer Tradition 12 788,
  Hallertauer Blanc 6 752, Spalter 5 074, Whitbread Golding 1 027 ; East Kent Golding 96 945 est déjà rattrapé à la main par `ALIAS_BA`) et 5
  « à confirmer » parce que BM les sépare par pays : **Magnum 108 017, Saaz 105 979, Northern Brewer 53 843, Perle 41 731, Brewer's Gold 8 459**.
  Magnum (108 017 recettes, plus que Simcoe ; seuls Cascade, Citra, Centennial et Amarillo en ont davantage dans la table) a donc une typicité *inconnue* dans le classement k3k1t.

---

## 3. Modèle proposé : un panel croisé (rien n'est écrit dans le code)

### 3.1 Principes communs aux options

- **Identité.** Une variété existe si au moins une source la décrit. Clé = nom normé + origine (la même décision que `strip` / `resoudreNom` de
  `rattachement.mjs`, sans catalogue de référence). Les deux variétés de même nom d'origines différentes (Perle GR/US) sont deux variétés ; une
  fiche qui ne dit pas son origine rejoint la variété par défaut (la plus employée) et porte `origineIncertaine`, ou reste « à confirmer » mais
  *compte quand même* pour la variété quand les deux candidates ont des valeurs compatibles (écart < 10 %).
- **Une valeur = une plage + le panel.** Par champ et par variété :
  `{ centre, plage: [bas, haut], n, nPlages, ecart, sources: [{id, type, lo, hi, annee}], signales: [{source, raison}] }`.
  - `n` : le nombre de sources ; `nPlages` : le nombre de plages *distinctes* (une source qui recopie la même plage ne compte pas deux fois pour la
    confiance, mais reste listée) ;
  - `centre` : médiane pondérée des milieux ; `plage` : de la médiane pondérée des bornes basses à celle des bornes hautes (une seule source :
    sa plage) ; l'étendue min–max reste disponible (c'est l'enveloppe actuelle) ;
  - `ecart` : (milieu max − milieu min) ÷ centre ; un écart signalé = une source dont le milieu est à plus de 2 × MAD (ou 15 %) du centre, comme le
    `s-consensus-N` de `fusion.mjs` (déjà fait pour n ≥ 3) ; **signalé, jamais exclu ni gardé seul**.
  - confiance affichée : `1 source` (n = 1), `2 sources`, `n sources · écart x %`. L'inconnu reste inconnu, jamais 0.
- **Poids par type de source** (hypothèses [H], à régler sur une moitié des variétés et à juger sur l'autre, L20 ; non réglées ici) :

  | Type | Sources | Poids | Rôle |
  |---|---|---|---|
  | Laboratoire / institut | USDA, études du dépôt (E03, E04…), COA de lots | 3 | mesure |
  | Producteur / obtenteur / association | BarthHaas, HS, John I. Haas, HPA, NZ Hops, USA Hops, British Hop Assoc., IHPS | 2 | spécification |
  | Négociant / distributeur / catalogue de vente | Charles Faram, Crosby, Yakima Valley, BSG, Hops Direct, Indie Hops, Freestyle | 1 | spécification (lots de l'année) |
  | Agrégat / communautaire | **Beer Maverick**, Hopslist, HopDatabase, hops-json | 0,5, et une plage recopiée vaut une fois | rappel, jamais le pivot |
  | Recettes déclarées | BA, Brewer's Friend | 0 pour la spécification ; propre voie « pratique » | usage réel, α usuel, typicité |

  Un lot du brasseur (stock, certificat) reste prioritaire sur tout panel, comme aujourd'hui (`hopRef.alpha`).
- **Usage.** Une part continue par houblon (au frais, à l'ébullition) lue sur les recettes (BA, Brewer's Friend) ; les étiquettes (BM, Hopslist,
  hops-json, fournisseurs) deviennent des voix, pas des règles. Une donnée absente laisse le houblon au milieu.
- **Radar.** BM reste le radar choisi par le brasseur (27.10) ; le panel y ajoute en repli HS `arome_*`, BarthHaas `rose` et Charles Faram, après
  normalisation par axe (rang dans le catalogue), pour les 324 variétés sans radar BM (214 couvertes au lieu de 181).

### 3.2 Trois options

| | A — Étiquettes honnêtes et « 1 source » | B — Panel précalculé, ids conservés (recommandée) | C — B + identité sans pivot (ids neutres, catalogue unique) |
|---|---|---|---|
| Idée | Corriger I18-I20, I23 ; ajouter « 1 source » sur les écrans ; les valeurs restent celles de BM | Un fichier de panel construit pour toutes les variétés ; α, β, huile, composants, cohumulone du catalogue deviennent le centre et la plage du panel ; BM une voix de poids 0,5 ; usage continu ; typicité rattachée par nom | B, plus : id canonique `nom-origine` pour toute variété ; table ancien → nouveau (généralisation de `ID_FUSIONNES`) ; un seul catalogue (569 variétés) ; plus de notion d'« ajout » |
| Identité | inchangée | ids `beermaverick-*` et `sources-*` gardés comme clés opaques ; l'existence d'une variété ne dépend plus de BM (la table de rattachement n'exige plus une cible BM) ; BA entre dans `SOURCES_NOMS` | nouvelle clé partout |
| Fichiers à toucher | `data.ts`, `donnees.ts`, `sources.ts`, `fiches.ts`, `MarquesVue.tsx` + tests : environ 8 fichiers, 0 donnée régénérée | script de panel (nouveau, comme `fusion.mjs`), `rattachement.mjs`, `build-data.mjs`, `typicite-styles.mjs`, `data.ts`, `departage.ts`, `palier.ts`, `voies.ts`, `substitution.ts`, `fiches.ts`, `sources.ts`, `sourcesMesures.ts`, `valeurs.ts` : 13 fichiers + 4 JSON régénérés ; tests de valeurs à rebaser (`coherenceCatalogue`, `catalogueComplet`, `comparerValeursCatalogue`, `empreinteDonnees`, `donneesApp`…) | tout B + 58 fichiers de tests (271 occurrences), 55 scripts, 11 fichiers `src/`, 31 prototypes, `baseline-cas.json` et fixtures ; les maquettes figées restent telles quelles |
| Voies (indicatif) | 1 voie Sonnet | 4 voies : panel (données), moteur, écrans, banc de non-régression ; 1 passage conseil sur les poids | B + 2 voies mécaniques (renommage, tests) |
| Poids du bundle (B5 164 ko gz, serré) | neutre | `proto-data.json` garde sa taille (mêmes tableaux `[bas, haut]`) ; `n`, `ecart`, `sources` partent dans un morceau à la demande qui *remplace* `complements.json` (73 ko gz) : neutre à +20 ko hors B5 | comme B ; un catalogue unique supprime le chargement des ajouts (−16 ko gz) |
| Risque | nul pour les classements | les classements bougent : 23 % des centres d'α déplacés de plus de 5 % ; D102 D et le banc sont à rejouer (poids de Substituer appris sur les substituts BM, I11) | B, plus l'id d'une recette ou d'un stock déjà enregistré : le stock se relie par le nom (`donneesApp.ts`), la fixture de production du 17.10 porte des ids `hopsteiner-*` et non `beermaverick-*` ; **à vérifier en production** car `HopKnowledgePanel.tsx:95` peut installer le pack BM |
| Ce que voit le brasseur | les 188 ajouts cessent d'être étiquetés BM ; « 1 source » apparaît | α, β, huile avec nombre de sources et écart, pour toutes les variétés ; l'α d'environ 1 variété sur 4 bouge de plus de 5 % (IBU de même ordre) ; Magnum, Saaz, Perle, Northern Brewer, Hallertauer retrouvent une typicité ; le linalol existe pour 142 variétés | B ; les noms sont identiques, rien de plus de visible |
| Satisfait D200 ? | non : BM reste le pivot et la valeur | oui pour l'identité (existence) et la valeur ; l'id reste une chaîne historique | oui, y compris dans les chaînes |

### 3.3 Recommandation

**B, en trois étapes, ids conservés.** Rien de ce que voit le brasseur ne dépend de la chaîne `beermaverick-`, et C coûte plus de 150 fichiers de renommage
(58 de tests, 55 scripts, 11 de `src/`, 31 de prototypes) sans gain visible : à reprendre seulement si le conseil veut aussi nettoyer le nom. Ordre proposé :
B1 = A (étiquettes, « 1 source », sans changer un chiffre) ; B2 = le panel de valeurs (α, β, cohumulone, huiles, linalol) avec un banc de non-
régression (`baseline-cas.json` + D102 D) ; B3 = usage continu (retire `purpose` de 60′ et de D106 comme t3 l'a fait pour R4), typicité par
l'analyseur de rattachement, radar de repli.

---

DÉCISION À PRENDRE (architecture, au conseil) :
1. Option A, B ou C (recommandation : B, en trois étapes).
2. `peuDeDonnees` (I12) : garder le reculement à égalité (le brasseur voit la variété, marquée « 1 source », mais elle passe après à égalité) ou le
   retirer (elle passe à égalité de rang). Recommandation : garder uniquement pour une variété *sans aucune valeur chimique*, retirer pour une
   variété d'une source avec valeur — c'est la lecture la plus proche de « il faut pas se limiter à si une seule source on montre pas ».
3. Le centre du panel : médiane pondérée des milieux (recommandé) ou le milieu de BM quand l'écart reste sous 10 % (plus de continuité, moins de
   vérité croisée).
4. Les poids (3, 2, 1, 0,5 ; une plage recopiée vaut une fois) sont des hypothèses : à fixer sur une moitié des variétés et à juger sur l'autre.
5. Le radar : repli croisé (HS, BarthHaas, Charles Faram) ou BM seul ; le radar est un choix du brasseur (27.10), donc à lui montrer en variantes.

Doutes et limites :
- Les captures n'ont pas été prises (audit en lecture, pas de serveur) : I18-I20 (mauvaise attribution des ajouts) sont lus dans le code, pas vus à
  l'écran. À confirmer par une capture de la fiche d'un ajout.
- Les écarts sont calculés sur les milieux des plages de `complements.json` (valeurs valides) ; IHPS (23 fiches) et Freestyle Hops (19) n'y sont pas
  fusionnés. La part « primaire » exclut seulement Hopslist, HopDatabase et hops-json ; l'indépendance réelle des producteurs n'est pas établie
  (voir les plages recopiées).
- L'usage de BA (catégorie) et l'étiquette BM ne se superposent pas parfaitement (BA a trois classes, BM aussi, mais sur d'autres critères).
- Le coût est donné en fichiers touchés et en voies, pas en heures. Les tests n'ont pas été lancés (aucun code touché).
- Les chiffres BA viennent de fichiers non suivis ; si le dépôt les change, relancer `mesure.mjs` et `mesure3.mjs`.

CONNAISSANCE : (1) À l'α, 5,6 sources par variété ne valent que 3,6 plages distinctes : compter les plages, pas les sources, pour dire la confiance.
(2) Le pivot BM a fait perdre la typicité de Magnum, Saaz, Northern Brewer, Perle et Brewer's Gold (les cinq noms que BM sépare par pays) et des
Hallertauer : 10 houblons à plus de 1 000 recettes dans BA. (3) Un centre de panel déplace l'α de plus de 5 % pour 23 % des variétés
(133 mesurées) et l'huile de plus de 10 % pour 27 %.

LEÇON PROPOSÉE : un audit qui chiffre pendant que d'autres voies écrivent dans les mêmes fichiers doit figer sa mesure (`git archive HEAD` dans un
dossier temporaire) et dire quels fichiers ne sont pas suivis ; ici Beer Analytics n'est pas dans HEAD, et c9 modifiait les ajouts (188 devenus 180)
entre deux de mes lectures.

Fichiers écrits : `RESULTAT.md`, `mesure.mjs`, `mesure2.mjs`, `mesure3.mjs`, `mesures.json`, `mesures2.json`, `mesures3.json`, `survol.mjs`, `forme.mjs`
(tous dans `work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/`). Aucun fichier suivi modifié par la voie. Essais : 1 par critère.
