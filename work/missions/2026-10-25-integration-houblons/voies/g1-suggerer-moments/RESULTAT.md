OK — Suggérer : 60′ jamais proposé en ajout, dry hop = groupe alphabétique d'ex æquo ; plan a/b/c chiffré, rien dans src/

## Fichiers écrits
- `scripts/eval-hop/suggerer-moments.ts` (parties A à D : recettes, effet par variété, banc e1 rejoué, inventaire) et `scripts/eval-hop/suggerer-60.ts` (amertume à 60′). Nouveaux fichiers seulement.
- Dans la voie : `rapport.md` (diagnostic chiffré et plan), `suggerer-moments.json`, `suggerer-60.json`. Pas de GATES.md : critères pris dans VOIE.md.
- Rien dans `src/` (aucun fichier de la voie hors `scripts/eval-hop/` et du dossier de la voie).

## Critères
- `rapport.md` présent : chiffres (§ 1), exemples, plan a/b/c avec coûts (§ 2).
- Déterminisme : deux passes de chaque script, sha256 identiques. `suggerer-moments.json` `c8e19c6c1fe5302ee740887c33b5795cb7a698f07c7a9385fa731f7bf6d5cbf0` (140 s) ; `suggerer-60.json` `b8b8252cbc7a4ca475c0661544a2c3fe3a3cbcc93af827dd505a9b0778e80354` (50 s).
- `npx vitest run tests/unit/hopIndexV4` : 60 fichiers, 540 tests verts, exit 0.
- Essais : 0 échec de critère.

## Chiffres décisifs (21C Hazy du jeudi du test a2 et stout 16D de e1 ; détails au rapport)
- **Moment = en dur** : `proposeVoies` prend `['b10','wp','dryActive','dryPost']` ; l'adaptateur ne le surcharge jamais. **Aucun ajout à 60′** ; le seul 60′ est modifier un ajout déjà à 60′ (remplacer à IBU égal, diminuer, retirer). Sur la 21C « plus d'agrumes » : 14 voies à l'écran, 0 au dry hop ; le dry hop n'arrive que par le levier levure, **une seule voie** (l'écran en prévoit 4).
- **« Plus d'amertume » / amérisant pour une IBU visée : impossible.** `Direction` ne porte que des familles ; direction vide = 0 voie (21C 37 voies examinées, stout 20 : 0 retenue).
- **L'effet d'une famille citée est le même pour toutes les variétés qui la citent** (233 pour l'agrume, 123, 154, 134) à chaque moment. À 60′ : +1,6 pt à 1 g/L (10′ : +34,5 à 2 g/L ; dry hop +55,6 à 4 g/L). À 60′ le classement d'« agrumes » est donc un classement par dérive d'IBU (Monroe, Medusa… 40 g).
- **Dry hop, 21C « plus d'agrumes »** : 93 ajouts, 4 groupes, **premier groupe de 23 houblons rangés par ordre alphabétique** (African Queen, Belma, Galaxy, Herald, Huell Melon…) ; stout : 22 groupes, premier de 8.
- **Banc e1 de Suggérer rejoué** (66 houblons) : groupes d'ex æquo médians 1 → 5, premier groupe médian 102 → 53 : **le groupe d'ex æquo est toujours là** ; X dans les 10 : 4 sur 66 (e1 : 11 sur 67) ; rappel@10 des substituts Beer Maverick 1,1 % (e1 : 0,9 %). À 60′ : 19,5 %, **artefact** (l'ordre vient de l'α par la dérive d'IBU, et la référence récompense l'α).
- « Remplacer à IBU égal » ne lit pas l'usage : Monroe (2,7 % d'α, arôme) 96 g, Aurum 130 g, Galaxy 35 g à 60′ passent devant des amérisants ; stout « agrumes » : 47 remplacements sur 159 à plus de 5 g/L.
- Pour +10 IBU à 60′ : 4,5 g (Polaris 20,5 %) à 77,6 g (Teamaker 1,2 %) ; α et usage connus pour 318 variétés, β 311, cohumulone 287. Le moteur « pouvoir » n'a que 8 clés : inutilisable pour départager 318 houblons.
- Clé candidate (marqué → premier descripteur → part des fiches → huile totale) : 179 valeurs distinctes sur 233 pour l'agrume (aujourd'hui 1), mais **l'huile totale seule est un mauvais proxy** (Altus en tête de l'agrume et du résineux) ; une intensité utile se lit par famille.

## Doutes et limites
- « Sa recette type » : mon choix, la 21C du test a2 (Nugget 60′, Cascade 80 g dry hop actif) et la stout de e1. Chiffres d'écran avec le stock des fixtures ; mesures de § 1.2 et 1.3 sans stock (318 variétés).
- Le banc Beer Maverick ne juge pas Suggérer : il récompense l'α ; il manque un critère propre (rapport § 2, a3).
- Coûts en tours : estimations d'après e2, ia1, t4, non chronométrées. Je n'ai pas ouvert l'écran dans Chrome : voie de diagnostic sans changement de rendu.

## DÉCISION À PRENDRE : dans quel ordre et sous quelle forme faire (a) le moteur, (b) l'écran, (c) l'IA ?
Détail et coûts au rapport § 2. Ma recommandation : a1 → (a2 + b) → c.
- **(a1) Départager au dry hop et à chaud** : une clé de rang de plus, après la distance (les barres de q2b ne changent pas) ; clé candidate marqué/premier descripteur/part/signal par famille (linalol, géraniol, myrcène, thiols), inconnu après le connu. ~1 voie Sonnet 60 à 80 tours + 30 tours de mesure et page de 10 listes à lui montrer. Décideur : conseil (convention du moteur), brasseur (listes). Écarté par défaut : mettre à l'échelle l'effet par variété (change les barres, `pouvoir.ts` interdit une intensité 0–100).
- **(a2) Jeu à 60′** : un objectif d'IBU, `b60` dans les moments, dose par `gramsForIbu`, rang : conflit, bande d'IBU, usage (amérisant avant arôme), α, cohumulone, β ; corriger « remplacer à IBU égal » qui propose des houblons d'arôme. ~1 voie Sonnet 80 à 100 tours (touche `src/domain`). **Ce qui rend une amertume « meilleure » (cohumulone, β) n'est pas établi dans le dépôt : le brasseur ou le conseil le fixent, avec sources.**
- **(b) Écran** : q2b ne permet pas de choisir 60′ ou dry hop (étiquette de groupe en Barres ; décalage à chaud en Radar seulement, dix touchers de 10′ à 60′, rien au dry hop). À lui montrer en mini maquettes sur la capture de q2b : M1 groupe « Amérisant · 60′ » à côté de « Dry hop · actif » ; M2 quatrième carte « Plus d'amertume +n IBU » ; M3 puces « Quand ? ». Recommandation : M1 + M2. Concepteur Opus 1 voie (40 à 60 tours), critique Fable, port Sonnet 1 voie. Décideur : le brasseur (écran choisi, règle n° 1).
- **(c) IA** : `hopReclasserIA` d'i2 avec un mode « suggestion » (recette, visée, moment, 20 premiers du moteur → ordre des 10 et une phrase), après i2 et a1 (sinon elle voit 20 houblons alphabétiques). Essai réel ≤ 30 appels lite (~0,1 CHF), nouvelle enveloppe. ~1 voie Sonnet 40 à 60 tours. **L'accord D80 vise Substituer ; Suggérer est un nouvel usage facturé : à confirmer par lui** (ses mots du 26.10 vont dans ce sens). La puce « classé par l'IA » sur q2b se montre aussi en mini maquette.

CONNAISSANCE : dans proposeVoies, l'effet d'une famille citée ne dépend que du moment et de la dose, jamais de la variété (mesuré sur 233 houblons pour l'agrume, une seule valeur par moment) ; Suggérer range donc les houblons par le nombre de familles qu'ils citent, puis par la dérive d'IBU, puis par ordre alphabétique ; il ne propose aucun ajout à 60′ et aucune visée d'IBU. Note à créer par le pilote dans cerveau/metier (sources : `rapport.md` de g1, `suggerer-moments.json`).

LEÇON PROPOSÉE : un banc de référence externe (Beer Maverick) peut récompenser un artefact de l'ordre (l'α à 60′ : rappel@10 de 1 % à 19,5 % sans que le classement soit meilleur) ; avant de créditer un gain, vérifier sur quelle clé l'ordre se fait (rôles : auteur, relecteur).
