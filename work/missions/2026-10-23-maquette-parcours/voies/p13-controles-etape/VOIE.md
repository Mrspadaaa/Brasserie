# Voie p13-controles-etape — les contrôles D111, D112, D113 de l'étape Houblons

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (trois contrôles, leurs témoins)
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Trois commentaires du brasseur sur l'étape Houblons de la maquette publiée (23.10, soir), mot pour mot (SPEC-BRASSEUR
§ 1 ; DEFAUTS-RECURRENTS, lignes D111 à D113, à lire en entier) :
- D111, sur la carte de Nugget : « Le slider est pas dans la version que je veux... ». Pendant le glisser, sa base v4.10
  replie la carte en puce « Nugget » près de la bulle et ouvre la frise autour du doigt, graduations lisibles ; la
  maquette garde la carte entière et serre les graduations par-dessus 0′, whirlpool et levure, texte de la bulle
  sélectionné.
- D112, même fil : « L'appui prolonger fait pas l'effet escompté ». L'appui long ouvre bien la fiche g1, mais sans
  aucun retour pendant l'appui (la base remplit le nom en 500 ms), et le texte de la carte reste sélectionnable (menu du
  système sur iPhone).
- D113, sur la carte de Nugget : « J'aime bien les petits icône et tout. Mais il manque à un endroit un bouton
  légende ». Le seul « ? » de l'étape est au-dessus des familles ; rien près de la carte de l'ajout.

Leçon L13 : chaque contrôle s'écrit avant la correction, échoue sur la version rejetée et passe sur sa base quand elle
est la référence. La correction viendra ensuite (voie p1, reprise).

## Les contrôles
Page : `<dossier>/ma-biere/etat.html` (l'étape Houblons), 390 × 844 tactile ; la base v4.10 :
`work/refonte-frontend/v4/ecran-1/base/consolide/index.html` (son choix, la référence du geste et de l'appui).
1. **`controle-geste-etape.mjs` (D111, neuf)** : Nugget glissé de 60′ à 35′ (doigt tenu, mouvements tactiles réels,
   comme `controle-rail.mjs`). Pendant le geste, mesuré à mi-course et près de la fin :
   - aucune étiquette (graduation, repère de la frise : 0′, whirlpool, levure, fermentation…) n'en chevauche une autre
     (boîtes de texte visibles, recouvrement > 2 px) ;
   - la carte tenue se replie à la hauteur d'une puce (48 px au plus) qui garde le nom du houblon ;
   - rien n'est sélectionné (`getSelection().toString()` vide) ;
   - `controle-rail.mjs` reste OK (le rejouer, ne pas le modifier).
   Sortie : `GESTE-ETAPE OK` / `GESTE-ETAPE ECHEC` et les lignes `- D111 …`.
2. **`controle-appui.mjs`, critère A9 (D112)** : ce contrôle existe et est appelé par d'autres GATES (M15 : avant de
   rendre, `node scripts/agents/systeme.mjs appels controle-appui.mjs --rejouer` doit rester vert, sauf les appels sur
   des pages que A9 doit faire échouer, à nommer). Ajouter un mode qui joue l'étape Houblons : appui long sur la carte
   de Nugget ; pendant l'appui, un retour visible avant 300 ms (un changement de rendu de la carte ou de son nom), puis
   la fiche ; la carte n'est pas sélectionnable (`user-select` et `-webkit-touch-callout` calculés à `none` sur la carte
   et son texte). Si ajouter A9 au script existant le rend trop lourd, écrire `controle-appui-etape.mjs` et le dire.
   Sortie : la ligne A9 et le verdict du script.
3. **`controle-legende.mjs` étendu, ou neuf (D113)** : chaque groupe d'icônes de l'étape (la carte de l'ajout, les
   ajouts rapides, les familles) a un « ? » à un geste et à portée de vue (même écran, une hauteur d'écran au plus du
   groupe), qui nomme chacune de ses icônes ; les icônes restent. Même règle M15 que pour l'appui si le script existant
   est étendu. Sortie : `LEGENDE OK` / `LEGENDE ECHEC` et les lignes `- D113 …`.

## Entrées
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D111 à D113) ; `work/refonte-frontend/v4/SPEC-BRASSEUR.md` § 1.
- Les contrôles existants : `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs` (le glisser joué),
  `controle-appui.mjs`, `controle-legende.mjs`, `controle-teinte.mjs` (en-tête et Chrome). Chrome :
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json` de la racine.
- La version rejetée, construction d332792c (celle publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/`.
- Sa base : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html` ; captures
  `work/refonte-frontend/v4/ecran-1/base/captures/consolide-glisser-60-2-pendant.png`, `consolide-b-fiche-appui-390.png`.
- Le code de l'étape dans la maquette : `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` (lecture seule).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/controle-appui.mjs` (ajout de A9) ou `controle-appui-etape.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/controle-legende.mjs` (extension) ou `controle-legende-etape.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/temoins/geste-etape-*/**`, `…/temoins/appui-etape-*/**`,
  `…/temoins/legende-etape-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : les lignes D111, D112, D113 seulement. D'autres voies
  écrivent en même temps : relire le fichier juste avant, écrire en une commande, n'écraser rien.
- `work/missions/2026-10-23-maquette-parcours/voies/p13-controles-etape/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Chaque contrôle : en-tête avec ses mots, la règle, l'usage, les témoins ; sortie en une ligne de verdict finale.
2. Témoins : la base v4.10 → OK pour D111 et D112 (elle est sa référence) ; la construction d332792c → ECHEC pour les
   trois ; une petite page statique négative par contrôle (`geste-etape-chevauche`, `appui-etape-muet`,
   `legende-etape-loin`) → ECHEC. Pour D113, si la base n'a pas non plus de « ? » près de la carte (D113 le dit : un
   manque de la base aussi), un témoin positif statique `legende-etape-ok` à la place.
3. Les lignes D111, D112, D113 dans `portee-defauts.json` (portée `["ma-biere"]`, `tourne` `oui`, verdict `garde`).
4. `node scripts/agents/systeme.mjs temoins` (TEMOINS OK) ; `node scripts/agents/systeme.mjs appels <script modifié>
   --rejouer` pour chaque script existant modifié.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa base v4.10 est la référence du geste et de l'appui. Le contrôle garde ses mots ; la forme est au
  concepteur. L26 ; M10 ; M15 (rejouer les appels d'un contrôle durci).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Si tu choisis un
script neuf au lieu d'étendre (appui, légende), un critère qui nomme l'ancien script ne tiendra pas : dis-le dans
RESULTAT.md, le pilote réécrit le critère.

## Rendre
`RESULTAT.md` : par contrôle, ce qui est fait, ses sorties sur la base, sur d332792c et sur ses témoins ; les appels
rejoués ; `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
