OK — 2 problèmes, 0 bloquant (les 2 bloquants et le non bloquant du VERDICT-EN-LIGNE-2 sont corrigés en ligne ; les 5 du premier jeu n'ont pas reculé ; « Confirmer » jamais touché, tout fermé par × › Abandonner)

Version : 2e12f716 (`claude/refonte-houblons-v4`, `voies/s1/RESULTAT.md` « stock tenu par la dépense »), bundle servi `index-DzYhWcgL.js`
(le verdict 2 jugeait `index-BHx7Y8KF.js`), https://brasserie-l-affinee.web.app, 390 tactile, clair, compte connecté, 10.11.
Cinq passages, script `critique/en-ligne/jouer4.mjs` (repris de `jouer2.mjs` et `jouer3.mjs`) : BAUHAUS tachée a et b (même photo, lecture servie
du cache en 1 à 3 s : 29 lignes, tout en Rénovation), BAUHAUS tachée c (même image, 8 octets ajoutés : lecture neuve en 29 s, 28 lignes, 13 noms
corrigés), Sun Store 2 a et b (cache : 5 lignes). 100 captures dans `critique/en-ligne-3/`, assemblées en 25 planches `planches/p01` à `p25`
(`en-ligne/planches3.mjs`), toutes ouvertes (L12). Sorties : `sortie-*.txt`. Aucune erreur de page, aucun mot brut (« other », « TaxeSansTVA »).

## Les quatre points demandés

| point | vu | verdict |
|---|---|---|
| Aucun stock ni icône sur une dépense hors brassage | BAUHAUS a, b, c : 0 icône sur 29, 29 et 28 lignes (chaque ligne : extrait + supprimer seulement) ; fiches « article — · hors stock ». Sun Store 2 (catégorie « Autre ») : 0 icône sur 5, les deux vaccins compris (le verdict 2 en avait sur les vaccins). CHANTLLES NO L5100 rangé en Rénovation, plus en Levures | **tient** |
| Quantité vidée garde le segment d'unité ; unité touchée remet 1 | VITRIFIC a, b, c (`14`, `15`) : segment « pièce · L » reste, « +1 +2 +3 +5 +10 » ; « pièce » → « 1 pièce × 86,85 = 86,85 », tuiles « 1* 2 3 5 10 », aucun champ focalisé. Vaxigrip (`b-09`, `b-10`) : idem, « 1 pièce × 26,68 ». H21 (`b-14`, `b-15`) : « 1 pièce × 50,00 » | **tient** (voir problème 1 pour l'autre chemin) |
| « L » touché après la tuile 5 garde 5 | BROSSE a, b, c : « 5 pièces × 1,10 » → « 5 L × 1,10 = 5,50 » ; VITRIFIC : « 5 L × 17,37 = 86,85 » ; PINCEAU : « 5 L × 0,68 = 3,40 » ; Vaxigrip : « 5 L × 5,336 » ; H21 : « 5 L × 10,00 ». Tuiles « 1 · 5* · 10 · 20 L » | **tient** |
| Les 5 du premier jeu | Qté × prix « 29/29 justes », « 28/28 justes », « 2/2 · 1 sans prix unitaire » ; « Rabais −0,68 / −1,90 », fiche « imprimé « NoVatTax - 0% » », recherche « rabais » 2/5 ; BAUHAUS « 1 pièce × … » sur chaque ligne ; « peinture » 5/29 et 5/28 (« Rénovation 5/29 · Peinture et sols 5/5 · 118,85 ») ; barre « nature : lectures divergentes (autre /… » | **aucun recul** |

## Sa question : « combien et quels problèmes il y a ? »

1. **Même geste, deux rendus.** Quantité vidée sur BROSSE LATTOB GD et PINCEAU PLAT (`a-09`, `a-19`, `c-09`, `c-19`) : champ rouge, « ? »
   rouge dans la ligne, bloc « unité à remplir » avec cinq cases rouges (pièce · g · Kg · L · sachet, « 5,50 l'une · le g … »), bande
   « 28 pièces + ? », badge « 1 à remplir » dans le bloc. Même geste sur VITRIFIC, Vaxigrip et H21 (`a-14`, `c-14`, `b-09`, `b-14`) : segment
   « pièce · L » gris gardé, rien de rouge, la ligne sort du compte en silence (« 27 pièces + 5 L », « 28/28 · 1 sans prix unitaire »), aucun
   « à remplir ». Les deux chemins remettent 1 sans clavier, donc rien de bloquant, mais la différence tient à une donnée que le brasseur ne
   voit pas (unité lue ou déduite). En brasseur : « pourquoi là c'est rouge avec cinq cases et là rien ? ». Attendu : un seul rendu à quantité
   vide, et une quantité vide comptée « à remplir » sur toute ligne.
2. **Prix unitaire à trois décimales après une tuile.** Vaxigrip, tuile 5 : « 5 pièces × 5,336 = 26,68 » dans la ligne, la fiche et la bande
   (`b-11`, `b-12`). BAUHAUS tombe juste par chance (86,85 / 5 = 17,37 ; 5,50 / 5 = 1,10 ; 3,40 / 5 = 0,68). En brasseur : « 5,336 ? il n'y a pas
   de millièmes en CHF ». Attendu : deux décimales (« ≈ 5,34 » ou prix unitaire vide quand la division ne tombe pas au centime), le montant
   imprimé gardé.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus a/b 01 à 05 | clair | 390 | lecture du cache : 29 lignes, « 74,45 CHF », « 29/29 justes », « 3/3 · 43 désaccords », « 12 à contrôler », 0 icône | — | — |
| bauhaus a/b 06, 07 | clair | 390 | « peinture » 5/29 ; « Voir le désaccord » → BAUHAUS BUT NAAHU | — (doute) | — |
| bauhaus a/b 08 à 12 | clair | 390 | BROSSE : repos, vidée (cases rouges), pièce → 1 + tuiles, tuile 5, L → 5 gardé | 1 | — |
| bauhaus a/b 13 à 17 | clair | 390 | VITRIFIC : repos, vidée (segment gardé), pièce → 1, tuile 5 (17,37), L → 5 gardé | 1 | — |
| bauhaus a/b 18 à 22 | clair | 390 | PINCEAU : même suite que BROSSE (0,68) | 1 | — |
| bauhaus a/b 23, 24 | clair | 390 | × › Abandonner, retour Finances, rien d'enregistré | — | — |
| bauhaus c 01 à 05 | clair | 390 | lecture neuve : « BAUHAUS Fachcentren AG », 28 lignes, « 83,35 CHF », « 28/28 justes », « 23 désaccords », « 2 à contrôler · 28 corrigées », noms barrés, barre « nom corrigé · 1/13 », 0 icône | — (doutes) | — |
| bauhaus c 06 à 22 | clair | 390 | « peinture » 5/28 ; désaccord → BROSSE LATTQB GD ; BROSSE, VITRIFIC, PINCEAU : mêmes suites, mêmes résultats | 1 | — |
| bauhaus c 23, 24 | clair | 390 | × › Abandonner, retour Finances | — | — |
| sunstore a 01 à 07, b 01 à 07 | clair | 390 | 5 lignes, « 2/2 · 1 sans prix unitaire », « Rabais », « rabais » 2/5, fiche rabais ; 0 icône, « SUN STORE · Autre » | — | — |
| sunstore b 08 à 12 | clair | 390 | Vaxigrip : repos, vidée (segment), pièce → 1, tuile 5 (5,336), L → 5 gardé | 1, 2 | — |
| sunstore b 13 à 17 | clair | 390 | H21 (Service, « 2 × — 50,00 ») : vidée, pièce → « 1 pièce × 50,00 », tuile 5 (10,00), L → 5 gardé ; « 3/3 justes » | 1 | — |
| sunstore a 08, 09, b 18, 19 | clair | 390 | × › Abandonner, retour Finances | — | — |

## Doutes (non comptés)
- La lecture « Levures 1 · Consommables 4 » du verdict 2 n'est pas revenue : la même photo est servie du cache (même lecture 29 lignes, 1 à 3 s), et
  l'image modifiée donne une 3e lecture (28 lignes, tout en Rénovation). La règle « aucun stock hors brassage, quelle que soit la famille lue » est
  donc jugée sur trois lectures sans Levures, et sur le code de s1 (`stockAction: 'none'` sur toute ligne d'une dépense renovation / chargesFixes /
  divers, test CHANTILLES en Levures). Pas de contre-épreuve en ligne avec une ligne rangée en Levures.
- Lecture c : « 28 corrigées » dans le bloc, « nom corrigé · 1/13 » dans la barre : deux compteurs, pas contradictoires, mais où sont les 15 autres ?
  Les prix permutent d'une lecture à l'autre (JEU DE CLES ALLEN 14,90 → 8,90, CRATTE-VTTRES 8,90 → 14,90, SERRE-JOINT 14,90 → 2,45) ; la vue est
  fidèle à chaque lecture, la lecture bouge.
- « Voir le désaccord » ouvre une fiche qui ne dit pas en quoi les lectures divergent (déjà noté aux verdicts précédents ; en c le nom barré se voit).
- Un service (H21 vaccination) propose « pièce · L » : le segment est générique, personne ne touchera L sur un vaccin.
- En-tête de bande : « 28 pièces + 5 L » devient « 10 L + 27 pièces » (ordre par quantité) ; « Peinture et s… » tronqué à 390 quand le compte s'allonge.
- Cave et 1280 non joués (coût Gemini ; la mission demandait 390 tactile).

LEÇON PROPOSÉE : aucune (celle du verdict 2 reste : une règle qui dépend d'une famille rendue par l'IA se juge sur deux lectures ; ici le cache serveur
rend la même lecture pour la même photo, il faut changer l'image d'un octet pour obtenir une lecture neuve).
