# Voie d4-descripteurs — les descripteurs d'arôme de toutes les sources dans les familles du moteur (D157)

Agent : auteur (Sonnet), pour du code de données avec des choix.

## Ses mots (26.10, sur l'app déployée)
« Pas beaucoup de données ? Et les substituts de Galaxy semble pas super fiable. Tu es sûr que toutes les données sont bien en ligne ??? »

## Le constat (pilote)
- Les **valeurs** des 20 sources sont en ligne : Comparer et la fiche les lisent dans `complements.json`.
- Les **descripteurs d'arôme**, eux, n'entrent pas dans les familles du moteur. La fusion d3a ne les a pas pris (« Non fusionnés :
  descripteurs, substituts, styles, accords »). D'où « Fiches lues : Galaxy 1 » dans Substituer.
- Galaxy n'a qu'une fiche (Beer Maverick, 7 tags), alors que les sources donnent :
  - BarthHaas : 5 descripteurs ;
  - Charles Faram : 3 + 3 ;
  - Crosby : 5 + 1 ;
  - HopDatabase : 9 ;
  - hops-json : 3 ;
  - HPA : 3.

## Comment le moteur lit l'arôme (à respecter)
Lis `src/domain/hopIndex/v4/hops.ts`, `families.ts`, `fiches.ts` et la note `cerveau/metier/descripteurs-hors-familles.md` :
- une famille a un niveau (non décrit, cité, marqué), selon combien de **fiches** (sources) la citent sur combien de fiches lues ;
- les mots sont rattachés aux 12 familles par le lexique de `hopExtrapolationBootstrap.json` (mot entier, texte anglais d'origine) ;
- les mots sans famille vont dans `sansFamille`.

## À faire
1. **Un test qui échoue d'abord (D157)** : les familles de Galaxy, Nelson Sauvin, Citra et Motueka comptent chaque source qui
   publie des descripteurs. « Fiches lues » doit être ≥ 2 quand au moins deux sources en ont. Rouge sur HEAD.
2. **Ajouter chaque source comme une fiche** dans les descriptions du catalogue :
   - par `prototypes/houblons-v4/scripts/build-data.mjs`, depuis `src/data/hopSources/*.json`, rattachées par `varietyId` ;
   - avec sa source (auteur, année, URL de la fiche) et son contexte (houblon brut ou bière, quand la source le dit) ;
   - le texte d'origine en anglais, pour le lexique ; la traduction suit le chemin actuel de `tagsFr` et de la traduction de l'app.
   - **Règles :**
     - une source = une fiche, même si elle a plusieurs listes. Charles Faram « bière » et « frotté » sont deux contextes d'une
       même fiche ;
     - HopDatabase et hops-json sont des agrégats d'autres sources : compte-les comme une seule fiche communautaire, ou écarte-les
       s'ils recopient une source déjà présente. Mesure leur recouvrement et décide, en l'écrivant ;
     - un mot générique (fruité, doux, noble…) suit la règle GENERIQUE de l'app ;
     - les intensités publiées (BarthHaas : roses à 12 axes ; Charles Faram, BHA : intensité) ne deviennent pas des niveaux. Ce
       serait une convention du moteur : en DÉCISION À PRENDRE, avec leur couverture.
3. **Le poids du catalogue.** `proto-data.json` est dans le budget B5 (148,3 ko sur 150).
   - Si les descriptions le font dépasser, garde-les compactes (mots seuls, sources en table, pas de texte répété).
   - Sinon, propose un compromis mesuré en DÉCISION À PRENDRE : par exemple, les niveaux de famille précalculés au build, et les
     mots dans le morceau chargé à la demande.
   - `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` après `npm run build`.
4. **Ce que ça change**, avant et après, dans le rapport :
   - pour Galaxy, Nelson Sauvin, Citra, Motueka, Mosaic, Saaz et Cascade : leurs familles, leurs niveaux et leurs mots sans
     famille ;
   - les 10 premiers de Substituer au dry hop et à 60′, pour Galaxy et Nelson Sauvin ;
   - la part de mots sans famille sur tout le catalogue.
5. **Le moteur change de données, pas de formule.**
   - `tests/unit/hopIndexV4/moteurInchange.test.ts` changera d'empreintes : mets-les à jour en écrivant que seules les
     descriptions ont changé (diff des entrées du moteur) ;
   - les tests du prototype (`npx vitest run --root prototypes/houblons-v4`) : mêmes règles qu'en r180, une empreinte ne se met
     à jour qu'avec la preuve ;
   - ne modifie pas `substitution.ts`.

## Critères
- Le test D157 : rouge sur HEAD, vert après.
- `npx vitest run tests/unit/hopIndexV4` vert ; prototype vert (empreintes justifiées) ; `npm run build` vert ; B5 tenu ou compromis
  proposé.
- `proto-data.json` régénéré par `build-data.mjs`, deux passes identiques.

## Possède
- `prototypes/houblons-v4/scripts/build-data.mjs`, `src/data/hopV4/proto-data.json`.
- `src/domain/hopIndex/v4/hops.ts` (lecture des fiches, s'il le faut, sans changer la formule).
- `tests/unit/hopIndexV4/` (D157, moteurInchange), `prototypes/houblons-v4/tests/` (empreintes, avec preuve).
- `work/missions/2026-10-25-integration-houblons/voies/d4-descripteurs/`.

La voie e2 révise en ce moment `src/domain/hopIndex/v4/substitution.ts` sur les données actuelles, et a modifié `moteurInchange.test.ts`
et `substitutionV2.test.ts` dans l'arbre. **Avant de toucher à `moteurInchange.test.ts`, lis son état dans l'arbre et ne perds pas ses
changements.** Si vous entrez en conflit, écris-le dans RESULTAT.md. La voie a1 possède les radars dans `src/ui/hopIndex/`.

N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
