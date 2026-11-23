OK — V11 : CHV-13 et CHV-14 corrigés (commit b79cab17e) ; CHV-19 laissé à l'autre voie qui l'a déjà prise

## Fichiers (commit b79cab17e dans port-carnet, index temporaire, mes hunks seulement)
- `src/ui/calendrier/entete/BandeSemaines.tsx` : `reperesReguliers` (un repère toutes les 2 ou 4 colonnes, ancré sur S1 quand la fenêtre passe le nouvel an, sinon sur la première semaine multiple du pas).
- `src/ui/calendrier/entete/BandeAnnee.tsx` : chaque janvier écrit « J’27 » (`.ent-an-a`, 14 px) ; `.ent-an-l` garde « J ».
- `src/ui/calendrier/entete/BandeColonnes.tsx` : suffixe « · toucher pour replier » dans un `<span className="ent-bj-rep">` (textContent inchangé).
- `src/ui/calendrier/entete/entete.css` : légende dépliée 12 px (rangées 14/15 px, total 29 px inchangé), dans sa case (`overflow: hidden`, conteneur), suffixe masqué sous 200 px ; trait et année du janvier.
- `scripts/parcours/chaines-v11.mjs` (étapes CH-V13, CH-V14), `tests/unit/calBandeV11.test.ts` (5 tests), `tests/integration/calendrierEntete.test.tsx` (2 tests adaptés : « S48 S50 S52 S1 S3 » ; pas de 4 régulier au lieu de « semaines rondes »).
- `work/missions/BUGS.md` : CHV-13, CHV-14 « corrigé | b79cab17e » ; `controle-bugs.mjs` : BUGS OK (1656 bugs, 173 ouverts).

## Preuves
- Tour8 (`--ref en-ligne/2026-11-21-tour8`, 390, clair et cave) : 6/6 KO. V13 6 mois : « S44 … S52 S2 S4 » écarts 2,2,2,2,3,… ; V13 An : janvier « J » sans année ; V14 : légende en 11 px.
- Arbre : « CHAINES V11 OK » : V13 (6 mois et An) et V14 à 390 et 1280, deux thèmes ; V14 aussi à 320 et 360 (légende raccourcie à « S47 16–22 nov. » sous 200 px de case, 74 px dans 177 ou 201). 6 mois à 390 : S44 S46 S48 S50 S52 S1 S3 … écarts constants à 2.
- Captures ouvertes (`%TEMP%/cv11/arbre-final`, `arbre-caps`) : CH-V13-390-clair-an, CH-V13-390-clair-6m, CH-V14-390-cave-6s, CH-V14-1280-cave-6s.
- `tsc --noEmit` propre. Vitest : calBandeV11, calendrierEntete (110, passe sur HEAD + mes seuls fichiers), calendrierEchelle, calendrier-onglet, calendrierGestes verts.

## Doutes et limites
- CHV-19 : une autre voie a déjà modifié `feuille.css` (12 px, cave-100, étape CH-V19 citée) dans l'arbre, non commité ; je n'y ai pas touché et j'ai retiré mon étape V19.
- CHV-14 : le débordement sur S46 décrit par la chasse (≈ 9 px) ne se reproduit pas sur tour8 à 390 (11 px, 167 px dans 214 px, aucun recouvrement). Mon contrôle est rouge sur tour8 par le corps (11 px), seuil 12 px (DESIGN.md : libellé compact) au lieu des 11 px du contrat. Je l'ai tenu quand même : texte dans sa case, sans intersection avec S46 et S48. Rien ne déborde plus : le choix de la maquette C (étiquette libre sur 210 px) est remplacé par une légende rognée proprement ; à confirmer.
- Ancre S1 : pour un pas de 4, les semaines d'avant le nouvel an ne sont plus rondes (S46 S50 S1 S5) ; la régularité prime (contrat).
- Le test `calendrierEntete` « b1 » échoue sur l'arbre complet mais passe sur HEAD + mes fichiers : il vient des changements non commités d'autres voies (Fenetre, EnTete).
- Étape 2 sem. de V14 retirée : en vue Jour, aucune semaine ne se déplie ; seule la vue 6 sem. déplie.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
