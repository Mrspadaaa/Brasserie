OK — série u : 6 concepts Identité (2 froides, 2 tièdes, 2 chaudes), baseline suivie, PANEL OK

Série u (libre, brief minimal). Ce RESULTAT vaut pour u1 à u6 ; il est rangé dans u1 parce que je n'écris que dans v0/u*/.

## Fichiers
- `v0/u1` à `v0/u6` : `etat.html`, `NOTE.md`, `uN-haut.png`, `uN-page.png`, `uN-apres.png`
- `v0/u1/gen-u.mjs` : génère les six pages ; `v0/u1/vides.mjs` : bandes vides du premier écran

## Concepts
- u1, froide : une ligne par réglage
- u2, froide : les trois questions (1 Quelle bière ? 2 Combien ? 3 Comment ?)
- u3, tiède : six tuiles, la tuile est le contrôle
- u4, tiède : lire en haut, régler en bas sur un pupitre sombre
- u5, chaude : l'affiche typographique, NOLO en tampon
- u6, chaude : trois molettes (style, litres, minutes)

## Sorties décisives
- `verifier-page --min-images 0` : 6 × PAGE OK
- `controle-panel` sur les 6 `uN-haut.png` : médiane 0,57, 1 sous 0,50 (u1 à 0,46), ressemblance 0,72, 0 paire en double → PANEL OK
- `mots-premier-ecran --max=80 --page=etat.html` : 76, 79, 75, 78, 77 et 80 mots → MOTS OK
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant et brutes OK. couleurs, au-style, fiche, trait et legende ECHEC : ce sont les contrôles des écrans houblons (familles, lentille au style, data-houblon, pictos, légende), sans objet sur Identité. couleurs : une seule teinte franche.
- toucher d'un booster par page, dont un glisser sur u6 : 6 × « change » → TOUCHER OK
- `type="number"` : 0 dans les six pages
- `controle-choix` : sans objet, Identité n'est pas au registre des choix
- Captures ouvertes : les 6 `-haut` et `u4-apres`, `u6-apres`

## Prédiction
« u2 et u5, je comprends tout de suite ; u3 fait tableau de bord ; les molettes, j'aime. »

DÉCISION À PRENDRE : la baseline compte 19 mots sur les 80. Si le plafond devait exclure l'en-tête (`--sans-coquille`), u1 et u2 pourraient retrouver « Coller une recette trouvée » et les plages EBC et ABV.
CONNAISSANCE : `mots-premier-ecran` compte aussi les éléments masqués par un `overflow` qui tombent dans le premier écran : une liste défilante (molette) fait exploser le compte, il faut la fenêtrer. `controle-panel` ne compte pas les surfaces #F5F5F5 et #EBEBEB (écart ≤ 60) : un panneau gris ne remplit pas, seuls le texte, les traits et les aplats foncés comptent.
LEÇON PROPOSÉE : aucune
