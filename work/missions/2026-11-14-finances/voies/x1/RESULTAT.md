OK — 7 problèmes, 0 bloquants

- Version : 18abc69f (second passage ; dfe9189e : 8 problèmes, 1 bloquant). Verdict : `work/missions/2026-10-31-ecran-depense/avant-deploiement/18abc69f/VERDICT.md`
  (40 captures, 9 ouvertes en plein format, quatre configurations, mêmes gestes, journaux `voies/x1/log18-*.txt`).
- Gates : G1 VERDICT OK ; G2 BANC OK.
- Tests : `node scripts/agents/controle-avant-deploiement.mjs 18abc69f --reporter=dot > work/missions/2026-11-14-finances/voies/x1/tests18.txt` :
  seul échec « Pilote : vu » absent (permis).
- Levés : le groupe « Autres frais » vaut 20,00 comme la pile ; le double toucher paie une fois, n'annule pas, n'ouvre aucune fiche.
- Non bloquants : groupe à 20,00 au-dessus de lignes qui font 22,00 (créance rangée dedans sans signe) ; fiche « Paiements 3 » avec un −10,00
  « à corriger » ; créance coupée à 390 ; « Nettoya… » ; déjà au registre : FN-32, FN-36, FN-40.
- Fichiers : `voies/x1/jeu.mjs` (argument sha), `annuel-avant.mjs`, `log-*.txt`, `log18-*.txt`, `tests.txt`, `tests18.txt`. Rien commité, aucune donnée réelle.

LEÇON PROPOSÉE : un correctif qui sort une somme d'un total (FN-37) se vérifie sur chaque total qui l'affichait au même écran (pile, bande,
en-têtes de groupe de la liste), pas seulement sur la fonction de synthèse corrigée.
