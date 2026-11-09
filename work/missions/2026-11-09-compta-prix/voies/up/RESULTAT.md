OK — étape 1 : PLAN.md de up (port de p2b, impôt bière) écrit ; aucun code, en attente de la revue

## Fichiers écrits
- `voies/up/PLAN.md` (défauts, changements, inventaire de la maquette en 21 lignes, 19 tests qui échouent d'abord, appelants, risques, hors périmètre, décisions).
- `voies/up/tests-head.txt` : rejeu sur HEAD (480f8d3e) des 30 fichiers qui chargent `ClientsTab`, `BatchDetailSheet`, `ProductionTab`, `swissBeerTax` : `Test Files 30 passed (30)` · `Tests 304 passed (304)`.
- Aucun fichier de code ni de test touché. Aucun commit.

## Lu avant d'écrire
`etat.html`, `NOTE.md` et `p2b-page.png` (ouverte en image) de p2b ; `PLAN-METIER.md` (§ 3.4, 3.5, 3.6) ; `COMMUN.md`, `ETAPE2.md`, `PHASE2.md` ; `d1/RESULTAT.md` et `d1/PLAN.md` ; `swissBeerTax.ts`, `chaineLitre.ts` ; `BatchDetailSheet.tsx`, `ClientsTab.tsx` (section Impôt), `Sheet.tsx`, `BrewBudgetDialog.tsx`.

## Doutes et limites
- Rien rendu dans Chrome. Le focus après fermeture d'une feuille imbriquée (`ModalShell`) est à vérifier à l'écran.
- Le Réglages ne s'ouvre que depuis `App.tsx` : la ligne « Réduction petit brasseur › » devient un pli (D3).
- Cas de la maquette non dessinés (OG notée, litres inconnus, exonéré, réduction, production annuelle inconnue) rangés dans ses états existants, sans composant neuf.
- `inventaire-ecrans.mjs` (hors Possède) devra recevoir une ligne pour la feuille neuve.
- Test hors Possède non chargé ici : `financeAssistantContext.test.ts` (firebase-admin), déjà rouge sur HEAD, hors de mes appelants.

DÉCISION À PRENDRE : D1 à D5 de PLAN.md § 8 (Clients sans lien tant que B3 ouvert ; Copier en lien texte ; Réduction en pli ; départ du curseur sur l'OG visée de la recette ; « Noter la densité » par le champ de la fiche). Défauts prudents appliqués sans mot ; recommandation : D1, D2, D3, D5 oui ; D4 oui si tu le valides (sinon 12 °P exemple).

CONNAISSANCE : aucune

LEÇON PROPOSÉE : aucune
