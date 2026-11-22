# Inventaire des liens entre modules (docs, 16.11)

Sources : S = work/refonte-frontend/v4/SPEC-BRASSEUR.md (l. 1701-1806) ; L = work/missions/2026-11-16-calendrier/LIENS.md ; C = work/missions/2026-11-16-carnet-decision/CADRE.md ; P = PRODUCT.md.
PRODUCT.md : aucun lien inter-modules décrit (Stocks, finances, clients cités ensemble, l. 85) ; rien à reprendre.

## A. Demandé ou décrit par le brasseur (mots exacts)

1. Règle générale (S 16.11) : « Dans l'application tout a un lien avec tout... Ce genre de lien, il y en aurait d'autres... À toi de les faire, trouver, créé, critiqué ECT... » ; « Pas oublier le lien avec la compta, calendrier et autres ».
2. Calendrier <- carnet, par le + (S 16.11) : « sur le calendrier très facilement dans la section correspond, ajouter avec un + une nouvelle idée, et ça viendrait directement là bas ». Lu : ce qu'on crée d'un écran arrive là où ça vit ; ce qui naît ailleurs se voit ici.
3. Calendrier global = centre (S 15.11, 16.11) : « Ça serait un calendrier, prévision et finance global » ; « Ça va être le cœur de l'application... il faut que tout le reste de l'application s'intègre là dedans » ; « un truc vraiment génial et central ».
4. Calendrier : onglet du bas (S 16.11) : « un onglet calendrier en bas pour le global ». Le + reste flottant : « Le + n'a jamais été en bas, c'est un bouton "volant" ... il pourra avoir ces propre action calendrier ».
5. + volant partout (S 15.11, b1r) : « certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant ». Avant : « le + doit être dynamique en fonction de l'écran ou on est ».
6. Calendrier <-> Finances (S 15.11 f1) : filtres de plannif « brassage, event, ou autre activité » ; « projets sans budget ou autre activité. Type nettoyage fenêtre Pose du sol Prospection » ; semaines, jours actifs, mise de côté (« entre la semaine 6 et 35 je vais mettre de côté », « Rénovation des Sol entre la semaine 20 et 40, 5 jour actif et 600chf »).
7. Frise détaillée <-> caisse (S 15.11) : « une vue exprès détaillé de t1b2 La frise sous la caisse... avec temps et argent » ; « Une nouvelle vue », atteinte depuis À venir et la caisse.
8. Besoin -> devis -> scan -> Todo (S 15.11, kh1) : « je crée un besoin envie. Je cherche prix ou demande devis. Je scane devis ou achat, et l'ai fait le lien et l'enlève de la "Todo" ». Réponse : « Devis ↔ besoin … Ok ». Lu : le lien scan-besoin n'est qu'en maquette et ticket #201, pas en ligne.
9. Besoin = idée avec liens et prospection (S 15.11) : « C'est des idées avec lien et prospection ect... » ; ajout/édition en formulaire refusés.
10. Cascade d'effets (S 15.11, simplicité) : « lavé un fût fait baisser les consommables de nettoyage. Faire une bière pareil, baisse le starsan ect... Ce genre d'action qui est dynamique sur toute l'app » ; correction : « C'est juste des exemples, être générique et général ».
11. Simplicité (S 15.11, 16.11) : « efficace et facile pour maintenir à jour l'état de ma brasserie SIMPLEMENT » ; « en un clic on a tout l'essentiel, ça s'autocomplete autocasse, autogéré » ; « Ça doit toujours être ultra facile d'utilisation.. workflow le plus simple » ; sans perte de fonctions ni de données.
12. Carnet <-> calendrier (S 16.11 « Tous », C leviers) : une idée avec échéance ou budget apparaît au calendrier global ; une baisse de prix de la veille s'y affiche.
13. Carnet <-> carnet entrant (S 16.11) : partager un lien du navigateur vers l'app, raccourci « Nouvelle idée », voix. Lien collé : « ça montre l'objet ».
14. Carnet <-> veille fournisseurs (S 16.11) : « un toggle switch qui va regarder tout les 3 jours si l'article est en stock ... Chez d'autres fournisseurs et si il a baissé de prix ».
15. Carnet : choix -> pourquoi (S 16.11) : « pas revenir en arrière ... pourquoi j'ai pris ce fournisseur » ; carnet lié à compta, besoins, fournisseurs, atelier, stock (lecture du pilote, S 16.11).
16. Période commune (S 15.11, m3) : la période se règle à plusieurs endroits ; lu : même plage « du … au » que Finances partout (variantes si ambigu).
17. Fût -> client (S 15.11, kt2/kx2) : un point de vente ouvre la vente ; frise fûts, clients et lieux « à voir à quel point c'est adaptable ».
18. Matériel -> calendrier (S 15.11, zq1/za3) : « Le fil du temps » retenu ; « Une date, pas un compteur » (za3).
19. Gestes directs sur la frise (S 16.11) : « tu glisses une barre pour la déplacer, tu tires son bord pour l'allonger. Un appui long ouvre épingler, étoile et filtrer » (K11 bloquant).

## B. Déjà décidé ou choisi

- fb (Calendrier gestes) choisi ; f1 (Caisse et semaines) top ; f1r = onglet global ; t1b2 choisie ; kh1r = graphe de caisse étalon ; kyh1 (À venir) choisie avec graphe kh1r 1:1 ; kxc (Tarifs, échelle log) ; kx2r1 (vente ouverte au toucher) ; za3 (Matériel) ; d3p2 (menu et +), m3, r3p2 (recherche) ; Finances : m1do-a, m1ar-c, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4pf-c, m4ia-c ; d1b (feuille Brasser) ; p2a (compagnon).
- Flash-Lite accordé pour relier un devis à un besoin (C, acquis).
- L §4 : 20 liens action -> calendrier proposés (planifier, jour J, levure, garde, fût, facture, paiement, prévision, achat, activité, tâche, entretien, panne, stock, lot de levure, TVA) ; non choisis par lui.
- L §3.4 : effets en cascade montrés en aperçu, jamais écrits par le calendrier ; table « geste -> article, quantité » (C7) à bâtir dans Simplicité.
- Refusés : s2a2, ky/kz (parcours à étapes), « Scan relié » visible, caisse au premier plan du carnet.
