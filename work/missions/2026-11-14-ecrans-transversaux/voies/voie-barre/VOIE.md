# Voie voie-barre — La barre du bas et le bouton + (et son menu) : 4 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix), après tri du critique (Opus, jamais Fable)
- Lis d'abord : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire, sources, livrables), `work/missions/2026-11-14-ecrans-transversaux/INVENTAIRE.md`, les captures `work/missions/2026-11-14-ecrans-transversaux/references/*-plus.png et references/*-bord.png`.
  Charge le skill `boosters-ux`, puis `impeccable` et `ui-design-system` pour ce qui sert. Exigences transversales (L05) :
  densité utile et chrome compact ; même en-tête et même place du + partout (D119, D129, BX-4) ; 390 tactile et 1280 ; clair et cave.

## Objectif
La question : Passer d'une rubrique à l'autre (Bord, Finances, Brassins, Stocks, Clients) et créer vite (Nouvelle écriture / facture, Encaisser une vente, Créer une recette, Lancer un brassin, l'action de l'écran), au pouce à 390 et à la souris à 1280.
Quatre variantes b1, b2, b3, b4, une idée chacune ; chaleurs : b1 froide, b2 tiède, b3 et b4 chaude (froide = outil sobre affiné, tiède = forme imposée par la question, chaude = forme libre) ; elles règlent les défauts n° 10, 11, 12, 13 d'INVENTAIRE.md
(chacune dit lesquels). Plancher à enrichir (L07) : l'existant est le minimum, pas le modèle.
États à figer : état principal = barre au repos sur un écran (Brassins actif) ; second état = le + ouvert (ses actions, l'action de l'écran à sa place) ; 1280 = la navigation d'ordinateur et la place du + ; montrer où va la pastille « Compagnon hors connexion ».
Brief minimal (contrepoids du lot 21) : aucune piste ; pars de la question, du geste au pouce et à la souris, et ose.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-barre b1,b2,b3,b4` → SERIE OK.
- Ouvre chaque capture (Read) avant de rendre ; juge-la comme le brasseur (« combien et quels problèmes ? ») et corrige.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless), fichiers dans ta voie.

- Tests : aucun test unitaire (maquettes statiques) ; la sortie du contrôle de série s'écrit dans un fichier : `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-barre <ids> > work/missions/2026-11-14-ecrans-transversaux/voies/voie-barre/controle.txt` (pas de --reporter=dot : pas de Vitest ici).
- RESULTAT.md tenu au fil dans ta voie : après chaque variante finie, une ligne (id, fichiers, état) ; une limite de tours ne doit rien perdre.

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-barre/**` seulement. Rien dans `src/`, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-barre : SERIE OK, 4 variantes, préférée <v> » ou « voie-barre ECHEC : <raison> ». LEÇON PROPOSÉE / CONNAISSANCE au besoin dans NOTE.md.
