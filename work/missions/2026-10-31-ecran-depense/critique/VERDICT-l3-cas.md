# Verdict e-t14 — page de choix « le total corrigé, la 3e lecture qui n'arrive pas » (l3-cas, D312)

OK — accepté : deux questions à un facteur sur sa maquette D reprise au pixel (mesuré et vu), chiffres justes, la page dit en mots simples ce qu'on attend de lui ; un majeur à retoucher avant de publier (la référence A de la question 2 n'est pas la forme d'aujourd'hui : « 2 lectures » est neutre dans l'app, la phrase n'est pas une remarque mais le point « Lecture coupée » en chip, et « 7 lignes » passe en pointillé jaune), aucun bloquant.

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-cas-38/index.html`, ses 11 mini
maquettes (`img/*.png`, toutes ouvertes en plein format ; `img/md5.json` : 11 écrans distincts), `controle-haut.png`, `controle-page.png`
(390 × 3827), `controle-ordinateur.png`, contre ses maquettes `choix-lenteur/img/d-lue.png` et `d-15.png` (règle n° 1), le contrat
`voies/l3-cas/VOIE.md`, D308, D310, D312, les verdicts e-t11 et e-t13, et le code de l'app (`ExpenseSheet.tsx` l. 692 et 970,
`Recap.tsx` `Preuve`, `Verdict.tsx` `ChipsBar`, `etat.ts` l. 28, `confiance.ts` l. 282, `invoiceVisionReview.ts` l. 213,
`invoiceScanVote.ts` l. 64). Rejoué : `controle-page-choix.mjs --min=3` → `total-corrige : OK`, `lecture-jamais : OK`, `PAGE-CHOIX OK (2 choix)` ;
`gen.mjs --identite` → `d-lue : IDENTITE OK`, `d-15 : IDENTITE OK` ; `mesure-a.mjs` → `MESURE-A OK`. `verifier-page.mjs` non rejoué : ses trois
captures ont été ouvertes. `controle-choix` sans objet, Dépense n'est pas dans `ecrans.json` ; la base est D308 (d-lue, d-15), c'est elle que je compare.

## Les cinq questions du pilote

1. **Chaque option se comprend-elle sans mode d'emploi ?** Question 1 : A oui en trois secondes (48,00 sur bleu, 46,40 barré : la langue
   de ses rangées Pilsner, Sabro, Citra juste dessous) ; B oui (« ↻ +1,60 » en bleu, l'icône de la puce, et la rangée Munich 8,80 bleue
   l'explique) ; C à moitié : le total passe en bleu, mais le pointillé bleu est collé à la barre des familles et se voit à peine à 390
   (`q1-c.png`, y ≈ 218) ; D : rien, c'est annoncé (« rien sur le total »). Question 2 : A se lit (une phrase) ; B non en trois secondes :
   la croix jaune fait 10 px (`gen.mjs` l. 149) et la rangée n'a plus ni « · » ni ✓ (A, C, D ont le « · ») ; C oui : « non vérifiée » en
   jaune sur le fil, sans roue ; D oui : la puce jaune « ⓘ non vérifiée » dans la famille de « à contrôler » et « à remplir », là où sa
   maquette met « ↻ N corrigées ». Je signale B et C sans rejeter : ce sont des options, et leurs têtes disent leur limite.
2. **Sa maquette D est-elle intacte hors du cas ?** Oui, mesuré (`mesure-a.mjs` : 21 éléments sur 27 identiques en q1-a, les 6 autres sont le
   cas et nommés ; `q2-avant` = `d-15.png` à l'image entière ; q2-a : 23 sur 27, le fil, la rangée Lectures, la remarque et Confirmer sont le
   cas) et vu : fil, « Lectures ●●◌ », Confirmer gris avec sa roue, puce « ↻ N corrigées », cellules bleues avec l'ancienne barrée sous le nom,
   Carapils jaune, Sucre candi rouge, « 3 à remplir » pendant l'attente, bandes d'aujourd'hui sans sous-groupes. Hauteur 700 px, sans le blanc
   de 780 px d'e-t13. Les cadres bleus de ses maquettes (fil, Lectures, Confirmer, puce) restent sans légende : mineur déjà relevé en e-t11,
   l'auteur l'assume pour garder le pixel ; je ne le compte pas deux fois.
3. **Un seul facteur par question ?** Question 1 : oui, seule la marque sur le total change ; puce « ↻ 5 corrigées », bandes, rangée Munich,
   « Somme = imprimé 48,00 » identiques dans les quatre (vérifié à l'œil sur les quatre captures et sur `controle-ordinateur.png`). Question 2 :
   oui au sens de L10, le facteur est « comment l'écran dit que la 3e lecture n'est pas venue » ; l'avant commun (d-15) est montré une fois,
   l'après garde partout les valeurs rapides, leurs drapeaux (« 3 à remplir », 30 ?, 50 ?, 1 ?) et Confirmer noir. Deux options (C, D) disent
   « 2/3 », une (A) « 2 lectures », une (B) « ●●× » : la rangée fait partie du signal, c'est cohérent.
4. **Les chiffres tombent-ils juste ?** Oui, tous refaits. Q1 : 4 Kg × 2,20 = 8,80 (contre 4 × 1,80 = 7,20, +1,60) ; Malts 14,50 + 8,80 + 2,40
   = 25,70 ; total 25,70 + 6,60 + 9,80 + 5,90 = 48,00 ; 10 Kg ; « ↻ 5 corrigées » = Pilsner, Sabro, Citra (les 3 de d-lue) + Munich + le total,
   compté une fois, comme la tête le dit ; « Somme = imprimé 48,00 » ✓ ; le segment Malts de la barre s'élargit. Q2 : 15 Kg, 24,10, 46,40,
   7/7, « 2 à contrôler », « 3 à remplir » : d-15 tel quel. Aucune valeur ni nom de ses pièces (Brauhaus Ouest, 21.10.2026, Malt de Munich).
5. **La page dit-elle en mots simples ce qu'on attend de lui, sans code (L24) ?** Oui : « Deux choix : réponds par une lettre pour chacun, par
   exemple « 1 A, 2 D ». Base : ta maquette D, inchangée. » ; « Mon avis : 1 A, 2 D » avec sa raison et ses limites (forme d'e-t10) ; une
   phrase de contexte par question (« Tapé par toi, il ne change pas » dit la règle « sa saisie l'emporte » de D308 ; « une erreur après les
   lectures rapides prend la même forme » dit D312(2)) ; têtes en une ligne, « référence », « mon avis », « à construire ». Aucun nom de
   fichier, aucun code. ~55 mots avant la première image. À 1280 : quatre colonnes, la rangée Munich et le total visibles dès le premier écran.
   À 390 : deux par rangée, têtes alignées, « A en sombre », « Avant » et « D en sombre » seules sur leur rangée.

## Le point précis du pilote : A de la question 2 contre l'app d'aujourd'hui

Ce que l'app fait aujourd'hui quand la 3.8 est coupée (`invoiceScanVote.ts` l. 64 : `ajouterCoupure(…, 'delai-saute', phraseCoupure('delai-saute'))`) :
- le point `lecture-coupee` pèse (`pese: true`, origine `lecture`) ; la rangée Lectures devient `{ok:false, texte:'Lectures', valeur:'2 lectures'}`
  (`ExpenseSheet.tsx` l. 970) ; `Preuve` la rend « · » gris, « Lectures » en `text-cave-200`, et la valeur en `font-mono font-medium text-cave-50`
  (`Recap.tsx` l. 55 à 57) : **neutre, pas jaune**, 14 px ;
- la phrase « Le contrôle complémentaire n'a pas abouti… » entre dans `result.issues`, mais `remarques` (l. 692) **retire toute phrase qui est le
  message d'un point** (`filter(p=>!points.some(pt=>pt.message===p))`) : elle n'est **pas** la liste à puces de 12 px sous les comptes ; elle vit
  derrière le point ;
- le point devient une chip « Lecture coupée » (`etat.ts` l. 28, enjeu info), qui n'est pas « à sa place » (`aSaPlace`, l. 979 : ligne nulle, nom
  ni Total ni Lignes) : `ChipsBar` (`Verdict.tsx` l. 16) l'affiche à côté des comptes, **« ① Lecture coupée » en pointillé jaune** avec son rond
  numéroté ;
- `confiance.ts` l. 282 : le point cible « lignes » au niveau « repris » → le bouton **« 7 lignes » passe en pointillé jaune** (`Bandeau`,
  `border-dashed border-attention`).

Ce que `q2-a.png` montre : « 2 lectures » en jaune (`gen.mjs` l. 227, `style="color:var(--attT)"`), la phrase en liste de 12 px sous les
puces (`.l3-rem`), pas de chip, « 7 lignes » inchangé. Trois écarts à l'app d'aujourd'hui, et la tête dit « La forme d'aujourd'hui d'une 3e
lecture coupée ». L'auteur le sait à moitié (« Doutes » : « le jaune vient du plan ; le port devra l'ajouter ») ; la page, elle, affirme
« aujourd'hui ». VOIE.md décrivait A ainsi, mais c'est la page qu'il lit. C'est le majeur n° 1.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'empêche son choix ; sa maquette D est la base, mesurée (D105 sans objet, L03 tenue).

### Majeur
1. **Q2 A n'est pas « la forme d'aujourd'hui »** (`q2-a.png`, tête de A dans `index.html` l. 106 ; détail ci-dessus). Trois écarts vérifiables
   dans le code : « 2 lectures » neutre et non jaune ; la phrase portée par le point et non par la liste des remarques ; « ① Lecture coupée »
   en chip jaune et « 7 lignes » en pointillé jaune, absents. Règle : L28 (« une lecture se juge sur ses vraies pièces, champ par champ ») et
   L14 (la colonne « aujourd'hui » d'un choix se teste d'abord sur le code) ; portrait, critère 4 (l'honnêteté). Conséquence : s'il dit « A »,
   le port garderait un jaune et une phrase que l'app n'a pas, et perdrait la chip ; et D310 dit justement « le point « lecture coupée » et le
   message d'erreur à la place de la rangée d'erreur d'aujourd'hui ».
   Correction (dans `gen.mjs`, `'q2-a'`) : dessiner l'app telle qu'elle est — « · Lectures  2 lectures » en c50 (retirer le `style`), pas de
   `l3-rem`, une chip « ① Lecture coupée » pointillée jaune (le style de `.cl-pu.j` avec le rond « 1 ») à la suite de « 3 à remplir », et le
   bouton « 7 lignes » en pointillé jaune ; tête : « La forme d'aujourd'hui : « 2 lectures », le point « Lecture coupée » en jaune ; la phrase
   au toucher du point. » Régénérer, rejouer `mesure-a.mjs` (les éléments du cas changent de nom : rangée Lectures, puces, « 7 lignes »),
   `controle-page-choix.mjs --min=3`, `verifier-page.mjs --page-lot`, rouvrir `q2-a.png`. Si le pilote tient à la forme « jaune + phrase » du
   plan, elle devient une 5e option « E — le défaut du plan » sans le mot « aujourd'hui » ; mais D la couvre déjà (phrase au toucher).

### Mineurs
- `q1-c.png` : le pointillé bleu sous 48,00 touche la barre des familles (2 px au-dessus) et ne se voit pas à 390 ; C se lit « total en bleu »
  seulement. Décaler la barre de 4 px ou épaissir le pointillé (2 px). Signalé, pas corrigé : la tête dit « souligné ».
- `q1-d.png` : le total change de 46,40 à 48,00 sans marque, c'est « un 10' qui sort de null part » (DEFAUTS-COURT) ; la tête l'assume
  (« rien sur le total »), et l'auteur le dit (« il ne trouvera pas la 5e »). Il la refusera ; c'est le rôle de la plus discrète. Rien à
  corriger ; le dire au pilote.
- `q2-b.png` : la rangée Lectures perd son « · » (A, C, D l'ont) et la croix fait 10 px ; à 390 il la prendra pour une tache. Mettre la croix
  à 14 px (le corps des points) et garder le « · ». Signalé, pas corrigé : la tête dit « aucun mot ».
- `q2-c.png` : « le fil reste » est aussi la forme par défaut du hors ligne (D310 : « le fil reste, avec « réseau » dans son mot »). S'il choisit
  C, deux états garderont le fil, distingués par un mot ; à écrire dans la synthèse pour le pilote, pas sur la page.
- `q2-d.png` : « non vérifiée » sans nombre à côté de « 2 à contrôler », « 3 à remplir » ; et la puce prend la place de « ↻ N corrigées », qui ne
  peut pas apparaître puisque rien n'a été corrigé : cohérent, mais la page ne dit pas que les deux ne coexistent jamais. Un mot dans la tête
  de D (« rien n'est corrigé, donc la place est libre »). Le mot « non vérifiée » répond au « vérification » de son fil : bon.
- Sous-titre de la question 2 : « 150 s » est la borne du plan (D312), 4 fois le pire de ses 14 pièces (37,7 s). Il demandera « pourquoi
  150 s ??? ». Hors du facteur de la page ; une parenthèse « (borne du plan, réglable) » suffit, ou rien.
- Les cadres bleus de ses maquettes sans légende (e-t11, mineur repris, assumé par l'auteur).

## Greffes probables (il mélange)
- 1 A + 1 B : 48,00 sur fond bleu et « ↻ +1,60 » à côté, sans le 46,40 barré (plus court, dit le montant de la correction).
- 2 D + 2 C : la puce « non vérifiée » et, sur le fil, le mot en jaune pendant une seconde avant qu'il parte.

## Ce que je prédis qu'il dira
« 1 A ok c'est pareil que les lignes, logique. Le C on voit rien, le D non. Pour la 2, D, la puce jaune je la vois direct ; la croix B je la
vois pas et C on dirait que ça charge encore. Et 150 s c'est long non ??? »

Avis par option, comme lui :
- **1 A** : « très bien, comme les rangées » — probable.
- **1 B** : « pas mal, +1,60 je vois ce qu'il a trouvé » — mitigé-haut ; greffe possible avec A.
- **1 C** : « on voit presque rien » — mitigé-bas.
- **1 D** : « non, il change le total sans rien dire » — rejetée, c'est son refus explicite.
- **2 A** : « ça c'est le truc d'aujourd'hui avec la phrase, bof » — la référence fait son travail ; s'il la préfère, le port doit savoir
  ce qu'elle est vraiment (majeur n° 1).
- **2 B** : « je la vois pas la croix » — rejetée.
- **2 C** : « on dirait que ça tourne encore » — mitigé.
- **2 D** : « très bien, c'est dans les puces » — probable.

## Pour le pilote
Publier après le majeur (Q2 A redessinée comme l'app d'aujourd'hui : « 2 lectures » neutre, chip « ① Lecture coupée », « 7 lignes » en
pointillé jaune, pas de phrase visible ; tête corrigée), dans `choix-cas-38/outils/gen.mjs`, puis régénérer, rejouer `mesure-a.mjs`,
`controle-page-choix.mjs --min=3`, `verifier-page.mjs --page-lot`, rouvrir `q2-a.png` et `controle-ordinateur.png`. Les mineurs de q1-c et q2-b
tiennent dans la même passe. Si le pilote publie sans retouche, la page reste utilisable : il choisira 1 A et 2 D ; le risque n'est que s'il
dit « 2 A », car il choisirait alors une forme qui n'existe pas.

Verdicts :
- **q1-a** (fond bleu, l'ancien barré, référence) — ACCEPTÉ ; d-lue au pixel hors du cas.
- **q1-b** (« ↻ +1,60 ») — ACCEPTÉ.
- **q1-c** (souligné bleu) — ACCEPTÉ ; pointillé invisible à 390 (mineur).
- **q1-d** (rien sur le total) — ACCEPTÉ ; il la refusera, c'est son rôle.
- **q1-a-sombre** — ACCEPTÉ.
- **q2-avant** (d-15) — ACCEPTÉ ; identique à sa maquette.
- **q2-a** (« 2 lectures » et la phrase, référence) — ACCEPTÉ ; pas la forme d'aujourd'hui (majeur n° 1, à redessiner avant de publier).
- **q2-b** (●●×) — ACCEPTÉ ; croix 10 px, « · » perdu (mineurs).
- **q2-c** (le fil reste, figé) — ACCEPTÉ ; collision avec le hors ligne de D310 (mineur, pour le pilote).
- **q2-d** (puce « non vérifiée ») — ACCEPTÉ.
- **q2-d-sombre** — ACCEPTÉ.
- **page** (`index.html`) — ACCEPTÉ ; tête de 2 A à corriger avec la maquette.

LEÇON PROPOSÉE : une colonne « aujourd'hui » d'une page de choix se dessine depuis le rendu réel du code (la rangée, la chip, le niveau du
bouton, ce que `remarques` filtre), pas depuis la description du VOIE.md ; l'auteur rejoue le cas dans l'app ou lit les composants qui le
rendent, et nomme dans RESULTAT chaque écart entre le dessin et le code (vu ici : « 2 lectures » jaune et une phrase en remarque que l'app
n'affiche pas, la chip « Lecture coupée » et « 7 lignes » jaune absents).
