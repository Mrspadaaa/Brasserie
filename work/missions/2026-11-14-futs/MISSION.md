# Stocks › Fûts — mini maquettes (14-15.11)

Demande (brasseur, 14.11) : « Lance des autres sous session pour les autres écrans important(sauf clients) pour des mini maquettes. » Puis, ici (15.11) : « Fait moi des mini maquettes ».

## Portée
Écran Stocks › Fûts (`src/ui/KegBoard.tsx`, `src/ui/KegSheet.tsx`, `src/domain/stock/futs.ts`, branché par `src/components/tabs/StocksTab.tsx`). Banc local non joué (le brasseur a interrompu le lancement du serveur) : analyse sur le code et sa capture du 14.11.

## État de l'art
Pas d'algorithme non trivial : interface et cycle d'états (machine à états finis : lavage → propre → plein → livré → lavage). Historique : `StorageService.updateKeg` journalise déjà chaque changement (journal d'audit, catégorie « Fûts ») ; décision : lire ce journal plutôt qu'un nouveau champ.

## Analyse (trous, défauts, parcours manquants)
1. Ligne = état seul ; ni âge de la bière ni durée chez le client.
2. Avec 4 fûts, 2/3 de l'écran vide ; aucun résumé du parc.
3. Aucune alerte de fût resté trop longtemps chez un client.
4. Client en texte libre, sans lien avec Clients (`Client.id`).
5. Remplissage un fût à la fois ; `Batch.kegIds` déclaré mais jamais nourri.
6. Retour = bière et client effacés ; pas d'historique visible.
7. Cycle à sens unique : ni « revenu plein » ni « vidé sur place ».
8. Deux fiches : toucher → geste suivant (KegBoard), « + » → formulaire (KegSheet) ; capacité et note non corrigibles après création.
9. Deux « + » (barre et bouton rond `newKeg`).
10. Filtres « · 0 » visibles.

## Livrable
- Planche : `maquettes/futs-mini-maquettes.html`, artefact privé neuf (lien dans le récapitulatif).
- Séries : L (liste) L1-L4, F (fiche) F1-F4, R (remplir, ajouter) R1-R4 ; communs C1-C5 ; tableau de couverture dans la planche.
- Critique Opus : 7 bloquants, 9 mineurs, tous corrigés (parc cohérent 220 L, dates, repère NEIPA 30 j réglable, R3 fûts propres seuls, 1280 entier, un seul « + », R4 actions selon l'état, vidé sur place, seuil réglable, « Choisir » visible, captures 390 par série).
- Captures : `maquettes/captures/` (1280 et 390, clair et cave).

## Prochaine action
Attendre son choix (une lettre par série), puis port 1:1 dans un worktree neuf depuis le dernier tag `en-ligne/*`, tests, build, contrôles, déploiement, jeu en ligne sur « ZZ TEST » retirées.
