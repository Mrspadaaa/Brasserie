# Voie c1 — neuf contrôles de robustesse de la lecture (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L13, L20, L28, L29), la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11), le skill
  `banc-lecture`, `functions/src/invoicePoints.ts`, le schéma et la consigne de lecture des pièces (`functions/src/`, aiTask), le calcul des
  lignes `lignesDeLecture` (finale.ts) et `src/ui/finance/ExpenseSheet.tsx` (lecture seule : la voie t1 le tient).

## Objectif
Un module pur `src/domain/finance/controlesPiece.ts` (+ tests) qui rend, pour une lecture et son brouillon, une liste de contrôles
`{ id, ok: true|false|null, attendu, trouve, ecart?, geste }` (null = non vérifiable, jamais inventé) :
1. comptage indépendant : montants de la colonne et codes EAN comptés par la lecture, à part des lignes (champ ajouté au schéma de lecture,
   même appel, sans appel de plus) contre lignes lues ;
2. clé EAN-13/EAN-8 (mod 10) : liste des EAN invalides (chiffre mal lu) ;
3. brut − rabais = total ; les rabais sont des remises, jamais des articles ;
4. TVA recalculée par taux (total × t / (100 + t)) contre TVA imprimée, à 0,05 près ;
5. paiement partagé : montant payé (EFT, TWINT…) ≠ total, égal à la somme de ce ticket et d'autres dépenses du même fournisseur, même jour ;
6. doublon : même fournisseur, même date et heure, même total qu'une dépense existante ;
7. lignes hors articles écartées : montant en devise (EUR), moyen de paiement, sous-totaux ; jamais comptées dans les lignes ;
8. prix plausible : prix unitaire contre celui du même article au stock ou dans les achats passés (écart > ×2 signalé, sinon rien) ;
9. photo incomplète : la lecture signale une zone de montants coupée, pliée ou tachée (champ du schéma) ; drapeau, jamais deviné.
Côté serveur, seulement les champs du schéma et de la consigne (1, 7, 9) dans `functions/src/`, avec leurs tests simulés.
**Ne déploie rien** : rends au pilote la commande (`firebase deploy --only functions:aiTask`).

## Contrôles
- Tests qui échouent avant (L13), sur les quatre pièces de `../../pieces/` en lectures simulées anonymisées (vérité dans
  `../b1/VOIE.md`) : Sun Store 1 et 2 → paiement partagé 14,60 + 149,25 = 163,85 et rabais hors articles ; BAUHAUS taché → 29 = 29 et
  écart 74,45 ; BAUHAUS copie → doublon avec le taché (02.11.2026 12:31, 352,05) ; un EAN faux repéré.
- `npx tsc --noEmit -p .` ; tests de `functions` concernés ; `npx vitest run <tes tests> --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/c1/tests.txt`.
- Gemini toujours simulé.

## Possède
- `src/domain/finance/controlesPiece*.ts`, `tests/**/controlesPiece*` ;
- dans `functions/src/`, le schéma et la consigne de lecture des pièces, ainsi que leurs tests ;
- `work/missions/2026-11-09-depense-totaux/voies/c1/**`.
Pas `ExpenseSheet.tsx` : la voie t1 branchera ta liste dans le bloc des contrôles. Décris-lui l'API en tête de RESULTAT.md. Ni commit ni stash.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 3 contrôles : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/c1/tests.txt`).
- Pas d'écran dans cette voie : pas de capture.
Réponse finale au pilote : une ligne.

## Contrat réécrit (09.11, après la passe P5 de b1 : `../b1/RESULTAT.md` § « Défauts de P5 » et « Pour le rendre déployable »)
1. B1 bloquant : sunstore-1 régresse (code TVA « 2 » lu comme quantité, montant de ligne vide). La quantité est le nombre imprimé en tête
   de ligne, jamais le code TVA de droite ; le montant de ligne est toujours rempli quand il est imprimé. Test simulé qui échoue avant.
2. `countedAmounts` : montants d'articles et de remises seulement (ni total, ni reçu, ni EFT) ; le comptage ne vote que sur ce que la 3.8
   ou deux lectures confirment.
3. `cle-ean` et `comptage-ean` restent « non vérifié » (ok: null), sans drapeau, tant que les EAN ne sont pas lus à 90 % au moins.
4. B6 : `amountPaid` se vote comme le total (deux lectures qui concordent l'emportent sur une 3.8 vide).
5. Rabais : sous-ligne rattachée à l'article, hors du compte d'articles (décision du pilote, option b).
Ne déploie rien ; la voie b1 rebancera ensuite (4 pièces × 3 tirages, plus les 7 pièces déjà au banc).
