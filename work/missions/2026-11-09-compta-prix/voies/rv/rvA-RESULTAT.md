OK — contrôle commun des renvois écrit (rouge sur HEAD) ; Annuel et Clôture 1 à 9 verts, manques devenus renvois

## Fichiers écrits
- `tests/integration/renvoisPartout.test.tsx` : 11 tests (Synthèse, Opérations, Prévisions + Limites, Annuel, Clôture étapes 1 à 9 en solde absent et non confirmé, Prix, Impôt bière de l'année, feuille Impôt bière, coût du brassin, fiche › Argent). Un nœud texte qui matche la regex de manque doit avoir un ancêtre `button/a/[role=button]/summary` actif ou `data-renvoi="aucun"`. Un « ? » qui ferme une question de 3 mots au moins (« Tout est noté ? ») n'est pas un manque ; « ? », « 850,00 ? », « stock ? », « = ? » le sont.
- `tests/fixtures/renvoisClairseme.ts` : base `financeDemoEntries('reel')` + brassin sans litres ni densité, stocks sans facture, projet non daté, matériel incomplet, charge sans paiement, pièce sans date ; variante `solde: 'absent' | 'nonConfirme'`.
- `src/ui/finance/annuel/` : `Tete.tsx` (puce « Stock au 31 déc. ? » = bouton vers l'inventaire de clôture, avec « sans lui, perte avant stock »), `Etapes.tsx`, `Etapes2.tsx`, `calculs.ts` (`natureDuStock`, `propositionsInventaire`), `ctx.ts` (`versInventaireCloture`), `annuel.css`.
- `rvA-capturer.mjs`, `captures-rvA/` (390, clair et cave), `rvA-rouge.txt` (HEAD), `rvA-tests.txt`, `rvA-build.txt`.

## Rouge sur HEAD (rvA-rouge.txt)
Synthèse 3, Annuel 1, Clôture 12 (solde absent) / 13 (non confirmé), Prix 6, feuille Impôt bière 2, coût du brassin 4, fiche › Argent 3. Opérations, Prévisions + Limites et Impôt bière de l'année : 0 faute sur ce jeu (déjà des renvois, ou la donnée clairsemée ne les montre pas : à rejouer avec le jeu de la voie rvB).

## Ce qui est devenu un renvoi (Annuel + Clôture)
- Tête : « Stock au 31 déc. ? » → inventaire de clôture (proposé depuis le stock pour l'année courante).
- 1 : chaque mois « ? » → journal de ce mois. 2 : « ? » du solde et « à confirmer » → feuille du solde. 3 : « à compter » → inventaire de clôture (`nature` transmise ; `proposer` seulement pour l'exercice en cours, jamais la cave).
- 5 : « On te doit ? » → journal filtré « paiements inconnus ». Les « ? » des charges prévues et sa légende : `data-renvoi="aucun"` (« ? » = « prévu », pas une donnée absente).
- 6 : « à confirmer » → met le curseur au focus. 8 : codes à confirmer → instructions officielles (lien) ; « ± stock ? » et « = ? (stock à compter) » → inventaire ; « caisse ? » → solde ; « À confirmer » (fortune) → feuille fortune ; chaque ligne « manque » (revues, justificatifs, activité, trésorerie, adresses, pièces, fortune) → son endroit (`versManque`). Phrase « reste à compléter » réécrite (« se remplit dans FriTax, hors de l'app »).

## Critères
- `npx vitest run` des 6 fichiers Annuel + contrôle : 74 passés, 2 échecs attendus (Prix, feuille Impôt bière : hors Possède). Les 6 tests Annuel/Clôture du contrôle passent ; les 83 tests existants de l'Annuel passent.
- `tsc --noEmit` (hors paquets listés) : aucune erreur. `vite build` : réussi.
- Captures ouvertes : tête (clair, cave), étapes 1, 3, 8. Défauts vus et corrigés : puce du stock sans fond (`.ann button` remet tout à zéro : sélecteurs relevés).
- Essais : 2 sur le CSS ; aucun critère au-delà de 3.

## Fautes restantes par écran (le pilote répartit)
- Prix (6) : « ? » de la réponse, du graphique (`prx-ech`, « coût ? »), « ? L », « ? » des lignes de la chaîne.
- Feuille Impôt bière (2) : « densité à noter » (`em` dans `ibr-q`), « seuil à… » (paragraphe du pli).
- Synthèse (3) : vues sur HEAD, plus de faute au dernier lancement (voie rvC a modifié `Lignes.tsx`) ; coût du brassin et fiche › Argent verts au dernier lancement idem.
- Annuel, Clôture 1 à 9 : 0.

## Doutes et limites
- `ClosingSheet` (FinanceForms) non modifié : `nature` déjà portée par la voie ci. Pas de bloc de test qui ouvre la feuille d'inventaire elle-même.
- Le contrôle compte un bouton `disabled` comme absence de renvoi (version figée : les boutons de l'étape 3 sont désactivés, comme avant).
- jsdom ne mesure pas : la cible ≥ 24 px est tenue par le CSS (`min-height:24px`), vue sur capture seulement.
- « Limites de cette prévision » : le bouton n'apparaît pas sur ce jeu (le test le clique s'il existe).
- Le serveur du port 3008 est arrêté.

CONNAISSANCE : `.ann button` (0,1,1) remet fond, bord, couleur à zéro : tout bouton neuf de l'Annuel se dessine en `.ann button.<classe>`.
LEÇON PROPOSÉE : aucune
