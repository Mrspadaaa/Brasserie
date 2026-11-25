TESTS ROUGES 30 rouges / 35 total — tests/unit/c67bRegles.test.tsx, fixtures tests/fixtures/c67b/ (commit 24e310786)

Aucun fichier de `src/` ni `functions/` écrit (le `M src/ui/carnets/CarnetsVue.tsx` du `git status` date d'avant la voie).

## Fichiers écrits
- `tests/unit/c67bRegles.test.tsx` (35 tests, un bloc `describe` par règle R63 à R69)
- `tests/fixtures/c67b/pellets.ts` (carnet de pellets MotlerHops / Hopfenmarkt / Brau tiré de la fixture c66 et de la vraie page Brau)
- `tests/fixtures/c67b/sujets.ts` (3 sujets neufs de mémo : pompe, levure, sonde)
- `voies/c67b-tests/tests-rouge.log` (sortie `--reporter=dot`, sur disque : le dépôt l'ignore, donc non commité), ce RESULTAT.md
- Le `.skip` du cas R4 de `c48Regles.test.tsx` : non touché (aucune raison).

## Sortie décisive (`tests-rouge.log`)
`Tests  30 failed | 5 passed (35)` ; rouges par règle : R63 4, R64 4, R65 3, R66 5, R67 3, R68 2, R69 : C67B-7 2, C67B-9 1, C67-2 3, C67-8 2, C67-5 1. Chaque règle a au moins un rouge.

## Par règle : le geste, la cause du rouge
- R63 (C67B-1/8, C66-4/7, C65-4) : GESTE `CarnetsVue` monté : fiche MotlerHops, 1 kg coché, « Choisir · MotlerHops, 1 kg », « Choisir chez ». Rouge : le carnet « Choisi » dit « ≈3 CHF · 50 g » (pas ≈40 · 1 kg) ; la liste dit « ≈4 CHF les 50 g » ; un même sachet : « ≈3 » au carnet « Choisi » contre « ≈4 » à la liste et 73,80 CHF/kg (3,69 → 4). Verts (garde-fous, R54 l'a corrigé) : la confirmation dit 1 kg et le kilo de la fiche ; le plan À venir porte 4 000 centimes et « 1 kg ».
- R64 (C67B-2) : plan écrit daté `2027-02-01` (jamais choisi), titre = celui du carnet (pas CITRA® (US)), Quand du carnet « vers févr. · 40 CHF », À venir monté (`UpgradeWorkspace`) « Prévu en février 2027 ». Attendu : pas de date, nom de l'article.
- R65 (C67B-3) : par STRUCTURE (jsdom ne mesure rien) : `white-space: nowrap` lu dans `carnets.css` + `carnets-decider.css` sur la cellule « agrumes, pamplemousse, fruits tropicaux » de « Ses autres valeurs » (cause du débordement) ; réglette « ‹ moins cher · 67 » sans unité à la borne gauche (pellets/HM/prix ; teste aussi débit et bruit de la ventilation).
- R66 (C67B-4) : `propositionARanger` rend `aucune` avec 2 carnets « je cherche » (elle ne regarde que le genre « problème », le coup d'œil compte tous les genres) ; carte montée : « Aucun problème ouvert où la ranger » sans Oui ; « Oui » absent ; GESTE photo envoyée depuis la liste (le sélecteur de fichier, `reduirePhoto` simulé) : le carnet « Photo » s'ouvre sur l'écran idée, aucune carte « Rattacher à… ? », la photo n'est pas défilée en vue (seul `.cn-bandeau` l'est).
- R67 (C67B-5) : 3 sujets neufs (pompe de transfert, levure, sonde), la phrase du mémo ne recopie pas le titre du carnet : la feuille dit « nouveau carnet · idée » pour chacun. Garde-fou vert : un mémo sans carnet de son sujet n'est rattaché à aucun autre.
- R68 (C67B-6) : 2 phrases de problème neuves, rangées, OK, ligne `.cnl-pb[data-genre=probleme]` touchée : le carnet ouvert est celui de l'idée (« Ensuite : l'IA cherche les façons »), sans `.cnp-etat-mot`. Garde-fou vert : sorti puis revenu, le problème s'ouvre juste (le correctif c67-fix « genre aussitôt » est en local ; l'ouverture juste après création reste fausse).
- R69 : C67B-7 (« vendu par 1 g à 20 kg » sans ✓ ; ligne « vendeur » redit l'en-tête ; garde-fou vert : Prix et Alpha cochés) ; C67B-9 (›, aucun retour en haut : 0 `scrollIntoView`, 0 `scrollTo`) ; C67-2 (3 phrases de besoin : aucune « Tâche proposée ») ; C67-8 (« Piste : déshumidificateur… » et « Piste : sécheur… » : aucune option, un article au nom de la phrase) ; C67-5 (`UpgradeWorkspace` vue Réalisés montée avec les carnets du suivi : « Un projet arrive ici seul… », aucun problème résolu listé).

## Essais utilisés
Un essai de plus pour 3 tests mal montés par moi (la page « Choisi » se rouvre par la ligne « Choisi : … », la fiche MotlerHops de 2 articles n'a pas de bouton ›, la liste après deux retours) ; tous corrigés avant le log final. Une assertion sur la consigne du modèle (RANGER_CARNET) était déjà verte (vide de sens) : retirée.

## Doutes et limites
- jsdom ne mesure aucune boîte : R65 se juge sur le `white-space` calculé depuis les feuilles réelles (cascade par ordre de feuille, spécificité approchée). Une mise en page qui change de structure sans `nowrap` passe ; le rendu à 390 px reste à voir en ligne.
- R66 à R69 jugent l'IA simulée (qui lit des mots), pas Gemini : R67 (« le SENS ») ne se prouve vraiment que sur le vrai modèle ; les 3 sujets ont un mot en commun avec le titre du carnet (le repli lexical `rattacher` les rate faute de seuil sur un texte long, ce que le test attrape). Le correctif peut passer par la consigne et le repli ; le test ne regarde que la feuille.
- R66 « Oui » et le défilement : assertions larges (un carnet « Je cherche / Décidé » reçoit la photo ; un défilement vers un élément qui contient l'image).
- C67-5 : le test monte `UpgradeWorkspace` (Stocks › Matériel › Réalisés) avec `StorageService.getCreativeItems` simulé. Il suppose que Réalisés liste les problèmes résolus eux-mêmes (DOSSIER R69) ; si le pilote veut une autre destination (onglet Réalisés des Carnets), le test change.
- C67-2 : « Tâche proposée » est demandé pour trois phrases qui disent un besoin (maquette v01-saisie : « Besoin de matériel adapté » → « Tâche proposée : acheter… ») ; la phrase vapeur du test en ligne ne dit pas de besoin et n'est pas testée pour cela.
- Les `ZZ TEST` : aucune donnée réelle, aucun Gemini.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
