# Voie x1 — Test d'écran avant déploiement : FN-33, FN-35, FN-37 (argent)

- Mission : 2026-11-14-finances
- Agent : critique
- Modèle : opus
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : commit du pilote (FN-33, FN-35, FN-37), donné dans le prompt
- Décideur en cas de doute : pilote

## Objectif
Test d'écran (mode « Test d'écran » de `.claude/agents/critique.md`) de la version donnée, sur le banc local, avant sa mise en ligne :
« combien et quels problèmes ? », liste numérotée, bloquants comptés.

## Ce qui a changé (les trois constats graves du jeu ZZ TEST du 16.11, `work/missions/2026-11-14-finances/voies/z3/JEU-EN-LIGNE.md`)
- **FN-33** : « ✓ Payé » puis l'avis « Payé 10,00 · Annuler · Autre montant » : un double toucher payait puis annulait. Désormais l'avis ignore tout toucher pendant 0,8 s après le paiement (`src/ui/finance/TransactionRow.tsx`, `GARDE_AVIS_MS`). À voir : double clic rapide sur « ✓ Payé » = payé, avis visible, pas d'annulation ; « Annuler » après 1 s = annulé.
- **FN-35** : Modifier une pièce payée EN PARTIE (15,00, payée 12,00) à 10,00 : la question « Le paiement déjà noté » (« Erreur de saisie : j'ai payé 10,00 » / « J'ai bien payé 12,00 : 2,00 trop payé ») doit apparaître (`src/components/EditTransactionModal.tsx`). « J'ai bien payé » : la ligne « À récupérer » de 2,00 apparaît dans Opérations.
- **FN-37** : cette créance « À récupérer » ne compte plus dans « dépensé » ni dans un poste (Autres frais) ; « payé » de la bande baisse d'autant, la caisse ne change pas (`src/domain/finance/periodeSynthese.ts`, `annual.ts`).

## Entrées
- Banc : `http://localhost:3000/?dev-local&finance-demo` (déjà lancé par le pilote, ne pas relancer). Données « ZZ TEST — pièce A/B » saisies dans le seul navigateur de test.
- Scripts de capture à adapter (copier dans ce dossier, ne pas modifier les originaux) : `work/missions/2026-11-14-finances/voies/w1/sonde.mjs`, `work/missions/2026-11-14-finances/voies/v1/capturer.mjs` (puppeteer-core, Chrome local, profil neuf par configuration).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/x1`
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/<sha>` (le sha donné dans le prompt)

## Consignes
- Jouer chaque geste par l'entrée de l'app (Opérations, ligne, ✓ Payé, fiche, Modifier), pas par un raccourci de banc.
- Quatre configurations : 390 tactile et 1280, clair et sombre (`cave`). Au moins 8 états distincts : ligne à payer ; avis juste après ✓ Payé ; après double toucher ; après Annuler ; Modifier de B partielle avec la question ; aperçu après « J'ai bien payé » ; Opérations avec la ligne « À récupérer » et la bande (payé, à payer, dépensé) ; pile ou Synthèse avec Autres frais.
- Relever les nombres de la bande avant et après chaque geste et les vérifier à la main (dépensé sans la créance ; payé = dépensé − à payer).
- Ouvrir chaque capture du tableau en plein format avant de juger (L12).
- `VERDICT.md` au format de `work/missions/2026-10-31-ecran-depense/avant-deploiement/989237c6/VERDICT.md` : première ligne « OK — N problèmes, M bloquants » ; « Version : <sha> » ; un tableau « | capture | thème | largeur | état | problèmes | bloquants | » avec une ligne par capture citée ; « Bloquants : M » ; problèmes numérotés ; doutes à part. Ne pas écrire « Pilote : vu » (le pilote l'ajoute).
- Aucun Fable, aucun sous-agent, aucune donnée réelle, ne commite pas.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : maquettes choisies telles quelles (m5pa-d Payer, m5mo-c Modifier, v6a Opérations) ; un constat qui contredit une maquette choisie est écrit en doute, pas en problème.
- Inconnu ≠ 0 ; hachure = à payer ; rouge = en retard ; le payé ne disparaît jamais ; jamais `type="number"` ; cibles 44 px.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- Tests : aucun Vitest ; la ligne « Tests » est `node scripts/agents/controle-avant-deploiement.mjs <sha> --reporter=dot > work/missions/2026-11-14-finances/voies/x1/tests.txt` (le contrôle attend encore « Pilote : vu » : son seul échec permis est celui-là).
Réponse finale au pilote : une ligne (« OK — N problèmes, M bloquants »).
