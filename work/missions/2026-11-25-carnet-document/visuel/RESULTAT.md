OK — correction 1 : v1, v2, v3, v6 corrigées, v7 recette faite, 12 cas ≤ 30 mots

## Correction 1 (nuit du 25.11)

### Écartées (une ligne chacune)
- **v4 feu tricolore** : écartée. Ses lampes sont fixes, donc la couleur ment dans 7 à 9 cas sur 12. Les trois juges lui donnent moins de 5. On garde sa jauge hachurée pour l'inconnu, qui passe dans v2 et v7.
- **v5 kanban** : écartée. Ses 3 colonnes de 115 px laissent deux tiers de l'écran vides et rangent des faits dans « Fait ». Les trois juges lui donnent moins de 5. On garde les mots « à vérifier / à faire / fait » et la barre de duel.
- v4.html et v5.html ne sont pas touchés. Leurs captures cap12 restent celles du tour 1.

### Fichiers écrits
- `visuel/v7.html` est la recette. Base v6, avec :
  - le héros toujours tâche du brasseur, ou « ✓ Réglé » ;
  - le compte à rebours J-n avec ses mots, et l'anneau ✓n ?n ✗n (v1) ;
  - 2 chiffres clés au plus, sur une ligne, et la paire 1,2 ↘ 0,4 bar (v2) ;
  - la table « qui gagne quoi » à N colonnes, avec une ligne 🧾 de coût total pour le besoin et ⚠ 400/600 (v3 et C5) ;
  - l'inconnu hachuré violet (v2 et v4) ;
  - la ligne qui s'ouvre sur place (v3), et Aide une proposition à la fois au-dessus de la barre, héros visible ;
  - les marques ✦ IA et ✦ conseillé, avec ✕ au repos ;
  - l'état IA absente (`&ia=0`).
- `visuel/reponses/enrichi.js` (ajout ; adapt.js et les JSON ne sont pas touchés) complète le modèle commun :
  - réglé, date et jours restants, avec le 25 nov. 2026 comme aujourd'hui des maquettes ;
  - coût inconnu, anneau, coût total et manque, doublons de chiffres retirés, paire de même unité, propositions de l'IA ;
  - lecture locale : règles de `analyseLocale.ts`, simplifiées ;
  - la ligne « prix pro » du bar, qui manquait à la réponse écrite à la main (C6) ;
  - les communs des variantes : tags, hachuré, compte à rebours, refus avec « Annuler », IA absente.
- `visuel/v1.html`, `v2.html`, `v3.html` et `v6.html` : branche générique réécrite, problèmes B et m des juges (détail dans CORRECTION-1-FAIT.md).
- Captures : `visuel/cap12/` (60 captures, 5 variantes × 12 cas, écrasées), `cap12/mesures.json`, et `visuel/cap/` :
  - v7, gestes : `v7-{ecoulement,bouteilles,chaudiere}-{repos,ligne,aide,refus,sansia}.png` et `v7-ecoulement-ia-ligne.png` ;
  - v1, v2, v3 et v6, preuve des communs : `<v>-ecoulement-sansia.png` et `<v>-ecoulement-refus.png`.
- Scripts, hors livrable, dans le scratchpad : `cap-c1.cjs` (captures et mesures), `extra.cjs`, `grille.cjs` (planches), `patch.cjs`.

### Sortie décisive : mots au premier écran et px de la première info utile (script, titre exclu, placeholder compté)

| cas | v1 | v2 | v3 | v6 | v7 |
|---|---|---|---|---|---|
| ecoulement | 22 · 118 px | 18 · 50 px | 21 · 54 px | 25 · 48 px | 29 · 46 px |
| citra | 11 · 99 px | 12 · 50 px | 12 · 54 px | 11 · 48 px | 11 · 46 px |
| co2 | 20 · 118 px | 19 · 50 px | 18 · 54 px | 22 · 48 px | 30 · 46 px |
| pilsner | 11 · 52 px | 13 · 50 px | 13 · 54 px | 15 · 48 px | 15 · 46 px |
| fete | 15 · 118 px | 22 · 50 px | 20 · 54 px | 22 · 48 px | 28 · 46 px |
| assurance | 13 · 118 px | 20 · 50 px | 17 · 54 px | 20 · 48 px | 21 · 46 px |
| cave | 11 · 118 px | 18 · 50 px | 18 · 54 px | 20 · 48 px | 23 · 46 px |
| chaudiere | 25 · 83 px | 25 · 50 px | 20 · 54 px | 27 · 48 px | 30 · 46 px |
| sureau | 10 · 118 px | 12 · 50 px | 10 · 54 px | 12 · 48 px | 18 · 46 px |
| bouteilles | 23 · 97 px | 22 · 50 px | 30 · 54 px | 23 · 48 px | 30 · 46 px |
| bar | 19 · 118 px | 20 · 50 px | 18 · 54 px | 20 · 48 px | 26 · 46 px |
| levure | 11 · 118 px | 15 · 50 px | 11 · 54 px | 13 · 48 px | 20 · 46 px |

- Maxima au repos : v1 25 mots et 118 px ; v2 25 mots et 50 px ; v3 30 mots et 54 px ; v6 27 mots et 48 px ; v7 30 mots et 46 px. Les 60 cas tiennent dans ≤ 30 mots et ≤ 120 px.
- Contrôles sur les 60 cas : 0 débordement horizontal, 0 chevauchement de cibles, 0 texte coupé, 0 erreur de page. Le comptage est celui de `cap12/mesures.json` : un jeton par mot, « 0.42/bt » compte pour 2.
- v7 et bouteilles sont à 30 mots pile. La règle tient, sans marge.
- Mots après un geste v7 :
  - écoulement : ligne 37, aide 42, refus 28, IA absente 27, ligne IA 41 ;
  - bouteilles : ligne 41, aide 38, refus 33, IA absente 21 ;
  - chaudière : ligne 38, aide 42, refus 32, IA absente 24.
- Ouvrir une ligne ou l'Aide ajoute sa phrase (ses mots, ou la proposition) et dépasse 30 mots. La règle porte sur le premier écran au repos ; c'est un point ouvert, voir la décision ci-dessous.

### Captures (toutes ouvertes, en planches côte à côte et une à une pour les gestes v7)
`work/missions/2026-11-25-carnet-document/visuel/cap12/{v1,v2,v3,v6,v7}-<cas>.png` ; `visuel/cap/v7-*.png` ; `visuel/cap/{v1,v2,v3,v6}-ecoulement-{sansia,refus}.png`.

### Défauts vus et laissés
- **v1, refus** : retirer le nœud de l'IA laisse son trait pointillé jusqu'à ce que la page soit redessinée (`cap/v1-ecoulement-refus.png`).
- **v1, réglé** : le pilsner met la carte « Réglé » en haut ; la carte du cœur est vide.
- **v6 et v1, assurance** : la rangée « Renouveler l'assurance J-36 » répète le compte à rebours du héros.

### Prédiction
« Là je vois quoi faire et pour quand ; le pilsner est réglé, et les bouteilles c'est B, parce que l'occasion n'en a que 400. »
v7 et v6 devraient passer 7, v3 sort peut-être de la frise, et v1 reste belle mais secondaire.

DÉCISION À PRENDRE : la règle de 30 mots s'applique-t-elle aussi après un geste (ligne ouverte, Aide) ? Aujourd'hui, elle tient au repos ; après un geste, la v7 monte de 28 à 42 mots (la ligne citée est ses mots).
CONNAISSANCE : sous Git Bash, un heredoc passé à node peut perdre des barres obliques inverses dans les expressions rationnelles (`\s`, `\/`) ; écrire les scripts avec l'outil d'écriture, pas par heredoc.
LEÇON PROPOSÉE : un état du modèle commun (réglé, date, titre d'option) se corrige d'abord dans l'adaptateur partagé (ici enrichi.js), puis chaque variante le lit ; c'est la proposition du juge critique, confirmée : C1 à C7 réglés une fois pour 5 variantes.

---

## Tour 0 (archive)

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
