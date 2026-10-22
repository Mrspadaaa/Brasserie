---
name: socle-v01
description: Décisions d'architecture validées par Gaëtan pour la refonte v0.1 de l'app Brasserie L'Affinée (socle données, librairies, simplifications métier).
type: produit
maj: 2026-10-22
sources: mémoire locale affinee-decisions-v01.md
---

Refonte v0.1 de l'app de gestion Brasserie L'Affinée, validée le 2026-09-03.
- **Socle données** : bascule vers Dexie/IndexedDB, justificatifs en `Blob` (pas de base64). Motif : localStorage plafonne à ~5 Mo et cassait après 2-3 photos de factures.
- **Librairies retenues** : `fuse.js`, `@tanstack/react-virtual`, `swissqrbill`. **`vaul` explicitement REFUSÉ** : les bottom sheets sont faits main en CSS.
- **Simplifications métier validées** : statut `brassage` supprimé (devient un événement `planifie → fermentation`) ; volume réel dérivé du conditionnement (`volumePackagedL`), `volumeL` reste l'objectif ; code PIN supprimé (l'auth Google Firebase est le seul verrou) ; statut et CA client dérivés des ventes, jamais stockés.
- **Ordre de travail choisi** : refonte UI mobile-first AVANT le socle de données (l'inverse de ma recommandation, assumé).
- Gaëtan a insisté sur deux points transverses : chercher systématiquement des libs ou API tierces pour fiabiliser plutôt que coder à la main ; vérifier que **tous** les calculs sont mathématiquement corrects.

Voir [[verification-locale]].
