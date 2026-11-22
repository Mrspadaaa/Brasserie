# Voie voie-recherche — La recherche (loupe, ⌘K) : 4 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix), après tri du critique (Opus, jamais Fable)
- Lis d'abord : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire, sources, livrables), `work/missions/2026-11-14-ecrans-transversaux/INVENTAIRE.md`, les captures `work/missions/2026-11-14-ecrans-transversaux/references/*-recherche.png et references/*-bord.png`.
  Charge le skill `boosters-ux`, puis `impeccable` et `ui-design-system` pour ce qui sert. Exigences transversales (L05) :
  densité utile et chrome compact ; même en-tête et même place du + partout (D119, D129, BX-4) ; 390 tactile et 1280 ; clair et cave.

## Objectif
La question : Trouver vite un article, une recette, un brassin, une écriture ou un client, et aller à un écran ou lancer une création, depuis n'importe où, au pouce comme au clavier.
Quatre variantes r1, r2, r3, r4, une idée chacune ; chaleurs : r1 froide, r2 et r3 tiède, r4 chaude (froide = outil sobre affiné, tiède = forme imposée par la question, chaude = forme libre) ; elles règlent les défauts n° 1, 2, 3 d'INVENTAIRE.md
(chacune dit lesquels). Plancher à enrichir (L07) : l'existant est le minimum, pas le modèle.
États à figer : état principal = ouverte sans rien taper (que voit-il avant la frappe ?) ; second état = « cit » tapé, résultats de plusieurs types (Citra T90 en stock, recette IPA Nelson qui l'emploie, écriture Brouwland…) ; un petit cadre « rien trouvé » dans le HTML ; à 1280 la palette au clavier.
Pistes (direction, pas catalogue ; ose au-delà) : feuille plein écran au téléphone avec champ près du pouce ; récents et raccourcis d'écrans ; filtres par type en pastilles avec compteur ; commandes (« Aller à Courses », « Nouvelle recette ») mêlées aux objets ; chaque ligne montre sa valeur utile (stock, statut, montant) ; archives en bascule discrète.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-recherche r1,r2,r3,r4` → SERIE OK.
- Ouvre chaque capture (Read) avant de rendre ; juge-la comme le brasseur (« combien et quels problèmes ? ») et corrige.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless), fichiers dans ta voie.

- Tests : aucun test unitaire (maquettes statiques) ; la sortie du contrôle de série s'écrit dans un fichier : `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-recherche <ids> > work/missions/2026-11-14-ecrans-transversaux/voies/voie-recherche/controle.txt` (pas de --reporter=dot : pas de Vitest ici).
- RESULTAT.md tenu au fil dans ta voie : après chaque variante finie, une ligne (id, fichiers, état) ; une limite de tours ne doit rien perdre.

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-recherche/**` seulement. Rien dans `src/`, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-recherche : SERIE OK, 4 variantes, préférée <v> » ou « voie-recherche ECHEC : <raison> ». LEÇON PROPOSÉE / CONNAISSANCE au besoin dans NOTE.md.
