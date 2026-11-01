# Reprise du 01.11, nuit (pilote)

## Ordre (D260, D263)
1. **Banc de la pièce Brau- und Rauchshop, priorité 1, au-delà de 65 %** (D263). Pièce : `brasseur/01-11-brau-piece-source.jpg`
   (hors Git) ; ses captures de l'écran : `brasseur/01-11-brau-*.jpg`. Défauts D261a à D261c, D262a à D262c. Mesurer C★v8 (production)
   et « 2 × 3.8 puis 3.8 » : justesse champ par champ (noms, familles, TVA, port, arrondi 5 ct) et temps. Rien ne bascule sans son choix.
2. **Correctifs client** (non commités) : D261a `libelleDeLigne` (`src/ui/depense/etat.ts`, branché `ExpenseSheet.tsx:285`), D262b
   raccourcis « Aujourd'hui · Mois passé · Mois suivant » de la date de l'achat (`ExpenseSheet.tsx` `dayShortcuts`, `DateField.tsx`
   `offsetMonths`) ; le paiement garde Hier/Aujourd'hui/Demain (`paymentShortcuts`). Tests : `tests/unit/depense/ecran/libelle.test.ts`,
   `tests/unit/dateFieldMois.test.tsx`, `tests/integration/expenseSheet.test.tsx` (date). Témoin : 8 assertions en échec avant.
3. **p3c-port-b** : 8 GATES rejoués verts par le pilote (journal `scratchpad/p3c-port-b-gates.log`) ; RESULTAT ligne 1 périmée (agent arrêté
   à 120 tours). Reste : relire le diff, capture Chrome du port, de la date et de la lecture, commit par chemins (p3c-port + p3c-port-b +
   correctifs), puis déploiement **hébergement seul** depuis `%TEMP%/deploy-hosting-qr` (checkout --detach du commit, `npm run build`,
   `check-no-dev-auth`, `firebase deploy --only hosting`), lire « found N files » et la page servie. Accord : D260.
4. Passe 2 rénovation : agents A (z2b, z1b, m1) et B (u4b, u2b, u3b) en vol ; rendus gardés, ni tri ni page avant son choix.

## Hebdo
57 % à D260, 58 % à D262.
