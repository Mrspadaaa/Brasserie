OK — p8 : g8 et c2h8, 13 problèmes de p7 traités (11 réglés, 2 en partie) ; page2 non faite (REPRISE)

Rebâtir : `node p8/assemble.mjs && node p8/build.mjs` depuis le dossier de la mission (→ `ASSEMBLE OK 34 remplacements`, `plus bas 259 S24 · sans Embouteilleuse 3 059 S24`).
`p8/assemble.mjs` lit `p7/build.mjs`, applique 34 remplacements (split/join, chacun trouvé une seule fois) et écrit `p8/build.mjs`, qui écrit `p8/{g8,c2h8}/etat.html`.
Captures : `p8/capt.mjs` (copie de `p2/capt.mjs`).
- `node p8/capt.mjs p8 repos,geste,plus g8 c2h8`
- `node p8/capt.mjs p8 etsi g8`
- `PAYSAGE=1 node p8/capt.mjs p8 paysage g8 c2h8`
- `LARGEUR=1280 node p8/capt.mjs p8 repos g8 c2h8`
Les quatre ont rendu CAPTURES OK. On obtient 22 images, en clair et en cave.
Fichiers écrits : `p8/assemble.mjs`, `p8/build.mjs`, `p8/capt.mjs`, `p8/{g8,c2h8}/etat.html`, `p8/{g8,c2h8}/*.png`, ce fichier. Rien hors de `p8/`.

## État des 13 problèmes de p7/CRITIQUE.md
1. **Réglé.** Dans g8, au repos à 390, la rangée Libre est en tête, sous les semaines : aucun libre ne passe sous le +.
   Reste : quand le + chevauche une valeur, il se replie en pastille ronde « + S47 » de 56 px. Au repos, cette pastille couvre
   encore la note −400 de S1, en bas du tableau (Papiers). On la lit après 40 px de défilement.
2. **Réglé en partie.** Dans c2h8, au repos, `libFit()` place le libre de chaque semaine en haut, au milieu ou en bas de sa
   section, toujours hors du +. Le + ne couvre plus aucun libre. Celui de S51 tombe sous la ligne de flottaison, en bas de la
   section. À 1280, je n'ai pas revu la capture.
3. **Réglé.** Dans g8, l'en-tête des semaines et la rangée Libre restent collés en haut quand on défile (sticky ; le tableau
   passe en `overflow:clip`, la page en `overflow-x:clip`). Chaque case « payer en » porte aussi sa semaine (S22 ✗ … S29 ✓).
4. **Réglé.** Le trait vert part sous la rangée Libre ; les chiffres de S27 sont sur un fond plein. Les cases ✓/✗ passent
   au-dessus du trait (z-index 2).
5. **Réglé.** Sous une étiquette sortie, le trait a la largeur de sa barre, pas celle du texte. Exemple : « Inventaire · 1 j »
   n'est souligné que sous S1. Le trait est un dégradé de fond, plus une bordure.
6. **Réglé.** Le nom va dans la barre dès qu'il y tient, et le montant se met à côté ou dessous : « Malt groupé » dans la
   barre, « −540 » dessous. Même règle pour « Noël privés » +640 en paysage, et pour « Laver fûts » 1 j à 1280.
7. **Réglé.** L'ordre des rangées est le même en portrait, en paysage et à 1280 : Libre, Cuve, Comptoir, Achats, Toi,
   Papiers. J'ai choisi « Libre en tête partout », l'une des deux voies proposées.
8. **Réglé.** À 1280, le libre (verres, chiffres, jours) est sous les semaines, visible sans défiler.
9. **Réglé.** Dans le gantt de c2h8, j'ai repris la règle de g7 : l'étiquette va à droite, sinon dessous avec un trait de la
   largeur de sa barre. Vu sur « Houblons −480 », « Ambrée −156 » et « IPA d'été −228 ». Plus aucune étiquette n'est à gauche.
10. **Réglé.** Les filtres ont leur propre ligne, avant les hypothèses : à 390, on voit Brassins, Fêtes, Ventes, Achats, puis
    Travaux en fondu. Ils passent avant la pastille des hypothèses, ce qui coûte 44 px de hauteur.
11. **Réglé.** Sous la bande « lâcher ici », un carré sur quatre est numéroté (S14, S18…). La semaine tenue, S30, est cerclée
    et numérotée en gras.
12. **Réglé en partie.** Le + suit la semaine tenue (« + S30 ») et se replie en pastille, si bien que la barre du Festival
    n'est plus couverte. Reste : la pastille tombe sur la ligne de « Fête de village », au bord.
13. **Réglé.** Un nom long passe à la ligne au lieu d'être coupé : « Bouteilles de Noël / aux privés › ».
Doute levé : pendant le geste, les fins de mois de c2h8 montrent l'ancien libre barré et le nouveau en vert
(avr ~~2 351~~ 3 071 …).

## Captures
Ouvertes : g8-repos-390, g8-geste-390 (deux versions), g8-repos-1280, g8-paysage-cave-844, c2h8-repos-390, c2h8-geste-390.
Non ouvertes (le plafond de contexte est atteint) : les états cave à 390, g8-etsi, les deux états plus, c2h8-paysage,
c2h8-repos-1280 et g8-paysage clair.
Non joués : `controle-panel`, `controle-commun` et `controle-choix`.

Prédiction : « g8 : enfin mes semaines et mon libre restent en haut quand je glisse le frigo, top. Le + rond, ça va. »

## REPRISE page2 (non commencée)
Tâche 2 du pilote, à confier à un agent neuf (Opus). Le brief du pilote vaut tel quel. Le lot d'images p8 est prêt dans
`p8/g8/` et `p8/c2h8/` : repos, geste et plus à 390 (clair et cave), paysage 844, repos 1280.
Pour le « + ouvert », prendre les captures `*-plus-390.png`.
Avant la page : ouvrir les captures cave et `*-plus-390` non vues ici.

DÉCISION À PRENDRE : Libre en tête partout dans g8 (problème 7), ou l'ordre du portrait en paysage ? J'ai pris Libre en
tête. L'autre ordre se montre en variante dans page2 si le pilote le veut.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un agent qui doit faire une passe de retouches et une page de choix dans le même tour dépasse 200 k. Il faut
les confier à deux agents.
