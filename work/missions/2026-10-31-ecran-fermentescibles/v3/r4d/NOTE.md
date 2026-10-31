# r4d — la balance de r4c, avec les gestes sur la ligne (Malts/sucres 2/7, 31.10)

OK — r4d : gestes 16/16 (4 gestes × repos et #replie × 390 et 1280) ; tous les critères de GATES.md OK.

- **Base** : copie de `v2/r4c/etat.html` (non modifiée). Règle n° 1 : seuls les gestes de la ligne changent. Ticket, plateau clair,
  piste, carte des repères, teinte en dégradé, OG « — », sucre en ligne, fermentabilité par famille, alerte du lactose, « Créer « X » »,
  ajout à 0 sans surbrillance, annexe repliée : tout est repris tel quel. Les deux notes de t3 (repères qui se replient seuls, piste d'OG
  sans curseur) ne sont pas touchées.
- **Chaleur** : froide (la retenue r4c, affinée). Classes neuves `r4d-` ; script dans une fonction immédiate ; pas d'assemblage par
  remplacement de chaîne (L26).

## Les gestes
| Geste | Avant (r4c) | Maintenant (r4d) | Capture |
|---|---|---|---|
| Modifier | toucher la ligne, puis la lecture du plateau | la masse **est** un champ sur la ligne (`data-role="kg-ligne"`, `inputmode="decimal"`, `enterkeyhint="done"`, jamais `type="number"`). Au repos, un nombre : sans cadre, même chiffre mono 16 px. Un toucher : le curseur y est, la masse d'avant reste lisible en gris, la frappe la remplace (« 2,5 » sans effacer « 1,5 »). Le bandeau, la part et la barre suivent la frappe. Entrée ou la sortie valident ; Échap ou un champ vide rendent la masse d'avant ; virgule ou point ; ↑ ↓ par cran ; Tab passe à la masse suivante, puis au champ d'ajout. Le plateau ne bouge pas. | `r4d-masse-pendant` (Grain 8,0 → 9,0 kg pendant la frappe, plateau resté sur Pilsner) |
| Retirer | toucher la ligne, puis la corbeille du plateau | un × discret (14 px, gris, cible 24 × 32) en bout de ligne. Sans dialogue. La ligne laisse sa place 6 s : nom barré, « Annuler » **là où était le ×** (même doigt, même endroit), une mèche fine qui se consume en 6 s. Annuler rend la ligne à sa place ; un nouveau retrait remplace le précédent. La corbeille du plateau passe par le même retrait annulable. | `r4d-retrait-apres` |
| Ajouter | « Munich », Entrée → le curseur dans la lecture du plateau | le champ d'ajout reste en place. « Cara 0,3 », Entrée : la ligne naît à 0,30 kg, le curseur reste dans l'ajout. « Munich », Entrée : le curseur va dans la masse de la nouvelle ligne, sur la ligne (vide, « 0 » ocre en indication) ; Entrée y ramène au champ d'ajout, pour la pesée suivante. Doublon « pils » : le champ d'ajout se vide, le curseur va dans la masse de Pilsner Malz, sur sa ligne, 4 lignes. | (contrôlé, pas capturé : D207) |
| Plus d'infos | toucher la ligne | toucher le nom (`data-role="nom"`) ouvre le détail : le plateau de r4c (piste, − +, moment, couleur EBC, corbeille), la seule sous-vue. | `r4d-detail` |

- La ligne garde sa hauteur : Pilsner Malz à 270–366 px sur la capture (×2), comme dans r4c ; le nom est un bouton de 24 px aux marges négatives, la
  masse est centrée sur les deux rangs. Le × prend 24 px à droite ; la masse se décale d'autant, rien n'est tronqué.
- Accessibilité : la liste n'est plus un `listbox` (des champs dans des options) ; la ligne choisie se dit `aria-current`, le nom porte
  `aria-expanded` vers le plateau. Un rendu (après une couleur saisie, la fin des 6 s) ne vole pas une masse en cours de frappe.

## Deux états du plateau, à mettre côte à côte (L01, L24)
- **Repos** (sans ancre, `r4d-repos`) : le plateau de r4c, visible, attaché à la ligne choisie ; un toucher sur un autre nom l'y amène.
- **`#replie`** (`r4d-replie`, `r4d-detail`) : le plateau fermé au repos ; un toucher sur un nom l'ouvre, le même toucher ou son × le
  referme (Échap aussi, à l'ordinateur). Le pied remonte vers 600 px : l'écran respire, mais il reste près de 200 px vides sous le pied, avant le + (voir la phrase).

## Contrôles (31.10, depuis la racine)
- G1 `controle-gestes-ligne.mjs v3/r4d/etat.html --etats=,replie` : **GESTES OK (16)**.
- G2 témoin r4c : **ECHOUE OK (GESTES ECHEC, code 1)** (r4c : GESTES ECHEC 6).
- G3 `verifier-page.mjs` : **PAGE OK** (390 px, sans erreur).
- G4 `mots-premier-ecran.mjs` : **r4d 76 mots, MOTS OK** (r4c : 80).
- G5 `controle-commun.mjs --sans=couleurs` : **COMMUN OK** (mots, survol, blocs, contraste, standard, parlant, brutes OK).
- G6 `controle-contraste.mjs` : **CONTRASTE OK**, pire 4,85:1 (celui de r4c).
- G7 `controle-hauteur.mjs` : **HAUTEUR OK (1,04 écran)**, comme r4c.
- G8 `capturer.mjs` : **CAPTURES OK**, sans erreur. Il rejoue aussi : Échap, point puis Tab, Annuler, la fin des 6 s, le second
  toucher et le × du détail, l'ajout à 0, le doublon, « Créer », la piste (plateau et ligne à 1,0), « 0,40 », 8 lignes à 0,95 écran,
  l'annexe hors du premier écran (846 / 902 px), aucun `type="number"`. Écart du script : la rangée des sacs défile à l'horizontale
  (comme r4c) ; une puce passée le bord n'y est plus comptée comme tronquée, le reste du test est celui de r4c.

## Captures (ouvertes une à une)
390 : `r4d-repos.png`, `r4d-replie.png`, `r4d-masse-pendant.png`, `r4d-retrait-apres.png`, `r4d-detail.png`. 1280 : `r4d-1280.png`.

## Phrase prédite
« Là c'est bon : je tape direct sur le chiffre, je vire avec la croix et je peux revenir ; le plateau, je le garde ouvert, replié ça fait
vide. »
