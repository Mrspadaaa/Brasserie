# Voie t2 — les 6 problèmes du test d'écran 762f37df

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 762f37df (commité)
- Décideur en cas de doute : pilote

## Objectif
Corriger les problèmes 1 à 6 de `work/missions/2026-10-31-ecran-depense/avant-deploiement/762f37df/VERDICT.md` (captures dans ce dossier), sans rien changer d'autre.

## Entrées
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/762f37df/VERDICT.md` et ses captures (ouvrir celles citées) ; maquettes choisies : work/missions/2026-11-14-finances/voies/<m1|m3|m4>/<id>/.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/BrewerChat.tsx` (prop optionnelle seulement, point 4)
- `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs`
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/components/EditTransactionModal.tsx`
- `tests` (seulement les tests rouges à cause de ces ports, nommés dans RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/t2`

## Consignes (décisions du pilote)
1. **FN-10, « J'ai bien payé 10,00 »** : invariant à tester d'abord (rouge sur 762f37df) : après la correction, la somme des sorties d'argent du virement reste 12,00 à sa date et à son moyen, la dépense de la pièce vaut son nouveau montant (9,00) et le trop-payé 1,00 est une créance « à récupérer » portée par une vraie sortie de 1,00 (pas une recette sans sortie, pas retiré une seconde fois de la dépense). Construire le plan avec les services existants (avoir / remboursement, paiement), un lot par étape ; rejouer `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` avec ce cas (EMULATEUR OK) et Opérations : payé = 308,80 sur le banc du verdict.
2. **Prix du litre du profil** = le calcul du budget du même brassin (`brewBudget.ts`, la même fonction que m4bb-a), test : profil et budget disent le même nombre.
3. Tuile du prochain brassin : nom court sans coupure, « ≥ » comme m4pf-c.
4. Compagnon : « Envoyer » envoie la question en un toucher : si `BrewerChat` accepte un envoi automatique par une prop existante, l'utiliser ; sinon ajouter une prop `autoSend` optionnelle à `BrewerChat` (sans changer son comportement par défaut, les autres appelants intouchés), Gemini simulé dans les tests.
5. Question préparée : « novembre 2026 », jamais « 2026-11 ».
6. Archives au repos : la poignée posée sur la frise, à la limite du rangé, comme m1ar-c.
7. Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/t2/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/t2/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/t2/tests.txt`.
Réponse finale au pilote : une ligne.
