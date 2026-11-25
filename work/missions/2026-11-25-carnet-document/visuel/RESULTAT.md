OK — 6 genres d'Organisé visuel, 2 cas réels, 10 à 17 mots au premier écran

## Fichiers écrits
- `visuel/v1.html` à `visuel/v6.html` : des pages autonomes (HTML, styles et script en ligne), en thème sombre comme le jouable M4 b. Le cas se choisit par `?cas=ecoulement` ou `?cas=citra`.
- `visuel/cap/` : 24 captures 390 × 844, DPR 2 (`<v>-<cas>-repos.png` et `<v>-<cas>-geste.png`), et `mots.json` (comptage brut).
- Générateur et script de capture hors livrable : scratchpad `gen-visuel.mjs` et `cap-visuel.cjs`. Les captures sont faites par puppeteer-core sur le Chrome 9222, dans un onglet propre ; à la fin, `page.close()` puis `browser.disconnect()`.

## Les 6 genres
| v | Genre | Avancement propre au genre | Geste clé capturé |
|---|---|---|---|
| v1 | Carte mentale : le carnet au centre, une branche par élément, la couleur et la forme selon la sorte (piste ronde, option carrée bleue, tâche carrée blanche, proposition de l'IA en pointillé violet) | Problème : un anneau au cœur, `✓1 ?2` (trouvé / reste à vérifier). Achat : ⚖️ « comparé », un tiers de l'anneau. | Toucher un nœud ouvre une feuille avec sa ligne (n°, mots cités surlignés, « Mes notes ↩ ») |
| v2 | Grosses tuiles-icônes, une décision par tuile | Problème : la tuile « 1/2 » (trouvé sur pistes). Achat : un bandeau ⚖️ comparé › ✋ › 📦 avec le score 👑2 / 👑1. | Aide ouverte en feuille : ✓ check, ☐ tâche, 💡 suggestion, chacun avec ✕ et ＋ |
| v3 | Chemin propre au genre, en ligne de métro verticale | Problème : 🔎 causes → 📞 maintenant (halo) → 🛠️ remède. Achat : ⚖️ comparé (le duel qui gagne quoi) → ✋ choisi (☆ retenir) → 📦 commandé. | Toucher un élément ouvre sa ligne dans une bulle, sur place, sous l'élément |
| v4 | Feu tricolore (sûr / attend / manque), puis une jauge de coût | Problème : le feu lui-même. Achat : une petite frise ⚖️ › ✋ › 📦 au-dessus du feu. Sur la jauge, l'inconnu est hachuré, jamais posé à zéro. | Aide en éventail au-dessus du bouton 💡 |
| v5 | Kanban à 3 colonnes à vignettes : à vérifier / à faire / fait | Les colonnes elles-mêmes. Achat : un duel en barre 👑1 contre 👑2 au-dessus. | Toucher une vignette la retourne sur sa ligne |
| v6 | Une seule chose maintenant : la prochaine action en très grand, avec ✓ fait et ⏭ plus tard ; le reste en pastilles groupées par repère (🔎, 💰, ⏳ ; achat : 👑, 💰, ⚠️) | Achat : ⚖️ › ✋ › 📦 dans le coin du héros. | Aide en pile de cartes : 1/3, ✕ et ＋ |

Partout, l'en-tête tient sur une ligne : ←, le titre, puis ⓘ (date, genre, heure de rangement), ⋯ ou 📝 selon la variante. Il n'y a plus de frise Noté › Je cherche › Décidé › Résolu.
Ce qui reste vrai de la base :
- l'IA ne réécrit rien : chaque élément renvoie à sa ligne, et ses propositions restent en pointillé violet ;
- « + » sur pistes, options et tâches ;
- Aide 💡, toujours accessible ;
- la comparaison « qui gagne quoi » (👑 par critère) ;
- ☆ Retenir, qui n'exclut rien ;
- le champ d'une ligne « Ajouter… » en bas ;
- Mes notes 📝, à un toucher.

## Sortie décisive : mots visibles au premier écran (script, titre exclu, placeholder compté)
| Capture | Repos | Après le geste | 1re info utile (px depuis le haut ; barre de titre de 44 à 48 px) |
|---|---|---|---|
| v1 écoulement | 14 | 11 | 77 |
| v1 citra | 13 | 14 | 85 |
| v2 écoulement | 14 | 14 | 50 |
| v2 citra | 12 | 12 | 50 |
| v3 écoulement | 12 | 19 | 54 |
| v3 citra | 11 | 20 | 54 |
| v4 écoulement | 12 | 12 | 56 |
| v4 citra | 10 | 12 | 86 |
| v5 écoulement | 17 | 24 | 48 |
| v5 citra | 13 | 22 | 48 |
| v6 écoulement | 14 | 25 | 48 |
| v6 citra | 11 | 21 | 48 |

Les 12 états au repos sont tous à 30 mots ou moins (maximum 17). Après le geste aussi, ils restent à 30 ou moins (maximum 25).
La première info utile commence partout à moins de 120 px sous la barre (le pire cas est à 86 px depuis le haut de l'écran). Aucune erreur de page, aucun débordement horizontal.

## Captures (toutes ouvertes)
`work/missions/2026-11-25-carnet-document/visuel/cap/` : v1…v6 × {ecoulement, citra} × {repos, geste}.

## Honnêteté des données
- **Écoulement** : le rangement réel de Claude (`reponse-reelle-ecoulement.json`). Ses 6 lignes ne sont pas réécrites, et les citations sont surlignées telles quelles.
- **Citra** : la réponse est écrite à la main, à la place de l'IA, depuis `c75/houblons-citra.json`.
  - MotlerHops : 3,72 €, soit environ 3,42 CHF au taux BCE du fixture, avec un α de 10–15 %.
  - Brau : « dès 0,10 CHF », quantité inconnue, donc le prix est affiché « 0,10 ? » et ne gagne rien. α 13,6 % ; les arômes sont lus sur la page.
  - Le stock « en stock » de MotlerHops porte ⚠, parce que sa ligne 3 dit « Semble difficile à obtenir sur le site français ».
- Un coût inconnu est hachuré ou marqué « ? », jamais posé à zéro.

## Écarts voulus
- Les drapeaux sont dessinés en CSS : sous Windows, l'emoji drapeau s'affiche en lettres.
- La v3 garde du vide entre ses stations : c'est la longueur du chemin.
- La v5 garde ses colonnes pleine hauteur : ce sont des couloirs de kanban.

## Prédiction
« Là je vois en deux secondes ce qui est trouvé, ce qui bloque et ce que je fais maintenant. » La v6 et la v1 devraient le frapper le plus, la v3 le moins : le chemin ressemble encore à une frise, même propre au genre.

## Boosters UX (boosters-ux), coche v0
- Boosters (`data-booster` non posé, chaque déclencheur porte `data-k`/`data-art`) : toucher l'élément ouvre sa ligne (lire) ; Aide ouvre des items typés (déclencher) ; ☆ Retenir (choisir) ; jauge de coût, feu, anneau et duel 👑 (comparer, suivre).
- B2 : une dominante par variante (le cœur, le héros, le feu, la tuile verte). B3 : au plus 17 mots, en dessous de 60. B8 : l'inconnu s'affiche « ? » ou hachuré. B11 : la phrase du coup d'œil est la prédiction ci-dessus.
- B13 : cibles de 40 px et plus, « + » de 40 px, champ et Aide de 46 px.
- Non mesuré en v0 : R1, R2 et R4 (le texte des pastilles à 14 px est respecté ; le nombre de tailles n'est pas compté).

DÉCISION À PRENDRE : aucune (le choix entre les variantes revient au brasseur).
CONNAISSANCE : sous Windows et Chrome, les emoji drapeaux (🇫🇷 🇨🇭) s'affichent en lettres FR et CH. Une maquette qui compare des vendeurs doit dessiner ses drapeaux.
LEÇON PROPOSÉE : aucune
