OK — coût d'un brassin, impôt bière et client doublé d'Opérations corrigés sur la fixture `reel`, captures 390 ouvertes, 135 tests verts.

Fichiers écrits : `src/ui/finance/CoutBrassinFlux.tsx`, `src/ui/finance/cout-brassin.css`, `src/ui/production/ImpotBiereSheet.tsx`, `src/ui/production/impot-biere.css`, `src/ui/finance/TransactionRow.tsx` (source du client doublé : 2 lignes, hors liste « Possède » mais nommé par la demande), `tests/integration/f3ReelCoutImpotClient.test.tsx` (8 tests, neuf), `tests/integration/f2ReelCout.test.tsx` (filtre des carrés limité aux destinations, car les sources inconnues sont maintenant hachurées aussi). `voies/f3/capturer.mjs`, `captures/`, `tests.txt`.

## 7. Coût d'un brassin (c3a) — FAIT
Avant (`captures/cout-avant-haut.png`, LOT-1 « Ssr » ; `cout-avant2-haut.png`, LOT-2 planifié sans litres) vs maquette `p2/c3a/c3a-haut.png`. Le flux, les nœuds hachurés et « ? » existaient déjà (passe f2 précédente, non commitée) ; restaient :
- les barres de source « Déjà payé ? » et « Coût de l'année ? » étaient pleines (vert, violet) : elles sont maintenant hachurées (`data-inconnu`) ; « À payer » reste pleine quand elle porte un flux connu (l'impôt 3,80), hachurée sinon ;
- le litre inconnu était un « — » blanc : c'est un bloc hachuré aux dimensions du grand 7,51 de c3a (`.cbf-big-q`, le « — » reste pour la lecture, invisible, aria-label « Coût du litre inconnu ») ;
- sous la barre du litre, « — » seul : « payé ? · à payer ? · année ? », les trois places de c3a ;
- sept pointillés partaient du même point (une boule noire) : leurs départs sont répartis sur la hauteur de la source ;
- les étiquettes de source gardent 60 px entre leurs centres et ne montent plus au-dessus du bord (le test de 58 px de f2 échouait à 52 : étiquette rognée à 0).
Après : `captures/cout-apres-haut.png` (LOT-1, ouverte), `cout-apres2-haut.png` (LOT-2, ouverte), bas aussi pris.
Tests : `f3ReelCoutImpotClient` bloc 7 (4). Échouent sur HEAD (pas de `data-inconnu`, `cbf-big-q`, `cbf-litl-q`).

## 8. Impôt bière (p2b) — FAIT
Avant : `captures/impot-avant-haut.png` (LOT-1, 15 L, visée recette 12,4 °P : fidèle à p2b, rien à changer) et `impot-avant2-haut.png` (LOT-2, aucun litre, aucune production annuelle) vs `v0/p2b/p2b-haut.png`. Sur LOT-2 le total du brassin et la ligne « Sur l'année » finissaient par un petit « — » gris, « litres à noter » en texte nu.
Après (`captures/impot-apres2-haut.png`, ouverte) : la règle hachurée, le curseur « 12,4 °P · visée recette », les trois formats (0,08 · 0,19 · 5,06) et la ligne « Sur l'année » gardent la forme de p2b ; le total du brassin et le montant de l'année sont des blocs hachurés à la taille du chiffre (le « — » reste, invisible, pour la lecture) ; « litres à noter » est une pastille hachurée en pointillé. Rien n'est 0 ni inventé. `impot-apres-haut.png` (LOT-1) : inchangé, 3,80 CHF.
Tests : bloc 8 (2) ; `impotBiereSheet` (19) inchangé et vert (« — » et « litres à noter » gardés dans le texte).

## 9. Client doublé d'Opérations — FAIT
Source : `src/ui/finance/TransactionRow.tsx` ligne 46 (`const tiers = transactionVendor(transaction)` écrivait le client après un titre qui le contient). Corrigé par `tiersAAfficher(description, tiers)` (helper de f2, déjà testé). Le nom accessible du bouton ne répète plus le client non plus. Un tiers absent du titre s'écrit toujours (« Levure US05 · Comptoir du brasseur »).
Après (`captures/operations-apres-haut.png`, ouverte) : « Vente 10 × Bière · 75 cl — / Restaurant du Lac », une fois. Autres lieux où description et tiers s'écrivent côte à côte : `TransactionDetails.tsx` écrit seulement le tiers (pas de double), `Lignes.tsx` seulement le tiers.
Tests : bloc 9 (2).

## Contrôles
- `npx vitest run` (f3, impotBiere×3, brewBudgetSheet, coutBrassinCorrections, f2ReelCout, f2ReelOperations, coutBrassinFlux, tests d'opérations) : 14 fichiers, 135 tests verts (`voies/f3/tests.txt`).
- `npx tsc --noEmit` hors firebase-admin et react-zoom-pan-pinch : aucune erreur.
- `npx vite build` : vert.
- Essais : un par correction ; le test d'espacement des sources de f2 a demandé deux ajustements du code (clamp du bord).

## Doutes et limites
- Jeu clair, 390 seulement ; le thème cave et le 1280 non revus (le bloc hachuré du litre a une règle cave écrite mais non vue).
- Le pied de la feuille « Coût du brassin » (« Pour reproduire ce brassin », « Ce brassin a déjà été produit… », « Prévoir attend : … ») vient du parent (`BrewBudgetSheet`, hors Possède) : en texte, pas en forme c3a.
- Impôt : 3,80 CHF sur LOT-1 vient de la visée recette (dite « visée recette », règle hachurée) ; c'est la forme de p2b avec « exemple » remplacé, pas un chiffre vérifié.
- Sources hachurées : « À payer ≥ 2,40 » sur LOT-2 est hachurée bien que partielle connue (aucun flux connu) : lecture « au moins ».

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
