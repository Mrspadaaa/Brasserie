REPRISE — 11 corrigés, 1 present en partie (n° 13 avec bulle G8), 1 non rejoué (n° 12, banc) ; 3 problèmes, 1 bloquant ; plafond 150 k atteint

Version : port-carnet HEAD f568f3f00 (contient 1f243127a, 7160b51e8, 29543e2a1, 67e82dbbf ; aucun fichier carnets modifié hors commit).
Banc `?preview=carnets`, Vite :5190, IA simulée. Scripts : `rejeu.mjs`, `outil.mjs` (port 5190), `planche.mjs`. Journaux : `captures/journal-*.txt`.
Captures ouvertes en planches : `captures/pl-a` à `pl-d` (390), `pl-f`, `pl-g` (1280).

| n° | verdict | observé (≤ 25 mots) | capture | taille/thème |
|---|---|---|---|---|
| 1 | corrige | cadre « va dans ZZ TEST — Frigo… · Notes : un frigo de garde pour 20 fûts », puce Note ; après : « votre message : « un frigo… » », sans « autre projet » | n1-390-sombre-a-frappe, -b-apres ; n1-1280-clair-a-frappe | 390 sombre, 1280 clair (390 clair : frappe ratée par le banc) |
| 2 | corrige | bulle G8 sur 3 lignes, entière : « « pas trop de bruit » tranche entre Hotte inox + extracteur et Extracteur mural seul » | g8-390-clair-haut, g8-390-sombre-haut | 390 clair, sombre |
| 3 | corrige (avec défaut, problème 2) | « ✻ Déjà un carnet proche : … · → Ouvrir ce carnet » ; le toucher ouvre Ventilation, champ vidé | n3-390-clair-a, n3-390-sombre-a, n3-390-clair-b-ouvert | 390 clair, sombre ; 1280 clair (journal) |
| 4 | corrige | page en haut, champ touché : titre entier à 122 px sous la barre ; en bas : « il faudrait au moins 1 500 m³/h » au-dessus de la bulle | g8-390-clair-haut, g8-390-clair-bas, g8-1280-sombre-haut | 390, 1280 |
| 5 | corrige | Moulin : « Façons » sans compte, une carte « 2 cylindres » ; citation « votre phrase en titre » gardée (écartée, greffe5) | moulin-390-clair, moulin-390-sombre | 390 clair, sombre |
| 6 | corrige | « Ce qui compte tient 80 °C, puis le débit · proposé par l'IA » une fois ; « à égalité, le moins cher » | comparer-390-*, comparer-1280-sombre | 390, 1280 |
| 7 | corrige | « 1 200 / < min. 1 500 » sur une ligne ; 3 colonnes entières à 390, « → 2 de plus » ; 5 colonnes à 1280 | comparer-390-clair, -sombre, comparer-1280-sombre | 390, 1280 |
| 8 | corrige | carte pointillée : « Critères : tient 80 °C, puis le débit, proposé par l'IA » ; Frigo : « tenir 2 °C stable en été, puis passe la porte… » | choisir-390-clair-a, choisir-1280-sombre-a ; journal frigo | 390, 1280 |
| 9 | corrige (capture à refaire) | Réalisés : « 11 700 CHF » une fois, « Payé en entier, au montant prévu » ; Embouteillage : aucun nom coupé au DOM, capture pleine page vide (banc) | realises-390-clair ; realise-390-sombre | 390 clair ; sombre à refaire |
| 10 | corrige | Pompe : plus de « moins bien que la 1re sur tout » ; Comparer : débit 25 / 40 sans jugement | pompe-390-clair, pompe-390-clair-comparer | 390 clair, sombre |
| 11 | corrige | « votre lien : « https://exemple.invalid/pompe-magnetique » » | pompe-390-clair, pompe-390-sombre | 390 clair, sombre |
| 12 | non rejoué | le banc a touché « Coller un lien » de l'Évier, pas la puce « Coller : exemple.invalid/hotte-… » | coller-390-clair-b | à refaire |
| 13 | corrige liste / present avec G8 | liste : « Coller : exemple.invalid/hotte-… » ; Ventilation avec bulle G8 : « Coller : e… », une lettre (problème 1) | coller-390-clair-a, g8coller-390-clair | 390 clair |

## Problèmes (combien et quels ?) — 3, dont 1 bloquant
1. **Bloquant, illisible** — Ventilation, bulle G8 et lien au presse-papier, 390 : puce « Coller : e… » (une lettre) et la bulle écrasée en colonne étroite sur 7 lignes. (g8coller-390-clair)
2. Liste, « Ventilation de la salle » tapé : le cadre dit encore « Nouveau carnet · Idée · Ventilation de la salle ↓ arrive ici » au-dessus de « Ouvrir ce carnet » ; Ajouter créerait un doublon. (n3-390-clair-a, n3-390-sombre-a)
3. Cadre d'arrivée à 390 : « Va dans [ZZ TEST — Frigo de garde…] » nom coupé, et « Façon » coupée au bord droit de la rangée. (n1-390-sombre-a-frappe)

Doutes, non comptés : Comparer 390, un conteneur de page de 433 px pour 366 (défilement latéral de toute la page possible ? à vérifier au doigt) ; pastille « exemple » sous la puce « Comparer sur le débit (L/min) » (Pompe) : mot sans sens pour lui ; Réalisés « Payé · facture du 16 nov. » puis « Payé en entier » (redite légère) ; « 1er sur 2 ex aequo » (déjà noté v4).

## REPRISE (agent neuf, Opus ou Haiku pour le banc)
Banc prêt : `node rejeu.mjs <etats> <tailles> <themes>` (serveur : `npx vite --port 5190 --strictPort` dans port-carnet, arrêté à la fin).
- n° 12 : dans `coller`, toucher le bouton dont le texte commence par « Coller : » (pas « Coller un lien »), puis Ajouter ; attendu bandeau « Rangé dans ZZ TEST — Ventilation… », aucun carnet « exemple.invalid ». 390 et 1280 clair.
- n° 9 : `realise` sans `plein` (390 sombre) ; n° 1 à 390 clair et n° 3 à 1280 sombre : frappe ratée par le banc, rejouer.
- Pompe 1280 : le 2e lien n'a pas été rangé (1 article) ; rejouer.
- Doute 1 : lire `overflowX` du conteneur de 433 px dans Comparer 390 ; si `auto`/`scroll`, c'est un problème (page qui glisse).
- Question ouverte non faite sur : liste, À venir, Réalisés, carnet ouvert en entier (captures `ens-*` prises, non ouvertes).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un banc qui touche un bouton par sous-chaîne (« Coller ») doit viser le texte exact ou un préfixe : « Coller un lien » d'une autre carte a pris la place de la puce (n° 12 non rejoué).

Serveur arrêté, port 5190 libre (vérifié).

## Suite (reprise, Opus) — port-carnet HEAD 25aefc19f, Vite :5192 (arrêté, port libre vérifié)
Scripts : `rejeu2.mjs`, `rejeu3.mjs` (`PORT_BANC=5192`, `outil.mjs` lit ce port). Journaux : `captures/journal-rejeu2.txt`, `-rejeu3.txt`.
Planches ouvertes : `captures/pl-ens-*` (ensemble), `pl-r2-*`, `pl-r3`. Aucun fichier de code de l'app modifié.

| n° | verdict | observé (≤ 25 mots) | capture | taille/thème |
|---|---|---|---|---|
| 12 | corrige | puce « Coller : exemple.invalid/hotte-… » → champ rempli, « va dans ZZ TEST — Ventilation… » ; Ajouter → « Rangé dans ZZ TEST — Ventilation… », Carnets reste 6 | n12-390-clair-a, -b, -c-apres ; n12m-1280-clair-b, -c-apres | 390 tactile, 1280 souris (clair) |
| 9 | corrige | Embouteillage réalisé : « Réalisé le 16 nov. », « 11 700 » une fois au tableau, noms à la ligne, aucun coupé | n9-390-sombre-realise | 390 sombre |
| 1 | corrige | après Ajouter : « Rangé dans ZZ TEST — Frigo… · votre message : « un frigo de garde pour 20 fûts » », sans « autre projet » | n1b-390-clair-a-frappe, -b-apres | 390 clair |
| 3 | corrige (problème 2 toujours là) | « ✻ Déjà un carnet proche … → Ouvrir ce carnet » ouvre Ventilation | n3b-1280-sombre-a, -b-ouvert | 1280 sombre |
| Pompe | corrige (n° 10, 11) | 2 articles rangés ; « votre lien : « …pompe-magnetique » » ; Comparer : débit 25 / 40 sans jugement | pompe2-1280-clair, -comparer | 1280 clair |

Banc, non comptés : n° 12 à 1280 par `tap()` sans écran tactile n'émet pas de clic (la puce disparaît) ; à la souris réelle, il marche. `ens-ventil-390-*` vide : premier chargement à froid ; mesuré ensuite 744 ms (390) et 621 ms (1280) avant le contenu.

## Problèmes (suite) — 4 neufs, aucun bloquant (les 3 ci-dessus non recomptés)
4. Lien collé depuis la liste, bandeau de rangement : « votre message : « https://exemple.invalid/hotte-140 » » (la Pompe dit « votre lien ») et « 1er sur 5 · tient 80 °C oui » (« oui » isolé, à 1280 seul sur sa ligne). (n12-390-clair-c-apres, n12m-1280-clair-c-apres)
5. À venir : dans l'onglet « À venir 1 », une section « Choisis, pas encore dans À venir · 2 » — le titre contredit l'onglet qui la montre. (ens-avenir-390-clair, ens-avenir-1280-clair)
6. Carnet ouvert, autre projet tapé (390) : la destination et le genre sont dits deux fois — cadre « va dans ZZ TEST — Frigo… · Notes : … » et rangée « Va dans [Frigo…] · en Ce qui compte / Note ». Distinct du problème 3 (troncature). (n1b-390-clair-a-frappe)
7. Ventilation, façon écartée « Ventilateur de plafond » : « brasse la buée sans la sortir » deux fois, pastille de la façon et ligne « écarté · … » de son seul article. (ens2-ventil-390-clair-bas)

Doutes, non comptés : « ✻ la page parle de « hotte » : comme Ventilation de la salle de brassage » (« comme » peu clair) ; carnet réalisé ouvert sous l'onglet « Carnets » avec le champ « Ajouter à ZZ TEST… » actif (n9) ; « Archives › » sur un Réalisés vide ; liste, « fournisseurs et prix : exemple » = domaine des fixtures, normal en vrai.
Rien à redire vu : liste 390/1280 (haut et bas, En veille), Réalisés vide (texte clair), carnet Ventilation entier 390/1280, deux thèmes.
