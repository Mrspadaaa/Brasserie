# Lot Calendrier — à faire maintenant (court ; historique : VOIE-LOT-CAL-historique.md, ne pas le lire)

Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal (claude/lot-cal), HEAD 8a9f76f16 (non en ligne : ventes
annulées, jour exact, noms entre les traits). En ligne : tour 21 (ddb5f2d6e). Base de comparaison : d7a2b40eb.
Cycle : test rouge → correction → ton test vert → commit → « PRÊT À METTRE EN LIGNE <hash> » (SendMessage to: main) →
« EN LIGNE » → preuve en ligne (Chrome 9222, ta page, 390, ZZ TEST, captures entières regardées). Jamais fermer Chrome.

1. barre-bord L-1, 2 cas (bord gauche, fenêtre qui défile sous le doigt) : annonce 17 oct., écrit 9 oct. Rejoue le spec sur
   d7a2b40eb puis sur HEAD : si HEAD l'a causé, corrige (annonce = écrit, règle CAL-LACHER-OU-DESSINE) ; sinon note-le préexistant.
2. CAL-VENTE-FICHE : `components/tabs/CalendrierTab.tsx:635` : le toucher d'une vente ouvre la fiche (elle a déjà « Ouvrir la
   pièce ») ; son test est écrit, à jouer.
3. 4 captures de référence de frise.spec : regarde avant/après ; attendu = noms entre les traits ; mets à jour si c'est seulement ça.
→ PRÊT (1 à 3 ensemble). Puis :
4. Bandeau « Enregistrement sur le serveur… » qui reste. 5. CAL-SECTIONS-VIDES-COMPACTES. 6. Barre vidée pendant le tirage à
10 sem. 7. « −1 663 » sous ± ; bouton de durée en retard. 8. Lenteur mesurée en ligne avant/après.
