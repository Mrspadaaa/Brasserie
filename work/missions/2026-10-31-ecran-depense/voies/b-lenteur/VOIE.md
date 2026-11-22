# Voie b-lenteur — la lecture lente jouée dans Chrome, sur ses vraies pièces rejouées (D308, D313 à D318)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Ligne `b-lenteur` de MISSION.md. Part **après** le retour des voies e-ecran et n3-ht (leur
code est dans l'arbre). Aucun déploiement, aucun commit, **aucun appel réel à Gemini** (réponses brutes rejouées du banc), aucune donnée réelle.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d » ; « 2 d, en un clic je peux Tout validé les changements. Mais aussi un à 1 » ; « Oui b » ; « On peut pas passer
directement à l'intégration dans l'app ». D264 : les tests se font sur ses vraies pièces (ici rejouées, jamais inventées, L28).

## Le contrat
`work/missions/2026-10-31-ecran-depense/voies/l1-plan/PLAN.md` § 5, bloc **« B, banc Chrome »** ([M7] : le shim de page, `callableAnswer`, le
manifeste rejoué, les cas, le lancement), puis § 7. Les états et la forme attendue : `voies/e-ecran/VOIE.md` et `voies/e-ecran/RESULTAT.md`.

## Ce qu'il faut faire
1. Le shim SSE de [M7] dans `scripts/check-invoice-journey-emulator.mjs` : requête `Accept: text/event-stream` → `ReadableStream` construit
   dans la page, blocs `data: {…}\n\n` séparés par `delaiMs`, un cas qui ferme le flux sans `result`. Une requête sans cet en-tête reste
   servie comme aujourd'hui (les cas existants ne changent pas).
2. Le provisoire de chaque pièce rejouée : `provisoireDeDeux` sur ses deux lectures brutes (`banc-k6-C/raw`), écrit dans un manifeste
   **hors Git** (sous `os.tmpdir()`, jamais dans le dépôt : ce sont ses pièces).
3. Les cas : `lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`, `lenteur-touchee`, `lenteur-sans-38`, `lenteur-hors-ligne`,
   `lenteur-fermee`, `lenteur-sans-resultat`, plus `lenteur-perdues-2` (son choix B, « Tout valider » avec ↻ et « 1/2 », Garder, Retirer).
   Chaque cas joue le parcours par l'entrée de l'app (choisir la pièce, attendre, toucher) et vérifie ce que § 5 E attend
   (« Confirmer » désactivé avec la roue pendant l'attente, actif après le final, rien de tapé réécrit, puces).
4. Si la voie n3-ht a trouvé une vraie réponse rejouée aux lignes HT (son RESULTAT, critère 4), un cas `ht-confirmer` : les lignes
   arrivent au TTC et « Confirmer » n'est plus refusé (sans cliquer « Confirmer » sur rien de réel : le banc tourne sur les émulateurs).
   Sinon, le dire, sans fabriquer de réponse.
5. Lancement : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <sortie> <cas> 390,1280` (sortie sous
   `voies/b-lenteur/`). Le banc joue d'une copie que nul autre n'écrit (L17) ; aucune autre voie ne tourne alors.
6. Captures à 390 px tactile et 1280, **ouvertes en image** (L12), mises côte à côte avec ses maquettes : `choix-lenteur/img/d-06.png`,
   `d-lue.png`, `choix-valider/` (b-arrivee, b-garder, tout), `choix-lignes-38/` (q1-b, q2-d) ; une ligne par écart vu dans RESULTAT.

## Possède
`scripts/check-invoice-journey-emulator.mjs`, `work/missions/2026-10-31-ecran-depense/voies/b-lenteur/**`. Interdits : `src/**`,
`functions/**`, tout autre fichier. Un défaut de l'app trouvé au banc se dit (fichier, ligne, capture), il ne se corrige pas ici.

## Critères (le pilote les rejoue)
1. Les cas existants du banc rejoués avant et après le shim : même nombre d'OK (sorties gardées).
2. Les 9 cas lenteur (et `ht-confirmer` s'il existe) : `OK` dans `console.log`, 0 `KO`, 0 erreur de console de l'app, 0 requête hors localhost.
3. Le témoin négatif : le cas `lenteur-provisoire` joué avec le shim désactivé (flux absent) échoue (sortie gardée).
4. Captures ouvertes, côte à côte écrites dans RESULTAT, état par état.
5. `git status --short` : rien hors de « Possède » ; aucune valeur de ses pièces dans un fichier suivi.

## Rendre
`voies/b-lenteur/RESULTAT.md` (fichiers, sorties avant / après, cas, côte à côte, défauts vus ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`),
puis une ligne `B-LENTEUR OK — …` ou `B-LENTEUR ECHEC — …`.
