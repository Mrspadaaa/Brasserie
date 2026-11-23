# Lot Calendrier — à faire maintenant (court ; historique : VOIE-LOT-CAL-historique.md, ne pas le lire)

En ligne : TOUR 22 (1b9b12529, index-DKzUIh2w.js). Copie : lot-cal (claude/lot-cal).
Cycle : test rouge → correction → test vert → commit → « PRÊT À METTRE EN LIGNE <hash> » (to: main) → « EN LIGNE » → preuve en
ligne (Chrome 9222, ta page, 390, ZZ TEST, captures entières regardées). Jamais fermer Chrome.

0. CAL-ETAT-COHERENT (sa capture brasseur-23-11/1204-incoherent.jpg, « Toujours quelque problème avec la gestion des date, timing
   du graph.... ») : la fenêtre a des états contradictoires (bouton « 24 sem. », cadre de 4 ans, axe 2029–2030, « ‹ auj. »,
   rangées vides). Méthode standard (L29) : TEST PAR MODÈLE fast-check (`fc.commands`) sur l'état de la fenêtre (période,
   durée, cadre, vue) : suites aléatoires de gestes, invariants vérifiés après chacun (ligne DEFAUTS). Trouver les gestes qui
   cassent (reproduire aussi « Tout » en ligne), une seule source de vérité pour l'état, puis corriger.
1. Preuve en ligne du tour 22 (si pas déjà faite). 2. Bandeau « Enregistrement… » (`data-attente` en ligne).
3. Sections vides : vertical, lignes basses (≤ 32 px), pas d'espace vide (CAL-VIDES-EN-LIGNE).
4. « −1 663 » sous ± ; bouton de durée en retard. 5. Lenteur mesurée en ligne avant/après. 6. Barre vidée au tirage (10 sem.).
