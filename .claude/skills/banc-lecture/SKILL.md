---
name: banc-lecture
description: Améliorer en boucle la lecture des factures de L'Affinée (Gemini 3.5 Flash-Lite et 3.8 dans aiTask) - chaque nouvelle pièce réelle du brasseur (photo, capture, plusieurs captures, PDF) reçoit une vérité écrite par deux lecteurs, entre au banc, et chaque geste (consigne, schéma, réflexion, résolution, tuiles, zoom de la 3.8, vote, normalisation) s'y mesure contre la production avant toute bascule. À utiliser quand il envoie des factures ou des captures, quand il demande d'améliorer la lecture, la vision, Gemini, Flash-Lite, ou de comparer des réglages. Pas pour l'écran Dépense lui-même.
---

# Le banc de lecture, en boucle

Sa demande (01.11) : « Met déjà en place le système qui permet d'améliorer et compare avec les données que l'on a ». Registre des
gestes et de leur état : `work/missions/2026-11-01-banc-lecture/GESTES.md` (une ligne par geste, rien de mis de côté sans raison).
Rapport de fond : `work/missions/2026-11-01-banc-lecture/reports/Lecture de factures par vision.md`.

## 1. Ranger une pièce reçue (pilote)
- Ses mots, mot pour mot, dans SPEC-BRASSEUR (« La lecture d'une facture ») au tour même (L13).
- Copier chaque fichier dans `work/finalisation-tickets-2026-10-08/H13-reels/` (hors de Git) sous un nom neutre `docN-<genre>-…`.
  Un document = tous ses fichiers : plusieurs captures d'une même facture forment **un** cas (`files: [...]`). Deux fichiers identiques
  (même empreinte) ne font qu'un cas.
- Ses données personnelles (adresse, téléphone, e-mail) et les valeurs de ses pièces ne vont jamais dans Git, un RESULTAT, une page ni
  un message.

## 2. Écrire la vérité (deux lecteurs qui ne se voient pas)
- Contrat type : `work/missions/2026-11-01-banc-lecture/voies/k3-verite/VOIE.md` (format `{ note, cases }`, conventions des `notes`,
  `lignesInvisibles`, contrôle `VERITE OK`). Lecteur A : `general-purpose` en Opus ; lecteur B : `auteur` (Sonnet). En parallèle.
- Le pilote compare les deux fichiers champ par champ, tranche chaque écart **sur l'image** (vérité croisée, aucune source seule), et écrit
  `cas-N.json`. Un doute qui reste devient une liste de valeurs justes, dit dans `notes`.
- Une unité vraie s'étiquette sur la même pièce, jamais d'après le produit d'une autre pièce du même magasin : la boutique en ligne
  du banc vend une même matière en « , Kg » et en « , Gramm », l'unité dans le nom et non en colonne (01.11 : une étiquette tirée
  d'un PDF a fait 4 faux).

## 3. Mesurer
- `npx tsx scripts/banc-lecture-facture.ts --simuler …` d'abord (`BANC SIMULE OK`, aucun réseau), puis `--estimer` sur la commande
  voulue (`BANC ESTIME <x> CHF`).
- Budget : D234 (5 CHF) est **cumulatif** (`journal-gemini.md`) ; au-delà, son accord, coût montré avant. `--reprendre <dernière sortie>`
  prête les appels déjà payés. Gemini jamais dans `npm test` ni dans un test unitaire.
- Passe payante : `--payant --budget-chf <reste> --confirm-paid-ai`, lancée par le pilote seul, journalisée.

## 4. Juger
- Champs justes, lignes justes, **faux verts** (statut « vérifié » sur une valeur fausse : un seul suffit à écarter une variante),
  temps médian et maximal, coût ; par document et par genre de pièce. Un gain venu d'un seul document n'est pas un gain.
- Sous 40 pièces, un indice, pas une preuve (rapport, § données) : le dire avec chaque chiffre.
- Mettre à jour `GESTES.md` (état, chiffre) ; un geste écarté y garde sa raison.

## 5. Montrer, puis basculer
- Une page neuve et datée (artefact privé) : production contre la meilleure variante, par document, avec ses mots. Liens dans le rapport.
- La bascule de production (redéployer `aiTask`, nouvelle dépendance comme zxing-wasm, nouveau fournisseur comme Azure) attend son accord.
  Rien ne change dans `functions/` ni `src/` avant.
- Un champ de ligne neuf (`nameFr`) : au schéma hors `required`, à `normalizeInvoiceScan` (il ne garde que les champs qu'il
  énumère), au client, et hors de `itemFields` du vote s'il ne doit pas faire voter les lectures.
