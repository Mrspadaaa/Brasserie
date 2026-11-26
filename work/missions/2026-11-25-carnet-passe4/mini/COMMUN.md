# Jetons communs des mini maquettes p5 (O et S), 26.11

Écrit par O. Thème sombre « cave » de DESIGN.md, 390 × 844. Adulte ne veut pas dire moins visuel (« Mais toujours bon visuel pour
un visal learner ») : couleur d'état, jauges, barres de prix, icônes au trait gardées. Tableau quand le cas compare ou aligne des valeurs (« En soit les
tableaux sont un bon outil tout de même, mais il doit être adapté ») : peu de colonnes, gagnant visible, unités ; jamais un tableau de propriétés par défaut.

## Couleurs
| Rôle | Valeur |
|---|---|
| Page / panneau / surface | `#12100E` / `#1A1613` / `#221D19` |
| Filet / filet marqué / trait faible | `#2C2521` / `#3D342E` / `#574A42` |
| Texte secondaire / courant / valeur | `#9A8A7E` / `#D8CEC5` / `#F5F0EA` |
| Action principale (aplat) | `#F2C14E`, texte `#12100E` |
| État Noté | `#9A8A7E` (gris) |
| État Je cherche | aplat `#5B8AA6`, texte `#8FBEDB` |
| État Décidé | aplat `#E0A02E`, texte `#F2C14E` |
| État Résolu | aplat `#6E9B5B`, texte `#A3C97A` |
| Trouvé | `#A3C97A` + coche pleine |
| Pas trouvé / à vérifier | `#E3B55D` + « ? » dans un cercle (tireté = à vérifier) |
| Estimé | `#8FBEDB` + « ≈ » devant le chiffre, contour tireté |
| IA (✦, proposé, conseillé) | `#BCA5E8`, fond `rgba(188,165,232,.12)` |
| Lien lu 🔗 | icône lien au trait `#86B9E6` + « lu » ; pas lu : « 🔗 en lecture » |
| Alerte | `#F29289` |
La couleur sert l'état, jamais la décoration.

## Tailles
- Police Source Sans 3 ; chiffres proportionnels (jamais de chasse fixe espacée).
- Texte 14 px au moins (libellés de la barre d'onglets : 13) ; courant 15 ; valeur de case 17–20 graisse 700 ; titre d'écran 18/700 ; étiquette de section 13 capitales espacées seulement en gris.
- Cibles 44 px au moins. Rayons 12 (cartes), 10 (puces), 22 (champ).
- En-tête du carnet 48 px (‹, titre 2–5 mots, puce de catégorie, ⋯) ; rangée Mes notes | Organisé 44 px, l'heure de rangement en
  icône « ✦ 13:22 » à droite (ENTETE-PEU-UTILE) ; première info utile avant 120 px sous la barre.

## Icônes
- SVG au trait 1,75 px, 16 px dans le texte, 20 px en tête de ligne, monochromes (couleur de l'état ou `#9A8A7E`).
- Emoji : 16 px au plus, à côté d'un nom réel, jamais seul. ✦ = l'IA, toujours violet.
- Jeu : goutte (eau, écoulement), éclair (électrique), flocon (froid), bouteille, sac (malt), bouclier (assurance), clé (réparer),
  téléphone (contact), panier (à acheter), calendrier, cloche (veille), lien, appareil photo, micro.

## Barre du pouce (collée à la barre d'onglets, aucune bande vide)
- Une ligne de 56 px : champ 44 px (« Ajouter à <carnet>… », photo et micro actifs dans le champ), bouton ✦ 44 px (contour violet,
  suggestions de l'IA), bouton + 44 px (aplat `#F2C14E`), à droite. Rien d'autre au pouce : aucune question (PAS-DE-HARCELEMENT).
- Barre d'onglets 56 px : Bord, Finances, Calendrier, Brassins, Stocks (actif), Clients.

## Dates et heures
Aujourd'hui = je 26.11.2026, heure suisse. « dans 5 j · ma 1.12 », « il y a 2 j · 24.11 21:26 ». Jours calculés, jamais écrits à la main (ma 24.11, ma 1.12, di 6.12).

## Données et « exemple » (passe 5)
- Une seule vérité : `mini/DONNEES.md` (écrit par S) : catégories « catégorie › sous-catégorie », lignes, compteurs, états.
- Toute donnée hors de ses notes et fixtures est marquée DANS l’écran par la puce `.o-ex` « exemple » (13 px, contour tireté `#574A42`, texte `#9A8A7E`) ; une offre d’exemple ne gagne jamais une ligne ni une case « qui gagne quoi ».
- Estimé : « ≈ » + `#8FBEDB`, case au contour tireté bleu (son « Estimation 150 CHF (exemple) », l. 6, partout où le coût se montre).

