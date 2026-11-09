VERDICT ECHEC — 3 problèmes, 2 bloquants (les 5 du premier jeu sont corrigés en ligne ; « Confirmer » jamais touché, tout fermé par × › Abandonner)

Version : dernier commit de `claude/refonte-houblons-v4` (a965bcf3, `voies/s1/RESULTAT.md`), bundle servi `index-BHx7Y8KF.js`,
https://brasserie-l-affinee.web.app, 390 tactile, clair, compte connecté. Trois passages : Sun Store 2 (`jouer2.mjs`), BAUHAUS tachée
(`jouer2.mjs`, pris pendant la 3e lecture : « Lectures ●●◌ », « Confirmer » gris), BAUHAUS tachée (`jouer3.mjs`, lectures finies, fiches,
unité, tuiles). Sorties et 45 captures : `critique/en-ligne-2/`, planches `planches/p01` à `p12`, toutes ouvertes (L12). Aucune erreur de page.

## Les 5 problèmes du VERDICT-EN-LIGNE, rejoués

| n° | état en ligne | preuve |
|---|---|---|
| 1 Qté × prix 0/5, prix unitaires effacés | **corrigé** : « Qté × prix 2/2 · 1 sans prix unitaire » ; Vaxigrip « 1 pièce × 26,68 », Comirnaty « 1 pièce × 75,15 », H21 « 2 × — » (la pièce n'imprime pas de prix unitaire) ; plus de « corrigées » | sunstore-2 `01-haut`, `02-bloc`, `03-lignes` |
| 2 « TaxeSansTVA - 0% » | **corrigé** : sous-lignes « Rabais −0,68 », « Rabais −1,90 » ; fiche « imprimé « NoVatTax - 0% » · −0,68 · extrait · supprimer » ; recherche « rabais » 2/5 | `03-lignes`, `05-recherche-rabais`, `06-rabais-ouvert` |
| 3 BAUHAUS 0/29 sans quantité | **corrigé** : « 1 pièce × … » sur chaque ligne, « Qté × prix 29/29 justes » (28/28 au 2e passage) | bauhaus `02-bloc`, `21-bloc-final`, `22-lignes-final` |
| 4 recherche « peinture » 0 | **corrigé** : « 4 lignes sur 28 », « Rénovation 4/5 · Peinture et sols 4/4 · 113,65 » | `05-recherche-peinture` |
| 5 « other » dans la barre | **corrigé** : « nature : lectures divergentes (autre / ingrédient / entretien), vérifier les articles du justificatif » | `21-bloc-final`, journal `barreBasse` |

## Les quatre points de s1

| point | vu | verdict |
|---|---|---|
| Icône de stock absente sur les outils de rénovation | 3e passage (lecture « Rénovation 29 · Peinture et sols 5 · Outillage 5 · Divers travaux 16 ») : aucune icône sur les 29 lignes (`22-lignes-final`). 2e passage, même photo (lecture « Levures 1 · Consommables 4 · Autres 18 · Rénovation 5 ») : icône sur 23 lignes, brosses, gants, turbine, jeu de clés Allen compris ; « CHANTILLES S00 » rangé en **Levures · 1 sachet** (`01-haut`, `03-lignes`, `04-lignes-suite` bauhaus). Sun Store 2 : icône sur les deux vaccins (« Autres ») | problème n° 1 |
| Unité touchée → 1 sans clavier | BROSSE LATTOB GD, quantité vidée : les cinq cases « unité à remplir » ; « pièce » touchée → quantité « 1 », focus `BODY`, aucun champ focalisé, « 1 pièce × 5,50 = 5,50 » (`25`, `26`) | tient |
| Ordre pièce · g · Kg · L · sachet | cases « pièce · g · Kg · L · sachet », « 5,50 l'une · le g · le Kg · le L · l'un » (`25`) ; segment « pièce · L » | tient |
| Quantités en grandes tuiles, sans rouge | « quantité · 1 pièce* · 2 · 3 · 5 · 10 pièces », même grille que les cases, aucune classe d'alerte ; tuile 5 → « 5 pièces × 1,10 = 5,50 », montant gardé, focus sur le bouton (`26`, `27`) ; en L : « 1 · 5 · 10 · 20 L » (`28`) | tient |

## Sa question : « combien et quels problèmes il y a ? »

1. **BLOQUANT — un article de Bauhaus en « Levures · 1 sachet », des brosses en « Consommables », et l'icône de stock sur 23 lignes de
   quincaillerie** (2e passage, `01-haut`, `03-lignes`, `04-lignes-suite` bauhaus-tache). La règle « stock limité au brassage » s'appuie sur la
   famille rendue par la lecture ; quand la lecture range « CHANTILLES S00 » en levure et « BROSSE LATTOB GD » en consommable, l'icône
   revient et l'app propose d'entrer une brosse au stock de brassage. Même photo, 3e passage : tout en Rénovation, zéro icône. Sun Store 2 :
   les deux vaccins (« Autres ») gardent l'icône. En brasseur : « une chantille en sachet de levure ? et une brosse Bauhaus dans mon stock ? ».
   Attendu : une dépense dont le fournisseur ou la catégorie est hors brassage (Bauhaus, pharmacie) ne propose aucun stock, quelle que soit la
   famille lue ; une ligne de ticket de magasin ne peut pas être rangée en Levures.
2. **BLOQUANT — VITRIFIC.P.SGL 5.8KG : la quantité vidée fait disparaître l'unité, et rien ne la remet** (`30`, `31`, `32`). Le segment
   « pièce · L » s'efface, aucune case « unité à remplir » n'apparaît (BROSSE, même nature « Matériel · hors stock », les montre), il reste
   « [ ] × 86,85 = 86,85 » et « +1 +2 +3 +5 +10 » ; aucune unité à toucher, donc pas de « 1 » ni de tuiles ; l'en-tête passe à « 27 pièces + 1 L ».
   En brasseur : « j'efface la quantité et je perds l'unité ? ». Attendu : à quantité vide, les cinq cases comme sur BROSSE, sur toute ligne.
3. **Toucher une autre unité écrase la quantité posée** : « 5 pièces × 1,10 = 5,50 » puis « L » touché → « 1 L × 5,50 = 5,50 » (`27` → `28`) ;
   s1 écrit « une quantité saisie ne change pas ». Non bloquant.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| sunstore-2 01 à 04 | clair | 390 | bloc, lignes, « Rabais », « 2/2 · 1 sans prix unitaire », vaccins avec icône | 1 (icône « Autres ») | — |
| sunstore-2 05, 06 | clair | 390 | recherche « rabais » 2/5, fiche du rabais | — | — |
| sunstore-2 07 à 11 | clair | 390 | bandeau Abandonner, fermeture (fiche non ouverte : filtre encore posé, script) | — | — |
| bauhaus 01 à 04 (2e passage) | clair | 390 | lecture en cours, Levures 1 · Consommables 4 · Rénovation 5 · Autres 18, icônes, « 28/28 justes », « 16 à contrôler » | 1 | 1 |
| bauhaus 05 | clair | 390 | « peinture » 4/28 | — | — |
| bauhaus 06 à 10 | clair | 390 | bandeau Abandonner, fermeture | — | — |
| bauhaus 21 à 23 (3e passage) | clair | 390 | bloc final « 29/29 justes · 43 désaccords », Rénovation 29 sans icône, « Voir le désaccord » → BAUHAUS BUT NAAHU | — | — |
| bauhaus 24 à 28 | clair | 390 | BROSSE : fiche, quantité vidée (cases), unité → 1 + tuiles, tuile 5, unité L | 3 | — |
| bauhaus 29 à 32 | clair | 390 | VITRIFIC : fiche, quantité vidée sans unité, rien à toucher | 2 | 2 |
| bauhaus 33, 34 | clair | 390 | × › Abandonner, retour Finances | — | — |

## Doutes (non comptés)
- Même photo BAUHAUS, deux lectures : 28 lignes / 79,40 CHF manquants / « BAUHAUS Fachcentren AG » / « 16 à contrôler », puis 29 lignes /
  74,45 CHF / « BAUHAUS » / « 43 désaccords · 12 à contrôler » ; la vue est fidèle à chaque lecture, la lecture change.
- La fiche ouverte par « Voir le désaccord » (BAUHAUS BUT NAAHU) ne montre toujours pas en quoi les lectures divergent (mineur des verdicts précédents).
- Le 2e passage a été capturé pendant la 3e lecture (barre « vérification », « Confirmer » gris avec roue, « Lectures ●●◌ ») : état provisoire voulu, lisible.
- Fermer avec × puis « Abandonner » : rien d'enregistré, vérifié trois fois (`preuveEncore false`). Cave et 1280 non joués (coût Gemini).

LEÇON PROPOSÉE : une règle d'écran qui dépend d'une famille rendue par l'IA se juge sur deux lectures de la même pièce ; la première a dit
« tout en Rénovation », la seconde « Levures et Consommables », et la règle « stock limité au brassage » n'a tenu que sur la première.
