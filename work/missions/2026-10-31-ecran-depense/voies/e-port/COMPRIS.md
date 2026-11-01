# COMPRIS — voie e-port (écran Nouvelle dépense = r2b, le ticket)

## Objectif
Faire de la maquette choisie `v1/r2b/etat.html` l'écran « Nouvelle dépense » de l'app (`ExpenseSheet`), repris geste par geste dans ses 9 états, sans changer les règles d'enregistrement, d'appariement et de lecture. J'y ajoute les corrections du critique (pastille-mot, bande collante, plus de « pas assujetti », interrupteur de stock), les greffes « À porter », les relais laissés par les voies de correction (mouture, S8, base de la date, reçu, gardes r2, points typés l2) et deux libellés des vues Finances. Dans ce premier temps j'écris seulement ce document, le plan (`PLAN.md`) et je m'arrête.

## Écrit dans
- `work/missions/2026-10-31-ecran-depense/voies/e-port/COMPRIS.md`
- `work/missions/2026-10-31-ecran-depense/voies/e-port/PLAN.md`
- `src/ui/finance/ExpenseSheet.tsx`
- `src/ui/depense/`
- `src/components/QuickActionModal.tsx`
- `src/domain/finance/forecast.ts`
- `tests/integration/expenseSheet.test.tsx`
- `work/missions/2026-10-31-ecran-depense/voies/e-port/`

## Fini quand
- G1 : ce COMPRIS est accepté par le contrôle.
- G2 : le plan a été relu par deux regards neufs, sans bloquant (le pilote le fait ; je reçois la revue triée).
- G3 : `npm run build` écrit « built in ».
- G4 : `tsc --noEmit` passe (TYPES OK).
- G5 : les tests de la dépense, de l'enregistrement, du stock et de l'écran passent, sans que je modifie ceux qui sont hors de mon « Possède ».
- G6 : l'audit des champs passe (tout champ via le composant protégé `Input`, jamais `type="number"`).
- G7 : mon script `capturer-depense.mjs` joue sur l'app servie les 9 états et les 6 retouches, à 390 tactile, 390 souris et 1280, écrit les scènes côte à côte (app à gauche, maquette à droite) et imprime `DEPENSE OK` ; j'ouvre les captures en image.
- G8 : RESULTAT.md dit le témoin avant, « Rien ne se perd », pendingId, S8, mouture, recomputeInvoicePoints, captures.

## Ne fait pas
- Pas de modification de `src/services/` (écriture), de `invoicePoints.ts`, de `functions/`, de `BrewWizard.tsx`, de `src/ui/fermentescibles/`, de `src/ui/identite/`.
- Pas de modification des tests hors de mon « Possède » : s'ils cassent, le plan le dit et le pilote tranche avant le code.
- Pas de Gemini réel, de Drive réel, de donnée réelle, de déploiement, de commit, de `git stash`, d'installation, de code écrit par heredoc ou `node -e`.
- Pas de nom ni d'adresse du brasseur dans une fixture ; rien lu dans `brasseur/` ni `functions/.env`.
- Pas de rive stock de u4b à 1280 (hors de cette voie).
- Pas de nouvel appel de service ni de retrait d'appel sans que le plan le dise.
- Je ne code pas avant la revue triée du pilote.

## Doutes
- Le reçu « reste affiché jusqu'à la fermeture » : aujourd'hui la feuille se ferme à l'enregistrement et un test hors Possède (`ecran-recu.test.tsx:72`) attend `onClose`. Je ne sais pas si le pilote veut ce changement de comportement.
- « Target bis » / « Créer CH » : le service qui crée un article neuf le nomme d'après le libellé imprimé ; il n'écrit aucun « bis ». Je ne peux pas toucher `src/services/`.
- La barre d'envoi « 0,4 / 0,7 Mo » et « tu peux fermer » : l'envoi Drive ne rend aucune progression et la feuille ne se ferme pas pendant l'envoi.
- Les tests hors Possède (raccord, stock, jus0Journey) lisent l'ancienne structure (`[data-purchase-line] summary`, libellés `Stock ligne n`, texte « Payé le … ») : je ne sais pas jusqu'où le pilote accepte de les voir changer.
- Les 100 mots au premier écran : la maquette est à 98 et les greffes (pastilles-mots, bande, Drive) en ajoutent.
