# NOTE c2-intensite — le mode `--parcours` de controle-usage-intensite.mjs (D80)

Appel : `node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs <dossier> <route…> --page=etat.html --parcours`.
Le mode actuel (cas figés, `data-cas`, `donnees/<cas>.json`) ne change pas ; il rend toujours USAGE-INTENSITE OK sur
`fils15-s5-complexe q2b --page=etat-b.html`. Les routes sont jouées dans l'ordre donné sur la ligne de commande.

Rien de ce que l'écran déclare de lui-même ne sert d'attendu : tout vient de `window.__parcours`
(`etat.recette`, `moteur.lireBiere`, `moteur.suggerer`, `moteur.style`, `regles.hopRole`).

## U1, l'usage : toute route, avec ou sans voie

- Chaque `[data-role="usage"]` visible appartient à un houblon. Sa clé : le plus proche ancêtre (lui compris) qui porte
  `data-houblon-ligne`, `data-candidat`, `data-col` ou `data-houblon`, dans cet ordre de lecture. Pas de clé : problème.
- `data-usage` = `regles.hopRole(clé).value`, ou `inconnu` quand le moteur ne sait pas. Sinon `U1 usage : …`.
- `data-source` = `fournisseur` ou `règle`, selon que `hopRole(clé).source` commence par « fournisseur » (D80). Une forme
  longue (« règle : règle rôle-α v1 (prototype, à valider) ») ou un autre mot : `U1 source : …`.
- Chaque `[data-role="ligne-houblon"]` visible contient un usage visible, sinon `U1 usage : la ligne de … `.
- Une page sans voie ni usage : `rien lu`, jamais un OK.

## I1, l'intensité : seulement les routes qui ont des `[data-voie]`

Pour chaque voie visible, chaque famille qu'elle fait bouger d'au moins 0,5 point montre un `[data-famille][data-crans]`
visible dans la voie, à 0,6 cran au plus de l'attendu. Absent : `I1 absente`. Trop loin : `I1 écart`. Sans aucune famille
qui bouge sur la page, `I1 vide` (le contrôle ne compare rien). Une route à voies sans entrée dans la table : `I1 table`.

Table des routes (dans `lireParcours`, exécutée dans la page ; route = `body[data-route]`) :

| Route | Voie | Ce qui est comparé | À quoi |
|---|---|---|---|
| ma-biere | `data-voie` = id de l'ajout (`a1`) | les familles dont le centre du profil change d'au moins 0,5 point entre la bière avec l'ajout et sans lui (`moteur.lireBiere` des deux recettes) | `data-crans` = position de la bière au style, `profil[f].crans` : le moteur la tire de `regles.cransOf` ; `null` (inconnu) n'est jamais comparé comme 0 |
| suggerer | `data-voie` = rang, `data-candidat` = clé | les familles dont l'écart simulé du candidat (`moteur.suggerer(recette, 'floral')`, trouvé par sa clé et non par son rang) vaut 0,5 point ou plus | `data-crans` = écart ÷ cran du style (`moteur.style(code).families[f].cran`) : un gain en crans, pas une position |
| comparer | aucune | rien pour I1 (pas de `[data-voie]`) ; U1 s'applique | — |

Le contrôle n'appelle pas `cransOf` lui-même : pour Ma bière il lit son résultat (`crans`) dans `lireBiere`, pour Suggérer
il divise l'écart du moteur par le cran du style. Les deux disent « cran » mais pas la même chose : position et gain.

## Ce qui reste hors du contrôle

- **Comparer** montre l'intensité en barres et non en crans (`data-famille` sans `data-crans`) : I1 n'y est pas mesuré.
  C'est un choix de la maquette (r6a), pas un manque du contrôle ; si l'on veut D80 en crans sur Comparer, il faut une
  entrée de table et des `data-crans` sur la route.
- **La clé de Comparer** : l'usage y est rattaché à la colonne par `data-col="<clé>"` (le `data-houblon` y porte le nom
  affiché, « Cascade », pas la clé du moteur, contrairement à Ma bière et Suggérer). `data-col` est dans la liste des
  attributs, mais n'est pas dans le contrat d'ARCHITECTURE.md.
- **Fiche, Substituer, Dryhopper, Levure** : U1 s'applique à toute page demandée, mais ces routes n'ont pas été jouées
  ici (la voie demande Ma bière, Suggérer, Comparer) et n'ont pas de `[data-voie]` : leur I1 n'a pas d'entrée.
- **La visée de Suggérer** est `floral` dans la table : c'est la seule de la maquette. Une autre visée demande de la lire
  dans la page ou de changer la table.
- **L'α, les extras, l'ordre des candidats** (vérifiés dans le `jeu.mjs` de chaque écran) ne sont pas dans ce contrôle.
- **Le moment, la dose** : I1 est joué sur l'état de départ de la page, pas après un geste (le `jeu.mjs` rejoue D80 après
  les gestes de Ma bière).
- `systeme.mjs appels … --rejouer` lit l'EXPECT comme une sous-chaîne : G7 (EXPECT en `/regex/`) y échoue sans que le
  contrôle soit en cause.

## Témoins (`temoins/usage-parcours-*/etat.html`)

Pages autonomes, avec un `window.__parcours` écrit à la main (route déclarée par `body[data-route]`). Un défaut chacun.

| Témoin | Défaut | Jeton |
|---|---|---|
| ok, ok-suggerer, ok-comparer | aucun (Ma bière, Suggérer avec un candidat muet, Comparer sans voie) | passent |
| usage-faux | « amérisant » pour un houblon que `hopRole` dit aromatique | `U1 usage` |
| ligne-sans-usage | une ligne de houblon sans `[data-role="usage"]` | `U1 usage` |
| source-longue | `data-source` = forme longue de `hopRole` (le cas réel de Ma bière du 23.10) | `U1 source` |
| sans-intensite | la famille qui bouge n'a pas de `data-crans` | `I1 absente` |
| ecart | 3,4 crans affichés, le moteur dit 2 | `I1 écart` |
| route-inconnue | une voie sur une route sans entrée dans la table | `I1 table` |
| sans-famille-qui-bouge | aucune famille ne bouge | `I1 vide` |
| vide | ni voie ni usage | `rien lu` |

Chaque négatif ne rend que son jeton (vérifié un par un).
