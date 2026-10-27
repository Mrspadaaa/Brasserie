OK — Radar de Suggérer : bord d'axe fixe d'un moment à l'autre (D189) ; Absolu : bande du style, échelle 0 au plus fort (D187)

## Défaut vérifié (vue Radar, Au style, « ‹ moût › … ‹ whirlpool › »)
Présent, plus fort que sur Comparer : sur HEAD, la forme de la voie (Tango) garde **la même surface (29 112) du moût au whirlpool** alors que ses valeurs passent de 1,75 à 13,99 ; seuls les chiffres près des pictos changent (agrumes 0,4 au moût, 2,8 à 0′). Captures : `img/suggerer-tot-page-avant.png` et `img/suggerer-tard-page-avant.png` (390 × 844, fixtures `?dev-local`, visée citrus + tropical sur la recette de fixtures 16D, première voie « Ajouter Tango 10 g »).
En Absolu (même écran, non plainte nommée) : tout tenait dans le petit centre (échelle 0 à 12,5 crans, la voie à 14 % du rayon utile, aucune bande) : `img/suggerer-absolu-page-avant.png`.

## Ce qui change
- **D189, au style** : le bord de chaque axe est le plus fort de ma bière et de la voie sur tous ses moments (le moment du moteur + tous ceux du décalage : moût, 60′ à 0′ par 5′, whirlpool). Il ne bouge plus ; la forme grandit vers 0′ et rétrécit vers 60′ : surfaces 9 453 (60′) → 12 215 (40′) → 17 116 (20′) → 29 112 (0′) → 20 254 (whirlpool). Les bords écrits sont les mêmes aux 15 moments (2,8 · 2,7 … pour agrumes, tropicaux…). Passé à RadarBase par `echellesAxe`, la prop de r3.
- **D187, Absolu** : bande du style dessinée (24 sommets) et échelle du 0 au plus fort (ma bière, la voie à tous ses moments, haut de la bande) : « 0–3 » au lieu de 0–12,5, la même à tous les moments. La voie atteint 93 % du rayon utile à 0′ (14 % avant). `img/suggerer-absolu-0-page-apres.png`.
- Choix gardés : trait noir « ma bière » (D156), zone du style, orangé hors style, secteur « sans donnée », inconnu jamais 0 (une famille inconnue de ma bière n'a pas de bord).

## Fichiers écrits
- `src/ui/hopIndex/suggerer/radar.tsx` : prop `effetsMoments` ; `plusFort` (bord par axe) ; `bande` et `echelleAbsolue` en Absolu ; réemploie `echelle` et `Valeurs` de `commun/RadarBase.tsx`, aucun code de r3 copié.
- `src/ui/hopIndex/suggerer/vue-radar.tsx` : `effetsMoments` (mémoïsé sur recette et voie montrée : un pas de moment ne relance rien), passé à `Radar`.
- `tests/integration/controle-radar-echelles.mjs` : étendu à Suggérer (même fichier, seconde moitié ; en-tête mis à jour).
- `voies/r4-radar-suggerer/img/` : captures avant et après, bilans JSON. (Les `style-*` et `absolu-*` sont les captures de Comparer que rejoue le même contrôle ; non utilisées ici.)
- `index.tsx` : **non modifié** (voir le point suivant).

## Écart au brief : `index.tsx` n'a pas de colonnes par moment à passer
`index.tsx` ne calcule rien par moment : il ne fait que passer `groupes` (voies du moteur au moment du moteur, effets déjà dans `Ligne.effets`). Les colonnes à cinq moments de Comparer (`lireColonnes`) n'existent pas ici. Ce qui est déjà calculé est réemployé : `lm.effets` (moment du moteur). Reste à lire les moments du décalage : 14 `lireVoie` (moût, 60′ à 0′ par 5′, whirlpool : 15 moments sur la recette de fixtures, dont celui du moteur), seulement pour la voie montrée. Mesuré en Chrome : montrer une autre voie coûte 31 à 32 ms de l'appui au radar changé. Pas de double simulation de Comparer (écran distinct).

## Critères
- **Contrôle étendu, rouge sur HEAD** : `ECHELLES ECHEC` à la première exécution sur HEAD (code 1, des dizaines de lignes, seule la fin a été gardée) (partie Suggérer : échelle qui change entre moments, surface « 0 % » pour des valeurs de +27 % à +299 %), avec bilan `img/bilan-avant.json`. Limite : l'Absolu de Suggérer a été ajouté au contrôle après cette exécution ; sa partie rouge sur HEAD se lit dans `img/bilan-absolu-avant-HEAD.json` (échelle 0–12,5, pas de bande, voie à 14 % < 15 %), pas dans un rejeu du contrôle final. Un rejeu complet sur une copie de HEAD (worktree temporaire) a échoué : l'app ne se chargeait pas (alias `@app` non résolus, via le lien vers `node_modules`). Copie retirée, lien enlevé, `node_modules` intact (704 entrées).
- **Vert sur mes fichiers** : `ECHELLES OK` (Comparer r3 + Suggérer : 15 moments au style, 91 paires jugées, 15 moments en Absolu, bande à 24 sommets).
- `npx vitest run tests/unit/hopIndexV4/` : 89 fichiers, **823 verts** (dont `radarEchelles`, `radarBiere`, `radarLisible`, `radarContourOriginal`, `radarTrouDuZero`, `suggerer*`, `ficheSuggererApp`) ; une erreur non gérée de worker « Timeout calling onTaskUpdate » (déjà vue par r3, apportCDefaut dure 96 s) ; les 7 rouges de r3 sont verts maintenant.
- `npm run build` : vert (avertissement de taille de chunk habituel).
- `controle-trait-ta-biere.mjs` : `TRAIT OK` (il joue le radar de Suggérer).
- Captures ouvertes en image : `suggerer-tot-page-avant/apres.png`, `suggerer-tard-page-avant/apres.png`, `suggerer-absolu-page-avant.png`, `suggerer-absolu-0-page-apres.png`.

Essais : un par critère après le correctif ; deux ajustements du contrôle (clic « Absolu » qui ne basculait pas ; « tassée » jugée au moût, alors que la voie y est honnêtement petite sur l'échelle commune, maintenant jugée à son moment le plus fort).

## Doutes et limites
- **Le bord est propre à la voie montrée**, pas à toutes les voies de la liste : changer de voie (Tango → Citra) change l'échelle. C'est un changement de voie, pas de timing ; D189 ne vise que le timing. Un bord commun aux trois voies serait possible mais ferait dépendre le radar de voies non montrées. À confirmer si le brasseur le veut.
- **À un moment faible (moût, 60′ à 45′), la forme de la voie est petite** (surface 9 453 contre 29 112 à 0′) : c'est le but de D189, mais le brasseur verra un radar presque vide à 60′ sur Tango.
- **Absolu étendu sans plainte nommée sur Suggérer** : D187 parlait « du radargraph en absolu » ; le brief demandait « les mêmes bords que r3 ». Réversible : supprimer `bande` et `echelleAbsolue` dans `radar.tsx`.
- Cas du brasseur (22A) non rejoué ; fixtures en 16D.
- Tango à 0′ : « +0 » IBU sur la ligne (ligne de la voie, non touchée ici).

DÉCISION À PRENDRE : aucune bloquante (bord propre à la voie montrée : à garder sauf demande contraire).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
