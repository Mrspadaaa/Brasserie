# Dryhopper, passe 4 — sur a1, ses améliorations (24.10)

Brief commun des voies dh4a (froides et tièdes, Opus) et dh4b (chaudes, Fable). Décision : conseil complet du 24.10
(`cerveau/decisions/2026-10-24-lot-d125-vues.md`, D34) : passe 4 sur a1, pas de nouveau panel v0 ; c'est la dernière passe
avant de changer de genre (entonnoir, « quatre au plus »).

## La question de l'outil
« Quand ajouter Idaho 7 ? » Un seul facteur libre : **le moment** (par 5′ dans l'ébullition, en °C au whirlpool, en J+n à
froid). La dose, la levure et le houblon sont sur une ligne de contexte (L10, D98 : `controle-une-question.mjs`). Pont
de fin : « Puis la levure › ».

## Ses mots (mot pour mot)
- Sur a1, la vue de la maquette 23.10 : « Ajouter que cette vue là est à revoir, j'aime bien mais il y a des améliorations à
  faire » (ticket #146 : `gh issue view 146 --repo Mrspadaaa/Brasserie`, lecture seule).
- « y1b est de mon point de vue semble meilleur. » (20.10) — a1 est y1b affiné.
- x3b : « ça peut être interessant de l'utiliser jsute pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop:
  levure » ; a2b : « voir ce que la levure change reset vraiment interessant » (20.10).
- Sur le picto épicé, et vaut pour tout panel : « pas vraiment diversifié, pas de prise de risque et trop focus sur mes
  exemple » (23.10).

## Le plancher : a1
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/etat.html` (ouvre-la et joue son geste), `serie-a/passe3/NOTE.md`,
`serie-a/passe3/captures/`. La version de la maquette jouable : `prototypes/houblons-v4/maquettes/parcours-5345f6ad/dryhopper/etat.html`
et sa capture `work/refonte-frontend/v4/choix/commentaires/captures/p22-dryhopper-repos.png`. Tout ce qu'a1 fait bien reste
(L07 : plancher à enrichir, jamais à réinventer).

## Ce que la passe 4 améliore (chaque variante en prend au moins deux, et le dit dans sa NOTE)
1. **L'arôme entre deux moments** : aujourd'hui interpolé entre les moments simulés ; le moteur calcule en direct
   (`simulerCas`, 1,4 ms) : chaque cran du geste peut être calculé, ou l'interpolation dite comme telle.
2. **Le contour « chaleur ou CO₂ »** : ce que la chaleur (ébullition, whirlpool) et le CO₂ de fermentation emportent.
3. **La courbe de levure** : la fermentation active (biotransformation possible, non quantifiée) et après, sur la frise.
4. **L'inconnu n'est jamais zéro** : sur `p22-dryhopper-repos.png`, Noyau et Baies affichent « ? » avec une barre pleine.
5. **Deux facteurs à l'écran** (moment et durée de contact, 1 j à 7 j) : la durée passe en contexte, ou devient la suite
   naturelle du moment, sans second geste libre.
6. **La lecture** des deux rangées par ligne (barre, puis bande de graduations), de « WP », « actif », « ~+22 » : un premier
   regard sans légende écrite (« Pas besoin d'écrire la légende »).
7. Les **greffes** du panel de 56 concepts : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md` (section
   Greffes) ; et x3b réduit en fin de frise (« ma bière → +1 → +2 dry hops »), comme la carte des outils.

## Obligatoire, et rien d'autre (entonnoir § 0)
- La baseline : ses acquis (pictos au trait, couleurs des familles, barres l5b, au style, α, usage en mot, stock en icône),
  `controle-commun.mjs --sans=mots` passe.
- L'honnêteté : le simulé dit « ~ », l'inconnu n'est pas zéro, une interpolation se dit.
- Au doigt à 390 px ; le geste se voit (loupe ×3 sous le doigt, L12).
- Une question, un facteur libre (D98) ; peu de mots (80 au premier écran, `mots-premier-ecran.mjs --sans-donnees`).
- Le thème de ses maquettes (blanc, D106). Rien de Levure en outil propre (écran au choix ouvert) : la levure vit en
  contexte et en pont.

## Les chaleurs (D22)
- **froide** : a1 tel quel, avec deux ou trois des améliorations ci-dessus, rien d'autre ;
- **tiède** : a1 dans une forme imposée par une approche (le geste d'abord, la réponse d'abord, les vraies valeurs, x3b) ;
- **chaude** : une forme libre, qui garde la question, le geste du moment et la baseline.
Au moins 30 % de chaudes sur l'ensemble de la passe. Chaque NOTE écrit sa chaleur.

## Chaque variante rend
`passe4/<id>/etat.html` (page statique, vrais mots et vrais chiffres du moteur), son générateur s'il y en a un,
`passe4/<id>/NOTE.md` (chaleur, améliorations prises, greffes et leur source, ce qui tient, ce qui casse, sorties des
contrôles), `passe4/captures/<id>-premier-ecran.png`, `-pendant.png`, `-apres.png` (390 × 844), et `passe4/<id>/geste.json`
(valeurs avant, pendant, après le geste). Classes préfixées par l'id (L26).
