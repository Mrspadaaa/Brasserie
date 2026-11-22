OK — accepté : sa lenteur D est dans l'app telle qu'il l'a choisie (fil, « Lectures ●●◌ », Confirmer gris puis noir, puce « ↻ N corrigées », bleu et barré, 1 B, 2 D, Tout valider B, total A, 3.8 coupée A), chiffres justes au centime sauf une rangée de récap qui lit le contrôle du serveur au lieu de sa frappe (défaut d'avant la voie, à relancer) ; aucun bloquant, deux majeurs, quatre mineurs

Critique Fable, 02.11, sur `voies/e-ecran/captures/cote-*.png` (20 côte à côte ouverts en image, L12 : 10 états × 390 et 1280, `lue` aussi en sombre), ses maquettes (`choix-lenteur/img/d-06`, `d-lue` ; `choix-lignes-38/img/q1-b`, `q2-d-arrivee` ; `choix-valider/img/b-arrivee` ; `choix-cas-38/img/q1-a`, `q2-a`, `q2-avant`), SPEC 02.11 (D308, D313 à D317), `src/ui/finance/ExpenseSheet.tsx` (HEAD = f48fbbd7, et f48fbbd7~1 pour l'avant), `src/ui/depense/etat.ts`, `src/domain/finance/invoicePoints.ts`, PORTRAIT v2.

- **e-ecran** (lenteur D dans la Dépense) — ACCEPTÉ. Sa phrase prédite : « Ok c'est bien la d. Go pour la mise en ligne. » Avec son « mais » s'il tape une quantité pendant l'attente : « 12 × 2,90 ça fait pas 14,50 et ça me met 7/7 ??? »

## Règle n° 1 : ses maquettes côte à côte, élément par élément

| Élément de sa maquette | Dans l'app | Capture |
|---|---|---|
| d-06 : fil de 22 px sous l'en-tête, deux traits pleins, un pointillé, « vérification » | Oui, même place, même dessin (sans le cadre bleu de la page de choix, juste) | cote-tactile390-provisoire, cote-pc1280-provisoire |
| d-06 : « Lectures ●●◌ » sans coche, à la place de « Lectures 3/3 » | Oui, deux points pleins, un pointillé | provisoire 390 et 1280 |
| d-06 : Confirmer gris avec sa roue | Oui, gris, roue à gauche, Fermer actif | provisoire 390 et 1280 |
| d-lue : le fil part, « Lectures 3/3 » coché, Confirmer noir | Oui | cote-tactile390-lue, cote-pc1280-lue, les deux -cave |
| d-lue : puce « ↻ N corrigées » au geste de filtre des autres puces, bordure et texte bleus | Oui, dernière des puces, même forme ; « 3 corrigées » = Pilsner, Sabro, Citra | lue 390, 1280, cave |
| d-lue : valeur corrigée sur fond bleu (« 5 Kg » et « 2,90 »), ancienne barrée sous le nom (« 10 Kg × 1,45 ») | Oui, au pixel près ; Sabro et Citra : « 30 g », « 50 g » bleus, « 30 g », « 50 g » barrés (la maquette dit « 30 ? » : l'app avait déduit « g », plus honnête que la maquette) | lue 390 |
| d-lue en sombre (la maquette est claire : le sombre se juge sur ses jetons) | Bleu clair sur fond cave, barré gris, puce bleue : lisible, cohérent avec la bande Levures | cote-tactile390-lue-cave, cote-pc1280-lue-cave |
| q1-b (1 B) : rangée ajoutée sur le bleu, « ↻ » devant le nom, nom, quantité, prix et montant bleus, sans ancienne valeur, dans sa bande, comptée | Oui : « ↻ Mosaic α 11,8 · 20 g × 0,080 · 1,60 » dans Houblons 3 · 100 g · 8,20 ; « 4 corrigées » ; « Somme ≠ imprimé 48,00 » | cote-tactile390-ajoutee, cote-pc1280-ajoutee |
| q2-d-arrivee (2 D) : rangée barrée grise hors des sommes, bandeau au pouce « Avoine maltée 1,70 · pas retrouvée · Garder · Retirer » au-dessus de Confirmer | Oui : Avoine barrée, Malts reste 3 · 10 Kg · 24,10, bandeau identique, « 4 corrigées » comme la maquette | cote-tactile390-perdue, cote-pc1280-perdue |
| b-arrivee (Tout valider B) : « Avoine maltée 1,70 », « pas retrouvée · 1/2 », « ↻ Tout valider » à droite, Garder et Retirer dessous, « 5 corrigées » | Oui, mot pour mot, Amarillo barrée aussi, Houblons reste 2 · 80 g · 6,60 | cote-tactile390-perdues-2, cote-pc1280-perdues-2 |
| q1-a (total A) : « 48,00 » sur le bleu, « 46,40 » barré à côté du CHF ; Munich « 2,20 » et « 8,80 » bleus, « 4 Kg × 1,80 · 7,20 » barré ; Malts 25,70 ; « 5 corrigées » | Oui, tout, et « Somme = imprimé 48,00 » | cote-tactile390-total, cote-pc1280-total |
| q2-a (3.8 coupée A) : « Lectures · 2 lectures » avec un point, chip « Lecture coupée » en attention, « 7 lignes » en attention, valeurs provisoires gardées | Oui (le rond de la chip dit 2 dans l'app, 1 dans la maquette : c'est le rang du point, pas un compte) | cote-tactile390-echec, cote-pc1280-echec |
| q2-avant : sans 3.8, l'écran final d'emblée, sans fil (« Lectures 2/2 ») | Oui, c'est l'app d'aujourd'hui | cote-tactile390-sans-38, cote-pc1280-sans-38 |
| D308 (1) : sa saisie l'emporte | Oui : « 12 Kg » tapé pendant l'attente reste, sans bleu ; le prix seul passe à « 2,90 » bleu ; la rangée suivante intacte | cote-tactile390-touchee, cote-pc1280-touchee |

Les chips voisines (« 6 proposés », « 1 nouveau », « Règlement supposée ») sont celles de l'app : sa maquette les simplifiait, il ne les lui reprochera pas. Aucun écart qu'il ne reconnaîtrait pas.

## Chiffres recalculés (honnêteté)

- `lue` : Malts 14,50 + 7,20 + 2,40 = 24,10 ; 5 + 4 + 1 = 10 Kg ; Houblons 2,10 + 4,50 = 6,60, 30 + 50 = 80 g ; total 24,10 + 6,60 + 9,80 + 5,90 = 46,40 = imprimé. 5 × 2,90 = 14,50 ✓, 30 × 0,070 = 2,10 ✓, 50 × 0,090 = 4,50 ✓. Barre à 7 segments.
- `total` : Munich 4 × 2,20 = 8,80 ✓ ; Malts 14,50 + 8,80 + 2,40 = 25,70 ; total 25,70 + 6,60 + 9,80 + 5,90 = 48,00 = nouveau total ; « Détail 48,00 / 48,00 ».
- `ajoutee` : Mosaic 20 × 0,080 = 1,60 ✓ ; Houblons 2,10 + 4,50 + 1,60 = 8,20, 100 g ; somme des lignes 24,10 + 8,20 + 9,80 + 5,90 = 48,00 ≠ imprimé 46,40 : la récap le dit (« Somme ≠ imprimé 48,00 », « Détail 48,00 / 46,40 »). Juste.
- `perdue`, `perdues-2` : Avoine 0,5 × 3,40 = 1,70 et Amarillo 25 × 0,088 = 2,20 barrées, hors des bandes (Malts 24,10, Houblons 6,60), hors de la barre, « 7 lignes » : juste. Puce 3 + 1 = 4 et 3 + 2 = 5 : comme ses maquettes.
- `touchee` : **12 × 2,90 = 34,80, montant affiché 14,50**. Bande Malts « 17 Kg · 24,10 » : 12 + 4 + 1 = 17 et 14,50 + 7,20 + 2,40 = 24,10, sommes honnêtes de ce qui est dans les lignes. La rangée « Qté × prix 7/7 » cochée est fausse pour la ligne Pilsner. Voir Majeur 1.

## Réponses aux cinq points du pilote

1. **`touchee`, la récap ment-elle ?** Oui, sur une rangée, et c'est déjà le comportement d'aujourd'hui. `ExpenseSheet.tsx:1045` : `ctl = nGardees>0 && recalcul ? recalcul.controls : result?.controls` ; avant la voie (f48fbbd7~1, l. 965) : `ctl = result?.controls`. Le « Qté × prix n/n » (l. 1051) lit donc les contrôles du serveur sur la lecture reçue (5 Kg × 2,90 = 14,50, 7 justes), jamais son brouillon, sauf après un Garder. Le recalcul existe pourtant (`etat.ts:53` → `recomputeInvoicePoints`, `invoicePoints.ts:46-50` recompte `lines.checked / failed` avec la règle du serveur `lineMathCheck`) et il nourrit déjà les points : c'est lui qui met « 12 Kg » en pointillé attention et passe « à contrôler » de 1 à 2. L'écran se contredit donc lui-même : « ✓ Qté × prix 7/7 » et « 2 à contrôler » sur la même pièce. Taper une quantité sur l'app d'aujourd'hui (sans lenteur) donne exactement le même 7/7 : la voie n'a rien cassé, elle a rendu le défaut visible. Un montant jamais recalculé à la frappe est aussi le comportement d'aujourd'hui (`updateLine`, l. 253, ne touche pas `amount`) ; le plateau ouvert dit « 12 × 2,90 ≠ montant, écart à vérifier » (l. 815). Correction, à part (Majeur 1).
2. **Écart 1, la puce sur une 2e rangée à 390.** Il la reconnaîtra : même place (dernière des puces de filtre), même forme, même bleu, et seule sur sa rangée elle se voit mieux. Les quatre chips de l'app avant elle sont les siennes depuis D275/D277. Pas un écart à son choix ; rien à corriger. À 1280 elle tient sur la 2e rangée aussi, dans la colonne de gauche : lisible.
3. **Écart 2, le bandeau dans le flux.** À 390 il est à l'endroit de sa maquette, au pouce, juste au-dessus de Catégorie | Papier et Confirmer, la liste passe dessous : conforme à q2-d et b-arrivee. À 1280 il s'étale sur 1 200 px avec Garder et Retirer à gauche et Tout valider tout à droite : ce n'est pas une forme qu'il a vue (ses maquettes sont à 390), elle n'est pas fausse mais elle est lâche. Mineur 1.
4. **Écart 3, la puce compte les lignes pas retrouvées en attente.** Garder (a) : b-arrivee dit « 5 corrigées » pour 3 corrections et 2 perdues, b-garder « 4 », q2-d-arrivee « 4 » pour 3 + 1 ; il a dit « Oui b » devant ces chiffres. Le plan m2 (corrections seules) est une règle d'agent, pas son choix : sa maquette l'emporte (règle n° 1). Rien à corriger.
5. **Écart 4, seuls total, date et fournisseur en bleu.** À prendre au sérieux : D310 fixe « en-tête corrigé = fond bleu et ancienne valeur barrée sur le champ, compté dans la puce ». Une cellule (n° de facture, TVA, HT, port) comptée mais nulle part marquée donne un « N corrigées » dont il ne retrouve pas le Nième, et le toucher de la puce (filtre sur `ids`, l. 1033, lignes seulement) ne le lui montre pas non plus. Aucune capture ne porte ce cas (les états d'aperçu ne corrigent que le total). Majeur 2.

## Bloquants

Aucun.

## Majeurs

1. **« Qté × prix n/n » lit le serveur, pas sa frappe** (`touchee`, l. 1045 et 1051 ; défaut d'avant la voie, f48fbbd7~1 l. 965). Sa règle (SPEC § 0, D277) : des vraies valeurs, un doute flaggé, jamais un faux « sûr » ; ici un ✓ 7/7 à côté d'un « 2 à contrôler » sur la même ligne. Correction, voie de code courte (Sonnet), hors de celle-ci : prendre `recalcul.controls.lines` dès qu'un recalcul existe (la règle est déjà celle du serveur, `invoicePoints.ts:2`), garder `sum` de `result` tant qu'aucune ligne n'est gardée ni ajoutée ; témoin : taper 12 dans la quantité de Pilsner → « Qté × prix 6/7 » sans coche, point attention sur la ligne ; rejouer `tests/unit/depense/**` et vérifier qu'aucune attente « 7/7 » existante ne dépendait d'une frappe. À ne pas lui montrer comme « corrigé » avant ce témoin ; à lui dire en un mot s'il le voit avant.
2. **Cellule d'en-tête corrigée, comptée, sans marque** (écart 4, D310). Correction, la plus petite : ne compter dans `fusion.n` que ce qui porte une marque visible (lignes, ajoutées, total, date, fournisseur, perdues) ; ou marquer les deux cases qui existent déjà à l'écran (TVA, Règlement) du même bleu et de la même ancienne valeur barrée. Témoin : une 3.8 qui corrige la TVA seule → puce « 1 corrigée » et la case TVA en bleu, ou aucune puce. Un état d'aperçu `lenteur-entete` à ajouter pour le voir.

## Mineurs

1. **Bandeau à 1280 étalé sur toute la feuille** (`cote-pc1280-perdue`, `cote-pc1280-perdues-2`) : Garder / Retirer à 30 px du bord gauche, Tout valider à 1 200 px. Correction : borner le bandeau à la colonne de la liste (droite) ou à 480 px alignés sur Confirmer, mêmes rangées qu'à 390. Le composant est isolé (`Pied.tsx`, `BandeauPerdues`) : la logique ne bouge pas.
2. **Libellé barré « 12 Kg × 1,45 »** (`touchee`) : un produit qui n'a jamais existé (la lecture disait 10 Kg × 1,45, lui a tapé 12). Honnête sur ce qui a été corrigé (le prix seul), mais il lira « on avait 12 × 1,45 ». Correction : barrer seulement ce qui a changé quand la quantité est la sienne (« × 1,45 »), ou « 10 Kg × 1,45 » en disant que 12 est à lui. Au choix du pilote, rien de bloquant.
3. **Dernière rangée sous le bandeau à 390** (`cote-tactile390-perdues-2` : « Sucre candi » coupée à mi-hauteur). Si la liste a un retrait bas égal à la hauteur du bandeau, un défilement jusqu'au bout la montre entière ; la capture ne le dit pas. À mesurer au banc (voie b-lenteur), ajouter le retrait sinon.
4. **« Somme ≠ imprimé » avec un point gris, pas le pictogramme ⓘ de q1-b, et le total 46,40 souligné rouge pointillé** (`ajoutee`) : c'est la langue de l'app (D277, rouge = à remplir ou corriger) sur un cas que sa maquette q1-b ne dessinait pas en détail. Il comprendra « le total ne colle plus ». Rien à corriger ; à garder en tête si la 3.8 ajoute souvent une ligne sans corriger le total.

## Rien de cassé ailleurs

- `sans-38` : l'écran d'aujourd'hui, « Lectures 2/2 », aucun fil, aucune puce, Confirmer noir, aux deux largeurs.
- Bandeau fournisseur, barre à 7 ou 8 segments, « 7 lignes » / « 8 lignes », TVA, Règlement, « + Ajouter une ligne », « Regrouper en une dépense », « Détail … / … », Pour quoi ?, Date, Fournisseur et catégorie : en place et inchangés aux deux largeurs et aux deux thèmes.
- 1280 : deux colonnes, le fil sur toute la largeur sous le titre (`pc1280-provisoire`), la puce dans la colonne de gauche, les rangées bleues et barrées dans la colonne de droite.
- Sortie de l'auteur : 121 mesures vertes, 0 erreur de console, 0 requête hors localhost, 2 278 tests verts, tsc et build à 0 dans la copie.

## Ce que la capture ne montre pas (à dire, pas à deviner)

- Le geste Garder puis Retirer un à un, et « Tout valider » qui fait partir les deux : testés (ecran.test.tsx), non capturés après le toucher. Le bandeau « 2/2 » après un Garder (b-garder) n'est pas en image.
- Le toucher de la puce « ↻ N corrigées » (filtre) : non capturé ; avec un total corrigé il montrera N − 1 rangées (le total n'est pas une ligne), comme sa maquette q1-a le laissait aussi.
- Une cellule d'en-tête autre que le total corrigée par la 3.8 (Majeur 2) : aucun état d'aperçu.
- Les 15 à 20 s réelles, le SSE en ligne, le hors ligne pendant la 3.8 : aucun appel réel (voie b-lenteur, puis sa vraie pièce, L28).
- `echec` par longueurs différentes : l'en-tête n'est pas fusionné (doute de l'auteur) : prudent, invisible ici, à relire au banc.

## Phrase prédite du brasseur

« Ok c'est bien la d, go. » Aime, sans « mais » sur les captures qu'on lui montrera (lue, perdues, ajoutée, total). Le « ??? » n'arrive que s'il tape une quantité pendant l'attente et lit « 7/7 » à côté de « 2 à contrôler » : c'est le Majeur 1, qui était déjà dans l'app avant la voie.

LEÇON PROPOSÉE : aucune (celle de l'auteur, un état de banc qui attend un geste mesure que le geste a eu lieu, est juste et à lui ; le Majeur 1 relève de L14 déjà écrite : confronter chaque nombre de la capture à la ligne qui le produit).
