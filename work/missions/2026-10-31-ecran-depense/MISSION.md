# Mission 2026-10-31-ecran-depense — refaire l'écran « Nouvelle dépense » et fiabiliser la facturation

## Objectif
L'écran suivant du programme « refaire tous les écrans un à un ». Ses mots (SPEC-BRASSEUR, 31.10, mot pour mot) : « déjà la partie
business est pas 100% correcte. Les liens avec le stock et tout de font pas correctement, certain champs sont mal remplis. Pas sûr que ça
upload vraiment le document sur mon drive... Et avec la facture d'envoyer ça a pris vraiment longtemps 10s 20s sur téléphone. » ;
« Aussi sur les entrée, prévision et Tout c'est pas top. » ; « Surtout montrer les points où l'ia n'es pas sûr » ; « comme c'est de la
facturation, c'est super important, ça doit être très fiable ! » ; « À tester aussi en long en large sur la vrai app ».
Sa facture et ses trois captures : `brasseur/` (hors Git : nom et adresse).

Fini veut dire :
- sa facture 372765 lue juste, champ par champ, ligne par ligne, et le stock relié juste, prouvés par un test sur la vérité de sa facture
  (Gemini simulé) ;
- le justificatif réellement dans son Drive, et prouvé ;
- un temps de lecture mesuré et réduit ;
- les points incertains montrés à leur place ;
- l'écran refait en entonnoir allégé (D204), choisi par lui, porté ;
- le tout joué sur l'app en ligne, dans les accords qu'il donne.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Ordre : fiabilité d'abord (lecture, stock, Drive, lenteur), interface ensuite | — | pilote | tranchée : c'est de la facturation (« ça doit être très fiable ») |
| Les contrôles de cohérence (somme des lignes, TVA par taux, total) | par l'IA ; par le code | pilote | tranchée : par le code, déterministes ; l'IA lit, le code vérifie |
| Tests sur l'app en ligne : lectures Gemini facturées, dépense de test écrite puis supprimée, fichier de test dans son Drive | — | utilisateur | ouverte : accords groupés |
| Le choix de la variante d'écran | — | brasseur | ouverte |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| d1 | diagnostic : lecture de la facture, champs, lignes, liens au stock, incertitude ; vérité de sa facture en fixture | jugement | auteur | sonnet | 100 | work/missions/2026-10-31-ecran-depense/diagnostic/d1/** | — | DIAGNOSTIC.md, fixture, tests rejoués | pilote | — |
| d2 | diagnostic : Drive, lenteur, onglets Entrées, Prévision et Tout | jugement | auteur | sonnet | 100 | work/missions/2026-10-31-ecran-depense/diagnostic/d2/** | — | DIAGNOSTIC.md, mesures | pilote | — |
| i1 | inventaire et captures de l'écran actuel (fixtures) | mécanique | executant | haiku | 60 | work/missions/2026-10-31-ecran-depense/inventaire/** | — | inventaire-depense.md, captures ouvertes | pilote | — |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md. Chaque défaut du diagnostic devient un test qui échoue sur le code d'aujourd'hui avant sa
correction (L13). Son choix d'écran va dans `choix/ecrans-app.json` (D206).

## Budget
Avant : semaine, tous modèles 12 %, Fable 8 % (31.10, vers 17 h).

## Sources
- `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/services/driveFileStore.ts`
- `functions/src/invoiceScanCore.ts`, `functions/src/invoiceVisionReview.ts`, `functions/src/invoiceScanBudget.ts`
- `docs/finances.md`, `docs/finance-verification.md`, `docs/financial-sync.md`, `docs/gemini-budget.md`, `docs/qa/mobile-depenses-drive-2026-09-09.md`

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Signature
