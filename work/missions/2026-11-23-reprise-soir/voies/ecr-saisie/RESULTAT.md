OK — saisie des écritures : borne dite, toucher pose le jour, « + autre » choisit le client, Modifier aux blocs de la saisie

PRÊT À METTRE EN LIGNE <hash> (voir la fin du fichier)

## Plan (cause, fichier, correctif) par constat

- E35-4 (B, date lâchée ≠ date montrée) : non reproduit en logique. Test de geste en jsdom (mesures simulées) : au lâcher, `ChoixDate.ecrire` écrit exactement la dernière valeur envoyée à `onBrouillon` (pas à pas, et doigt tenu au bord gauche pendant 400 ms de défilement automatique). Cause la plus probable : à moins de 40 px du bord, la frise défile seule (`DureeFenetre.bord`, R7) tant que le doigt reste ; la capture est prise avant le lâcher, la date continue de reculer de 2 à 3 jours. Garde posée : test ci-dessous ; aucune correction de la frise (`src/ui/calendrier/frise/`, hors Possède). À rejouer en ligne par le pilote : lâcher aussitôt après le dernier pas, hors zone de bord.
- E35-5 (B, « + autre » n'ouvre pas le client) : `SaisieMain.tsx` (rangée `sai-qui`) : « + autre » appelait `setNomEdit(true)` (le titre). Correctif : « + autre » ouvre un champ « Client / Chez / Bailleur / Service / Employé » avec les noms connus en puces et « Créer « … » » ; le modèle `propositionsTiers` (modele.ts) : clients de l'onglet Clients (épinglés d'abord, archivés exclus) + contreparties déjà écrites sur le même genre, sans doublon (casse et accents ignorés). Le titre n'est plus touché.
- E35-7 (m, bouton « À payer » sur une vente) : `SaisieMain.tsx` `verbe` ne regardait pas le sens. Correctif : `verbeEnregistrer(apayer, sens, genre)` : « À recevoir » pour une entrée.
- E35-8 (m, retour silencieux au lâcher vers l'avenir) : `ChoixDate.ecrire` ramenait à `max` seulement au lâcher alors que la pastille avait montré le jour tiré. Correctif : prop `saisie` : la borne se tient au doigt (pastille, titre et curseur s'arrêtent sur aujourd'hui) et un mot le dit sous la frise (« Pas de date après le … : le jour d'aujourd'hui est le dernier. »). Choix : aller vers l'avenir est refusé avec un mot (une sortie ou une entrée « payée / reçue » n'a pas de date future).
- E35-11 (m, Modifier ≠ saisie) : `src/components/EditTransactionModal.tsx`. Correctif : pour une pièce avec `finance`, les blocs de la saisie : contrepartie (libellé du genre : Chez / Client…), Référence et Note séparées (le champ « Fournisseur, n° de pièce » ne subsiste que pour les pièces sans `finance`, ou pour l'ancien texte de pièce, jamais plus à la place de la référence), Règlement (Payé / À payer, date et moyen du dernier paiement vivant, échéance éditable à la frise), « Revient … » en lecture si une prévision est liée, coche « Sans justificatif, c'est normal ». Modèle `resumeReglement` testé.
- E35-12 (m, recherche = identifiant) : `FinancesTab.tsx` posait `query: transaction.id`. Correctif : `nomDeLaChose` (nom de la pièce, sinon tiers, sinon vide) ; la recherche posée par l'ouverture se lève quand on quitte la fiche (croix, Modifier, Payer, Avoir), si le brasseur ne l'a pas changée. La période n'est pas touchée.
- E35-14 (D, toucher la piste) : prop `saisie` de `ChoixDate` : un toucher sur la case d'un jour pose ce jour (`jourTouche`, depuis `data-x-debut` et `data-px-jour` de la piste) et l'écrit aussitôt ; après un glisser, le clic reste avalé comme avant. Hors `saisie`, R1 inchangée (un toucher ne pose rien) : aucun autre écran ne change.

## Fichiers écrits

- src/ui/ChoixDate.tsx (prop `saisie` : borne vive et dite, toucher pose ; absent = comportement d'avant)
- src/ui/toucherDate.ts (neuf), src/ui/finance/nomDeLaChose.ts (neuf)
- src/ui/saisie/SaisieMain.tsx, modele.ts, saisie.css
- src/components/EditTransactionModal.tsx, src/ui/finance/modifier/modifier.css
- src/components/tabs/FinancesTab.tsx (recherche des Opérations, E35-12 seul)
- tests/unit/saisieEcritures.test.ts (6, jsdom : gestes de ChoixDate), tests/unit/saisieEcrituresModele.test.ts (14 : bouton, tiers, règlement, nom, jour touché)
- Un mot sur modele.ts : il portait déjà une ligne de la voie ecr-donnees (`nomDefaut` de « Autre » entrée : « Autre entrée du … ») ; elle part avec mon commit par chemins.

## Critères

- Rouge avant : 3 des 5 premiers tests de geste échouaient (E35-8 : jour futur montré ; E35-14 : aucun jour posé) ; les tests de modèle importent des fonctions neuves (rouges par construction).
- `npx tsc --noEmit -p .` : seulement les 2 erreurs connues (seedData GanttTask, virtual:pwa-register).
- `npx vitest run tests/unit/saisieEcritures.test.ts tests/unit/saisieEcrituresModele.test.ts` : 20 verts (tests.log).
- 15 fichiers touchant ChoixDate, saisie, FinancesTab, Modifier, TransactionJournal + `tests/unit/proprietes` : 150 verts (tests-large.log).

## Doutes et limites (preuve en ligne par le pilote, aucune capture locale)

- Aucun rendu regardé : la feuille Saisir (rangée « + autre », mot de borne sous la frise), la fiche Modifier (règlement, échéance, note) et le filtre des Opérations sont à voir sur téléphone (390 px) avec ZZ TEST.
- « Créer » un client : le nom tapé est écrit sur la pièce (contrepartie) ; il ne crée pas de fiche dans l'onglet Clients (écrire un client est un autre geste, non demandé). À dire si le brasseur le veut.
- Modifier : le règlement se lit mais ne se change pas ici (changer Payé / À payer passe par les paiements : Payer, Noter un encaissement) ; la date reste le champ texte (JJ.MM.AAAA), non la frise ; « Revient » en lecture seule. Ce sont des écarts à la saisie, dits.
- Quitter la fiche rend la recherche vide mais garde « toutes les dates » posé par l'ouverture.

DÉCISION À PRENDRE : la date future d'une écriture (E35-8) : refusée avec un mot (ce que j'ai fait) ; l'autre voie serait de la permettre pour « À payer / À recevoir ». Recommandation : garder refusé (l'échéance, elle, est future et libre).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
