# Verdict e-t9 — voie n1-nom-fr, son choix B du nom (D289) rendu dans l'app

Critique Fable, 02.11, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : les 8 captures de
`voies/n1-nom-fr/bout-pleine/` (`390-11` à `390-14`, `1280-11` à `1280-14`), toutes ouvertes, contre sa maquette
`choix-nom/img/b-stock.png` et `b-suivantes.png` (et `f-suivantes.png`, celle qu'il n'a pas prise). Lu : `VOIE.md`, `RESULTAT.md`,
`ExpenseSheet.tsx` l. 326 à 362 (le lien à l'arrivée du français), `report.json` (`nomb-article-a/b`). Périmètre : N5 (« Sur la
facture » à la fiche) et la facture suivante ; le reste de la feuille Dépense n'est pas en jeu.

## Verdict : REJETÉ — la facture suivante rend F (lien « proposé » jaune, « Garder »), pas B (reliée, cube coché)

La fiche est sa maquette, au mot près : il dirait « ok ». La facture suivante ne l'est pas : il a vu B (reliée, sûre) à côté de F
(« B, mais une autre langue est proposée », jaune, « Garder ») et a dit « Oui b c'est très bien » ; l'app lui montre F. Ce n'est pas
un détail d'habillage : c'est la différence entre les deux colonnes qu'on lui a demandé de départager.

## Capture par capture

### N5 — la fiche (`390-12-nomb-fiche.png`, `1280-12-nomb-fiche.png`) contre `b-stock.png` — ACCEPTÉ
- Trois secondes : « Malt Viennois Alpha », champ « Nom », et dessous, en petit gris, « Sur la facture : Wiener Malz Alpha ». Lu sans
  effort aux deux largeurs ; à 1280 la ligne est à sa place sous le champ, pas perdue dans la largeur.
- Côte à côte avec `b-stock.png` : même place (sous « Nom »), même taille (petit), même ton (gris), même texte (« Sur la facture : … »).
  Rien dans la liste du stock (`390-14`, `1280-14`) : pas de C. Écarts : la fiche réelle a sa ligne d'identifiant « Malt · MP-… », ses
  champs Catégorie / Unité / Seuil / Fournisseur, « Caractéristiques techniques », Épingler / Supprimer. C'est la fiche de l'app telle
  qu'elle existe ; la maquette était un recadrage. Voulu, ni perte ni mieux. Le nom « Malt Viennois » au lieu de « Malt de Vienne » :
  traduction fictive du banc, pas un écart.
- Donnée honnête : `report.json` dit `nomsFacture: ["Wiener Malz Alpha", "Vienna Malt Alpha"]` après la seconde facture ; la fiche
  après B n'est pas capturée (à ajouter au banc, une capture : il verra « Wiener Malz Alpha · Vienna Malt Alpha »).
- Sa phrase : « Ok, ça c'est bien, le nom en français et l'imprimé en dessous. »

### La facture suivante (`390-13-nomb-depense-b.png`, `1280-13-nomb-depense-b.png`) contre `b-suivantes.png` — REJET
- Ce que la capture montre : ligne « Malt Viennois Alpha · 25 Kg × 1,40 · 35,00 » avec le picto cube **jaune pointillé** (« proposé »), et
  dans le récap « 1 relié · **1 proposé** » (pastille jaune pointillée). Aux deux largeurs.
- Ce que sa maquette montre (`b-suivantes.png`) : les trois factures DE / EN / FR, chacune avec le **cube coché noir** (reliée, sûre),
  aucun « proposé », aucun « Garder » ; « Au stock : 1 fiche ».
- Ce que montre la colonne qu'il n'a **pas** prise (`f-suivantes.png`, « B, mais une autre langue est proposée ») : cube jaune
  pointillé, « article « Malt de Vienne » · proposé », bouton « Garder » jaune. C'est, trait pour trait, ce que l'app rend.
- Cause, dans le code : `ExpenseSheet.tsx` l. 352 à 359, à l'arrivée du français, `regle.cas==='meme'` pose `proposedStock` (jaune) et le
  commentaire dit « jamais `relieAuto` (le lien repose sur une traduction) ». La voie l'assume dans RESULTAT (« proposition jaune
  « Garder », jamais `relieAuto` ») sans le signaler comme écart à son choix. Le même `regle.cas==='meme'` à la lecture (l. 334) pose
  `relieAuto` : lien sûr, « relié à « … », nom déjà au stock ». Le doute « ça repose sur une traduction » est celui de l'auteur, pas le
  sien ; VOIE N3 disait « même niveau de confiance que ces règles donnent … pas de niveau inventé ».
- Règles enfreintes : règle n° 1 / **D105** (« ça semble pas du tout correspondre aux choix que j'ai fait de maquette de base ??? ») ;
  SPEC 02.11, choix B « Oui b c'est très bien », lu « Ni F (lien d'une autre langue proposé en jaune) » ; D277 dans son sens à lui :
  « sûr ou quasiment sûr, rien » — un nom français qui est exactement le nom de l'article, c'est sûr pour lui, il l'a dessiné coché.
- Voulu, perte ou mieux : **perte**. Il devra toucher « Garder » à chaque facture étrangère d'un produit qu'il a déjà, alors que B
  promettait « toute facture suivante du même produit, quelle que soit sa langue, se relie à cet article ». Et « 1 relié · 1 proposé »
  sur une facture d'une seule ligne se lit comme deux lignes.
- Sa phrase : « Pourquoi c'est en jaune ? J'ai dit B, pas F : la facture suivante doit se relier toute seule, pas me demander. »
- Correction attendue (précise) : à l'arrivée du français (`ExpenseSheet.tsx` l. 359), quand `regle.cas==='meme'` sur une ligne
  « nouvel article » intacte, poser le lien comme à la lecture : `relieAuto.current.set(l.id, regle.article.name)`, `stockAction:'existing'`,
  `stockRef`, **sans** `proposedStock` ; le cube coché et « relié à « Malt Viennois Alpha », nom déjà au stock » ; le récap dit
  « 1 relié ». Le jaune reste à ce que les règles du nom imprimé donnent déjà en jaune (`matchStockLine` avec déduction, poids non
  confirmé) ; « choisis » reste pour `ambigu` (deux candidats : jamais un lien d'office, VOIE § pièges). Test à retourner :
  `ecran-nom-b.test.tsx` (« aucune proposition « Garder » » devient « relié, pas de Garder ») ; rejouer le cas `nom-b` du banc aux deux
  largeurs et ouvrir `*-13-nomb-depense-b.png` : cube coché, « 1 relié », pas de pastille jaune.
- Ce qui ne change pas : « Confirmer » → « Vienna Malt Alpha » appris dans `nomsFacture` (N4), 1 fiche à 35 Kg (`390-14`, `1280-14`) :
  c'est « 1 fiche » de `b-suivantes.png`, juste.

### La première facture (`390-11`, `1280-11`) — hors périmètre, une note
Le plateau est fermé : le champ « article « Malt Viennois Alpha » · nouvel article » de `b-depense.png` n'est pas sur la capture
(couvert par `ecran-nom-b.test.tsx`, « Nom de l'article, ligne 1 »). Une capture plateau ouvert manque pour le juger à l'œil ; pas un rejet
ici, le pilote décide.

### Le stock après (`390-14`, `1280-14`) — ACCEPTÉ
« Malt Viennois Alpha · 35 Kg », un seul malt de ce nom sur cinq ; « Achat enregistré. ». C'est « 1 fiche » de sa maquette.

## Lignes pour `systeme.mjs voies`
- **n1-N5** (Sur la facture à la fiche) — ACCEPTÉ. Sa phrase : « Ok, ça c'est bien. » Rien à corriger ; une capture de la fiche après la
  seconde facture à ajouter (« Wiener Malz Alpha · Vienna Malt Alpha »).
- **n1-suivante** (la facture suivante reliée) — REJET : lien par le français rendu « proposé » jaune avec « Garder » (colonne F) au lieu
  de relié sûr (sa colonne B, `b-suivantes.png`) ; D105, SPEC 02.11 « Oui b … Ni F ». Correction : `relieAuto` sur `regle.cas==='meme'` à
  l'arrivée du français, jaune seulement où le nom imprimé le donne déjà, « choisis » pour `ambigu` ; rejouer `nom-b`, ouvrir `*-13`.

LEÇON PROPOSÉE : aucune (L03 couvre : un choix entre deux colonnes se reprend tel quel, un doute de l'auteur ne crée pas un niveau).

## Second passage (après D295) — ACCEPTÉ

Jugé : `voies/n1-nom-fr/bout-pleine3/` (le plus récent), les six captures `*-12-nomb-plateau-a`, `*-14-nomb-depense-b`, `*-16-nomb-fiche-2`
ouvertes en plein format aux deux largeurs, plus `*-15-nomb-stock` ; `bout-pleine3.log` : 112 OK, 0 KO, 0 ARRÊT ; `vite.log` : 0 « hmr update » /
« page reload ». Code relu : `ExpenseSheet.tsx` l. 352 à 361, `regle.cas==='meme'` à l'arrivée du français pose `relieAuto` ; `ambigu` reste
« choisis » sans lien.

### La facture suivante (`390-14`, `1280-14`) contre `b-suivantes.png` — ACCEPTÉ
- Trois secondes : ligne « Malt Viennois Alpha · 25 Kg × 1,40 · 35,00 », **cube coché noir**, récap « **1 relié** ». Plus de jaune, plus de
  « proposé », plus de « Garder », aux deux largeurs. C'est la rangée EN de `b-suivantes.png` (cube coché, « Malt de Vienne · 25 Kg × 1,40 ·
  35,00 »), au nom fictif près. Le rejet du premier passage est levé : D105 ne s'applique plus, c'est B, pas F.
- Donnée honnête : après « Confirmer », stock « Malt Viennois Alpha · 35 Kg » (`*-15`), cinq malts, aucun doublon ; `report.json` :
  `nomsFacture` reçoit « Vienna Malt Alpha ». « 1 fiche » de sa maquette.
- Sa phrase : « Voilà, là c'est bon, ça se relie tout seul. »

### La fiche après la seconde facture (`390-16`, `1280-16`) contre `b-stock.png` — ACCEPTÉ
- Sous « Nom », en petit gris : « Sur la facture : Wiener Malz Alpha · Vienna Malt Alpha ». Même place, même taille que la maquette ; les deux
  langues séparées par « · », lisible, une ligne à 390. Stock actuel 35 Kg. Mieux que la maquette (qui n'avait qu'un nom) sans rien changer
  de sa forme : c'est ce que B promettait, les noms des factures « de plusieurs langues » gardés.
- Sa phrase : « Bien, je vois les deux noms des factures. »

### Le plateau de la première facture (`390-12`, `1280-12`) contre `b-depense.png` — ACCEPTÉ
- Côte à côte : « imprimé « Wiener Malz Alpha » » en mono gris, puis quantité | Kg × prix = montant, « ✓ au centime », Ingrédient / Service /
  Matériel, « article « **Malt Viennois Alpha** » · nouvel article ⇄ », « plus ⌄ ». La structure et l'ordre sont ceux de `b-depense.png` ; le
  champ « article » porte le nom français, l'imprimé au-dessus : c'est le cœur de B (N1), vu cette fois à l'œil, pas seulement au test.
- Écarts, tous mineurs et hors du périmètre de la voie : une puce grise « nouveau » après ⇄ (le plateau de l'app, pas dans la maquette ; ni
  perte ni mieux) ; « 1,5 » et « 15 » au lieu de « 1,50 » / « 15,00 » dans les champs du plateau (format des champs de saisie existants,
  la rangée au-dessus dit bien « 1,50 » et « 15,00 ») ; à 390 le cadre bleu de la maquette était un marqueur de la page de choix, pas un état
  de l'app. Rien qu'il ne reconnaîtrait pas.
- Sa phrase : « Ok, le nom en français, l'imprimé au-dessus, c'est ce que j'ai choisi. »

### Lignes pour `systeme.mjs voies` (second passage)
- **n1-N5** (Sur la facture à la fiche) — ACCEPTÉ (deux noms après la seconde facture, vus).
- **n1-suivante** (la facture suivante reliée) — ACCEPTÉ (D295 : cube coché, « 1 relié », sans « Garder » ; `b-suivantes.png`).
- **n1-plateau** (article en français, imprimé gardé) — ACCEPTÉ (`b-depense.png`).

La passe a progressé : aucun REJET, phrase prédite positive sur les trois écrans. LEÇON PROPOSÉE : aucune.
