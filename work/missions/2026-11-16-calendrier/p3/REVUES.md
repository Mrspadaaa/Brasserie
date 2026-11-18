# Revues de la passe 3, calendrier global (16.11)

Revue Opus (Fable interdit), par le concepteur lui-même : un regard d'auteur, donc indulgent. Il faut le recouper par un critique neuf.
Captures ouvertes en planches (`p3/_planche-*.png`) : repos, geste et activité à 390 en clair ; c2h3 geste, g3 geste en cave et g3
activité après la correction ; les trois en paysage 844 × 390. Les planches cave des trois n'ont été vues que pour g3 (geste) : c'est à refaire.
Barème : f1 vaut 8/10 pour lui. Moteur commun : plus bas 259 · S24 dans les trois ; sans l'Embouteilleuse, 3 059 · S24 (`node p3/build.mjs`).

Contraintes communes, tenues dans les trois :
- **Pas de + flottant.** Le + vit dans une barre d'action posée au-dessus de la barre du bas, opaque, et la marge du bas suit sa hauteur
  (`placeDock`). Plus rien ne passe sous un bouton.
- **Filtres par type** : titres de couloir (c4e3, g3), puces (c2h3). Ce qui est masqué reste « compté dans la caisse ».
- **Activité sans budget** : ajoutée et capturée (« Prospecter les cafés », 6 j, S2 → S6), au trait, avec le débordement de S4 (3 j pour 2).
- **Paysage** : bouton « Plein écran » (fullscreen, puis verrou d'orientation), état capturé à 844 × 390.

| Variante | Brasseur | UX/UI | Parcours | Navigation | Moyenne |
|---|---|---|---|---|---|
| c4e3 l'année en couloirs | 9 | 8 | 9 | 9 | **8,75** |
| g3 le tableau de l'année | 9 | 8 | 9 | 9 | **8,75** |
| c2h3 le pinceau et la vue | 8 | 8 | 9 | 8 | **8,25** |

## c4e3 : l'année en couloirs
- Brasseur 9 : les brassins ont enfin leur nom (Blonde, Porter, IPA à cru…), l'argent et l'année sont sur le même axe. Reste : les noms
  courts du portrait (« Frigo », « 6 fûts inox ») ; le nom entier ne paraît qu'en paysage et dans la liste.
- UX/UI 8 : l'escalier des achats est réduit de moitié (noms courts posés dans la barre ou à côté). Reste : une chose d'une semaine
  (Inventaire, Laver fûts) n'est qu'un tiret pointillé de 8 px, trop petit pour viser au doigt.
- Parcours 9 : l'argent sans toucher ; la somme d'une période en un balayage ; une activité sans budget en trois touchers (Ajouter,
  activité, tirer la fenêtre), avec la charge semaine par semaine et « Mettre 1 j en S2 ». Reste : déplacer un achat n'est pas recapturé ici (p2, état « tenir »).
- Navigation 9 : titre daté « 16 nov. 2026 → 14 nov. 2027 · aujourd'hui S47 » ; « Plein écran » et « Ajouter en S47 » dans la barre d'action.
  Reste : on ne descend pas à la semaine depuis l'année (la liste ne montre que les six prochaines).

## g3 : le tableau de l'année (greffe)
Verres de la semaine en pinceau (c5f, c2h), aimants en couloirs (c3e, c4e), mousse du trop-plein, ligne barrée « et si » (c5g), barre
d'action qui parle de ce qu'on touche (+ contextuel, c4c).
- Brasseur 9 : « deux bières qui se suivent dans la cuve, la mousse sur S50, le verre presque vide en juin » se lit sans légende ; « et si je ne
  prenais pas l'Embouteilleuse ? » donne 259 → 3 059 d'un toucher. Reste : la mousse est petite sur la bande à 7 px par semaine.
- UX/UI 8 : un écran plein et soigné, rangées lisibles, notes jaunes des papiers. Reste : au geste « et si », le libellé barré sur la bande
  se lit mal (surtout en cave), et la barre d'action haute cache la rangée Libre (il faut défiler).
- Parcours 9 : barrer en 1 toucher, puis Remettre / La déplacer / Retirer ; ajouter en 1 toucher, déjà à la bonne semaine (« + en S50 ») ;
  l'activité se pose sur la rangée Toi avec sa charge. Reste : déplacer un aimant au doigt n'est pas capturé.
- Navigation 9 : le cadre sur les verres choisit les 8 semaines ; en paysage, 20 semaines. Reste : sauter loin (juin) demande de tirer le cadre.

## c2h3 : le pinceau et la vue
- Brasseur 8 : la vue à 4 semaines tient en une ligne par chose (deux fois plus dense) ; à 25 semaines, une ligne par genre, plus d'escalier.
  Reste : les montants à fenêtre perdent leur signe (« Frigo · 1 800 »), les autres l'ont (« −166 »).
- UX/UI 8 : les quatre zooms (4 sem., 3 mois, 6 mois, An) et le + dans la même barre. Reste : les puces de filtre prennent deux rangées.
- Parcours 9 : le Frigo se tient sur sa ligne du détail ; les semaines vertes ou rouges sont posées sous les mois, à l'échelle du détail ;
  « payé en S30 ✓ ». Activité sans budget montrée avec ses jours.
- Navigation 8 : pinceau et zooms. Reste : **en paysage, les boutons « + en S47 » et « Revenir » de la colonne gauche débordent sur le
  titre de la colonne droite** (capture `c2h3-paysage-cave-844.png`).

## Correction faite (une passe)
1. Le doigt simulé ne sort plus de l'écran (il élargissait la page et réduisait la capture de g3 activité) ; `html{overflow-x:hidden}`.
2. c2h3, geste : le genre de la chose tenue passe en tête du détail, donc le Frigo, son fantôme « payé en S30 ✓ » et la bande verte et rouge sont visibles.
3. c2h3 : puces courtes (Brassins, Ventes, Achats, Sans budget, Charges), qui passent à la ligne au lieu de sortir de l'écran.
4. g3 : « Fermenteur » coupé devient « Cuve · 1 fermenteur » ; la rangée Papiers ne double plus ses notes par des aimants ; l'« et si » de la bande
   en un seul libellé.

## Restent sous 9 (non corrigés, faute de budget)
- c2h3 paysage : les boutons de la colonne gauche passent dans une rangée à eux.
- c2h3 : signe « − » sur les montants à fenêtre.
- c4e3 et g3 UX/UI : chose d'une semaine visée au doigt (largeur mini 16 px, ou pastille) ; g3, barre d'action plus basse au geste « et si ».
