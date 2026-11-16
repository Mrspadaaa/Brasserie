# e2d — NOTE

- Chaleur : **chaude** (un genre neuf).
- Idée : **L'écran est le verre.** Le fond prend la couleur de la bière (paille, noir, or), la mousse porte la réponse ; les relevés sont des bulles qui montent vers la bande FG ; conditionnée, le verre devient bouteilles et fût ; terminée, le verre est vide et garde ses anneaux datés.
- Boosters : bulles-releves (chaque relevé une bulle : plus haut = densité plus basse), bande-fg, glisser-confirmer (glisser pour confirmer la FG, puis l'écoulement), contenants, anneaux (relevés en anneaux de mousse), verdict.
- Geste : le titre devient « Prête. On la met en bouteille ? », 5,3 % final en très grand, bulles stables blanchies, bouteilles et fût cochés, volume en cuve « — » au curseur, fût F-02, « Conditionner le 14.11 ».
- Annulé : verre vide en pointillés, « 0 L », « Revenir à « Planifiée » ».
- Écarts assumés : couleurs de bière par style (aucun EBC chiffré), hors jetons de DESIGN.md ; pas de thème cave rendu ; le glisser aura son équivalent au toucher au port.

## Données
- Du brief (BRIEF-AUTEUR, « Les chiffres ») : Pils LOT-017 garde 2 °C depuis le 03.11, J+18, 1,010 stable depuis le 06.11, FG à confirmer ; Stout LOT-015 conditionnée le 06.11, 30 × 33 cl + fût 20 L F-01, 5,9 % ; Saison LOT-012 écoulée, 6,1 % ; Pale Ale LOT-020 prévue le 08.11, F2.
- **Fictives** (plausibles, sobres) : OG Pils 1,050, FG visée 1,008 – 1,012 et relevés 27.10, 30.10, 03.11, 10.11, 13.11 (fixture du banc a1) ; d'où alcool 5,3 % et atténuation 80 % (calculés) ; fermenteur « F3 » ; °C cuve « hier 2,1 » ; OG/FG Stout 1,058 / 1,014 et Saison 1,052 / 1,006, Saison 43 L brassés et 40 L conditionnés (fixture a1, cohérents avec 5,9 % et 6,1 %) ; dates des relevés et des étapes du Stout et de la Saison ; l'état « annulée le 14.11 » de la Pale Ale (cas annulé demandé, montré sur son vrai brassin) ; répartition 70 × 33 cl + 20 L proposée au geste.
- Aucun α, IBU ni arôme (aucun houblon sur ces fiches). Inconnu = « — » (°C cuve du jour, date d'écoulement, budget).

## Fonctions de l'écran actuel (BatchDetailSheet.tsx, batchTransitions.ts)
- OG, FG (cible), alcool calculé, relevé de densité, courbe, volume brassé et conditionné (saisir / corriger), Carnet (3 notes), Dossier (budget, « Passer en … », revenir à l'étape d'avant, annuler, supprimer), Fermer : déplacées : Carnet et Dossier en icônes, corriger / dégustation / revenir en garde en puces.
- Non dessinés ici (à un toucher, inchangés) : « Jour réellement brassé », alerte de densité hors bornes, bandeau de suivi du stock, pilote NOLO.
- Ajouts proposés (neufs, à trancher) : « Rebrasser cette Saison », verdict « à refaire / à corriger / sans suite » du Carnet.

## Causes c3 évitées
- 1 : composition propre (voir Idée), aucun squelette commun aux quatre.
- 2 et 4 : le héros est la décision de l'état (confirmer la FG, déclarer écoulé, rebrasser, revenir à planifié), titrée en gros.
- 3 : couleur pleine (réponse, contenants, bandes) ; pointillé réservé au vide.
- 5 : sans objet (aucun houblon sur ces fiches).
- 6 : graphe resserré sur la plage utile, ou une forme qui dit le stable.
- 7 : aucune phrase grise d'aide au repos.

## Baseline (BRIEF-AUTEUR, « Obligatoire »)
- [x] geste m2 ou bascule à un toucher, jamais type="number", chiffres à la virgule
- [x] J+n depuis le levurage, avec sa date
- [x] °C de cuve face à la consigne, « — » quand non relevée
- [x] FG visée en bande, jamais en point ; alcool « provisoire » tant que la FG n'est pas confirmée
- [x] pas de cockpit, pas de bandeau d'alerte, pas de code interne, pas de paragraphe
- [x] cibles ≥ 44 px ; HTML autonome, classes et script préfixés
- Contrôles du lot non joués ici (v0) : controle-panel, controle-commun.

## Corrections f3a2 (14.11, verdict c5a)
- Volumes selon DONNEES-COMMUNES.md (pilote) : Pils 24 L brassés en F3, ≈ 22 L attendus après lies (≈ 2 L), volume en cuve « — » à saisir au curseur ; fût libre F-02 (20 L) ; Stout 21,9 L conditionnés, F-01 rempli à 12 L sur 20 ; Saison 24 L brassés, 21 L conditionnés.

## Rhabillage re2 (15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? »)
- Trousse chargée (identite.css, chrome.js) : fiche en feuille de l'app (poignée, rayon 24, ×) posée sur la liste des brassins, voile ; jetons des deux thèmes, Source Sans 3 et IBM Plex Mono, ≤ 28 px, graisse ≤ 600, rayons 10 / 16 / 24 ; boutons, pastilles, puces et curseur m2 de la trousse. Idée, composition, textes et chiffres inchangés.
- Captures : 390 clair (5 états), 390 cave, 1280 clair (capture.mjs).


## Corrections g1 (15.11)
- k1 n° 1 (bloquant) : la feuille garde le fond de l’app ; la couleur de la bière ne vit plus que dans le verre (zone des bulles) et les contenants ; boutons, puces et pastilles de la trousse ; le glisser prend les couleurs du bouton principal. N° 2 (bloquant) : annulée en verre plein gris (220 px), plus de pointillés. N° 3 : boutons de la trousse, texte centré. N° 4 : OG Stout 1,059 (5,9 % juste), au lieu de 1,058. N° 5 : hauteur forcée retirée, plus de vides. N° 6 : « cuve — · consigne 2 °C ». L’écart « hors jetons » de la NOTE ci-dessus est caduc.
- IDENTITE OK (controle-identite.mjs e2 e4 : 8/8).
