# Revue du plan s1-stock, triée par le pilote (31.10)

Deux relecteurs neufs : `REVUE-conception.md` et `REVUE-pret.md` (preuves et détail y restent). « corrigée » : l'auteur corrige PLAN.md
selon la colonne « Correction attendue », précisée par la Raison quand le pilote tranche, avant toute ligne de code.

Règle du pilote pour toute la voie : une proposition perdue est permise, une fausse proposition ne l'est pas. Dans le doute, rien n'est
proposé. Une marque visible sur la ligne repliée (`lineStatus`) sert seulement aux cas où proposer reste juste mais où un fait n'est pas
confirmé ; jamais pour excuser une proposition douteuse.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | « Crystal » 25 kg, nature inconnue, face au seul « Houblon Crystal » en g : proposé, 25 000 g de houblon en stock ; la chasse n'a que des cas avec mot de nature | nature inconnue : refuser dès que l'identité de l'article est aussi un nom connu d'une autre catégorie (catalogue houblons `src/data/hopDatabaseBootstrap.json`, malts et levures du dépôt, autres articles du stock) ; T2 : « Crystal » kg face à « Houblon Crystal » g → rien, et l'inverse avec « Malt Crystal » | corrigée | les 9 lignes de 372765 déjà appariées le restent (à vérifier au TEMOIN) |
| 2 | majeur | `line.kind` inutilisé : « Acide lactique » ingrédient face à un acide de nettoyage, « Sel », « Chaux », « Soude » | compatibilité `kind` ↔ catégorie de l'article (ingrédient refuse emballage et entretien ; nettoyage refuse les matières ; emballage refuse les matières) ; inconnu ou « Divers » : pas de refus ; tests « Acide » et « Sel » | corrigée | — |
| 3 | majeur | R2 : un grade chiffré (« Carafa 3 Kg » × 3) passe pour un conditionnement dès qu'il divise la quantité | un nombre n'est un conditionnement que s'il est séparé du nom par une virgule ou un point médian et divise la quantité ; sans séparateur, il est identité ; T2 : « Carafa 3 Kg » × 3 et × 6 face à « Malt Carafa » → rien ; « Haferflocken, 1 Kg » × 2 → proposé | corrigée | le plan recompte la chasse et `stockLineMatching.test.ts` sous cette règle, et dit chaque proposition perdue |
| 4 | majeur | le nom propre remplace `description`, mais `evidence` n'est pas enregistré : α, récolte, poids, libellé imprimé se perdent ; l'article créé perd son α (`purchaseEntry.ts:222`) | ne pas perdre de donnée | corrigée | décision du pilote : `description` reste le libellé brut, toujours. Le nom propre (`readProductLabel`) sert à l'appariement et est livré testé (T7) ; nommer l'article créé avec lui, et écrire son `alphaPct`, revient à la voie de la fiche produit (S6), qui possède la création. Décision n° 3 du § 8 refusée |
| 5 | majeur | R4 : une α (ou une récolte) différente présélectionne l'article ; la phrase est cachée dans `evidence` replié | une α ou une récolte différente, connues des deux côtés, ne présélectionne rien ; T2 : α 11,8 face à 11,3 → rien ; récolte 2024 face à 2023 → rien | corrigée | décision du pilote : pas de marque ici, rien n'est proposé ; le brasseur choisit l'article lui-même (d1 S3 demande une question, pas un lien par défaut) |
| 6 | majeur | R5 : « Safale US-05 500 g » × 1 Stk face à « Safale US-05 » sans poids : proposé, 1 sachet au lieu de ~43 | lire le poids de l'article dans son nom ou `yeastLot` ; poids différent → rien ; article sans poids → proposé avec la marque « poids du sachet non confirmé » sur la ligne repliée | corrigée | décision du pilote : la marque va dans `lineStatus` (ligne repliée), pas dans `evidence` ; l'écriture de `ExpenseSheet.tsx` s'étend à ces lignes (Prêt n° 6) |
| 7 | majeur | R9 : « Cascade T90 (Cryo) » : `t90` fait de « (Cryo) » une annotation ; ARB-M4 l'interdit | R9 limitée à la nature Levure ; les jetons de GENERIC ne comptent pas comme code ; T2 : « Cascade T90 (Cryo) » et « Pilsner (bio) » → rien | corrigée | — |
| 8 | majeur | R8 : céréales absentes (épeautre, sarrasin, millet, sorgho, triticale) : « Malt d'épeautre » face à « Épeautre » proposé | compléter la liste (FR, DE, EN) ; un test par céréale ; écrire que tout grain hors liste reste une fausse proposition possible | corrigée | — |
| 9 | majeur | `jus0Journey.test.tsx:55-69` (C3, « MALT FUME DU BANC ») casse aussi, non cité | ajouter C3 à la décision n° 1 ; rejouer tout `tests/integration/` sur HEAD avec la garde levée avant le code, lister tout ce qui change | corrigée | le fichier entre au Possède et au CHECK de G2 : les deux `it` (`:55-69`, `:186-206`) deviennent « proposé, aucune écriture » ; le sort de `:134` et `:158` est dit après rejeu réel |
| 10 | majeur | passe 2 : « Munich » chez Rauch AG face à « Malt Munich Rauch » est proposé ; fausse proposition connue | la dire, test miroir, marque « fournisseur ignoré » | contestée | le mot retiré est le fournisseur de cet achat même : un article nommé d'après son fournisseur désigne le produit de ce fournisseur, et la ligne n'en diffère que par ce mot ; c'est le cas voulu par `stockLineMatching.test.ts:63-66`. Une variante du fournisseur (« Munich II ») porte un jeton de plus et reste refusée. Le test miroir est écrit et verrouillé, sans marque (bruit, A3) |
| 11 | détail | R10 : marque ignorée quand le reste est un mot commun (« Abbaye ») | marque tolérée seulement si le reste porte un code de souche (lettres et chiffres, hors GENERIC) ou figure dans une liste fermée de souches nommées (Verdant IPA, Windsor, Nottingham, Voss, Belle Saison) | corrigée | — |
| 12 | détail | l'unité « Stk » réécrite en « sachet » n'est pas rendue quand la proposition est écartée | garder `originalUnit` et la rendre quand le brasseur écarte la proposition ; test | corrigée | — |
| 13 | détail | nom propre d'une ligne sans proposition : « Pilsner 25 kg » × 1 → « Pilsner 25 » | distinguer « incertain » d'« identité » dans `readProductLabel` : « 25 kg » reste du texte | corrigée | sans effet sur `description` (n° 4), utile à la future fiche produit |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | casse du nom propre inatteignable : « CARAMÜNCH® Typ 2 Kg » contre « Caramünch Typ 2 », mais « LALLEMAND Windsor » en capitales | dire la règle de casse ; réécrire les attendus de T5 et T7 | corrigée | décision du pilote : `name` garde la casse imprimée (sans ®™) ; toute comparaison est sans casse ni accents ; T5 et T7 comparent ainsi ; l'affichage reste « CARAMÜNCH Typ 2 ». Aucune règle de casse inventée |
| 2 | majeur | `jus0Journey.test.tsx:55-69` oublié ; sort de `:134`, `:158` non dit | deux `it` à retourner ; rejeu réel du fichier ; écriture donnée à la voie | corrigée | même décision que Conception n° 9 |
| 3 | majeur | contexte houblon ou levure inconnu pour une ligne sans article (« Goldings East Kent 5.5% ») : l'α resterait dans le nom propre | dire d'où vient le contexte | corrigée | décision du pilote : le contexte houblon vient de la nature Houblon ou d'un nom trouvé au catalogue houblons du dépôt (le même qu'à Conception n° 1) ; le contexte levure, de la nature Levure ou de la liste fermée de souches (Conception n° 11). Ce contexte sert au nom propre, jamais seul à proposer |
| 4 | majeur | l'α se perd à la création de l'article (`purchaseEntry.ts:222` lit `description`) | garder l'α tant que la création ne l'écrit pas | corrigée | même décision que Conception n° 4 : `description` reste brute |
| 5 | majeur | T5 attend `Stock ligne n = none` pour les lignes de mouture, qui sont `service` sans sélecteur | `queryByLabelText('Stock ligne n')` vaut `null` pour une ligne `service` ; `none` seulement pour les lignes de stock | corrigée | — |
| 6 | détail | écriture de `ExpenseSheet.tsx` hors de la fenêtre l. 140-160 (import l. 12, `.map` l. 150) ; conflit possible avec s2 | énumérer les lignes ; dire l'ordre avec s2 | corrigée | décision du pilote : s1 écrit l'import (l. 12), `attach` (l. 148-155) et `lineStatus` (vers l. 196, la marque de Conception n° 6) ; s2 n'écrit rien dans ce fichier ; la voie r1 branchera ce qui vient de s2 après s1 |
| 7 | détail | contenu de `evidence` non dit ; la marque α n'apparaîtrait pas sur la ligne repliée | garder `Réf.` et l'extrait ; ordre : `Réf. · extrait · Libellé : brut · déduit` | corrigée | la marque « α différente » disparaît (rien n'est proposé, Conception n° 5) ; seule « poids du sachet non confirmé » reste, dans `lineStatus` |
| 8 | détail | R5 hors levure ambigu (`pièce`, `pce`, `Stk`) | table exacte des équivalences par catégorie, et l'attendu de « `Stk` face à une bouteille en pièces » | corrigée | — |
| 9 | détail | T1 n'a qu'un `expect` : 1 rouge au lieu de 18 | un `it` par cas, comme `v3d.hunt.test.ts` | corrigée | — |
| 10 | détail | `mesures.ts` s'exécute à l'import et réécrit le diagnostic ; la lecture de T5 est hors du dossier | copier le stock simulé (16 articles) et la lecture réconciliée dans `tests/unit/depense/stock/fixtures/` | corrigée | la copie ne contient ni nom ni adresse du brasseur (vérifié par le relecteur) |
| 11 | détail | T8 chronométré à 250 ms : instable sur ce poste | borne à 1 s, ou compteur d'opérations | corrigée | — |
| 12 | détail | R3 (c) : le préfixe `MA`/`HO`/`HE` n'est pas lié au fournisseur | l'écrire comme risque assumé | corrigée | le préfixe ne fait que refuser : au pire une proposition perdue, permise |
| 13 | détail | `prompts.ts` sans chemin complet | `functions/src/prompts.ts` | corrigée | — |

## Décisions du plan (§ 8)
1. `jus0Journey.test.tsx` : (a), avec C3 ; le fichier entre au Possède (Conception n° 9).
2. R10 : acceptée avec la précision de Conception n° 11.
3. Nom propre dans `description` : refusée (Conception n° 4).
4. `stockLineMatching.test.ts:61`, quantité 1 → 5 : acceptée, à revoir sous la règle du séparateur (Conception n° 3) ; si le cas n'en a plus
   besoin, l'entrée reste.
5. D5 « Cascade · 2024 » proposé : accepté seulement quand l'article n'a pas de récolte connue différente (Conception n° 5).
6. Mot du fournisseur dans l'article : gardé (Conception n° 10, contestée).
