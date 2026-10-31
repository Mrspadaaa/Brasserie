# Relance des passes 2 de Malts/sucres (31.10, D207)

Un agent neuf par variante, sur un brief serré. Tu ne relis ni les skills ni les sources : la langue, les règles et les contrôles sont
déjà dans ta variante. Tu corriges ce que le critique a demandé, rien d'autre.

## Lire, et seulement ça
1. `critique/VERDICTS-v1.md` : ta section et « Commun aux trois avant de les lui montrer ».
2. Ta passe : `v1/<id>/etat.html` et `v1/<id>/NOTE.md` (les contrôles que tu rejoues y sont écrits).
3. Au besoin, pour vérifier un point : `BRIEF-AUTEUR.md` (sa recette, les états) et `../2026-10-31-ecran-identite/v1/r4-a/g1-ebullition-repos.png` (r4-a).

## Écrire
- Copie `v1/<id>/` vers `v2/<id2>/` (r4b → r4c, z2b → z2c, u2b → u2c) et travaille dans `v2/<id2>/` seulement. Préfixe tes classes neuves
  (`<id2>-…`) ; le code client s'assemble sans remplacement de chaîne (L26).
- `v2/<id2>/NOTE.md` : chaque correction demandée, faite ou non (et pourquoi), avec la capture qui la montre ; les contrôles et leur sortie.

## Commun aux trois (décidé par le pilote, réversible)
- **Remplissage ≥ 0,80 au repos à 390, sur sa recette de 3 malts**, par de l'information qu'on a déjà, jamais du remplissage : la ligne
  « Rendement 75 % repère » dépliée en carte de repères à la r4-a (OG attendue au rendement, EBC estimé face à la plage du style, mot de
  teinte ; « — » tant qu'une couleur manque ; aucun chiffre inventé : un repère se dit « repère », une estimation « ~ »). L'échelle des
  teintes u3 là où elle manque (r4c, u2c).
- **Sucre** : comme l'app actuelle (`src/pages/BrewWizard.tsx` l. 2464-2530). Un grain dit « NN % du grain », un sucre ou un autre
  « NN % ferm. ». Ligne dans l'ordre nom, pastille de famille (« Sucre »), moment en mot (« ébullition », « J+3 »), part, masse.
- **Marque** : « n couleurs à renseigner », 12 px, même mot dans les trois.
- **Rien de tronqué** : « 0,40 », « Purée de mangue », « Weizenmalz hell » lisibles sur la ligne et dans le plateau.
- **Une piste à l'échelle de l'ingrédient** : 0–2 kg sous 1 kg, jusqu'à la masse arrondie au-dessus, comme les pistes de r4-a.
- **L'annexe des états** hors du premier écran, à 390 et à 1280.

## Captures (ouvertes en image une à une avant de dire OK, L12)
Le repos à 390 et à 1280, plus chaque état que tu as changé. Rien d'autre (D207).

## Contrôles
Ceux de ta NOTE.md, rejoués sur `v2 <id2>` : `verifier-page`, `mots-premier-ecran --max=80`, `controle-contraste`, `controle-commun`,
`controle-hauteur` (tous avec `--profil=sans-houblons` quand ta note l'emploie), et `controle-panel.mjs <repos-390.png>` : lire le
remplissage (≥ 0,80) ; la diversité est sans objet sur une seule maquette. Un écart qui reste se dit dans la NOTE avec sa raison.

## Rendre
Plafond : 40 tours. Retour en une ligne : `OK — <id2> : <n> corrections faites sur <n>, remplissage <x> ; <contrôles> — <chemin de NOTE.md>`
ou `ECHEC — …`.
