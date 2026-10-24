# Maquette houblons · 24.10 (version D107 à D121), figée

La version qui suit la maquette du 23.10 (construction d332792c, `../2026-10-23-maquette/`), que le brasseur a appelée
« un vrai bon point de départ ». Elle reprend ses quinze commentaires sur cette version, D107 à D121 (SPEC-BRASSEUR § 1,
DEFAUTS-RECURRENTS), chacun gardé par un contrôle qui échouait sur d332792c.

- **Artefact** : https://claude.ai/artifact/2BktuZzij8q2DAsrxQS5iX (version 1792800388-4826, publiée le 24.10, celle de ce
  dossier : `publie.html` est la page servie, les assets sont ceux de la construction de 5345f6ad, tailles vérifiées).
- **Source** : `prototypes/houblons-v4/parcours/`, commit 5345f6ad ; mission
  `work/missions/2026-10-23-maquette-parcours/` (voies p1 à p3, p9 à p18).
- **Page côte à côte** (sa base | la maquette, 12 états, 390 px) : `../2026-10-24-cote-a-cote/index.html`.
- **État** : `cerveau/produit/maquette-jouable.md`.

## Ce qui change depuis le 23.10

| Défaut | Ses mots (début) | Ce qui est fait |
|---|---|---|
| D107 | « je voulais comparé au moins : les étapes 60' 10' dryhopping » | Comparer aux étapes 60′, 10′, dry hop, à la manière de x3b, Nugget en référence |
| D108 | « aucun impact sur je met plus, moins bannir » | la visée de sa base sur la piste : losange, pointillé, paliers, ×, nom barré |
| D109 | « Juste une croix bien positionné » | une croix de 44 px à l'encre, à la même place sur chaque outil |
| D110 | « dur à comprendre ce système de petit bar » | toucher un picto dit sa famille et sa valeur, près de lui |
| D111 | « Le slider est pas dans la version que je veux » | le geste de sa base : carte en puce, graduations lisibles |
| D112 | « L'appui prolonger fait pas l'effet escompté » | le nom se remplit pendant l'appui ; carte non sélectionnable |
| D113 | « il manque à un endroit un bouton légende » | un « ? » près de chaque groupe d'icônes |
| D114 | « Beaucoup trop mis en avant » | le panel OSU replié au repos |
| D115 | « Mettre le radargraph avant » | le radar avant la liste dans la fiche |
| D116 | « le vrai Stepper de la vrai app » | le fil d'étapes de l'app en tête de l'étape |
| D117 | « cette vue suggestions et pas la bonne » | Suggérer refait sur sa base v4.10 et q2b |
| D118 | « Je veux juste retour au "menu" » | la croix ramène toujours à l'étape Houblons |
| D119 | « Header qui change ??? » | le même en-tête sur Ma bière, Suggestions, Comparer |
| D120 | « Pas de bouton cancer » | Annuler à côté de l'action sur Substituer, Levure, Dryhopper |
| D121 | « Seul bouton qui ouvre vraiment l'analyse » | le bloc du profil entier ouvre l'analyse (variante A ; B et C sur la planche) |

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | l'enveloppe publiée (`Artifact`, `file_path`) |
| `publie.html` | la page telle que l'artefact la sert : à ouvrir en local |
| `assets/parcours.js`, `assets/style.css` | la construction de 5345f6ad (1 560 233 et 105 511 octets) |

## L'ouvrir

Ouvrir `publie.html` dans Chrome, en `file://`. Vérifié le 24.10 : mode standard, aucune erreur, départ sur l'étape
Houblons (`#/ma-biere`), crochet `window.__parcours` posé, « + floral » mène à Suggérer.

## La reconstruire et la vérifier

```
node prototypes/houblons-v4/parcours/outils/construire.mjs
node prototypes/houblons-v4/parcours/outils/batterie.mjs --sans-construire
```

Le 24.10 : BATTERIE OK 31/31 (CHOIX OK 5 + 3 ouverts, TEINTE OK 5/5, RAIL OK 2/2, les contrôles de D107 à D121, D5
à 1,04 écran, ROUTES 8/8, PONTS, PARCOURS 29 + 29). Critique p6 : 8 ACCEPTÉ, 0 REJET.
