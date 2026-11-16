OK — 20 annulée cachée par défaut, 21 projet supprimable depuis Prévisions, 33 Période « Tout » cohérente ; captures 1280 clair faites, 3 combinaisons à rejouer (DEMANDE EXECUTANT)

## Fichiers écrits
- 20 : `src/ui/finance/TransactionJournal.tsx` : le prédicat d'état exclut toute écriture annulée sauf la puce « Écritures annulées uniquement » (avant : « Tout » et la recherche, qui ouvre le journal en « Tout », la listaient sous « Annulées »).
- 21 : `src/ui/finance/previsions/FicheEtiquette.tsx` : la fiche d'un projet de matériel ouverte depuis Prévisions (hub ou étiquette) gagne « Supprimer ce projet » + confirmation (`Confirmation` de `prevision/base`, `supprimerPlan`, refus affiché, « Garder »).
- 33 : `src/components/periode/ChoixPlage.tsx`, `useDonneesFrise.ts`, `periode.css` (module de la période, nommé comme demandé) et `src/ui/finance/operations/Frise.tsx` (prop optionnelle `resume`, défaut inchangé : s2ap2 intacte, FRISE OK) : en « Tout », la ligne dit « Tout l’historique · 15 opérations » (toutes les opérations actives) au lieu de « 30 jours · N opérations » du mois dessiné ; « Du … au » porte en grisé l'étendue réelle (jj.mm.aaaa, première et dernière opération), champs élargis à 104 px pour que l'année ne soit pas coupée ; la saisie reste libre (le grisé n'est pas une valeur : aucun changement de période en quittant le champ). Une plage de 30 jours : le titre de la Période dit « 18 oct. → 16 nov. », la frise « 30 jours · 5 opérations ».
- Tests neufs : `tests/integration/ecritureAnnuleeCachee.test.tsx` (4), `v1FicheProjetSupprimer.test.tsx` (3), `periodeToutCoherente.test.tsx` (4).
- Tests changés parce qu'ils décrivaient ce que ce choix remplace (annulée listée dans « Tout ») : `financeJournalUx` (annulée absente, puis visible par la puce), `operationsV6bMois` (2 cas : groupe « Annulées » seulement avec le filtre), `tests/unit/depense/onglets/ta2-compteur.test.tsx` (2 cas : « Tout » ne compte plus d'annulée).
- Voie : `capturer.mjs` (points 20, 21, 21p, 33 ; args `<port> <point> [largeur] [thème]`), `cap/`, `rouge/`, `tests.txt`, `tests-liste.txt`, `build.txt`, `emulateur.txt`.

## Rouge avant correction (sur HEAD)
- 20 : `ecritureAnnuleeCachee` 2 échecs sur 4 (annulée listée par la recherche et par « Tout ») : `rouge/20-avant.txt`. Vert après.
- 21 : `v1FicheProjetSupprimer` 3 échecs sur 3 (« Supprimer » introuvable) : `rouge/21-avant.txt`. Vert après.
- 33 : `periodeToutCoherente` 2 échecs sur 4 (« Tout » : aucun titre dans la frise ; historique vide) : `rouge/33-avant.txt`. Vert après.
- Constat 21 pour la feuille « Modifier la prévision » (`PlanSheetC`) : déjà corrigé par u2 sur ce HEAD (« Supprimer cette prévision » + confirmation, tests `u2FeuillePrevision`). Je l'ai joué au banc par le chemin du testeur : Prévisions › « Voir 1 sortie de plus » (hub) › Ajouter une prévision (ZZ TEST — Prévision, 7) › Enregistrer › hub › ligne › « Modifier la prévision » › Supprimer cette prévision › « Oui, supprimer » : la ligne disparaît (`capturer.mjs 21`). Il manquait le projet de matériel (feuille de Prévisions sans « Supprimer ») : c'est le vrai trou.
- Constat 20, chemin du testeur joué au banc (apport ZZ ; Corriger ce paiement › Confirmer › Annuler cette écriture › Confirmer) : « Écriture annulée » ; l'écriture n'est plus dans la liste, ni dans la recherche d'Opérations ; la puce la montre (journal de `capturer.mjs 20` : encore dans la liste false, dans la recherche false, par la puce true). Les deux chemins (testeur et « Retirer ») finissent donc au même état (écriture annulée, hors liste).

## Critères
- G1 : `VITEST OK` (35 fichiers, 372 tests, ceux qui importent Journal, Frise, ChoixPlage, FicheEtiquette, Previsions, PagePlus, FinancesTab, périodes, + les 3 neufs).
- G2 : `BUILD OK` (`npx vite build --outDir <tmp>` ; `npm run build` entier échoue sur `functions/` faute de `firebase-admin`, comme chez u1 et u2).
- G3 : `TSC OK`.
- G4 : `V6A OK` (sur banc : il sert bien ce code, vérifié par `curl` des sources). `FRISE OK` aussi (rejoué après le dernier changement).
- G5 : `EMULATEUR OK` (`emulateur.txt`, 12 contrôles ; règles Firestore inchangées, aucune écriture neuve : `supprimerPlan` et `retirerEcriture` existaient).
- Essais : 1 par critère ; 2 passes sur les tests (puces dans le panneau « Filtres », état contrôlé d'`operationsV6bMois`).

## Captures ouvertes (1280 clair, faites et regardées)
- `33-1280-clair-tout` : « Tout l’historique · 15 opérations », Du/Au grisés d'après l'étendue ; `33-1280-clair-plage` : titre « 18 oct. → 16 nov. », « 30 jours · 5 opérations », pastille d'en-tête identique.
- `20-1280-clair-recherche` : « ZZ » sans l'apport annulé ; `20-1280-clair-annulees`, `-liste` faites.
- `21-1280-clair-confirmation` (feuille « Modifier la prévision » : « Supprimer « ZZ TEST — Prévision » ? », Garder / Oui, supprimer) ; `21p-1280-clair-fiche` (pied : Retirer, Déplacer, Supprimer, Ouvrir le projet sur une ligne) et `21p-…-confirmation`.

## DEMANDE EXECUTANT (3 combinaisons x 4 points, mécanique)
Banc : `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer ; sert ce code). Depuis la racine du worktree, dans l'ordre :
1. `node work/missions/2026-11-14-finances/voies/v1/capturer.mjs 3000 33 390 clair`, puis `… 33 1280 cave`, `… 33 390 cave`
2. idem pour le point `20`, puis `21`, puis `21p` (12 appels ; chacun doit finir sans erreur et ses lignes de journal doivent dire : 33 « durée en jours affichée false » et « 30 jours true » ; 20 « encore dans la liste false », « encore dans la recherche false », « visible par « annulées uniquement » true » ; 21 « confirmation true », « ZZ encore là false » ; 21p « fiche true », « confirmation true », « Garder : fiche encore là true »).
3. Captures à ouvrir une à une dans `work/missions/2026-11-14-finances/voies/v1/cap/` : `33-<l>-<t>-tout|plage`, `20-<l>-<t>-liste|recherche|annulees`, `21-<l>-<t>-hub|feuille|confirmation|apres`, `21p-<l>-<t>-fiche|confirmation` (l = 390|1280, t = clair|cave). Rendre ce qui déborde, est coupé ou chevauche, surtout à 390 : le pied de `21p` (quatre boutons, doit passer à la ligne sans chevaucher), les champs Du/Au de `33-tout` (dates grisées jj.mm.aaaa, année coupée ?), la ligne « Tout l’historique · N opérations ».
4. Rejouer `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) et `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK).
Les données ZZ sont locales au banc (`?dev-local`), rien à retirer ailleurs.

## Doutes et limites
- `controle-frise.mjs` a dépassé 180 s (passé en tâche de fond) mais conclut FRISE OK.
- Une prévision issue d'un budget de brassin (`brewEstimate`, feuille « Budget d'un brassin ») n'a pas de « Supprimer » : cette feuille ne s'ouvre pas depuis la ligne d'une prévision mais depuis la fiche du brassin (« Ouvrir le budget »). Non fait : ce serait un geste neuf dans une maquette choisie (m4bb-a) ; à décider ci-dessous.
- 33 : le grisé des champs « Du … au » est un placeholder : il est donc invisible aux lecteurs d'écran comme valeur ; la ligne « Tout l’historique · N opérations » le dit en texte.
- 20 : les totaux de la Synthèse et les piles filtraient déjà les annulées (`isActiveTransaction`) ; rien changé. Les contre-paiements d'une écriture annulée restent dans le journal de paiements (les règles interdisent de les supprimer).

DÉCISION À PRENDRE : une prévision de budget de brassin (feuille m4bb-a, plan avec `brewEstimate`) doit-elle aussi se supprimer ? Options : (a) non, elle se refait en rouvrant le budget ; (b) un « Retirer des prévisions » dans cette feuille. Recommandation : (b), à montrer en mini maquette avant de coder (choix du brasseur sur m4bb-a, D123).
CONNAISSANCE : en portée « Tout », la recherche globale ouvre le journal avec `scope: 'all'` ; l'ancien prédicat y listait les annulées. Les écritures annulées ne sont listées que par la puce `filter = 'void'`.
LEÇON PROPOSÉE : un test sur un composant à état contrôlé (`state` + `onStateChange={() => {}}`) ne bouge pas au clic : poser l'état voulu par `rerender`.
