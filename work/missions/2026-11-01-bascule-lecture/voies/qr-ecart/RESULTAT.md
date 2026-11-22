OK — l'écart du sceau QR (date, devise, créancier) ne se règle plus qu'à un choix, deux touches dans la rangée

## Ce qui change
- Avant : toucher la chip « ① Date » ouvrait la feuille, surlignait la rangée, puis réglait la chip et effaçait la marque ambre (`qrVus`) sans choix.
- Maintenant, dans la feuille « Ce que dit le QR », la rangée d'un champ en écart (Date, Devise, Créancier) porte deux touches : « 12.10.2026 · QR » et « 13.10.2026 · lu » (le duel du total, sans tuiles).
  - Ouvrir la feuille (chip ou sceau) ne règle rien : chip non barrée, marque ambre gardée, sceau « écart ».
  - « · QR » écrit la valeur du QR dans la dépense : date (la tuile Règlement « Payé le … » suit, via `patchPurchaseDraft`), fournisseur, ou `sourceCurrency`. Il garde l'ancienne valeur.
  - « · lu » laisse la valeur de la page (la remet si le QR avait été pris et que le champ n'a pas été retapé depuis).
  - Choix fait : chip réglée, marque effacée, rangée « pris » ou « lu gardé », sceau « QR ✓ » (tout pris) ou « lu gardé » (au moins un gardé). Le sceau reste « écart » tant qu'un écart n'est pas tranché.
- « Facture » : se règle à l'ouverture de sa rangée, comme avant (aucun champ au bandeau). Une Facture en écart non ouverte empêche de dire « tranché ».
- Chip « Total » sans duel (devise contredite) : se règle avec le choix de la devise.
- Jamais bloqué : « Confirmer » reste actif ; rien dans Firestore ; aucun champ ne bouge sans geste.

## Fichiers changés
- `src/ui/depense/qrVue.ts` : `VueQr.champs`, types `ChampTranchable`/`ChoixChamps`/`DecisionsQr`, 5e paramètre de `vueQr` (décisions), verdict composé sur tous les écarts.
- `src/ui/depense/Qr.tsx` : `DuelChampTouches`, `FicheQr` reçoit `choixChamps` et `onChoixChamp` ; note de rangée « écart » / « pris » / « lu gardé ».
- `src/ui/finance/ExpenseSheet.tsx` : état `qrChoixChamps` + ref `qrAvantChamps`, `choisirChamp`, `estRegle` et `doutes` lus sur le choix, `aller` ne règle plus que « Facture », remise à zéro au nouveau fichier.
- `tests/unit/depense/qr/ecran-qr.test.tsx` (suite 3 réécrite : date ×5, créancier ×2, devise ×1) et `vue.test.ts` (4 cas purs).
- `work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/parcours.mjs` : gestes de l'écart seulement (chip, prendre le QR, reprendre la page, garder sur page neuve).
- `InvoiceScanReview.tsx`, `Verdict.tsx`, `etat.ts` : non modifiés (rien à y changer).

## Tests : échouaient avant
Avant le code, `ecran-qr.test.tsx` : 7 échecs sur 33 (chip qui règle seule, touches absentes, prendre/garder, aller-retour). Le test « ouvrir par le sceau ne règle rien » passait déjà (garde-fou).

## Contrôles (dans `%TEMP%/qr-app-copie`, resynchronisée)
- `npx vitest run --maxWorkers=2 tests/unit/depense tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx` : 74 fichiers, 1 237 tests, 0 rouge.
- `npx tsc --noEmit` : aucune sortie. `npm run build` : code 0. `node scripts/check-no-dev-auth.mjs` : « Bundle de production propre ».
- Chrome (390 px, vrai décodeur, Gemini simulé), `parcours.mjs --etats=ecart`, sortie `voies/qr-ecart/captures`, 0 erreur de page, aucun débordement horizontal :
  - repos : date 13.10.2026 marquée, chip « 1 Date », sceau « écart », pas de feuille ;
  - chip touchée : feuille ouverte, deux touches non pressées (28 px de haut), chip non barrée, date toujours marquée, sceau « écart » ;
  - « 12.10.2026 · QR » : date 12.10.2026 non marquée, « 1 Date réglé » barrée, « Payé le 12.10.2026 », sceau « QR ✓ » ;
  - « 13.10.2026 · lu » après le QR : date remise à 13.10.2026, sceau « lu gardé » ; garder sur page neuve : 13.10.2026, « 1 Date réglé », « lu gardé ».
- Captures ouvertes en image : `z2-ecart-390.png` (fermé), `z2-ecart-chip-390.png` (rangée Date avec ses deux touches, chip encore ouverte), `z2-ecart-prendre-qr-390.png`, `z2-ecart-garder-390.png` ; `z2-ecart-ouvert-390.png` (feuille par le sceau) non rouverte en image. Le seul hôte externe tenté est `fonts.googleapis.com` (bloqué par le parcours, comme au parcours qr-app).
- Essais utilisés : un seul passage par critère. Le port 3457 était déjà tenu par un serveur Vite de la même copie (pid 16868) ; je m'en suis servi (il sert les fichiers synchronisés), puis je l'ai arrêté.

## Doutes et limites
- Devise : « prendre le QR » écrit `sourceCurrency`. Si la page lit EUR et le QR CHF, le message « Original : … EUR. Montants à renseigner en CHF » disparaît mais les montants de lignes restent vides (la lecture ne les avait pas posés hors CHF) : l'inconnu n'est pas inventé, le contrôle de la base garde « Confirmer » sur « À corriger ». Joué en test jsdom seulement, pas dans Chrome (pas d'état « devise » dans l'aperçu `apercuDev.ts`).
- Créancier et devise testés en jsdom, pas en capture Chrome. Même composant que la date.
- Les touches ont 28 px de haut (échelle compacte de l'app, comme les chips) ; à juger par le critique au doigt.
- Le sceau « lu gardé » garde les couleurs de l'état « diff » (ambre) : voulu, comme pour le total.
- `statutFinal` reste « à confirmer » tant que le QR contredit, choix fait ou non (comportement d'avant, inchangé).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
