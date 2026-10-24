# Lot « recherche avancée de houblons » (24.10, soir)

## Ses mots, mot pour mot
« Ensuite fait un artefacts de mini maquettes pour de la recherche avancée de houblons. » Avant, sur Comparer : « Problème
principal, pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un » (D137). Sur le catalogue (D21) :
« je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent ». Sur les types hors 16D (D130) : « C'est très
important surtout dans la comparaison !!!! ». Sur Galaxy et Saaz (D131 ter) : « un moyen de différencier un houblon hyper
aromatique type Galaxy d'un houblons plus "fade" type saaz ». Sur la maquette : « c'est pas ultra réactif » (D138).

## La question
Trouver le houblon qui convient quand je ne connais pas son nom : par ce qu'il sent (familles de la 16D, mot précis, mots hors
des 12 : « fruit de la passion », « cassis », « vin blanc »), son α, son usage (amérisant, aromatique, double), son moment (60′,
10′, dry hop), son huile, son origine, mon stock (en stock, à acheter), ou « comme X ». Ce qui varie : les critères ; ce qui sort :
une liste de houblons classée, chacun lisible d'un coup d'œil (L04 : nom, α, rôle, arômes en couleur, puis le reste).

## Les données (rien d'inventé ; l'inconnu en « ? », jamais 0)
- Le catalogue : `prototypes/houblons-v4/data/proto-data.json`, `varieties` (318) : `name`, `aliases`, `origin` (14 pays),
  `alpha`, `beta`, `oil` (plages), `tagsFr` (168 mots : agrumes 134, floral 113, épicé 93… fruit de la passion 32, cassis…),
  `hsLinalool`, `hsThiol` ; `stock` (16 articles).
- Les fiches détaillées (32 houblons) : `prototypes/houblons-v4/data/pack-fiches.json` (`aromes[].mots` par famille, mots hors
  des 12, huiles et composés, substituts calculés).
- Les familles et leurs pictos : la baseline (`work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html`).

## Obligatoire, et rien d'autre
- La baseline : pictos au trait des 12 familles, leurs couleurs, le thème clair (D106), téléphone 390 × 844 d'abord, saisie
  mobile (jamais type="number", [[saisie-mobile]]), mots modérés (D41), pas de cockpit (premier plan léger, détails à un toucher).
- Un vrai cas : une requête réaliste (par exemple « tropical, fruit de la passion, α < 12, dry hop, en stock » ; ou « comme
  Nelson Sauvin ») et ses vrais résultats, tirés des données ci-dessus, au moins cinq houblons.
- Les types hors 16D et le mot précis visibles dans les résultats (D130, D131 ter) ; Galaxy et Saaz s'y distinguent s'ils y sont.
- D'où on y vient : du champ « Ajouter — houblon… » de l'étape, ou de « + » de Comparer ; et où on va : l'ajouter à la recette,
  à la comparaison, ouvrir sa fiche.
- Réactif (D138) : un critère change la liste tout de suite (pas de bouton « Rechercher »).

## Chaque concept rend
`<id>/etat.html` (la recherche, critères posés, résultats ; `data-role="recherche"` sur l'écran, `data-houblon="<id>"` sur chaque
résultat) ; `<id>/NOTE.md` (chaleur, idée, ce qui tient, ce qui casse) ; `captures/<id>.png` (390 × 844). Ouvre ta capture (L12).
Une idée par concept : minimaliste veut dire une idée nette, pas un écran vide (M14).
