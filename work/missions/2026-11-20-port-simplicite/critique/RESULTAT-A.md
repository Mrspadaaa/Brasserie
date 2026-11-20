OK — 13 problèmes, 2 bloquants

# Critique lot A (pa1, pa2, pl1, pe1, pl2) : test d'écran

Version : branche `claude/port-carnet-1711`, arbre de travail non commité (HEAD 755f77d11 + modifications), non déployée.
Rejeu : app réelle `npx vite --port 3131` (cache vite à part, `node_modules/.vite` étant verrouillé par les autres serveurs), `http://localhost:3131/?dev-local`, données « ZZ TEST » en mémoire.
Captures : `critique/captures-A/` (préfixes `pa1-`, `pl2-`). Script : copie de travail hors dépôt (scratchpad), gestes joués au toucher (`tap`) à 390 et au clic à 1280.

Parcours joués dans l'app :
- pa1 et pl1 : menu + › « Facture, photo ou PDF » (lecture 372765 simulée, `&depense=3`), avec un besoin « ZZ TEST Commande de printemps » posé dans le magasin. Gestes : Garder, Puis (passer), « ✕ pour délier », lignes sûres (déplier, replier), Terminé, puis le second Terminé. Formats : 390 clair et cave, 1280 cave ; 1280 clair, voir les limites.
- pl2 : Stocks › Matériel › Réalisés, puis Brassins › Atelier › Matériel (la courbe kh1r), puis Finances › Prévisions. Données : Fermenteur 750 payé le 15.11, Hotte 1 800 prévue en décembre, caisse de départ 5 000.
- pa2 : impossible à montrer dans l'app (voir les doutes) ; jugé sur les captures de banc de v-pa1, qui utilisent la vraie ExpenseSheet.
- pe1 : jugé sur les 24 captures de v-pe1, prises dans l'app (?dev-local). Elles sont déclenchées par des appels de service, pas par un geste (voir les doutes).

## Problèmes

| # | Choix | Format | Ce qu'on voit | Gravité | Capture |
|---|---|---|---|---|---|
| 1 | pa1 | 390 clair et cave, 1280 cave | Le doute TVA dit « Imprimé 2,80 · recalculé 4,15 ». Or 4,15 n'est pas un recalcul : c'est la somme des TVA imprimées par taux (N + R : 1,95 + 2,20). Le panneau de la même feuille dit « 8,1 % : 1,95 imprimée, 0,84 recalculée · 2,6 % : 2,20 imprimée, 1,91 recalculée » : le vrai recalcul vaut 2,75 et soutient 2,80. Le bouton « Prendre 4,15 » pousse donc le brasseur vers la mauvaise TVA, présentée comme calculée. La cause est dans `ExpenseSheet.tsx` (l. 1624-1626) : `col.calcule` de la relation `somme-tva` vaut N + R, et le code l'étiquette « recalculé ». | **B** (nombre faux) | `pa1-1repos-390-clair.png`, `pa1-1repos-1280-cave.png`, panneau : `pa1-6termine-390-clair.png` |
| 2 | pa1 | tous | Le sujet du doute est « TVA », sans taux. Sa maquette dit « TVA 8,1 % » et montre une TVA par taux (imprimé 1,95 · recalculé 0,84). La pièce a 2 taux, réduits ici à un seul doute sur les totaux. Retouche : un doute par taux, comme la maquette. | G (écart à sa maquette) | `pa1-1repos-390-cave.png` vs `maquette/captures/pa1-clair.png` |
| 3 | pa2 | 390 clair et cave (banc v-pa1) | Le mot « relier » sert à deux choses opposées. « Houblons · 7 lignes », « 1 → Houblons de ton stock », pastille « 2 à relier », puis le bouton « Relier les 2 comme avant ». La pastille compte les 2 lignes que rien n'a retrouvées, à relier à la main. Le bouton relie 2 autres lignes, celles qui ont été retrouvées. Le brasseur croit que le bouton règle les « 2 à relier ». | **B** (nombre trompeur sur le geste principal de pa2) | `voies/v-pa1/captures/suite-repos-t390-clair.png`, `-t390-cave.png` |
| 4 | pa1 + pa2 + pl1 | 390 (banc v-pa1) | Au repos, l'écran « un doute à la fois » devient une pile. Il montre la carte Pour, 2 familles avec leurs cartes « Comme la dernière fois », 2 boutons, les lignes sûres, puis seulement le doute courant (à ~620 px). On y compte deux boutons pleins (« Relier les 2 », « Terminé »). Sa maquette pa1 met le doute juste sous le total. | G (écart à sa maquette, « sans me prendre la tête ») | `voies/v-pa1/captures/suite-repos-t390-clair.png` |
| 5 | pa1 | 390 clair et cave, 1280 cave | « Terminé · 8 doutes à revoir » ne termine pas. Le premier toucher déplie toute l'ancienne feuille (justificatif, contrôles, 14 reliés, 5 moutures, liste des 23 lignes) avec un second « ✓ Terminé ». Il faut ce second toucher pour enregistrer. Sa maquette : Terminé enregistre. Ses mots du 20.11 : moins de gestes. | G (geste doublé, retour du cockpit) | `pa1-6termine-390-clair.png`, `pa1-7enregistre-390-cave.png` |
| 6 | pa1 | 390 clair et cave | Les 5 moutures (Zuschlag) font 5 doutes identiques à la suite : « Doute 2 sur 9 · Zuschlag · mouture », puis « Puis : Zuschlag · mouture ». Le doute courant et le suivant portent le même nom, et rien ne dit à quel malt chacun se rapporte. L'ancienne feuille a « Rattacher les 5 » d'un geste. | G (5 gestes au lieu d'un, indiscernables) | `pa1-4delie-390-clair.png` |
| 7 | pa1 | tous | « proposé **avec le malt** » : des mots en chasse fixe grasse (`font-mono`), comme un nombre. | D | `pa1-4delie-390-clair.png` |
| 8 | pl1 | 390 clair, 1280 cave | La pastille « trouvé » a un texte sombre sur un vert moyen : contraste faible, surtout en cave (texte gris-vert sur vert). Sa maquette : texte franc sur vert clair. | D | `pa1-1repos-1280-cave.png`, `pa1-1repos-390-clair.png` |
| 9 | pl1 | 390 | Après « ✕ pour délier », la carte disparaît et rien au repos ne permet de relier à nouveau. Le repli « Lier à une dépense prévue » n'existe que dans la feuille dépliée. | D | `pa1-4delie-390-clair.png` |
| 10 | pl2 | 390 clair (app, Atelier) | Courbe « Caisse fin de mois » : l'étiquette « Fermenteur −750 » est posée sous la seule marche visible, qui est celle de la Hotte (−1 800, décembre ; étiquetée « brassage » au-dessus). Le paiement du fermenteur (15.11) n'a pas de marche : la courbe part d'« aujourd'hui » 4 250. On lit « la caisse baisse de 750 en décembre », ce qui est faux. Sa maquette pose l'étiquette sur la marche du fermenteur. | G (écart à sa maquette, lecture fausse) | `pl2-5courbe-390-clair.png` vs `maquette/captures/pl2-clair.png` |
| 11 | pl2 | 390 clair | « brassage » est le titre court de « Hotte de brassage ». À côté de « Fermenteur −750 », il se lit comme la catégorie brassage. | G | `pl2-5courbe-390-clair.png` |
| 12 | pl2 | 390 | La courbe est écrasée sur ~45 px de haut (4 000, 2 000 et 0 serrés). L'étiquette chevauche l'axe « 0 » et la bande grise du mois. | D | `pl2-5courbe-390-clair.png` |
| 13 | pe1 | 390 et 1280, clair et cave | L'onglet montre aussi les lignes qui ne bougent pas. Après une vente à encaisser : « Caisse 4 000,00 → 4 000,00 », « Dépenses nov. 1 240,00 → 1 240,00 ». Deux lignes sur trois ne disent rien. | G (bruit, « sans me prendre la tête ») | `voies/v-pe1/captures/pe1-390-cave-vente.png` |

Conformes, vus dans l'app :
- pl2 Réalisés : « Fermenteur supplémentaire » en gras, « payé · facture du 15.11 » en vert, 750 CHF (`pl2-1realises-390-clair.png`).
- pl1 : « Pour · ZZ TEST Commande de printemps · trouvé · ✕ pour délier » est trouvé seul par la règle (même fournisseur, 85 contre 86,50).
- Le geste « Garder » fait passer au doute suivant, « Puis » passe le doute et le compte de « Terminé » baisse (9, puis 8).
- Le second Terminé enregistre et ferme (`pa1-7enregistre-*`).
- Aucune erreur de page.

## Doutes (non comptés)
- pa2 n'est pas prouvé dans l'app. Avec la lecture simulée (`apercu`), ExpenseSheet prend `apercu.transactions`, qui vaut toujours `[]` : la carte n'apparaît jamais. Sur une vraie pièce, il faut Gemini, interdit en test. Seul le banc v-pa1 le montre. Une fixture d'aperçu avec une facture passée du même fournisseur le rendrait jouable.
- pe1 n'est déclenché, dans le banc v-pe1, que par des appels de service (`stageNewTransactionPayment`, `addTransaction`), jamais par un geste du brasseur. Le Terminé de la dépense simulée enregistre sans écriture et n'annonce rien. Le rejeu au geste (« Écriture, à la main ») n'a pas abouti (premier essai pendant la panne de dépendances de vite, relance arrêtée faute de budget) : DEMANDE EXECUTANT ci-dessous.
- Pastille orange de 6 px en bas à gauche, au-dessus de la barre du bas, sur tous les écrans à 390 (Bord, Stocks, Atelier) : sans doute hors lot (indicateur du compagnon ?).
- Formats non joués dans l'app : pa1 en 1280 clair, pl2 en 390 cave et en 1280 (relance arrêtée). Les captures de banc v-pl2 de ces formats montrent la même disposition.
- pe1 : les barres avant et après de la Caisse sont presque de même longueur (4 000 contre 3 913) et ne disent rien. C'est déjà le cas dans sa maquette.
- Serveur 3131 : arrêté à la fin.

DEMANDE EXECUTANT : relancer vite avec un cache à part (même méthode que plus haut, port 3131), puis :
1. pa1 en 1280 clair ;
2. pl2 en 390 cave, 1280 clair et 1280 cave (Brassins › Atelier › Matériel, puis Stocks › Matériel › Réalisés), avec les données pl2 décrites plus haut ;
3. pe1 au geste : menu + › « Écriture, à la main » ; saisir une dépense « ZZ TEST » de 86,50 payée ; enregistrer. Attendu : l'onglet « Tes finances, avant → après » s'ouvre ; Annuler défait l'écriture.
Captures à ouvrir : `captures-A/pa1-*-1280-clair.png`, `captures-A/pl2-*-390-cave.png`, `captures-A/pl2-*-1280-*.png`, `captures-A/pe1-*.png`.
