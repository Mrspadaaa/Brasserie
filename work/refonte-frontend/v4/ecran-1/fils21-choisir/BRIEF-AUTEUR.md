# Lot 21 · Mieux comprendre, mieux choisir : vraies valeurs, simulation, simulateur

Maquettes statiques en français (fil de fer fidèle), hors de l'app. Dépôt : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).

**Interdits** :
- jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env` ;
- rien sous `src/` : la porte B reste fermée ;
- pas de git ;
- texte avec barres obliques inverses ou accents graves : outil Write ou Edit, jamais Bash ;
- Gemini jamais.

Écris seulement dans ton dossier de variante, sous `work/refonte-frontend/v4/ecran-1/fils21-choisir/`, et dans `fils21-choisir/captures/` avec le préfixe de ta variante. Le moteur écrit seulement dans `prototypes/houblons-v4/` et `fils21-choisir/donnees/`.

## Ce que le brasseur a dit (19.10, soir), mot pour mot

Sur le lot 20 (`fils20-dryhop/`, six maquettes qui parlaient chimie : linalol, 4MMP, µg/L, « ×0,27–2303 ») :
- « C'est très difficile à comprendre. Lance un agent pour regarder ce qui peut aider à choisir. Lance plusieurs mini maquettes. On a établi la Baseline.. »
- « Trouve des vrais solution. On peut aussi simuler un 'faux' profil aromatique, pour mieux de rendre compte. »
- « Trouves des solutions pour mieux représentées. Mieux comprendre, mieux choisir. Quitte à tricher un peu sur certains points... »
- « Des vrai donné, mieux présenté, mais aussi des simulation, simulateur, des représentants distinctes. »
- Sur la chimie et le langage du brasseur : « Les deux se complément ». Et : « Je veux aussi des vrais valeur ».

Ses vraies questions, plus tôt :
- « je sais que par exemple citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos outils ils sont assez similaire » ;
- « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement complexe à voir ce qui est vraiment faisable » ;
- « Pourquoi à 10' pas à 60 ? Aussi ? » ;
- « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure ».

## Ce qu'on veut

Un brasseur, téléphone en main, comprend en quelques secondes ce que change un houblon, un moment, une dose, des jours de contact ou une levure, et choisit. **Les familles d'arômes d'abord, les vraies valeurs avec, et la simulation marquée comme telle.**
- **Le « faux » profil aromatique est permis.** Les fiches donnent la forme (quelles familles), le moteur la force (dose × huile × moment × jours), les composés les nuances (les thiols vers le tropical et les agrumes…). Il est toujours marqué « simulé » ou « ~ », et sa confiance se voit.
- **Les vraies valeurs sont toujours là, à côté du simulé** : α du lot et des fiches, huile totale, dose, jours, mesures en bière quand elles existent, rapport au seuil d'un composé. Ce sont elles qui permettent de vérifier.
- **« Tricher un peu »** : arrondir, simplifier, regrouper, montrer une valeur centrale avec une bande. Ne jamais inventer un chiffre sans le marquer simulé, et ne jamais cacher un « on ne sait pas ».

## La baseline, le langage visuel établi : à reprendre, pas à réinventer

Les deux baselines en lice, avec tous les retours du brasseur :
- **l5e** (`fils18-baseline/l5e/`, `tuiles-l5e.mjs`, `generateur-l5e.mjs`) : tuiles deux par rangée ;
- **l8g** (`fils18-baseline/l8g/` : `pictos-trait.mjs`, `habillage.mjs`, `noyau.mjs`) : une colonne par famille.

Leurs règles, toutes contrôlées :
- **Les 12 familles d'arômes** (floral, herbal, earthy, citrus, tropical, stoneFruit, pomeFruit, berries, melon, resin, spice, green), en **pictos au trait**, sans disque ni halo (D88), aux tons de `fils17-standard/jetons-familles.json` ;
- **les barres de l5b** : verticales, une par famille, en **crans du style** devant la zone du style en pâle, l'orangé au-delà du style ;
- **les pistes d'objectif** de l5b quand il y a un objectif (D92) ;
- **« Au style »** par défaut, l'absolu à un toucher (D75) ;
- **l'α** : celui du lot d'abord, puis la plage des fiches avec le petit livre ; ≠ hors des fiches, « pellets » pour Citra cryo (D87) ;
- **l'usage en mot** : amérisant, aromatique, mixte (D90) ;
- **la légende** derrière un petit « ? » (D89) ;
- **l'appui long** sur un houblon ouvre sa vraie fiche, dans le langage de la page (D25, D93) ;
- **le stock** en icône seulement ;
- **peu de texte** : 70 mots au plus au premier écran (la légende fermée ne compte pas) ;
- **la typographie de l'app** (DESIGN.md : Source Sans 3, IBM Plex Mono pour les mesures, 12 à 16 px) ; chaque texte à 4,5:1 au moins.

## Les cas : les mêmes pour toutes les variantes

- **K1, le moment** : Citra contre Cascade, 4 g/L, à 60′, 10′, whirlpool, dry hop actif, dry hop après. « Pourquoi à 10′ pas à 60′ ? »
- **K2, un dry hop seul** : Citra, Galaxy, Idaho 7, 4 g/L, 3 j après fermentation.
- **K3, deux dry hops** : Citra 3 j puis Galaxy 7 j ; Citra 3 j puis Idaho 7 5 j ; 2 g/L chacun.
- **K4, la levure** : US-05, Verdant, Pomona, Diamond, avec un dry hop actif ou après.
- **La bière** : celle du lot 20, une 16D (arôme de houblon « faible et facultatif »), avec Nugget à 60′. Le style dit si Citra en dry hop sort du style : c'est un enseignement, à montrer.

## Les données

- **Vraies valeurs** :
  - `prototypes/houblons-v4/data/pack-fiches.json` : fiches, familles marquées ou citées, α ;
  - `prototypes/houblons-v4/data/composes-houblon.json` : huile, composés, sources ;
  - l'α des lots en stock : `fils15-s5-complexe/donnees/` (cas c1 : `voies[].fiches[].alpha`) ;
  - les sorties du moteur « pouvoir aromatique » : `fils19-choix/donnees/*.json` et `fils20-dryhop/d4/moteur-lot20.json` ;
  - les mesures en bière : `fils20-dryhop/d6` ;
  - les comparaisons publiées de variétés en dry hop, mesurées en bière et goûtées par des panels (« Aussi trouve plus de comparatif entre dryhop et variété de houblons ») : `fils21-choisir/donnees/comparatifs-dryhop.json`, en cours de recherche.
- **Simulé** : `fils21-choisir/donnees/profils-simules.json`, produit par le moteur `profil-simule` (en cours). Contrat :
  - `familles` (les 12 clés) ;
  - `echelle` : celle de `prototypes/houblons-v4/data/style-bands.json`, avec les crans de `src/engine/levels.ts` ;
  - `style` : 16D, zone par famille ;
  - `biere.avant` : le profil par famille, en `{ bas, centre, haut, crans }` ;
  - `cas[]` : pour chaque cas, `{ id, titre, ajouts[] (houblon, dose_gL, moment, jourDebut, jours, levure), apres, delta, parJour[], drapeaux[], confiance, mesures[] }`. `mesures[]` contient les vraies valeurs liées : α, huile, composé et rapport au seuil, chacun avec sa `source` ;
  - `grille[]`, pour le simulateur : `houblon × moment × dose × jours × levure` → profil par famille.

  Tant que le fichier n'existe pas, construis l'écran sur une **maquette de données marquée `"stub": true`**, dans ton dossier. Le pilote te préviendra dès que le vrai fichier sera prêt : branche-le alors et retire le stub.

## Balisage commun

- Chaque vraie valeur affichée porte `data-nature="mesure"` et `data-source="…"`.
- Chaque valeur simulée porte `data-nature="simule"`, avec un signe visible (« ~ », « ≈ », « simulé » ou « estimé »).
- Les houblons portent `data-houblon`, et leurs α `data-role="alpha"` avec `data-source`.
- Les pictos de famille sont des `svg[data-famille]`, au trait.

## Contrôles

`O = work/refonte-frontend/v4/tournoi/outils`, `D = work/refonte-frontend/v4/ecran-1/fils21-choisir`, sur `etat.html` :
1. `node O/controle-commun.mjs D <v> --page=etat.html` → COMMUN OK. Il joue MOTS ≤ 70, COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE et PARLANT. `--sans=x` seulement avec la raison écrite dans la NOTE.
2. `node O/controle-lisible.mjs D <v> --page=etat.html` → LISIBLE OK (D94) :
   - au moins 3 pictos de famille au premier écran ;
   - chaque composé visible porte le picto de sa famille dans sa ligne ;
   - une plage plus large que ×100 ne s'efface pas : elle se voit, avec une bande `data-role="incertitude"` de 120 px au moins, sur une échelle qui rend sa largeur perceptible, et ses bornes (« Si il y a des écart x100 justement il faut que ça se voit pas que ce soit effacé ») ;
   - au moins une vraie valeur `data-nature="mesure"` au premier écran ;
   - le simulé est marqué.
   Témoin : `fils20-dryhop` d1 à d6 y échouent.
3. `node O/controle-alpha.mjs D <v> --page=etat.html` → ALPHA OK.
4. `node O/controle-fiche-baseline.mjs D <v> --page=etat.html` → FICHE-BASELINE OK, si la page nomme un houblon.
5. Les captures, prises avec `node O/capture-page.mjs <page.html> D/captures/<v>-390.png 1688` : la page entière, le premier écran, et chaque état qui compte (curseur bougé, détail ouvert). **Regarde chaque capture toi-même** : une capture non regardée ne valide rien.

## Rendu, par variante

- `<v>/etat.html` et ses états ;
- son générateur ;
- `<v>/NOTE.md`, dans le format de `fils18-baseline/l8e/NOTE.md` : ce qui tient, ce qui casse, contrôles, pire contraste ;
- les captures.

Ta réponse finale est courte : ce qui tient, ce qui casse, les sorties exactes des contrôles, les chemins.
