# Verdict e-t8 — page de choix du nom d'un nouvel article (c-nom)

Critique Fable, 02.11, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-nom/index.html`, ses 18 mini maquettes
(`choix-nom/img/*.png`, toutes ouvertes), `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`, contre les captures de
l'écran porté (`voies/f3-rangees/captures/tactile390-clair-relie.png`, `bout/F/390-02-doc14-lignes.png`, `bout/F/390-08-doc14-stocks.png`).
Rejoué : `controle-page-choix.mjs --min=4` → `nom-article : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
`verifier-page.mjs` non rejoué (Chrome) : ses trois captures ont été ouvertes et jugées.

## Verdict : ACCEPTÉ — publiable, deux majeurs à retoucher avant (dix minutes), aucun bloquant

La page pose une seule question (le nom au stock et le lien), chaque option ne fait varier que cela, la colonne A dit la vérité mesurée
le 02.11, les rangées sont celles de p3c-3 porté. Il pourra choisir. Ce qui le fera râler : six colonnes qui se ressemblent au premier
regard, et un en-tête qui se lit avant de se voir.

## Les cinq questions du pilote

1. **Une seule question, un seul facteur** — oui. A à D ne changent que le nom entré au stock et ce que relie la facture suivante.
   E (le nom français proposé en jaune, à garder ou changer) et F (le lien entre langues proposé en jaune) restent sur le nom et le lien :
   E est la confiance dans la traduction, F la confiance dans le lien. Rien d'autre ne bouge : `b-depense` = `c-depense` = `d-depense` =
   `f-depense` au pixel, `b-stock` = `e-stock` = `f-stock`, `b-suivantes` = `d-suivantes` = `e-suivantes`. C'est propre (L10), et c'est
   aussi la source du majeur n° 1.
2. **La différence se voit-elle sans lire ?** À moitié. Ce qui se voit en trois secondes : le cadre bleu « Wiener Malz » contre « Malt de
   Vienne » (`a-depense` / `b-depense`), le cadre pointillé « 3 fiches du même malt » contre « 1 fiche » (`a-suivantes` / `b-suivantes`),
   la bande « Haferflocken = Flocons d'Avoine ? » (`d-stock`), les deux « Garder » jaunes (`f-suivantes`), le jaune sur le nom (`e-depense`).
   Ce qui ne se voit pas : sur `controle-ordinateur.png`, la première rangée (Facture 1) montre cinq vignettes identiques sur six, la
   deuxième (Au stock) quatre identiques, et la troisième rangée, celle qui porte « 3 fiches » / « 1 fiche », est sous le pli à 1280.
   Mots : l'en-tête compte ~105 mots avant la première image, plus ~55 mots de têtes de colonnes, soit ~160 au premier écran (D1 : ≤ 80).
3. **Les rangées sont-elles son écran Dépense ?** Oui pour la rangée et le plateau : filet de famille, picto cube (nouveau, relié, proposé
   jaune pointillé de `Pictos.tsx`), nom, « 6 Kg × 1,60 », montant, bande « Malts 2 · 7 Kg · 11,90 », « imprimé « … » », quantité × prix
   = montant, « ✓ au centime », Ingrédient / Service / Matériel, « article « … » · nouvel article ⇄ », « plus », pied Catégorie / Papier /
   ✓ Confirmer. Comparé à `tactile390-clair-relie.png` : il manque « Retirer » et le chevron de « plus », détails. L'en-tête n'est pas
   le sien : le récap (fournisseur, date, total, barre, pastilles) est remplacé par deux champs « Fournisseur » et « Facture : en
   allemand » qui n'existent pas dans l'app (majeur n° 2). Le Stock (`*-stock.png`) reprend la liste réelle de `390-08-doc14-stocks.png`
   (onglets, famille « Malt » avec compte, cartes « Niveau inconnu », étoile, fiche avec « Corriger l'inventaire ») sans recherche, sans
   filtres, sans barre du bas, cartes un peu plus grises : un recadrage honnête. Aucune valeur des captures f3 n'est recopiée (6 Kg × 1,60,
   1 Kg × 2,30, fournisseurs fictifs).
4. **Honnêteté** — oui. `a-suivantes.png` : DE relié (cube coché), EN et FR en « nouvel article » (cube +), trois cartes « Wiener Malz
   16 kg · Vienna Malt 25 kg · Malt de Vienne 4 kg » : exactement la mesure du pilote (« Wiener Malz » ne relie ni « Vienna Malt » ni
   « Malt de Vienne »). `a-depense.png` : la rangée dit « Malt de Vienne », le champ article « Wiener Malz » : c'est D281 tel quel.
   L'en-tête dit « Mesuré le 02.11 : … Pilsner Malz ↔ Pilsner Malt oui ; Wiener Malz ↔ Malt de Vienne … non » et « B à F … à construire
   après ton choix ». Rien n'est présenté comme existant qui ne le soit.
5. **Lisible à 390 et 1280** — oui. `controle-page.png` : deux vignettes par rangée, sans débordement, tête de colonne alignée ; les
   vignettes (~180 px) ne se lisent pas sans toucher, et le `dialog` les agrandit à min(96vw, 520px) avec titre et Fermer.
   `controle-ordinateur.png` : six colonnes de ~200 px, cadres lisibles, détail à l'agrandissement. Le thème de la page suit le système
   (sombre sur les captures de contrôle) avec des vignettes blanches : contraste net, pas de gêne.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'est enfreinte au point d'empêcher son choix ; les rangées ne dérivent pas de l'écran
porté (D105 sans objet : Dépense n'est pas dans `ecrans.json`, la base est f3).

### Majeurs
1. **Six colonnes qui se ressemblent au premier regard** (`controle-ordinateur.png`, rangées 1 et 2 ; `controle-page.png`). Treize
   vignettes sur dix-huit sont des copies de B au pixel. Il a déjà refusé une série dont « ils sont sous quasiment identique » (D38) et
   il juge en trois secondes. La différence est réelle mais sous le pli (rangée 3) ou à l'agrandissement.
   Correction : dans chaque colonne C à F, griser (opacité 0,45) les vignettes identiques à B et leur poser un petit badge « = B » dans
   le coin ; l'œil tombe alors sur la seule vignette qui change (C : stock et suivantes ; D : stock ; E : facture 1 ; F : suivantes).
   Et, sous la lettre, une balise de deux mots qui dit l'effet : A « 3 fiches », B à F « 1 fiche ». Pas de rangée déplacée : l'ordre
   dépense → stock → suivantes raconte le parcours.
2. **L'en-tête se lit avant de se voir, et un champ sort de nulle part** (`controle-haut.png` : cinq paragraphes et une légende avant la
   première image, ~105 mots ; D1 « trop de text ouvert de base », D3 ; `a-depense.png` à `f-depense.png` : « Facture · en allemand »,
   champ absent de l'app, D41 « sort de null part »). Il demandera « c'est quoi ce champ ??? » et prendra peut-être ce champ pour une
   proposition.
   Correction : garder la question (une ligne) et la recommandation (une ligne) ; déplacer la mesure sous la tête de A (« aujourd'hui :
   DE se relie, EN et FR font 2 fiches de plus — mesuré 02.11 ») et remplacer « B à F demandent… » par un badge « à construire » sur les
   cinq têtes ; la légende du carré bleu devient un titre d'image (« cadre bleu : le nom qui entre au stock ») ou disparaît, le cadre se
   comprend seul. Dans les 6 maquettes `*-depense`, remplacer les deux champs par le bandeau réel recadré (fournisseur en gras, date,
   pastille « DE » comme dans `*-suivantes`), ou simplement par la bande grise « Malzhaus Nord · DE » déjà utilisée dans les suivantes.

### Détails
- `*-depense.png` : le plateau ouvert n'a pas « Retirer » ni le chevron de « plus » (`tactile390-clair-relie.png` les a). Les ajouter,
  c'est la vue de base (« Ni la vue de base », 01.11).
- `*-stock.png` : les cartes sont d'un gris plus soutenu que `390-08-doc14-stocks.png` ; rapprocher la teinte (fond `#f1f1f1` environ).
- `d-stock.png` : « Fusionner » en bouton noir plein, sur ses données réelles. Goût prêté, pas une règle : je le signale seulement. Un
  « Fusionner » en contour et « Garder les deux » neutre évitent le toucher par réflexe.
- `e-depense.png` : « Garder » et ⇄ passent à la ligne sous le champ ; lisible, mais la rangée s'allonge d'une ligne, contre « compact ».
  Mettre « Garder » à droite du champ en réduisant le champ (il fait 290 px, 220 suffisent).
- Thème : la page suit le système, ses maquettes choisies sont « page blanche » (D106). Si sa visionneuse est sombre, la page sera
  sombre avec des vignettes blanches : acceptable ; forcer `color-scheme: light` enlève le doute.
- `c-suivantes.png` : « Wiener Malz · Vienna Malt » sous le nom : la carte s'alourdit à chaque langue, le concepteur le dit ; c'est
  l'honnêteté de C, à garder.

## Ce que je prédis qu'il dira

« B, évidemment, et D pour nettoyer ce que j'ai déjà en double. E c'est bien aussi, le jaune quand c'est pas sûr, comme pour le reste.
Mais pourquoi 6 colonnes qui se ressemblent toutes ??? Et c'est quoi "Facture en allemand" ? »

Avis par option, comme lui :
- **A** : « c'est exactement le problème, 3 fiches du même malt » — il reconnaît sa plainte, la colonne fait son travail.
- **B** : « on est bon » — choisie.
- **C** : « pas mal mais ça pollue la liste » — mitigé.
- **D** : « très bien, mais c'est moi qui fusionne » — prise avec B.
- **E** : « j'aime bien, c'est le jaune comme pour les unités » — il pourrait la combiner à B (D277 : « pas que pour les unités mais
  globalement pour tout »). À signaler au pilote : B + E + D est une combinaison probable.
- **F** : « trop de clics pour rien si la traduction est juste » — mitigé.

## Pour le pilote
Publier après les deux majeurs (un quart d'heure : CSS de la page, en-tête, bandeau des six `*-depense`, régénération par
`choix-nom/outils/gen.mjs`), puis rejouer `controle-page-choix.mjs --min=4` et `verifier-page.mjs --page-lot` et rouvrir
`controle-ordinateur.png` et `controle-haut.png`. Si le pilote publie sans retouche, la page reste utilisable : il choisira quand même.

LEÇON PROPOSÉE : aucune.
