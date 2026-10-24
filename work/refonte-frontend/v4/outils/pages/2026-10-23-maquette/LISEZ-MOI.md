# Maquette houblons · 23.10 (construction d332792c), figée

Le brasseur, le 23.10 au soir, sur cette maquette publiée : « La nouvelle maquette (artefacts) est un vrai bon point de
départ. Bien la rendre disponible pour les prochaines sessions. Bien consigné son état aussi ».

- **Artefact** : https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1
  - La version publiée est 1792780709-ba4a, celle de ce dossier.
  - La version en ligne depuis 20 h 35 est 1792787728-7f4a. Une réponse automatique aux commentaires y a posé une
    pastille « ‹ Retour », hors des sources, qu'il a refusée (D109).
- **Source** : le commit d332792c, dossier `prototypes/houblons-v4/parcours/`.
- **État** : `cerveau/produit/maquette-jouable.md`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | l'enveloppe publiée (`Artifact`, `file_path`) ; le service l'entoure d'un squelette de document |
| `publie.html` | la page telle que l'artefact la sert : à ouvrir en local |
| `assets/parcours.js`, `assets/style.css` | la construction d332792c, lue sur l'artefact (1 554 182 et 91 781 octets) |

## L'ouvrir

Ouvrir `publie.html` dans Chrome, en `file://`, sans serveur. La page démarre sur l'étape Houblons (`#/ma-biere`), et
le crochet de test `window.__parcours` est posé. Vérifié le 23.10 : mode standard, aucune erreur, et « + floral » mène
bien à Suggérer.

## La reconstruire

Dans un worktree au commit d332792c (`git worktree add <dossier> d332792c`, puis `npm ci` dans ce dossier) :

```
node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-d332792c
```

La construction courante va dans `prototypes/houblons-v4/maquettes/parcours/`, qui est ignoré par git. Mode d'emploi :
`prototypes/houblons-v4/parcours/ARCHITECTURE.md`.
