OK — variante Csv8F (nameFr) et son juge écrits au banc : simulée OK, estimée 1,65 CHF au pire, passe payante prête

Voie f5-noms-fr, 01.11. Aucune passe payante lancée, rien dans `functions/` ni `src/`, aucun commit.

## Fichiers écrits
- `scripts/banc-lecture-facture.ts` (ajouts seulement) : variante `Csv8F` (groupe, réglage `callSpec`, libellé, famille de simulation `n1/n2/n3`), `schemaWithNameFr`, `NAME_FR_NOTE`, `Reading.namesFr`, `withNamesFr`, lexique `LEXIQUE_FR`, `fakeFrench` (simulation), `UNITE_SUFFIXE`, `OPTION_MOTS`, six fautes fabriquées au plan, estimation.
- `scripts/banc-lecture-facture-juger.ts` (ajouts seulement) : `jugerNomFr`, `judgeNomsFr`, `renderNomsFr`, `checkNomsFrSimulation`, `fusionnerSorties`, `comparerCsv8F`, `renderComparaison`, mode `--noms-fr`. Le contrôle de simulation existant ignore désormais les fautes `items.N.nameFr` (elles ont leur contrôle propre) ; le reste du juge est inchangé.
- `tests/unit/banc-lecture-noms-fr.test.ts` (neuf, 51 tests).
- `work/missions/2026-11-01-banc-lecture/GESTES.md` : une ligne « Désignation en français », variante Csv8F, état « au banc ».
- Ce fichier.

## Ce que fait Csv8F
Même chaîne que la production Csv8 (deux Flash-Lite à 8 192 jetons, la 3.8 sur désaccord qui tranche les valeurs, statut du vote gardé), avec N en option (`Csv8F+N` = Csv8+N+F), et le seul ajout `nameFr` :
- schéma : `items[].nameFr` (STRING), **hors de `required`** (facultatif) ;
- consigne : une phrase à la consigne système (`NAME_FR_NOTE`), après celle de `name` qui reste l'imprimé exact : français, marque et nom propre tels quels, ni option, ni état, ni unité ni suffixe d'unité, sans explication ; mêmes consignes de lecture 1, 2, 3 qu'en production ;
- la 3.8 de Csv8F lit aussi `nameFr` : elle est à elle (id `Csv8F3`), jamais prêtée ni partagée (celle de la production n'a pas le champ) ; son plafond de sortie reste celui de la production (5 100), pour que le banc voie si le champ la coupe.
- `normalizeInvoiceScan` et le rapprochement ne connaissent pas `nameFr` : le banc le garde à côté de chaque lecture (`Reading.namesFr`, même rang que les lignes normalisées) et le rattache aux lignes du résultat final (la 3.8 si elle a tranché, sinon Flash-Lite 1 puis 2, par désignation). Rien n'est inventé : une ligne sans `nameFr` lu reste sans.

## Le juge des désignations (par règles, un indice)
Par ligne du résultat final : `absent`, `langue` (un mot de l'allemand, de l'anglais ou de l'italien du lexique reste), `marque` (® ou ™, référence lettres+chiffres, nombre à 4 chiffres, MAJUSCULES de 4 lettres perdus), `option` (crochets, deux-points, supplément « +CHF », mot d'état comme geschrotet ou crushed ou concassé, texte de `variant`), `unite` (suffixe « , Kg » ou unité lue en fin), `long` (explication). Une ligne qui est elle-même une option imprimée n'est pas accusée. « à lire » : nom sans mot du lexique mais retouché (nom propre traduit ?), ni défaut ni réussite.
Le tableau publiable ne porte que des comptes ; les paires (nom imprimé, nom français) vont dans `noms-fr-paires.json` du dossier de sortie (H13-reels, hors Git) : **le verdict final est leur lecture par le pilote**, le lexique est court.
La perte ailleurs se juge comme les autres variantes (`judgeBench`) : champs, lignes, faux verts, parcours sans résultat, durée et coût, plus une comparaison cellule par cellule pièce/variante (`comparerJugements`). « AUCUNE PERTE » seulement si rien n'est pire ; durée et coût sont rapportés (au-delà de ×1,25 : à juger).

## Sorties décisives
- `npx tsx scripts/banc-lecture-facture.ts --simuler --variantes Csv8F --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json --out <tmp>` puis `npx tsx scripts/banc-lecture-facture-juger.ts <tmp>` :
  `BANC SIMULE OK — 4/4 fausses réponses fabriquées retrouvées, 2 faux verts comptés, 24 parcours propres sans champ faux, aucun réseau. Désignations en français : 16/16 fausses fabriquées retrouvées, aucune autre accusée.`
  Et `... juger.ts --noms-fr <tmp>` : `NOMS FR SIMULE OK — 16/16 ...`. La simulation passe par la 3.8 sur une pièce (une Flash-Lite diverge).
- `npx tsx scripts/banc-lecture-facture.ts --estimer --variantes Csv8F --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json` (14 pièces) :
  `BANC ESTIME 1.6483 CHF 42 appels neufs` (28 Flash-Lite 0,79 CHF + 14 3.8 au pire 0,86 CHF ; réserve au pire, sortie au plafond). Avec `--reprendre banc-d272b-hl` pour les moyennes observées : dépense probable ≈ 0,68 CHF avant les jetons de `nameFr` (k6 : Csv8 = 0,044 CHF par pièce) ; je compte 0,8 CHF. Plafond de passe 3 CHF : tient.
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/banc-lecture-noms-fr.test.ts --maxWorkers=2` : 3 fichiers, 199 tests verts. Aussi verts : `tests/unit/depense/banc-k6`, `tests/unit/depense/port`, `tests/unit/invoiceScanVote.test.ts` (11 fichiers, 159 verts, 3 ignorés). `tsc --noEmit --strict` sur le juge et le nouveau test : propre.
- `git status --short` : mes seuls fichiers sont les deux scripts, le test neuf, `GESTES.md` et ce dossier ; les autres lignes sont celles d'autres voies en cours.

## Essais utilisés
Un essai par critère. Trois défauts trouvés et corrigés en route par mes propres tests : l'option `nameFr` n'était pas passée au corps de requête (`doCall`) ; des lignes de la vérité qui sont des mots d'option (la simulation les vidait) ; la faute de faux vert de la simulation sur une pièce déjà « disputed » (déplacée sur la seule pièce « checked »).

## LA PASSE PAYANTE (à lancer par le pilote, journaliser)
Depuis la racine, une passe, 14 pièces, 1 tirage ; rien à prêter (les lectures de Csv8F portent un champ de plus, aucune sortie existante ne sert) :

`npx tsx scripts/banc-lecture-facture.ts --payant --budget-chf 24.5 --plafond-passe 3 --variantes Csv8F --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json --out work/finalisation-tickets-2026-10-08/H13-reels/banc-f5-F --confirm-paid-ai`

Puis le jugement (aucun réseau) :

`npx tsx scripts/banc-lecture-facture-juger.ts --noms-fr work/finalisation-tickets-2026-10-08/H13-reels/banc-f5-F --contre work/finalisation-tickets-2026-10-08/H13-reels/banc-d272b-hl`

Il imprime `AUCUNE PERTE` ou `PERTE : …`, les comptes de défauts de `nameFr`, et écrit `RESULTAT-NOMS-FR.md` (comptes seulement, publiable) et `noms-fr-paires.json` (privé) dans `banc-f5-F`. Le tableau complet : `... juger.ts <dossier banc-f5-F>`. Le cumul passe d'environ 7,99 à 8,8 CHF. `--budget-chf` est plafonné à 24,5 par le code (`BUDGET_CAP_CHF`, testé à 24,5) : suffisant ici ; relever à 49 est un autre geste (la constante et le test k5), pas nécessaire pour cette passe.
Limite de la comparaison : `banc-d272b-hl` est la production Csv8+N rejouée hors ligne sur la passe k6 (1 tirage) ; Csv8F est une lecture neuve. Une cellule en perte peut venir du tirage et non du champ : si une `PERTE` apparaît, relire d'abord la cellule nommée, et seulement si le doute reste rejouer la production (≈ 0,6 CHF) pour mesurer l'écart de tirage.

## CHANGEMENTS DE PRODUCTION À FAIRE APRÈS LA MESURE (D278 : accordé si « aucune perte »)
Rien n'est fait ici. Dans cet ordre :
1. `functions/src/prompts.ts`, `TASKS.scanInvoice.schema`, propriétés de `items` : ajouter `nameFr: str`, **sans** l'ajouter à la liste `required` (la dernière liste de `S(…, ['name', 'kind', 'reference', …])` reste telle quelle).
2. `functions/src/prompts.ts`, `TASKS.scanInvoice.system`, juste après la ligne « name recopie exactement la désignation imprimée, sans la traduire… » : la phrase `NAME_FR_NOTE` du banc, mot pour mot (importer ou recopier ; le banc la lit de `scripts/banc-lecture-facture.ts`). Les consignes de lecture 1, 2, 3 (`invoiceScanPrompts.ts`) ne changent pas. Le texte de `name` ne change pas non plus.
3. `functions/src/invoiceScanCore.ts` : type `CoreItem` + `nameFr: string` ; dans `normalizeInvoiceScan`, la ligne reçoit `nameFr: text(item?.nameFr, 160)` (vide si absent ; jamais déduit de `name`). Sans cela le champ est jeté.
4. `functions/src/invoiceVisionReview.ts` : **ne pas ajouter `nameFr` à `itemFields`** (ligne 16). Deux lectures qui traduisent différemment (« Sac à houblon » / « Sac pour houblon ») ne doivent ni voter, ni diverger, ni appeler la 3.8. `merged.items = baseItems.map(item => ({ ...item }))` (ligne 319) copie déjà `nameFr` de la lecture de base ; la 3.8 qui tranche seule le porte par `finirUneLecture(third.normalized)`. À vérifier au port : la lecture de base peut différer de l'ordre du banc (3.8, Flash-Lite 1, 2) ; un test doit le fixer.
5. `functions/src/invoiceScanVote.ts` (`lireCsv8`) et `ai.ts` : rien à changer si les deux lisent `TASKS.scanInvoice.schema` et `.system` ; sinon y passer le même schéma et la même consigne. Le plafond de la 3.8 (5 100) : si la passe payante montre une 3.8 coupée par `nameFr`, relever à 8 192 comme les Flash-Lite (décision à prendre alors, elle change aussi le coût). Redéployer `aiTask` ; le cache de lecture, lié au moteur par l'empreinte des modules, se vide de lui-même.
6. Client `src/services/geminiScanner.ts` : le type `ScannedInvoiceResult` (ligne 15), ligne d'article : ajouter `nameFr?: string` ; dans la normalisation des lignes (lignes 95 à 102), `...(typeof item?.nameFr==='string' && item.nameFr.trim() ? { nameFr: text(item.nameFr, 160) } : {})`, même style que `vatCode`. Les copies du type ailleurs (`src/ui/depense/apercuDev.ts` pour les pièces d'essai, `purchasePrefill.ts`, `etat.ts`) suivent : `nameFr` est facultatif, aucun appelant existant ne casse.
7. Usage à l'écran (voie de l'écran, pas celle-ci) : afficher `nameFr` quand il existe et garder `name` comme preuve ; le rapprochement du stock lit `nameFr` d'abord, puis `name` (le nom imprimé reste la clé de preuve) ; le nom de l'article neuf = `nameFr` sans option ni unité (les options et l'état viennent de `optionsDuNom`, voie f1, qui lit `name` et `variant`).
8. Tests de production à écrire en rouge d'abord : le schéma garde `required` identique et contient `nameFr` ; la consigne contient la phrase ; `normalizeInvoiceScan` garde, coupe à 160 et vide `nameFr` ; une différence de `nameFr` entre deux lectures ne déclenche pas `needsCorrection` ni la 3.8 ; `finirUneLecture` de la 3.8 le garde ; le client le garde.

## Doutes et limites
- Le juge est un indice : lexique court (allemand, anglais, italien), pas de dictionnaire. Un mot étranger hors lexique ou un nom propre « traduit » ne sont pas tous vus ; les paires sont à lire. Un nom ordinaire retouché sans mot du lexique est seulement compté « à lire ».
- La simulation prouve que le juge retrouve des fautes fabriquées, rien sur la qualité des modèles. 14 pièces, 1 tirage : un indice, pas une preuve (skill banc-lecture).
- Une désignation faite d'un seul mot d'option imprimé (ligne d'option) n'est jamais accusée d'option ; le juge ne dit pas si la ligne est un article.
- `Csv8F` n'a pas de repli propre pour une pièce dont la 3.8 manque : il suit `finalOfLite` comme Csv8.
- Italien : lexique de base seulement (D271 : « beaucoup plus rare »).

DÉCISION À PRENDRE : aucune bloquante. Relever `BUDGET_CAP_CHF` de 24,5 à 49 (constante + test k5) seulement avant une passe qui dépasserait 24,5 cumulés ; recommandation : attendre, cette passe en tient.
CONNAISSANCE : `normalizeInvoiceScan` ne garde que les champs de ligne qu'il énumère (invoiceScanCore.ts:287-299) : tout champ de ligne neuf doit y être ajouté, et rester hors de `itemFields` du rapprochement s'il ne doit pas faire voter les lectures.
LEÇON PROPOSÉE : aucune
