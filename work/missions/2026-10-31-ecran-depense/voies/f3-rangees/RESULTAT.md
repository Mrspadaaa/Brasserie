OK — passe 3 : lien proposé jaune jusqu'à « Garder », unité « ? », bis fondu, date fermée

## Passe 3 (VERDICT-f3-p2.md, ACCEPTE : 1 majeur et 3 détails)

Tests écrits d'abord, rouges sur l'état de la passe 2 : `journaux/temoin-p3-rouge.log`, « 4 failed | 16 passed (20) » (majeur 1, détails 2, 3 et 4).

| Point | Fait | Où |
|---|---|---|
| **Majeur 1** (D277, « globalement pour tout ») | Rangée : le picto du lien proposé est le cube relié **en jaune pointillé** (`PictoLien propose`), sur `[data-dp-lien][data-dp-niveau="repris"]`. Son aria dit « relié, proposé par la lecture ». Récap : pastille jaune « **1 proposé** » (`data-va="propose"`, niveau repris) à côté de « 1 relié ». C'est un compte de niveau, comme « à contrôler » : la partition des liens reste égale au nombre de lignes. La phrase « n proposée(s) par la lecture, à vérifier » est retirée ; seul « À vérifier » reste, quand la lecture le dit. Plateau : « article « Pilsner Malz » · proposé » en jaune, et un bouton **Garder** jaune en tirets. Garder ou ⇄ confirme le lien, et le jaune tombe (picto plein, pastille disparue, « · relié »). | `ExpenseSheet.tsx` (articleEl, comptes, preuve) ; `Ligne.tsx` (`lienNiveau`) ; `Pictos.tsx` (`propose`) |
| Détail 2 | Le champ d'unité vide affiche « ? » rouge, bord en tirets (`data-dp-niveau="inconnu"`), au lieu de « kg, g » tronqué. | `champUnite` |
| Détail 3 | Bis, plateau ouvert : la barre n'est plus rendue. Sa ligne « article » porte « stock : Target α 11,8 », le bouton « Target bis » et **un seul** ⇄. Plateau fermé : la barre jaune revient (la base). La rangée suit l'ouverture par un état (re-rendu au `toggle`), pas par CSS : en CSS, les deux boutons resteraient dans le DOM. Le bis reste « douteux » ouvert comme fermé. | `ExpenseSheet.tsx` (`ouverte`, `bisFondu`) |
| Détail 4 | La carte « Date de l'achat » est fermée au repos et s'ouvre au toucher de « date ? » (D262b, `surDate`). Son avertissement tient sur une ligne : `whitespace-nowrap` et `truncate`, avec le texte entier en `title`. | `ScanHint court` |
| Détail 5 (Stk jaune ou non) | Non corrigé, comme demandé : le pilote le dira sur la page. | — |

Tests adaptés au majeur 1 (valeur de HEAD en commentaire) : p3c T15, finitions point 2, tri C6 (Σ des comptes hors niveaux), `stock/unites.test.ts` D214 et `jus0Journey` C3. Les ajouts de la traduction (`nomsJeton`, `traduireLignes`, `nom=` avec `nameFr`, onChange du Libellé avec `retenirNomBrasseur`) restent intacts, et `noms-fr/ecran-noms.test.tsx` est vert.

### Pourquoi « Rattacher les 5 » et « +5 ↳ » de la base n'ont plus d'objet
Dans p3c-3, la mouture était une **ligne** de la facture (« Schroten 0,10 »), qu'il fallait rattacher à son malt, un par un ou par « Rattacher les 5 ». L'en-tête de bande comptait ces lignes en attente : « 7 +5 ↳ ». Sur les commandes réelles du banc (Weyermann concassé, D275a), **le concassage est un état du malt**, pas une ligne à part. Le malt arrive « concassé », et le supplément est compris dans son prix. Il s'affiche en pastille ↳ sur la rangée du malt, et le récap le compte dans « ↳ n moutures +x ». Il ne reste aucune ligne de mouture orpheline à rattacher : le bouton et le compteur de bande n'auraient rien à faire. Le geste reste là où il sert encore. Une vraie ligne de mouture imprimée à part garde sa pastille « rattacher à … », et « Rattacher les n » (`rattacherTous`) apparaît dès qu'il y en a plus d'une.

### Sorties décisives (passe 3, copie isolée)
- Tests (`tests/unit/depense`, `expenseSheet`, `expenseSheetMouture`, `jus0Journey`) : `journaux/tests-p3.log`, « Test Files 2 failed | 112 passed (114) », « Tests 5 failed | 1865 passed | 3 skipped ». Les 5 rouges sont les témoins de f4 (`enrichir/temoin.test.ts` 4, `temoin-e4.test.ts` 1), rouges par conception jusqu'à son branchement. Ce ne sont pas mes fichiers.
- `npx tsc --noEmit` : 0 erreur (`journaux/tsc-p3.log`).
- `npm run build` : « ✓ built in 13.40s » (`journaux/build-p3.log`).
- Captures : `journaux/captures-p3.log`, « F3 CAPTURES OK ». Console propre. Rangées de 39 px au plus à 390 et de 32 px au plus à 1280. Débordement 0 px.

### Captures (passe 3), ouvertes et regardées
Dans `work/missions/2026-10-31-ecran-depense/voies/f3-rangees/captures/`, en `tactile390-*` et `pc1280-*`, clair et cave :
- `*-repos.png` : récap avec « 1 relié · 1 proposé (jaune) · 7 nouveaux · 1 bis · … », sans phrase. La carte Date est fermée.
- `*-zoom-propose.png` : rangée Pilsner Malz en plein format, cube relié jaune pointillé, lisible à 18 px.
- `*-relie.png` : plateau de Pilsner, « · proposé » en jaune, puis Garder, ⇄ et Retirer.
- `*-relie-garde.png` : après Garder, « · relié », picto plein, plus de bouton Garder.
- `*-bis.png` : Target bis ouvert, avec dans la ligne « article » « α 11,3 · stock : Target α 11,8 · Target bis », un seul ⇄, et aucune barre sous le plateau.
- `*-bis-ferme.png` : rangées fermées, la barre jaune du bis présente.
- `*-rouge-unite.png` : Brauzusatz ouvert, champ d'unité « ? » rouge en tirets, carte Date fermée.
- `*-date.png` : « date ? » touché, la carte s'ouvre. L'avertissement « À confirmer · Date absente ou illisible… » tient sur une ligne.

Fichiers écrits en passe 3 :
- `src/ui/finance/ExpenseSheet.tsx`
- `src/ui/depense/Ligne.tsx`, `src/ui/depense/Pictos.tsx` et `src/ui/depense/p3c.css` (la règle ajoutée puis retirée : aucun écart)
- `tests/unit/depense/rangees/rangees.test.tsx`, `ecran/p3c.test.tsx`, `ecran/finitions.test.tsx`, `ecran/tri.test.tsx`, `stock/unites.test.ts` et `tests/integration/jus0Journey.test.tsx`
- `voies/f3-rangees/outils/capturer-f3.mjs` (scènes relie-garde, bis-ferme, date et zoom), `ETAT.md` et ce fichier

Tous ces fichiers sont dans « Possède ». `git status` ne montre rien d'autre de mon fait.

Prédiction : « Là je vois tout de suite ce que la lecture a deviné. Un toucher sur Garder et c'est fini. »

Bout en bout doc14 : non lancé, comme demandé (le pilote le joue).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un lien proposé par la lecture est un **niveau** (jaune) posé sur le lien « relié », pas une catégorie de lien. Les comptes de niveau restent hors de la partition des liens, dont la somme vaut le nombre de lignes.
LEÇON PROPOSÉE : aucune.

## Passe 2 (VERDICT-f3.md, À REPRENDRE, 1 bloquant)

TEMOIN AVANT (L13) : 4 tests neufs dans `tests/unit/depense/rangees/rangees.test.tsx`, joués rouges sur la passe 1 avant toute correction : `journaux/temoin-plateau-rouge.log`, « 4 failed | 12 passed ».
- Défaut 1, en 3 tests :
  - au premier plan du plateau, ni « Type d'achat », ni « Réception en stock », ni « Nom de l'article », ni « Libellé de la facture », ni « Voir l'extrait », ni « TTC », ni « Créer un nouvel article » ;
  - `[data-dp-calcul]` avec ses 4 champs et « ✓ au centime » ;
  - les segments Ingrédient / Service / Matériel ;
  - un seul `[data-dp-plus]` ;
  - le nom de l'article saisi une seule fois ; « nouvel article » dit une fois ; la fiche « approchée » dite une fois ;
  - pour le matériel, « Fiche matériel » est la seule liste.
- Défaut 8, en 1 test : les segments g / kg / Stk, g pré-choisi ; un toucher lève le jaune et garde le prix.

1. **Bloquant, défaut 1 : le plateau est celui de p3c-3.** Au premier plan, dans l'ordre :
   - « imprimé « … » · réf » ;
   - l'état du malt (« concassé, +0,10 par Kg, compris ») ;
   - l'unité déduite ;
   - `[q] [u] × [p] = [m]` en champs compacts sur une ligne, puis « ✓ au centime », ou « ≠ montant, écart à vérifier » en jaune (`data-dp-niveau`) ;
   - Ingrédient / Service / Matériel en segments ;
   - « article « [nom] » · nouvel article ⇄ α … fiche … », ou « article « X » · relié|proposé ⇄ Retirer +4 kg », ou « article « ? » · à choisir » avec la recherche après ⇄ ;
   - pour le matériel, sa seule liste « Fiche matériel » ;
   - la mouture (son tableau).

   Derrière un seul « plus » : le libellé et la corbeille, « Type d'achat » (les natures hors des trois segments), « Voir l'extrait », « Réception en stock » (Mettre en stock, liste Stock), et la recherche d'un article déjà relié.

   Doublons retirés :
   - le nom de l'article ne se saisit qu'une fois, dans la ligne « article » (NomArticle `enLigne`) ;
   - « TTC », « 2 × 2,4 = montant ✓ », « Quantité reçue » et « Unité lue / reçue » sont remplacés par la ligne de calcul ;
   - la fiche se dit une fois, par sa pastille, la phrase entière en titre.

   Le formulaire simple (saisie sans justificatif) est inchangé : il réemploie les mêmes pièces. Ajouts du pilote gardés : `nameFr`, `retenirNomBrasseur` dans l'onChange du Libellé, `nom=` ; `noms-fr/ecran-noms.test.tsx` est vert.
2. **Défaut 8** : « unité g déduite · … · à contrôler » est suivi des segments g / kg / Stk, l'unité déduite pré-choisie. Un toucher écrit l'unité : le jaune tombe, et le prix reste quand c'est l'unité déduite (D213).
3. **Détails 4 à 7** :
   - « ✓ Somme = imprimé 104,56 » sur une ligne (colonne 1,12 fr, libellé sans retour) ;
   - « ✓ Qté × prix 12/12 » comme la base (le ✓ quand seul le port est sauté ; « lues » retiré) ;
   - « Payé · date ? » en rouge tant que la date manque ;
   - « Ordre du papier 12 · 92,56 + port 12,00 » ;
   - « 0,00 + ? » d'« Autres » tout en rouge (`data-dp-niveau="inconnu"`).
4. **Défaut 3** : le banc `commande` est enrichi, toujours fictif :
   - « Pilsner Malz, Kg » 4 × 1,50, relié à l'article du stock simulé (« 1 relié ») ;
   - « Target 11.3% » face à « Target 11.8% », en bis, avec sa barre jaune « stock : Target α 11,8 [Target bis] ⇄ » ;
   - « Brauzusatz Probe » 3, sans prix ni famille : rouge « 3 ? », barre g / kg / Stk, « 1 à remplir ».
- Décisions du pilote appliquées : la ligne enregistrée garde la base, FinanceLine n'est pas modifié ; « Stk » face à un article en kg devient nouvel article d'office.

## Sorties décisives (passe 2)
- Tests (copie isolée, `journaux/tests-p2d.txt`) : `Test Files 2 failed | 111 passed (113)`, `Tests 5 failed | 1850 passed | 3 skipped`. Les 5 échecs sont tous dans `tests/unit/depense/enrichir/temoin.test.ts` (4) et `temoin-e4.test.ts` (1), les témoins de f4, attendus. Hors f4, tout est vert, y compris `noms-fr/ecran-noms.test.tsx` et les trois tests d'intégration.
- `npx tsc --noEmit` : code 0. `npm run build` : code 0, « built in 13.66s » (`journaux/build-p2.log`).
- Captures : `F3 CAPTURES OK` (`journaux/captures-p2b.log`). Rangées de 39 px au plus à 390 (seuil 52) et de 32 px au plus à 1280 (seuil 36), 0 bouton « Créer », débordement 0, console propre.
- Tests adaptés, chacun avec sa raison et la valeur de HEAD en commentaire :
  - p3c D12 : « 23/23 » sans « lues » ;
  - fiche « la pastille dit la fiche » : la phrase entière devient le titre de la pastille ;
  - rangees, pour le banc enrichi : 11,1 Kg, 1 relié, 1 bis, une seule rangée rouge.
- Bout en bout doc14 : à jouer par le pilote.

## Captures (passe 2), ouvertes et regardées
Dossier : `work/missions/2026-10-31-ecran-depense/voies/f3-rangees/captures/`. 36 fichiers, nommés `{tactile390,pc1280}-{clair,cave}-{repos,malt-concasse,houblon-jaune,materiel,relie,bis,rouge-unite,ligne-ajoutee,papier}.png`. La maquette est à droite : p3c-3-repos au repos, p3c-3-geste-plateau pour un plateau ouvert, p3c-3-1280-repos au repos à 1280.

J'ai regardé :
- 390 clair : repos, malt concassé, relié, bis, papier ;
- 390 cave : repos, houblon jaune ;
- 1280 clair : relié.

Défauts vus puis corrigés :
- le segment « Ingrédient » pressé était noir sur noir en clair (il prend maintenant le style de la bascule Catégorie / Papier) ;
- « Somme = imprimé » chevauchait 104,56 ;
- α 14,5 s'intercalait entre le nom et « » · nouvel article » (il passe après ⇄).

Limites :
- les barres « bis » et rouge restent sous la rangée, donc sous le plateau quand il est ouvert ;
- à 1280, la planche d'un plateau ouvert reprend la maquette mobile agrandie (aucune maquette de plateau à 1280).

## Fichiers écrits (passes 1 et 2)
- `src/services/purchaseEntry.ts` (`imprime?`, `uniteDeduite?`, `uniteEffective`) et `src/services/geminiScanner.ts` (`nameFr?`).
- `src/ui/depense/rangees.ts` (neuf), `groupes.ts`, `Ligne.tsx`, `Liste.tsx`, `Recap.tsx`, `Pied.tsx`, `p3c.css`, `apercuDev.ts` (banc `commande`, fictif).
- `src/ui/finance/ExpenseSheet.tsx` : passe 2, les pièces de la ligne, le plateau, NomArticle `enLigne`, la tuile Règlement, l'ordre du papier, « Qté × prix ».
- Tests :
  - `tests/unit/depense/rangees/rangees.test.tsx` (neuf, 16 tests) ;
  - adaptés : ecran/{bande, ecran, finitions, groupes, p3c, tri}, fiche/ecran, stock/{ecran, unites}.
- Voie : `PLAN.md`, `ETAT.md`, `outils/capturer-f3.mjs`, `outils/temoin-head.sh`, `journaux/`, `captures/`.
- `git status --short` : tout ce que j'ai écrit est dans Possède. Les autres fichiers modifiés de `src/domain`, `src/services/enrichissement*`, `tests/unit/depense/enrichir`, `noms-fr`, `setup.gemini-guard` et `geminiNetworkGuard` viennent de f4 et du pilote.

## Rien ne se perd
- Pour un ingrédient, le libellé est la base, plus ce que lireOptions n'a pas compris. L'imprimé entier reste dans `imprime` (brouillon), au plateau, dans le justificatif et dans la lecture en cache (décision 1 du pilote).
- Hors ingrédient, le libellé reste « nom · variante ».
- Aucun champ Firestore n'est retiré. Une valeur tapée n'est jamais écrasée.
- Les champs du plateau sont ceux d'avant, aux mêmes noms accessibles (Quantité, Unité, Montant ligne n) ; seul « Prix ligne n » est neuf.

## Ce qui reste écarté de la base
- « Rattacher les 5 » et « +5 ↳ » de l'en-tête Malts : sans objet, puisque le concassage est un état du malt (pastille ↳) et non plus une ligne de mouture à rattacher.
- La TVA du bandeau reste « — ».
- « Mischung: Einzelprodukt » est compris par lireOptions, mais n'a pas de texte en français (optionsDuNom.ts, f1).
- Les noms restent en allemand dans le banc : c'est le défaut 2, à f5 et au pilote. La traduction branchée par le pilote est sautée en aperçu.
- Écart à « aucun code par heredoc » : 6 lignes de CSS ajoutées par `cat >>` en passe 1. Je ne l'ai pas refait.

DEMANDE EXECUTANT : aucune (le bout en bout doc14 est au pilote).

Prédiction : « Là j'ouvre une ligne et c'est la vue de base : la quantité, le prix, le ✓, l'article et c'est tout, le reste dans plus. »

CONNAISSANCE : `tests/unit/depense/enrichir/temoin-e4.test.ts` (f4) échoue lui aussi dans la batterie de f3. Il est attendu, comme `temoin.test.ts`.

LEÇON PROPOSÉE : porter une maquette, c'est porter chacun de ses états ouverts ; un plateau « hors des zones » reste dans la règle n° 1. Écrire le contrôle du premier plan (ce qui n'est pas derrière « plus ») avant de toucher la rangée.
