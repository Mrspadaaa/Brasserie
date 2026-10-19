x2 · L'escalier : sur le papier, puis dans ta stout. **Tiède, vers chaud** : la baseline (barres au style, pictos, α, usage, fiche) mise en papillon, marche par marche.

- **L'idée** : répondre à « citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos outils ils sont assez similaire ». C'est un duel à dose égale (« contre Cascade, Galaxy, Idaho 7 » ; 1, 2, 4 ou 8 g/L), qu'on lit en descendant, du papier au verre :
  1. **Sur le papier**, le panel YCH sur houblon broyé, en vraies valeurs : agrumes 92 contre 85, tropical 78 contre 73. Ils sont presque pareils. Galaxy et Idaho 7 n'ont pas de panel publié, c'est écrit.
  2. **Par gramme**, en vraies valeurs de fiches : huile, linalol, 4MMP libre, farnésène, avec le facteur (« Citra ≈ ×7,7 » de 4MMP, « Cascade ≈ ×10,5 » de farnésène). C'est là que tout diffère.
  3. **À 60′, 10′, au whirlpool, en dry hop actif, en dry hop après** : le profil simulé de la 16D en papillon, Citra à gauche, l'autre à droite, sur cinq familles nommées.
     - À chaque marche, sa vraie valeur : l'IBU (+100 contre +52 à 60′, « trop amer »), ce qui reste (4MMP −91 %).
     - En dry hop après, le rapport au seuil du 4MMP et du linalol en bandes log sur un même axe, avec la mesure publiée de Citra à côté (linalol 144 µg/L, E06) : le 4MMP sépare presque les deux, le linalol se recouvre sur ×35 000.
     - La levure (US-05, Pomona) se règle sur la marche active, avec sa biotransformation.
  4. **Ensemble, 2 + 2 g/L** : l'ajout cumulé du moteur (cas K5). On y lit ce que chacun apporte (« ~ Citra +23, Cascade +8 pts ») et la saturation partagée (agrumes 76 % de la somme des deux seuls). Ordre, synergie et masquage restent inconnus.
  - **En tête**, l'écart marche par marche (somme des écarts de centre sur les cinq familles, simulé), ~15 à 60′ puis ~59 dès 10′ : le saut se voit avant de lire. Un toucher sur une colonne mène à sa marche.
  - **Pour choisir** : toucher une moitié de marche choisit ce houblon à ce moment. Le résumé en bas donne la dose en grammes pour 20 L, le stock, le style et l'IBU.
- **Ce qui tient** : la question du brasseur a sa réponse visible en une descente : pareils sur le papier, très différents par gramme, et l'écart qui naît dès qu'on quitte les 60′. Le duel est toujours à dose égale, avec la dose écrite. Les vraies valeurs et le simulé ne se mélangent jamais : en gris-bleu et chiffré, le panel ; en couleurs de familles et marqué « ~ », le moteur.
- **Ce qui casse** :
  - La page est longue : huit marches, cinq familles chacune.
  - Les moustaches du moteur, presque toujours ouvertes vers le haut, se lisent comme un axe.
  - La marche « par gramme » aligne des unités différentes, chacune écrite.
  - Le papillon ne montre que cinq familles sur douze.
  - Galaxy et Idaho 7 n'ont rien sur le papier, et le moteur sous-estime probablement Idaho 7 (note du moteur).
  - L'écart en tête est une somme de points simulés, pas une intensité.
- **Ce qu'elle apprend, même rejetée** : le « papier » et le « verre » côte à côte expliquent mieux que toute phrase pourquoi nos outils trompaient. Le panel sur houblon broyé est une vraie valeur, mais sur le mauvais support.
- **Contrôles** (indicatifs en v0, joués une fois sur `etat.html`, profil du moteur) :
  - COMMUN : `COMMUN ECHEC 1 contrôle(s)` (mots ECHEC, 158 mots au premier écran pour 70 ; couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant OK)
  - LISIBLE : `x2 · 11 pictos · 26 mesurées · 9 simulées · 0 faute(s)` → `LISIBLE OK`
  - SIMULATION : `x2 · 1 simulation(s) · 9 réglage(s) · 34 mesurée(s) · le simulé bouge` → `SIMULATION OK`
  - CUMUL : `x2 · 1 ajout(s) cumulé(s) · 2 choix de levure · biotransformation visible · la levure fait bouger le simulé` → `CUMUL OK`
  - ALPHA : `x2 · 2 voies · 2 avec leur α` → `ALPHA OK`
  - FICHE-BASELINE : `x2 · fiche de Cascade · 12 familles nommées, 18 pictos · 0 faute(s)` → `FICHE-BASELINE OK`
- **Pire contraste** : 4,64:1, « trop amer » (#c2410c sur #fdf0ea) ; aucun texte sous 4,5:1.
- Générée par `node generateur-x2.mjs`, avec le socle de `../x1/socle-x.mjs`.
