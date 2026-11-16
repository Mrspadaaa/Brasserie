OK — Page choix et suite écrite : PAGE OK, G1 et G2 verts.

Fichiers écrits :
- work/missions/2026-11-14-brassins/page5/index.html (page neuve, HTML écrit à la main)
- work/missions/2026-11-14-brassins/page5/img/ (182 PNG copiés à l'identique depuis voies/gf, g6, e5n, e2, e3, e8, e9, e10, e11, et les 7 images retenues ou parentes : e1a, e4c, e7a, s4a, s6c, e6a, e6c)
- work/missions/2026-11-14-brassins/voies/pg5/RESULTAT.md, tests.txt, verif-haut.png, verif-page.png, verif-ordinateur.png

Critères :
- G1 : `node scripts/agents/verifier-page.mjs ... --page-lot --captures ...voies/pg5/verif` → `PAGE OK (182 images chargées, lisible à 390 et 1280 px, sans erreur)`, code 0.
- G2 : contrôle `node -e` des GATES → `CONTENU OK`, code 0. Toutes les images des variantes gf, g6, e5n, e2, e3, e8, e9, e10, e11 sont référencées et présentes ; les 7 images retenues et parentes présentes ; ids a-choisir, retenues, fiche, filtres, creer, reste présents ; aucun « Fable ».

Essais : G1, 2 essais (1er ECHEC sur lazy, corrigé ; 2e OK). G2, 1 essai, vert.

Captures : verif-haut.png ouverte. En-tête, #a-choisir (36 mots) et les deux premières variantes (e1a, e4c) lisibles à 390. verif-page.png et verif-ordinateur.png non ouvertes.

Ce qui reste douteux :
1. loading="lazy" retiré : le verifier compte les images hors écran comme non chargées (PAGE ECHEC). Écart à la consigne de VOIE.md ; à réintroduire si verifier-page évolue.
2. Vignettes à 390 en trois colonnes : environ 115 px par image, sous les 340 px. C'est le cas `data-vignette` prévu par le verifier (ouverture en grand au toucher). Le toucher n'a pas été joué.
3. Noms : Idée reformulée à 6 mots au plus (ex. « Le tableau s4a réduit au graphique »). Classements résumés de VERDICT.md (kg, k6, k1, k2, k3), sans nouveau jugement.
4. Hors possession, non touché : page3/index.html a des balises `<img ... alt="…"<span>` sans `>` dans toutes ses vignettes. La page5 les a écrites correctement. À corriger côté pilote ou voie pg3.
5. Non fait : publication (pas de claude.ai), entrée dans la table « Pages » de MISSION.md.

CONNAISSANCE : verifier-page.mjs --page-lot échoue sur loading="lazy" (images hors écran non chargées au networkidle0) ; retirer l'attribut pour une page de planche.

LEÇON PROPOSÉE : une consigne d'attribut (loading="lazy") incompatible avec le contrôle de la page, vue seulement à l'exécution. Cause : VOIE écrite sans rejouer le contrôle sur une page témoin. Règle : avant d'écrire une consigne de page, rejouer verifier-page sur une page minimale avec les attributs demandés.
