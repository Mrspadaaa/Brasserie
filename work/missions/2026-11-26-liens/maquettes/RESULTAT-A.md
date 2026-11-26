OK — A1 fiche technique, A2 tableau de bord pro, A3 carnet de labo : 4 écrans plus ✦ ouvert

## Fichiers
- `maquettes/A1-fiche.html`, `maquettes/A2-tableau.html`, `maquettes/A3-labo.html` : page statique, écran par `?e=liste|probleme|achat|echeance`, `&ia=1` pour le ✦ ouvert.
- Captures 390 × 844 (dsf 2), 15 au total, toutes ouvertes et jugées : `maquettes/cap/A{1,2,3}-{1-liste,2-probleme,2b-probleme-ia,3-achat,4-echeance}.png`.

## Les trois genres
- **A1, fiche technique.** Filets et typographie seuls, sans carte. Libellés en capitales de 12 px. Tables clé / valeur (État, Lieu, Symptôme, Cause), sections numérotées (Pistes, Démarches, Options, Sources). Chaque valeur renvoie à sa note (`n2`, `n3`…), les notes sont en pied de page. L'arbre a des traits de rattachement et trois colonnes alignées : Carnet, État, Repère.
- **A2, tableau de bord pro (façon Linear).** Glyphes d'état au trait (cercle pointillé = noté, demi = cherche, trois quarts = décidé, plein coché = réglé, carré rouge = urgent). Filtres par état avec un compte, onglets Organisé, Échéances et Récents. Le carnet ouvert a une grille de propriétés, des sous-listes encadrées avec leur compte `1/2` et une barre de commande avec raccourcis (`/tâche`, `/prix`, `/date`, `@carnet`). L'échéance a une règle des dates avec trois repères : aujourd'hui, le rappel ✦ et le 31.12.
- **A3, carnet de labo.** Feuille réglée au pas de 28 px. La marge gauche porte les repères (heure de la note, case, ✓, ✕, `n1`) ; la marge droite, en violet pointillé, porte les annotations ✦ de l'IA. Le calcul est posé à la main (`0,55 × 600 + 80 = 410`) et l'échéance est un tampon (`31.12 · J−35`). La liste est un index à points de conduite.

## Contrôles (sortie décisive)
- Tailles de texte par écran : `12,14,20` (plus 16 pour la saisie et le ✦), aucun texte sous 12 px, aucun débordement horizontal (`over:0`) sur les 15 captures. Polices chargées : Source Sans 3 et IBM Plex Mono.
- Arbre : 17 carnets visibles à 390 × 844 dans les trois genres (au moins 12 demandés), avec le champ texte et le ✦ à côté du « + ».
- Pas de `type="number"` : 0. Boosters marqués (`data-booster`) : A1 4, A2 6, A3 4 (✦, Fait, Retenir, filtre, règle des délais).
- Comparaison des 600 bouteilles : critères en lignes, offres en colonnes, inconnu « — ». Le gagnant, B (410 CHF), a un liseré vert. Les totaux et la ligne « couvre 600 » sont des calculs de l'IA, marqués ✦ : 0,42 × 1200 = 504 ; 0,55 × 600 + 80 = 410 ; 0,20 × 400 = 80 pour 400 bt seulement.
- Couleur réservée à l'état (urgent, cherche, décidé, réglé) et au violet de l'IA. Aucune hachure, aucune pastille décorative, aucune jauge ✓n/?n en barre. Les icônes font 16 px, au trait, une par type (problème, achat, échéance, idée, tâche, vente).

## Honnêteté des données
- Ses notes viennent telles quelles des fixtures c79 et de `cas-fictifs.json`. Le « 150 CHF » de la réponse réelle n'est pas dans la fixture : il n'est pas affiché.
- Les ajouts de l'IA sont marqués ✦ :
  - le conseil de faire confirmer la cause par X et l'option de changer le joint, pris dans la réponse réelle ;
  - le rappel de fin novembre (tâche IA du 30.11, précision « mois ») ;
  - les calculs.
- Les heures sont converties en heure suisse (21:26 pour 20:26Z).
- Repères de la liste : chaque mot vient de ses notes, abrégé par moi (« condenseur » = steam condenser, « testeur » = testeur de tension).
- L'état et le domaine des cas fictifs sont posés par moi. Chaudière est marquée urgente parce que le brassage est « demain 7h ». Les cas Bar du Centre et Fête de la bière sont rangés dans un domaine « Ventes ».

## Écarts connus
- A1 Options au repos : une seule colonne (Entreprise X), la 2e ne se remplit qu'avec ✦. Le vide à droite se voit un peu.
- A3 au repos : le bas de feuille reste réglé et vide sur 4 à 6 lignes. C'est voulu dans ce genre (la page continue), mais à juger.
- La rangée de raccourcis d'A2 est une proposition : rien n'existe encore derrière `/prix` ou `@carnet`.

## Prédiction
Il lira A2 comme un vrai outil pro et A1 comme le plus net. A3 a le plus de caractère, mais risque d'être jugé « joli carnet » plutôt qu'outil. Aucun des trois ne devrait lui paraître enfantin.

DÉCISION À PRENDRE : aucune (les trois genres vont au brasseur côte à côte).
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
