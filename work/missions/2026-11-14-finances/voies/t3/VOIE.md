# Voie t3 — les 12 problèmes du test d'écran efff31bd (A et B)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : efff31bd (commité)
- Décideur en cas de doute : pilote

## Objectif
Corriger les problèmes 1 à 4 de VERDICT.md et 1 à 8 de VERDICT-B.md de `work/missions/2026-10-31-ecran-depense/avant-deploiement/efff31bd/VERDICT.md et VERDICT-B.md` (captures dans ce dossier), sans rien changer d'autre.

## Entrées
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/efff31bd/VERDICT.md et VERDICT-B.md` et ses captures (ouvrir celles citées) ; maquettes choisies : work/missions/2026-11-14-finances/voies/<m1|m3|m4>/<id>/.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/previsions` (point 1 seulement)
- `src/ui/BrewerChat.tsx` (prop optionnelle seulement, point 4)
- `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs`
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/components/EditTransactionModal.tsx`
- `tests` (seulement les tests rouges à cause de ces ports, nommés dans RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/t3`

## Consignes (décisions du pilote)
1. Bloquants de B d'abord : « Prévoir 64,26 » entier à 390 (budget) ; tuile « Sans fermenteur supplémentaire » de Prévisions entière à 390 avec son montant (fichier hors Possède ? alors `src/ui/finance/previsions` y entre pour ce seul point).
2. B 3 à 8 : étape du projet suit le toucher ; Doublons : après « Annuler celle-ci », bandeau et puce recomptés ; Archives consultées à 1280 : champs de période remplis à l'année consultée ; Profil à 1280 : pleine largeur de la feuille ; croix × des feuilles sans gros cadre (focus visible seulement au clavier, `:focus-visible`) ; compagnon : retirer la phrase hors maquette, garder l'honnêteté par un mot court déjà dans m4ia-c ou rien.
3. A 1 à 4 : le trop-payé se lit « à récupérer 1,00 » (pas « payé ») ; la fiche A dit où est le 1,00 (lien vers la créance) ; question « en novembre 2026 » ; contrastes du compagnon en clair ≥ 4,5:1.
4. Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/t3/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/t3/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/t3/tests.txt`.
Réponse finale au pilote : une ligne.
