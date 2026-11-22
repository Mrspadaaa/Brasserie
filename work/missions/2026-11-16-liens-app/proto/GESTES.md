# Gestes des 8 premiers liens (prototype du 16.11)

Prototype : `proto/proto.html`, autonome, 390 tactile, thèmes clair et cave (`?theme=cave`), un lien par `?lien=1…8`.
Données simulées, marquées « exemple » dans le bandeau. Le bandeau du haut appartient au prototype, pas à l'app :
‹ › pour changer de lien, des points qui se remplissent à chaque toucher, puis ✓ quand le parcours est fini.
Rejeu : `node work/missions/2026-11-16-liens-app/proto/capt.mjs [1,…,8]`. Il joue de vrais touchers (`page.tap` sur `[data-g]`)
et mesure chaque état. Sorties : `proto/mesure.txt`, puis `proto/cap/<n>-<lien>-<pas>-<état>-390.png` (et `-cave`), et
une planche par lien, `cap/planche-<n>.png`.

But : 2 touchers au plus, aucune frappe. Ne comptent ni « voir là-bas » (pastille du bandeau) ni le retour : ils
servent seulement à montrer l'effet, et le geste est déjà fini.

| # | Lien | Départ | Geste | Touchers | Frappes | Effet là-bas | Retour |
|---|---|---|---|---|---|---|---|
| 1 | L5 jalons | Calendrier, barre Blonde | la barre, puis › (ou un seul glisser d'une semaine) | 2 (1 glisser) | 0 | jalons brassage, dry-hop, fûts décalés ensemble ; fiche Blonde : 23.11 barré, 30.11 | ‹ Calendrier : barre décalée, l'ancienne place en pointillé |
| 2 | L1 + idée | Calendrier, + de la case Idées × S48 | +, puis une puce (micro pour dicter) | 2 | 0 | Carnet : « Saison au miel », 23.11, en tête | ‹ Calendrier : l'idée sur la case |
| 3 | L11 scan | Finances, Scanner une facture | Scanner, puis Enregistrer (le lien n'ajoute rien) | 2 | 0 | Carnet, Besoins : Joint DN50 et Star San cochés « soldé » | ‹ Finances : caisse 4 137 |
| 4 | L3+L4 brassin | Calendrier, + de la case Brassins × S51 | + seul (dernière recette : Porter) | 1 | 0 | Courses : 3 manques « pour Porter 14.12 », « commander avant 7.12 », le reste en stock ; au calendrier, « commander » en pointillé et libre S50-S51 baissé | ‹ Calendrier |
| 5 | L12 échéance | Calendrier, Brewshop 412 (25.11) | l'échéance, puis Payé | 2 | 0 | Finances : caisse 3 768, Brewshop −412 ✓ ; libre S47 → 3620 | ‹ Calendrier : échéance cochée |
| 6 | L7+L22 fût livré | Stocks › Fûts, camion de F-12 | camion, puis Livré (client et vente déjà remplis) | 2 | 0 | Client Café du Pont : vente +140 F-12, 2 fûts chez lui ; F-12 « chez clients », reprise 14.12 | ‹ Stocks |
| 7 | L6 fûts pleins | Fiche Ambrée, Conditionner | Conditionner, puis Valider (6 fûts propres cochés, 120 L = 6 × 20 L) | 2 | 0 | Stocks › Fûts : 6 pleins Ambrée F-03 → F-08 | ‹ Ambrée : Fûts 16.11 ✓ |
| 8 | L9 cascade | Stocks › Fûts, F-09 à laver | Lavé | 1 | 0 | bandeau « −50 ml Star San, −20 g soude », Annuler ; Articles : Star San 900 ml | ‹ Fûts : F-09 propre |

Annuler (dans chaque bandeau) remet le lien à son départ en 1 toucher. × ferme une feuille et rend le toucher.
Changer la recette (L3) ou le client (L7) devrait coûter 1 toucher de plus, toujours sans clavier. Ces deux gestes
ne sont pas joués dans le prototype, pas plus que la dictée de L1 (le micro est dessiné, mais inerte).

## Mesures (capt.mjs, 390 × 844, dans les états joués)
- Mots visibles à l'écran de l'app (bandeau du prototype exclu, texte masqué par une feuille exclu) : 40 au plus dans
  tous les états, au repos comme pendant le geste. Avec le bandeau : 40 au plus au départ ; jusqu’à 46 pendant un geste,
  quand une feuille ou un bandeau s'ouvre. Détail par état : `mesure.txt`.
- Plus petite police visible : 14 px dans tous les états. Aucun texte coupé, aucun débordement horizontal. Aucune
  erreur de page.
