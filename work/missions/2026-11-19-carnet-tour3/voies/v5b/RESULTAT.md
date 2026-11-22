# v5b — critique de la Dépense corrigée (port-carnet HEAD 0b30c6775, banc v3 `?dev-local&depense=…`)

EN COURS (2e arrêt au plafond, 19.11). Serveur arrêté, ports 5193 et 5195 libres (vérifié). Scripts : g1 (étape 1), g2, f3 (BR-27, TE-36),
g3 (rejeux au bon geste, g3.out), g4 (LR1-14, titres, g4.out). Planches ouvertes : P1 à P7. Reste : voir REPRISE.md (E1-2, TE-35).

id | verdict | observé (≤ 25 mots) | capture | taille/thème
---|---|---|---|---
LR1-5 | corrige | Sabro « 30 g × 0,070 » sans barré ; doc14 en-tête sans barré | lr15-sabro, reel-doc14 (P2, P3) | 390 clair/cave, 1280 cave
v3-3 | corrige | doc2 : fournisseur « Drs H. et I. Gauderon-Comment Sà… » sans barré | reel-doc2 (P5) | 390 clair
v3-4 | corrige | doc2 : Règlement « À payer » sans « Payé » barré | v34-reglement (P5) | 390 clair
LR3-3 | corrige | doc25 : MASQUE DE PROTECT. et BROSSE MET.GRAMGS sans barré parasite ; aucune « lignes lues puis retirées » | lr33-* (P4, P5) | 4 combos
LR2-3 | corrige | doc25 : « Lectures 3/3 · 7 valeurs en désaccord » | lr23-bloc (P4, P5) | 4 combos
v3-1 | corrige | doc14 1280 : chaque barré sur une ligne, colonne 758 px | v31-lignes (P3) | 1280 cave
LR1-6 | corrige | provisoire sans rouge (Payé –, ambre « proposés ») ; rouge au final seulement « 1 ligne retirée · 1,70 » | lr16-* (P2) | 390, 1280
v3-2 | corrige | bande Rénovation « 22 pièces 136,65 » dans le cadre, 390 et 1280 | v32-renovation (P3, P5) | 390/1280 cave
v3-5 | present (partiel) | pied « 3e lecture en cours… » (inactif) dès 0,8 s ; « Lecture en cours… » jamais vu ; à 390 texte coupé « 3e lecture en c » | v35b-0, v35b-1 (P7) | 390 clair, 1280 cave
LR1-7 | present (partiel) | prix 3,35 (13,40 ÷ 4) ambre, `data-dp-prix-deduit` ; title vide sur le champ (f6b promettait « prix déduit… ») | lr17-deduit (P2) | 390, 1280 cave
LR1-9 | corrige | doc2 : un seul désaccord pesé (Fournisseur) ; chaque toucher du bouton du bloc Lectures ouvre ce champ et son « À confirmer » | lr19b-1..4 (P7) | 390 clair/cave
v3-7 | corrige | ligne Gerstenflocken ouverte, « supprimer » 90×28 atteint au doigt (elementFromPoint = bouton) | v37b-supprimer (P7) | 390 clair/cave
v3-8 | corrige | après « supprimer » : 31 → 30 rangées, « Annuler « Gerstenflocken » », « Lignes 84,10 = total 86,50 − 2,40 retiré » | v38b-apres (P7) | 390 clair/cave
BR-27 | corrige | « -1 » : « une valeur négative n’existe pas ici. Le champ reste vide. » | br27-* (P6) | 4 combos
TE-36 | corrige | fiche et feuille : « Inclure dans mes prévisions » | te36-* (P6) | 4 combos
BE-23 | corrige | medicament, « Ajouter au stock » : « 4 pièce », choix Ingrédient/Emballage/Nettoyage ; « Stk » absent partout | be23b-barre (P7) | 390 cave, 1280 clair
LR1-14 | non reproduit (local) | Confirmer puis Terminé : feuille fermée ; Annuel « 0 / 9 prêtes » avant et après, aucun « comptes ont changé » | lr114c-apres | 1280 cave, 390 clair
E1-2 | non joué | geste du banc faux deux fois (rangées fermées, section « Articles » fermée en g4) ; à rejouer (REPRISE) | e12b-*, e12c-* | —
TE-35 | non joué | prix, livraison, pose absents de « Modifier le devis » ; ils sont sous « À étudier · mon estimation » (REPRISE) | te35c-devis | 390 clair

## Problèmes (provisoire : question ouverte faite sur les captures déjà prises, saisie à la main à compléter)
1. Pied à 390 pendant la lecture : « 3e lecture en c… » coupé, et « Lecture en cours… » jamais montré (v3-5). (v35b-0-390-clair)
2. doc2 : faux désaccord. Les trois lectures du fournisseur sont le même cabinet (noms contenus l'un dans l'autre), mais l'en-tête dit « À vérifier · 1 valeur en désaccord » en rouge. v3-3 ne barre plus ce cas, le compte le pèse encore. (lr19b-1-390-clair, reel-doc2)
3. LR1-7 : le champ prix déduit n'a pas de title « prix déduit : montant ÷ quantité » ; seule la couleur ambre le dit. (lr17-deduit)
4. Saisie à la main (g3, geste du banc fautif, à confirmer) : « Ce que tu achètes » affichait 6 rangées rouges « Ligne sans libellé ? × — » pour une dépense de 3,00 ; à vérifier au geste juste. (e12b-saisie-390-clair)
