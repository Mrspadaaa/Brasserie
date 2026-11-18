# Voie voie-r-b1 — reprise de b1 (son choix) : le + dynamique selon l'écran (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur ; Fable interdit (10.11)
- Lis : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire) ; sa base **b1** telle quelle :
  `voies/voie-barre/b1.html` et ses captures, la ligne b1 de `voies/voie-barre/NOTE.md`, la section b1 de `voies/voie-critique/RESULTAT.md`
  (« sera B-032 » faux, brassin deux fois) ; la planche par écran déjà faite pour b3 (`voies/voie-p2-b3/b3p2-ecrans-390.png`, modèle de
  planche seulement) ; les données communes vérifiées (`voies/voie-p2-b3/NOTE.md` : brassin 20 L, 58 bouteilles de 33 cl ou 1 fût de 20 L,
  Citra T90 α 12,8 % 1,2 kg, vente Marché d'automne 640,00 CHF). Les actions de chaque écran aujourd'hui : `src/domain/fabActions.ts`,
  `src/components/QuickActionModal.tsx` (lecture seule). Charge `boosters-ux`. Exigences transversales (L05) : sa maquette choisie est la
  base, reprise telle quelle (règle n° 1, L03) ; même place du + partout (BX-4) ; densité utile ; aucun menu déroulant au téléphone (D350) ;
  390 tactile et 1280 (le rail de b1) ; clair et cave.

## Ses mots (15.11)
« Le + à ordre figé / b1 -> le + doit être dynamique en fonction de l'écran ou on est »
Et avant (09.11, BX-4) : « sur plein d'écran il est pas au bon endroit. Différents, donne pas les bonnes actions ect... ».

## Objectif
b1 reste b1 (sa feuille, son rail au 1280, ses lettres de raccourci, le toast rangé, « Hors connexion » dans l'entrée Compagnon) ; seul
le contenu du + change : **le menu entier dépend de l'écran** (ses actions à lui d'abord, puis seulement ce qui sert depuis là), plus
l'ordre figé identique partout. Une variante `b1r`. Planche obligatoire `b1r-ecrans-390.png` : le + ouvert sur chacun des 12 écrans
(Bord, Finances, Brassins, Recettes, Atelier, Volumes, Stock, Courses, Fûts, Matériel, Houblons, Clients), chaque menu juste pour son
écran, un seul + à l'écran (Atelier a aujourd'hui son propre + dans l'écran). Corrige aussi les problèmes du critique sur b1.

## Livrables
`b1r.html`, captures regardées `b1r-a-390.png` (Brassins au repos, écran rempli), `b1r-b-390.png` (+ ouvert sur Brassins),
`b1r-cave-390.png`, `b1r-1280.png`, `b1r-vues-390.png` (= la planche des 12 écrans ; copie-la aussi en `b1r-ecrans-390.png`).
`NOTE.md` : une ligne `b1r · nom · chaleur · ce qui change de b1`, puis, par écran, la liste de son menu (pour le port).

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-r-b1 b1r --vues > work/missions/2026-11-14-ecrans-transversaux/voies/voie-r-b1/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Sous 130 k de contexte.
- Ouvre chaque capture ; « combien et quels problèmes ? » ; corrige. Captures : puppeteer-core
  (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-r-b1/**` seulement. Rien dans `src/`, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-r-b1 : SERIE OK, b1r livrée » ou « voie-r-b1 ECHEC : <raison> ».
