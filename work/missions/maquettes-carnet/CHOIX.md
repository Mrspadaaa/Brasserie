# Carnet, lecture d'un lien : son choix par écran (23.11, D448)

Page de choix (artefact privé, inaccessible aux autres sessions) : https://claude.ai/artifact/M7FU5ad6NVhXD12Pjc9fBH.
Tout ce qu'il faut est ici, en local : maquettes `v01.html` … `v06.html` (ce dossier), images `page/img/`, page `page/index.html`.
Règle : IA-ETAPES-VISIBLES (DEFAUTS-RECURRENTS). Base : work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html.

## Ses mots, tels quels
« Carnet, lecture d’un lien, classement par écran (23.11)
Début · le lien vient d'être collé : 1 v05, v06 · 2 v03, v04 · 4 v02
Milieu · 3 étapes faites, dont une douteuse : 1 v03 · 2 v01, v05, v06 · 3 v04
Barre repliée · l'app peut se fermer : 1 v01 (v01 : Toujours pas assez compact le carnet )
Fin · retrouvée à la réouverture : 2 v01, v03, v05 fin · 5 v06 (v06 : Toujours en ttc)
Échec · lien introuvable : 2 base, v03 (v03 : Bouton escaler, où on pourrait utiliser encore une meilleure ia) »
Puis : « Parcontre ça manque un peu de compact, c'est pas assez dense. »

## À porter, écran par écran (rang 1 = à reprendre ; ex æquo = fusionner les deux)
| Écran | À reprendre | Image(s) | Ensuite |
|---|---|---|---|
| Début (lien collé) | v05 + v06 (ex æquo 1) | page/img/v05-2.png, page/img/v06-1.png | v03, v04 (2) ; v02 (4) |
| Milieu (3 faites, 1 douteuse) | v03 | page/img/v03-2.png | v01, v05, v06 (2) ; v04 (3) |
| Barre repliée (app fermable) | v01, PLUS COMPACTE | page/img/v01-repliee.png | — |
| Fin (retrouvée à la réouverture) | aucun rang 1 : v01, v03, v05 à égalité (2) → fusion | page/img/v01-fin.png, v03-4.png, v05-6.png (+ v05-5.png réouverture) | v06 (5) |
| Échec (lien introuvable) | aucun rang 1 : base et v03 (2) → fusion | page/img/base-echec.png, v03-5.png | — |

## Ses remarques, à appliquer partout
1. Densité : « ça manque un peu de compact, c'est pas assez dense » ; v01 : « Toujours pas assez compact le carnet ». Tout l'ensemble plus serré (docs/ui-compacte.md, DESIGN.md).
2. v06 : « Toujours en ttc » : ne pas reprendre le choix « Garder HT / Prendre TTC » de v06 ; le prix suit D447 (HT dit quand c'est le cas, conversion CHF et frais).
3. v03, échec : « Bouton escaler, où on pourrait utiliser encore une meilleure ia » : sur l'échec, un bouton « Escalader » qui relance la lecture avec une IA plus forte (Hydrogen côté serveur, coût réservé avant envoi).

## Côté code (déjà en ligne au tour 26, b44b191d3)
Serveur : champ `etapes` [{nom, statut trouve|absent|douteux, detail}], flux sendChunk, document `lecturesLiens/{jeton}`, reprise `{jeton, reprise:true}`, étape `bloquee` (« page bloquée, lue par Google »). App : le type lit `etapes`, TODO pour le flux (src/domain/carnets/). À faire : l'affichage ci-dessus, puis preuve sur la vraie app (ZZ TEST, captures 390 regardées).
