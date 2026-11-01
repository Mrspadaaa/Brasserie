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

## État au 01.11, 21 h (pilote, après D273)
- En ligne : aiTask D272b (8050e494, instance 20 h 46) ; client 6bb83d4a (hébergement pas redéployé depuis).
- D273 fait : 14 pièces lues dans l'app en ligne, 0,62 CHF, rien enregistré. `H13-reels/D273/` (pièces marquées, `resultats/`, `jugement.txt`) ;
  en ligne 150/165 champs, 210/224 lignes ; banc 153/165, 217/224. Défauts D273a à D273d (DEFAUTS-RECURRENTS).
- En vol : agent p3c-bandes `a257231fe65b00eb2` : D273d (test rouge `tests/unit/depense/bandes/familles-d273.test.ts`, 2/23), deux teintes
  du critique, KO (e) de `voies/e-emulateur/final6/D`, chevauchement du récap. Non commités : k7, bandes, ce test.
- Ensuite (pilote) : rejouer ses critères dans la copie, bout en bout D (`lancer.sh`), commit par chemins (k7 + bandes + D273d), puis
  hébergement seul depuis `%TEMP%/deploy-hosting-qr` (accord D260), lire « found N files » et la page servie ; puis rejouer SA pièce
  en ligne et lire ses groupes (D273a). Manifeste md5 `21dd75b3` avant et après chaque build.
- À son choix (montré, pas bloquant) : D273c version du cache de lecture liée au moteur ; D273b captures multiples dans l'app ; D261c ;
  la famille donnée par Gemini (≈ 1 CHF au banc). TX-6770960b suspendue.
- Hebdo : 60 % ; il a dit « le quota n'est pas un problème pour ces tâches ».

## État au 01.11, 21 h 30 (pilote, D274 et D273e)
- D274 (son « yes ») : l'identifiant de lecture d'aiTask porte l'empreinte des 40 modules qu'aiTask importe (`invoiceEngineDigest`), commit
  abd80cde ; test `tests/unit/invoiceScanCache-d273c.test.ts` (rouge 4/5, puis vert) ; déploiement d'aiTask seul depuis
  `%TEMP%/deploy-63130965` (journal `scratchpad/deploy-d274.log`). Retour arrière : redéployer depuis 8050e494. Fait : révision `aitask-00047-jil`, empreinte `7909df236aecab9d` ; doc14 renvoyée, relue en direct (3 lectures, 16/16), rien enregistré, journaux sans alerte.
- D273e (« trop d'items en autre ») : en ligne, l'ancien client met 12 articles en Autres sur doc14. En local, 24 des 232 articles du banc
  tombent en Autres : 8 lignes de port (tenues à part), 10 achats privés, et 7 articles de brassage (El Dorado, Barbe Rouge, Malzextraktpulver,
  Sekt). Les 6 premiers cas sont envoyés à la voie p3c-bandes (`a257231fe65b00eb2`) ; on attend d'elle le compte « autres = N sur 232 ».
- Ensuite : sans changement (retour de p3c-bandes, ses critères rejoués, bout en bout D, commit, hébergement, sa pièce rejouée en ligne).
