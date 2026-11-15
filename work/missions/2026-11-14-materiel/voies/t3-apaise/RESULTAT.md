OK — accepté : za2 et za3 montrables ; za4 (meilleure, cibles 42 px) et za1 (trop proche de zq1) à reprendre
- **za4** (une chose à la fois) — REJET : gestes de ligne Réparée, Fait et Étalonner à 42 px, sous les 44 px exigés par BRIEF-APAISE (gestes à droite de chaque ligne). Phrase prédite : « Ça c'est bien : une chose à faire, le reste attend. » Relance : min-height 44 px, gestes en encre avec icône, nœud de la carte sur le rail.
- **za2** (l'ordre) — ACCEPTÉ. Phrase prédite : « Là je respire, mais mes gestes sont cachés. » Correction attendue : tiroir ouvert apaisé (mots de za3, boutons gris de za1), et « 4 gestes à faire ».
- **za3** (les mots) — ACCEPTÉ. Phrase prédite : « Plus doux à lire, mais ça crie encore. » Correction attendue : « 5 brassins sur 5 », rail gris et boutons à bord fin.
- **za1** (la couleur) — REJET : trop proche de zq1 pour qu'il voie la différence (VOIE, bloquants) ; mêmes mots, pastilles et quatre boutons. Phrase prédite : « C'est pareil que zq1, non ? » Relance : pousser la couleur au bout, avec une seule tache rouge (pompe), plus d'aplat ni de pastille colorée dans la zone due.

Verdict : work/missions/2026-11-14-materiel/critique/VERDICT-V2.md
Captures : 390 tactile, 1280, clair et cave, toutes ouvertes (planches v2, planche cave, plein format de repos pour zq1 et za1–za4, de traiter pour za2, de 1280 pour za2 et za4).
Tests : sans objet
LEÇON PROPOSÉE : aucune

GATE G1 : la commande telle qu'écrite dans GATES.md renvoie « VERDICT ECHEC za1,za2,za3,za4 ». Le défaut vient du critère, pas du verdict : dans la chaîne JS, « [\s\S] » devient « [sS] » (`node -e "console.log('[\s\S]')"` affiche [sS]). Le même test avec la regex intacte (String.raw, script dans le dossier temporaire) renvoie VERDICT OK. GATES.md n'est pas modifié (VOIE) : au pilote de corriger le critère, avec String.raw ou « \s\S » dans un fichier .cjs.
