# Voie r4r-relecture — relecture indépendante de la planche « épicé »

- Mission : 2026-10-22-reprise-lot21
- Agent : relecteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r4-picto-epice
- Décideur en cas de doute : pilote

## Objectif
Juger la voie r4-picto-epice, sans l'avoir écrite et sans refaire le travail : la planche
répond-elle à son contrat et aux deux plaintes du brasseur ? Peut-on la lui montrer telle quelle ?

## Entrées
- `work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/VOIE.md` — le contrat relu.
- `work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md` — le rapport de l'auteur, à ne pas croire sans vérifier.
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/` — le livrable : `NOTE.md`, `generer-planche.mjs`, `planche/etat.html`, `captures/*.png`.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` — les 11 autres pictos de famille, pour juger les confusions.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, `cerveau/produit/acquis-valides.md`.

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r4r-relecture/RESULTAT.md`

## Consignes
- Ouvre en image (Read sur le PNG) **chaque** capture de `fils22-picto-epice/captures/`. Si une vue
  manque pour juger (par exemple 12 px), prends-la toi-même avec puppeteer. Écris-la alors dans un
  dossier temporaire, hors du dépôt, et dis-le.
- Questions fermées, une réponse prouvée chacune :
  1. Y a-t-il 6 à 8 variantes, sans poivre, et toutes lisibles à 12 et 16 px ?
  2. Les deux lectures de « plutôt vanille, canelle ? » sont-elles couvertes ?
  3. Une variante se confond-elle avec un autre picto de famille (Herbacé, Végétal, Boisé, Floral…) ?
     Nomme laquelle.
  4. Les pictos sont-ils au trait, au ton `#7a4e3a`, sans halo ? Le contexte est-il celui d'une
     vraie carte ?
  5. L'auteur a-t-il écrit hors de son périmètre ? Vérifie avec `git status --short` et
     `git status --short --ignored work/refonte-frontend/v4/ecran-1`.
- Pour toi, « accepté » veut dire qu'on peut montrer la planche au brasseur telle quelle. Une variante
  faible n'est pas un rejet si les autres tiennent : signale-la.

## Exigences transversales et acquis
Code couleur des arômes ; pictos au trait (D88) ; peu de texte au premier plan ; le brasseur choisit.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format du relecteur : la ligne 1, puis un défaut par ligne avec sa preuve. Cite les
captures ouvertes par leur nom de fichier. Réponse finale au pilote : une ligne.
