---
name: page-partagee
description: 23.10 — une version, un artefact neuf et daté ; une page ne montre que sa version, lisible ; pas de légende écrite sur la version finale.
type: produit
maj: 2026-10-24
sources: mémoire locale affinee-page-partagee-a-jour.md ; work/refonte-frontend/v4/outils/pages/PUBLIER.md ; SPEC-BRASSEUR § 7 (23.10)
---

**Une version, un artefact neuf** (23.10) : « Problème avec les artefacts, c'est assez dur à lire et chaque version devrait en créé des nouveaux ». Une page par sujet et par version, datée (« Dryhopper · passe 3 · 23.10 »), qui ne montre que cette version et renvoie à la page d'avant. Mode d'emploi et contrôle : `work/refonte-frontend/v4/outils/pages/PUBLIER.md`, `scripts/agents/verifier-page.mjs`.

**Une page ne montre que sa version** (19.10, toujours vrai) : « Houblon lot 3 partage beaucoup trop de choses inutiles, supprime tout ce qui n'est pas un to date » ; « Met à jour avec les artefacts, seulement ce qui est up to date, il y a trop de version inutile ». Les anciennes variantes, les lots dépassés et les notes périmées ne s'empilent pas sur la page d'une version ; ils restent sur leurs propres pages.

**Pourquoi le changement** : de 19.10 à 23.10, on republiait une seule page à la même adresse pour éviter de multiplier les pages (le brasseur ne peut pas en supprimer). La page « Lot 22 houblons » (https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv, versions 1 à 9) a fini par cumuler quatre sujets et ~100 captures de 277 px, au texte illisible ; chaque version écrasait la précédente. Elle reste en l'état, comme archive.

**Comment l'appliquer** :
- Publier sans `url` à chaque nouvelle version (lot, passe, base jouable « Houblons, base v4.x ») ; republier une adresse seulement pour corriger ou compléter la même version.
- Inscrire chaque page dans la table « ## Pages » de MISSION.md (Sujet, Version, Adresse, Source) : `systeme.mjs voies` refuse deux versions sur une même adresse (M12).
- Lisible : date dans le titre, ce qu'il choisit au premier écran, captures à 340 px au moins, texte à 14 px au moins, blocs de 45 mots au plus.
- Sur la version finale, pas de légende écrite : « attention à pas surchargé en texte ni en légende. Pas besoin d'écrire la légende sur la version finale » (19.10). La valeur inconnue se dit par le « ? » gris, les hachures et la bulle au toucher.

**Pages inaccessibles** (22.10) : la page des fils de fer (`2VTRQP7nLXhX5GqDaAGAyU`) et l'ancienne page partagée (`MoohEoyj…`) répondent « artifact not found » depuis le compte des sessions actuelles.

Voir [[fil-de-fer-d-abord]] et [[pas-de-cockpit]].

**La disposition qu'il aime** (24.10, soir) : « J'aime beaucoup cette disposition. Utilise là pour les artefacts comme ça je peux voir rapidement plusieurs versions d'un coup ». Une rangée par écran, sa référence puis toutes les mini maquettes en vignettes serrées, une pastille de verdict et ses mots dessous ; agrandies au toucher. Règle et modèle : PUBLIER.md ; une page qui cache des variantes dans une bande échoue à controle-page-choix (D126).
