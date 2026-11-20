OK — f2 : 15 PCN corrigés (bfd8cfae8, 013bcdbca), 1 écarté, 1 ouvert ; carnets 662/662 verts

| id | verdict | commit | test | rouge→vert | écran touché |
|---|---|---|---|---|---|
| PCN-100 | corrige | bfd8cfae8 | tests/unit/carnetsTour3F2.test.tsx | oui | oui — bandeau « Rangé dans X, à l'instant · 2e sur 3 » |
| PCN-106 | corrige | bfd8cfae8 + 013bcdbca | carnetsTour3F2 + carnetsCritique4Decider (P14) | oui (tests-rouge.txt ; tests-rouge-compromis.txt) | oui — Comparer, compromis |
| PCN-109 | corrige | bfd8cfae8 | carnetsTour3F2 (109) + carnetsParcours D3 | oui | oui — carnet ouvert, Frigo envoyé |
| PCN-111 | ouvert | — | — | — | non — h05-9 « Cette semaine et après » mêle brassins, livraisons, factures et porte l'onglet Calendrier actif (refusé par D-92) ; MISSION port-carnet § Points ouverts 7 : port complet à trancher avec D-93. Données d'autres modules hors de UpgradeWorkspace. |
| PCN-115 | ecarte | — | — | — | non — « Photos · aucune » n'est montrée que juste après création (`neuf`, CarnetOuvert.tsx:216), exactement comme la base g5:v04-4 (Créer · après, ASSEMBLAGE § 3) ; masquée ailleurs. |
| PCN-118 | corrige | bfd8cfae8 | carnetsTour3F2 + Critique4/5/6Decider | oui | oui — Comparer, « Ce qui compte » |
| PCN-120 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — liste, « Coller un lien » |
| PCN-121 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — fil, ligne « va dans » (fondu) |
| PCN-124 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — Stocks › Matériel › Réalisés, vignette |
| PCN-133 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — puces proposées |
| PCN-136 | corrige | bfd8cfae8 | carnetsTour3F2 + Critique6Decider 15 + Critique8 n° 2 | oui | oui — Comparer, Choisir |
| PCN-151 | corrige | bfd8cfae8 | carnetsTour3F2 (151) | oui | oui — carnet ouvert, pastille « Réalisé le … » |
| PCN-154 | corrige | bfd8cfae8 | carnetsTour3F2 (154) | oui | oui — carnet ouvert, menu ··· |
| PCN-155 | corrige | bfd8cfae8 | carnetsTour3F2 + carnetsParcours D2 | oui | oui — pastille de statut |
| PCN-159 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — titre proposé (analyse locale) |
| PCN-164 | corrige | bfd8cfae8 | carnetsTour3F2 | oui | oui — Comparer, « Valeurs … » |
| PCN-167 | corrige | bfd8cfae8 | carnetsTour3F2 + carnetsSuppression + carnetsStore | oui | non (suppression : ses messages partent avec lui, même Annuler) |

## Tests
- Neuf `tests/unit/carnetsTour3F2.test.tsx` : rouge 18/18 (`tests-rouge.txt`), vert 18/18 (`tests-vert.txt`).
- Retouche du compromis (vision) : rouge 2/24 (`tests-rouge-compromis.txt`), puis vert.
- Final `npx vitest run tests/unit/carnets* tests/integration/carnets*` : 39 fichiers, 662 verts, 1 todo, 0 échec (`tests-final.txt`).
  Hors carnets : atelierNoterTarifs, equipmentProjects, upgradeSheetTe35, equipmentUpgrades, upgradeForecast : 81/81.
- `npx tsc --noEmit -p tsconfig.json` : 0 erreur.

## Les 11 échecs de régression (regression.txt), tranchés
1. carnetsParcours D2 (statut 'idea' au lieu de 'research') : pas un défaut de PCN-155. Les 6 liens vendeur-N.ch sont illisibles
   dans l'IA simulée (rien d'inventé), donc l'idée reste Idée. Lu plus tard, un lien repasse par `ecrireIA` → `remplacerRangement` →
   `rangerDans` → `poser` → `statutApres` : le statut suit la lecture. Le test le prouve maintenant : 6 illisibles → 'idea', puis un
   lien lisible (`exemple.invalid/zz-test-isobarique-7-becs`) → 'research'.
2. carnetsParcours D3 (pastille « À venir · … », R47) : décision du pilote appliquée. La pastille R47 reste ; la redite retirée est
   la ligne « Dans À venir depuis le … » sous le choix (`sortieEnPastille`, CarnetOuvert). L'aperçu reste à un toucher (bouton
   « Ouvrir dans À venir »). Le test 109 de carnetsTour3F2 suit : 1 pastille, pas de « Dans À venir depuis ».
3. Critique4/5/6Decider « Ce qui compte » (3 tests, dont le n° 16 non lu avant) : attendus mis à jour. Ils encodaient le défaut
   PCN-118 (un seul critère cité). Nouvel attendu : « Ce qui compte tient 80 °C · proposé par l'IA, puis le débit · proposé par l'IA ».
   Le n° 16, sa phrase sans mention : « Ce qui compte tient 80 °C, puis le débit · proposé par l'IA ».
4. Critique4Decider P14 compromis (2 tests) : attendus mis à jour. Ils encodaient le défaut PCN-106 (la 2e proposée alors qu'elle est
   sous le minimum de 1 500 m³/h). Après vision : « la 1re, la seule à tenir 80 °C et votre minimum, pour 1 150 CHF de plus que la
   2e ». Sans « et votre minimum », la phrase contredisait le tableau, où la 2e tient aussi 80 °C (correctif 013bcdbca, rouge puis vert).
5. Critique6Decider n° 15 et Critique8 n° 2 (non lu avant) : attendus mis à jour. Ils encodaient le défaut PCN-136, désormais
   « sous votre minimum de 1 500 m³/h » et « … de 1 200 m³/h ».
6. carnetsStore (non lu avant) : l'attendu encodait le défaut PCN-167. Le message ZZ-MSG-E1 ne visait que l'évier : il est
   maintenant retiré avec lui (`retires` = [évier, message], `poses` = []).
7. carnetsSuppression : l'attendu encodait le défaut PCN-167. Les messages B1 à B3, qui ne visaient que l'Embouteillage, partent avec
   lui ; le fil est vide ; Annuler (inverse) rend tout, l'assertion est gardée.
Aucune régression réelle parmi les 11.

## Commits (port-carnet, branche claude/port-carnet-1711, par chemins, `git show --stat` vérifié)
- bfd8cfae8 : 20 fichiers, tous dans le périmètre (src/domain/carnets/*, src/ui/carnets/*, UpgradeWorkspace.tsx, tests carnets*).
- 013bcdbca : comparer.ts et carnetsCritique4Decider.test.tsx.

## Captures (banc `?preview=carnets`, port-carnet, Vite local :3163, arrêté ensuite ; 390 tactile et 1280, clair et sombre ; ouvertes)
Dossier `voies/f2/captures/` (script `voies/f2/captures.mjs`, journal `captures/journal.txt`) :
- `liste-*` : liste (PCN-120, 121).
- `frigo-*` (`&lien-retient=a-venir`) : une seule pastille « À venir · ZZ TEST — Frigo de garde pour fûts », plus de « Dans À venir
  depuis » sous le choix (PCN-109) ; statut « Choisi le 10 oct. ».
- `realise-*` (`&lien-retient=realise`) : pastille « Réalisé le 16 nov. » (PCN-151), menu ··· dans la tête (PCN-154).
- `realises-*` (`&realise=1`) : Réalisés avec vignette (PCN-124, 1 vignette mesurée).
- `comparer-*` (`&ouvrir=ventilation`, puis Comparer) : « Ce qui compte tient 80 °C · proposé par l'IA, puis le débit · proposé
  par l'IA » (PCN-118) ; « sous votre minimum de 1 500 m³/h » (PCN-136) ; compromis corrigé ; « Valeurs annoncées par les vendeurs »
  (PCN-164).
Journal : les 4 états vérifiés en VU ou BIEN-ABSENT dans les 4 combinaisons, aucune erreur de page.

Non capturés (non atteints par une adresse du banc) : bandeau « rangé ailleurs » (PCN-100), puces proposées (PCN-133), titre proposé
(PCN-159). Pour la vision du pilote : depuis une idée ouverte, envoyer une phrase qui se range dans une autre idée.

Prédiction : il voit sur le Frigo une seule mention d'À venir, et le compromis ne contredit plus le tableau. Point faible : la 2e
« sous votre minimum » reste écrite en petit rouge à 390.

DÉCISION À PRENDRE : aucune (PCN-111 reste ouvert, avec D-93).
CONNAISSANCE : un lien illisible ne fait plus passer une idée en « À comparer » ; le statut se recalcule à chaque lecture
(remplacerRangement → poser).
LEÇON PROPOSÉE : un test dont l'attendu fige un défaut corrigé se met à jour avec l'id du défaut dans son nom ou son commentaire,
pour qu'une relecture ne le prenne pas pour une régression.
