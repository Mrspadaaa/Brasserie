# Dossier — son carnet « chambre froide », tour 48, 24.11

Sa demande, mot pour mot : « Test sur le carnet de la chambre froide ».

## Règle dure : c'est SON vrai carnet
- Lecture et gestes qui n'enregistrent rien : ouvrir chaque rubrique, chaque fiche d'article, Comparer, la recherche (loupe), les filtres de domaine, replier/déplier Quand et prix, ouvrir puis FERMER sans valider toute feuille (Choisir, Placer, changer de domaine, Escalader…). Ne valide AUCUN geste qui enregistre (Choisir, Placer, changer le domaine, ajouter, retirer, relire un lien, Escalader) : décris ce que tu aurais touché et ce que la feuille annonce.
- Aucun appel IA (rien qui relit un lien). Coût : 0.

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome.
- Paquet : le pilote te donne le nom (index-…js) dans le prompt ; vérifie-le (curl), recharge si l'onglet sert un ancien paquet.

## À juger (en plus de tout ce qui choque comme le brasseur le jugerait)
- Ses choix portés (voies/carnet-q/decisions-D435-D437.txt) : Q-1 A un seul prix, celui du choix ; Q-1b B pastille budget/prix lu en tête, lisible (C46-1) ; Q-2 C recherche, mot entier (C46-2) ; Q-5 A Quand et prix repliés ; domaine juste et puces.
- Étapes de lecture des liens (D448) : total juste (C46-6) ; chaque fiche d'article : rien d'inventé contre la page source (ouvre la page dans un autre onglet, compare prix, nom, caractéristiques, libellés en français, références non formatées comme des nombres).
- Cohérence : même prix au carnet, À venir et Calendrier (C46-3, C46-4) ; C46-5 (arrondi à 80 dans À venir) reste connu, ne pas reverser.

## Verdict
« combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème à BUGS.md (préfixe C48-), format des lignes C46.
