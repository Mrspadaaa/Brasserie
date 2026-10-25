ECHEC — critère « dans l'app » : la couche Ma bière de l'app est provisoire, sans radar à montrer ; le reste est vert

Le radar commun vit maintenant dans l'app, et Ma bière l'utilise dans la maquette. Tous les autres critères sont verts.
Le critère de l'app ne peut pas tenir tel qu'il est écrit : `?dev-local&etape=houblons` → « Ouvrir l'analyse de ma bière »
ouvre `HopToolLayer` (« Écran provisoire : l'outil v4 viendra ici »). L'app n'affiche aucun radar de Ma bière, ni avant
ni après cette voie : `RadarBiere` n'était importé que par la maquette. Le composant de l'app est bien le nouveau (il est
compilé par `npm run build`), mais rien dans l'app ne le monte encore.

## Fichiers
- `src/ui/hopIndex/commun/RadarBase.tsx`, `radar-base.css` : déplacés de la maquette par `git mv` (renommage **indexé**,
  rien n'est commité). Les imports deviennent relatifs (plus de `@app`). Trois options ajoutées, sans effet sur les 8 vues :
  - `echelleCommune` : au style, des anneaux communs nommés au lieu du maximum par axe. Une note en mots ne se normalise
    pas (D68).
  - `enPlace` : un inconnu de toutes les séries garde sa place : secteur hachuré pâli, picto pâli avec « ? », aucun point.
  - `seuilHors` : le seuil de l'orangé, 0,05 comme la grille.
  - S'y ajoutent `data-echelle-axe`, et un rayon du zéro au point quand une seule valeur est connue.
- `prototypes/houblons-v4/parcours/src/commun/RadarBase.ts` : réexporte `@app/ui/hopIndex/commun/RadarBase`. Comparer, la
  fiche, Suggérer et Substituer restent intacts.
- `src/ui/hopIndex/maBiere/RadarBiere.tsx` : construit sur `RadarBase` : ma dégustation en bleu `#0072B2`, la zone du
  style, les familles attendues cernées, l'échelle « pas senti · faible · moyen · marqué ». La bulle s'ouvre au toucher d'un
  secteur, `data-etat` reste sur le secteur de Résineux, et `auDessus`, `NIVEAUX_DEGUSTATION` et `Note` sont gardés.
  **Pas goûté : aucun point** (m4 posait une marque creuse au centre).
- `prototypes/houblons-v4/parcours/src/ecrans/biere/index.tsx` : seulement la légende « ? » du radar (« Zone verte »,
  « Cerné », « Hachuré, « ? » »).
- `biere/jeu.mjs` : les cibles et les vérifications suivent le radar commun (`[data-sommet]`, `circle[data-point]`,
  `[data-inconnu]`).
- `work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs` : ajoute la vue `biere · radar`. B4 accepte au style
  une échelle commune, avec une étiquette par anneau.
- `tests/unit/hopIndexV4/radarBiere.test.tsx` : 5 tests : baseline, **aucun point sur une famille pas goûtée**, rien de
  goûté, orangé et bulle, garde de structure.

## Critères (sorties décisives)
- `npx vitest run tests/unit/hopIndexV4` → `Test Files 10 passed (10) · Tests 127 passed (127)`.
- `npm run build` → `✓ built in 21.39s`, code 0. `verifier-types.mjs` (maquette) → `TYPES OK`.
- `controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours` → `RADAR-BASE OK (9 vues)`. La nouvelle ligne :
  `tenu biere · radar : biere base style · 1 points, 0 remplis, sans donnée 11, « ? » 0, anneaux pas senti faible moyen
  marqué`. Les 8 vues gardent les mêmes comptes qu'avant.
  - Témoin, sur la maquette d'avant : `ECHEC biere · radar … B1 data-radar="" : pas le radar commun` → `RADAR-BASE ECHEC (1)`.
- `controle-etats.mjs … --ecran=biere` → `ETATS OK (15/15) ; 2 voulu(s) non rejoué(s)`.
- `jouer-parcours.mjs --etape=biere` → `ETAPE OK (biere)`. `controle-visee.mjs` → `VISEE OK (6/6, tropical)`.
- `controle-choix.mjs` → `CHOIX ECHEC`, à cause de **comparer** (`controle-mots-tous.mjs : Usage…`), qui relève de la voie
  rc-registres-comparer. Ma bière compte parmi les 6 écrans conformes.
- App (`with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`, 390 × 844) : l'étape relevée est
  `{"ecran":"ma-biere","radars":""}`. Après le pont, `{"couche":"hopBeer","texte":"Écran provisoire : l'outil v4 viendra ici…"}`.
  Captures ouvertes.

## Captures (ouvertes)
Dans `work/missions/2026-10-25-integration-houblons/voies/rb2-ma-biere/captures/` :
- `biere-radar-390.png` : la dégustation de départ, Résineux marqué seul.
- `biere-radar-bulle-390.png` : « Résineux : marqué, au-dessus du style ».
- `biere-radar-note-390.png` : 7 familles notées, Agrumes « pas senti » sur l'anneau du zéro, bulle « Noyau : pas goûté,
  inconnu (ce n'est pas zéro) ».
- `biere-radar-*-1280.png` : les mêmes vues sur ordinateur.
- `app-etape-houblons-390.png` et `app-ma-biere-390.png` : la couche provisoire.

Sa capture choisie, pour la comparaison : `work/refonte-frontend/v4/choix/etats/captures/etat-biere-radar-choisie.png`.

Ce que j'ai vu en comparant :
- La zone passe du gris au vert pâle, et les libellés deviennent des pictos (grammaire de la baseline).
- Les 11 secteurs pas goûtés sont hachurés plus légèrement qu'avec la hachure pleine de la baseline, qui criait sur 11 axes.
- Les mots d'échelle passent au-dessus des séries, avec un halo.
- La bulle de Résineux couvre le « ? » de la légende tant qu'elle est ouverte.

## Prédiction
« Le radar est le même partout, c'est bien ; mais sans les noms autour, et avec 11 familles hachurées, il faut que je goûte
plus pour que ça dise quelque chose. »

DÉCISION À PRENDRE : monter l'onglet Ma bière (route biere de la maquette) dans `HopToolLayer` (T12), pour que son radar
soit dans l'app. C'est hors de cette voie : `HopToolLayer.tsx` n'est pas possédé. Autre décision : le radar de Ma bière
reste au style même si « Absolu » a été pris dans la vue Barres. Sa base dessine le même radar et replie la bascule en vue
Radar. D68 est tenu, car l'échelle est commune et jamais normalisée.

À signaler :
- Un fichier vide `-` est apparu à la racine à 19:14, pendant `npm run build` (je n'ai pas vérifié s'il en vient). Je ne
  l'ai pas supprimé.
- La maquette construite contient les changements de Comparer en cours de la voie rc.

CONNAISSANCE : `RadarBase` vit dans `src/ui/hopIndex/commun/` ; la maquette le réexporte. Pour une note en mots (dégustation),
`echelleCommune` + `enPlace` : jamais de normalisation par axe, l'inconnu reste en place sans point.
LEÇON PROPOSÉE : avant d'écrire un critère « dans l'app, l'écran X montre Y », vérifier que l'app monte X (ici `HopToolLayer`
est provisoire) ; sinon le critère est intenable dès le départ.
