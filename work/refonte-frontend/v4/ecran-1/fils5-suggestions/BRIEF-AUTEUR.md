# Lot 5b · Suggestions (écran 1) — brief auteur

Tu refais **la partie Suggestions** (Barres et Radar), et rien d'autre. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash (`node -e`
abîme les regex). Fichiers de travail dans un sous-dossier à toi du scratchpad
(`C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\055d83f7-e384-467e-9f02-749828cb09f6\scratchpad\`).

## Ce que le brasseur a dit (mot pour mot)

- « ma stout est trop résineuses, je la veux plus floral. La moteur nous propose plusieurs
  houblons et on peut ensuite comparé. »
- Sur la v3 : « Parcontre tout ce qui est suggestions et comparaison, c'est très mauvaise et de
  mon point de vu pas terminé » ; « Les deux autres c'est n'importe quoi... ».
- « je sais pas comment bannir une contraintes ou réduire une autre, il y a des truc jaune ?? »
- « Je veux choisir pas de 10' défini, pas de timing imposé hein » ; « c'est des tranche de 5' ».
- « D'ailleurs, il faut des intervalles de confiance ».
- « un peu plus résineux pour une stout est pas très problématique, pour une lager kolsch très » ;
  « certains style ou même mon apprioi est important et une petite différence peut en fait faire
  complément changé dechelle » → l'effet se lit **en tolérances du style**, réglables par son a
  priori (strict, normal, libre, banni).
- « Tout ce qui est bio Transfo, dry hopping, levure et thyole et autre spécificités, c'est pas
  pour tout de suite » → **aucune voie levure** (type « levure » du pack).
- « Déjà dit mais attention au piège !! » : ma bière, la cible du style, la comparaison manuelle,
  les suggestions de l'outil ne se mélangent pas ; une voie, c'est **ma bière après**, jamais la
  silhouette d'un houblon ; la couleur d'alerte n'appartient qu'à ma bière face à la cible (D40).
- Toujours : penser en brasseur ; le stock en icône ; « on avait établi une Baseline » → hors de
  Suggestions, rien ne change (D26).

## La décision

« Quelle voie j'applique à ma recette pour aller vers ce que je veux ? » Pour chaque voie, dans
cet ordre : **le changement** (verbe, houblon, dose, moment réglable), **l'effet sur mes
objectifs** (avant → après, avec la plage, en tolérances du style), les effets de bord, **l'IBU
tenu**, le stock en icône, puis **Appliquer**. Deux ou trois voies doivent pouvoir se comparer.

## Lis (et rien d'autre)

1. `work/refonte-frontend/v4/ecran-1/CADRAGE-SC.md` (partie Suggestions).
2. L'en-tête de `work/refonte-frontend/v4/tournoi/outils/controle-suggestions.mjs` : **le contrat
   DOM** que ta page doit porter, et ce qui est vérifié.
3. La baseline : `scratchpad\baseline-lot5b\generateur\README.md`, puis le générateur. **Pars de
   lui** (copie-le dans ton sous-dossier ; `ROOT` est absolu, `node build.mjs --out=<dossier>`
   écrit `<dossier>/consolide/*.html`). Suggestions vit dans `partieSuggestions` (`commun.js`),
   déjà marquée `data-composant="suggestions"`, et dans `RADAR.voies` (`radar.js`). `scenario()`
   de `build.mjs` choisit ce qui entre dans `D` : **ajoute-y** `S1.tolerance` et
   `voies[].ecartsApres` du pack (ils n'y sont pas encore).
4. Le pack `prototypes/houblons-v4/data/pack-mini-protos.json` (avec node), scénario S1 :
   `direction` (floral +, résine −), `voies` (rang, type, label, actions, `ibu.before/after/drift`,
   `stock`, `sideEffects`, `ecartsApres` : valeur 0–100, écart en tolérances, plage et ses écarts),
   `tolerance` (règle, masquage du style, `familles` : bande, T ; `biere` : ma bière avant, valeur,
   écart, plage), `profilBiereContinu`, `cibleStyleContinu`, `voies[].profilApresContinu` (0–3,
   pour le radar). **Aucun chiffre calculé dans la page** : tu places ceux du pack.

## Le contrat (contrôlé : `controle-suggestions.mjs`, D52 à D54)

Sur `etat-b.html` (lentille Barres) **et** `suggestions-radar.html` (lentille Radar) :

- **Objectifs** floral et résine au premier écran (`data-role="objectif"`, `data-famille`,
  `data-apriori`), chacun avec au moins 3 gestes dont **bannir** (augmenter, réduire, bannir,
  retirer, a priori), visibles ou à un toucher.
- **Au moins 3 voies** (`data-voie` = rang du pack), sans voie levure ; la première dit son
  changement au premier écran. Dans chaque voie : le **changement** d'abord (« Ajouter…»,
  « Remplacer…», « Diminuer…» ; dose en g ; moment), puis **l'effet** sur floral et sur résine :
  avant, après, écarts en tolérances, **plage après** visible (piste et segment) ou « plage
  inconnue » dite ; l'**IBU** (après, ou son écart signé) ; **Appliquer** ; le **moment se règle**
  (`data-action="moment"` : pas de 5′, la durée d'ébullition de la recette, rien d'imposé) ; le
  stock en icône, jamais en texte.
- **Radar** (page Radar) : `data-objet="voies"`, 12 axes dans l'ordre de la roue (D24, D48),
  ma bière avant et **une** voie à la fois (2 séries au plus), la zone du style en fond (prends les
  bandes de `S1.tolerance.familles`, ÷ 33,33 pour l'échelle 0–3), passer d'une voie à l'autre se
  voit.
- Non mesuré mais attendu : comparer 2 ou 3 voies côte à côte ; les effets de bord lisibles sans
  noyer l'objectif ; une échelle qui dit qu'elle est celle du style (et qu'elle bouge avec l'a
  priori) ; aucun « truc jaune » inexpliqué.
- Généraux : un écran à 390 (et à 412), mots ≤ 80 au premier écran, remplissage ≥ 0,80, au moins
  4 boosters qui marchent, bascule Barres ↔ Radar, un seul style de graphique (D39), couleur
  d'alerte seulement sur ma bière face à la cible (D40).

## Ta variante

Ton message te donne un numéro (pNN), une **température** et un **parti**. Tiède = parti de
structure imposé ; chaud = libre, surprends (toujours dans le contrat) ; froid = repars des idées
retenues. **La température porte sur Suggestions elle-même** (D38), pas autour.

## Pages et contrôle, avant de t'arrêter

`work/refonte-frontend/v4/ecran-1/fils5-suggestions/pNN/` : les 12 pages construites par ton
générateur (seules `etat-b.html` et `suggestions-radar.html` changent) et `NOTE.md` (5 lignes :
parti, comment se lit l'effet en tolérances, comment on compare deux voies, limites).

```
node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils5-suggestions pNN --mots=80 --fill=0.8 --boosters=4 --radar --radar-pages=suggestions-radar.html --coherence --objets --suggestions --baseline=C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/055d83f7-e384-467e-9f02-749828cb09f6/scratchpad/baseline-lot5b/pages/consolide
```

Il doit imprimer `LOT OK`. Regarde tes captures (`fils5-suggestions/captures/pNN-b-390.png`,
`pNN-suggestions-radar-390.png`) : un brasseur sait-il en 5 secondes quelle voie appliquer, et
pourquoi ? Trois passes au plus. Ne touche à rien hors de ton dossier pNN et de ton sous-dossier
du scratchpad. Réponse finale : une ligne par variante (parti, lecture de l'effet, mots et
remplissage des 2 pages, LOT OK).
