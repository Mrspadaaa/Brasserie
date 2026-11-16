OK — 3 problèmes, 0 bloquants

- Version : b36f66ef. Verdict : `work/missions/2026-10-31-ecran-depense/avant-deploiement/b36f66ef/VERDICT.md`
  (74 captures, 12 ouvertes en plein format, quatre configurations, journaux `voies/x3/log-*.txt` et `log30-*.txt`).
- Gates : G1 VERDICT OK ; G2 BANC OK.
- Tests : `node scripts/agents/controle-avant-deploiement.mjs b36f66ef --reporter=dot > work/missions/2026-11-14-finances/voies/x3/tests.txt` :
  seul échec « Pilote : vu » absent (permis).
- Levés : FN-30 (vrai toucher, 8,00 remplace 10,00 : payé 304,80, reste 2,00), FN-31, FN-32 à plusieurs pièces, FN-36, FN-38, FN-39,
  FN-40 (effacé à 8 s), FN-41, FN-42 (ligne) ; FN-33, FN-35, FN-37 tiennent. Toutes les bandes justes à la main.
- Problèmes (non bloquants) : « Autres frais 20,00 » sur 2 + 10 + 10 (n° 1 de 18abc69f, non traité) ; « Nettoya… » à 390 (n° 5, non
  traité) ; la créance porte deux noms (ligne « pièce B · trop payé », fiche « À récupérer : trop payé sur « … » »).
- Doutes : « zz » sur la feuille à une seule pièce (règle de m5pa-d sur le préfixe ZZ TEST) ; « Autre montant » ne dit pas qu'il remplace ;
  garde de 0,8 s muette ; 12,00 barré « corrigé » sur la fiche de B après « J'ai bien payé ».
- Fichiers : `voies/x3/jeu.mjs` (copie adaptée de x1 : vrais touchers, fournisseur saisi par sa section, B2 et C), `sonde30.mjs`,
  `sonde-four.mjs`, `log-*.txt`, `log30-*.txt`, `tests.txt`. Rien commité, aucune donnée réelle, aucun sous-agent.

LEÇON PROPOSÉE : un jeu de banc qui tape dans un champ d'une section repliée (`<details>` fermé) le croit visible (`getClientRects` non vide)
et perd la frappe sans erreur ; lire la valeur du champ après la frappe, et ouvrir la section par son résumé. (x1 et x3 première passe :
pièces sans fournisseur, donc FIFO et étiquettes à plusieurs pièces jamais vues.)
