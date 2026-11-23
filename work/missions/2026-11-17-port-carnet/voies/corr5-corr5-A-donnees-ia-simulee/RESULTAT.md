OK — données et IA simulée corrigées : 12/12 points de la critique 5, 29 tests verts

# Lot corr5-A — données et IA simulée (critique 5)

Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit ni push. Aucun appel Gemini (IA simulée seulement).
État de l'art suivi (MISSION § État de l'art) : motifs, liste fermée d'unités, `prixTousDe` (`parseDecimal`), fuse.js (`rattacher`),
Pareto pour comparer, `lirePage` (cheerio) pour les pages HTML des tests. Aucune dépendance nouvelle. Pas de rustine sur la découpe
des prix : `prixTousDe` tenait déjà les phrases avec mesures et lien (le test le prouve), il n'a pas été modifié.

## Fichiers écrits (tous dans Possède)
- `src/domain/carnets/analyseLocale.ts` : unités composées `kg/h`, `L/min`, `L/h` (avant `kg`, `L`) ; `extraireCriteres` (nouveau).
- `src/domain/carnets/iaSimulee.ts` : critères tirés de la phrase (`criteresDeLaPhrase`), plus d'exemple G13 ; lien dans un carnet
  ouvert → article de ce carnet ; prix écrit seul → article ; découpe en vrac par catégorie puis `rattacher`, titre neuf mis en forme ;
  `lienACollerPour`.
- `src/domain/carnets/ia.ts` : `critereTireDe` ; le garde pose `source` sur chaque critère ; `origine` reste `exemple` (B7).
- `src/domain/carnets/modele.ts` : `Critere.source`, `sourceDuCritere`, `titreNeufDe`, `extraitLu`.
- `src/domain/carnets/comparer.ts` : `moinsBienQue`, `texteMoinsBienQue`, `moinsBienPartout` vrai contre chacun, `LigneTableau.moinsBienQue`,
  `rangeParDetail`, `critereCourt`, `critereQuiTranche` resserré.
- `src/domain/carnets/rattacher.ts` : `categorieDe` ; `carnetProche` limité à la même catégorie.
- `src/domain/carnets/operations.ts` : le titre (ou la phrase entière) n'est jamais un critère ; seul un critère vague se fond (P7) ;
  `source` transmis.
- `src/domain/carnets/fixture.ts` : sources réelles des critères ; `NOTE_VRAC_DEUX_CARNETS` (dans `PHRASES_ESSAI`, à la place de
  « Plus gros seau ? », déjà ligne de « Sol local ») ; options `g8` et `g35`.
- `src/ui/carnets/rangement.ts` : `planVrac` rend sorte, décompte, titre neuf mis en forme ; `sorteVrac`, `texteDecompte`.
- `tests/unit/carnetsCritique5Donnees.test.ts` (29 tests).

## Problème → fait → preuve (`npx vitest run tests/unit/carnetsCritique5Donnees.test.ts` : 29 passed)
| n° | Problème | Fait | Preuve (test) |
|---|---|---|---|
| 4 | « 30 L » inventé (G13 rendu quelle que soit la phrase) ; « assez profond pour un fût » perdu | Critère G13 seulement s'il dit « fût couché », avec ses nombres ; mesures par `extraireCriteres` ; seul un critère vague (« le débit ») se fond | (a) : « Évier inox, fond de bac 38 cm minimum » → « Fond de bac 38 cm minimum » (fond de bac, cm, plus), aucun 30 L ; 5 phrases sans nombre → 0 nombre ; Évier garde « 2 bacs », « assez profond pour un fût », + le 38 cm |
| 2 | Toute la phrase en critère | Libellé de tête = titre ; « 150 kg/h » → « Débit : 150 kg/h au moins » (débit, kg/h, plus) ; « 2 cylindres » → façon | (b) : 1 critère, aucun « Moulin », façon « 2 cylindres », titre « ZZ TEST — Moulin à malt » ; phrase sans mesure → `criteres` vide |
| 24 | Le titre « Tuyau silicone 8 mm, 5 m » en critère, en double | `ranger` n'écrit pas un critère égal au titre, ni la phrase entière quand elle dit plus que son titre ; dédoublonné | (b) : création « Tuyau silicone… » → `criteres` = [] ; « …, 189,90 CHF » → un article, aucun critère |
| 1 | « tient 80 °C », « le débit » dits « de votre phrase » | `LigneCarnet.source` / `Critere.source` (`phrase` ou `ia`) décidés par le garde ; fixture Ventilation K2, K3 `ia` | (c) : fixture `[K1 phrase, K2 ia, K3 ia]`, Évier `[phrase, ia]` ; réponse simulée `source: 'phrase'`, `origine: 'exemple'` gardée ; rangé, la source suit |
| 21 | G8 propose « capter la buée » | Seulement une caractéristique mesurable inconnue des deux premiers ; sinon `null` | (d) : Ventilation → `null` ; un critère bruit (dB) inconnu → proposé |
| 22 | Critère qui range non nommé | `rangeParDetail` | (e) : phrase « rangé par tient 80 °C ; « capter la buée » n'a pas de valeur mesurable » |
| 23 | « moins bien partout » faux sur la 4e | `moinsBienQue` (Pareto, inconnu non compté) ; `moinsBienPartout` vrai contre chacun | (f) : 4e → `moinsBienPartout: false`, `moinsBienQue: 3`, « moins bien que la 3e sur tout » ; cas vrai contre chacun gardé |
| 27 | G35 : hotte vers l'extracteur CO₂ | `carnetProche` : même catégorie d'objet (nom de l'idée), sinon `null` | (g) : Ventilation → `null` ; une 2e idée « Ventilation… » → proposée |
| 30 | Carnet né du vrac : phrase en minuscule | `titreNeufDe` (libellé ou nom d'objet, sans verbe d'achat ni prix, majuscule) ; né en Idée | (h) : titre « Moulin à malt », statut `idea` |
| 7 | Note de 3 lignes non découpée | `planVrac` et la réponse simulée : une ligne, une sorte, un carnet (existant ou un seul neuf), « 3 lignes · 2 carnets » | (h) : 3 lignes, 2 carnets, sortes achat/question/conseil, avis « ✓ 3 lignes rangées dans 2 carnets » ; simulée : `resume` 3 · 2 |
| 6 | Lien collé dans Ventilation : carnet né ailleurs ; carte sans caractéristiques | Dans un carnet ouvert, la catégorie ne se lit plus dans l'URL ; le lien y va (cause : `…/pompe-magnetique` ouvrait « Pompe de transfert ») | (i) : 0 carnet neuf ; hotte : nom, vendeur, 1 980 CHF, débit, tient 80 °C, « lu sur la page : nom, prix, débit, tient 80 °C » ; HTML ld+json : débit 40 L/min, 90 °C, 690 CHF ; HTML og sans prix → aucun prix |
| prix | « 189,90 CHF » en CHF | `prixTousDe` inchangé (le tenait déjà) ; prix écrit seul → article | (j) : 4 phrases → 18 990 CHF ; EUR/€ seulement s'ils sont écrits |

(k) gardés : D-131 (`rattacher` → Ventilation), D-46 (`ID_PLAN_FRIGO`), D-118/D-120 (notes ZZ-V-N1 à N3), `PHRASES_ESSAI` à 30, D-35
(test corr4 « IA simulée : critère Débit : le plus haut (L/min) » vert). G8 et G35 restent atteignables par `fixtureCarnets({ g8: true })`
et `fixtureCarnets({ g35: true })` (test (k) bis).

## Autres critères
- `npx tsc --noEmit -p .` : sortie vide, code 0.
- `npx vitest run tests/unit/carnets tests/integration/carnetsParcours.test.tsx` : 509 tests, 487 verts, 22 rouges (base avant le lot :
  422/422 sur 23 fichiers ; 4 fichiers neufs des lots parallèles depuis).
- `git status --short` : seuls mes 10 fichiers et mon test, plus `source4-portable-bundle-manifest-01.json` (déjà modifié avant, non touché)
  et les fichiers UI des lots B, C, D.

### Tests qui passaient et cassent par mes corrections (ils figent l'ancien défaut ; non modifiés, ils sont à d'autres lots)
- `carnetsComparer.test.ts` : « 6. un article dominé … porte « moins bien partout » » (n° 23) ; « critereQuiTranche sur Ventilation : le critère
  sans caractéristique… », « un seul candidat : null ; une façon écartée… », « deux façons homonymes : « 1re », « 2e » » (n° 21 : ils
  s'appuient sur K1 sans caractéristique ; le nommage des candidats n'a pas changé, `fixtureCarnets({ g8: true })` le rejoue).
- `carnetsCritique4Donnees.test.ts` : P4 « Moulin à malt » (n° 2) ; P44 « Un fût de 30 L couché » (n° 4) ; P7 `fusion.origine 'exemple'` →
  `'ia'` (n° 1) ; P10/P23 « accepter la range » : « Fond de bac : le plus haut (cm) » ne remplace plus « assez profond pour un fût » (n° 4) ;
  P20 G35 → Extraction (n° 27).
- `carnetsIA.test.ts` : m390-2 « ZZ TEST — ajouter le sel » → « Ajouter le sel » (n° 30). `carnetsRangement.test.ts` : `planVrac`
  « ajouter le sel » → « Ajouter le sel » (n° 30).
- `carnetsParcours.test.tsx` : « G8 au banc : la fixture Ventilation montre la bulle » ; `carnetsEcrans.test.tsx` : « P13 : sur Ventilation,
  au focus du champ vide, la bulle G8 paraît » (n° 21).

### Rouges venus des lots parallèles (UI modifiée, pas mes fichiers)
`carnetsCritique4Figes` P2 ×2, `carnetsEcrans` R02, R03, R06, C6 champ, P11 ×2 (« Critère : … · proposé par l'IA », liste vide i06-2,
Comparer), `carnetsParcours` P9 (plus de bloc « Ce qui compte » dans CarnetOuvert). Leurs messages citent des textes d'écran neufs.

## Interfaces pour B, C, D
- `rangeParDetail(c): { texte; critere: { id, texte, nom } | 'prix' | null; sansValeur: { id, texte, court }[]; phrase }` (comparer.ts) ;
  `critereCourt(texte)`.
- `moinsBienQue(article, autres, colonnes): number | null` ; `LigneTableau.moinsBienQue?: number` ; `texteMoinsBienQue(rang)` ;
  `moinsBienPartout` vrai seulement contre chacun.
- `critereQuiTranche` : `null` sur la fixture Ventilation ; G8 au banc : `fixtureCarnets({ g8: true })`. G35 : `fixtureCarnets({ g35: true })`.
- `planVrac(lignes, proche): { lignes: { ligne, carnetId?, titre, neuf, sorte: 'achat'|'travail'|'conseil'|'question'|'note' }[]; titreNeuf; carnets; decompte }`
  (« 3 lignes · 2 carnets ») ; `sorteVrac`, `texteDecompte` (rangement.ts) ; `titreNeufDe` (modele.ts).
- Critère : `LigneCarnet.source` et `Critere.source` (`'phrase' | 'ia'`), `LigneARanger` critère `source?` ; `sourceDuCritere(k)` pour
  « tiré de votre phrase » / « proposé par l'IA ». **À brancher par D** : `depuisIA` (CarnetsVue) doit passer `source: l.source` ;
  **par C** : `CarnetOuvert`, `CadreArrivee`, `Comparer`, `Choisir` doivent lire `sourceDuCritere(k)` au lieu de `origine === 'ia'`.
- Article lu : `extraitLu(article)` → « lu sur la page : nom, prix, photo, <valeurs> » ou `null` ; champs de l'article = `depuisIA` actuel
  (nom, vendeur, prix, devise, dispo, photo, `valeurs` d'origine `page`). `lienACollerPour(titre)` : la puce « Coller » d'un carnet ouvert
  (Ventilation → `exemple.invalid/hotte-140`).
- `extraireCriteres(texte): { criteres: { texte, caracteristique?, quantite? }[]; facons: string[] }` (analyseLocale.ts).

## Doutes et limites
- « 2 cylindres » lu comme une façon (lecture étroite de « caractéristique de façon ») ; réversible dans `extraireCriteres`.
- La catégorie d'objet est dérivée du premier mot du titre (aucun champ n'existe) : deux idées du même objet titrées autrement ne se
  voient pas proches (G35 se tait, il ne propose rien de faux).
- Défaire une fusion de critère (P7) rend texte et origine d'avant, pas `source` ; `sourceDuCritere` retombe sur l'origine.
- La lecture réelle (`functions/src/lireLien.ts`) ne rend pas d'extrait de texte ; « lu sur la page » se calcule sur ce qui est lu.
- Aucune capture (lot sans rendu, jugé par B, C, D).

DÉCISION À PRENDRE : les 13 tests rouges qui figent l'ancien défaut (liste ci-dessus) — options : (A) leur lot propriétaire les met à
jour sur les nouvelles règles ; (B) les retirer. Recommandation : A, par le pilote ou le lot D, en pointant G8 et G35 sur
`fixtureCarnets({ g8: true, g35: true })`.

CONNAISSANCE : dans un carnet ouvert, une catégorie lue dans l'URL d'un lien collé envoyait l'article dans un carnet neuf
(`…/pompe-magnetique` → « Pompe de transfert ») : la cause du n° 6. Une ligne simulée garde `origine: 'exemple'` (B7) ; la provenance
d'un critère passe par `source`.

LEÇON PROPOSÉE : une exigence « origine réelle » ne doit pas réutiliser le champ qui porte déjà « simulé » (`origine`) : un champ par
question (simulé ou non ; de sa phrase ou de l'IA). Contrôle : le test B7 « toute ligne simulée est exemple » l'a attrapé ici.
