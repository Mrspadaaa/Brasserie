# Verdict e-t12 — page de choix « les sous-familles dans une bande » (r2-sousfamilles, D306)

OK — accepté : cinq options vraiment distinctes sur la bande de p3c-3 reprise au pixel, la question en une ligne, chiffres justes partout ; un majeur à retoucher avant de publier (le sous-total de quantité par sous-famille, D235), aucun bloquant.

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-sousfamilles/index.html`, ses 20 mini
maquettes (`img/*.png`, toutes ouvertes en plein format, clair et sombre), `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`,
`controle/rangee-cote-a-cote.png`, contre la bande servie (`voies/p3c-bandes/captures/tactile390-nettoyage.png`,
`voies/f3-rangees/captures/tactile390-clair-repos.png`) et sa maquette choisie (`v3/p3c-3/p3c-3-repos.png`), et la forme acceptée de
`choix-nom` / `choix-captures` (e-t8, e-t10).
Rejoué : `controle-page-choix.mjs --min=4` → `sous-familles : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
Grep des noms de ses pièces (carabelge, rauchshop, wiener, pilsner, hallertau, chemipro, kronkorken, boutique fictive, infomaniak) sur
`maquettes/` et `index.html` : 0. `outils/sf.css` : seules règles neuves, toutes `sf-` (L26) ; `--sf-fam-renovation` = `--dp-fam-renovation`
de `src/ui/depense/p3c.css` (120 112 28 / 196 186 90). `verifier-page.mjs` non rejoué (Chrome) : ses captures ont été ouvertes et jugées.
`controle-choix` sans objet : Dépense n'est pas dans `ecrans.json` ; la base est p3c-3 portée (p3c-bandes, f3), et c'est elle que je compare.

## Verdict par option et pour la page

- **page** (`index.html`) — ACCEPTÉ. Une question, une ligne : « Dans une bande de famille (vue Catégorie), comment vois-tu la
  sous-famille de chaque ligne ? ». La règle commune (une seule ou aucune sous-famille : bande d'aujourd'hui) en une ligne, et la
  proposée avec son prix (« +154 px sur 14 lignes ») : le majeur n° 2 de e-t10 n'est pas rejoué. ~54 mots d'en-tête, ~15 à 30 par tête.
  À 1280 (`controle-ordinateur.png`), les cinq vues Rénovation se distinguent sans lire : liste nue, sous-titres rayés, pastilles sur les
  rangées, sept lignes à chevron, nuage de pastilles en tête. Aucune vignette n'a à être grisée « = X ». À 390 (`controle-page.png`), deux
  par rangée, têtes alignées par sous-grille, pas de débordement. Il pourra choisir, et dire ce qu'il garde de chacune.
  Phrase prédite : « Là on voit bien les 5, c'est pas la même chose à chaque fois. »
- **A** (aujourd'hui) — ACCEPTÉ. Rangée mesurée contre la servie (`controle/rangee-cote-a-cote.png`) : pas 28,5 px, picto 16, marge
  droite 11, début du nom 39 contre 39,5 ; même mono gras pour « 1 Stk », même gris du « × 46,00 ». Bande : point, nom, pastille de compte,
  « 23 Stk », montant, filet kaki, comme « Nettoyage 1 · 1 Kg · 18,90 » servie. Au repos (`a-repos.png`) : en-tête « Nouvelle dépense »,
  trois bandes, « + Ajouter une ligne », « Détail 473,60 / 473,60 », « Pour quoi ? », « Date de l'achat », « Fournisseur et catégorie »,
  pied Catégorie | Papier · ✓ Confirmer : l'écran f3 défilé. Il manque le chip « ① Payé le » et « Regrouper en une dépense » de la capture
  servie : deux états particuliers (doublon, paiement), pas la bande. Phrase prédite : « C'est ma vue, et là je vois pas les sous
  familles, c'est bien le problème. »
- **B** (sous-titres, proposée) — ACCEPTÉ. Sept sous-titres de 22 px, rayés de la teinte, nom · nombre · sous-total aligné sur la colonne
  des montants ; le filet de famille continue ; sommes justes (167,60 + 95,50 + 22,40 + 49,70 + 58,80 + 23,70 + 15,60 = 433,30 ; 14
  lignes, 23 Stk). Vue 2 : Houblons et Consommables (une seule sous-famille) restent nus, Nettoyage prend trois sous-titres : la règle
  commune se voit. Prix dit et visible : `b-repos.png` coupe « + Ajouter une ligne » sous le pied. C'est le « classement par famille ou
  sous familles » de D262d, toutes les lignes visibles pour vérifier la facture. Ce qui manque et qu'il réclamera : le sous-total de
  quantité (majeur n° 1). Phrase prédite : « B c'est ça le classement, on est bon. Mais la quantité par sous famille ??? »
- **C** (un mot) — ACCEPTÉ, mitigé. La pastille porte la teinte et un liseré, lisible en clair comme en sombre. Mais 10 rangées sur 14
  passent à deux hauteurs (la pastille sous le nom quand il est long), le même mot se répète (« Peinture et sols » ×3, « Quincaillerie »
  ×2) et aucun sous-total n'apparaît : l'option coûte 115 px sans répondre à « sous total de quantité » (D235). La rangée n'est plus celle
  de sa maquette dans sa hauteur, c'est la nature de l'option, et la page le dit. Phrase prédite : « ça répète le même mot partout et
  les lignes font pas la même taille, bof. »
- **D** (replié) — ACCEPTÉ, mitigé. Le plus propre au repos (363 px, `d-repos.png` montre tout le formulaire), chevron · nom · pastille de
  compte · montant, un groupe ouvert avec ses rangées intactes. Mais au repos les 14 lignes sont cachées, contre « Je veux que en un écran
  je vois le maximum d'items ajouter » (D235) et « Surtout montrer les points où l'ia n'es pas sûr » (31.10) : une ligne jaune ou rouge
  derrière un chevron fermé, c'est un défaut qu'il ne pardonnerait pas au port. La tête le dit honnêtement (« Les lignes restent cachées
  tant qu'il n'ouvre pas »), le concepteur le note dans RESULTAT ; aucune vue ne montre la règle « une ligne douteuse ouvre son groupe ».
  Un sous-groupe d'une ligne (« Divers travaux 1 », « CIP alcalin 1 ») cache une ligne derrière un toucher pour rien. Phrase prédite :
  « D c'est propre mais je vois plus mes lignes, faut que ça s'ouvre tout seul quand c'est pas sûr. »
- **E** (pastilles, ajoutée) — ACCEPTÉ. C'est l'option la plus proche de ses mots du 01.11 : « J'aime beaucoup les pastilles sur les
  items » et « un récap en haut […] avec la possibilité de clicker et avoir des renvois » (D235). Sept pastilles nom · montant sur trois
  lignes (+93 px), rangées intactes ; l'état touché (« Désinfectant 30,20 ✕ » en noir plein, `e-nettoyage.png`) ne garde que ses lignes,
  clair. Faiblesse réelle : au repos, la sous-famille d'une rangée reste invisible comme en A (« Visseuse » est dans quoi ?) ; elle
  n'apparaît qu'en filtrant. Et la pastille ne porte pas la quantité (majeur n° 1). Phrase prédite : « E les pastilles j'aime bien,
  comme en haut. Mais sur la ligne je vois pas où elle est. »

## Les cinq questions du pilote

1. **Chaque option répond-elle à « il me manque des sous-familles » sans cockpit ?** B, D, E oui, chacune à sa manière (groupes,
   groupes repliés, récap filtrant) ; C à moitié (la sous-famille se lit, rien ne se totalise) ; A est la référence et dit le manque.
   Aucune n'ajoute de texte explicatif ni de légende au premier plan (D1, D3). Tailles de texte au premier écran : nom de bande, nom de
   rangée, mono des quantités, sous-titre de B : dans le ≤ 3 de D2 à une nuance près (le sous-titre de B est un rang plus petit), ce
   que l'app fait déjà pour les plateaux. Pas de cockpit.
2. **La bande reste-t-elle sa maquette validée au pixel ?** Oui pour A (mesures ci-dessus) et pour les rangées de B, D, E (même pas,
   même colonnes : les montants de B tombent sur ceux de A au pixel dans `controle-ordinateur.png`). C change la hauteur de la rangée par
   construction. Bande : identique dans les cinq. Deux écarts honnêtes, dits par le concepteur : police web (Source Sans 3) contre police
   système du banc, boîtes égales ; fond de rangée blanc comme f3 et comme le code, contre le gris de p3c-bandes.
3. **Les options sont-elles vraiment distinctes ?** Oui, c'est la force de la page : cinq dessins différents sur la même vue, et D38
   (« quasiment identique ») ne se rejoue pas. Les vues 2 partagent Houblons et Consommables nus, c'est la règle commune et non une
   copie.
4. **Lisibles à 390, clair et sombre ?** Oui. Vues sombres de A à E ouvertes : filet et point kaki (196 186 90), sous-titres de B
   rayés d'un ton, pastilles de C avec liseré, chevrons de D, pastilles de E, tous lisibles. Le noir plein de la pastille touchée (E)
   n'est montré qu'en clair ; en sombre, `sf-ch[aria-pressed]` passe en `cave-50` sur `cave-950`, le code le prévoit.
5. **La page dit-elle sa question en une ligne ?** Oui (ci-dessus), et la proposée avec sa raison et son prix.

**Chiffres et mots entre vues** : tout concorde. Rénovation 14 lignes, 23 Stk, 433,30 dans les cinq options et dans les trois vues ;
sept sous-totaux justes et additionnés (B, D, E) ; autre facture 97,40 = 12,30 + 54,20 + 30,90, Houblons 200 g = 100 + 100, Nettoyage
« 1 Kg + 4 Stk » = 1 Kg + 1 + 1 + 2 Stk, Désinfectant 30,20 = 16,40 + 13,80 ; repos 473,60 = 18,90 + 21,40 + 433,30, 17 lignes. Les
sept sous-familles sont celles de D306, dans son ordre (B, D, E). Aucune valeur ni nom de ses pièces. Une seule incohérence de mot, mineure :
`a-repos.png` à `e-repos.png` disent « Brico Fictif SA · Travaux » (catégorie) et « · rénovation » (Pour quoi ?) ; le pilote n'a fixé
que la famille « Rénovation », pas la catégorie « Travaux » : à aligner sur r1-renovation quand elle sera tranchée.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'empêche son choix ; la bande est celle de p3c-3 portée (D105 sans objet pour
`ecrans.json`, L03 mesurée).

### Majeur
1. **Le sous-total de quantité manque sur la sous-famille** (B : `b-renovation.png`, sous-titre « Peinture et sols 3 … 167,60 » ;
   D : « Outillage ② … 95,50 » ; E : « Outillage 95,50 »). Ses mots : « Je veux aussi que ça soit trié par catégorie avec sous total de
   quantité. Par exemple je sais très bien combien d'houblon j'ai commandé » (D235), et la bande de famille montre bien « 23 Stk ». Il
   demandera « et la quantité ??? » sur B, celle qu'il choisira probablement. Correction : dans B, poser « 3 Stk » en mono gras à la place
   vide entre le nombre et le montant (même colonne que « 23 Stk » de la bande) ; dans D, idem sur la ligne repliée ; dans E, la pastille
   devient « Outillage · 2 Stk · 95,50 » ou garde le montant seul avec la quantité dans l'état touché. Pour Nettoyage, « 1 Kg » / « 2 Stk »
   comme la bande sait déjà le faire (« 1 Kg + 4 Stk »). Régénérer par `outils/gen.mjs`, rejouer `controle-page-choix.mjs --min=4`.

### Mineurs
- `d-*.png` : une vue devrait montrer une ligne à vérifier (jaune) qui ouvre son groupe d'office ; sinon il croira que D cache ce que
  l'IA n'est pas sûre d'avoir lu. Une ligne jaune dans `d-nettoyage.html` suffit.
- `d-*.png` : un sous-groupe d'une ligne (« CIP alcalin ① ») pourrait montrer sa ligne au lieu d'un chevron ; à dire dans la tête de D ou
  à dessiner.
- `e-renovation.png` : sept pastilles sur trois lignes ; au port, un défilement horizontal d'une ligne (comme les onglets du stock) coûte
  32 px au lieu de 93. Goût prêté, pas une règle : signalé seulement.
- `c-*.png` : nom long + pastille = deux hauteurs de rangée ; la pastille à droite du nom, tronquée à « Peint… », ou en teinte seule
  (point coloré devant le nom) garderait la rangée de sa maquette. À proposer en greffe, pas en retouche de C.
- `*-repos.png` : « Travaux » (catégorie) et « rénovation » (Pour quoi ?) sortent de la voie ; aligner sur r1-renovation.
- Police web contre police système, fond blanc contre gris : dits par le concepteur, sans effet sur le choix.

## Greffes probables (il mélange)
- B + E : les sous-titres de B dans la bande, les pastilles de E en tête comme filtre (son « récap en haut… clicker… renvois »).
- B qui se replie (D) : un chevron sur le sous-titre de B, ouvert par défaut, fermé d'un toucher ; une ligne douteuse ne se ferme pas.
- E + C : la pastille de E en tête, la teinte de C en point devant le nom de la rangée.

## Ce que je prédis qu'il dira
« B c'est ça le classement, on est bon. E les pastilles j'aime bien aussi, comme en haut. D c'est propre mais je vois plus mes lignes.
C ça répète partout. Mais où est la quantité par sous famille ??? Et B avec les pastilles de E ce serait bien. »

## Pour le pilote
Publier après le majeur (sous-total de quantité dans B, D, E : `outils/gen.mjs`, régénération, `controle-page-choix.mjs --min=4`,
`verifier-page.mjs --page-lot`, rouvrir `controle-ordinateur.png` et `b-renovation.png`). Si le pilote publie sans retouche, la page reste
utilisable : il choisira quand même, et réclamera la quantité au port.

LEÇON PROPOSÉE : aucune.
