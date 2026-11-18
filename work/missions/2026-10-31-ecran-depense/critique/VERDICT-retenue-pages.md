# Verdict e-t12 — maquette retenue de son choix D291 (plusieurs captures pour une dépense, B + bouton noir coupé en deux)

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-captures/retenue/RESULTAT.md`,
`maquettes/*.html`, les 9 captures `img/*.png` (toutes ouvertes en plein format, ×2), côte à côte avec ce qu'il a vu et choisi
(`choix-captures/img/b-entree.png`, `b-pendant.png`, `b-lue.png`) et avec l'écran d'aujourd'hui (`voies/e-bout/essai3/390-01-etat-vide.png`,
`voies/p3c-port/captures/tactile390-lecture.png`). Ses mots (SPEC « Plusieurs captures pour une dépense », D291) : « Variante b, mais dans la
première vue, pouvoir choisir entre envoyé 1 ou plusieurs documents, dans 99% des cas c'est que 1 document » ; « Le bouton noir est splitter
en 2 ». Mesuré au HTML : moitié « Plusieurs » 124 px (f3), 96 px (f1), 52 px (f2) sur un bouton de ~356 px ; vignettes de la rangée 62 × 116 px.

## Verdict : ACCEPTÉ — base du code telle quelle, 0 bloquant, 1 majeur à trancher avant le code (pas à redessiner), 6 mineurs

C'est B, trait pour trait, avec le bouton noir coupé en deux comme il l'a dit. Il reconnaîtra chaque écran : la rangée de pages avec « + page »
et « Lire N pages », la frise, la pile « N » en haut à droite, le panneau des pages au toucher. Le geste des 99 % ne change pas : « Un document »
envoie et lit tout de suite, et l'écran qui suit (`2-un-document.png`) est l'état « lecture » d'aujourd'hui, à la lettre. Ce qui lui manquera :
le papier de deux pages. Dès que la rangée est ouverte, « Photographier le ticket » disparaît et « + page » n'ouvre que le sélecteur de fichiers.
Ce n'est pas un défaut de dessin (l'auteur le dit et ne l'a pas inventé), c'est une décision qui manque au code.

## Fidélité à B et à ses deux phrases (règle n° 1, D105)

- **Entrée** (`1-entree-f*.png` contre `b-entree.png` = aujourd'hui) : même cadre pointillé, même « Photographier le ticket », même note,
  même « Saisir sans justificatif ». Seul le bouton noir change : coupé en deux, une moitié large « un document », une moitié étroite
  « plusieurs ». C'est mot pour mot « Le bouton noir est splitter en 2 » et « choisir entre envoyé 1 ou plusieurs documents ».
- **Pendant, plusieurs** (`3-plusieurs-1.png`, `4-plusieurs-3.png` contre `b-pendant.png`) : rangée de vignettes numérotées avec ×, tuile
  « + page », bouton « Lire N pages », « ajoute la suivante, puis Lire », frise « envoi ✓ », cadre « Les lignes arrivent ici », Pour quoi,
  Règlement. Identique à B après la reprise e-t10 (bas de l'écran rempli). Seule différence : plus de cadre bleu autour de « + page »
  (c'était un état de focus de la page de choix). Rien qu'il ne reconnaîtrait pas.
- **Lecture** (`5-lecture.png`) : la carte « 3 pages · 2,1 Mo » avec la rangée compacte et la frise qui défile. B n'avait pas cet état
  (sa colonne allait de « pendant » à « lue ») ; il reprend la carte de lecture d'aujourd'hui (`tactile390-lecture.png`), le nom du fichier
  remplacé par « 3 pages ». Dérivé honnête, pas un écart.
- **Lue** (`6-lue-repos.png`, `7-lue-pages.png` contre `b-lue.png`) : la pile « 3 » à la place de l'icône du document, le panneau des pages
  au toucher avec « Changer ». Le panneau est plus bas que celui qu'il a vu (vignettes de 56 px sur une ligne, ~100 px, contre ~200 px dans
  `b-lue`) : c'est le mineur de e-t10 appliqué, dans le sens de « C'est pas du tout compacte, comme demandé » (D275). Mêmes éléments, même
  place, même geste : il le reconnaît.

Dépense n'est pas dans `ecrans.json` ; la base est son choix D291 et l'écran f3. Aucun écart hors de ses mots.

## Laquelle des trois coupes

**La forme 3** (`1-entree-f3.png` : « Un document » | « Plusieurs »), comme le pilote. Raisons :
- Sa phrase nomme les deux choix en mots, « 1 ou plusieurs documents » ; f3 est la seule qui les écrit tous les deux. En trois secondes, sans
  lire la note, on sait ce que fait chaque moitié.
- La moitié « Un document » garde 232 px sur 356 (65 %) : le geste des 99 % reste le gros du bouton, à gauche, là où il tape aujourd'hui.
- **Forme 2** (pile + « + », 52 px) : la plus proche des « 99 % » (85 % du bouton à « Un document »), mais le picto seul se lit « ajouter »
  autant que « plusieurs », et c'est son refus explicite des pictos muets (« Les icône sont pas parlant du tout », DEFAUTS). Il n'a pas choisi ce
  picto : pas de raison de parier dessus. Repli si, à l'usage, il trouve « Plusieurs » trop lourd : la forme 2 ne change rien d'autre.
- **Forme 1** (« Choisir le document » | « plusieurs », 96 px) : garde le libellé d'aujourd'hui, mais la paire n'est pas parallèle et
  « plusieurs » en minuscule se lit comme la suite de « Choisir le document… plusieurs ». Il demanderait « plusieurs quoi ??? ». La moins fidèle.

**« Un document » inchangé par rapport à aujourd'hui ?** Le geste, oui : un toucher, le sélecteur, envoi et lecture immédiats, et l'écran
`2-un-document.png` est `tactile390-lecture.png` à la lettre (nom, taille, frise, cadre, « Pour quoi ? après la lecture », « Règlement
Déjà payé · À payer »). Le libellé, non : « Choisir le document » devient « Un document », et le bouton perd 124 px. C'est la conséquence
directe de « splitter en 2 » ; si le pilote veut zéro changement de mot, c'est la forme 1, au prix de la paire bancale ci-dessus. Je garde f3.

## Compacité (D275 « C'est pas du tout compacte, comme demandé », « Pas besoin d'afficher autant »)

- Entrée : même hauteur qu'aujourd'hui, rien d'ajouté.
- Rangée (états 3 et 4) : vignettes de 116 px de haut, bouton « Lire », ligne « ajoute la suivante, puis Lire » : ~200 px avant la frise. C'est B
  tel qu'il l'a choisi ; je ne le compte pas contre la maquette. Au port, la ligne d'aide est le premier candidat à tomber (mineur 1).
- Lecture (état 5) et lue (états 6 et 7) : vignettes de 56 px, une ligne ; la pile « 3 » seule au repos ; le bandeau ne descend que de ~70 px
  quand le panneau s'ouvre. Compact. Sous 80 mots partout.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'est enfreinte ; ses deux phrases sont appliquées ; aucune valeur de ses pièces (Malzhaus Nord,
48,70, « Malt caramel belge », « commande-malzhaus.png » : tout est fictif, le nom de sa pièce ôté en e-t10 ne revient pas).

### Majeur
1. **La photo d'une page suivante n'a pas de chemin.** Dans `3-plusieurs-1.png` et `4-plusieurs-3.png`, « Photographier le ticket » a disparu et
   « + page » n'ouvre que le sélecteur de fichiers (RESULTAT, « Ce qui reste douteux »). Or « Photographier » est l'un des deux gestes de la
   première vue qu'il a fait couper, et une photo est un « document » au sens de « envoyé 1 ou plusieurs documents ». Pour une facture papier
   de deux pages, il tapera « Plusieurs », puis cherchera l'appareil photo et dira « et la photo ??? » (D41, ce qui manque sort de nulle part).
   Ce n'est pas à redessiner : à trancher dans le plan de n2-pages. Deux réponses tiennent dans l'écran tel quel : (a) « + page » ouvre un
   `input` sans `capture`, ce qui sur iOS et Android propose déjà « Prendre une photo » à côté des fichiers ; (b) garder « Photographier le
   ticket » sous la rangée, qui ajoute à la rangée quand elle est ouverte. (a) ne change rien à la maquette ; (b) ajoute un bouton de B. Le
   pilote choisit, ou lui montre les deux en mini maquettes si c'est un choix de goût (L24).

### Mineurs
1. `3-plusieurs-1.png`, `4-plusieurs-3.png` : « ajoute la suivante, puis Lire » est une explication au repos (D3). Elle est dans B tel qu'il l'a
   choisi, donc elle reste à la maquette ; au port, « + page » et « Lire N pages » disent déjà la même chose, elle peut tomber sans qu'il la
   réclame.
2. `1-entree-f3.png` : la note « PDF ou image · lecture automatique · 4 Mo max. » reste vraie pour « Un document », pas pour « Plusieurs » (la
   lecture attend « Lire »). Un mot à ajuster au port (« lecture automatique » → rien, ou « 4 Mo max. par page » quand la limite est tranchée).
3. `3-plusieurs-1.png` : « Lire 1 page » avec une seule page est le même geste que « Un document ». Honnête, pas gênant ; ne pas le masquer.
4. `5-lecture.png`, `6-lue-repos.png`, `7-lue-pages.png` : les numéros des vignettes de 56 px recouvrent le bas des lignes grises (l'auteur
   le dit). Lisible ; à affiner au port.
5. `7-lue-pages.png` : « Changer » à droite du panneau, sans dire s'il remplace tout ou une page. Dans l'écran d'aujourd'hui, « Changer » remplace
   le seul document ; ici, à dire au code (liste ci-dessous), pas à dessiner.
6. Forme 2 seule non jouée au doigt (52 × 30 px) ; sans objet si f3 est retenue (124 px).

## Ce qui manque pour le code (à trancher dans le plan de n2-pages, sans redessiner)

1. **Photo d'une page suivante** : le majeur. (a) `input` sans `capture` sous « + page », ou (b) « Photographier » gardé sous la rangée.
2. **Retrait d'une page** : avant « Lire », le × des vignettes (états 3 et 4) ; retirer la dernière page ramène-t-il à l'entrée vide ? Après
   « Lire » (états 5 à 7), aucun retrait page à page : seul « Changer ». Dire si « Changer » remplace tout (comme aujourd'hui) ou rouvre la rangée.
3. **Ordre** : ordre d'ajout, numéros 1 · 2 · 3, pas de réordonnancement (C non choisie). Une page ajoutée après coup va en fin. Dire que le
   numéro est l'ordre envoyé à la lecture.
4. **Envoi** : la frise coche « envoi ✓ » dès l'ajout d'une page (état 3) : chaque page part au moment de « + page », avant « Lire ». C'est une
   promesse de la maquette ; le code doit l'honorer (envoi par page, puis une lecture) ou la frise doit attendre.
5. **Erreur** : page au-dessus de 4 Mo ; la limite est-elle par page ou pour le tout (état 5 : « 3 pages · 2,1 Mo » sous « 4 Mo max ») ;
   nombre de pages au plus ; type refusé ; échec d'envoi d'une page (× rouge sur la vignette ?) ; échec de lecture d'une page sur trois
   (la preuve « ✓ 3 pages lues » devient quoi) ; PDF de plusieurs pages mêlé à des images.
6. **Hors ligne** : « + page » sans réseau — la frise ne peut pas cocher « envoi ✓ » ; la rangée doit-elle survivre à un rechargement
   (L12 : rechargement et réseau rendu joués dans Chrome) ; « Lire » sans réseau.
7. **Lecture** : un seul appel `aiTask` avec N `inlineData` (redéploiement, à ses accords groupés, D291) ou N appels puis fusion des lignes ;
   la preuve dit « 3 pages lues », l'écran d'aujourd'hui dit « Lectures 2/2 » : une seule forme.
8. **Annuler** : fermer × avec des pages déjà envoyées ; annuler pendant la lecture de 3 pages.
9. **Bureau** : dépôt (`dataTransfer.files?.[0]`) de plusieurs fichiers d'un coup — refuser au-delà du premier ou ouvrir la rangée ; le
   sélecteur de « + page » reste à un fichier (B, pas C).
10. **Sortie** : « Saisir sans justificatif » disparaît dès la rangée ouverte (état 3) ; retirer toutes les pages doit y ramener.
11. **Entrée** : les deux moitiés sont deux `input` (ou un seul avec un drapeau), sans toucher aux trois `files?.[0]` du geste « un document »
    (RESULTAT, CONNAISSANCE).

## Ce que je prédis qu'il dira

« Ok c'est ça. Un document à gauche, plusieurs à droite, très bien. Mais si c'est une facture papier de 2 pages, je photographie comment la
deuxième ? »

Par écran, comme lui :
- `1-entree-f3` : « c'est ça » — aime.
- `2-un-document` : rien à dire, c'est aujourd'hui.
- `3-plusieurs-1` / `4-plusieurs-3` : « ok, et la photo ? » — aime, un « mais » qui est le majeur.
- `5-lecture` : « ok ».
- `6-lue-repos` / `7-lue-pages` : « compact, bien » — aime.

## Pour le pilote
Reprendre la forme 3 telle quelle comme base de n2-pages (règle n° 1). Avant le plan du code : trancher le majeur (photo d'une page suivante,
(a) ou (b), ou mini maquettes des deux si c'est un goût), et les 11 points de la liste, en une ligne chacun dans le plan. Rien à redessiner ;
les mineurs 1, 2 et 4 se règlent au port.

LEÇON PROPOSÉE : aucune.
