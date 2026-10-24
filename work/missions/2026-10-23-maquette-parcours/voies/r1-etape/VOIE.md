# Voie r1-etape — l'étape Houblons de la base v4.10 : son rail tel quel, et tous ses états

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 130 tours ; 3 essais par critère
- Dépend de : p19, p20, p21a, p24
- Décideur en cas de doute : pilote ; aucune question bloquante

## Ses mots
« Le rail c'est toujours n'importe quoi. Il y a un vrai historique dessus, pourquoi tu es revenu sur un choix que je n'ai
pas fait ? » (D123) ; « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont
été perdue » (D124) ; sur l'étape de la base v4.10 : « Ça c'est le bon. Comment cette info a été perdu ??? » ; sur le rail
du lot 8 : « Rial: P2 le grossissement suit le doigt. » L'historique entier : `work/refonte-frontend/v4/ecran-1/base/BRIEF-RAIL.md`,
SPEC-BRASSEUR (rail, loupe, glisser, whirlpool, J+), DEFAUTS D27 à D69, D111, D123.

## Sa maquette choisie
Base v4.10, étape Houblons : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`, `cas-ebu45.html`,
`cas-ebu120.html`, `cas-ebu200.html`, `cas-k2.html`, `cas-k3.html`. Joue-les toutes au doigt avant d'écrire.

## 1. Le rail : celui de sa base, tel quel (décision du pilote, option A de p20, règle n° 1)
Inventaire joué : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json` (39 fonctions ; RESULTAT de p20 :
`../p20-inventaire-rail/RESULTAT.md`, captures `work/refonte-frontend/v4/ecran-1/base/captures/rail-inventaire/*-base.png`).
Les 18 perdues sur 5345f6ad sont à rendre : loupe à plateau ×3 qui suit le doigt et passe au segment où il est ; graduations
régulières ; IBU recalculé **au lâcher** seulement, avec l'écart écrit au-dessus du total ; geste interrompu qui rend la
carte ; whirlpool en °C (100 à 60 par 5), ses lâchers et « − 20 min + » ; fermentation et post-fermentation en J+0 à J+14,
« − J+n + », « à froid », « aucun IBU », « biotransformation possible, non quantifiée » ; carte repliée en puce vers le
froid ; d'un seul geste de la durée d'ébullition à J+14 ; « Ébullition 60′ › » et son renvoi ; la page `cas-ebu200`.
Aucun mot de Dryhopper (« dry hop », « ? IBU », « n j ») sur l'étape : Dryhopper est un écran au choix ouvert.
Reprends le comportement de sa base (son code est dans `consolide/index.html` et `work/refonte-frontend/v4/ecran-1/base/generateur/`),
dans la maquette React, avec le moteur en direct.

## 2. Les autres états de l'étape (p21a, `work/refonte-frontend/v4/choix/etats/etape.json`)
- Les repères de ce qui vient de changer : « +2 », « −3 », « −60 », « −51 » au-dessus de l'IBU ; points « avant / après »
  sur les barres du profil ; « floral +1 » sur la carte ajoutée (`dose-plus`, `dose-moins`, `retirer`, `ajout-rapide`).
- Recette sans houblon (`cas-k2`) : emplacement « + » pointillé, jauge IBU à vide, propositions d'amérisant à 60′ (« ou »).
- La carte selon son type : « 80 °C » et « − 20 min + » au whirlpool ; « J+3 », « − J+n + », « aucun IBU », la pastille
  biotransformation et ses puces (géraniol, thiols, hop creep) à froid ; le cas-k3 de sa base (Nugget, Motueka, Cascade au
  whirlpool, Citra cryo à froid), pas un autre jeu.
- Le ♡ de l'ajout rapide à trois choix : aimer · neutre · exclure (`gout-coeur`).
- Le pas de dose de sa base (2 g), avec son repère « +2 » au-dessus de l'IBU.
- Le filtre du champ « Ajouter » (amélioration gardée) cherche dans **tout le catalogue**, pas seulement le stock : « je
  fais une recette puis ensuite j'achète les ingrédients, souvent pas présent » (D21) ; le stock reste un petit badge.
- Le rôle se dit comme sa base (« double usage », pas « mixte »).
- Le survol long à l'ordinateur (1280 px) sur toute la carte, pas seulement le nom (D49, `etat-fiche-survol-1280`).
Voulus et gardés : le fil d'étapes de l'app (D116), le « ? » par groupe (D113), « analyse › » (D121), la croix (D109),
les pictos de famille (D74), le filtre du champ « Ajouter ».

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**` sauf `RadarBiere.tsx` (voie r2)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/gestes.ts` (le survol de la carte)
- les pages de cas de la route `ma-biere` : les lignes de cas de `prototypes/houblons-v4/parcours/vite.config.ts`
  (l. 62 à 67 : ajouter 200 pour `ma-biere` seulement, `cas-k2`, et le cas-k3 de sa base) et la lecture de `data-cas` /
  `data-ebullition` dans `prototypes/houblons-v4/parcours/src/main.tsx` ; les données de cas sous
  `prototypes/houblons-v4/parcours/src/donnees/` si un cas y manque. Ces deux fichiers sont lus par toutes les
  constructions : chaque modification se construit tout de suite (`construire.mjs`), jamais laissée à moitié
- `prototypes/houblons-v4/maquettes/parcours-etape/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r1-etape/RESULTAT.md`
`Base.tsx` (Bandeau) est lu par r2 et r4 : garde son interface ; tout changement de signature va dans RESULTAT.md.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (fonctions et états rendus, captures côte à côte, décisions) ; réponse finale au pilote : une ligne.
