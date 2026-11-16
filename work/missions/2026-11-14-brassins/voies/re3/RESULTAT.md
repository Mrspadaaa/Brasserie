OK — e3a à e3d rhabillées : feuille de l'app sur Brassins, jetons, IDENTITE OK 4/4

## Variantes
- [x] e3a : fiche = feuille de l'app (poignée, rayon 24, titre NEIPA, ×) posée sur la liste Brassins avec en-tête, sous-onglets et barre du bas ; onglets Mesures / Carnet / Dossier au trait de la fiche réelle ; phrase en `id-display` 28/600 ; cartes `id-panneau`, pastilles `id-pastille`, bandeau noir « Prédit et dégusté » devenu panneau ; note dictée = seconde feuille (segments `id-segments`, bascule, pied Reprendre / Enregistrer) · écart restant : la pastille « Fermentation · J+5 » au-dessus des onglets n'existe pas dans la fiche réelle (qui met « Brassé le 09.11 »).
- [x] e3b : bandeau noir et bande violette retirés ; « Rien de noté aujourd'hui » en panneau avec le gros bouton Dicter rond en primaire (ebc-straw au lieu du rouge) ; filtres en `id-puce` ; bulles teintées water / hop / area-production à 14 % ; prochain essai et toast « Annuler » dans le pied de la feuille · écart restant : onglets Mesures / Carnet / Dossier ajoutés (absents de la v0) pour suivre la fiche de l'app.
- [x] e3c : bandeau ocre plein devenu panneau attention à 12 % ; bascule Carnet / Dossier en `id-segments` ; geste = vrai curseur m2 de la trousse (`id-curseur`, bande d'écart en attention, repère « figé ») dans une seconde feuille ; 1280 : carnet et dossier côte à côte · écart restant : à 1280 la feuille est élargie à 72rem (la feuille de l'app fait 42rem).
- [x] e3d : scène brun foncé (affiche) devenue `id-panneau` ; le verre en dégradé EBC (stout, brown, copper), mousse blanc + gold ; étiquettes au texte des jetons, « Bouche » cerclée ebc-straw ; échelles JAR en hop / attention / alert ; bouteilles et fût en EBC et cave ; feuille « Bouche » à 5 cases · écart restant : l'accent des titres en `--ebc-copper-texte` (choix de jeton à confirmer, aucun équivalent « mousse » dans les jetons).

Textes, chiffres et idées inchangés (aucun chiffre changé ; « — » gardé ; virgules ; aucun `type="number"` ; cibles 44 px par `::after`).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e3/e3a/etat.html`, `e3b/etat.html`, `e3c/etat.html`, `e3d/etat.html` (réécrits sur la trousse)
- `work/missions/2026-11-14-brassins/voies/e3/capture.mjs` (plan étendu : 6 images par variante, 390 clair 3 états, 390 cave repos et geste, 1280 clair)
- 24 PNG dans `voies/e3/e3?/` ; `voies/re3/tests.txt` ; ce fichier. NOTE.md des variantes non retouchées.

## Critères (sortie décisive, `voies/re3/tests.txt`)
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures ouvertes (Read)
- e3a : repos-390-clair, geste-390-cave, dossier-390-clair — lisible comme une fiche de l'app, à côté de `a1-banc/captures/fiche-fermentation-390-clair.png`.
- e3b : repos-390-clair (après correctif : pictos en ligne, puces du geste masquées au repos).
- e3c : geste-390-clair, repos-1280-clair (pictos empilés vus, corrigés, image refaite non rouverte).
- e3d : repos-390-clair.

## DEMANDE EXECUTANT
Contexte de l'agent au plafond : ouvrir (Read) les 17 captures non ouvertes et signaler tout débord, chevauchement ou texte coupé :
- `voies/e3/e3a/e3a-{geste-390-clair,repos-390-cave,repos-1280-clair}.png`
- `voies/e3/e3b/e3b-{geste-390-clair,dossier-390-clair,repos-390-cave,geste-390-cave,repos-1280-clair}.png`
- `voies/e3/e3c/e3c-{repos-390-clair,dossier-390-clair,repos-390-cave,geste-390-cave,repos-1280-clair}.png`
- `voies/e3/e3d/e3d-{geste-390-clair,dossier-390-clair,repos-390-cave,geste-390-cave}.png`
Rejouer si un fichier change : `node work/missions/2026-11-14-brassins/voies/e3/capture.mjs` (attendu : 24 lignes sans DEBORD ni ERREUR), puis les trois CHECK de `voies/re3/GATES.md` (attendu : IDENTITE OK 4/4, RHABILLE OK, HORS OK).

Prédiction : « Là oui, ça ressemble à l'app » ; le verre de e3d et le fil de e3b gardent leur caractère sans faire affiche.

DÉCISION À PRENDRE : e3c à 1280, feuille élargie à 72rem pour garder carnet et dossier côte à côte, ou feuille de 42rem avec les colonnes empilées.
CONNAISSANCE : dans la trousse, un `<svg>` est en `display:block` : un picto dans une ligne de texte demande `display:inline-block`. Une seconde feuille sur une feuille demande `z-index` > 51 sur elle et sur son voile (`.id-voile:has(+ #id)`).
LEÇON PROPOSÉE : aucune
