---
name: page-partagee
description: 19.10 — la page partagée ne montre que l'état à jour ; retirer les variantes et notes périmées ; pas de légende écrite sur la version finale.
type: produit
maj: 2026-10-22
sources: mémoire locale affinee-page-partagee-a-jour.md ; work/refonte-frontend/v4/outils/page-partagee/build.mjs
---

**La page partagée ne montre que ce qui est à jour** : la base courante, jouable, avec ses captures. Les anciennes variantes, les lots dépassés et les notes périmées en sortent : les publier avec `null` dans `files`.

**Pourquoi** : le brasseur, le 19.10 : « Houblon lot 3 partage beaucoup trop de choses inutiles, supprime tout ce qui n'est pas un to date ». Le même matin, sur les radars : « attention à pas surchargé en texte ni en légende. Pas besoin d'écrire la légende sur la version finale ». Puis : « Met à jour avec les artefacts, seulement ce qui est up to date, il y a trop de version inutile » ; « Créé une nouvelle page avec les artefacts up to date alors ». Une page neuve a remplacé l'ancienne : https://claude.ai/artifact/MoohEoyjPGAWqpMQZZCq5T (générateur `work/refonte-frontend/v4/outils/page-partagee/build.mjs` → `a-jour/`). Supprimer une page demande une confirmation qu'une séance de l'agent ne reçoit pas, et le brasseur dit ne pas pouvoir le faire non plus : il ne faut donc pas multiplier les pages.

**Comment l'appliquer** :
- À chaque publication, retirer ce qui n'est plus la base, et nommer la page d'après la base (« Houblons, base v4.x ») ; publier à la même adresse plutôt qu'en créer une nouvelle.
- Sur la version finale, pas de légende écrite : la valeur inconnue se dit par le « ? » gris, les hachures et la bulle au toucher.
- Garder les fils de fer et les lots sur leurs propres pages, par exemple la page de la nuit.

Voir [[fil-de-fer-d-abord]] et [[pas-de-cockpit]].
