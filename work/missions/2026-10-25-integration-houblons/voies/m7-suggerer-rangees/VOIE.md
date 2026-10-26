# Voie m7-suggerer-rangees — ce que chaque rangée apporte, et un vrai dry hop, sur sa base M1 + M2 + IA

Agent : concepteur (Opus). C'est ce que le brasseur verra : une page de choix, faite de mini maquettes dans son vrai écran Suggérer.
Rien ne change dans l'app.

## Sa base et ses mots (26.10)
- Base retenue sur la page m6 : **M1 + M2 · avec l'IA**.
  - Capture : `voies/m6-suggerer-moment/img/m1m2-ia.png`.
  - Registre : `work/refonte-frontend/v4/choix/ecrans.json`, entrée suggerer, `complements`.
  - Règle n° 1 : sa base se reprend telle quelle. On ne change que ce qui est visé ci-dessous.
- Ses mots : « M1 + M2 · avec l'IA semble le mieux mais pallier 60' toujours pas très clair et pas de vrai dry hopping ».
- **D165, précisé par lui.** Sur trois lectures proposées, il a répondu « Exactement » à celle-ci : « les rangées, qui donnent l'α
  et les grammes, mais pas ce que chacune apporte ». C'est la seule lecture à traiter : ne change ni la barre ni l'en-tête du palier.
- **D166** : « pas de vrai dry hopping ».

## Les valeurs (aucune inventée) : `voies/g2b-60-et-dryhop/sortie-m7.json` et `RESULTAT.md`
- **Recette** : 21C (Nugget 20 g à 60′, Cascade 80 g en dry hop actif, 20 L), visée « plus d'agrumes », palier +10 IBU.
- **Par rangée, `apporte`** : effets sur les 12 familles, cohumulone, β, huile totale, IBU ajouté et IBU après, grammes et g/L ;
  au dry hop s'ajoutent l'amertume à froid et le mot de la fiche.
- **À 60′** :
  - toutes les rangées apportent +10 IBU, à 0,5 près ;
  - l'arôme restant est négligeable (0,02 cran) ;
  - ce qui distingue les rangées : α, grammes, cohumulone, β, huile.
- **Au dry hop**, trois doses :
  - la règle (1,5 g/L actif, 1 g/L après) ;
  - 4 g/L et 8 g/L, marquées « générique, sans source de style ».
  - L'effet sature : sa pente est divisée par 3,6 entre 4 et 8 g/L.
  - À 4 et 8 g/L, l'amertume à froid est « hors du domaine des essais » : écris-le ainsi, sans valeur.
- **L'ordre des listes est en revue** (D167, voie g2d) : Citra, Nelson Sauvin, Motueka et Mosaic tombent loin. Pour cette passe,
  prends l'ordre k3 de la sortie, et écris sur la page une ligne d'avertissement : « l'ordre des houblons est en cours de revue ».
  La page ne sera publiée qu'après g2d. Si la sortie change, les captures seront refaites.

## Ce qui est demandé : au moins 7 variantes, diverses (L24, M13 en petit)
- **A · sa base** M1 + M2 + IA, telle quelle, en référence.
- **D165, ce que chaque rangée apporte**, en au moins 4 façons différentes. Par exemple :
  - une ligne « apporte » sous le nom : « +10 IBU · cohumulone 25 % · arôme ≈ 0 » ;
  - seulement ce qui distingue les rangées, mis en relief, quand le reste est égal ;
  - de mini barres de familles à la dose, dans la forme des barres de q2b ;
  - un toucher qui ouvre l'apport complet.
- **D166, un vrai dry hop.** Montre :
  - un groupe Dry hop, actif et après, rangés séparément ;
  - un sélecteur ou une ligne de dose (règle, 4 g/L, 8 g/L), avec l'effet et la saturation ;
  - le stock dit à part (« en stock : 60 g »).
- **Au moins une idée à toi.**

Règles :
- « Pas de cockpit » ([[pas-de-cockpit]]) : un mot ou un nombre au premier plan, le détail à un toucher.
- L'ordre du brasseur ([[penser-brasseur]]) : nom, α, rôle, arômes, moment et dose, puis l'IBU.
- Aucun texte sous 14 px, sauf les pictos à 12 px. Aucune phrase de plus de 45 mots.
- La puce IA ne décale rien (B1 d'i2).
- Montre l'état ouvert de ta meilleure variante.

## Méthode
Reprends `voies/m6-suggerer-moment/capturer.mjs` :
- clone dans la page rendue ;
- classes préfixées `m7r-…`, retirées après la capture ;
- l'écran de l'app `?dev-local&etape=houblons` avec `VITE_HOP_V4=on`.

Le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` doit passer.

## Livrable
- `voies/m7-suggerer-rangees/page.html` :
  - en-tête d'une phrase : « Que doit dire chaque rangée, et quel vrai dry hop ? » ;
  - A en référence, puis les vignettes, avec la visionneuse de m6 ;
  - `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m7` doit rendre `PAGE OK`.
- `RESULTAT.md` : les variantes, les captures ouvertes, et ta préférence argumentée comme le brasseur la jugerait.
- Lis `.claude/rules/affinee-frontend.md`, DESIGN.md, `cerveau/brasseur/pas-de-cockpit.md`, et le portrait du critique
  `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède
- `work/missions/2026-10-25-integration-houblons/voies/m7-suggerer-rangees/` seulement.
- Rien dans `src/`. Fichiers de travail dans `os.tmpdir()`.
- N'écris aucun code par heredoc ni par `node -e`.

Retour en une ligne.
