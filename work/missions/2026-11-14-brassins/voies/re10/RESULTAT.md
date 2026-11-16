OK — e10a à e10d rhabillées à l'identité de l'app, 18 images refaites et ouvertes

## Variantes
- [x] e10a : segment maison retiré pour le chrome de l'app (en-tête, sous-onglets Volumes, barre du bas) ; titre 40/800 ramené en `id-display` 28/600 ; stepper et piste maison remplacés par le curseur m2 de la trousse (bande F1 en hop, hachures au-delà de 30 L en attention, pouce `data-hors` au-delà) ; eaux en panneaux teintés eau ; moments en `id-pastille` (cuivre, attention, hop) ; grains et houblons en `id-panneau` · écart restant : le titre « 24 L de NEIPA » et le stepper restent plus gros que l'écran de liste de l'app ; c'est la phrase-réponse voulue.
- [x] e10b : tuiles pleines (blanc sur couleur) devenues panneaux teintés (eau, ambre EBC, hop, neutre) en lecture mono 28 ; cuve SVG recolorée en jetons (bière `--ebc-gold`, dépassement `--attention`, pouce hop puis alerte) ; liste en `id-sureleve` ; vide en `id-btn-primaire` · écart restant : à 1280, la cuve en SVG étiré garde des chiffres d'axe un peu larges.
- [x] e10c : bandeau noir à coins 22 devenu `id-panneau` ; titres de moments en `id-section`, sans majuscules ni graisse 800 ; cases 22 px à rayon 4 (zone de 44 px) ; écarts « +3,33 » en `id-pastille` attention ; plateau du volume posé au-dessus de la barre du bas, rayon 24 comme une feuille, curseur m2 · écart restant : le plateau fixe masque une rangée en bas de liste au repos ; elle se lit en défilant.
- [x] e10d : abaque recoloré en jetons (volume en encre forte, grain ambre EBC, eau, hop, levure en rubrique agenda ; trait en `--ebc-straw`, noir en clair et paille en cave) ; graisses 800 ramenées à 600 ; phrase en `id-display` 28, chiffres en mono et unités en sans ; étiquettes en pastilles teintées · écart restant : la phrase tient sur 3 lignes à 28 px, et les étiquettes d'explication passent sous le pli au geste.

Comparaison avec l'app (liste-remplie-390 et la démo de la trousse) : même en-tête, mêmes sous-onglets et même barre du bas, mêmes surfaces `cave-900`/`cave-800`, mêmes rayons et même famille de polices ; en cave, la paille de l'app porte l'action (Volumes, +, trait de l'abaque).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e10/e10{a,b,c,d}/etat.html` (réécrits, trousse chargée par lien relatif)
- `work/missions/2026-11-14-brassins/voies/e10/e10{a,b,c,d}/NOTE.md` (§ Rhabillage re10 ajouté)
- `work/missions/2026-11-14-brassins/voies/e10/capture.mjs` (plan : e10a et e10c gagnent repos-390-cave et repos-1280-clair)
- 18 PNG dans `work/missions/2026-11-14-brassins/voies/e10/e10?/`
- `work/missions/2026-11-14-brassins/voies/re10/tests.txt`, ce RESULTAT.md

## Critères (sortie dans tests.txt)
- Tests : aucune suite Vitest (rien dans `src/`).
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Aussi : 0 `type="number"` ; capture sans DEBORD ni ERREUR.

## Captures (toutes ouvertes)
- e10a : repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair
- e10b : repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair, refuse-390-clair, vide-390-clair
- e10c : repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair
- e10d : repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair

Prédiction : « Là oui, c'est l'app », sur les quatre ; e10d reste celle qu'il regardera deux fois.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `controle-identite.mjs` ne compte pas les couleurs des familles d'arômes (`src/data/hopV4/jetons-familles.json` : #d9b414, #ee9b2f, #e88d68, #9b3f74 absents de DESIGN.md et de couleurs-portees.css), alors que LISEZMOI les permet. Ici, les familles sont dessinées en SVG (fill non mesuré). Il faudrait ajouter ce JSON à la palette du contrôle.
LEÇON PROPOSÉE : aucune.
