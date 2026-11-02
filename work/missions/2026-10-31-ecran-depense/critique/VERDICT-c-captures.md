# Verdict e-t10 — page de choix « plusieurs captures pour une seule dépense » (c-captures, D273b)

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-captures/index.html`, ses 18 mini
maquettes (`choix-captures/img/*.png`, toutes ouvertes en plein format), `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`,
contre l'écran actuel (`voies/e-bout/essai3/390-01-etat-vide.png`, `voies/p3c-port/captures/tactile390-lecture.png`,
`voies/f3-rangees/captures/tactile390-clair-repos.png`) et la forme acceptée `choix-nom` (verdict e-t8).
Rejoué : `controle-page-choix.mjs --min=3` → `plusieurs-captures : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
`verifier-page.mjs` non rejoué (Chrome) : ses trois captures ont été ouvertes et jugées.
Vérifié au code : `ExpenseSheet.tsx` l. 993 (`fileInput`, `accept` sans `multiple`, `files?.[0]`), l. 994 (`cameraInput`,
`capture="environment"`, `files?.[0]`), l. 912 (dépôt, `dataTransfer.files?.[0]`) ; « Ouvrir le PDF original » et « Changer » dans
`src/ui/depense/Entete.tsx` (`Justificatif`).

## Verdict : ACCEPTÉ — publiable, deux majeurs à retoucher avant (un quart d'heure), aucun bloquant

La page pose une seule question (comment les pages entrent dans une dépense), chaque option ne fait varier que le geste d'entrée et la trace
des pages, la colonne A dit la vérité du code d'aujourd'hui, les écrans « lue » sont ceux de f3 recadrés, et les « = A / = C / = D / = B »
grisés (le majeur n° 1 de e-t8, corrigé ici) font tomber l'œil sur ce qui change. Il pourra choisir. Ce qui le fera râler : deux écrans
« Pendant l'ajout » à moitié vides qui font paraître B et E plus pauvres que C pour une raison qui n'est pas le geste, et une « proposée »
sans sa limite.

## Les cinq questions du pilote

1. **Une seule question, un seul facteur** — oui. A : un fichier. B : « + page » puis « Lire ». C : plusieurs d'un coup, ordre par
   glisser, lecture immédiate. D : mode pages à l'appareil photo (« + page », « Terminer »). E = B + C. F = C + D. La dépense lue est la
   même de B à F (`c/d/e/f-lue` = `b-lue` au pixel, grisées « = B ») : la trace ne dépend pas du geste, et l'auteur le dit. L'entrée de B
   est celle d'aujourd'hui (`b-entree` = A), celle de E est C, le « pendant » de F est D. Rien d'autre ne bouge : bandeau, preuve, bandes,
   pied identiques. Propre (L10). Une seule entorse, qui fait le majeur n° 1 : le bas de `b-pendant` et `e-pendant` n'est pas celui de
   `c-pendant`, et ça, ce n'est pas le facteur.
2. **La colonne A dit-elle la vérité ?** Oui, mesurée au code. `a-entree.png` est `390-01-etat-vide.png` trait pour trait (« Choisir le
   document », « Photographier le ticket », « PDF ou image · lecture automatique · 4 Mo max. », « Saisir sans justificatif »).
   `a-pendant.png` reprend l'état « lecture » de `tactile390-lecture.png` (nom du fichier, taille, frise « envoi ✓ · lecture ·
   vérification », « Les lignes arrivent ici », « Pour quoi ? après la lecture », « Règlement Déjà payé · À payer »), avec un seul
   fichier PDF. `a-lue.png` : l'icône document en haut à droite, « Ouvrir le PDF original » et « Changer », comme `Entete.tsx`.
   La tête de A donne la mesure du pilote (« PDF de 3 pages : 9/12 en ligne ; 3 images : 11/12 au banc (doc10) »). Le cadre jaune
   « Avant, dans une autre app : 3 captures → 1 PDF » est un commentaire posé dans l'écran, pas un écran de l'app ; il est marqué comme
   tel, je le range en mineur.
3. **Les « Pendant l'ajout » à moitié vides de B et E** — c'est fidèle à l'état vide d'aujourd'hui (`390-01-etat-vide.png` est vide
   sous le cadre), mais ce n'est pas honnête vis-à-vis de C : dans `c-pendant.png`, sous les pages, on voit la frise, « Les lignes
   arrivent ici », « Pour quoi ? », « Règlement » ; dans `b-pendant.png` et `e-pendant.png`, rien sous « Lire ». Or une page attachée
   sans lecture lancée est exactement l'état « fichier attaché » de l'app, qui montre déjà ces champs. Il compare en trois secondes et
   lira « B et E : rien ne se passe » ; « plus d'information utile bat plus de vide » (portrait, erreur 2). Majeur n° 1.
4. **La proposition F** — publiable telle quelle comme forme : `choix-nom` portait déjà une recommandation en une ligne, acceptée en
   e-t8, et le contrat autorise l'auteur à ajouter une option « en le disant » (il le dit dans RESULTAT). Ce qui manque : la raison et
   la limite. « Proposée : F ; les six restent ouvertes » ne dit pas pourquoi, et la tête de F (« Captures comme C, papier comme D ; une
   page reste un geste ») tait son prix : après un choix multiple, pas de « + page » pour une capture oubliée (E l'a, F non). B, elle,
   dit son prix (« sans délai : il la cherche encore »). Majeur n° 2. Le pilote endosse la proposition (c'est lui qui publie) ou l'ôte
   (« une ligne dans `outils/page.cjs` ») ; dans les deux cas la page tient. Je ne retire pas F : elle est la combinaison la plus
   probable de ses gestes (captures d'une commande en ligne, photos d'une facture papier), et il mélange volontiers (portrait, § 3.7).
5. **Lisible à 390 et 1280** — oui. `controle-page.png` : deux vignettes par rangée, têtes alignées, sans débordement ; les vignettes
   (~180 px) se lisent à l'agrandissement (dialog). `controle-haut.png` : ~45 mots d'en-tête, puis A et B avec ~25 et ~15 mots de tête,
   soit ~90 mots au premier écran, contre ~160 sur `choix-nom` ; convenable pour une page de choix. `controle-ordinateur.png` : six colonnes,
   les rangées « Entrée » et « Pendant l'ajout » au premier écran, et c'est la rangée « Pendant » qui porte la différence (A jaune/PDF,
   B rangée + Lire, C trois pages glissées, D écran sombre de l'appareil, E rangée + photo, F = D) : la différence se voit sans lire,
   sauf entre les six « Entrée », qui ne diffèrent que par un cadre bleu, un libellé et un picto, ce qui est la vérité de l'écran.

Aucune valeur de ses pièces : Malzhaus Nord, 14.10.2026, 48,70 ; les sommes sont justes (17 Kg = 6 + 10 + 1 ; 26,40 + 12,30 + 10,00 = 48,70 ;
200 g = 100 + 100). Un nom seulement vient d'une de ses pièces réelles (mineur, ci-dessous).

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'est enfreinte au point d'empêcher son choix. D105 sans objet : Dépense n'est pas dans
`ecrans.json`, la base est l'écran f3 et l'état vide actuel, repris trait pour trait.

### Majeurs
1. **Le bas de `b-pendant.png` et `e-pendant.png` est vide, celui de `c-pendant.png` ne l'est pas** : B et E paraissent plus pauvres que
   C pour une raison qui n'est pas le geste (L10 : rien d'autre ne varie ; portrait, erreur 2 : « plus d'information utile bat plus de
   vide »). Il lira « B : rien ne se passe » et choisira C par contraste, alors que la seule différence réelle est « Lire » contre
   « tout de suite ».
   Correction : dans les maquettes `b-pendant.html` et `e-pendant.html`, poser sous la rangée de pages la même partie basse que
   `c-pendant` : la frise « envoi ✓ · lecture · vérification » avec « envoi ✓ » pour les pages déjà choisies et « lecture » en gris
   (« dès Lire »), le cadre pointillé « Les lignes arrivent ici », « Pour quoi ? après la lecture », « Règlement Déjà payé · À payer ».
   Les trois « Pendant » se comparent alors à hauteur égale, et B/E montrent un vrai atout : l'envoi part pendant qu'il cherche la page
   suivante (utile à D261c, la lenteur). Régénérer par `outils/gen.mjs`, rejouer `controle-page-choix.mjs --min=3`.
2. **« Proposée : F » sans raison ni limite** (`index.html`, en-tête et tête de F ; `controle-haut.png`). B annonce son prix (« sans délai :
   il la cherche encore »), F non : après un choix multiple, aucune « + page » pour une capture oubliée, alors que E l'offre. Portrait,
   critère 4 (l'honnêteté) et D41 (ce qui « sort de null part ») : une recommandation sans son coût lui fera demander « et si j'en oublie
   une ??? ».
   Correction : en-tête, une ligne « Proposée : F — captures plusieurs d'un coup, papier page à page ; une page reste un geste. Mais pas
   de + page après coup : pour ça, E. » ; tête de F, ajouter « pas de + page après coup » après « une page reste un geste ». Si le pilote
   n'endosse pas la proposition, enlever la ligne et le badge « proposée » (`outils/page.cjs`), rien d'autre ne bouge.

### Mineurs
- `*-lue.png` (B à F) : « CARABELGE » en capitales est un nom de sa commande réelle (SPEC, D275). Les nombres sont fictifs, mais il
  reconnaîtra sa pièce. Remplacer par un nom générique (« Malt caramel belge »), en minuscules comme « Malt de Vienne ».
- `e-pendant.png` : « captures choisies ensemble · photo ajoutée » est une légende pour le lecteur de la page, posée dans l'écran de
  l'app (D3 : des actionnables, pas des explications). La mettre en titre de vignette (hors cadre) ou l'ôter ; la page 3 avec son picto
  d'appareil se comprend seule.
- `a-pendant.png` : le cadre jaune « Avant, dans une autre app » est un commentaire dans l'écran ; marqué, donc lisible, mais la tête de A
  dit déjà « un PDF à faire ailleurs ». Soit garder le cadre et raccourcir la tête, soit l'inverse ; pas les deux.
- `b-lue.png` à `f-lue.png` : le panneau ouvert des pages (trois vignettes de ~90 × 170 px + « Changer ») prend ~200 px sous l'en-tête
  et repousse le bandeau ; au repos, seule la pile « 3 » reste, c'est bien. Pour « compacte, comme demandé » (D275), des vignettes de
  ~56 px sur une ligne avec « Changer » à droite suffisent ; l'agrandissement se fait au toucher d'une page.
- `*-lue.png` : la preuve dit « Lectures 2/2 » pour trois pages lues en images séparées ; ambigu (deux passes ? deux pages ?). Mettre
  « 3/3 pages lues » ou garder « Lectures 2/2 » avec « 3 pages » à côté.
- `*-lue.png` : recadrage de f3 sans la rangée de pastilles (« reliés / nouveaux / bis / moutures / à contrôler ») ni TVA / Règlement de
  `tactile390-clair-repos.png`. Honnête et hors du facteur ; à dire d'une ligne dans la page (« écran recadré ») ou laisser.
- `d-pendant.png` / `f-pendant.png` : l'écran sombre est une revue après la photo du système, pas un viseur ; l'auteur le dit dans
  RESULTAT, la page ne le dit pas. Un mot dans la tête de D (« après chaque photo ») lève le doute.
- Six « Entrée » presque identiques (un cadre bleu, un libellé, un picto) : c'est la vérité de l'écran, et les « = A » / « = C » grisés
  l'assument. Rien à changer ; je le signale pour qu'on ne l'interprète pas comme D38.

## Ce que je prédis qu'il dira

« A c'est exactement le problème, je dois faire un PDF à côté. C très bien, plusieurs d'un coup. D ok pour le papier. B un clic de
plus pour rien. F ok mais si j'oublie une capture ? »

Avis par option, comme lui :
- **A** : « c'est ça le problème » — la colonne fait son travail.
- **B** : « un clic de plus » — mitigé, sauvé par le « + page » qu'il voudra garder quelque part.
- **C** : « très bien » — probable.
- **D** : « ok pour le papier » — prise avec C.
- **E** : « pas mal, le + page après » — mitigé-bon ; c'est la réponse à « si j'oublie une capture ».
- **F** : « F ok » — probable, peut-être « F mais avec le + page de E » (E + D). À signaler au pilote : C + D + le « + page » de E est
  une combinaison probable ; le code devra de toute façon changer les trois `files?.[0]` (RESULTAT, CONNAISSANCE).

## Pour le pilote
Publier après les deux majeurs (bas de `b-pendant` et `e-pendant` ; ligne « Proposée » et tête de F), régénération par
`choix-captures/outils/gen.mjs`, puis rejouer `controle-page-choix.mjs --min=3` et `verifier-page.mjs --page-lot`, et rouvrir
`controle-ordinateur.png` et `controle-haut.png`. Si le pilote publie sans retouche, la page reste utilisable : il choisira quand même,
avec un biais contre B et E.

LEÇON PROPOSÉE : aucune.
