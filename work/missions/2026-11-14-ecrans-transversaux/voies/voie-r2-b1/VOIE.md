# Voie voie-r2-b1 — seconde reprise du + : toujours flottant, le commun toujours là, l'écran en avant (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur ; Fable interdit (10.11)
- Lis : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire) ; la base **b1r** (`voies/voie-r-b1/b1r.html`, captures,
  NOTE avec le menu de chaque écran) et **b1** telle quelle (`voies/voie-barre/b1*.png`) ; `voies/voie-critique/REPRISES.md` section b1r ;
  actions qui existent : `src/domain/fabActions.ts` (lecture seule). Charge `boosters-ux`. Exigences transversales (L05) : sa maquette choisie
  reprise telle quelle hors ce qu'il demande (règle n° 1) ; densité utile ; aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ;
  données communes (brassin 20 L, 58 bouteilles de 33 cl ou 1 fût de 20 L, Citra T90 α 12,8 % 1,2 kg).

## Ses mots (15.11)
Sur b1r : « Non mais certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit
toujours être flottant.... ». Avant : « b1 -> le + doit être dynamique en fonction de l'écran ou on est ».

## Objectif
Deux règles : (1) **le + est toujours flottant**, aux deux largeurs (au 1280 aussi, jamais logé dans le rail ou la barre) ; (2) **le menu garde
toujours les actions communes** (Nouvelle écriture / facture, Encaisser une vente, Créer une recette, Lancer un brassin, Compagnon) **et met en
avant, en tête, celles de l'écran courant**. Trois variantes `b1s-a` (froide), `b1s-b` (tiède), `b1s-c` (chaude) : trois façons de mettre l'écran en
avant sans perdre le commun. Chacune avec la planche des 12 écrans.

## Livrables
Pour chaque `<v>` : `<v>.html`, captures regardées `<v>-a-390.png` (Brassins au repos), `<v>-b-390.png` (+ ouvert sur Brassins),
`<v>-cave-390.png`, `<v>-1280.png` (+ flottant à l'ordinateur, ouvert), `<v>-vues-390.png` (le + ouvert sur les 12 écrans). `NOTE.md` : une ligne
par variante (`<v> · nom · chaleur · ce qui change de b1r`), puis le menu de chaque écran pour le port.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-r2-b1 b1s-a,b1s-b,b1s-c --vues > work/missions/2026-11-14-ecrans-transversaux/voies/voie-r2-b1/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil (une ligne par variante ; une limite de tours ne doit rien perdre). Sous 130 k de contexte.
- Ouvre chaque capture ; « combien et quels problèmes ? » ; corrige. Captures : puppeteer-core
  (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-r2-b1/**` seulement. Rien dans `src/`, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-r2-b1 : SERIE OK, 3 variantes, préférée <v> » ou « voie-r2-b1 ECHEC : <raison> ».
