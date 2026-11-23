---
name: maquette-jouable
description: 24.10 — la maquette houblons de bout en bout, son « vrai bon point de départ » ; version D107 à D121 ; où la trouver, l'ouvrir, la reconstruire, la vérifier ; état par écran et réserves reportées.
type: produit
maj: 2026-10-24
sources: work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/LISEZ-MOI.md ; work/refonte-frontend/v4/outils/pages/2026-10-23-maquette/LISEZ-MOI.md ; prototypes/houblons-v4/parcours/ARCHITECTURE.md ; work/refonte-frontend/v4/choix/ecrans.json ; SPEC-BRASSEUR § 1 (23.10, soir) ; work/missions/2026-10-23-maquette-parcours/MISSION.md
---

**Son verdict** (23.10, soir), sur la version d332792c : « La nouvelle maquette (artefacts) est un vrai bon point de départ. Bien la rendre disponible pour les prochaines sessions ». Le travail suivant part d'elle : on la corrige et on l'enrichit, sans repartir d'un lot.

**Où la trouver** (la plus récente d'abord)
- **Référence, 24.10 soir** (« Sauver cette maquette on est quasiment à du 100% ») : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN (version 2) ; étiquette git `maquette-2026-10-24-soir` ; enveloppe `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette-reprise/` ; BATTERIE 45/45, ETATS 141/141. Suite : réactivité (#148), choix reportés partout (#149).
- Version D107 à D121 (24.10) : https://claude.ai/artifact/2BktuZzij8q2DAsrxQS5iX ; copie figée `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/` (`publie.html` en `file://`, construction de 5345f6ad) ; page côte à côte `…/pages/2026-10-24-cote-a-cote/`.
- Version d332792c (23.10) : https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1 (la version en ligne porte une pastille « ‹ Retour » refusée) ; copie figée `…/pages/2026-10-23-maquette/`.
- Sources : `prototypes/houblons-v4/parcours/`, une NOTE.md par écran (base, reprise, écarts, « Pour l'app »).
  - Construire : `node prototypes/houblons-v4/parcours/outils/construire.mjs`, vers `maquettes/parcours/` (ignoré par git).
  - Vérifier : `outils/batterie.mjs` (31 contrôles le 24.10 : choix, teinte, rail, D107 à D121, D5, parcours) ; puis
    `outils/captures-cote-a-cote.mjs` pour la page « sa base | la maquette ».

**Ce qu'elle est.** React, avec les composants, les jetons et le moteur de l'app importés sans modification (PageShell, Sheet, WizardStepBar, simulerCas). Les données viennent de la fixture (stout 16D, Nugget 46 g à 60′, US-05) et tout est calculé en direct. Les routes : `ma-biere` (l'étape Houblons 3/7, sous le vrai fil d'étapes) ; `biere` (l'onglet Ma bière) ; `suggerer`, `comparer`, `dryhopper`, `substituer`, `levure` ; `fiche`.

**Par écran** (registre `choix/ecrans.json`, la règle n° 1)
- Choisis : étape Houblons et Ma bière, base v4.10 ; Suggérer, q2b tel qu'intégré dans la v4.10 (D117) ; Comparer, la forme de r6a et les étapes à la manière de x3b, Nugget en référence (D107) ; fiche, g1, radar d'abord (D115).
- Ouverts : Dryhopper (a1 provisoire, #146 : « j'aime bien mais il y a des améliorations à faire ») ; Substituer (la porte ou u4, #145) ; Levure (étape de Dryhopper ou a2b).
- Communs (24.10) : une croix de 44 px à l'encre, à la même place, qui ramène toujours à l'étape (D109, D118) ; le même en-tête sur les trois onglets (D119) ; Annuler à côté de l'action (D120).

**Réserves reportées** (critique p6, supervision ; portées dans #145 et #146) : à chaque étape de Comparer, seuls floral et résineux ; le dock de Dryhopper plus lourd que celui d'a1 ; Substituer à deux colonnes, sa base en classait huit ; la liste de la fiche à refaire en variantes (D115) ; D121 en trois variantes, la version porte A.

**Pièges**
- CHOIX OK ne prouve pas la ressemblance : Suggérer est passé alors qu'il s'écartait de q2b (D117). Avant toute publication, la page côte à côte, regardée par le critique et par la supervision (L03).
- Un composant de l'app réemployé apporte ses propres boutons (le « × » de 16 px du Sheet) : les contrôles écrits pour les routes ne les voient pas.
- Échap sans feuille ouverte fait reculer d'un écran : tout élément ajouté qui s'ouvre au toucher intercepte Échap en capture (`keydown`).
- Figer le DOM rendu (outerHTML et `style.css` copiée) donne une copie exacte d'un écran choisi, en renommant `data-houblon`, `ligne-houblon`, `legende` et les id de React (jeux courts du 24.10).
- Le radar de Ma bière de la base v4.10 (choix m4) trace la dégustation notée de la grille (−1 à 3, « pas senti » sur l'anneau du zéro, « pas goûté » au centre), pas le profil simulé. Pièges des contrôles : [[pieges-controles-maquette]].
- Les réponses automatiques aux commentaires peuvent republier l'artefact. Une version corrigée va toujours dans un artefact neuf ([[page-partagee]]).

**Vers l'app.** L'architecture de base vient d'abord (#143, faite par p8-portabilite) ; la porte B n'ouvre que sur son feu vert. Chaque fichier a sa place dans l'app : voir ARCHITECTURE.md. Voir aussi [[acquis-valides]] et [[outils-houblons]].
