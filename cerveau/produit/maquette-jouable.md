---
name: maquette-jouable
description: 23.10 — la maquette houblons de bout en bout, son « vrai bon point de départ » ; où la trouver, l'ouvrir, la reconstruire ; état par écran et défauts en cours.
type: produit
maj: 2026-10-23
sources: work/refonte-frontend/v4/outils/pages/2026-10-23-maquette/LISEZ-MOI.md ; prototypes/houblons-v4/parcours/ARCHITECTURE.md ; work/refonte-frontend/v4/choix/ecrans.json ; SPEC-BRASSEUR § 1 (23.10, soir) ; work/missions/2026-10-23-maquette-parcours/MISSION.md
---

**Son verdict** (23.10, soir) : « La nouvelle maquette (artefacts) est un vrai bon point de départ. Bien la rendre disponible pour les prochaines sessions ». Le travail suivant part d'elle : on la corrige et on l'enrichit, sans repartir d'un lot. Il l'a dit après 17 fils de commentaires, D107 à D121.

**Où la trouver**
- Artefact : https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1. La version en ligne porte une pastille « ‹ Retour », posée par une réponse automatique et refusée.
- Copie figée, versionnée : `work/refonte-frontend/v4/outils/pages/2026-10-23-maquette/`. On ouvre `publie.html` en `file://`. Construction d332792c ; voir le LISEZ-MOI.
- Sources : `prototypes/houblons-v4/parcours/`, une NOTE.md par écran (base, reprise, écarts, « Pour l'app »).
  - Construire : `node prototypes/houblons-v4/parcours/outils/construire.mjs`, vers `maquettes/parcours/` (ignoré par git).
  - Jouer : `outils/jouer-parcours.mjs` et `parcours-complet.mjs`, avec le crochet `window.__parcours`.

**Ce qu'elle est.** React, avec les composants, les jetons et le moteur de l'app importés sans modification (PageShell, Sheet, simulerCas). Les données viennent de la fixture (stout 16D, Nugget 46 g à 60′, US-05) et tout est calculé en direct. Les routes :
- `ma-biere` : l'étape Houblons 3/7 ;
- `biere` : l'onglet Ma bière ;
- `suggerer`, `comparer`, `dryhopper`, `substituer`, `levure` ;
- `fiche`.

**Par écran** (registre `choix/ecrans.json`, la règle n° 1)
- Choisis :
  - étape Houblons et Ma bière : base v4.10 ;
  - Suggérer : q2b, tel qu'intégré dans la v4.10 ;
  - Comparer : la forme de r6a, plus les étapes de x3b (D107) ;
  - fiche : g1.
- Ouverts : Dryhopper (a1 provisoire, ticket #146 : « j'aime bien mais il y a des améliorations à faire ») ; Substituer (la porte ou u4, ticket #145) ; Levure (étape de Dryhopper ou a2b).

**Défauts en cours** (SPEC § 1, DEFAUTS-RECURRENTS ; une seule version, un artefact neuf ; mission `2026-10-23-maquette-parcours`) :
Comparer aux étapes avec une référence (D107) ; la visée sur la barre (D108) ; une croix qui ramène toujours à l'étape (D109,
D118) ; les traits lisibles au toucher (D110) ; le geste de la base (D111) ; l'appui long (D112) ; une légende près de la
carte (D113) ; le panel OSU hors du premier plan (D114) ; le radar avant la liste dans la fiche (D115) ; le vrai fil d'étapes
de l'app (D116) ; Suggérer refait sur q2b (D117) ; le même en-tête sur les trois onglets (D119) ; Annuler (D120) ; le bloc du
profil qui ouvre l'analyse (D121).

**Pièges**
- CHOIX OK ne prouve pas la ressemblance : Suggérer est passé alors qu'il s'écartait de q2b (D117). Avant toute publication, une page côte à côte « sa base | la maquette », écran par écran (L03).
- Les réponses automatiques aux commentaires peuvent republier l'artefact. Une version corrigée va toujours dans un artefact neuf ([[page-partagee]]).

**Vers l'app.** L'architecture de base vient d'abord (#143, faite par p8-portabilite) ; la porte B n'ouvre que sur son feu vert. Chaque fichier a sa place dans l'app : voir ARCHITECTURE.md. Voir aussi [[acquis-valides]] et [[outils-houblons]].
