OK — série i : 6 concepts d'entrée (collée, style, reprise), 2 froides, 2 tièdes, 2 chaudes

## Fichiers écrits (rien hors de `v0/i*/`, rien dans `src/`)
- `v0/i1` à `v0/i6` : `etat.html`, `NOTE.md`, `iN-haut.png` (premier écran), `iN-page.png` (page entière).
- `v0/i-serie/RESULTAT.md` (ce fichier). Scripts de travail dans le dossier temporaire de session, hors du dépôt.

| Id | Chaleur | Idée | État montré |
|---|---|---|---|
| i1 | froide | Deux départs, « Coller une recette » et « Partir d'un style », sur une recette vide ; ils disparaissent une fois remplie (l'icône d'en-tête suffit). Volumes à chaud en « — » au lieu de « 0 L ». | neuve, puis collée |
| i2 | froide | Posé contre proposé : vert = lu dans le texte ou le profil ; ambre tireté = proposé par l'app (repère 20 %, conseil 24 L, profil d'eau tiré du style). Un toucher pose. | collée |
| i3 | tiède | Coller d'abord (puits), sinon un style pris dans un nuancier : bande SRM réelle et teinte de famille. | neuve, puis collée |
| i4 | tiède | Reprise v3 → v4 : gouttière de diff (vert « = », ambre changé, barré, retour d'un toucher), « Nouvelle version / Modifier v3 », conséquence sur la cuve (31,7 / 35 L). | dupliquée, 90 min |
| i5 | chaude | La roue des styles au pouce, du plus pâle au plus sombre, à leur couleur réelle ; le verre prend la couleur du style. | neuve, style choisi |
| i6 | chaude | Le texte collé devient l'écran : un ticket, ce qui a été lu est surligné et s'édite sur place, avec son effet à droite ; « Absent » pour NOLO. | collée |

## Sorties décisives
- Baseline : en-tête, fil des 7 étapes et bandeau repris tels quels (bandeau absent sur une recette neuve, comme `hasMetrics` ; pas d'« Abandonner » sans brouillon, comme l'app). Cochés dans chaque NOTE.
- `verifier-page.mjs` : PAGE OK ×6 (390 px, sans erreur).
- `mots-premier-ecran.mjs --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` (6 premiers écrans) : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK. i1 reste à 0,34.
- `controle-commun.mjs --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK. Les contrôles `au-style`, `fiche` et `trait` sont hors objet : aucune famille d'arômes ni picto, et aucun nom de houblon affiché. `mots` est joué à part, à 80.
- `type="number"` : 0. Honnêteté : évaporation au profil (3 L/h, export réel de neipa v3) ; 20 % marqué « repère » ou « ~ » ; conseil tireté ; cuve 35 L « provisoire » ; inconnu en « — ».
- `controle-choix` : sans objet. L'Identité n'a pas de maquette choisie dans `ecrans.json`.

## Captures (ouvertes)
`work/missions/2026-10-31-ecran-identite/v0/i1/i1-haut.png` … `i6/i6-haut.png`, et `iN-page.png` pour chacune.

## Prédiction
« i6 et i4 c'est vachement bien, on voit ce qui a été lu et ce qui change ; i5 la roue c'est frappant mais pas sûr au quotidien ; i1 trop proche de l'actuel. »

DÉCISION À PRENDRE : `controle-standard` impose des rayons de 2, 4 ou 8 px, alors que DESIGN.md fixe 10 px (contrôles) et 16 px (panneaux). La série suit le contrôle, comme les maquettes houblons choisies. À trancher pour les 7 étapes.

CONNAISSANCE : le remplissage de `controle-panel` compte les rangées « encrées » (texte, aplats à plus de 60 d'écart) : un fond `#F5F5F5` ou `#EBEBEB` sur blanc ne compte pas. Un écran d'Identité à 80 mots plafonne vers 0,35 en formulaire. Il ne passe 0,5 qu'avec des représentations pleines (bandes, jauges, gouttière, tuiles teintées porteuses de sens). La capture du brasseur (0,63) inclut les barres du téléphone : la comparaison est faussée.

LEÇON PROPOSÉE : aucune
