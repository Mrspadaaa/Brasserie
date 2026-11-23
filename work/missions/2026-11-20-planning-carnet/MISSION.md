# Planning → projets du Carnet (20.11)

Ses mots (SPEC-BRASSEUR, 20.11) : « Porte le avec un. Sous session et critique sur le planning et des les projets du carnet ça fait un bon test. Et tu pourras le supprimer ».

Portée (L01) : les 19 documents de la collection Firestore `planning` (T-6 à T-24) deviennent des idées du Carnet (Stocks › Matériel › Carnets) ; puis `planning` est supprimé. Le code du Planning est déjà retiré (port-carnet 920773e97, BT-2). Aucune IA, aucun autre carnet touché, rien d'autre écrit.

## État de l'art

- **Problème d'école** : migration de données entre deux schémas (ETL, *schema mapping*) avec écriture idempotente et vérifiable : identifiants déterministes, écriture préconditionnée, simulation (*dry-run*) puis relecture, sauvegarde avant tout.
- **Examiné** : le modèle du Carnet (`src/domain/carnets/modele.ts`, `operations.ts`), le chemin de création réel de l'app (`creerCarnet` → `ranger` : un carnet neuf et son message, rangement `locale`), l'idée datée R48 (`carnetDepuisPhrase` : `date` = lundi de la semaine, icône au Calendrier), la sortie vers À venir (`planDepuisChoix`, seulement depuis un choix d'article), le motif d'import existant `scripts/import-yeast-catalogue.mjs` (REST Firestore, jeton de la CLI Firebase, `currentDocument` en précondition, `encode`/`decode`). Lecture des dates : motif `j.m.aaaa` à séparateurs `. , / -`, validé par aller-retour `Date.UTC` (pas de bibliothèque : format fixe, deux cas abîmés « 01,08,2026 », « 1,05,2027 »).
- **Décision** : réemployer `creerCarnet` (aucun modèle parallèle) et le motif REST d'import ; ids fixes `CARNET-PLANNING-<T>` et `MSG-PLANNING-<T>`, écriture `exists: false`, relecture champ à champ, contrôle que les autres `creativeItems` gardent leur `updateTime`.

## Correspondance (une étape = une idée)

Un carnet est un objet ou un chantier à décider ; un carnet par catégorie mêlerait frigo, hotte et extincteur dans une même comparaison. Donc :

| Planning | Carnet |
|---|---|
| `description` | titre et phrase de l'idée (jalon : « Jalon — … », sans « 🏁 JALON ») |
| `cost` (> 0) | critère « Budget prévu : 3 500 CHF » (origine `vous`) ; pas un article : ce n'est l'offre d'aucun vendeur ; jalon : aucun budget (jamais 0) |
| `startDate`, `endDate`, `category` | note « à faire » : « À faire du 08.12.2025 au 21.12.2025 (Planning, Structure) » ; `date` = lundi du début (icône au Calendrier) ; jalon : « Jalon du Planning, sans date prévue » |
| `completed` | aucun des 19 ne l'a : statut Idée ; une étape faite serait archivée (« Fait au Planning ») |
| (trace) | un message du fil par étape, `rangement: 'locale'`, qui cite les trois lignes |

Total des budgets : 12 380 CHF (17 étapes) ; 2 jalons.

**Calendrier** (précision du brasseur relayée, 20.11 : « Portage dans le carnet et le calendrier ») : par le lien existant du Carnet (R48, `iconesIdees`), chaque étape datée est une icône d'idée à la semaine de son début, qui ouvre son carnet ; aucune couche parallèle. Jalons : décision (a), relayée le 20.11 : au Carnet seulement, sans date inventée ; il les date d'un geste quand il veut. Proposition (b) gardée en note : T-23 au 01.07.2027 (fin électricité et embouteillage), T-24 au 31.12.2027 (fin de la Conformité), dates déduites marquées « déduit ».

## Fichiers (OWNS, port-carnet)

`scripts/planning-vers-carnet/` (correspondance.ts, migrer.ts, fixture-planning.json), `tests/unit/planning-vers-carnet.test.ts`, `src/design/CarnetsPreview.tsx` (banc `?preview=carnets&jeu=planning`). Commit 31274df1b.

## Preuves

- Tests : 7 verts (dates abîmées, 19 idées lues par `lireCarnet`, 12 380 CHF, jalons, idempotence, conflit).
- Émulateur : semé 19 + un carnet tiers ; simulation 19 / 38 ; suppression refusée avant écriture ; `--apply` 38 écrits, relus 38/38 ; relance 0 écrit ; carnet tiers intact.
- Sauvegardes : `%TEMP%/affinee-planning-*.json` (hors Git).

- Critique 1 (Opus) : 14 constats, 1 bloquant (CRITIQUE.md, BUGS PNC-1 à PNC-14) ; corrigés 755f77d11 (ordre T-06, création 03.09, « Budget du Planning », note de jalon, étapes en cours à la semaine courante) ; 9 tests, 5 échouaient avant. Rejeu Opus : 4/4, 0 neuf.
- En ligne, 20.11 : 38 documents écrits et relus à l'identique, 12 autres `creativeItems` intacts. Chrome du brasseur, lecture seule : Carnets 19, ordre du Planning, 19 coûts et dates conformes, jalons sans date ni budget ; Calendrier : ampoule S47 qui ouvre « Frigo + congel ».
- Puis `planning` supprimé : 19 documents, reste 0 (sauvegarde `%TEMP%/affinee-planning-brasserie-l-affinee-2026-11-20T14-17-38-915Z.json`). Code déjà retiré (920773e97, non déployé). BT-2 corrigé.

## Reste

- États du 20.11 (sa réponse : « 6 en cours / Et jusqu'à 11 non pas fait encore ») : T-6 à T-10 archivées (faites), T-11 note « En cours au 20.11.2026 », T-12, T-14, T-16 à T-18 note « Pas encore fait au 20.11.2026 » ; dates inchangées ; 17 documents écrits et relus en ligne (port-carnet etats.ts). Le Carnet compte 14 idées.
- Ouverts au registre (dessin du Carnet et du Calendrier) : PNC-2, 5 à 8, 10, 12 à 14.
- Contrôles impossibles en ligne : 390 et 844×340 (le Chrome du brasseur ne se redimensionne pas ; captures figées) ; faits au banc.

## 20.11 soir : « Mais et le carnet ??? »

- Il cherchait ses projets dans Brassins › Atelier › Carnet, qui ouvre l'ancien carnet (CreativeLabTab). Celui-ci exclut les idées du Carnet (type `carnet`). « Vérifié en ligne » ne l'était que par Stocks › Matériel › Carnets (L11 resserrée).
- Détour 96e4b5e22 (11 « À faire » dans l'ancien carnet, 6 idées archivées), défait par la décision (a) relayée : le Carnet choisi est CarnetsVue ; l'entrée unique est faite par une autre session (tests/integration/carnetEntreeUnique.test.tsx).
- État en ligne (8a2c1d80e, relu) : CarnetsVue garde 14 projets ; les 5 faits sont archivés. Les 8 achats sont en Matériel › À venir (`PLAN-PLANNING-T-*`), liés à leur idée par `sortie` ; ampoules du Calendrier aux dates d'origine. BUGS PNC-15.
- Reste : preuve visuelle en ligne par Stocks › Matériel › Carnets, puis par Brassins › Atelier une fois rebranché. Claude in Chrome était déconnecté au moment du contrôle.
