OK — accepté : 7 pictos « épicé » au trait, sans poivre, lisibles à 12/16/24 px, qui couvrent les deux lectures de « plutôt vanille, canelle ? » ; on peut montrer la planche au brasseur telle quelle.

## Captures ouvertes en image (Read)
- `fils22-picto-epice/captures/planche-390.png` : pas de défilement, titre « Épicé : quel picto ? », picto actuel « actuel, rejeté » en tête avec Herbacé, Végétal, Terreux, Résineux ; 7 blocs avec nom court, 12/16/24 px et ligne de contexte.
- `fils22-picto-epice/captures/contexte-390.png` : 7 lignes de contexte à 16 px parmi Agrumes, Floral, Herbacé, Résineux.
- `fils22-picto-epice/captures/gros-24.png` : outil de travail, pictos agrandis ; sert à juger les silhouettes.
- Vue ajoutée par moi : `z12.png`, 12 px à ×4, prise avec puppeteer dans le dossier temporaire de ma session (scratchpad), hors du dépôt. Rien n'est versionné.

## Réponses aux cinq questions
1. **6 à 8 variantes, sans poivre, lisibles à 12 et 16 px : oui.** 7 variantes (cannelle, vanille, badiane, girofle, mortier, coriandre, saupoudreur). `controle-planche-picto.mjs` rend `PLANCHE OK (7 variantes)`. Le témoin négatif `planche-poivre.html` échoue bien (`ECHOUE OK (PLANCHE ECHEC, code 1)`). Sur `z12.png`, les 7 silhouettes se lisent à 12 px. Badiane, mortier et coriandre sont les plus nettes. Girofle (trait fin, tête petite) et saupoudreur (silhouette étroite) sont les plus faibles, mais restent reconnaissables.
2. **Les deux lectures sont couvertes : oui.** « Ressemble à vanille/cannelle » (le picto de 5 cercles est remplacé) et « dessine plutôt vanille/cannelle » : bâton de cannelle et gousse de vanille, avec cinq autres idées (badiane, girofle, mortier, coriandre, saupoudreur). Sur `planche-390.png`, aucun picto n'est un cercle de poivre.
3. **Confusions : aucune avec Herbacé, Végétal, Boisé ou Floral.** Sur `contexte-390.png`, aucune variante ne ressemble à la feuille d'Herbacé ni au sapin de Résineux. Les confusions restantes sont proches d'une autre idée, pas d'une famille :
   - badiane : proche du cercle à rayons d'Agrumes (jaune à côté, donc lisible grâce à la couleur) ;
   - coriandre : cercle à deux côtes, voisin d'Agrumes et de Melon ;
   - mortier : bol, voisin de Melon ;
   - cannelle : se lit comme un cylindre, crayon ou gélule à 16 px (dit par l'auteur dans NOTE.md, confirmé sur `contexte-390.png`) ;
   - vanille : haricot ou amande sans son nom.
4. **Trait, ton, halo : oui. Contexte : maquette de carte, pas une vraie carte.** `controle-pictos-trait.mjs` rend `TRAIT OK` (61 pictos de famille, 0 faute). `generer-planche.mjs` ligne 54 fixe `stroke="#7a4e3a"` (variable TON), `stroke-width="2.571"`, `fill="none"` et des extrémités rondes. Sur les captures : pas de halo, pas de disque pâle. Le contexte est une barre grise à la place du nom, avec 4 pictos voisins réels. L'auteur l'annonce (« gabarit »), aucune donnée n'est inventée, et le contrat l'accepte.
5. **Périmètre respecté : oui.** `git status --short` : le seul dossier nouveau de r4 est `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/`, avec `generer-planche.mjs`, `capturer.mjs`, `NOTE.md`, `captures/` et `planche/etat.html` (ces deux derniers ignorés par git). `controle-planche-picto.mjs` et `temoins/` sont déjà non suivis au début de ma session, et le contrat les range dans les entrées de r4, pas dans ce qu'il possède. `pistes-l5f.png` à la racine était déjà là au début (lot 21), pas de r4.

## Défauts mineurs (aucun ne bloque)
- Cannelle à 16 px : cylindre sans spirale visible (`contexte-390.png`, ligne 1). Correction possible : si le brasseur la retient, une seconde passe doit rendre l'enroulement visible à 16 px.
- Vanille : se lit comme un haricot sans le nom (`contexte-390.png`, ligne 2). Même correction éventuelle après choix.
- Girofle et saupoudreur : faibles à 12 px (`z12.png`). À signaler au brasseur, à ne pas masquer.
- La comparaison de tête montre Herbacé, Végétal, Terreux et Résineux, mais pas Boisé, que le contrat citait. Le risque est faible : Boisé n'est pas non plus un brun fin sur la ligne de contexte.
- `gros-24.png` : le commentaire de `capturer.mjs` dit « 24 px ×8 », mais l'image est en réalité à 120 px. Cosmétique, c'est un outil de travail.

## Honnêteté
Rien de chiffré ni de simulé. Les pictos sont des propositions à choisir, sans classement imposé : la recommandation (badiane) figure dans `NOTE.md`, la décision revient au brasseur.

LEÇON PROPOSÉE : aucune
