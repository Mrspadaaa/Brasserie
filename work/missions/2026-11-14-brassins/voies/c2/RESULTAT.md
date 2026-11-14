OK — accepté : 26 problèmes, 7 bloquants ; MONTRER s2a2 ; CORRIGER s1e2, s1g, s3b2 (VERDICT.md)

Les 24 captures ont été ouvertes : 390 clair (repos, geste, dry hop, liste), 390 cave et 1280 clair pour chaque variante. Quatre
zones ont été agrandies ×3. Les chiffres ont été comparés à BRIEF-AUTEUR § « Les chiffres ». Le détail, une liste numérotée par
variante, est dans `VERDICT.md`.

- **s1e2** (La courbe pointe le geste) — ACCEPTÉ, à CORRIGER avant de montrer. Il y a trois bloquants : la Blanche LOT-011 est
  inventée dans la liste ; la pastille ① est cachée sous la ② ; à 1280, les °C d'échantillon sont faux (20,1 et 19,8 au lieu de 20,5
  et 20,0) et celui du 09.11 est inventé.
  Phrase prédite : « très bien, mais c'est quoi cette Blanche ? ».
  Corrections : retirer la Blanche, décaler ②, reprendre les °C d'échantillon des chiffres (« — » au 09.11), caler les marches à J+7
  et J+10.
- **s1g** (La courbe porte les gestes) — ACCEPTÉ, à CORRIGER avant de montrer. Il y a trois bloquants : la Blanche et la Brune sont
  inventées ; à 1280, on retrouve les mêmes °C d'échantillon faux ; à 1280, la courbe chevauche « 1,018 ».
  Phrase prédite : « j'aime beaucoup, mais les cases tombent pas sous les bons jours ».
  Corrections : les mêmes, plus aligner les cases °C sur les colonnes de jour et dire « sort 180 g du stock » au repos.
- **s2a2** (Le prochain geste d'abord) — ACCEPTÉ, MONTRER. Aucun bloquant et tous les chiffres sont justes.
  Phrase prédite : « ça c'est clair, très bien ».
  Réserves : espaces doubles dans « 21 °C » et « 2 °C » ; aucun crayon sur la valeur du geste ; « provisoire » en jaune dans le
  thème cave ; textes de 12 px à 1280.
- **s3b2** (Le plan en filigrane) — ACCEPTÉ, à CORRIGER avant de montrer. Un bloquant : au dry hop, le fil pointillé chevauche
  « 1,018 ».
  Phrase prédite : « ça me parle, mais pourquoi c'est en orange ? ».
  Corrections : arrêter le fil au-dessus de l'étiquette, écrire « — » au lieu du « ? », retirer la teinte ambre de « bande
  +0,004 », montrer « éch. 20,5 °C », et remplir le 1280.

Tests : aucune suite Vitest (rien dans `src/`) ; la sortie du CHECK G1 est dans `tests.txt` (VERDICT OK).

LEÇON PROPOSÉE : une liste maquettée se remplit des seuls lots du brief. Deux variantes ont inventé des lots clos (Blanche, Brune)
pour remplir le bas, et deux tableaux 1280 ont inventé des °C d'échantillon. Ajouter au contrôle des maquettes une recherche des
noms de lot et des valeurs absents de « Les chiffres ».
