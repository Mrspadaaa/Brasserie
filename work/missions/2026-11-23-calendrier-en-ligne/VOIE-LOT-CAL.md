# Lot Calendrier — à faire maintenant (court ; historique : VOIE-LOT-CAL-historique.md, ne pas le lire)

En ligne : TOUR 22 (1b9b12529, index-DKzUIh2w.js). Copie : lot-cal (claude/lot-cal), HEAD df8387bfb (non en ligne : 65d044430, df8387bfb).
Réservé à un autre agent : `entete/BandeSemaines.tsx` (n'y pas écrire). Cette nuit : cœur reconstruit (D444) sur le test par modèle du point 0.
Cycle : test rouge → correction → test vert → commit → « PRÊT À METTRE EN LIGNE <hash> » (to: main) → « EN LIGNE » → preuve en ligne (Chrome 9222, 390, ZZ TEST, captures entières regardées). Jamais fermer Chrome.

0. CAL-ETAT-COHERENT (1204-incoherent.jpg) : `e2e/calendrier/etat-coherent.spec.ts` (fc.commands ; ETAT_RUNS, ETAT_SEED, ETAT_SHRINK=1).
   Trouvé et corrigé : « 1 ans » (poignée début tenue au bord → recharger). 40 suites vertes. Sa capture (« Tout », 24 sem. pour 4 ans, axe
   2029–2030) n'est PAS reproduite : ajouter des gestes (plage de l'app sur plusieurs années, poignées tenues longtemps) et l'invariant
   « axe ⊇ cadre ». L'état à unifier : `fenetre`, `periodeLocale`, `vue`, `echelleVoulue`, `fenetreAvant` (CalendrierTab) et le cadre de l'en-tête.
0b. CAL-TOUCHER-GRADUATION, CAL-ETIQUETTE-GRAIN-AU-DESSUS (« S52 2026 – S1 2027 »), CAL-GRADUATION-ROGNEE (1205, 1207) : pas commencés.
1. Preuve en ligne tour 22, faite en partie : paquet DKzUIh2w servi ; noms entre les traits vus (6 sem.) ; aucune vente ZZ dans aucune vue.
   Non prouvé : Ventes +5 695 et vente → fiche (aucune vente visible d'oct. à janv.) ; jour exact à 3 sem. (sonde non suivie
   `e2e/en-ligne/zz-tour22c.spec.ts` : délai dépassé dans ramenerAujourdhui/fenetreDe avant de créer la fête ZZ ; rien n'a été écrit).
2. Bandeau « Enregistrement… » : absent pendant 40 s en ligne (data-attente vide). À lire quand il apparaît.
3. Sections vides : fait (65d044430 ; sections-vides.spec vert ; capture regardée). Les ≈ 110 px sous Papiers (FAB) ne sont pas traités.
4. « CHF à dépenser » touche ± à 390 (vu en ligne) ; bouton de durée en retard. 5. Lenteur (CPU ×4). 6. Barre vidée (10 sem.) : non reproduite sur fixture.
L-1 barre-bord : préexistant, course du test (la fenêtre défile entre la lecture de la bulle et le lever), pas un défaut de l'app.
