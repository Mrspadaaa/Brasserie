# Voie dc1, tour 2 (dc1b) : finir DC-1

Même contrat et même « Possède » que voies/dc1/VOIE.md (lis-le, puis COMMUN.md, puis « ## État de l'art — dc1 » de MISSION.md). Lis voies/dc1/RESULTAT.md : ton prédécesseur a laissé src/services/decoupe.ts modifié (non commité, c'est le travail de cette voie) et une DEMANDE EXECUTANT.

Décision du pilote : oui, les coupes silencieuses de l'angle se corrigent dans cette mission.

1. Faire la DEMANDE EXECUTANT (lire les journaux du banc graine 2 et fixes ; relancer s'ils manquent). Conforme (graine 2 : 0 perdue, 0 rognée, rien de pire ; fixes DÉCOUPE OK) → commit par chemins du correctif des lignes perdues. Non conforme → corriger d'abord.
2. Angle : `estimerAngle` sur la carte sensible (piste de RESULTAT.md) ou méthode d'école équivalente ; réglage sur la moitié paire des pièces de la graine 1, jugé sur la moitié impaire et sur la graine 2 entière, puis les 11 fixes (L20). Objectif : coupes silencieuses vers 0, aucune ligne perdue ni rognée ajoutée ; tableau avant/après par graine dans RESULTAT.md. Test rouge d'abord (h0016, h0120, h0124 ou leur équivalent synthétique).
3. Pied de h0065 (14 lignes) : seulement si la piste se règle sans toucher aux autres pièces ; sinon le dire.
4. Une coupe qui reste douteuse est SIGNALÉE (jamais silencieuse) : si l'angle ne descend pas à 0, le signalement doit attraper le reste.
5. tests.txt, verdicts.mjs dc1 et --tests OK. DC-1 corrigé seulement si 0 perdue et 0 silencieuse sur les deux graines ; sinon ouvert avec les chiffres.

Commit « Bugs relance (dc1b) : DC-1 — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais checkout/reset/stash ; n'arrête un processus que par le PID que tu as lancé. Plafond : à 200 k, « REPRISE : voies/dc1/RESULTAT.md ». Réponse : une ligne.
