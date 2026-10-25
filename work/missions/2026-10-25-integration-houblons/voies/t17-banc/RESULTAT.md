OK — contrôle bloquant check:hop-perf sur jeu réaliste ; verdict : le glisser tient, Suggérer à froid exige un worker

## Fichiers écrits

- `scripts/check-hop-tools-perf.mjs` (neuf) : le contrôle. Lance le banc, juge chaque calcul selon son moment, imprime une ligne par calcul
  puis `PERF-OUTILS OK` ou `PERF-OUTILS ECHEC (n)` (code 0 ou 1). Options : `--temoin=lent`, `--echelle=10`, `--snapshot=bloquant`.
- `scripts/bench-hop-v4.ts` : un mode `--volume` s'y ajoute (le banc de T5 est intact : `--echelle=1 --json` rend encore l'empreinte
  `9ef77aa53ecc`). Options du mode : `--groupes=repos,toucher,glisser,snapshot`, `--stock=N`, `--temoin=lent`, `--echelle=K`.
- `package.json` : une ligne, `"check:hop-perf": "node scripts/check-hop-tools-perf.mjs"`.
- `work/missions/2026-10-25-integration-houblons/voies/t17-banc/diagnostic-proposer.ts` : mesure de cause de `proposeVoies` (voir plus bas).
- Aucun jeu figé dans `tests/fixtures/hopV4-volume/` : le jeu est généré par graine fixe dans le banc (empreinte `0fa6d59fc54e` à ×1,
  affichée par le contrôle). Un jeu figé n'ajouterait qu'un fichier à tenir à jour.

## Le jeu réaliste (simulé, aucune donnée réelle)

318 houblons (catalogue de la maquette) ; stock ×5 = 80 articles (les 16 du jeu d'essai + 64 lots simulés sur des variétés distinctes,
grammes et α décalés) ; 10 recettes de 10 styles (3 à 6 houblons, du 60′ au dry hop, 4 levures) et 10 dégustations (deux familles dites,
niveaux variés) ; une addition neuve par recette (hors dégustation, donc `lireBiere` passe par la voie « ajout neuf »). Snapshots
répétés : le magasin rend les mêmes données dans des tableaux neufs (5 fois). `--echelle=10` : catalogue 3 180 et stock 160, rapporté.

## Comment les calculs sont classés (lu dans les écrans, pas deviné)

| Moment | Ce qui y tourne | Source lue | Budget sur ce PC (÷ 4) |
|---|---|---|---|
| glisser | un cran de moment ou de jours de Dryhopper : `lireBiere` du brouillon (`useBiere`) et l'aperçu levure (`effetLevure`, rendu à chaque cran) ; un pas de dose du stepper de Ma bière (`Carte.tsx`) | `etat/EtatParcours.tsx`, `ecrans/dryhopper/index.tsx`, `ecrans/ma-biere/Carte.tsx` | 16 ms ÷ 4 = **4 ms** (médiane), 33 ÷ 4 = **8,25 ms** (95e) |
| toucher | ouverture d'un outil ou d'une feuille : frise complète de Dryhopper (24 crans, `useMemo` à l'ouverture), Levure, Substituer, Comparer et sa feuille « jour après jour », Suggérer par son adresse, retour sur Ma bière, fiche | écrans + `coquille/Coquille.tsx` (seul `voiesDe` et `remplacants` sont préchauffés) | 100 ms ÷ 4 = **25 ms** |
| repos | création du moteur, premier écran, préchauffage de la Coquille : une tranche = `voiesDe` (proposer + leviers levure), une tranche par ajout pour `remplacants` | `coquille/Coquille.tsx`, `moteur/prechauffage.ts` | tranche **50 ms** ; tout avant la fin du premier écran 2,5 s ÷ 4 = **625 ms** |

Le facteur ×4 est une hypothèse écrite (aucun vrai téléphone mesuré) ; le contrôle l'affiche dans son en-tête. Juge : le 95e centile
(avec n = 10, le plus lent des dix cas) ; pour le glisser, la médiane ET le 95e.

Constats de lecture qui servent le verdict : le préchauffage de la Coquille couvre `voiesDe` (donc `proposer` et `leviers`) et
`remplacants(recette, id, 6)`, mais Substituer lit `substitutes` sans limite (T6b l'a noté) et Dryhopper, Levure, Comparer ne sont pas
préchauffés. Dans Comparer, la dose est fixe (4 g/L) : aucun glisser de dose, seulement des feuilles à l'ouverture.

## Verdict du moteur

Commande : `node scripts/check-hop-tools-perf.mjs` (≈ 1 min), jeu ×1, Intel i5-14600KF, Node 24, hors navigateur. Sortie : **PERF-OUTILS ECHEC (6)**
sur la dernière passe (5 sur la première : Comparer à 12 houblons est au bord, 23 puis 28 ms de p95). Journaux dans `%TEMP%` (scratchpad de la voie).

| Moment | Calcul | Mesure (médiane · p95) | Budget | Verdict |
|---|---|---|---|---|
| glisser | un cran de moment ou de jours : Ma bière relue (cran jamais vu) | 1,04 · 1,72 ms | 4 · 8,25 | OK |
| glisser | un cran : aperçu levure (US-05 face à Pomona) | 0,36 · 1,49 ms | 4 · 8,25 | OK |
| glisser | un pas de dose (houblon dégusté, deux lectures) | 1,22 · 2,27 ms | 4 · 8,25 | OK |
| glisser | un cran déjà calculé à l'ouverture (cache) | 0,01 · 0,01 ms | 4 · 8,25 | OK |
| toucher | ouvrir Dryhopper : frise complète, 24 crans | 23,75 · **33,12** ms | 25 | **DÉPASSÉ** (au bord : 28 ms à la 1re passe) |
| toucher | ouvrir Levure : 4 souches | 12,71 · 20,72 ms | 25 | OK |
| toucher | ouvrir Substituer : classement du moteur | 2,76 · 5,98 ms | 25 | OK (moteur chaud) |
| toucher | ouvrir Comparer : 12 houblons | 19,52 · **27,83** ms | 25 | **DÉPASSÉ** (au bord : 23 ms à la 1re passe) |
| toucher | Comparer, feuille « jour après jour » (12 × 7) | 120,27 · **132,12** ms | 25 | **DÉPASSÉ** (×5) |
| toucher | ouvrir Suggérer par son adresse, sans préchauffage | 859 · **1 079** ms | 25 | **DÉPASSÉ** (×43) |
| toucher | ouvrir Suggérer après le préchauffage (cache) | 0,03 · 0,08 ms | 25 | OK |
| toucher | revenir sur Ma bière après un outil | 1,64 · 2,11 ms | 25 | OK |
| toucher | ouvrir la fiche d'un houblon | 0,00 · 0,00 ms | 25 | OK |
| repos | créer le moteur sur les données | 0,24 · 0,69 ms | 50 | OK |
| repos | premier écran : Ma bière lue | 4,75 · 24,61 ms (cas 0 : compilation à froid) | 50 | OK |
| repos | **tranche** de préchauffage : voies de Suggérer | 1 099 · **1 377** ms | 50 | **DÉPASSÉ** (×27) |
| repos | dont proposer · dont leviers levure | 672 · 429 ms (médianes) | rapporté | — |
| repos | tranche : remplaçants d'un ajout | 1,00 · 1,80 ms | 50 | OK |
| repos | **le tout** : premier écran + préchauffage complet | 1 110 · **1 393** ms | 625 | **DÉPASSÉ** (×2,2) |
| repos | snapshot identique : recréer le moteur | 0,43 · 0,57 ms | 50 | OK |
| repos | snapshot identique : premier calcul après recréation | 9,35 ms face à 0,38 ms | aucun calcul relancé | **×25 : relancé** (rapporté, T8 #169) |

À ×10 (catalogue 3 180, stock 160, rapporté, non bloquant) : le glisser reste sous 2 ms ; la tranche de Suggérer passe à 2,8 s (p95 4,2 s),
Substituer à 34 ms (p95 39 ms : il dépasserait), Suggérer sans préchauffage à 2,1 s (p95 3,6 s), le premier écran avec préchauffage à 2,9 s.
Le premier calcul après un snapshot identique passe de 9 à 72 ms.

**Ce que chaque dépassement demande :**

1. **Les voies de Suggérer (tranche de repos 1,1 s ; ouverture par adresse 1,1 s) : worker (T7, #171) obligatoire, plus une optimisation ciblée.**
   Cause mesurée (`diagnostic-proposer.ts`, moteur neuf, 4 répétitions) : `proposeVoies` coûte 198 ms avec 16 articles en stock (230 voies
   évaluées) et 489 ms avec 80 (1 097 évaluées) ; le coût suit le nombre de voies évaluées (≈ 0,4 à 0,9 ms par voie), pas les assemblages
   (sans assemblages : 176 et 479 ms). Il n'y a pas de tranche à 50 ms à faire : `proposer` est un seul appel synchrone de 0,7 s, `leviers
   levure` un autre de 0,45 s ; seul un worker (ou un `proposeVoies` qui rend la main entre deux lots de voies) les sort du fil principal.
   À stock 16 (aujourd'hui) la tranche dépasse déjà : ≈ 480 ms. L'optimisation ciblée à demander au moteur : un coût par voie évaluée
   (effet d'un houblon à un moment, mis en cache par houblon et moment, réutilisé entre `proposer` et `leviers`).
2. **Le total de repos (1,1 s contre 625 ms)** : il vient entièrement du point 1 (les autres tranches ensemble font ≈ 10 ms). Il tombe avec le worker.
3. **Comparer, feuille « jour après jour » (120 ms)** : 84 appels à `comparer` (≈ 1,4 ms chacun) faits d'un coup à l'ouverture de la feuille.
   Demande : un calcul jour par jour rendu au fil de l'eau, ou le worker, ou le préchauffage quand Comparer s'ouvre. Pas un cas pour T7 à lui seul.
4. **Dryhopper (frise) et Comparer à 12 houblons (≈ 24 à 33 ms, au bord de 25)** : une seule dépassée de 8 ms. Le cran coûte ≈ 1 ms,
   donc la frise se découpe (crans proches de la position courante d'abord, le reste au repos) ou se préchauffe quand l'ajout existe
   déjà dans Ma bière. À décider avec T7 : si le worker vient, ces deux-là y vont avec les autres (une seule règle).
5. **Snapshots répétés** : recréer le moteur sur des données identiques relance les calculs (×25). C'est T8 (#169), non bloquant ici
   (`--snapshot=bloquant` le rend bloquant dès que l'empreinte des données existe).
6. **Sous le doigt, rien ne dépasse, même à ×10.** Le contrôle ne justifie donc pas un worker pour le glisser lui-même : T7 se justifie par
   les ouvertures (point 1 surtout), pas par les crans.

## Critères

- G1 `node work/missions/2026-10-25-integration-houblons/voies/t17-banc/verifier.mjs` → `moteur : PERF-OUTILS ECHEC (5)`, `témoin lent : PERF-OUTILS ECHEC (1)`, **BANC OK** (1 essai, rejoué après la dernière modification des fichiers).
- Témoin lent : `node scripts/check-hop-tools-perf.mjs --temoin=lent` → un cran à 9,45 ms de médiane (8 ms injectés), `DÉPASSÉ`, **PERF-OUTILS ECHEC (1)**, code 1.
  Le même cran sans témoin : 1,04 ms, OK. Le témoin ne fait échouer que la ligne retardée.
- Le banc de T5 intact : `--echelle=1 --json` → empreinte `substitutes` `9ef77aa53ecc`, identique à T5.
- Aucun caractère de contrôle dans les fichiers écrits (M10) ; aucun appel Gemini ; aucune donnée réelle.

## Essais utilisés

G1 : 1 essai. Le témoin a d'abord échoué aussi sur le repos (son mode ne sautait pas ce groupe) ; corrigé (`--groupes=glisser`),
pour qu'un témoin lent ne soit pas confondu avec le verdict du moteur.

## Doutes et limites

- **Mesure sous Node (V8), pas Chrome ni un téléphone.** Le ×4 est une hypothèse écrite. Le contrôle navigateur (`mesure-performance.mjs`)
  reste à étendre aux écrans de l'app (T12) : celui-ci ne voit ni le rendu React, ni le raster, ni le ramasse-miettes d'un vrai onglet.
- Bruit : le même contrôle, rejoué, bouge de ±15 % (Comparer à 12 houblons : 23 puis 28 ms de p95). Les deux dépassements « au bord »
  (frise, Comparer à 12) peuvent changer de côté d'une passe à l'autre ; les quatre autres (jour après jour, Suggérer ×2, total de repos)
  ne sont pas ambigus. Je n'ai pas mis de marge pour les faire passer.
- « À froid » = froid pour les mémoires de l'adaptateur (vidées à chaque cas par `configurerDonnees`) et pour l'entrée ; les caches du
  moteur (liés aux tableaux de données, partagés entre les 10 cas) restent chauds, comme dans une session qui change de recette. Le
  cas 0 est le seul à froid de processus (premier écran 25 à 31 ms de p95 : compilation).
- La tranche « remplaçants » mesurée est celle que la Coquille préchauffe (limite 6) ; aucun écran ne la lit (T6b). Substituer lit
  `substitutes` sans limite, mesuré à part (2,8 ms, moteur chaud ; 9 ms au premier calcul d'un moteur neuf).
- Le jeu est simulé (graine fixe) : les chiffres de Suggérer dépendent du stock (×2,5 de 16 à 80 articles) ; un vrai stock plus fourni
  coûterait plus.
- Tas JS non ramassé en fin de passage : 520 à 640 Mo à ×1 (817 Mo à ×10). Ce n'est pas la mémoire d'un téléphone ; à regarder dans T12.
- `package.json` : seule la ligne du script est ajoutée. `scripts/check-hop-budget.mjs` apparaît modifié dans `git status` : ce n'est
  pas mon travail (une autre voie).
- Le contrôle dure ≈ 1 min (`--echelle=10` : ≈ 3 min) ; le témoin ≈ 50 s.

DÉCISION À PRENDRE : faut-il lancer T7 (worker, #171) maintenant, pour les voies de Suggérer seules, ou d'abord une optimisation du coût par
voie évaluée dans `proposeVoies` ? Options : (a) T7 d'abord pour tous les calculs lourds (proposer, leviers, remplacants, substitutes,
comparer) ; (b) optimisation ciblée de `proposeVoies` (cache par houblon et moment), worker ensuite si besoin ; (c) les deux, l'optimisation
sur un autre fil. Recommandation : (c) en commençant par T7, car même à stock 16 la tranche (≈ 480 ms) dépasse son budget de ×10 : aucune
optimisation plausible ne la ramène à 50 ms sur le fil principal. T7 doit aussi couvrir la feuille « jour après jour » de Comparer.

CONNAISSANCE : à stock ×5, `proposeVoies` évalue ≈ 1 100 voies et coûte 0,5 s à froid (≈ 0,4 ms la voie) ; à stock 16, 230 voies et 0,2 s. Le
coût suit le nombre de voies évaluées, non les assemblages. Le glisser (cran, pas de dose) coûte ≈ 1 ms même à ×10 : le calcul lourd
est dans les ouvertures et le préchauffage, pas sous le doigt. `cerveau/metier/cout-calcul-moteur.md` est à compléter avec ce tableau.

LEÇON PROPOSÉE : un budget « par tranche » ne vaut que si le calcul est découpable ; vérifier d'abord qu'il n'est pas un seul appel synchrone
(ici `proposer`, 0,7 s d'un bloc) avant d'écrire « découper le préchauffage en tranches ».
