OK — 8 problèmes, 1 bloquant

- Version : dfe9189e. Verdict : `work/missions/2026-10-31-ecran-depense/avant-deploiement/dfe9189e/VERDICT.md` (40 captures, 16 ouvertes en plein format, quatre configurations).
- Gates : G1 VERDICT OK ; G2 BANC OK.
- Tests : `node scripts/agents/controle-avant-deploiement.mjs dfe9189e --reporter=dot > work/missions/2026-11-14-finances/voies/x1/tests.txt` : AVANT-DEPLOIEMENT ECHEC,
  pour « Pilote : vu » absent (permis) ET pour le bloquant n° 1 (« Bloquants : 0 » absent) : la version ne part pas en l'état.
- FN-33 tient (pas d'annulation au double toucher ; Annuler à 1 s efficace) ; FN-35 tient (question sur B payée en partie) ; FN-37 tient sur
  dépensé, payé, pile, caisse et Annuel (213,00 → 233,00).
- Bloquant : le groupe « Autres frais » de la liste d'Opérations compte encore la créance (22,00) quand la pile dit « Autres 20,00 ».
  Correction attendue : la ligne « À récupérer » hors du groupe Autres frais, ou hors de son total.
- Non bloquants nouveaux : le double toucher ouvre la fiche de A ; la fiche montre « Paiements 3 » avec un −10,00 « à corriger » ; ligne de la
  créance coupée à 390 avant le nom de la pièce ; « Nettoya… » dans la pile à 390. Déjà au registre : FN-32, FN-36, FN-40.
- Fichiers : `voies/x1/jeu.mjs`, `voies/x1/annuel-avant.mjs`, `voies/x1/log-*.txt`, `voies/x1/tests.txt`. Rien commité, aucune donnée réelle, `src` intact.

LEÇON PROPOSÉE : un correctif qui sort une somme d'un total (FN-37) se vérifie sur chaque total qui l'affichait au même écran (pile, bande,
en-têtes de groupe de la liste), pas seulement sur la fonction de synthèse corrigée.
