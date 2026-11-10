# Verdict e-t13 — page de choix « la ligne ajoutée, la ligne non relue » (l2-lignes, D310)

OK — accepté : deux questions à un facteur sur sa maquette D reprise au pixel, le geste Garder / Retirer se trouve seul, chiffres justes ; deux majeurs à retoucher avant de publier (le total qui passe de 46,40 à 48,00 sans marque en question 1 ; la rangée bleue de 1 B qui se fond dans la bande Levures en sombre), aucun bloquant.

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-lignes-38/index.html`, ses 16 mini
maquettes (`img/*.png`, toutes ouvertes en plein format ; `img/md5.json` : 11 écrans distincts, `q2-b-garder` = `q2-c-garder` = `q2-d-garder`,
`q2-*-retirer` = `q2-a`), `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`, contre sa maquette `choix-lenteur/img/d-lue.png`
(règle n° 1), le contrat `voies/l2-lignes/VOIE.md`, D308 et D310, la section 4 de `voies/l1-plan/PLAN.md`, et les verdicts e-t11, e-t12.
Rejoué : `controle-page-choix.mjs --min=3` → `ligne-ajoutee : OK (3 variantes, 4 par rangée à 1280, 2 à 390)`, `ligne-non-relue : OK (…)`,
`PAGE-CHOIX OK (2 choix)`. `verifier-page.mjs` non rejoué : ses trois captures ont été ouvertes. `controle-choix` sans objet, Dépense n'est pas
dans `ecrans.json` ; la base est d-lue (D308), et c'est elle que je compare.

## Les six questions du pilote

1. **Chaque option se comprend-elle sans mode d'emploi ?** Question 1 : oui, les quatre. A est une rangée comme les autres ; B une rangée
   bleue, C quatre pastilles bleues (la langue de sa maquette : « corrigé = pastille bleue »), D « ↻ neuve » sous le nom avec l'icône de
   la puce. Question 2 : B et D oui (deux boutons avec un mot et une icône) ; C à moitié : « ✓ » et « ✕ » seuls au bout de la rangée, à
   côté d'un « ✓ Confirmer » noir et sous le « ✕ » de fermeture. Je le signale sans rejeter (portrait, erreur 4 de mon étalonnage : trop
   dur sur un picto), c'est une option parmi trois et la tête de C le dit (« ✓ ou ✕ au bout »).
2. **Sa maquette D est-elle intacte hors de la ligne du cas ?** Oui, mesuré par l'auteur (`mesure-a.mjs`, `--identite` : `ecran({})` rend
   `d-lue.html` octet pour octet) et vu : `q2-a.png` est `d-lue.png` trait pour trait (fil parti, « Lectures 3/3 », « ↻ 3 corrigées »
   cadrée, trois cellules bleues avec l'ancienne barrée, Carapils jaune, Sucre candi rouge, Confirmer noir). Deux écarts, tous deux dits :
   la hauteur 700 → 780 px (un blanc uni de ~150 px entre Sucre candi et le pied dans chaque vignette, mineur) et, en question 1, le
   total imprimé 46,40 → 48,00 (majeur n° 1 : ce n'est pas « un nombre que la ligne change », c'est un en-tête corrigé).
3. **Un seul facteur par question ?** Question 1 : oui, seule la marque de la rangée neuve varie ; puce, bandes, sommes identiques dans
   les quatre. Question 2 : oui au sens de L10, le facteur est « ce que devient la ligne que la 3.8 ne trouve plus » (silence / barrée en
   attente / reprise à contrôler / barrée avec la question au pouce). Mais C porte deux choses à la fois : la forme jaune et le défaut
   « elle reste et elle compte » (8 lignes, Somme ≠ imprimé, 3 à contrôler), quand B et D la sortent des sommes et la retirent par défaut.
   La tête le dit (« Confirmer sans trancher : elle reste / elle part »). S'il dit « C », le pilote devra demander s'il choisit le jaune ou
   le « elle reste » ; à écrire dans la synthèse pour le pilote, pas sur la page.
4. **Le geste Garder / Retirer se trouve-t-il seul ?** B : « ✓ Garder » et « ✕ Retirer » sous le nom barré, cibles de 26 px, deux boutons
   neutres, une seule action noire (Confirmer) : oui. D : les mêmes dans un bandeau jaune au-dessus de Confirmer, avec « Avoine maltée 1,70 ·
   non relue » : oui, et au pouce. C : icônes seules, voir 1. Après le geste, un seul écran commun (« Garder » : rangée ordinaire,
   Somme ≠ imprimé 48,10 ; « Retirer » : = A) : c'est honnête et ça évite deux rangées de vignettes grises.
5. **Les chiffres tombent-ils juste ?** Oui, tous vérifiés. Q1 : 20 g × 0,080 = 1,60 ; Houblons 30 + 50 + 20 = 100 g, 2,10 + 4,50 + 1,60 =
   8,20 ; total 24,10 + 8,20 + 9,80 + 5,90 = 48,00 ; 8 lignes, 8/8, 7 reliés, 4 corrigées, segments de la barre recalculés. Q2 : 0,5 Kg ×
   3,40 = 1,70 ; Malts 5 + 4 + 1 + 0,5 = 10,5 Kg, 14,50 + 7,20 + 2,40 + 1,70 = 25,80 ; gardée : 25,80 + 6,60 + 9,80 + 5,90 = 48,10 ≠ 46,40,
   8 lignes, 7 reliés ; en B et D elle est hors des sommes (7 lignes, 46,40) et compte dans la puce (4) ; en C elle compte partout (8 lignes,
   3 à contrôler, 3 corrigées) ; après « Garder », 3 corrigées et 2 à contrôler. Chaque option est cohérente avec sa propre règle. Aucune
   valeur ni nom de ses pièces (Brauhaus Ouest, Mosaic, Avoine maltée).
6. **La page dit-elle ce qu'on attend de lui, sans code (L24) ?** Oui : « Deux choix, une lettre chacun. Base : ta maquette D à l'arrivée
   de la 3e lecture, inchangée. », « Mon avis : 1 B, 2 B » avec sa raison et ses limites ; chaque question en une phrase de contexte ; les
   têtes de colonne en une ligne, « référence », « mon avis », « à construire », « à ne pas faire ». ~60 mots avant la première image,
   comme e-t11. À 1280 : quatre colonnes, la rangée Mosaic ou Avoine visible dès le premier écran. À 390 : deux par rangée, têtes
   alignées, « B en sombre » et la ligne commune « Après son geste » seules sur leur rangée.

## Les doutes de l'auteur, tranchés

- **Le bleu de 1 B contre la bande Levures.** Fondé, surtout en sombre : dans `q1-b-sombre.png`, la rangée Mosaic (`rgb(134 185 230/.16)`)
  et la bande Levures (`rgb(47 98 150/.2)`) font un seul bloc ; en clair aussi la rangée se lit comme le début de Levures, le filet vert de
  4 px ne suffit pas. Ce n'est pas la teinte qu'il faut changer (le bleu est la langue de sa maquette) mais la rangée doit porter la marque
  des corrections : le « ↻ » de la puce devant le nom (greffe de D), ou le nom et le montant en bleu comme les quantités déjà. Majeur n° 2.
- **Le pointillé sur le filet de famille (2 B, 2 C).** Mineur : `outline-offset:-2px` recouvre le filet orange des Malts, la rangée a l'air
  de sortir de sa famille. Commencer le pointillé après le filet (marge gauche de 4 px) ou, en C, laisser le fond jaune seul comme les
  cellules D277, sans pointillé.
- **Le mot « non relue ».** À remplacer : « relue » se lit « pas encore relue », une attente, alors que la 3e lecture est finie et ne la
  trouve pas. « pas retrouvée » (deux mots, même taille) dit le fait. Mineur, dans `gen.mjs` (2 C, 2 D) et la tête de D.
- **Plusieurs lignes non relues en D.** Mineur : une ligne dans la tête de D (« plusieurs : une question à la fois, « 1/2 » »), rien à
  dessiner avant son choix ; B et C n'ont pas ce problème, chaque rangée porte son geste.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'empêche son choix ; sa maquette D est la base, mesurée (D105 sans objet, L03 tenue).

### Majeurs
1. **Question 1 : le total imprimé passe de 46,40 à 48,00 sans marque, dans les quatre options** (`q1-a.png` à `q1-d.png` : « 48,00 CHF »,
   « Somme = imprimé 48,00 », rien de bleu ni de barré ; `gen.mjs` l. 210 le choisit exprès). C'est un en-tête corrigé par la 3e lecture,
   et D310 fixe sa forme : « en-tête corrigé = fond bleu et ancienne valeur barrée sur le champ, compté dans la puce ». Ici il n'est ni
   marqué ni compté (« 4 corrigées » compte Mosaic seule). Pour lui c'est « un 10' qui sort de null part » (DEFAUTS-COURT, « ce qui sort de
   nulle part ») : il voit son total changer et rien ne le lui dit. Correction, la plus simple et la plus honnête : garder l'imprimé de sa
   maquette (46,40) et laisser la somme des lignes tomber à 48,00, donc « Somme ≠ imprimé 48,00 » en attention, comme la page le fait déjà
   après « Garder » en question 2 ; l'en-tête reste alors celui de d-lue au pixel, et il voit que la ligne ajoutée est à vérifier sur le
   papier. Sinon, dessiner l'en-tête corrigé (48,00 sur bleu, 46,40 barré, « 5 corrigées »), mais c'est un second facteur sur la page. Dans
   `gen.mjs` (Q1 : `total`, `sommeKo`), régénérer, rejouer `mesure-a.mjs` et `controle-page-choix.mjs --min=3`.
2. **Question 1 B : la rangée bleue se fond dans la bande Levures** (`q1-b.png`, `q1-b-sombre.png`), voir « doutes ». En trois secondes il lit
   Mosaic comme la première ligne des levures, c'est le critère 1 du portrait. L'auteur le dit dans « Limites », mais une limite qu'on peut
   lever ne se publie pas : poser le « ↻ » de la puce devant le nom (16 px, bleu), ou passer le nom et le montant en bleu. La rangée reste
   bleue et sans ancienne valeur ; l'option reste B.

### Mineurs
- `q2-c-arrivee.png` : « ✓ » et « ✕ » sans mot au bout de la rangée ; le ✓ à 90 px du « ✓ Confirmer ». Signalé, pas corrigé : c'est la
  nature de C (une seule hauteur) ; s'il choisit C, le port écrira les mots au premier passage.
- `q2-c-arrivee.png` : les deux icônes poussent « 1,70 » hors de la colonne des montants (x ≈ 600 contre 720).
- Toutes les vignettes : blanc uni de ~150 px entre Sucre candi et le pied (780 px au lieu de 700). Il le prendra pour un écran plus haut ;
  dire « écran de 780 px » nulle part n'est pas nécessaire, mais 700 px pour tout sauf 2 D ferait des vignettes inégales : laisser.
- 2 B et 2 D comptent la ligne dans « ↻ 4 corrigées », 2 C dans « 3 à contrôler » : cohérent par option, mais la page ne le dit pas. Un
  mot dans la tête de C (« comptée, jaune ») suffit, déjà presque là (« en jaune, comptée »).
- « non relue » → « pas retrouvée » ; pointillé sur le filet ; plusieurs lignes en D : voir « doutes ».
- Q2 B : la rangée prend deux hauteurs tant qu'il n'a pas tranché, dit dans « Limites ». C'est le prix de deux boutons avec un mot ; D le
  paie en bandeau. Rien à corriger.

## Greffes probables (il mélange)
- 1 B + 1 D : la rangée bleue avec « ↻ » devant le nom (c'est le majeur n° 2).
- 2 B + 2 C : la rangée barrée en attention mais comptée dans « à contrôler » plutôt que dans « corrigées ».
- 2 D + 2 B : le bandeau au pouce qui disparaît au premier défilement, et les boutons restent dans la rangée.

## Ce que je prédis qu'il dira
« Pour la 1, B c'est logique avec le bleu, ou C qu'on voit chaque valeur. Pour la 2, B, je vois direct ce que l'IA a enlevé et je choisis,
le D prend de la place en bas. Le C en jaune pas mal, mais si elle est pas sûre faut pas qu'elle compte dans le total. »

Avis par option, comme lui :
- **1 A** : « ben là je vois pas qu'elle est nouvelle » — la référence fait son travail.
- **1 B** : « très bien, c'est le bleu » — probable, avec « on dirait les levures » en sombre si le majeur n° 2 n'est pas levé.
- **1 C** : « pas mal, comme les autres corrections » — mitigé-haut ; c'est la plus fidèle à sa langue.
- **1 D** : « neuve ok, mais ça prend deux lignes » — mitigé.
- **2 A** : « non, elle disparaît sans rien dire » — c'est le but de la colonne.
- **2 B** : « très bien, je garde ou j'enlève » — probable.
- **2 C** : « le jaune ok, mais elle compte alors que l'IA la trouve pas ??? » — mitigé.
- **2 D** : « clair, mais le bandeau prend de la place » — mitigé.

## Pour le pilote
Publier après les deux majeurs (Q1 : imprimé 46,40 gardé et « Somme ≠ imprimé 48,00 » ; 1 B : « ↻ » devant le nom), tout dans
`choix-lignes-38/outils/gen.mjs`, puis régénérer, rejouer `mesure-a.mjs`, `controle-page-choix.mjs --min=3` et `verifier-page.mjs --page-lot`,
rouvrir `q1-a.png`, `q1-b.png`, `q1-b-sombre.png`. Les mineurs (« pas retrouvée », pointillé après le filet) tiennent dans la même passe.
Si le pilote publie sans retouche, la page reste utilisable : il choisira, et demandera pourquoi son total a changé tout seul.

Verdicts :
- **q1-a** (sans marque, référence) — ACCEPTÉ ; total 48,00 sans marque (majeur n° 1).
- **q1-b** (rangée en bleu) — ACCEPTÉ ; se fond dans Levures (majeur n° 2).
- **q1-c** (chaque valeur en bleu) — ACCEPTÉ.
- **q1-d** (« ↻ neuve ») — ACCEPTÉ.
- **q2-a** (retirée sans marque) — ACCEPTÉ ; d-lue au pixel.
- **q2-b** (barrée sur place) — ACCEPTÉ ; pointillé sur le filet (mineur).
- **q2-c** (en jaune, comptée) — ACCEPTÉ ; icônes seules, montant décalé (mineurs).
- **q2-d** (au pouce) — ACCEPTÉ ; plusieurs lignes à dire dans la tête (mineur).
- **page** (`index.html`) — ACCEPTÉ ; « non relue » → « pas retrouvée ».

LEÇON PROPOSÉE : une mini maquette qui change un nombre de l'en-tête de sa maquette (total, HT, TVA, date) pour faire tomber ses sommes
le montre comme une correction, dans la forme déjà décidée (D310 : bleu, ancienne barrée, compté), ou garde l'en-tête et laisse la preuve
dire l'écart ; un nombre qui change sans marque est « un 10' qui sort de nulle part » (vu ici, Q1 : 46,40 → 48,00 silencieux).
