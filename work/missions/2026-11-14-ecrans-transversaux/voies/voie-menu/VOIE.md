# Voie voie-menu — L'en-tête et son menu ⋮ (réglages, compte, historique, thème, période) : 4 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix), après tri du critique (Opus, jamais Fable)
- Lis d'abord : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire, sources, livrables), `work/missions/2026-11-14-ecrans-transversaux/INVENTAIRE.md`, les captures `work/missions/2026-11-14-ecrans-transversaux/references/*-menu.png, references/*-reglages.png, references/*-journal.png et references/*-bord.png`.
  Charge le skill `boosters-ux`, puis `impeccable` et `ui-design-system` pour ce qui sert. Exigences transversales (L05) :
  densité utile et chrome compact ; même en-tête et même place du + partout (D119, D129, BX-4) ; 390 tactile et 1280 ; clair et cave.

## Objectif
La question : Où vivent la période de l'app (Tout l'historique, Ce mois…), le compte (qui saisit : Gaëtan ou Aricia), le thème, les outils (Assistant de brassage, Atelier R&D), l'administration (Journal des modifications, Connexions cloud et IA, Réglages) et la sortie, sans alourdir l'en-tête de chaque écran.
Quatre variantes m1, m2, m3, m4, une idée chacune ; chaleurs : m1 froide, m2 tiède, m3 et m4 chaude (froide = outil sobre affiné, tiède = forme imposée par la question, chaude = forme libre) ; elles règlent les défauts n° 4, 5, 6, 7, 8, 9 d'INVENTAIRE.md
(chacune dit lesquels). Plancher à enrichir (L07) : l'existant est le minimum, pas le modèle.
États à figer : état principal = en-tête au repos + menu (ou son remplaçant) ouvert ; second état = une destination ouverte, au choix Réglages resserré ou Journal des modifications (l'historique : qui a fait quoi, filtres) ; 1280 = en-tête et menu à l'ordinateur.
Pistes (direction, pas catalogue ; ose au-delà) : menu groupé par nature avec en-tête de compte ; période en segment ou pastille dans l'en-tête aux deux formats ; bascule d'auteur claire (« Je saisis : Gaëtan | Aricia ») ; thème en segment Clair · Cave dans le menu ; page « Plus » plein écran à sections ; feuille du bas en grille d'icônes ; avatar de compte.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-menu m1,m2,m3,m4` → SERIE OK.
- Ouvre chaque capture (Read) avant de rendre ; juge-la comme le brasseur (« combien et quels problèmes ? ») et corrige.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless), fichiers dans ta voie.

- Tests : aucun test unitaire (maquettes statiques) ; la sortie du contrôle de série s'écrit dans un fichier : `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-menu <ids> > work/missions/2026-11-14-ecrans-transversaux/voies/voie-menu/controle.txt` (pas de --reporter=dot : pas de Vitest ici).
- RESULTAT.md tenu au fil dans ta voie : après chaque variante finie, une ligne (id, fichiers, état) ; une limite de tours ne doit rien perdre.

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-menu/**` seulement. Rien dans `src/`, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-menu : SERIE OK, 4 variantes, préférée <v> » ou « voie-menu ECHEC : <raison> ». LEÇON PROPOSÉE / CONNAISSANCE au besoin dans NOTE.md.
