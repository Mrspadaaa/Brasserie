# Voie voie-critique — tri des 16 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : critique · Modèle : opus (Fable interdit jusqu'à nouvel ordre, 10.11) · Plafond : 30 tours · Décideur : pilote
- Lis : `.claude/agents/critique.md` (tes instructions, portrait du brasseur), `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md`,
  `INVENTAIRE.md`, puis les quatre voies `voies/voie-recherche/`, `voies/voie-menu/`, `voies/voie-barre/`, `voies/voie-destinations/` (pour celle-ci, aussi la planche `*-vues-390.png`) : NOTE.md et les quatre captures
  de chaque variante (ouvre-les toutes, Read). Références de l'existant : `references/390-clair-*.png`. Charge `boosters-ux`.
  Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même place du + partout (D119, D129, BX-4) ;
  390 tactile et 1280 ; clair et cave ; rien de perdu de l'existant.

## Objectif
1. Pour chacune des 16 variantes : « combien et quels problèmes ? » (liste numérotée, à la place du brasseur) et un verdict
   ACCEPT ou REJET avec la correction qui le lèverait. Ne rejette jamais la diversité ; ton avis est indicatif (L27, non étalonné en Opus).
2. Classe tout le panel. Garde 4 candidates, **une par série**, et pour chacune les greffes à prendre ailleurs (même dans les plus
   extravagantes) et les retouches. Le tout dans `SYNTHESE.md` (≤ 60 lignes).
3. Mesure le panel : `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-14-ecrans-transversaux/voies/voie-*/*-a-390.png > work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/panel.txt`
   et cite la sortie dans SYNTHESE.md.

## Contrôles
- Tests : aucun Vitest (pas de --reporter=dot : pas de Vitest ici) ; sortie du panel écrite dans un fichier (`> panel.txt`).
- RESULTAT.md tenu au fil : une ligne par variante jugée, au fur et à mesure (une limite de tours ne doit rien perdre).
- `SYNTHESE.md` contient 16 verdicts (ACCEPT ou REJET) et une section « Candidates ».

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/**` seulement. Tu ne modifies aucune maquette.

## Rendre
Une ligne : « voie-critique : 16 jugées, N REJET, candidates <r?> <m?> <b?> <d?> ».
