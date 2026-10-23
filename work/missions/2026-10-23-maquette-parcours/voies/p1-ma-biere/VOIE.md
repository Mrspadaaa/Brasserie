# Voie p1-ma-biere — Ma bière, la fiche et Substituer, jouables

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : p0-socle (le socle, son `ARCHITECTURE.md` et son « ## Contrat d'un écran »)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus. Aucune question bloquante : l'option
  prudente, écrite dans la NOTE.

## Objectif
Trois écrans de la maquette jouable, en React, dans le socle, calculés en direct :
- **Ma bière, étape Houblons** : le point d'entrée du parcours ;
- **la fiche**, à l'appui long sur un houblon ;
- **Substituer en porte** : « Lequel à la place de Nugget ? ».

Ils ont l'air et le comportement de la vraie app, et tout geste qui change la recette se voit au retour.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : le contrat d'un écran, les crochets d'état, l'adaptateur du
  moteur, les composants communs. Ne pas les recopier dans ton dossier : les employer.
- Ma bière : `work/refonte-frontend/v4/ecran-1/fils22-carte/ma-biere/etat.html` (la carte : contenu admis, ponts)
  et `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` (la base v4.x : disposition l8, barres l5b au
  style, rail glissé par 5′, radar m4 en lentille). Leurs captures sont dans les dossiers `captures/` voisins.
- Fiche : `work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` (fiche g1) et la fiche courte de type Citra
  cryo (`cerveau/produit/acquis-valides.md`).
- Substituer : `work/refonte-frontend/v4/ecran-1/fils22-carte/substituer-porte/etat.html`, et
  `work/refonte-frontend/v4/ecran-1/base/consolide/substitution.html` (u4 : remplaçants, dose à IBU égal, perd et
  gagne).
- `cerveau/produit/acquis-valides.md`, `cerveau/brasseur/penser-brasseur.md`, `cerveau/brasseur/pas-de-cockpit.md`.
- `DESIGN.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md` : la densité utile est la règle
  principale.
- Les en-têtes des contrôles de tes GATES (`work/refonte-frontend/v4/tournoi/outils/<contrôle>.mjs`) : ils disent
  les marqueurs `data-…` attendus.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**`
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/**`
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`
- sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p1/` (ignorée par git)
- `work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md`
- Un besoin dans le socle (un crochet, un composant commun, une action d'état) : le demander au pilote dans
  RESULTAT.md, ou le faire dans ton dossier. Ne pas écrire dans `src/commun/`, `src/etat/` ni `src/moteur/`.

## Consignes
1. **Ma bière, étape Houblons**, dans l'ordre de [[penser-brasseur]] :
   - en tête : IBU, OG et EBC de la recette, avec l'alerte de dégustation « trop résineuse » ;
   - puis les 12 familles en barres l5b au style, le radar m4 à un toucher (lentille) ;
   - puis chaque houblon de la recette : nom, α, rôle en mot, dose, moment glissé par 5′ (le geste de la base),
     IBU de l'ajout recalculé en direct ;
   - le stock en icône seule ;
   - les ponts : « + floral » → Suggérer ; Nugget → Substituer ; la ligne d'un houblon → Dryhopper ; la levure →
     l'étape Levure.
   Après le parcours, la ligne Idaho 7 ajoutée, le remplaçant de Nugget, l'IBU et les barres recalculés se voient,
   avec un repère discret de ce qui vient de changer.
2. **La fiche** : un appui long (650 ms) sur tout nom de houblon de la maquette l'ouvre, et un survol à
   l'ordinateur aussi. C'est la fiche g1, dans le langage de la page : mêmes pictos, α écrit comme sur les lignes,
   arômes et leurs sources, silhouette (radar), un geste « goût ». Elle se ferme par « × », par Échap et par
   « ‹ ». La fiche est un composant de ton dossier que les autres écrans importent : exporte-le, et décris son
   emploi dans ta NOTE.
3. **Substituer, la porte** : Nugget épinglé en colonne 1, les remplaçants du moteur classés (`substitutes`),
   dose à IBU égal, ce qu'on perd et ce qu'on gagne en familles. « Remplacer » inscrit le remplaçant dans la
   recette et revient à Ma bière ; « ‹ » abandonne.
4. **Comme la vraie app** : composants de `src/ui` et jetons de l'app, à travers le socle. Pas de `type="number"`.
   Le geste du moment se joue au doigt et à la souris.
5. **jeu.mjs** de chaque écran (format du socle) : les gestes et les attentes de ton étape. Par exemple, glisser
   le moment de Nugget change son IBU et l'IBU total ; l'appui long ouvre la bonne fiche ; « Remplacer » met le
   remplaçant à IBU égal (à 0,5 IBU près).
   Et D80 en direct (la règle de `controle-usage-intensite.mjs`, sur ce format) : chaque famille qu'un ajout fait
   bouger d'au moins 0,5 point montre son intensité (`data-famille` et `data-crans`, à 0,6 cran au plus du moteur),
   et chaque houblon son usage (`data-usage`, `data-source`, comme `hopRole`).
6. **NOTE.md** de chaque écran : `## Base` (d'où il vient, les captures regardées), `## Idées reprises`,
   `## Écarts` (ce qui diffère de la base et pourquoi), `## Pour l'app` (ce qu'il faudra brancher en vrai).
7. Te juger comme le brasseur sur tes captures (`jouer-parcours.mjs --captures`), à 390 px puis à 1280 px : les
   ouvrir en image avant de dire OK (L12).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 (« ? » hachuré) ; simulé marqué « ~ » ; 80 mots au plus au premier
  écran ; légendes derrière « ? » ; stock en icône seule.
- Code couleur des arômes (la table commune) ; moment glissé par 5′ ; barres l5b ; disposition l8 ; radars m4 et
  h4 sans légende écrite ; fiche g1 et fiche courte ; picto « épicé » f1.
- L26 : préfixer les classes propres à l'écran ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait, les captures ouvertes (nommées), les écarts et leur raison, les besoins dans le
socle, `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
