# Voie c-nom — le nom d'un nouvel article de stock venu d'une facture étrangère : une page de choix en mini maquettes

Agent : `concepteur` (Opus) : c'est ce qu'il voit (L25). Plafond : 60 tours. Critique Fable après la voie (e-t8), puis le pilote publie.
Aucun code de l'app modifié, aucun commit, aucun déploiement. Possède : `work/missions/2026-10-31-ecran-depense/choix-nom/**` seulement.
Avant de concevoir : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.

## La question (une seule : un facteur libre, L10)
Quand une ligne de facture en allemand, anglais ou italien crée un **nouvel article de stock**, sous quel nom l'article entre-t-il au stock,
et comment la facture suivante, dans la même langue ou une autre, retrouve-t-elle cet article ?

## Ses mots (mot pour mot, SPEC-BRASSEUR)
- 01.11 (D271) : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien »,
  « Italien possible aussi mais beaucoup plus rare ».
- 31.10 : « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ».
- 01.11 : « Il y a plein de problème sur cette vue, déjà pas de traduction. »

## Les faits (pilote, 02.11)
- Aujourd'hui (D281, décision réversible du pilote) : la rangée de la dépense montre le nom en français (« Malt Pilsner Premium »), mais le
  nouvel article est créé sous le nom imprimé (« Premium Pilsner Malz »). Les deux noms divergent entre la dépense et le stock.
- Son stock réel (lu en lecture seule le 02.11) mélange déjà les deux langues : ses propres saisies en français (« Flocons d'Avoine »,
  « Malt Chocolat », « Malt Maris Otter ») et des articles nés de factures sous le nom imprimé (« Pilsner Malz », « Weizenmalz hell »,
  « Caramünch Typ 2 », « Gerstenflocken », « Röstgerste », « Haferflocken »). **« Haferflocken » et « Flocons d'Avoine » sont le même produit,
  en deux articles** : exactement ce qu'il refuse (« plein de fiche du même produit »).
- Le moteur sait déjà : traduire le nom (`traduireNoms`, 3.8), retenir un nom que le brasseur corrige (`retenirNomBrasseur`), relier une
  ligne à un article par la clé de base du produit (`cleBase`, alias), sans dépendre de la langue du nom affiché (f4, `ficheCle.ts`).

## Les options à montrer (chacune en mini maquettes : la rangée de la dépense, l'article créé au stock, puis la facture suivante)
- **A — aujourd'hui (la référence, `data-reference`)** : article au nom imprimé ; le français seulement sur la rangée de la dépense.
  La facture suivante en allemand se relie ; une facture en français ou en anglais du même produit crée un second article.
- **B — l'article en français, le nom imprimé gardé comme alias** : l'article entre sous « Malt Pilsner Premium » ; le nom imprimé ne se
  voit qu'à la fiche (petit, « Sur la facture : Premium Pilsner Malz ») ; toute facture suivante du même produit, quelle que soit sa langue,
  se relie à cet article (cube « relié »). Recommandée par le pilote : c'est la lecture directe de « traduit en français et fait le bon lien ».
- **C — l'article en français, le nom imprimé visible au stock** : comme B, mais la liste du stock montre les deux noms (français en
  premier, imprimé en second, plus pâle).
- **D — B, et les doublons déjà là proposés à fusionner** : la vue Stock signale une fois « Haferflocken = Flocons d'Avoine ? » avec
  « Fusionner » et « Garder les deux » ; rien n'est fusionné sans son geste. (La fusion touche ses données réelles : elle attend son accord ;
  ici on ne montre que le geste.)
Tu peux ajouter une option si une vraie alternative manque (par exemple : le nom proposé en français, modifiable sur la rangée avant
« Confirmer », déjà possible par « Libellé »), en le disant. Pas d'option qui change autre chose que le nom et le lien (L10).

## La forme de la page
- Une page HTML dans `choix-nom/index.html`, ses images dans `choix-nom/img/`. Les mini maquettes sont des **captures PNG** de petites pages
  HTML que tu écris (`choix-nom/maquettes/*.html`), à 390 px de large, dans la langue de l'écran Dépense actuel : reprendre l'aspect réel
  des rangées de `src/ui/depense/Ligne.tsx` et de ses pictos (`src/ui/depense/Pictos.tsx` : cube relié, nouvel article, lien proposé),
  les couleurs de `tailwind.config` / `DESIGN.md`. Regarder pour l'aspect seulement les captures du bout en bout
  `work/missions/2026-10-31-ecran-depense/voies/f3-rangees/bout/F/` (données réelles : **ne recopier aucun prix, montant, quantité ni
  fournisseur** ; dans tes maquettes, quantités et prix fictifs, fournisseurs fictifs). Les noms de produits cités ci-dessus sont permis.
- Côte à côte : à 1280 px, les options sur une rangée (A en premier, marquée `data-reference`) ; à 390 px, deux par rangée, chaque vignette
  s'agrandit au toucher (lien vers l'image). Chaque option : sa lettre, une phrase courte, ses trois mini maquettes (dépense, stock, facture
  suivante). La recommandation du pilote dite en une ligne, sans cacher les autres.
- Peu de mots (règle principale de `affinee-frontend.md`) : la différence doit se voir sur les maquettes, pas dans un paragraphe.

## Contrôles (à rejouer toi-même, sortie décisive)
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-nom/index.html --min=4`
   → `PAGE-CHOIX OK` (dérogation au minimum de 11 : un choix de nom, pas une vue ; quatre options et la référence).
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-nom/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-nom/controle`
   → `PAGE OK`, puis **ouvrir** chaque capture de contrôle et chaque mini maquette (L12) et la juger comme lui.
3. `grep -E "CHF|Fr\\.|[0-9]+,[0-9]{2}" choix-nom/maquettes/*.html` : seulement des valeurs fictives que tu as écrites (dis lesquelles).
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT. Sa base est l'écran actuel (f3, D282 à D285) :
   tes rangées le reprennent tel quel, seul le nom et le lien varient d'une option à l'autre.

## Retour
`choix-nom/RESULTAT.md` : les options rendues, les contrôles et leurs sorties, ce que tu as vu sur tes captures, ce qui reste douteux.
Puis une ligne : `C-NOM OK — <n> options — choix-nom/index.html` ou `C-NOM ECHEC — <raison>`. `LEÇON PROPOSÉE : …` si utile.
